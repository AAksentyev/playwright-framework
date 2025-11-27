import { expect } from '@fixtures/base.ts';
import { Logger } from '@utils/logger.ts';
import { TAG } from '@constants/tags.ts';
import { readCSV, toBool } from '@utils/readers/csvHelper.ts';
import { InputSettingTestData } from '@testdata/types/testdata.t.ts';
import { pivotCSVDataByKey } from '@helpers/tests/testDataHelpers.ts';
import { ElementTypeOption } from '@pages/base/BaseLocatorSettings.t.ts';
import { test } from '@fixtures/auto-wait-page.fixture.ts';

// auto wait page test examples

/**
 * This is a collection of tests for the Auto Wait Page
 * Leverage the Auto-wait-page fixture that automatically navigates to the page
 *
 *
 * IN PROGRESS - more tests to be added
 */
test.describe(
    'All valid setting states are applied to every input',
    { tag: [TAG.UI, TAG.WIP] },
    async () => {
        const csvDataSet = readCSV<InputSettingTestData>(
            'test-data/data-driven/auto-wait-locator-settings.csv',
            {
                visible: toBool,
                enabled: toBool,
                editable: toBool,
                onTop: toBool,
                nonZeroSize: toBool,
            }
        );

        // pivot the data into Record<ElementTypeOption, InputSettingTestData[]>
        // format so we can easily iterate over each input type and compartmentalize tests for each
        const pivotedData = pivotCSVDataByKey<Record<ElementTypeOption, InputSettingTestData[]>>(
            csvDataSet,
            'type'
        );

        for (const inputType of Object.keys(pivotedData) as ElementTypeOption[]) {
            // place tests for each input type into their own describe block
            test.describe(`Run tests for ${inputType} input type`, async () => {
                for (const row of pivotedData[inputType]) {
                    // strip the type key from the row so we can do a direct compare in the expect
                    const { ['type']: _, ...settings } = row;

                    test(`${inputType} | ${JSON.stringify(settings)}`, async ({ autoWaitPage }) => {
                        Logger.info('Settings being applied: ', settings);
                        // select the input type, check the settings, and click the apply button
                        await test.step('Select input type, toggle settings and apply', async () => {
                            await autoWaitPage.selectInputType(inputType);
                            await autoWaitPage.toggleCheckboxes(settings);
                            await autoWaitPage.clickApplyButton(3);
                        });

                        expect(
                            await autoWaitPage.getCurrentTargetProperties(),
                            'Settings of the target element should match the applied'
                        ).toEqual(settings);
                    });
                }
            });
        }
    }
);

test.describe(
    'Each Apply button applies the correct wait time before revert',
    { tag: [TAG.WIP] },
    async () => {
        // TODO
    }
);

test.describe('Each locator interaction displays a message', { tag: [TAG.WIP] }, async () => {
    // TODO
});
