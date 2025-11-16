import { Interaction } from '@decorators/interaction.ts';
import { expect, Locator, Page } from '@playwright/test';

/**
 * BaseLocator class provides common locator actions with built-in safety checks.
 * Extends Playwright's Locator functionalities to include visibility and enablement checks
 * before performing actions like click and fill.
 *
 * Each page object or component class should extend this BaseLocator to inherit these safe interaction methods
 *
 * @category Base Classes
 * @subcategory Base Locator
 * @example
 * ```typescript
 * import { BaseLocator } from './BaseLocator.ts';
 *
 * export class ExamplePageObject extends BaseLocator {
 *      constructor(private page: Page) {
 *          super();
 *      }
 *
 *      // Example button and input locators
 *      private myButton: Locator = this.page.getByRole('button', { name: 'Submit' });
 *      private myInput: Locator = this.page.getByRole('textbox', { name: 'Username'});
 *
 *      // Example method to fill an input safely
 *      async fillUsername(value: string) {
 *           await this.safeFill(this.myInput, value);
 *      }
 *
 *      // Example method to click a button safely
 *      async clickMyButton() {
 *         await this.safeClick(this.myButton);
 *      }
 *
 * }
 * ```
 */
export abstract class BaseLocator {
    constructor(
        protected page: Page,
        protected readonly pageObjectName: string
    ) {}

    /**
     * Clicks the locator after waiting for it to be visible.
     * Ensures that the element is interactable before clicking.
     * @param locator - locator that is being clicked
     */
    @Interaction('click')
    protected async safeClick(locator: Locator, timeout: number = 5000) {
        await expect(locator, 'Locator being clicked is not visible').toBeVisible({ timeout });
        await expect(locator, 'Locator being clicked is not enabled').toBeEnabled({ timeout });

        // perform the click action
        await locator.click();
        await this.page.waitForLoadState('networkidle');
    }

    /**
     * Hovers the locator after waiting for it to be visible.
     * Ensures that the element is interactable before hovering.
     * @param locator - locator that is being hovered
     */
    @Interaction('hover')
    protected async safeHover(locator: Locator, timeout: number = 5000) {
        await expect(locator, 'Locator being hovered is not visible').toBeVisible({ timeout });
        await expect(locator, 'Locator being hovered is not enabled').toBeEnabled({ timeout });

        // perform the hover action
        await locator.hover();
    }

    /**
     * Fills the locator with the specified value after ensuring it is visible and enabled.
     * @param locator - Locator that is being filled
     * @param value - Value to fill the locator with
     */
    @Interaction('fill')
    protected async safeFill(locator: Locator, value: string, timeout: number = 5000) {
        await expect(locator, 'Locator being filled is not visible').toBeVisible({ timeout });
        await expect(locator, 'Locator being filled is not enabled').toBeEnabled({ timeout });

        // perform the fill action
        await locator.fill(value);
    }

    /**
     * Waits for locator to become visible
     * @param locator - Locator to wait for
     * @param timeout - optional override for the time (default 10s)
     */
    protected async waitForVisible(locator: Locator, timeout: number = 10000) {
        await locator.waitFor({ state: 'visible', timeout });
    }

    /**
     * Waits for locator to become hidden
     * @param locator - Locator to wait for
     * @param timeout - optional override for the time (default 10s)
     */
    protected async waitForHidden(locator: Locator, timeout: number = 10000) {
        await locator.waitFor({ state: 'hidden', timeout });
    }
}
