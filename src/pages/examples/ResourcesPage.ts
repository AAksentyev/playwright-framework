import { expect, Locator, Page } from '@playwright/test';
import { Logger } from '@utils/logger.ts';
import { BasePage } from '@pages/base/BasePage.ts';
import { Interaction } from '@utils/reporters/heatmap/interaction.ts';

const externalLinks = {
    W3SCHOOLS: {
        linkLabel: 'w3schools.com',
        siteUrl: 'https://www.w3schools.com/',
        siteName: 'W3Schools Online Web Tutorials',
    },
    MDN: {
        linkLabel: 'w3schools.com',
        siteUrl: 'https://developer.mozilla.org/en-US/',
        siteName: 'MDN Web Docs',
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
    private get pageHeader():Locator {
        return this.page.getByRole('heading', { name: 'Resources' })
    }
    /**
     * Condition(s) to wait for when navigating to the page or waiting for it to load
     * Automatically invoked when using `this.navigateToByUrl()`
     */
    @Interaction('visibility_check', 'pageHeader')
    public async waitForPageLoad(): Promise<void> {
        await expect(
            this.pageHeader,
            `Resources header should be visible`
        ).toBeVisible();
    }

    /**
     * Click the external link on the Resources page and wait for the page to be redirected to the expected page
     * @param key - key of predefined available URLs
     */
    public async clickExternalLink(key: keyof typeof externalLinks): Promise<void> {
        const link = externalLinks[key];

        Logger.debug(`Navigating to Resources page link '${link.linkLabel}'`);
        await this.safeClick(
            this.page
                .locator('div.container')
                .getByRole('link', { name: link.linkLabel, exact: true })
        );
        await expect(this.page).toHaveTitle(link.siteName);
        await expect(this.page).toHaveURL(link.siteUrl);
    }
}
