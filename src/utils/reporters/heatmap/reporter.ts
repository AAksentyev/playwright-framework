import path from 'path';
import { FullResult, Reporter } from '@playwright/test/reporter';
import { Logger } from '@utils/logger.ts';
import { HEATMAP_CONFIG } from '@configs/reports/reporters.config.ts';
import { HeatmapPoints, InteractionLog, ScreenshotTracker } from './heatmap.t.ts';
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

    private async generateHeatmaps() {
        Logger.info('[HeatmapReporter] Generating heatmap reports ...');

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
                const points: HeatmapPoints[] = logs.map((log) => ({
                    x: Math.round(log.boundingBox.x - offsets!.x + log.boundingBox.width / 2),
                    y: Math.round(log.boundingBox.y - offsets!.y + log.boundingBox.height / 2),
                    value: 2,
                }));

                // generate our final html report file and save it
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
            }
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
