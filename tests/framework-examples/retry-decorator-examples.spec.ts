import { TAG } from '@constants/tags.ts';
import { expect, test } from '@fixtures/base.ts';
import { DisabledInputPage } from '@pages/examples/DisabledInputPage.ts';
import { HomePage } from '@pages/examples/HomePage.ts';
import { Logger } from '@utils/logger.ts';

/**
 * Examples for the `@Retry` method decorator.
 *
 * Both `exampleRetryWithoutCallback` and `exampleRetryWithCallback` have a @Retry decorator applied to them
 * These tests will both fail by design to demonstrate the retrying of class method on failure
 */
test.describe('Retry decorator examples (tests will fail)', { tag: [TAG.UI] }, async () => {
    test('Retry without callback', async ({ page }) => {
        const homePage = new HomePage(page);
        // navigate to the URL defined in the POM
        await test.step('Navigate to the URL', async () => {
            await homePage.navigateToByUrl();
        });

        // click on an element that does not exist
        // this will cause the retry mechanism in the decorator to retry the click x number of times
        await test.step('Click on a missing element (will retry just this method)', async () => {
            await homePage.exampleRetryWithoutCallback();
        });
    });

    test('Retry with callback', async ({ page }) => {
        const homePage = new HomePage(page);

        // navigate to the URL defined in the POM
        await test.step('Navigate to the URL', async () => {
            await homePage.navigateToByUrl();
        });

        // fill an element that does not exist
        // this will cause the retry mechanism in the decorator to retry the click x number of times
        // since the decorator also had a callback supplied, every retry will have an additional example log displayed
        await test.step('Fill a missing element (will retry just this method)', async () => {
            await homePage.exampleRetryWithCallback();
        });
    });
});


/**
 * These examples show practical usage of the Retry decorator and how it functions.
 * 
 * The test leverages a page on the example site we use that disables a textbox input for a set period of time (5 seconds)
 * In the examples, provided we use different delays to simulate attempts to fill the textbox before and after it becomes enabled
 * 
 * A retry decorator is applied to the 'fillTextboxWithRetry' function. This has a hardcoded 2 second delay to simulate not waiting long enough
 * for the input to become enabled. The Retry decorator is set to have 3 attempts with a 2 second delay, between them. So the first couple of attempts
 * to fill the textbox will fail but the last one will succeed because the textbox will be enabled by then, so the test will pass.
 * 
 * Note: Even though the test passed, the generated Allure report will call out which tests had actions that were retried by showing 
 * an icon next to the suite and test name so you can perform further analysis and de-flaking if necessary
 */
test.describe('Demo of disabled input handling', { tag: [TAG.UI] }, async () => {
    test('Attempt to fill a disabled field (test will fail)', async ({ page }) => {
        const disabledInputPage = new DisabledInputPage(page);
        // navigate to the URL defined in the POM
        await test.step('Navigate to the page', async () => {
            await disabledInputPage.navigateToByUrl();
        });

        await test.step('click the button to disable the input textbox', async () => {
            await disabledInputPage.disableTextbox();
        });

        // fill the textbox without waiting for it to be enabled again
        await test.step('Fill the textbox while it is disabled', async () => {
            await disabledInputPage.fillTextbox('test value', 1000);
        });
    });

    test('Attempt to fill a field after waiting for it to be enabled', async ({ page }) => {
        const disabledInputPage = new DisabledInputPage(page);
        // navigate to the URL defined in the POM
        await test.step('Navigate to the page', async () => {
            await disabledInputPage.navigateToByUrl();
        });

        await test.step('click the button to disable the input textbox', async () => {
            await disabledInputPage.disableTextbox();
        });

        // fill the textbox after waiting for it to be enabled again
        await test.step('Fill the textbox after it becomes enabled', async () => {
            await disabledInputPage.fillTextbox('test value');
        });
    });

    test('Attempt to fill a disabled field with a retry decordator', async ({ page }) => {
        const disabledInputPage = new DisabledInputPage(page);
        // navigate to the URL defined in the POM
        await test.step('Navigate to the page', async () => {
            await disabledInputPage.navigateToByUrl();
        });

        await test.step('click the button to disable the input textbox', async () => {
            await disabledInputPage.disableTextbox();
        });

        // fill the textbox after waiting for it to be enabled again
        await test.step('Fill the textbox after it becomes enabled', async () => {
            Logger.info(`This fill function will be retried several times and 
                        should result in a successful test since the field will become 
                        enabled between retry attempts`);
            await disabledInputPage.fillTextboxWithRetry('test value');
        });
    });
});