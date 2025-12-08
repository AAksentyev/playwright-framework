import { expect } from '@fixtures/base.ts';
import { TAG } from '@constants/tags.ts';
import { test } from '@fixtures/resources-page.fixture.ts';
import { EXTERNAL_LINKS } from '@pages/examples/ResourcesPage.ts';

/**
 * Resources page tests
 * Ensures all external links redirect to the appropriate 3rd party page
 */
test.describe('Resources page link tests', { tag: [TAG.UI] }, async () => {
    // for each site configured in External Links, click on the link and ensure the site with the correct page name and URL loads
    for ( const site of Object.keys(EXTERNAL_LINKS) as (keyof typeof EXTERNAL_LINKS)[] ){
        test(`${site} external link redirects to expected site`, async({resourcesPage, page})=>{
            await test.step('Click the external link', async()=>{
                await resourcesPage.clickExternalLink(site);
            })

            await test.step('Verify correct site loaded', async()=>{
                await expect(page).toHaveTitle(EXTERNAL_LINKS[site].siteName);
                await expect(page).toHaveURL(EXTERNAL_LINKS[site].siteUrl);
            })
            
        })
    }
});