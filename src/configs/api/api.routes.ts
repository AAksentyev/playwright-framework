/**
 * this route map is used for ease and standardization of get and post request.
 * the keys are aliases that are used by doGetData/doPostData in DataHandlerService
 * if you want the api call to not auto-extend the user session, add config: {headers: sessionRefreshBlockHeader }
 * to the object (see getSysLog for an example). The interceptor will handle the blocking of session extend
 *
 */

import * as schemas from '@testdata/schemas/index.ts';
import { RouteDetails, RouteMap } from './api.t.ts';

// GET request route configuration
const GET_ROUTES = {
    getAllMakes: {
        route: 'vehicles/GetAllMakes?format=json',
        schema: schemas.getAllMakesSchema,
    },
    getAllMakesNoSchema: {
        route: 'vehicles/GetAllMakes?format=json',
    },
    getMakesByManufacturerAndYear: {
        route: '/vehicles/GetMakesForManufacturerAndYear/%s?year=%d&format=json',
        description: `get model listing for given make of the car
             parameters:
                - manufacturer (string) (ex: 'honda')
                - year (integer) (ex: 2000)
            `,
        schema: schemas.getMakesByManufacturerAndYearSchema,
    },
    getModelsForMake: {
        route: 'vehicles/GetModelsForMake/%s?format=json',
        description: `get model listing for given make of the car
             parameters:
                - make of the car (string) (ex: 'honda')           
            `,
        schema: schemas.getModelsForMakeSchema,
    },
    routeThatReturns404: {
        route: 'this/is/a/missing/route',
        description: `an invalid route that will return status code 404. Used to show API retries`,
    },
} as const satisfies Record<string, RouteDetails>;

// POST route configuration
const POST_ROUTES = {
    samplePostEndpoint: { route: 'sample/post/route' },
} as const satisfies Record<string, RouteDetails>;

export const API_ENDPOINTS: RouteMap = {
    get: GET_ROUTES,
    post: POST_ROUTES,
    delete: {
        /** add delete routes here */
    },
    patch: {
        /** add patch routes here */
    },
} as const;

/** Exported aliases from the GET route map so we can strong type them in the `APIHelpers.doGetData` method */
export type GetEndpointKeys = keyof typeof GET_ROUTES;
/** Exported aliases from the GET route map so we can strong type them in the `APIHelpers.doPostData` method */
export type PostEndpointKeys = keyof typeof POST_ROUTES;
/** Exported aliases from the Patch route map so we can strong type them in the `APIHelpers.doPatchData` method */
//export type PatchEndpointKeys = keyof typeof TASKS_PATCH;
/** Exported aliases from the Delete route map so we can strong type them in the `APIHelpers.doDeleteData` method */
//export type DeleteEndpointKeys = keyof typeof TASKS_DELETE;
