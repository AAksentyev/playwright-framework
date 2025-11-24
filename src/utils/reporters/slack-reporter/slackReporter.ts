import { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { SlackClient } from '@utils/reporters/slack-reporter/slackClient.ts';
import { Logger } from '@utils/logger.ts';

interface SlackReporterOpts {
    enabled?: boolean;
}

/**
 * Reporter class for tracking and sending the test status to the configured slack channel.
 * Driven by process.env.SLACK_ENABLED
 */
export default class SlackReporter implements Reporter {
    private readonly enabled: boolean;

    private slackClient: SlackClient;
    private passed = 0;
    private failed = 0;
    private skipped = 0;

    constructor(opts?: SlackReporterOpts) {
        this.enabled = opts?.enabled ?? false;
        this.slackClient = new SlackClient();

        if (!this.enabled) {
            /* eslint-disable prettier/prettier */
            Logger.debug('----------------------------------------------------------------------------');
            Logger.debug('------------- Slack Integration Toggled off. No Report will be generated ---');
            Logger.debug('------- To enabled slack integration, set process.env.SLACK_ENABLED  -------');
            Logger.debug('------------------- and configure the intergration options------------------');
            Logger.debug('----------------------------------------------------------------------------');
            Logger.debug(' ');
            /* eslint-enable prettier/prettier */
        }
    }

    /**
     * Start tracking our execution time
     */
    onBegin() {}

    /**
     * Increment the pass/fail status
     * @param test
     * @param result
     * @returns
     */
    onTestEnd(test: TestCase, result: TestResult) {
        if (!this.enabled) return;

        if (result.status === 'passed') this.passed++;
        else if (result.status === 'failed') this.failed++;
        else if (result.status === 'skipped') this.skipped++;
    }

    /**
     * Once all tests finish running, collect necessary statistics
     * and send a block message to the slack message (if SLACK_ENABLED=true)
     * @param result
     * @returns
     */
    async onEnd(result: FullResult) {
        if (!this.enabled) return;

        const symbol = this.failed === 0 ? '✅' : '❌';
        const durationSec = Math.round(result.duration / 1000);
        const minutes = Math.floor(durationSec / 60);
        const seconds = durationSec % 60;
        const durationText = `${minutes}m ${seconds}s`;

        // Build Slack blocks
        const blocks = [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `${symbol} *Playwright Test Run Completed*`,
                },
            },
            {
                type: 'section',
                fields: [
                    { type: 'mrkdwn', text: `*Passed:* ${this.passed}` },
                    { type: 'mrkdwn', text: `*Failed:* ${this.failed}` },
                    { type: 'mrkdwn', text: `*Skipped:* ${this.skipped}` },
                    { type: 'mrkdwn', text: `*Duration:* ${durationText}` },
                ],
            },
            // Optional: divider
            { type: 'divider' },
            // Optional: link to CI or reports
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*Full Reports:* <https://google.com|View Reports>`,
                },
            },
        ];

        // Send using blocks
        await this.slackClient.sendBlock(blocks);
    }
}
