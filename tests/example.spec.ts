import { PlaywrightHomePage } from '@pages/example/PlaywrightHomePage.ts';
import { SideNavigationMenuComponent } from '@pages/example/SideNavigationMenuComponent.ts';
import { TopNavigationMenuComponent } from '@pages/example/TopNavigationMenuComponent.ts';
import { test } from '@playwright/test';


test('Retry without callback', async ({ page }) => {
    const playwrightPage = new PlaywrightHomePage(page);
    // navigate to the URL defined in the POM
    await test.step('Navigate to the URL', async()=>{
        await playwrightPage.navigateToByUrl();
    })
    
    // click on an element that does not exist
    // this will cause the retry mechanism in the decorator to retry the click x number of times
    await test.step('Click on a missing element', async()=>{
        await playwrightPage.exampleRetryWithoutCallback();
    })
    
});

test('Retry with callback', async ({ page }) => {
    const playwrightPage = new PlaywrightHomePage(page);
    
    // navigate to the URL defined in the POM
    await test.step('Navigate to the URL', async()=>{
        await playwrightPage.navigateToByUrl();
    })
    
    // fill an element that does not exist
    // this will cause the retry mechanism in the decorator to retry the click x number of times
    // since the decorator also had a callback supplied, every retry will have an additional example log displayed
    await test.step('Fill a missing element', async()=>{
        await playwrightPage.exampleRetryWithCallback();
    })
});

test('Component interactions', async ({ page }) => {
    const playwrightPage = new PlaywrightHomePage(page);
    const topMenu = new TopNavigationMenuComponent(page);
    const sideMenu = new SideNavigationMenuComponent(page);

    // navigate to the URL defined in the POM
    await test.step('Navigate to the URL', async()=>{
        await playwrightPage.navigateToByUrl();
    })
    
    await test.step('Navigate to the Docs page via Top nav menu', async()=>{
        await topMenu.clickMenuOption('Docs');
    })

    await test.step('Side nav menu should now be visible. Wait for it to load', async()=>{
        await sideMenu.waitForComponentLoad();
    })
    
});