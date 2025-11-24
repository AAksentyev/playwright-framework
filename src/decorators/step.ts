import { test } from '@playwright/test';

/**
 * Wrap a class method so its body runs inside a Playwright test.step()
 */
export function Step(stepName?: string) {
    return function <T extends (this: any, ...args: any[]) => any>(
        value: T,
        context: ClassMethodDecoratorContext
    ) {
        if (context.kind !== 'method') {
            throw new Error(`@Step can only be applied to methods. Got: ${context.kind}`);
        }

        const name = stepName ?? String(context.name);

        // Return a wrapper method WITH PRESERVED RETURN TYPE
        return function (this: ThisParameterType<T>, ...args: Parameters<T>): ReturnType<T> {
            return test.step(name, async () => {
                return await value.apply(this, args);
            }) as ReturnType<T>;
        };
    };
}
