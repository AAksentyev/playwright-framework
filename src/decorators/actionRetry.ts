import { config } from '@config';
import { Logger } from '@utils/logger.ts';

/**
 * Options for the Retry decorator.
 * @category Decorators
 * @subcategory Action Retry
 */
export interface RetryOptions {
    /** Number of times to retry. Default: 1 (no retry). */
    attempts?: number;
    /** Delay in milliseconds between retries. Default: 0. */
    delay?: number;
    /** Optional function to log or handle errors */
    onRetry?: (error: unknown, attempt: number) => void;
}

/**
 * Decorator to retry a method upon failure.
 * Can be configured with number of attempts and delay between retries.
 * Useful for flaky operations like network requests or UI interactions.
 * @category Decorators
 * @subcategory Action Retry
 * @example
 * ```typescript
 * import { Retry } from '@decorators/actionRetry.ts';
 *
 * class ExamplePage {
 *
 *      @Retry({ attempts: 3, delay: 1000, onRetry: (error, attempt) => { console.log(`Handling retry ${attempt}`); } })
 *          // some flaky operation that may fail intermittently
 *          // will retry up to 3 times with 1 second delay between attempts and execute onRetry callback on each failure
 *      }
 *
 *      @Retry({ attempts: 2, delay: 2000 })
 *      async anotherFlakyMethod() {
 *          // some flaky operation that may fail intermittently
 *          // will retry up to 2 times with 2 seconds delay between attempts
 *      }
 * }
 *
 */
export function Retry(options: RetryOptions = {}) {
    // extract options with defaults
    const { attempts = 1, delay = 0, onRetry } = options;

    // Return the actual decorator function
    return function decorator(target: Function, context: ClassMethodDecoratorContext) {
        if (context.kind !== 'method') {
            throw new Error(`@Retry can only be applied to methods. Got: ${context.kind}`);
        }

        // Get the method name for logging
        const callerMethod = `${String(context.name)}`;
        const originalMethod = target;

        Logger.debug(
            `Retry decorator applied to ${callerMethod} with ${attempts} attempts and ${delay}ms delay.`
        );

        // Return the replacement method with retry logic
        return async function replacementMethod(this: any, ...args: any[]) {
            // If retry is not enabled, call the original method directly
            if (! config.RETRY_ENABLED ) {
                return originalMethod.apply(this, args);
            }

            let lastError: unknown;

            // Retry loop for the method
            for (let attempt = 1; attempt <= attempts; attempt++) {
                Logger.debug(
                    `Attempt ${attempt} of ${attempts} for ${this.constructor.name}.${callerMethod}`
                );

                try {
                    // Call the original method and if there is not error, return the result
                    const result = originalMethod.apply(this, args);
                    return result instanceof Promise ? await result : result;
                } catch (error) {
                    // Log the error and prepare for the next attempt
                    Logger.warn(`Attempt ${attempt} for ${callerMethod} failed: ${error}`);
                    lastError = error;
                    // Call the onRetry callback if provided
                    onRetry?.(error, attempt);

                    // Delay before the next attempt if specified
                    if (attempt < attempts && delay > 0) {
                        await new Promise((r) => setTimeout(r, delay));
                    }
                }
            }

            // All attempts failed, throw the last encountered error
            throw lastError;
        };
    };
}
