import { expect, Locator, Page } from '@playwright/test';
import { Logger } from '@utils/logger.ts';
import { Retry } from '@decorators/actionRetry.ts';
import { BasePage } from '@pages/base/BasePage.ts';
import { Interaction } from '@utils/reporters/heatmap/interaction.ts';

/**
 * List of available link names on the page
 * This is not a full list and is just used as an example
 * for making clickPageLink typesafe during compile time
 * so that only available pages show up.
 *
 * @todo externalize to a separate file with appropriate config
 */
type AvailableLinks =
    | 'Dynamic ID'
    | 'AJAX Data'
    | 'Click'
    | 'Text Input'
    | 'Load Delay'
    | 'Mouse Over'
    | 'Sample App';
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

    /** page header locator */
    private get pageHeader():Locator{
        return this.page.getByRole('heading', { name: 'UI Test Automation Playground' })
    }
    /**
     * Condition(s) to wait for when navigating to the page or waiting for it to load
     * Automatically invoked when using `this.navigateToByUrl()`
     */
    @Interaction('visibility_check', 'pageHeader')
    public async waitForPageLoad(): Promise<void> {
        await expect(
            this.pageHeader,
            `UI Test Automation Playground home page header should be visible`
        ).toBeVisible();
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

    /**
     * Click on the section link on the Home Page grid
     * These links navigate you to different pages across the demo site
     * @param linkName
     */
    @Retry({ attempts: 2, delay: 1000 })
    public async clickPageLink(linkName: AvailableLinks): Promise<void> {
        await this.safeClick(
            this.page.locator('div.container').getByRole('link', { name: linkName, exact: true })
        );
    }
}
