import { vsprintf } from 'sprintf-js';

const DEBUG_ENABLED = 'true' === 'true'; //if ( process.env.DEBUG_MODE === "true" )
/**
 * Log message format template
 * format: ICON [LEVEL] TIMESTAMP - MESSAGE
 * @private
 * @constant {string}
 */
const LOG_FORMAT = '%s [%s] %s - %s';

/**
 * Log levels supported by the Logger utility
 * @private
 * @type {LogLevel}
 */
type LogLevel = 'INFO' | 'DEBUG' | 'ERROR' | 'WARN' | 'PASS';

/**
 * Icons for each log level for better visual distinction
 * @private
 * @constant {Record<LogLevel, string>}
 */
const LEVEL_ICONS: Record<LogLevel, string> = {
    INFO: 'ℹ️',
    DEBUG: '🔍',
    ERROR: '❌',
    WARN: '⚠️',
    PASS: '✅',
};

/**
 * Formats the log message with timestamp, level, and icon.
 *
 * @param level - Log level
 * @param msg - Log message
 * @param args - Optional arguments for message formatting
 * @returns
 */
function formatLog(level: LogLevel, msg: any, ...args: any[]): string {
    const icon = LEVEL_ICONS[level];
    const timestamp = new Date().toISOString();

    let message: string;

    if (typeof msg === 'string') {
        // String message: interpolate placeholders if provided
        message = args.length ? vsprintf(msg, args) : msg;
    } else {
        // Non-string (object, array, etc.): JSON stringify for readability
        message = JSON.stringify(msg, null, 2);
    }

    return vsprintf(LOG_FORMAT, [icon, level, timestamp, message]);
}

/**
 * Simple logger utility for consistent log formatting.
 * Provides methods for different log levels: info, debug, error, warn, success.
 * @category Utilities
 * @subcategory Logger
 * @example
 * ```typescript
 * import { Logger } from './util/logger.ts';
 * Logger.info('This is an info message');
 * Logger.debug('Debugging value: %d', 42);
 * Logger.error('An error occurred: %s', 'Some error details');
 * Logger.warn('This is a warning');
 *
 * Logger.success('Operation completed successfully');
 *
 */
export const Logger = {
    info: async (msg: string, ...args: any[]) => {
        console.info(formatLog('INFO', msg, ...args));
    },
    debug: async (msg: string, ...args: any[]) => {
        if (DEBUG_ENABLED) console.debug(formatLog('DEBUG', msg, ...args));
    },
    error: async (msg: string, ...args: any[]) => {
        console.error(formatLog('ERROR', msg, ...args));
    },
    warn: async (msg: string, ...args: any[]) => {
        console.warn(formatLog('WARN', msg, ...args));
    },
    success: async (msg: string, ...args: any[]) => {
        console.log(formatLog('PASS', msg, ...args));
    }
};