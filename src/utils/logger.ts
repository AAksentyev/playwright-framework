import util from 'util';
import { config } from '@config';
import { vsprintf } from 'sprintf-js';


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
type LogLevel = 'INFO' | 'DEBUG' | 'ERROR' | 'WARN' | 'SUCCESS';

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
    SUCCESS: '✅',
};

/**
 * Formats the log message with timestamp, level, and icon.
 *
 * @param level - Log level
 * @param args - arguments for message formatting
 * @returns
 */
function formatLog(level: LogLevel, ...args: any[]): string {
    const icon = LEVEL_ICONS[level];
    const timestamp = new Date().toISOString();

    let message: string;

    if (typeof args[0] === 'string') {
        const [template, ...rest] = args;

        try {
            message = rest.length ? vsprintf(template, rest) : template;
        } catch {
            // fallback to console.log-style join
            message = args
                .map((a) => (typeof a === 'string' ? a : util.inspect(a, { depth: null })))
                .join(' ');
        }
    } else {
        // pure console.log behavior
        message = args
            .map((a) => (typeof a === 'string' ? a : util.inspect(a, { depth: null })))
            .join(' ');
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
    info: async (...args: any[]) => {
        console.info(formatLog('INFO', ...args));
    },
    debug: async (...args: any[]) => {
        if (config.DEBUG_MODE) console.debug(formatLog('DEBUG', ...args));
    },
    error: async (...args: any[]) => {
        console.error(formatLog('ERROR', ...args));
    },
    warn: async (...args: any[]) => {
        console.warn(formatLog('WARN', ...args));
    },
    success: async (...args: any[]) => {
        console.log(formatLog('SUCCESS', ...args));
    },
};
