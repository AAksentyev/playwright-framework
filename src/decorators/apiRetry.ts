// decorators/apiRetry.ts
import { config } from '@config';
import { Logger } from '@utils/logger.ts';
import { API_RETRY_DELAY_MS, API_RETRY_MAX_ATTEMPTS } from '@configs/api/api.config.ts';


export interface APIRetryOptions {
    /** number of retries, default 1 (no retry) */
    attempts?: number;

    /** delay between retries in ms */
    delay?: number;

    /** optional hook fired on every failure before retry */
    onRetry?: (error: unknown, attempt: number) => Promise<void> | void;

    /** optional hook fired only once on success */
    onSuccess?: (result: any, callInfo: any) => Promise<void> | void;

    /** optional hook fired once after ALL retries fail */
    onFailure?: (error: unknown, callInfo: any) => Promise<void> | void;
}

export function APIRetry(options: APIRetryOptions = {}) {
    const {
        attempts = API_RETRY_MAX_ATTEMPTS, // use default number of retries
        delay = API_RETRY_DELAY_MS, // use default delay between retries
        onRetry,
        onSuccess,
        onFailure, // no defaults for callbacks
    } = options;

    return function decorator(target: Function, context: ClassMethodDecoratorContext) {
        if (context.kind !== 'method') {
            throw new Error(`@APIRetry can only decorate methods.`);
        }

        const methodName = String(context.name);
        const originalMethod = target;

        return async function replacement(this: any, ...args: any[]) {
            let lastError: unknown;

            const callInfo = {
                class: this?.constructor?.name ?? 'UnknownClass',
                method: methodName,
                alias: args[1],
                args,
            };

            // skip retrying if it's not enabled and just return the result
            if (!config.RETRY_ENABLED) return await originalMethod.apply(this, args);

            // if retry is enabled, run once and keep trying until max attempts
            for (let attempt = 1; attempt <= attempts; attempt++) {
                try {
                    Logger.debug(
                        `API call ${callInfo.class}.${methodName}(${callInfo.alias}) attempt ${attempt}/${attempts}`
                    );

                    // ──────────────────────────────────────────────────────
                    // EXECUTE ORIGINAL METHOD
                    // If it throws → jump to catch → skip success logic
                    // ──────────────────────────────────────────────────────
                    const result = await originalMethod.apply(this, args);

                    // SUCCESS HANDLER
                    if (onSuccess) {
                        await onSuccess(result, callInfo);
                    }

                    return result;
                } catch (error) {
                    lastError = error;
                    Logger.warn(
                        `API call ${callInfo.class}.${methodName} attempt ${attempt} failed: ${error}`
                    );

                    if (onRetry) {
                        await onRetry(error, attempt);
                    }

                    if (attempt < attempts && delay > 0) {
                        await new Promise((res) => setTimeout(res, delay));
                    }
                }
            }

            // ──────────────────────────────────────────────────────────
            // ALL ATTEMPTS FAILED
            // ──────────────────────────────────────────────────────────
            if (onFailure) {
                await onFailure(lastError, callInfo);
            }

            throw lastError;
        };
    };
}
