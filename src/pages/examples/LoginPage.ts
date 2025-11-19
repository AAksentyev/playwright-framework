import { expect, Page } from '@playwright/test';
import { Logger } from '@utils/logger.ts';
import { BasePage } from '@pages/base/BasePage.ts';

/**
 * Example Page Object Model with the text input
 *
 */
export class LoginPage extends BasePage {
    constructor(protected page: Page) {
        super(page, 'LoginPage');
    }

    /**
     * Defined non-null page url
     * Allows the use of `this.navigateToByUrl()` when using this POM
     */
    protected get url(): string | null {
        return '/sampleapp';
    }

    /** Locator for the username textbox on the page */
    private get usernameTextbox() {
        return this.page.getByRole('textbox', { name: 'User Name' });
    }

    /** locator for the  password textbox on the page */
    private get passwordTextbox() {
        return this.page.locator('input[type="password"]');
    }

    /** Locator for the Log In button on the page */
    private get logInButton() {
        return this.page.getByRole('button', { name: 'Log In' });
    }

    /**
     * Condition(s) to wait for when navigating to the page or waiting for it to load
     * Automatically invoked when using `this.navigateToByUrl()`
     */
    public async waitForPageLoad(): Promise<void> {
        await expect(this.page.getByRole('heading', { name: 'Sample App' })).toBeVisible();
    }

    /**
     *  Enter the value in the username textbox on the page
     * @param username
     */
    public async fillUsername(username: string) {
        await this.safeFill(this.usernameTextbox, username);
    }

    /**
     *  Enter the value in the password textbox on the page
     * @param value
     */
    public async fillPassword(password: string) {
        await this.safeFill(this.passwordTextbox, password);
    }

    /**
     * Click the button on the page that changes
     * its label based on the value entered in the textbox
     */
    public async clickLogIn() {
        await this.safeClick(this.logInButton);
    }

    /**
     * Fill out and submit the login form
     */
    public async logIn(username: string, password: string, timeout: number = 10000) {
        Logger.debug(`Performing login actions on the Login page for username '${username}'`);
        await this.fillUsername(username);
        await this.fillPassword(password);
        await this.clickLogIn();

        //wait for login processing.
        // this is just an example.
        await expect(
            this.page.getByText(`Welcome, ${username}!`),
            'Login failed. Did not see the Login success message.'
        ).toBeVisible({ timeout });
    }
}
