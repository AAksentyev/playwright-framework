import path from 'path';
import { FullResult, Reporter } from '@playwright/test/reporter';
import { Logger } from '@utils/logger.ts';
import { HEATMAP_CONFIG } from '@configs/reports/reporters.config.ts';
import { BoundingBox, HeatmapPoints, InteractionLog, ScreenshotTracker } from './heatmap.t.ts';
import { FSHelpers } from '@utils/fs/fsHelpers.ts';

interface HeatmapReporterOptions {
    /** Toggle reporting */
    enabled?: boolean;
}

/**
 * Playwright reporter for page/component interaction heatmaps
 *
 * The reporter is toggled on/off using `process.env.RUN_HEATMAP_REPORT`
 */
export default class HeatmapReporter implements Reporter {
    private enabled: boolean;

    constructor(options?: HeatmapReporterOptions) {
        this.enabled = options?.enabled ?? false;
        if ( this.enabled ){
            FSHelpers.createPathSafe(HEATMAP_CONFIG.REPORT_OUTPUT_PATH);
        }
        else {
            /* eslint-disable prettier/prettier */
            Logger.debug('------------------------------------------------------------------------------------');
            Logger.debug('------- Interaction Heatmap Report Toggled off. No Report will be generated --------');
            Logger.debug('--- To enabled the network monitoring report, set process.env.RUN_HEATMAP_REPORT ---');
            Logger.debug('------------------------------------------------------------------------------------');
            Logger.debug(' ');
            /* eslint-enable prettier/prettier */
        }
    }

    /**
     * Called after all workers/tests finish
     * Aggregates all worker files into a single report
     */
    async onEnd(result: FullResult) {
        if (!this.enabled) return;

        Logger.info('[HeatmapReporter] All tests finished. Aggregating heatmap data...');

        // aggregate all of the page/component interactions from different workers into a single file
        this.aggregateInteractions();
        this.aggregateScreenshots();

        // generate the reports
        await this.generateHeatmaps();

        Logger.success('[HeatmapReporter] Heatmap generation complete!');
    }

    /**
     * Genenerates individual html reports for each tracked POM 
     * and finally generates the main index.html file to view all of the reports from one file
     */
    private async generateHeatmaps() {
        Logger.info('[HeatmapReporter] Generating heatmap reports ...');

        let pagesData: {name: string, path:string}[] = [];

        try {
            // read and parse the merged interactions file
            const aggReport = JSON.parse(
                FSHelpers.readFileSafe(
                    path.join(
                        HEATMAP_CONFIG.REPORT_OUTPUT_PATH,
                        HEATMAP_CONFIG.INTERACTIONS_FILENAME
                    )
                )
            ) as InteractionLog[];

            // read and parse the merged screenshot tracker file that contains our offsets
            const aggScreenshots = JSON.parse(
                FSHelpers.readFileSafe(
                    path.join(
                        HEATMAP_CONFIG.REPORT_OUTPUT_PATH,
                        HEATMAP_CONFIG.SCREENSHOTS_FILENAME
                    )
                )
            ) as Record<string, ScreenshotTracker>;

            // group our data by the object name
            const grouped = this.groupLogsBy(aggReport, 'pageObjectName');

            // loop over each page object for which we have data for
            for (const [pageObjectName, logs] of grouped) {

                Logger.debug(`[HeatmapReporter] Generating heatmap for ${pageObjectName} ...`);
                // create the folder for the page we don't have it yet
                const dir = path.join(HEATMAP_CONFIG.REPORT_OUTPUT_PATH, pageObjectName);

                // create folder if it doesn't exist
                FSHelpers.createPathSafe(dir);

                // get a summary of events, such as counts
                const summary = this.summarizeEvents(logs)

                /**
                 * get the x/y offset for the screenshot
                 * this is necessary when it is not a full-page screenshot but rather
                 * a component-specific screenshot.
                 *
                 * The locator's bounding box is based on its location on the page,
                 * so the heatmap point needs to be moved relative to the
                 * __component location__ on the page
                 */
                const offsets = aggScreenshots[pageObjectName]?.boundingBox;

                // process the data points and create our final heatmap object
                const points: HeatmapPoints[] = summary.map((log) => ({
                    x: Math.round(log.boundingBox.x - offsets!.x + log.boundingBox.width / 2),
                    y: Math.round(log.boundingBox.y - offsets!.y + log.boundingBox.height / 2),
                    counts: log.counts,
                    value: log.value,
                }));

                /** Generate and save the html page for the individual POM */
                const template = this.loadTemplate(HEATMAP_CONFIG.TEMPLATE_PATH);

                const html = this.renderTemplate(template, {
                    points,
                    maxPoints: HEATMAP_CONFIG.MAX_POINTS,
                    blur: HEATMAP_CONFIG.BLUR,
                    radius: HEATMAP_CONFIG.RADIUS,
                    minOpacity: HEATMAP_CONFIG.MIN_OPACITY,
                    maxOpacity: HEATMAP_CONFIG.MAX_OPACITY,
                });
                
                FSHelpers.writeTextFileSafe(path.join(dir, HEATMAP_CONFIG.REPORT_NAME), html, 'text');
                Logger.debug('[HeatmapReporter] Generation complete.');

                // push our page data to the array for index.html navigation buildout
                pagesData.push({name: pageObjectName, path: `./${pageObjectName}/${HEATMAP_CONFIG.REPORT_NAME}`});
            }

            /** Generate the final index.html file with navigation that will point to the individual generated pages */
            const template = FSHelpers.readFileSafe(HEATMAP_CONFIG.DASHBOARD_TEMPLATE_PATH);
            const html = template.replace('{{pagesData}}', JSON.stringify(pagesData));
            FSHelpers.writeTextFileSafe(path.join(HEATMAP_CONFIG.REPORT_OUTPUT_PATH, 'index.html'), html, 'text');

        } catch (e: any) {
            Logger.error(`Heatmap report generation failed: ${e.message}`);
            throw e;
        }

        Logger.success(
            `📊 All Heatmap reports generated. Access them in ${HEATMAP_CONFIG.REPORT_OUTPUT_PATH} ...`
        );
        Logger.info(' '); // flush
    }

