import { expect, Locator, Page } from '@playwright/test';
import { BaseLocator } from './BaseLocator.ts';

/**
 * BaseComponent class that all component objects should extend.
 * Inherits safe interaction methods from BaseLocator.
 *
 * Allows defining a root locator for the component to scope interactions within that component to avoid interaction collisions across the page.
 * Root locator can be defined either as a string selector for simple scenarios or as a Playwright Locator for more complex structures.
 *
 * @category Base Classes
 * @subcategory Base Component
 *
 * @example Defining a component with a string selector as the root locator
 * ```typescript
 * import { BaseComponent } from './BaseComponent.ts';
 *
 * export class HeaderComponent extends BaseComponent {
 *      constructor(page: Page) {
 *          // Assuming the header component can be identified by a 'header' tag
 *          super(page, 'header');
 *      }
 *     public async waitForComponentLoad(): Promise<void> {
 *         await expect(this.root).toBeVisible();
 *     }
 * }
 *
 * // Usage
 * const header = new HeaderComponent(page);
 * await header.waitForComponentLoad();
 * ```
 *
 *
 * @example Defining a component with a Locator as the root locator
 * ```typescript
 * import { BaseComponent } from './BaseComponent.ts';
 *
 * export class FooterComponent extends BaseComponent {
 *      private footerLocator: Locator;
 *     constructor(page: Page) {
 *         // Define a complex locator for the footer component
 *         const footerLocator = page.getByRole('contentinfo').locator('.footer-main');
 *         super(page, footerLocator);
 *    }
 *   public async waitForComponentLoad(): Promise<void> {
 *        await expect(this.root).toBeVisible();
 *   }
 * }
 *
 * // Usage
 * const header = new HeaderComponent(page);
 * await header.waitForComponentLoad();
 * ```
 *
 */
export abstract class BaseComponent extends BaseLocator {
    readonly root: Locator;

    constructor(
        protected page: Page,
        private rootLocator: string | Locator
    ) {
        super();
        // initialize the root component
        this.root = this.setRootLocator();
    }

    /**
     * Sets the root locator based on whether a string or Locator was provided.
     * @returns 
     */
    private setRootLocator(): Locator {
        if (typeof this.rootLocator === 'string') {
            return this.page.locator(this.rootLocator);
        } else {
            return this.rootLocator;
        }
    }

    /**
     * Checks if the component is fully loaded. Can be overridden by subclasses to define specific conditions that indicate the component is ready for interaction.
     *
     * By default, it checks if the root locator is visible.
     *
     * @example Verifying load state using other locators within the component
     * ```typescript
     * export class HeaderComponent extends BaseComponent {
     *      public async waitForComponentLoad(): Promise<void> {
     *          await expect(this.root).toBeVisible();
     *      }
     * }
     * ```
     */
    public async waitForComponentLoad(): Promise<void> {
        await expect(this.root, "Component's root locator is not visible").toBeVisible();
    }
}
