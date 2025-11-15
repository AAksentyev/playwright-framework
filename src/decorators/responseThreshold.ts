import { Response } from '@api/apiHelpers.ts';
import { Logger } from '@utils/logger.ts';

export interface ResponseThresholdOptions {
    /** Maximum allowed duration in ms before error is thrown */
    maxMs: number;

    /** Optional label for logs (e.g., "UserProfile API") */
    label?: string;

    /** If true, do not throw — instead attach warning metadata */
    soft?: boolean;
}

export function ResponseThreshold(options: ResponseThresholdOptions) {
    const { maxMs, label, soft = true } = options;

    return function <
        This,
        Args extends any[],
        R, // R is the resolved value type (not Promise<R>), e.g. Response<GetAllMakesResponse>
    >(
        // target is the original method: (this:This, ...args:Args) => Promise<R>
        target: (this: This, ...args: Args) => Promise<R>,
        context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Promise<R>>
    ) {
        if (context.kind !== 'method') {
            throw new Error('@ResponseThreshold can only be applied to methods');
        }

        const originalMethod = target;

        // wrapped returns Promise<R> (same shape as original)
        const wrapped = async function (this: This, ...args: Args): Promise<R> {
            const result = await originalMethod.apply(this, args);
            const response = result as Response<any>;

            if (response.duration > maxMs) {
                const name = label ?? String(context.name);
                const msg = `⛔ ResponseThreshold exceeded: ${name} took ${response.duration.toFixed(1)}ms (limit: ${maxMs}ms)`;
                if (soft) {
                    Logger?.warn?.(msg);
                } else {
                    throw new Error(msg);
                }
            }

            return result;
        };

        // Return the wrapped function, preserving the original signature
        return wrapped as (this: This, ...args: Args) => Promise<R>;
    };
}
