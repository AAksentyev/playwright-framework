import { BrowserContext, Cookie, Page } from '@playwright/test';

/**
 * Return true if the current browser context has the expected cookie
 *
 * @export
 * @param {BrowserContext} context
 * @param {string} name
 * @returns {Promise<boolean>}
 */
export async function hasCookie(context: BrowserContext, name: string): Promise<boolean> {
    const cookies = await context.cookies();
    return cookies.some((c) => c.name === name);
}

/**
 * Returns the value of the cookie given the cookie name
 *
 * @export
 * @param {BrowserContext} context
 * @param {string} name
 * @returns
 */
export async function getCookie(context: BrowserContext, name: string) {
    const cookies = await context.cookies();
    return cookies.find((c) => c.name === name);
}

/** Overload signatures to allow setting cookies either to browser context or per page */
// disable lint errors for this block since it is valid in typescript
/* eslint-disable no-redeclare */
export async function setCookies(page: Page, cookies: Cookie[]): Promise<void>;
export async function setCookies(context: BrowserContext, cookies: Cookie[]): Promise<void>;

/** Implementation */
export async function setCookies(target: Page | BrowserContext, cookies: Cookie[]): Promise<void> {
    if ('context' in target) {
        // target is a Page
        await target.context().addCookies(cookies);
    } else {
        // target is a BrowserContext
        await target.addCookies(cookies);
    }
}
/* eslint-enable no-redeclare */
