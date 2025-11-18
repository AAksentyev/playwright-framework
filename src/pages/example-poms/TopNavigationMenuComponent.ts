import { BaseComponent } from '@pages/base/BaseComponent.ts';
import { Page } from '@playwright/test';

export class TopNavigationMenuComponent extends BaseComponent {
    constructor(protected page: Page) {
        super(page, 'TopNavigationMenuComponent', page.getByRole('navigation'));
    }

    public async clickMenuOption(label: string) {
        await this.safeClick(this.root.getByRole('link', { name: label, exact: true }));
    }
}
