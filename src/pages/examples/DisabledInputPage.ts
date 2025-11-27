import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '@pages/base/BasePage.ts';
import { Retry } from '@decorators/actionRetry.ts';
import { Logger } from '@utils/logger.ts';
import { Interaction } from '@utils/reporters/heatmap/interaction.ts';

/**
 * Example Page Object Model with disabled input
 *
 */
export class DisabledInputPage extends BasePage {
    constructor(protected page: Page) {
        super(page, 'DisabledInput');
    }

    /**
     * Defined non-null page url
     * Allows the use of `this.navigateToByUrl()` when using this POM
     */
    protected get url(): string | null {
        return '/disabledinput';
    }

    /** page header locator */
    private get pageHeader(): Locator {
        return this.page.getByRole('heading', { name: 'Disabled Input' });
    }

    /** Locator for the button on the page */
    private get buttonLocator(): Locator {
        return this.page.getByRole('button', { name: 'Enable Edit Field with 5' });
    }

    /** locator for the textbox on the page */
    private get textFieldLocator(): Locator {
        return this.page.getByRole('textbox', { name: 'Edit Field' });
    }

    /**
     * Condition(s) to wait for when navigating to the page or waiting for it to load
     * Automatically invoked when using `this.navigateToByUrl()`
     */
    @Interaction('visibility_check', 'pageHeader')
    public async waitForPageLoad(): Promise<void> {
        await expect(this.pageHeader, `Disabled Input header should be visible`).toBeVisible();
    }

    /**
     * Click the button that disables the textbox
     */
    public async disableTextbox(): Promise<void> {
        await this.safeClick(this.buttonLocator);
    }

    /**
     * Fill the textbox that is conditionally disabled by the button click
     * Textbox is enabled again 5 seconds after button click
     *
     * For demo purposes, function automatically waits 6 seconds before failing
     * pass a shorter wait time to the function to simulate a failure due to
     * textbox being disabled
     *
     * @param value - value to enter into the textbox
     * @param waitTime - time to wait (ms) before failing the test  (field is enabled after 5 seconds)
     */
    public async fillTextbox(value: string, waitTime: number = 6000): Promise<void> {
        await this.safeFill(this.textFieldLocator, value, waitTime);
    }

    /**
     * An example of fillTextbox with Retry decorator that will succeed
     * after several attempts
     * @param value
     */
    @Retry({
        attempts: 3,
        delay: 2000,
        onRetry(error, attempt) {
            Logger.warn(`Attempting to fill a disabled textbox. Attempt ${attempt} of 3`);
        },
    })
    public async fillTextboxWithRetry(value: string): Promise<void> {
        await this.safeFill(this.textFieldLocator, value, 2000);
    }
}
