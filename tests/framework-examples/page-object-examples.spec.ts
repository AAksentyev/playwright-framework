import { expect, test } from '@fixtures/base.ts';
import { ResourcesPage } from '@pages/examples/ResourcesPage.ts';
import { TextInputPage } from '@pages/examples/TextInputPage.ts';
import { AjaxDataPage } from '@pages/examples/AjaxDataPage.ts';
import { TAG } from '@constants/tags.ts';
import { HomePage } from '@pages/examples/HomePage.ts';
import { TopNavigationMenuComponent } from '@pages/examples/TopNavigationMenuComponent.ts';


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
            await homePage.clickPageLink('Text Input');
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

    test('Verify asynchronously loaded data', async ({ page }) => {
        // initialize the home page object model
        const homePage = new HomePage(page);
        const ajaxDataPage = new AjaxDataPage(page);

        // navigate to the URL defined in the POM
        await test.step('Navigate to the URL', async () => {
            await homePage.navigateToByUrl();
        });

        // navigate to the Ajax data page using the link on the home page
        await test.step('Navigate to the Ajax Data page', async () => {
            await homePage.clickPageLink('AJAX Data');
            await ajaxDataPage.waitForPageLoad();
        });

        // fill the textbox and click the button
        await test.step('Fill the textbox and click the button', async () => {
            await ajaxDataPage.clickAjaxButton();
            await ajaxDataPage.waitForAjaxData();
        });

        // verify that the asynchronously loaded data is correct
        await test.step('Button text should change', async () => {
            await expect(ajaxDataPage.ajaxDataContents).toHaveText(
                'Data loaded with AJAX get request.'
            );
        });
    });
});