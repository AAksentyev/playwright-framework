import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '@pages/base/BasePage.ts';
import { Interaction } from '@utils/reporters/heatmap/interaction.ts';
import { Step } from '@decorators/step.ts';
import {
    ElementSetting,
    ElementSettingOption,
    ElementStates,
    ElementType,
    ElementTypeOption,
} from '@pages/base/BaseLocatorSettings.t.ts';

// Available durations for the Apply button
export type ApplyDuration = 3 | 5 | 10;

export const TargetSelectOptions = {
    item1: 'Item 1',
    item2: 'Item 2',
    item3: 'Item 3',
} as const;

type TargetSelectOption = (typeof TargetSelectOptions)[keyof typeof TargetSelectOptions];

/**
 * Auto-wait page POM
 *
 */
export class AutoWaitPage extends BasePage {
    private currentTarget: Locator;

    // list of possible target element locators that can be selected from element type select
    private targetElements: Record<keyof typeof ElementType, Locator>;

    constructor(protected page: Page) {
        super(page, 'AutoWaitPage');

        this.targetElements = {
            button: this.page.locator('button#target'),
            input: this.page.locator('input#target'),
            textarea: this.page.locator('textarea#target'),
            select: this.page.locator('select#target'),
            label: this.page.locator('label#target'),
        };

        // button is the default selected locator.
        this.currentTarget = this.targetElements.button;
        this.heatmapStateName = 'button';
    }

    /**
     * Defined non-null page url
     * Allows the use of `this.navigateToByUrl()` when using this POM
     */
    protected get url(): string | null {
        return '/autowait';
    }

    /** page header */
    private get pageHeader(): Locator {
        return this.page.getByRole('heading', { name: 'Auto Wait' });
    }
    /** Locator for the input type select */
    private get inputTypeSelectLocator(): Locator {
        return this.page.getByLabel('Choose an element type:');
    }

    /** Locators for the buttons on the page */
    // apply 3 second delay button
    private get apply3BtnLocator(): Locator {
        return this.page.locator('#applyButton3');
    }
    // apply 5 second delay button
    private get apply5BtnLocator(): Locator {
        return this.page.locator('#applyButton5');
    }
    // apply 10 second delay button
    private get apply10BtnLocator(): Locator {
        return this.page.locator('#applyButton10');
    }

    /**
     * Return the operation status div locator
     * can be used to verify that the operations were successful
     * @returns
     */
    public get operationStatusLocator(): Locator {
        return this.page.locator('div#opstatus');
    }

    /**
     * Select the input type from the select dropdown
     * and set our currently active target to the selected one
     * @param option
     */
    @Step('Select element type option')
    public async selectInputType(option: ElementTypeOption) {
        await this.safeSelectOption(this.inputTypeSelectLocator, ElementType[option]);

        this.currentTarget = this.targetElements[option];
        this.heatmapStateName = option;
    }

    /**
     * toggle checkboxes we were passed to the expected state.
     * if checkbox wasn't passed, take no action on it and leave as default
     *
     * compares against current state of the checkbox prior to toggling
     * @param options - key-value pairs of available options with the expected final state of the checkbox as the value
     */
    @Step('Toggle checkbox states')
    public async toggleCheckboxes(options: Partial<ElementStates>) {
        // iterate over the options we were passed and cast it to the proper type
        for (const opt of Object.keys(options) as ElementSettingOption[]) {
            const label = ElementSetting[opt];
            const checkBoxLocator = this.page.getByRole('checkbox', { name: label, exact: true });
            const isChecked = await checkBoxLocator.isChecked();

            // toggle the checkbox as needed if the state doesn't match
            if (isChecked !== options[opt]) {
                isChecked
                    ? await this.safeUncheck(checkBoxLocator)
                    : await this.safeCheck(checkBoxLocator);
            }
        }
    }

    /** return the current expected selected target */
    public getCurrentTarget(): Locator {
        return this.currentTarget;
    }

    /**
     * Click the appropriate 'Apply' button with the given duration
     * Page has buttons with 3s, 5s, and 10s option
     *
     * @param duration one of the available durations
     */
    public async clickApplyButton(duration: ApplyDuration): Promise<void> {
        // check if the getter exists for our apply button
        const btnLocator = this[`apply${duration}BtnLocator`];
        if (!btnLocator)
            throw new Error(`No getter found for 'Apply' button with duration ${duration}`);

        await this.safeClick(btnLocator);

        // before we proceed, wait for the DOM to update after the action
        await this.page
            .getByText(`Target element settings applied for ${duration} seconds.`)
            .waitFor();
    }

    /**
     * Returns the selected target's current properties
     * that could be toggled using the checkbox
     *
     */
    public async getCurrentTargetProperties(): Promise<ElementStates> {
        return await this.getLocatorProperties(this.currentTarget, { native: true });
    }

    /**
     * return the expected default state of the target locator
     * @returns
     */
    public getCurrentTargetDefaultProperties(): ElementStates {
        return {
            visible: true,
            enabled: true,
            editable: true,
            onTop: true,
            nonZeroSize: true,
        };
    }

    /** Target Locator Actions */
    public async clickTargetLocator() {
        await this.safeClick(this.currentTarget);
    }

    public async fillTargetLocator(value: string, blurAfterFill: boolean = false) {
        await this.safeFill(this.currentTarget, value);

        // if we need to unfocus after filling the locator
        // click on the body node
        if (blurAfterFill) await this.page.locator('body').click();
    }

    public async selectTargetLocatorOption(opt: TargetSelectOption) {
        await this.safeSelectOption(this.currentTarget, opt);
    }

    /**
     * Condition(s) to wait for when navigating to the page or waiting for it to load
     * Automatically invoked when using `this.navigateToByUrl()`
     */
    @Interaction('visibility_check', 'pageHeader')
    public async waitForPageLoad(): Promise<void> {
        await expect(this.pageHeader, `Auto Wait header should be visible`).toBeVisible();
    }
}
