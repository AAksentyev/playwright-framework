import { TAG } from '@constants/tags.ts';
import { expect } from '@fixtures/base.ts';
import { test } from '@fixtures/home-page.fixture.ts';
import { HOME_PAGE_LINKS } from '@pages/examples/HomePage.t.ts';

/**
 * Home Page tests
*/
test.describe('Home Page tests', { tag: [TAG.UI, TAG.WIP] }, async () => {
    test.describe('Image and static text', async()=>{

        // perform visual regression on the image
        test("Rubic's cube image is visible and rendered", async({homePage})=>{
            await expect(await homePage.getRubicsCubeImage()).toHaveScreenshot('home-page-rubics-cube.png')
        });

        // verify static text
        test("Static text on home page is correct", async({ homePage, page })=>{
            expect.soft(
                await homePage.getAlertText(),
                "Informational alert should have correct text"
            ).toBe(
                'The purpose of this website is to provide a platform for sharpening UI test automation skills. Use it to practice with your test automation tool. Use it to learn test automation techniques.'
            );
            expect.soft(
                await homePage.getCitationText(),
                "Aristotle quote should have correct text"
            ).toBe('Quality is not an act, it is a habit.\n\nAristotle');
            
            await expect.soft(
                page.getByText('Different automation pitfalls appearing in modern web applications are described and emulated below.'),
                "Informational paragraph text should be visible"
            ).toBeVisible();
        });
    })

    /**
     * Ensure the page links on the home page are correct
    */
    test.describe('Page links', async()=>{
        for (const link of Object.keys(HOME_PAGE_LINKS) as (keyof typeof HOME_PAGE_LINKS)[]){
            test(`${link} link on the Home Page navigates user to expected page`, async({ homePage, page })=>{
                
                await test.step(`Link should have the correct href`, async({})=>{
                    expect(await homePage.getPageLinkHref(HOME_PAGE_LINKS[link].linkLabel)).toBe(HOME_PAGE_LINKS[link].targetURL)
                })

                await test.step(`Click ${link} link on the Home page`, async({})=>{
                    await homePage.clickPageLink(HOME_PAGE_LINKS[link].linkLabel);
                })

                await test.step(`Click ${link} link on the Home page`, async({})=>{
                    await page.waitForURL(`**${HOME_PAGE_LINKS[link].targetURL}`);
                })
            })
        }
    })

});