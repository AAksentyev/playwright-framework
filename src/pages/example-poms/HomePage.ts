import { Retry } from '@decorators/actionRetry.ts';
import { BasePage } from '@pages/base/BasePage.ts';
import { expect, Page } from '@playwright/test';
import { Logger } from '@utils/logger.ts';

type AvailableLinks = 'Dynamic ID' | 'AJAX Data' | 'Click' | 'Text Input' | 
                    'Load Delay' | 'Mouse Over';
/**
 * Example Page Object Model using the Playwright site
 * Provides examples on how to implement base classes and decorators
 *
 */
export class HomePage extends BasePage {
    constructor(protected page: Page) {
        super(page, 'HomePage');
    }

    /**
     * Defined non-null page url
     * Allows the use of `this.navigateToByUrl()` when using this POM
     */
    protected get url(): string | null {
        return '/';
    }

    /**
     * Condition(s) to wait for when navigating to the page or waiting for it to load
     * Automatically invoked when using `this.navigateToByUrl()`
     */
    public async waitForPageLoad(): Promise<void> {
        await expect(this.page.getByRole('heading', { name: 'UI Test Automation Playground' })).toBeVisible();
    }

    /**
     * Example method that will always fail.
     * The `@Retry` decorator will automatically retry this method a given number of attempts
     *
     */
    @Retry({ attempts: 3, delay: 1000 })
    public async exampleRetryWithoutCallback(): Promise<void> {
        await this.safeClick(this.page.getByRole('link', { name: 'missing link' }));
    }

    /**
     * Example method that will always fail.
     * The `@Retry` decorator will automatically retry this method a given number of attempts
     * After *each* retry it will also execute the passed onRetry callback
     */
    @Retry({
        attempts: 2,
        delay: 500,
        onRetry(error, attempt) {
            Logger.warn(
                `This message is being logged from the @Retry callback! doSomethingElse has failed. Attempt: ${attempt}`
            );
        },
    })
    public async exampleRetryWithCallback(): Promise<void> {
        await this.safeFill(this.page.getByRole('textbox', { name: 'missing textbox' }), 'value');
    }


    @Retry({ attempts: 2, delay: 1000 })
    public async clickPageLink(linkName:AvailableLinks): Promise<void> {
        await this.safeClick(this.page.locator('div.container').getByRole('link', { name: linkName, exact:true }));
    }
}
