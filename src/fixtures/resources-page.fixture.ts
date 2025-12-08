import { test as base } from '@fixtures/base.ts';
import { ResourcesPage } from '@pages/examples/ResourcesPage.ts';

type ResourcesPageFixture = {
    resourcesPage: ResourcesPage;
};

/**
 * fixture for the Auto Wait Page
 * Currently just navigates to the page and serves it
 */
export const test = base.extend<ResourcesPageFixture>({
    resourcesPage: async ({ page }, use) => {
        const resourcesPage = new ResourcesPage(page);
        await resourcesPage.navigateToByUrl();
        use(resourcesPage);
    },
});
