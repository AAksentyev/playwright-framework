import { BaseComponent } from "@pages/base/BaseComponent.ts";
import { expect, Page } from "@playwright/test";


export class SideNavigationMenuComponent extends BaseComponent {

    constructor(protected page:Page){
        super( page, page.getByRole('navigation', { name: 'Docs sidebar' }) )
    }

    public async expandMenu(label:string, state:boolean=true){
        const btn = this.root.getByRole('button', { name: label, exact: true })
        await this.safeClick(btn);
        expect(await btn.getAttribute('aria-expanded')).toEqual(String(state))
    }

    public async clickMenuOption(label:string){
        await this.safeClick(this.root.getByRole('link', { name: label, exact: true }));
    }

}
