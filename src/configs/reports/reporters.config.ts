import path from 'path';

/** REPORT OUTPUT FOLDERS */
export const REPORTS_PATH = 'reports';
// path to the screenshots directory
export const SCREENSHOT_PATH = path.join(REPORTS_PATH, 'screenshots');
// screenshot name template. Parameters are:
// 1. retry attemp number
// 2. normalized test name (spaces replaced with underscores)
// ex: 'failure-2-Navigate_to_my_page-chrome.png'
export const SCREENSHOT_NAME = 'failure-%d-%s-%s.png';
/** REPORT CONFIGURATIONS */
/** HEATMAP REPORT CONFIGURATION VALUES */
export const HEATMAP_CONFIG = {
    REPORT_OUTPUT_PATH: path.join(REPORTS_PATH, 'heatmap'),
    TEMPLATE_PATH: 'src/utils/reporters/heatmap/templates/reportTemplate.html',
    DASHBOARD_TEMPLATE_PATH: 'src/utils/reporters/heatmap/templates/index.html',
    REPORT_NAME: 'heatmap.html',

    INTERACTIONS_FILENAME: 'interactions-merged.json',
    SCREENSHOTS_FILENAME: 'screenshots-merged.json',

    // headmap point configuration
    RADIUS: 20,
    MAX_OPACITY: 0.5,
    MIN_OPACITY: 0,
    BLUR: 0.75,
    MAX_POINTS: 10,
} as const;

/** NETWORK TRAFFIC MONITORING CONFIG VALES */
export const TRAFFIC_CONFIG = {
    REPORT_OUTPUT_PATH: path.join(REPORTS_PATH, 'network-traffic'),
    JSON_OUTPUT_NAME: 'network-traffic-merged.json',
} as const;
