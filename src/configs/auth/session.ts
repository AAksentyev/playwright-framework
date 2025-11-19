/** How long the user's session is valid for. Update as needed */
export const SESSION_LIFETIME_MS: number = 10 * 60 * 1000;
/** How often the session manager should check if the session requires a refresh */
export const SESSION_CHECK_INTERVAL_MS: number = 3 * 60 * 1000;
/** How long before the expiration the session should be refreshed to ensure the session doesn't expire mid-run. */
export const SESSION_REFRESH_BUFFER_MS: number = 3 * 60 * 1000;

/** artifacts path where the saved session information will be stored */
export const ARTIFACTS_PATH: string = 'tests/__artifacts';

/** session storage file name string template
 * Used by SessionManager with sprintf to generate the final name
 * Currently just has the workerIndex since we're tracking per worker,
 * but can be enhanced as needed.
 */
export const SESSION_STORAGE_FILE: string = 'storageState-worker-%d.json';
