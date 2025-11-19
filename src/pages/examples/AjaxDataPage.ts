import { expect, Locator, Page } from '@playwright/test';
import { Logger } from '@utils/logger.ts';
import { BasePage } from '@pages/base/BasePage.ts';

/**
 * Example Page Object Model with asynchronously loaded data
 *
 */
export class AjaxDataPage extends BasePage {
    constructor(protected page: Page) {
        super(page, 'AjaxDataPage');
    }

    /**
     * Defined non-null page url
     * Allows the use of `this.navigateToByUrl()` when using this POM
     */
    protected get url(): string | null {
        return '/ajax';
    }

    /** The loading spinner that is visible while data is being loaded */
    private get spinner(): Locator {
        return this.page.locator('#spinner');
    }
    /** Locator for the button on the page */
    private get ajaxTriggerButton() {
        return this.page.getByRole('button', { name: 'Button Triggering AJAX Request' });
    }

    /** Locator with the contents of the data */
    public get ajaxDataContents(): Locator {
        return this.page.locator('div#content');
    }

    /**
     * Condition(s) to wait for when navigating to the page or waiting for it to load
     * Automatically invoked when using `this.navigateToByUrl()`
     */
    public async waitForPageLoad(): Promise<void> {
        await expect(this.page.getByRole('heading', { name: 'AJAX Data' })).toBeVisible();
    }

    /**
     * Click the button on the page that changes
     * its label based on the value entered in the textbox
     */
    public async clickAjaxButton() {
        Logger.debug('Clicking the AJAX trigger button');
        await this.safeClick(this.ajaxTriggerButton);
    }

    /**
     * Wait for the async data to be loaded after clicking the ajaxTriggerButton
     * @param timeout
     */
    public async waitForAjaxData(timeout: number = 20000) {
        await this.spinner.waitFor({ state: 'hidden', timeout });
        await expect(this.ajaxDataContents).toBeVisible();
    }
}
