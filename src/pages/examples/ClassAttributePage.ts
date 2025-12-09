import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '@pages/base/BasePage.ts';
import { Interaction } from '@utils/reporters/heatmap/interaction.ts';

/**
 * Example Page Object Model for the Class Attribute page
 *
 */
export class ClassAttributePage extends BasePage {
    
    constructor(protected page: Page) {
        super(page, 'ClassAttribute');
    }

    /**
     * Defined non-null page url
     * Allows the use of `this.navigateToByUrl()` when using this POM
     */
    protected get url(): string | null {
        return '/classattr';
    }

    @Interaction('visibility_check', 'pageHeader')
    public async waitForPageLoad(): Promise<void> {
        await expect(this.pageHeader, `Resources header should be visible`).toBeVisible();
    }

    /** page header locator */
    private get pageHeader(): Locator {
        return this.page.getByRole('heading', { name: 'Class Attribute' });
    }

    /** Locator for the button with the success class */
    private get successBtnLocator(): Locator {
        return this.page.locator('button.btn-success');
    }

    /** Locator for the button with the warning class */
    private get warningBtnLocator(): Locator {
        return this.page.locator('button.btn-warning');
    }

    /** Locator for the button with the primary class */
    private get primaryBtnLocator(): Locator {
        return this.page.locator('button.btn-primary');
    }

    /**
     * Click the button with success class
     */
    public async clickSuccessButton():Promise<void> {
        await this.safeClick(this.successBtnLocator);
    }

    /**
     * Click the button with the warning class
     */
    public async clickWarningButton():Promise<void> {
        await this.safeClick(this.warningBtnLocator);
    }

    /**
     * Click the button with the primary class
     */
    public async clickPrimaryButton():Promise<void> {
        await this.safeClick(this.primaryBtnLocator);
    }
    
}
