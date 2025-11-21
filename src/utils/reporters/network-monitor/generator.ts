import path from 'path';
import { TRAFFIC_CONFIG } from '@configs/reports/reporters.config.ts';
import { fileURLToPath } from 'url';
import { Logger } from '@utils/logger.ts';
import { ChartData, NetworkReport, RequestStats } from './monitor.t.ts';
import { FSHelpers } from '@utils/fs/fsHelpers.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * A Network Traffic Report generator.
 * Uses the aggregated network traffic JSON report to generate an HTML Summary report
 * That shows successes + failures per URL and per test
 */
export class NetworkReportGenerator {
    constructor(private outputDir: string = TRAFFIC_CONFIG.REPORT_OUTPUT_PATH) {}

    /**
     * Load an HTML template file for interpolation and injection
     * @param file
     * @returns
     */
    private loadTemplate(file: string) {
        return FSHelpers.readFileSafe(path.join(__dirname, 'templates', file));
    }

    /**
     * Load a JS script file for injection
     * @param file
     * @returns
     */
    private loadScript(file: string) {
        return FSHelpers.readFileSafe(path.join(__dirname, 'scripts', file));
    }

    /**
     * Load a css file for injection
     * @param file
     * @returns
     */
    private loadStyle(file: string) {
        return FSHelpers.readFileSafe(path.join(__dirname, 'css', file));
    }

    /**
     * Transform data in the report to fit the data structure needed for the bar chart
     * @param report
     * @returns
     */
    private transformForChart(report: NetworkReport): ChartData {
        const urls: string[] = [];
        const successCounts: number[] = [];
        const failCounts: number[] = [];
        for (const [url, data] of Object.entries(report)) {
            urls.push(url);
            successCounts.push(data.success);
            failCounts.push(data.fail);
        }
        return { urls, successCounts, failCounts };
    }

    /**
     * Build summary table showing a row for each request url with successes, failures, and failure % for each
     * @param report
     * @returns
     */
    private buildSummaryRows(report: NetworkReport) {
        return Object.entries(report)
            .map(([url, data]) => {
                const total = data.success + data.fail;
                const failPct = total === 0 ? 0 : ((data.fail / total) * 100).toFixed(2);
                return `<tr><td>${url}</td><td>${data.success}</td><td>${data.fail}</td><td>${failPct}%</td></tr>`;
            })
            .join('');
    }

    /**
     * Pivots the report by the URL domain
     * @param report
     * @returns
     */
    private groupByDomain(report: NetworkReport): Record<string, NetworkReport> {
        const groups: Record<string, NetworkReport> = {};
        for (const [url, data] of Object.entries(report)) {
            const domain = new URL(url).hostname;
            if (!groups[domain]) groups[domain] = {};
            groups[domain][url] = data;
        }
        return groups;
    }

    /**
     * Groups network requests by URL domain and return a table with grouped data
     * @param report
     * @returns
     */
    private buildDomainAccordions(report: NetworkReport) {
        // pivot the report by the URL domain
        const domains = this.groupByDomain(report);
        return Object.entries(domains)
            .map(([domain, group]) => {
                const rows = Object.entries(group)
                    .map(([url, data]) => {
                        const total = data.success + data.fail;
                        const failPct = total === 0 ? 0 : ((data.fail / total) * 100).toFixed(2);

                        return `<tr><td>${url}</td><td>${data.success}</td><td>${data.fail}</td><td>${failPct}%</td></tr>`;
                    })
                    .join('');

                return `<details>
                <summary>${domain}</summary>
                <table>
                    <thead>
                        <tr><th>URL</th><th>Success</th><th>Fail</th><th>Fail %</th></tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </details>`;
            })
            .join('');
    }

    /**
     * Build the table that shows the network call failure by test
     * @param report  - Network report object that is read from the json file
     * @returns
     */
    private buildFailuresPivot(report: NetworkReport) {
        const pivot: Record<string, Record<string, number>> = {};

        // if we don't have any failures, don't bother pivoting data and just return a message
        const failedUrls = Object.entries(report)
            .filter(([, d]) => (d.fail ?? 0) > 0)
            .map(([u]) => u);
        if (!failedUrls.length) return '<p>No failures recorded.</p>';

        // we have failures, so pivot the data
        const entries = Object.entries(report) as [string, RequestStats][];
        // loop over our entries in the report and pivot the data by test
        for (const [url, data] of entries) {
            for (const f of data.failures ?? []) {
                const t = f.testName ?? 'UNKNOWN_TEST';
                if (!pivot[t]) pivot[t] = {};
                pivot[t][url] = (pivot[t][url] ?? 0) + 1;
            }
        }
        // set the failed URL as a header
        const headerRow = failedUrls
            .map((url) => {
                const pathOnly = new URL(url).pathname;
                return `<th>
                                            <div class="tooltip">${pathOnly}
                                                <span class="tooltiptext">${url}</span>
                                            </div>
                                        </th>`;
            })
            .join('');

        // set the rows where the row header is the test name and the values are failures per URL
        const rows = Object.entries(pivot)
            .map(
                ([testName, counts]) =>
                    `<tr><td>${testName}</td>${failedUrls.map((u) => `<td>${counts[u] || 0}</td>`).join('')}</tr>`
            )
            .join('');
        // return our table
        return `<table><thead><tr><th>Test Name</th>${headerRow}</tr></thead><tbody>${rows}</tbody></table>`;
    }

    /**
     * Generate the final network report
     */
    public generate() {
        FSHelpers.createPathSafe(this.outputDir);
        const report = JSON.parse(
            FSHelpers.readFileSafe(path.join(this.outputDir, 'network-traffic-merged.json'))
        ) as NetworkReport;

        // transofrm all of the data in our report to be placed in the html report
        const chartData = this.transformForChart(report);
        const summaryRows = this.buildSummaryRows(report);
        const domainAccordions = this.buildDomainAccordions(report);
        const pivotTable = this.buildFailuresPivot(report);

        // Load templates
        const chartTemplate = this.loadTemplate('chart.html').replace(
            '{{chartData}}',
            JSON.stringify(chartData)
        );
        const summaryTemplate = this.loadTemplate('summary.html').replace(
            '{{summaryRows}}',
            summaryRows
        );
        const domainTemplate = this.loadTemplate('domain.html').replace(
            '{{domainAccordions}}',
            domainAccordions
        );
        const pivotTemplate = this.loadTemplate('failures-by-test.html').replace(
            '{{pivotTable}}',
            pivotTable
        );

        // load the css file
        const styleContent = this.loadStyle('style.css');

        // load our scripts
        const chartJs = this.loadScript('chart.js');
        const sortJs = this.loadScript('sortTable.js');

        // interpolate all the loaded resources into the main report template
        const baseTemplate = this.loadTemplate('main.html')
            .replace('{{style}}', styleContent)
            .replace('{{chartSection}}', chartTemplate)
            .replace('{{summarySection}}', summaryTemplate)
            .replace('{{domainSection}}', domainTemplate)
            .replace('{{pivotSection}}', pivotTemplate)
            .replace('{{chartJs}}', chartJs)
            .replace('{{sortJs}}', sortJs);

        // save
        FSHelpers.writeTextFileSafe(path.join(this.outputDir, 'network-report.html'), baseTemplate, 'text');

        Logger.success(`[Reporter] 📊 Network report generated at: ${this.outputDir}`);
    }
}
