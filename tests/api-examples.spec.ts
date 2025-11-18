import { expect, test } from '@playwright/test';
import { assertSchema, validateSchema } from '@api/schemaValidator.ts';
import { TAG } from '@constants/tags.ts';
import { API } from '@api/apiRequests.ts';
import { readCSV } from '@utils/readers/csvHelper.ts';
import { ManufacturerYearTest } from '@testdata/types/testdata.t.ts';


test.describe('Standalone tests showing parameter usage examples', { tag: [TAG.API] }, async () => {
    /**
     * Example test showing usage of a request that does not require any variables in the path
     */
    test('API test example with schema validation (no params example)', async ({ request }) => {
        // execute the request
        const { body, response, expectedSchema } = await API.getAllMakes(request);

        // verify the response code
        expect(response.status()).toBe(200);
        // verify the schema. assertSchema throws if there is a mismatch
        assertSchema(body, expectedSchema);
        // perform any validation on the repsonse body
        expect(body.Count).toBeGreaterThan(0);
    });

    /**
     * Example test showing a request that needs one variable in the URL
     */
    test('API test example with schema validation (one param example)', async ({ request }) => {
        const { body, response, expectedSchema } = await API.getModelsForMake(request, ['honda']);

        // verify the response code
        expect(response.status()).toBe(200);
        // verify the schema. assertSchema throws if there is a mismatch
        assertSchema(body, expectedSchema);
        // perform any validation on the repsonse body
        expect(body.Count).toBeGreaterThan(0);
    });

    /**
     * Example test showing using strings and numbers to interpolate multiple different variables into the URL
     */
    test('API test example with schema validation (multiple params example)', async ({
        request,
    }) => {
        const { body, response, expectedSchema } = await API.getMakesByManufacturerAndYear(
            request,
            ['merc', 2013]
        );

        // verify the response code
        expect(response.status()).toBe(200);
        // verify the schema. assertSchema throws if there is a mismatch
        assertSchema(body, expectedSchema);
        // perform any validation on the repsonse body
        expect(body.Count).toBeGreaterThan(0);
    });

    test('API test example without schema configured for route', async ({ request }) => {
        // execute the request
        const { body, response, expectedSchema } = await API.getAllMakesNoSchema(request);

        // verify the response code
        expect(response.status()).toBe(200);
        // since no schema is configured for this route, assertion will pass but a warning will be logged
        assertSchema(body, expectedSchema);
        // perform any validation on the repsonse body
        expect(body.Count).toBeGreaterThan(0);
    });
});

test.describe('API Retries (tests will fail)', { tag: TAG.API }, async () => {
    test(`API that will return 404 and automatically retry (failing test)`, async ({ request }) => {
        // execute an API call that does not exist
        // there's no verification or expects in this test.
        // This is just to showcase the API retry decorator attached to doGetData method
        await API.apiCallThatReturns404(request);
    });
});

