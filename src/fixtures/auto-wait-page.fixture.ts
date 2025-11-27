import { test as base } from '@fixtures/base.ts';
import { AutoWaitPage } from '@pages/examples/AutoWaitPage.ts';

type AutoWaitPageFixture = {
    autoWaitPage: AutoWaitPage;
};

/**
 * fixture for the Auto Wait Page
 * Currently just navigates to the page and serves it
 */
export const test = base.extend<AutoWaitPageFixture>({
    autoWaitPage: async ({ page }, use) => {
        const autoWaitPage = new AutoWaitPage(page);
        await autoWaitPage.navigateToByUrl();
        use(autoWaitPage);
    },
});
