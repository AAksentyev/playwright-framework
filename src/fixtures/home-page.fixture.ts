import { test as base } from '@fixtures/base.ts';
import { HomePage } from '@pages/examples/HomePage/HomePage.ts';

type HomePageFixture = {
    homePage: HomePage;
};

/**
 * fixture for the Home page
 * Currently just navigates to the page and serves it
 */
export const test = base.extend<HomePageFixture>({
    homePage: async ({ page }, use) => {
        const homePage = new HomePage(page);
        await homePage.navigateToByUrl();
        use(homePage);
    },
});
