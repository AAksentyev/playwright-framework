import { mockRequest, unmockRequest } from "@api/apiMocking.ts";
import { TAG } from "@constants/tags.ts";
import { test } from "@fixtures/base.ts";
import { HomePage } from "@pages/examples/HomePage/HomePage.ts";
import { TopNavigationMenuComponent } from "@pages/examples/TopNavigationMenuComponent.ts";
import { Logger } from "@utils/logger.ts";

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
            for (const [i] of Array(3).entries()) {
                Logger.debug(`Click iteration ${i}`);

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