    /**
     * Aggregate all of our worker data for the interactions
     * into a single file
     * @returns
     */
    private aggregateInteractions() {
        if (!FSHelpers.pathExists(HEATMAP_CONFIG.REPORT_OUTPUT_PATH)) return;

        Logger.info('... Aggregating interaction data...');
        // collect worker files
        const interactionFiles = FSHelpers.readDirSafe(HEATMAP_CONFIG.REPORT_OUTPUT_PATH).filter(
            (f) => f.startsWith('worker-') && f.endsWith('-interactions.json')
        );

        // no files? return
        if (!interactionFiles.length) return;

        const aggregatedInteractions: InteractionLog[] = [];

        // read and parse each file and push to a combined list
        for (const file of interactionFiles) {
            const entries = JSON.parse(
                FSHelpers.readFileSafe(path.join(HEATMAP_CONFIG.REPORT_OUTPUT_PATH, file))
            ) as InteractionLog[];

            // append to aggregated list
            aggregatedInteractions.push(...entries);

            // delete worker file after processing. We only want the final combined file
            FSHelpers.deleteFileSafe(path.join(HEATMAP_CONFIG.REPORT_OUTPUT_PATH, file));
        }

        // write the merged result
        FSHelpers.writeTextFileSafe(
            path.join(HEATMAP_CONFIG.REPORT_OUTPUT_PATH, HEATMAP_CONFIG.INTERACTIONS_FILENAME),
            aggregatedInteractions,
            'json'
        );
        Logger.success('Interaction data aggregation complete');
    }

    /**
     * Merge screenshots tracker into a single file
     * This keeps all the unique values since some workers may have touched
     * components that were untouched by others
     * @returns
     */
    private aggregateScreenshots() {
        if (!FSHelpers.pathExists(HEATMAP_CONFIG.REPORT_OUTPUT_PATH)) return;

        Logger.info('... Aggregating screenshot data ...');

        // collect worker files
        const screenshotFiles = FSHelpers.readDirSafe(HEATMAP_CONFIG.REPORT_OUTPUT_PATH).filter(
            (f) => f.startsWith('worker-') && f.endsWith('-screenshots.json')
        );

        // no files? return
        if (!screenshotFiles.length) return;

        const aggregatedScreenshots: Record<string, ScreenshotTracker> = {};
        for (const file of screenshotFiles) {
            const entries = JSON.parse(
                FSHelpers.readFileSafe(path.join(HEATMAP_CONFIG.REPORT_OUTPUT_PATH, file))
            ) as any;

            // append to aggregated list
            for (const k in entries) {
                if (aggregatedScreenshots[k]) continue;

                aggregatedScreenshots[k] = entries[k];
            }

            // delete worker file after processing
            FSHelpers.deleteFileSafe(path.join(HEATMAP_CONFIG.REPORT_OUTPUT_PATH, file));
        }

        // write the merged result
        FSHelpers.writeTextFileSafe(
            path.join(HEATMAP_CONFIG.REPORT_OUTPUT_PATH, HEATMAP_CONFIG.SCREENSHOTS_FILENAME),
            aggregatedScreenshots,
            'json'
        );

        Logger.success('Screenshot data aggregation complete');
    }

    /**
     * Given an array of events grouped by Page Object Name,
     * summarize the number of interactions
     * @param events 
     * @returns 
     */
    private summarizeEvents(events: InteractionLog[]) {
        type IType = InteractionLog['type'];

        type BoxSummary = {
            boundingBox: BoundingBox;
            counts: Partial<Record<IType, number>>; // counts per type for this bounding box
            value: number; // total events for this bounding box and value for the heatmap
        };

        const map = new Map<string, BoxSummary>();

        for (const evt of events) {
            // Use JSON.stringify as the unique key for the bounding box
            const key = JSON.stringify(evt.boundingBox);

            let entry = map.get(key);
            if (!entry) {
            entry = {
                boundingBox: evt.boundingBox,
                counts: {} as Partial<Record<IType, number>>,
                value: 0
            };
            map.set(key, entry);
            }

            entry.counts[evt.type] = (entry.counts[evt.type] ?? 0) + 1;
            entry.value++;
        }

        // Return as an array; you can .sort(...) here if you want a specific order
        return Array.from(map.values());
    }

    // pivot our group logs by key
    private groupLogsBy(arr: InteractionLog[], key: keyof InteractionLog) {
        return Object.entries(
            arr.reduce((acc: any, item: any) => {
                const k = item[key];
                if (!acc[k]) acc[k] = [];
                acc[k].push(item);
                return acc;
            }, {}) as Record<string, InteractionLog[]>
        );
    }

    private loadTemplate(templatePath: string): string {
        return FSHelpers.readFileSafe(templatePath);
    }

    private renderTemplate(template: string, variables: Record<string, any>): string {
        return Object.entries(variables).reduce((html, [key, value]) => {
            return html.replace(new RegExp(`{{${key}}}`, 'g'), JSON.stringify(value));
        }, template);
    }
}
