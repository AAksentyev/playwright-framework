import { expect, Locator, Page } from '@playwright/test';
import { Logger } from '@utils/logger.ts';
import { BasePage } from '@pages/base/BasePage.ts';
import { Interaction } from '@utils/reporters/heatmap/interaction.ts';

export const EXTERNAL_LINKS = {
    W3SCHOOLS: {
        linkLabel: 'w3schools.com',
        siteUrl: 'https://www.w3schools.com/',
        siteName: 'W3Schools Online Web Tutorials',
    },
    MDN: {
        linkLabel: 'MDN',
        siteUrl: 'https://developer.mozilla.org/en-US/',
        siteName: 'MDN Web Docs',
    },
    REGEX: {
        linkLabel: 'Learn regex the easy way',
        siteUrl: 'https://github.com/ziishaned/learn-regex',
        siteName: 'GitHub - ziishaned/learn-regex: Learn regex the easy way',
    },
    DEVHINTS: {
        linkLabel: 'devhints.io',
        siteUrl: 'https://devhints.io/',
        siteName: 'Devhints — TL;DR for developer documentation',
    },
    W3C: {
        linkLabel: 'W3C',
        siteUrl: 'https://www.w3.org/',
        siteName: 'W3C',
    },
    TEST_PYRAMID: {
        linkLabel: 'Test Pyramid',
        siteUrl: 'https://martinfowler.com/bliki/TestPyramid.html',
        siteName: 'Test Pyramid',
    },
    FLAKY_TESTS: {
        linkLabel: 'Where do our flaky tests come from?',
        siteUrl: 'https://testing.googleblog.com/2017/04/where-do-our-flaky-tests-come-from.html',
        siteName: 'Google Testing Blog: Where do our flaky tests come from?',
    },
    MINISTRY_OF_TESTING: {
        linkLabel: 'Ministry of Testing',
        siteUrl: 'https://www.ministryoftesting.com/',
        siteName: 'Where software testers, QA and quality engineers build their careers | Ministry of Testing',
    },
    UTEST: {
        linkLabel: 'uTest',
        siteUrl: 'https://www.utest.com/',
        siteName: 'uTest - The Professional Network for Testers',
    },
    SOFTWARE_TESTING_HELP: {
        linkLabel: 'Software Testing Help',
        siteUrl: 'https://www.softwaretestinghelp.com/',
        siteName: 'Software Testing Help - FREE IT Courses and Business Software Reviews',
    },
    DZONE: {
        linkLabel: 'DZone',
        siteUrl: 'https://dzone.com/',
        siteName: 'DZone: Programming & DevOps news, tutorials & tools',
    },
    STACKOVERFLOW: {
        linkLabel: 'StackOverflow',
        siteUrl: 'https://stackoverflow.com/questions',
        siteName: 'Newest Questions - Stack Overflow',
    },
} as const;

/**
 * Example Page Object Model using the Playwright site
 * Provides examples on how to implement base classes and decorators
 *
 */
export class ResourcesPage extends BasePage {
    constructor(protected page: Page) {
        super(page, 'ResourcesPage');
    }

    /**
     * Defined non-null page url
     * Allows the use of `this.navigateToByUrl()` when using this POM
     */
    protected get url(): string | null {
        return '/resources';
    }

    /** page header */
    private get pageHeader(): Locator {
        return this.page.getByRole('heading', { name: 'Resources' });
    }
    /**
     * Condition(s) to wait for when navigating to the page or waiting for it to load
     * Automatically invoked when using `this.navigateToByUrl()`
     */
    @Interaction('visibility_check', 'pageHeader')
    public async waitForPageLoad(): Promise<void> {
        await expect(this.pageHeader, `Resources header should be visible`).toBeVisible();
    }

    /**
     * Click the external link on the Resources page and wait for the page to be redirected to the expected page
     * @param key - key of predefined available URLs
     */
    public async clickExternalLink(key: keyof typeof EXTERNAL_LINKS): Promise<void> {
        const link = EXTERNAL_LINKS[key];

        Logger.debug(`Navigating to Resources page link '${link.linkLabel}'`);
        await this.safeClick(
            this.page
                .locator('div.container')
                .getByRole('link', { name: link.linkLabel, exact: true })
        );
        //await expect(this.page).toHaveTitle(link.siteName);
        //await expect(this.page).toHaveURL(link.siteUrl);
    }
}
