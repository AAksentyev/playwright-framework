import { Logger } from "@utils/logger.ts";
import { SessionManager } from "./SessionManager.ts";
import { BrowserContext, Page } from "@playwright/test";
import { LoginPage } from "@pages/example-poms/LoginPage.ts";
import fs from 'fs';
import { ARTIFACTS_PATH } from "@configs/auth/session.ts";
import { SCREENSHOT_PATH } from "@configs/reports/reporters.config.ts";

/**
 * Perform login actions (or API call) to start a new authenticated session
 * and save the new session in session manager + session storage
 * @param sessionManager 
 * @param page 
 * @param username 
 */
export async function doFreshLoginAndSave(sessionManager:SessionManager, context:BrowserContext, page:Page, username:string, password:string) {
  const loginPage = new LoginPage(page);
  await loginPage.navigateToByUrl();
  await loginPage.logIn(username, password);
  await sessionManager.saveSession(context, username);
  Logger.info("Session freshly logged in and saved.");
}

/**
 * Tear down the session for the user (by logging out or otherwise invalidating the token)
 * and remove the saved session from session manager and the session storage for the worker.
 * @param sessionManager 
 * @param page 
 * @param username 
 */
export async function tearDownSessionAndClear(sessionManager:SessionManager, page:Page, username:string) {

    Logger.info(`Performing actions to tear down the session for username ${username}`);
    /** Perform actions here that would log out or clear the session in the browser */

    // clear the saved session for this username from the session manager
    sessionManager.clearSession(username);
    Logger.info("Session cleared");
}

/**
 * Clean up the artifacts folder so all the saved sessions are deleted.
 * This is called in global.teardown.ts
 */
export function cleanUpTestArtifacts() {
  Logger.info('Cleaning up generated artifacts...')
  fs.rmdirSync(ARTIFACTS_PATH, { recursive: true }); 
  //fs.rmdirSync(SCREENSHOT_PATH, { recursive: true }); 
  
}