test.describe('Datadriven examples', { tag: [TAG.API] }, async () => {
    // sample scenarios with different parameters to interpolate into the request
    // these can be externalized to a separate file
    // Note: We'll use these examples for both dynamically generated tests and a single test
    const scenarioExamples = [
        { manufacturer: 'merc', year: 2014, expectedRecordCount: 21 },
        { manufacturer: 'merc', year: 2015, expectedRecordCount: 21 },
        { manufacturer: 'honda', year: 2013, expectedRecordCount: 15 },
        { manufacturer: 'honda', year: 2014, expectedRecordCount: 14 },
    ];

    test.describe('Dynamically generated tests', async () => {
        // dynamically create a separate test for every scenario
        // Important: this should be used carefully when using extremely large datasets
        // See the following example for an alternative solution
        for (const { year, manufacturer, expectedRecordCount } of scenarioExamples) {
            test(`Datadriven test for '${manufacturer} - ${year}'`, async ({ request }) => {
                // execute the request
                const { body, response, expectedSchema } = await API.getMakesByManufacturerAndYear(
                    request,
                    [manufacturer, year]
                );

                // verify the response code first
                expect(response.status()).toBe(200);
                // verify the schema. assertSchema throws if there is a mismatch
                assertSchema(body, expectedSchema);

                // perform any validation on the response body
                expect(body.Count).toEqual(expectedRecordCount);
            });
        }
    });

    /**
     * Example of a single data-driven test. This will run every scenario inside a single test
     * and not throw any errors until it finishes all of the scenarios
     *
     * This test can be altered to use a hard assertion (expect() instead of expect.soft()) if there is a condition
     * That should force it to not continue with the rest of the scenario
     */
    test.describe('Single data-driven test', async () => {
        /**
         * For large datasets, it may sometimes not make sense to create a separate test for each record.
         * The schema validator file also provides a function that returns the schema validation result without throwing an exception
         * You can then incorporate except.soft for soft assertions that will fail the test after running through all of the test
         */

        test(`Datadriven test for Manufacturers + years`, async ({ request }) => {
            // loop over each example and execute the request
            for (const { year, manufacturer, expectedRecordCount } of scenarioExamples) {
                const { body, response, expectedSchema } = await API.getMakesByManufacturerAndYear(
                    request,
                    [manufacturer, year]
                );

                // verify the response status
                expect
                    .soft(
                        response.status(),
                        `The response status for ${manufacturer}-${year} did not match expected. No further validation performed`
                    )
                    .toBe(200);

                // we should only validate the schema if the response code was valid
                // continue on to the next test
                if (response.status() !== 200) continue;

                // once the response code check passes, validate the schema
                const validated = validateSchema(body, expectedSchema);
                expect
                    .soft(
                        validated.valid,
                        `Schema validation failed for ${manufacturer}-${year}.\n\n${validated.message}`
                    )
                    .toBeTruthy();

                // if the schema check did not pass move on to the next test
                if (!validated.valid) continue;

                // perform any other validation on the response body once schema checks passed
                expect.soft(body.Count).toEqual(expectedRecordCount);
            }
        });


        test(`Datadriven test with data from a csv file`, async ({ request }) => {
            
            /** read our test data from the csv file. This is type-safe and you can pass
             * any type T to readCSV to get back a typed array T[] for use in your tests
             * 
             * Note: When parsing a CSV, it will return you strings even if data is numbers, regardless of the type
             * so if you're expecting numbers in your data, you can optionally pass a 'converter' object
             * to convert given keys to the primitive data type you want.
             * 
             * Alternatively you can either manually convert them in your test or use them as strings if it doesn't matter to you
             */
            const csvData = readCSV<ManufacturerYearTest>(
                                    'test-data/data-driven/csv-example.csv',
                                    {
                                        year: Number,
                                        expectedRecordCount: Number
                                    });
                    
            for (const { year, manufacturer, expectedRecordCount } of csvData) {
                const { body, response, expectedSchema } = await API.getMakesByManufacturerAndYear(
                    request,
                    [manufacturer, year]
                );

                // perform any checks here. Omitting status,etc in interest of making examples more compact
                expect.soft(body.Count).toEqual(expectedRecordCount);
            }
        });

        test(`Datadriven test with data from an xlsx file`, async ({ request }) => {
            
            // read our test data from a xlsx file. This is type-safe and you can pass
            // any type T to readXLSX to get back a typed array T[] for use in your tests
            // usage is exactly the same as readCSV, but with readXLSX

            // for example:
            /*const xlsxData = readXLSX<ManufacturerYearTest>('testdata/data-driven/xlsx-example.xlsx');
            for (const { year, manufacturer, expectedRecordCount } of csvData) {
                const { body, response, expectedSchema } = await API.getMakesByManufacturerAndYear(
                    request,
                    [manufacturer, year]
                );

                // perform any checks here. Omitting status,etc in interest of making examples more compact
                expect.soft(body.Count).toEqual(expectedRecordCount);
            }*/
        });
    });
});

test.describe('Response Time Thresholds', { tag: TAG.API }, async () => {
    // These APIs have the @ResponseThreshold decorator attached to them.
    // If the threshold exceeds, the decorator can be configured to either hard fail the test
    // or simply log a warning

    test(`API that will exceed threshold and hard fail (failing test)`, async ({ request }) => {
        // execute an API call that does not exist
        // there's no verification or expects in this test.
        // This is just to showcase the API retry decorator attached to doGetData method
        await API.apiThatExceedsResponseThresholdHard(request);
    });

    test(`API that will exceed threshold and not fail (passing test)`, async ({ request }) => {
        // execute an API call that does not exist
        // there's no verification or expects in this test.
        // This is just to showcase the API retry decorator attached to doGetData method
        await API.apiThatExceedsResponseThresholdSoft(request);
    });
});
