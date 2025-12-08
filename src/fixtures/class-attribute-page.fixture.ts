import { test as base } from '@fixtures/base.ts';
import { ClassAttributePage } from '@pages/examples/ClassAttributePage.ts';

type ClassAttributePageFixture = {
    classAttributePage: ClassAttributePage;
};

/**
 * fixture for the Class attribute page
 * Currently just navigates to the page and serves it
 */
export const test = base.extend<ClassAttributePageFixture>({
    classAttributePage: async ({ page }, use) => {
        const classAttributePage = new ClassAttributePage(page);
        await classAttributePage.navigateToByUrl();
        use(classAttributePage);
    },
});
