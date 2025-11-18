export const SESSION_LIFETIME_MS: number = 10 * 60 * 1000; // How long the user's session is valid for (10 minutes for the test site that is configured as an example). Update as needed
export const SESSION_CHECK_INTERVAL_MS: number = 3 * 60 * 1000; // How often the session manager should check if the session requires a refresh
export const SESSION_REFRESH_BUFFER_MS: number = 3 * 60 * 1000; // How long before the expiration the session should be refreshed to ensure the session doesn't expire mid-run

export const SESSION_STORAGE_FILE: string = 'tests/artifacts/storageState.json';
