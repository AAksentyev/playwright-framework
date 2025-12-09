import { test as base } from '@fixtures/base.ts';
import { DynamicTablePage } from '@pages/examples/DynamicTable/DynamicTablePage.ts';

type DynamicTableFixture = {
    dynamicTablePage: DynamicTablePage;
};

/**
 * fixture for the Home page
 * Currently just navigates to the page and serves it
 */
export const test = base.extend<DynamicTableFixture>({
    dynamicTablePage: async ({ page }, use) => {
        const dynamicTablePage = new DynamicTablePage(page);
        await dynamicTablePage.navigateToByUrl();
        use(dynamicTablePage);
    },
});
