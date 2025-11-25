# API Testing

The framework comes with full standardized API testing support, providing schema validation with AJV, strongly typed response bodies, 
and a single point of configuration for all your routes.

# Route Configuration

By default, the starter configuration file is in `/src/configs/api/api.routes.ts`.

Each request type is configured separtely, which allows for compile-time type checking for each route you have. 
The keys are automatically exported as type aliases, so as you're using the helpers provided with this framework,
you get strongly typed suggestions per request.

The response schema and route params can be parameterized for single-point configuration for all your routes.

```typescript
// getAllMakes.schema.ts
// Defines the schema and expected response body format for the getAllMakes GET request


export interface MakeEntry {
    Make_ID: number;
    Make_Name: string;
}

// response body object typing
export interface GetAllMakesResponse {
    Count: string;
    Message: string;
    SearchCriteria: string | null;
    Results: MakeEntry[];
}

// response schema for this request used by ajv to assert the schema
export const getAllMakesSchema = {
    type: 'object',
    required: ['Count', 'Message', 'SearchCriteria', 'Results'],
    properties: {
        Count: { type: 'integer' },
        Message: { type: 'string' },
        SearchCriteria: {
            anyOf: [{ type: 'string' }, { type: 'null' }],
        },
        Results: {
            type: 'array',
            items: {
                type: 'object',
                additionalProperties: false,
                required: ['Make_ID', 'Make_Name'],
                properties: {
                    Make_ID: { type: 'integer' },
                    Make_Name: { type: 'string' },
                },
            },
        },
    },
} as const;
```

```typescript
// GET request route configuration
const GET_ROUTES = {
    getAllMakes: {
        // route relative to the API_URL configuration in .env
        route: 'vehicles/GetAllMakes?format=json',
        // optionally set the schema to the schema object exported from the schema file
        schema: schemas.getAllMakesSchema, 
    },
    getAllMakesNoSchema: {
        route: 'vehicles/GetAllMakes?format=json',
    },
    getMakesByManufacturerAndYear: {
        route: '/vehicles/GetMakesForManufacturerAndYear/%s?year=%d&format=json',
        // optional description
        description: `get model listing for given make of the car
             parameters:
                - manufacturer (string) (ex: 'honda')
                - year (integer) (ex: 2000)
            `,
        schema: schemas.getMakesByManufacturerAndYearSchema,
    }
} as const satisfies Record<string, RouteDetails>;
```

## Strongly Typed API Responses
The framework comes with APIHelper abstract class that provides strongly typed helper methods for configuring and sending your API calls. See the example file [here](../../src/api/apiRequests.ts). If properly configured, your API Request returns several pieces of additional information that you can use right away in your tests without doing any additional processing.

As you develop, you will get suggestions based on the request type.

GET request suggestion:

<img alt="GET Example" src="../images/api-alias-typeahead.gif" width="75%">

POST request suggestion:

<img alt="POST Example" src="../images/api-alias-typeahead-post.gif" width="75%">

Once the request returns, you will get a standardized, strongly typed response object that will provide additional information
along with the `response` object:

```typescript
export interface Response<T> {
    response: APIResponse; // full api response object from the request
    body: T; // parsed response body of given type (response.json()) and typecast to the expect type
    expectedSchema: any; // schema object (if configured for the route) that is expected
    duration: number; // request duration
}
```

This makes API tests easily configurable and maintainable. For example, if the route in your API helper is configured as follows:
```typescript
    // apiRequests.ts
    export class API extends APIHelpers {
        static async getAllMakes(
            request: APIRequestContext,
            values: ParamValues = [],
            config?: object
        ) {
            // strongly type the parsed response body to 'GetAllMakesResponse' type
            return this.doGetData<GetAllMakesResponse>(request, 'getAllMakes', values, config);
        }
    }
```

All you need in your test is this to start validating your responses and schemas
```typescript

    test('API test example with schema validation (no params example)', async ({ request }) => {
        // execute the request
        // body will be a typed object as passed to 
        const { body, response, expectedSchema } = await API.getAllMakes(request);

        // verify the response code
        expect(response.status(), 'Status should be 200').toBe(200);
        // verify the schema. assertSchema throws if there is a mismatch.
        // assertSchema is imported from the schemaValidator helper file
        assertSchema(body, expectedSchema);

        // perform any validation on the repsonse body
        expect(body.Count, 'Returned record count in body should be > 0').toBeGreaterThan(0);
    });
```

## APIs With Route Paramaters
If your route has parameters, it is trivial to implement datadriven tests with this setup.
Simply parameterize your variables with an sprintf template and the helpers will take care of everything else. 
Just pass an array of variables to be interpolated.


```typescript
// example route config where manufacturer name is the first parameter and the year is the second parameter
getMakesByManufacturerAndYear: {
    route: '/vehicles/GetMakesForManufacturerAndYear/%s?year=%d&format=json',
    // optional description
    description: `get model listing for given make of the car
            parameters:
            - manufacturer (string) (ex: 'honda')
            - year (integer) (ex: 2000)
        `,
    schema: schemas.getMakesByManufacturerAndYearSchema,
}
```

Then your test needs to simply pass the values to the helper as an array. The helper will validate whether you're passing the expected number of parameters.
```typescript
    const scenarioExamples = [
        { manufacturer: 'merc', year: 2014, expectedRecordCount: 21 },
        { manufacturer: 'merc', year: 2015, expectedRecordCount: 21 },
        { manufacturer: 'honda', year: 2013, expectedRecordCount: 15 },
    ];

    test(`Datadriven test for Manufacturers + years`, async ({ request }) => {
        // loop over each example and execute the request
        for (const { year, manufacturer, expectedRecordCount } of scenarioExamples) {
            const { body, response, expectedSchema } = await API.getMakesByManufacturerAndYear(
                                                            request,
                                                            [manufacturer, year] // pass params in array
                                                        );
            // verify the response status
            expect
                .soft(response.status(), `${manufacturer}-${year} response status should be 200.`)
                .toBe(200);

            // we should only validate the schema if the response code was valid
            // continue on to the next test
            if (response.status() !== 200) continue;

            // once the response code check passes, validate the schema
            const validated = validateSchema(body, expectedSchema);
            expect
                .soft(validated.valid, `Schema should match for ${manufacturer}-${year}.\n\n${validated.message}`)
                .toBeTruthy();
        }
    });
```


