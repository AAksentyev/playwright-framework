import { TAG } from '@constants/tags.ts';
import { expect } from '@fixtures/base.ts';
import { test } from '@fixtures/home-page.fixture.ts';
import { HOME_PAGE_LINKS } from '@pages/examples/HomePage.t.ts';

/**
 * Home Page tests
*/
test.describe('Home Page tests', { tag: [TAG.UI, TAG.WIP] }, async () => {
    
    /**
     * Ensure the page links 
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