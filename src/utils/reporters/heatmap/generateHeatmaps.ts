import fs from 'fs';
import path from 'path';
import {
    aggregateInteractions,
    aggregateScreenshots,
    InteractionLog,
} from './interactionLogger.ts';
import { ScreenshotTracker } from '../../screenshot.ts';

type HeatmapPoints = {
    x: number;
    y: number;
    value: number;
};

const REPORT_DIR = 'reports/heatmap';

/**
 * A report generator for page and component interaction heatmap
 * It uses all successful interactions collected by `@Interaction()` decoractor in BaseLocator class (safeClick, safeFill, etc)
 * and generates a heatmap over screenshots of either the full page (if it is a Page class)
 * or a component-specific locator screenshots and generates a heatmap report to track where interactions took place
 *
 * These reports might be useful to track coverage of elements and where the majority of interactions are in case an excessive amount of interactions
 * take place on specific elements and could help with optimisations
 *
 * Note:
 * This will not track any one-off `locator.click()` or `locator.fill()` actions.
 * You must use the wrapper functions in BaseLocator to track this data
 *
 */
export async function generateHeatmaps() {
    // aggregate all of the page/component interactions from different workers into a single file
    aggregateInteractions();
    aggregateScreenshots();
    // read and parse the merged interactions file
    const rawInteractions = fs.readFileSync(
        path.join(REPORT_DIR, 'interactions-merged.json'),
        'utf-8'
    );
    const aggReport = JSON.parse(rawInteractions) as InteractionLog[];

    // read and parse the merged screenshot tracker file that contains our offsets
    const rawScreenshots = fs.readFileSync(
        path.join(REPORT_DIR, 'screenshots-merged.json'),
        'utf-8'
    );
    const aggScreenshots = JSON.parse(rawScreenshots) as Record<string, ScreenshotTracker>;

    // group our data by the object name
    const grouped = groupLogsBy(aggReport, 'pageObjectName');

    // loop over each page object for which we have data for
    for (const [pageObjectName, logs] of grouped) {
        // create the folder for the page we don't have it yet
        const dir = path.join('reports/heatmap', pageObjectName);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

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
        const html = createHeatmapHTML(points);
        fs.writeFileSync(path.join(dir, 'heatmap.html'), html);
    }
}

/**
 * Helper to group the logs by given property by pivoting it to
 * `Record`
 * @param arr
 * @param key
 * @returns
 */
function groupLogsBy(arr: InteractionLog[], key: keyof InteractionLog) {
    return Object.entries(
        arr.reduce((acc: any, item: any) => {
            const k = item[key];
            if (!acc[k]) acc[k] = [];
            acc[k].push(item);
            return acc;
        }, {}) as Record<string, InteractionLog[]>
    );
}

/**
 * returns the final generated HTML report to be written to drive
 * @param points
 * @returns
 */
function createHeatmapHTML(points: HeatmapPoints[]) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
    <title>Heatmap</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/heatmap.js/2.0.2/heatmap.min.js"></script>
    <style>
        html, body {
        margin: 0;
        padding: 0;
        }
    </style>
    </head>
    <body>
    <div id="container" style="position:relative; width:100%; height:100%;">
        <img id="screenshot" src="./screenshot.png" style="width:auto; height:auto; position:absolute;">
        <div id="heatmap" style="position:absolute; top:0; left:0; width:100%; height:100%;"></div>
    </div>

    <script>
        const img = document.getElementById("screenshot");

        // wait until the image is loaded
        img.onload = () => {
            const heatmapDiv = document.getElementById("heatmap");
            
            // set the canvas size to the image natural size
            heatmapDiv.style.width = img.naturalWidth + "px";
            heatmapDiv.style.height = img.naturalHeight + "px";

            // heatmap settings. 
            // TODO - adjust these or make them configurable (low priority for now)
            const heatmapInstance = h337.create({
                container: heatmapDiv,
                radius: 10,
                maxOpacity: 0.5,
                minOpacity: 0,
                blur: 0.75
            });

            heatmapInstance.setData({ max: 10, data: ${JSON.stringify(points)} });
        }
    </script>
    </body>
    </html>`;
}
