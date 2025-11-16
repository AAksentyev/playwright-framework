// decorators/Interaction.ts
import { logInteraction } from '@utils/reporters/heatmap/interactionLogger.ts';
import { screenshotTracker, takeHeatmapScreenshot } from '@utils/screenshot.ts';
import { config } from '@config';

/**
 * Decorator that tracks interactions with locators from the BaseLocator class
 * For each interaction, it takes a screenshot of a component/page object (IF ONE WAS NOT ALREADY TAKEN)
 * and logs the interaction with the locator
 *
 * These interactions are then used to generate a heatmap report over the screenshots taken to indiciate
 * where there interactions took place
 *
 * @param type Interaction type
 * @returns
 */
export function Interaction(type: 'click' | 'fill' | 'hover') {
    return function decorator(target: Function, context: ClassMethodDecoratorContext) {
        if (context.kind !== 'method') {
            throw new Error(`@Interaction can only be applied to methods. Got: ${context.kind}`);
        }

        //const callerMethod = `${String(context.name)}`;
        const originalMethod = target;

        return async function replacementMethod(this: any, ...args: any[]) {
            // Execute original method
            // If it throws, skip success logic
            const result = await originalMethod.apply(this, args);

            // SUCCESS-ONLY LOGIC. We only log the interaction if it was successful
            // and if we have heatmap report toggled on
            if (config.RUN_HEATMAP_REPORT) {
                // if a screenshot for this page/component is already taken, skip taking it
                if (!(this.pageObjectName in screenshotTracker))
                    await takeHeatmapScreenshot(this.root ?? this.page, this.pageObjectName);

                // log the interaction
                await logInteraction(
                    args[0], // locator
                    type, // interaction type
                    this.pageObjectName
                );
            }

            return result;
        };
    };
}
