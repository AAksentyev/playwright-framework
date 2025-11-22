import { Locator, Page } from '@playwright/test';
import { BaseLocator } from './BaseLocator.ts';

/**
 * BasePage class that all page objects should extend.
 * Inherits safe interaction methods from BaseLocator.
 * @category Base Classes
 * @subcategory Base Page
 *
 */
export abstract class BasePage extends BaseLocator {
    readonly root: Locator | Page;

    constructor(
        protected page: Page,
        protected pageName: string,
        private rootLocator?: string | Locator
    ) {
        super(page, pageName);
        this.root = this.setRootLocator();
    }

    /**
     * Set the root locator for the page.
     * If the rootLocator is not defined, it will set it to Page
     * 
     * Intended to potentially exclude any persistent components on the page and instead
     * focus only on the unique page component/viewport.
     * 
     * @returns 
     */
    private setRootLocator(): Locator | Page {
        if (! this.rootLocator)
            return this.page;

        return typeof this.rootLocator === 'string'
            ? this.page.locator(this.rootLocator)
            : this.rootLocator;
    }

    /**
     * URL of the page. Should be overridden by subclasses. Return null if URL is not defined or is not applicable for the page.
     * @returns {string | null} - The URL of the page or null if not set.
     * @example
     * ```typescript
     * export class HomePage extends BasePage {
     *      protected get url(): string {
     *          return '/home';
     *      }
     * }
     * ```
     */
    protected abstract get url(): string | null;

    /**
     * Checks if the page is fully loaded. Should be implemented by subclasses to define specific conditions that indicate the page is ready for interaction.
     * @example
     * ```typescript
     * export class HomePage extends BasePage {
     *      public async waitForPageLoad(): Promise<void> {
     *          await expect(this.page.getByRole('heading', { name: 'Welcome to Home Page' })).toBeVisible();
     *      }
     * }
     * ```
     */
    public abstract waitForPageLoad(): Promise<void>;

    /**
     * Navigates to the page using the URL defined in the `url` getter.
     * Throws an error if the URL is not defined.
     * @example
     * ```typescript
     * export class HomePage extends BasePage {
     *      // implemented getter for url with the relative url path
     *      protected get url(): string {
     *          return '/home';
     *      }
     * }
     *
     * // Usage
     * const homePage = new HomePage(page);
     * await homePage.navigateToByUrl();
     *
     * ```
     */
    public async navigateToByUrl(): Promise<void> {
        // if url is not defined, throw an error
        if (this.url == null) {
            throw new Error(
                'URL is not defined for this page. Cannot navigate by URL. Please override the url getter in the subclass with a non-null return value or use navigateBy.'
            );
        }

        await this.page.goto(this.url);
        await this.waitForPageLoad();
    }

    /**
     * Navigates to the page by performing user actions. Alternative to navigateToByUrl when URL is not defined or navigation requires user interaction due to application flow.
     * This may be useful for SPAs or other scenarios where direct URL navigation is not feasible.
     *
     * This method should be overridden by subclasses to define specific user actions needed to reach the page.
     * @example
     * ```typescript
     * export class DashboardPage extends BasePage {
     *     constructor(private page: Page) {
     *         super(page);
     *     }
     *
     *      // URL not defined for this page
     *      private get url(): string | null { return null; } // URL not defined
     *
     *      // Override navigateToByAction to define user actions for navigation
     *      public async navigateToByAction() {
     *          const navigationMenu = new NavigationMenu(this.page);
     *          await this.safeClick(dashboardLink);
     *      }
     * }
     * ```
     */
    public async navigateToByAction(): Promise<void> {
        throw new Error(
            'navigateToByAction method not implemented. Please override this method in the subclass to define navigation by user action.'
        );
    }
}
