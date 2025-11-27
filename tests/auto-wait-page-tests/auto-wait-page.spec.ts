import { expect } from '@fixtures/base.ts';
import { Logger } from '@utils/logger.ts';
import { TAG } from '@constants/tags.ts';
import { readCSV, toBool } from '@utils/readers/csvHelper.ts';
import { InputSettingTestData } from '@testdata/types/testdata.t.ts';
import { pivotCSVDataByKey } from '@helpers/tests/testDataHelpers.ts';
import { ElementStates, ElementTypeOption } from '@pages/base/BaseLocatorSettings.t.ts';
import { test } from '@fixtures/auto-wait-page.fixture.ts';
import { ApplyDuration } from '@pages/examples/AutoWaitPage.ts';
import { FakerHelper } from '@utils/data/faker.ts';

// auto wait page test examples

/**
 * This is a collection of tests for the Auto Wait Page
 * Leverage the Auto-wait-page fixture that automatically navigates to the page
 *
 *
 * IN PROGRESS - more tests to be added
 */
// load our CSV dataset
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

test.describe(
    'Selecting a new input type displays the expected locator',
    { tag: [TAG.UI] },
    async () => {
        // test every input in our dataset by selecting it from the dropdown
        // and ensuring it is displayed
        for (const inputType of Object.keys(pivotedData) as ElementTypeOption[]) {
            test(`${inputType} is displayed after selection`, async ({ autoWaitPage }) => {
                await autoWaitPage.selectInputType(inputType);
                await expect(
                    autoWaitPage.getCurrentTarget(),
                    `${inputType} target locator should be visible`
                ).toBeVisible();
            });
        }

        // since the button is pre-selected as default, let's test it separately
        // by toggling to another type and reselecting it to ensure it works
        test('Re-selecting Button option displays a button', async ({ autoWaitPage }) => {
            await autoWaitPage.selectInputType('input');
            await autoWaitPage.selectInputType('button');
            await expect(
                autoWaitPage.getCurrentTarget(),
                `Button target locator should be visible`
            ).toBeVisible();
        });
    }
);

// ensure every setting is correctly applied and is reflected after being applied
test.describe(
    'All valid setting states are applied to every input',
    { tag: [TAG.UI] },
    async () => {
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
    { tag: [TAG.UI] },
    async () => {
        // for each of the available duration options
        // click the corresponding Apply button
        for (const duration of [3, 5, 10] as ApplyDuration[]) {
            const msDuration = duration * 1000;

            // these tests confirm the delay itself
            test(`Apply ${duration}s button reverts after ${duration} seconds`, async ({
                autoWaitPage,
            }) => {
                // track the time it took for the state to revert.
                const start = Date.now();
                await autoWaitPage.clickApplyButton(duration);

                // set our timeout with a 1 second buffer
                await expect(autoWaitPage.operationStatusLocator).toHaveText(
                    'Target element state restored.',
                    { timeout: msDuration + 1000 }
                );
                const elapsed = Date.now() - start;

                // ensure that the state was reverted within the expected timeout but NOT before.
                // if we click Apply 5s, it should not be considered a success even though the previous 'Target element state restored' msg
                // will return success in this scenario. We need this next additional check
                expect(
                    elapsed,
                    'The state restoration message should appear AFTER the duration'
                ).toBeGreaterThanOrEqual(msDuration);
            });

            // these tests confirm that the state of the target locator is reverted
            // we separate the delay test
            for (const inputType of Object.keys(pivotedData) as ElementTypeOption[]) {
                test(`${inputType} target gets its state reverted after ${duration} timeout expires`, async ({
                    autoWaitPage,
                }) => {
                    const states: ElementStates = {
                        visible: false,
                        enabled: false,
                        editable: false,
                        onTop: false,
                        nonZeroSize: false,
                    };

                    // select locator, set and apply the state
                    await autoWaitPage.selectInputType(inputType);
                    await autoWaitPage.toggleCheckboxes(states);
                    await autoWaitPage.clickApplyButton(duration);

                    // wait for the timeout to expire
                    await expect
                        .soft(autoWaitPage.operationStatusLocator)
                        .toHaveText('Target element state restored.', {
                            timeout: msDuration + 1000,
                        });

                    // reverted state should match default
                    expect(
                        await autoWaitPage.getCurrentTargetProperties(),
                        'Settings of the target element should match the expected default'
                    ).toEqual(autoWaitPage.getCurrentTargetDefaultProperties());
                });
            }
        }
    }
);

// Test interactions with the different locators that support it
test.describe(
    'Each locator interaction displays the correct message',
    { tag: [TAG.UI] },
    async () => {
        test.describe('Click action', async () => {
            for (const inputType of [
                'button',
                'input',
                'textarea',
                'select',
                'label',
            ] as ElementTypeOption[]) {
                test(`Clicking the ${inputType} displays the clicked message`, async ({
                    autoWaitPage,
                }) => {
                    await autoWaitPage.selectInputType(inputType);
                    await autoWaitPage.clickTargetLocator();
                    await expect(autoWaitPage.operationStatusLocator).toHaveText('Target clicked.');
                });
            }
        });

        test.describe('Fill action', async () => {
            for (const inputType of ['input', 'textarea'] as ElementTypeOption[]) {
                test(`Filling the ${inputType} displays the text after unfocus`, async ({
                    autoWaitPage,
                }) => {
                    const fillValue = 'my value';
                    await autoWaitPage.selectInputType(inputType);
                    await autoWaitPage.fillTargetLocator(fillValue, true);
                    await expect(autoWaitPage.operationStatusLocator).toHaveText(
                        `Text: ${fillValue}`
                    );
                });
            }
        });

        test.describe('Select action', async () => {
            test(`Selecting a value in the select target displays text of selected option`, async ({
                autoWaitPage,
            }) => {
                await autoWaitPage.selectInputType('select');
                await autoWaitPage.selectTargetLocatorOption('Item 2');
                await expect
                    .soft(autoWaitPage.operationStatusLocator)
                    .toHaveText('Selected: Item 2');
            });
        });
    }
);

// Element-specific tests
test.describe('Textbox and textarea tests', { tag: [TAG.UI] }, async () => {
    for (const inputType of ['input', 'textarea'] as ElementTypeOption[]) {
        test.describe(`${inputType}`, async () => {
            test.beforeEach(`select the '${inputType}' Locator`, async ({ autoWaitPage }) => {
                await autoWaitPage.selectInputType(inputType);
            });

            test(`${inputType} is empty by default`, async ({ autoWaitPage }) => {
                await expect(autoWaitPage.getCurrentTarget()).toHaveValue('');
            });

            // there is no max length in this textbox/textarea but we'd need to verify if there was one
            test(`Entered value in ${inputType} should reset after toggling away`, async ({
                autoWaitPage,
            }) => {
                await autoWaitPage.fillTargetLocator('myValue');
                await autoWaitPage.selectInputType('button');
                await autoWaitPage.selectInputType(inputType);
                await expect(autoWaitPage.getCurrentTarget()).toHaveValue('');
            });

            // there is no max length in this textbox/textarea but we'd need to verify if there was one
            test(`${inputType} should have max length of ###`, async ({ autoWaitPage }) => {
                const fillValue = FakerHelper.stringOfLength(200); // whatever the max allowed value is
                await autoWaitPage.fillTargetLocator(fillValue);
                await expect(autoWaitPage.getCurrentTarget()).toHaveValue(fillValue);
            });
        });
    }
});
