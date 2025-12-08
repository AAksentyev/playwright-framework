import { Page } from "@playwright/test";

export interface AlertOptions {
  timeout?: number;
  accept?: boolean;     // default=true
  messageContains?: string; // optional text assertion
}


/**
 * Check if alert appeared (returns true/false).
 * Does NOT throw — good for optional alerts.
 */
export async function checkAlert(page: Page, action: () => Promise<any>, opts: AlertOptions = {}): Promise<boolean> {
    const { timeout = 1500, accept = true } = opts;

    return new Promise<boolean>(async resolve => {
        
        const listener = async (dialog: any) => {
            page.off('dialog', listener);
            accept ? await dialog.accept() : await dialog.dismiss();
            resolve(true);
        };

        page.on('dialog', listener);

        // Run the triggering action
        await action();

        // If no alert within timeout -> resolve false
        setTimeout(() => {
            page.off('dialog', listener);
            resolve(false);
        }, timeout);
    });
}


/**
 * Assert that an alert must appear.
 * Returns the alert message text.
 * @param page Playwright `Page`
 * @param action action that should trigger the alert
 * @param opts options object to very the alert
 * @returns 
 */
export async function expectAlert(page: Page, action: () => Promise<any>, opts: AlertOptions = {}): Promise<string> {
    const { timeout = 2000, accept = true, messageContains } = opts;

    const dialog = await Promise.race([
        page.waitForEvent('dialog', { timeout }),
        action().then(() => null)
    ]);

    if (!dialog) {
        throw new Error(`❌ Expected alert, but none appeared within ${timeout}ms`);
    }

    const msg = dialog.message();

    if (messageContains && !msg.includes(messageContains)) {
        throw new Error(
            `❌ Alert text mismatch.
            Expected to include: "${messageContains}"
            Received: "${msg}"`
        );
    }

    accept ? await dialog.accept() : await dialog.dismiss();
    return msg;
}

/**
 * Asser that the alert does not appear
 * @param page Playwright `Page`
 * @param action action after which the check is performed
 * @param opts Alert options (timeout to wait for before performing the check)
 */
export async function expectNoAlert(page: Page, action: () => Promise<any>, opts: AlertOptions = {}): Promise<void> {
    const { timeout = 1500 } = opts;
    const alertShown = await checkAlert(page, action, { timeout });
    if (alertShown) {
        throw new Error(`❌ Unexpected alert appeared`);
    }
}