import { PlaywrightHomePage } from '@pages/example/PlaywrightHomePage.ts';
import { SideNavigationMenuComponent } from '@pages/example/SideNavigationMenuComponent.ts';
import { TopNavigationMenuComponent } from '@pages/example/TopNavigationMenuComponent.ts';
import { expect, test } from '@playwright/test';

/**
 * Examples for the `@Retry` method decorator.
 * 
 * Both `exampleRetryWithoutCallback` and `exampleRetryWithCallback` have a @Retry decorator applied to them
 * These tests will both fail by design to demonstrate the retrying of class method on failure
 */
test.describe('Retry decorator examples', async()=>{
    test('Retry without callback', async ({ page }) => {
        const playwrightPage = new PlaywrightHomePage(page);
        // navigate to the URL defined in the POM
        await test.step('Navigate to the URL', async () => {
            await playwrightPage.navigateToByUrl();
        });

        // click on an element that does not exist
        // this will cause the retry mechanism in the decorator to retry the click x number of times
        await test.step('Click on a missing element', async () => {
            await playwrightPage.exampleRetryWithoutCallback();
        });
    });

    test('Retry with callback', async ({ page }) => {
        const playwrightPage = new PlaywrightHomePage(page);

        // navigate to the URL defined in the POM
        await test.step('Navigate to the URL', async () => {
            await playwrightPage.navigateToByUrl();
        });

        // fill an element that does not exist
        // this will cause the retry mechanism in the decorator to retry the click x number of times
        // since the decorator also had a callback supplied, every retry will have an additional example log displayed
        await test.step('Fill a missing element', async () => {
            await playwrightPage.exampleRetryWithCallback();
        });
    });
})

test.describe('Component and Page Object Models', async()=>{
    test('Component interactions', async ({ page }) => {
        // initialize the home page object model
        const playwrightPage = new PlaywrightHomePage(page);

        // the side nav menu and top menu both have their own components
        // since they persist across most pages
        const topMenu = new TopNavigationMenuComponent(page);
        const sideMenu = new SideNavigationMenuComponent(page);

        // navigate to the URL defined in the POM
        await test.step('Navigate to the URL', async () => {
            await playwrightPage.navigateToByUrl();
        });

        // the side menu component should now be visible
        await test.step('The home page does not have the side navigation menu', async () => {
            await expect(sideMenu.root).not.toBeVisible();
        });

        // use the top menu component to navigate to a different page
        await test.step('Navigate to the Docs page via Top nav menu', async () => {
            await topMenu.clickMenuOption('Docs');
        });

        // the side menu component should now be visible
        await test.step('Side nav menu should now be visible. Wait for it to load', async () => {
            await sideMenu.waitForComponentLoad();

        });
    });

});
