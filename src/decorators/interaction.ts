// decorators/Interaction.ts
import { logInteraction } from '@utils/interactionLogger.ts';
import { screenshotTracker, takeHeatmapScreenshot } from '@utils/screenshot.ts';
import { config } from '@config';

export function Interaction(type: 'click' | 'fill' | 'hover') {
    return function decorator(target: Function, context: ClassMethodDecoratorContext) {
        if (context.kind !== 'method') {
            throw new Error(`@Interaction can only be applied to methods. Got: ${context.kind}`);
        }

        const callerMethod = `${String(context.name)}`;
        const originalMethod = target;

        return async function replacementMethod(this: any, ...args: any[]) {
            
            // attempt to invoke the original method. If the interaction succeeds, we'll get the interaction logged

            try {
                // Execute original method
                // If it throws → jump to catch → skip success logic
                const result = await originalMethod.apply(this, args);

                // SUCCESS-ONLY LOGIC. We only log the interaction if it was successful
                // and if we have heatmap report toggled on
                if ( config.RUN_HEATMAP_REPORT ) {
                    // if a screenshot for this page/component is already taken, skip taking it
                    if (! (this.pageObjectName in screenshotTracker) )
                        await takeHeatmapScreenshot(this.root ?? this.page, this.pageObjectName);

                    // log the interaction
                    await logInteraction(
                        args[0],         // locator
                        type,            // interaction type
                        this.pageObjectName
                    );
                }

                return result;
            }

            catch (error) {
                // Rethrow error so Playwright sees the failure
                throw error;
            }
        };
    };
}
