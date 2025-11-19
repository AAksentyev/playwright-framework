import { Page } from '@playwright/test';
import { BaseComponent } from '@pages/base/BaseComponent.ts';

/**
 * Example component for a top navigation menu that is persistent across multiple pages
 * Extends the `BaseComponent` class to inherit the basic actions that a component should have
 * similar to the `BasePage` but more lightweight without unnecessary methods and properties
 * like url and navigation
 *
 * Each component gets its own interaction heatmap report
 */
export class TopNavigationMenuComponent extends BaseComponent {
    constructor(protected page: Page) {
        super(page, 'TopNavigationMenuComponent', page.getByRole('navigation'));
    }

    // click the navigation menu option
    public async clickMenuOption(label: string) {
        await this.safeClick(this.root.getByRole('link', { name: label, exact: true }));
    }
}
