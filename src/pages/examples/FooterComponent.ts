import { expect, Locator, Page } from '@playwright/test';
import { BaseComponent } from '@pages/base/BaseComponent.ts';
import { Logger } from '@utils/logger.ts';


export const FOOTER_LINKS = {
    FORK_SITE: {
        linkLabel: 'Fork the website on GitHub',
        siteUrl: 'https://github.com/inflectra/ui-test-automation-playground',
        siteName: 'GitHub - Inflectra/ui-test-automation-playground: UI Test Automation Playground',
    },
    RAPISE: {
        linkLabel: 'Rapise',
        siteUrl: 'https://www.inflectra.com/Products/Rapise/',
        siteName: 'AI-Driven Automated Software Testing Tool - Inflectra',
    },
    INFLECTRA_CORP: {
        linkLabel: 'Inflectra Corporation',
        siteUrl: 'https://www.inflectra.com/',
        siteName: 'Inflectra | Software For Managing Quality, Delivery, & Risk',
    },
    APACHE_LICENSE: {
        linkLabel: ' Apache License 2.0',
        siteUrl: 'https://www.apache.org/licenses/LICENSE-2.0',
        siteName: 'Apache License, Version 2.0 | Apache Software Foundations',
    },
} as const;


/**
 * Example component for the footer
 */
export class FooterComponent extends BaseComponent {
    constructor(protected page: Page) {
        super(page, 'FooterComponent', page.locator('#footer'));
    }

    /**
     * Get the inner text of the footer component
     * @returns 
     */
    public async getFooterText(){
        await expect(this.root).toBeVisible();
        return this.root.innerText()
    }
    /**
     * Click the link in the footer
     * @param key - key of predefined available URLs
     */
    public async clickFooterLink(key: keyof typeof FOOTER_LINKS): Promise<void> {
        const link = FOOTER_LINKS[key];

        Logger.debug(`Clicking on the ${key} link in the footer`);
        await this.safeClick(
            this.root.getByRole('link', { name: link.linkLabel, exact: true })
        );
    }
}
