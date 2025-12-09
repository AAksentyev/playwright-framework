import { expect, test } from '@fixtures/base.ts';
import { TAG } from '@constants/tags.ts';
import { FOOTER_LINKS, FooterComponent } from '@pages/examples/FooterComponent.ts';

/**
 * Footer component testes
 * Ensures all external links redirect to the appropriate 3rd party page and the footer test matches expected
 */

let footerComponent:FooterComponent;

test.describe('Footer tests', { tag: [TAG.UI] }, async () => {
    test.beforeEach('Set up component', async({page})=>{
        footerComponent = new FooterComponent(page);
    })

    test('Footer has expected text', async({page})=>{
        const expectedText:string = 'Fork the website on GitHub.\n' +
                                    'Supported by Rapise test automation team. Copyright © 2020 Inflectra Corporation.\n' +
                                    'This work is licensed under the Apache License 2.0.'

        expect(await footerComponent.getFooterText()).toBe(expectedText);
    })

    // for each site configured in External Links, click on the link and ensure the site with the correct page name and URL loads
    for ( const link of Object.keys(FOOTER_LINKS) as (keyof typeof FOOTER_LINKS)[] ){
        test(`${link} external link redirects to expected site`, async({page})=>{
            await test.step('Click the footer link', async()=>{
                await footerComponent.clickFooterLink(link);
            })

            await test.step('Verify correct site loaded', async()=>{
                await expect(page).toHaveTitle(FOOTER_LINKS[link].siteName);
                await expect(page).toHaveURL(FOOTER_LINKS[link].siteUrl);
            })
            
        })
    }
});