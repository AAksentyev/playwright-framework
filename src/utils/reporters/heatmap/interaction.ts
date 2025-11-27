import { Locator } from '@playwright/test';
import { config } from '@config';
import { InteractionType } from '@utils/reporters/heatmap/heatmap.t.ts';
import { logInteraction } from '@utils/reporters/heatmap/interactionLogger.ts';
import { getTrackedScreenshots, takeHeatmapScreenshot } from '@utils/screenshot.ts';

/**
 * Decorator that tracks interactions with locators from the BaseLocator class
 * For each interaction, it takes a screenshot of a component/page object (IF ONE WAS NOT ALREADY TAKEN)
 * and logs the interaction with the locator
 *
 * These interactions are then used to generate a heatmap report over the screenshots taken to indiciate
 * where there interactions took place
 *
 * By default, the decorator requires that the Locator being tracked is passed as the first argument
 * to the decorated method (for example, as used in `BaseLocator`). Alternatively, if it's a custom method
 * that does not accept the locator as an argument or accepts it in a different order, you can define the locator
 * as an optional argument passed to the decorator.
 *
 * @param type Interaction type
 * @param locator Override/alternative for the locator being passed to the method
 * @returns
 *
 * @example
 * ```typescript
 *
 * class ExampleClass {
 *
 *   constructor(private readonly page:Page){}
 *
 *   // locator getter
 *   private get myLocator():Locator{
 *      return this.page.locator('#mylocator')
 *   }
 *
 *   // if the locator is being passed as the first argument, only the interaction type needs to be set
 *   @Interaction('click')
 *   async clickExampleLocator(locator:Locator){
 *     await locator.click()
 *   }
 *
 *   // optionally pass the locator if not using BaseLocator interaction methods
 *   // or the locator is not the first argument being passed to the method
 *   // if using the BaseLocator method to interact with a locator,
 *   // this second decorator should not be added as the BaseLocator class will already log the interaction
 *   @Interaction('click', 'myLocator') // pass the name of the property or getter as a string here
 *   async customLocatorAction(){
 *     await this.locatorGetter.fill('MyValue')
 *   }
 * }
 * ```
 */
export function Interaction(type: InteractionType, locatorPropName?: string) {
    return function decorator(target: Function, context: ClassMethodDecoratorContext) {
        if (context.kind !== 'method') {
            throw new Error(`@Interaction can only be applied to methods. Got: ${context.kind}`);
        }

        //const callerMethod = `${String(context.name)}`;
        const originalMethod = target;

        return async function replacementMethod(this: any, ...args: any[]) {
            let targetLocator: Locator;
            const isLocatorOverrideValid =
                locatorPropName && this[locatorPropName] && isLocator(this[locatorPropName]);
            if (isLocator(args[0])) {
                targetLocator = args[0] as Locator;
            } else if (isLocatorOverrideValid) {
                targetLocator = this[locatorPropName] as Locator;
            } else {
                throw new Error(
                    `First argument of the method decorated with @Interaction must be a Locator or 
                    the property name of the locator needs to be passed to @Interaction`
                );
            }

            // let's capture our locator's bounding box (or null if it's not visible)
            let boundingBox = null;
            if (await targetLocator.isVisible()) boundingBox = await targetLocator.boundingBox();

            // we need to take our screenshot before we perform our action on the page
            if (config.RUN_HEATMAP_REPORT) {
                const screenshotTracker = getTrackedScreenshots();
                // if a screenshot for this page/component is already taken, skip taking it
                if (!(this.pageObjectName in screenshotTracker))
                    await takeHeatmapScreenshot(this.root ?? this.page, this.pageObjectName);
            }

            // Execute original method
            // If it throws, skip success logic
            const result = await originalMethod.apply(this, args);

            // SUCCESS-ONLY LOGIC. We only log the interaction if it was successful
            // and if we have heatmap report toggled on
            if (config.RUN_HEATMAP_REPORT) {
                // log the interaction
                await logInteraction(
                    targetLocator, // locator
                    boundingBox, //locator boundingBox
                    type, // interaction type
                    this.pageObjectName
                );
            }

            return result;
        };
    };
}

/**
 * Verify that a given object is a Locator type
 * @param obj
 * @returns
 */
function isLocator(obj: any): boolean {
    return obj && typeof obj === 'object' && 'click' in obj && 'fill' in obj;
}
