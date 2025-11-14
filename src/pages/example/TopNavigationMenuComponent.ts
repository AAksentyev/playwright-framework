import { BaseComponent } from '@pages/base/BaseComponent.ts';
import { Locator, Page } from '@playwright/test';

export class TopNavigationMenuComponent extends BaseComponent {
    constructor(protected page: Page) {
        super(
            page, 
            'TopNavigationMenuComponent', 
            page.getByRole('navigation', { name: 'Main' })
        );
    }

    private get dropdownMenu(): Locator {
        return this.root.locator('.dropdown__menu');
    }

    public async expandMenu(label: string, state: boolean = true) {
        await this.safeHover(this.root.getByRole('button', { name: label, exact: true }));
        await this.waitForVisible(this.dropdownMenu);
    }

    public async clickMenuOption(label: string) {
        await this.safeClick(this.root.getByRole('link', { name: label, exact: true }));
    }

    public async selectDropdownOption(dropdownLabel: string, optLabel: string) {
        await this.expandMenu(dropdownLabel);
        await this.safeClick(this.dropdownMenu.getByRole('link', { name: optLabel, exact: true }));
    }
}
