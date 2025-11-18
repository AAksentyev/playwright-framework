import { TAG } from '@constants/tags.ts';
//import { PlaywrightHomePage } from '@pages/example-poms/PlaywrightHomePage.ts';
import { TopNavigationMenuComponent } from '@pages/example-poms/TopNavigationMenuComponent.ts';
import { expect, test } from '@fixtures/base.ts';
import { mockRequest, unmockRequest } from '@api/apiMocking.ts';
import { HomePage } from '@pages/example-poms/HomePage.ts';
import { ResourcesPage } from '@pages/example-poms/ResourcesPage.ts';
import { TextInputPage } from '@pages/example-poms/TextInputPage.ts';

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

test.describe('Component and Page Object Models', { tag: [TAG.UI] }, async () => {
    test('Component interactions', async ({ page }) => {
        // initialize the home page object model
        const homePage = new HomePage(page);
        const resourcesPage = new ResourcesPage(page);

        // top menu is a component that persists across pages
        const topMenu = new TopNavigationMenuComponent(page);

        // navigate to the URL defined in the POM
        await test.step('Navigate to the URL', async () => {
            await homePage.navigateToByUrl();
        });

        // use the top menu component to navigate to a different page
        await test.step('Navigate to the Resources page via Top nav menu', async () => {
            await topMenu.clickMenuOption('Resources');
        });

        // the side menu component should now be visible
        await test.step('Resources page should be loaded', async () => {
            await resourcesPage.waitForPageLoad();
        });

        // go back to the home page via the top nav menu
        await test.step('Resources page should be loaded', async () => {
            await topMenu.clickMenuOption('Home');
        });

        // home page should now be visible
        await test.step('Navigate to the URL', async () => {
            await homePage.waitForPageLoad();
        });
    });

    test('Navigate between different pages and interact with components', async ({ page }) => {
        // initialize the home page object model
        const homePage = new HomePage(page);
        const textInputPage = new TextInputPage(page);
        const myNewValue = 'This is my new value';
        
        // navigate to the URL defined in the POM
        await test.step('Navigate to the URL', async () => {
            await homePage.navigateToByUrl();
        });

        // navigate to the text input page using the link on the home page
        await test.step('Navigate to the Text Input page', async () => {
            await homePage.clickPageLink("Text Input");
            await textInputPage.waitForPageLoad();
        });

        // fill the textbox and click the button
        await test.step('Fill the textbox and click the button', async () => {
            await textInputPage.fillTextbox(myNewValue);
            await textInputPage.clickButton();
        });

        // the button label should now change to the value entered into the textbox
        await test.step('Button text should change', async () => {
            expect(await textInputPage.getButtonText()).toEqual(myNewValue);
        });

    });
});

test.describe(
    'Tests that will have failed network requests attached to logs',
    { tag: [TAG.UI] },
    async () => {
        test('Test with a failed network request', async ({ page }) => {
            const homePage = new HomePage(page);
            const topMenu = new TopNavigationMenuComponent(page);
            const MOCK_RESOURCE = '**/cube.png';

            // let's mock an API request to simulate a failure. The Browsers image resource will now return 404 error
            mockRequest(page, MOCK_RESOURCE, {
                status: 404,
                contentType: 'text/plain',
                body: 'This request will fail and be attached as failed network request',
            });

            await test.step('Navigate to the URL', async () => {
                await homePage.navigateToByUrl();
            });

            /** Navigate back and forth between two pages to trigger the 'failed' network requests */
            for (const i of Array(3)) {
                await test.step('Navigate to the Resources page via Top nav menu', async () => {
                    await topMenu.clickMenuOption('Resources');
                });

                await test.step('Navigate back to home page', async () => {
                    await topMenu.clickMenuOption('Home');
                });
            }

            /** Unmock the request so it succeeds again and toggle back and forth again to simulate a successful call */
            unmockRequest(page, MOCK_RESOURCE);

            await test.step('Navigate to the Resources again', async () => {
                await topMenu.clickMenuOption('Resources');
            });

            await test.step('Navigate back to home page', async () => {
                await topMenu.clickMenuOption('Home');
            });

            /** This test will have an attachment in the report that will show the count of successful and failed tests 
         *  For each failed request, it will it will display the test name and the response code.
         *  At the end of the test run, all details from every test are aggregated and combined into a single
         * combined report showing the total number of successes and failures for each request through the test run.
         * 
         * This can help analyze either broken resources or flaky behavior.
         * Note: There is only 1 success showing because the Playwright site retrieves the successfully loaded resource from cache
         * But if it's a request 
        {
            "https://playwright.dev/img/logos/Browsers.png":
                { "success":1,"fail":4,
                    "failures":[
                        {"testName":"Test with a failed network request","responseCode":404},
                        {"testName":"Test with a failed network request","responseCode":404},
                        {"testName":"Test with a failed network request","responseCode":404},
                        {"testName":"Test with a failed network request","responseCode":404}
                    ]
                }
        }*/
        });
    }
);
