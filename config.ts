
/**
 * Get and return the environment variable (cast to String) if it exists
 * if environment variable doesn't exist and was not added to .env file:
 *  * if optional, return the default value
 *  * otherwise throw an error
 * @param key 
 * @param defaultValue 
 * @param optional 
 * @returns 
 */
function getEnv(key: string, defaultValue: string | number | boolean, optional:boolean = false): string {
    const value = process.env[key];
    if (! optional && ! value)
        throw new Error(`Environment variable ${key} does not have a default value and must be configured in the .env file.`)

    if (!value) return String(defaultValue);

    return value;
}

// Export configuration
export const config = {
    BASE_URL: getEnv('BASE_URL', '<please configure>'),
    API_URL: getEnv('API_URL', '<please configure>'),

    DEBUG_MODE: getEnv('DEBUG_MODE', 'false', true) === 'true',
    RETRY_ENABLED: getEnv('RETRY_ENABLED', 'false', true) === 'true', 
};