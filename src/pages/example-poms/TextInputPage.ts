import { BasePage } from '@pages/base/BasePage.ts';
import { expect, Page } from '@playwright/test';
import { Logger } from '@utils/logger.ts';


/**
 * Example Page Object Model with the text input
 *
 */
export class TextInputPage extends BasePage {

    constructor(protected page: Page) {
        super(page, 'TextInputPage');

    }

    /**
     * Defined non-null page url
     * Allows the use of `this.navigateToByUrl()` when using this POM
     */
    protected get url(): string | null {
        return '/textinput';
    }

    /** Locator for the textbox on the page */
    private get textboxLocator(){
        return this.page.getByRole('textbox', { name: 'Set New Button Name' });
    }

    /** Locator for the button on the page */
    private get buttonLocator(){
        return this.page.locator('#updatingButton');
    }
    /**
     * Condition(s) to wait for when navigating to the page or waiting for it to load
     * Automatically invoked when using `this.navigateToByUrl()`
     */
    public async waitForPageLoad(): Promise<void> {
        await expect(this.page.getByRole('heading', { name: 'Text Input' })).toBeVisible();
    }

    /**
     *  Enter the value in the textbox on the page
     * @param value 
     */
    public async fillTextbox(value:string) {
        Logger.debug(`Entering value '${value}' into textbox on the Text Input page`)
        await this.safeFill(this.textboxLocator, value)
    }

    /**
     * Click the button on the page that changes 
     * its label based on the value entered in the textbox
     */
    public async clickButton(){
        await this.safeClick(this.buttonLocator);
    }

    /**
     * Get the text of the button
     * @returns 
     */
    public async getButtonText():Promise<string>{
        return this.buttonLocator.innerText();
    }
}
