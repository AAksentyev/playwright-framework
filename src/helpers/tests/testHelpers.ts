import { Page, TestInfo } from '@playwright/test';
import { sprintf } from 'sprintf-js';
import { Logger } from '@utils/logger.ts';
import { takeScreenshot } from '@utils/screenshot.ts';
import { SCREENSHOT_NAME, SCREENSHOT_PATH } from '@configs/reports/reporters.config.ts';

/**
 * Handle the test appropriately if it failed
 * Called from the base fixture at the end of every test.
 *
 * Checks if the test failed (either via timeout or failed status)
 * and if it did, takes a screenshot and attaches it to the test
 * @param page
 * @param testInfo
 * @returns
 */
export async function handleTestIfFailed(page: Page, testInfo: TestInfo, browserName: string) {
    const normalizedTest = testInfo.title.replace(/\s+/g, '_');
    if (testInfo.status === 'failed' || testInfo.status === 'timedOut') {
        Logger.warn(`Test ${testInfo.title} failed with status '${testInfo.status}'. 
                Taking screenshot and attaching to report.`);

        if (!page) {
            Logger.info('No Page instance found. Skipping screenshot');
            return;
        }
        Logger.warn(`BROWSER: ${browserName}`);
        // interpolate screenshot name with expected variables, take the screenshot and attach to test
        const screenshotName = sprintf(
            SCREENSHOT_NAME,
            testInfo.retry,
            normalizedTest,
            browserName
        );
        const { screenshot } = await takeScreenshot(page, SCREENSHOT_PATH, screenshotName);
        await testInfo.attach('screenshot', { body: screenshot, contentType: 'image/png' });
    }
}
