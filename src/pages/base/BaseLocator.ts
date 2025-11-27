import { expect, Locator, Page } from '@playwright/test';
import { Interaction } from '@utils/reporters/heatmap/interaction.ts';
import { ElementStates } from './BaseLocatorSettings.t.ts';
import { Logger } from '@utils/logger.ts';
import { Step } from '@decorators/step.ts';

interface ClickOptions {
    button?: 'left' | 'right' | 'middle';
    clickCount?: number;
    delay?: number;
    force?: boolean;
    modifiers?: ('Alt' | 'Control' | 'ControlOrMeta' | 'Meta' | 'Shift')[];
    noWaitAfter?: boolean;
    position?: {
        x: number;
        y: number;
    };
    timeout?: number;
    trial?: boolean;
}

interface LocatorPropOpts {
    native: boolean;
}

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
    protected async safeClick(locator: Locator, options?: ClickOptions, timeout: number = 5000) {
        await expect(locator, 'Locator being clicked should be visible').toBeVisible({ timeout });
        await expect(locator, 'Locator being clicked should be enabled').toBeEnabled({ timeout });

        await locator.scrollIntoViewIfNeeded();

        await locator.click(options);
        await this.page.waitForLoadState('networkidle');
    }

    /**
     * double-click the locator after waiting for it to be visible.
     * Ensures that the element is interactable before clicking.
     * @param locator - locator that is being clicked
     */
    @Interaction('doubleclick')
    protected async safeDoubleClick(
        locator: Locator,
        options?: ClickOptions,
        timeout: number = 5000
    ) {
        await expect(locator, 'Locator being clicked should be visible').toBeVisible({ timeout });
        await expect(locator, 'Locator being clicked should be enabled').toBeEnabled({ timeout });

        await locator.scrollIntoViewIfNeeded();

        // perform the click action
        await locator.dblclick(options);
        await this.page.waitForLoadState('networkidle');
    }

    /**
     * Hovers the locator after waiting for it to be visible.
     * Ensures that the element is interactable before hovering.
     * @param locator - locator that is being hovered
     */
    @Interaction('hover')
    protected async safeHover(locator: Locator, timeout: number = 5000) {
        await expect(locator, 'Locator being hovered should be visible').toBeVisible({ timeout });
        await expect(locator, 'Locator being hovered should be enabled').toBeEnabled({ timeout });

        await locator.scrollIntoViewIfNeeded();

        await locator.hover();
    }

    /**
     * Fills the locator with the specified value after ensuring it is visible and enabled.
     * @param locator - Locator that is being filled
     * @param value - Value to fill the locator with
     */
    @Interaction('fill')
    protected async safeFill(locator: Locator, value: string, timeout: number = 5000) {
        await expect(locator, 'Locator being filled should be visible').toBeVisible({ timeout });
        await expect(locator, 'Locator being filled should be enabled').toBeEnabled({ timeout });
        await expect(locator, 'Locator being filled should be editable').toBeEditable({ timeout });

        await locator.scrollIntoViewIfNeeded();

        await locator.fill(value);
    }

    /**
     * check the locator. if it's a checkbox/radio button
     * @param locator - Locator that is being filled
     * @param value - Value to fill the locator with
     */
    @Interaction('check')
    protected async safeCheck(locator: Locator, timeout: number = 5000) {
        await expect(locator, 'Locator being checked should be visible').toBeVisible({ timeout });
        await expect(locator, 'Locator being checked should be enabled').toBeEnabled({ timeout });
        await expect(locator, 'Locator being checked should be editable').toBeEditable({ timeout });

        await locator.scrollIntoViewIfNeeded();

        await locator.check();
    }

    /**
     * uncheck the locator. if it's a checkbox/radio button
     * @param locator - Locator that is being unchecked
     * @param value - Value to fill the locator with
     */
    @Interaction('uncheck')
    protected async safeUncheck(locator: Locator, timeout: number = 5000) {
        await expect(locator, 'Locator being unchecked should be visible').toBeVisible({ timeout });
        await expect(locator, 'Locator being unchecked should be enabled').toBeEnabled({ timeout });
        await expect(locator, 'Locator being unchecked should be editable').toBeEditable({
            timeout,
        });

        await locator.scrollIntoViewIfNeeded();

        await locator.uncheck();
    }

    /**
     * uncheck the locator. if it's a checkbox/radio button
     * @param locator - Locator that is being unchecked
     * @param value - Value to fill the locator with
     */
    @Interaction('dragdrop')
    protected async safeDragDrop(
        locatorDragged: Locator,
        locatorTarget: Locator,
        timeout: number = 5000
    ) {
        await expect(locatorDragged, 'Locator being dragged should be visible').toBeVisible({
            timeout,
        });
        await expect(locatorDragged, 'Locator being dragged should be enabled').toBeEnabled({
            timeout,
        });

        await expect(locatorTarget, 'Destination locator should be visible').toBeVisible({
            timeout,
        });
        await expect(locatorTarget, 'Destination locator should be enabled').toBeEnabled({
            timeout,
        });

        await locatorDragged.dragTo(locatorTarget);
    }

    /**
     * Waits for the select Locator to be visible and attempts
     * to select the given option.
     * @param selectLocator select dropdown
     * @param opt option to select
     * @param timeout
     */
    @Interaction('select_option')
    protected async safeSelectOption(selectLocator: Locator, opt: string, timeout: number = 5000) {
        await expect(selectLocator, 'Select locator should be visible').toBeVisible({ timeout });
        await expect(selectLocator, 'Select locator should be enabled').toBeEnabled({ timeout });

        // ensure our option exists prior to selecting it
        const expectedOption = selectLocator.locator('option').filter({ hasText: opt });
        await expect(
            expectedOption,
            'One matching option should exist in select dropdown'
        ).toHaveCount(1);

        await selectLocator.selectOption(opt);
    }

    /**
     * Fetch the given locator's properties like visibile, enabled, etc
     * Optionally use native fetch instead of built-in Playwright API.
     *
     * This may only be necessary if you want to explicitly differentiate
     * between properties like 'readonly' and 'disabled'. Playwright's `locator.isEnabled()`
     * and `locator.isEditable()` can clash (by design) and both return
     * `false` even if only one of those criteria is met because both 'readonly' and 'disabled'
     * is treated as 'not enabled'
     *
     * Otherwise built-in Playwright API should be fine
     *
     * @param locator
     * @param native whether to use native fetch or Playwright API (playwright API is default)
     * @returns
     */
    @Step('Fetch Locator Properties')
    protected async getLocatorProperties(
        locator: Locator,
        opts: LocatorPropOpts = { native: false }
    ): Promise<ElementStates> {
        /*****************************************************************************
         * If element has non-zero size, it is considered not visible
         * by Playwright by design, so depending on our tests, these are not
         * mutually exclusive depending on how our requirements are structured.
         *
         * So be wary when you use native vs Playwright API mode.
         * If the element on the page is 'visible' but it was just set to 0px x 0px,
         * native mode will return you visible and you may need to check against nonZeroSize as well.
         *
         * If using Playwright API, you'll correctly get 'false' for visible
         ******************************************************************************/
        const { isVisible, isEnabled, isEditable } = await locator.evaluate((el) => {
            const isVisible = getComputedStyle(el).visibility === 'visible';
            const isEnabled = !el.hasAttribute('disabled');
            const isEditable = !el.hasAttribute('readonly');

            return { isVisible, isEnabled, isEditable };
        });

        /************************************************************
         * Playwright throws a very gnarly error that corrups Allure
         * (at least on my end) when locator.isEditable() is called
         * on a locator that doesn't support that proprety (such as 'label', 'button', etc)
         *
         * Wrapping this check in try/catch and falling back to native
         * if it throws. Also logging a warning in case this happens
         ***********************************************************/
        let isLocatorEditablePW = isEditable;
        // only try to fetch it if it's non-native mode to suppress the warning
        if (!opts.native) {
            try {
                isLocatorEditablePW = await locator.isEditable();
            } catch (e) {
                Logger.warn(
                    "Attempted to call locator.isEditable() on a locator that doesn't support it. Ensure this was intended. Falling back to native."
                );
            }
        }

        return {
            visible: opts.native ? isVisible : await locator.isVisible(),
            editable: opts.native ? isEditable : isLocatorEditablePW,
            enabled: opts.native ? isEnabled : await locator.isEnabled(),
            onTop: await this.page.locator('#overlay').isHidden(),
            nonZeroSize: await this.elHasNonZeroSize(locator),
        };
    }

    /**
     * Returns true if the element dimensions are non zero
     * Leverage the element bounding box and check that height _and_ width are > 0
     * @returns
     */
    private async elHasNonZeroSize(locator: Locator): Promise<boolean> {
        await expect(locator, 'Element must be attached to DOM').toBeAttached();
        const boundingBox = await locator.boundingBox();
        if (!boundingBox) {
            throw new Error('Element bounding box was not found.');
        }

        return boundingBox.height > 0 && boundingBox.width > 0;
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
