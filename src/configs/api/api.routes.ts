/**
 * this route map is used for ease and standardization of get and post request.
 * the keys are aliases that are used by doGetData/doPostData in DataHandlerService
 * if you want the api call to not auto-extend the user session, add config: {headers: sessionRefreshBlockHeader }
 * to the object (see getSysLog for an example). The interceptor will handle the blocking of session extend
 */

import { RouteDetails, RouteMap } from './api.t.ts';

const GET_ROUTES = {
    getAllMakes: { route: 'vehicles/GetAllMakes?format=json' },
    GetMakesByManufacturerAndYear: {
        route: '/vehicles/GetMakesForManufacturerAndYear/%s?year=%d&format=json',
        description: `get model listing for given make of the car
             parameters:
                - manufacturer (string) (ex: 'honda')
                - year (integer) (ex: 2000)
            `,
    },
    getModelsForMake: {
        route: 'vehicles/GetModelsForMake/%s?format=json',
        description: `get model listing for given make of the car
             parameters:
                - make of the car (string) (ex: 'honda')           
            `,
    },
} as const satisfies Record<string, RouteDetails>;

const POST_ROUTES = {
    samplePostEndpoint: { route: 'sample/post/route' },
} as const satisfies Record<string, RouteDetails>;

export const API_ENDPOINTS: RouteMap = {
    get: GET_ROUTES,
    post: POST_ROUTES,
    delete: {
        // add delete routes here
    },
    patch: {
        // add patch routes here
    },
} as const;

export type GetEndpointKeys = keyof typeof GET_ROUTES;
export type PostEndpointKeys = keyof typeof POST_ROUTES;
/**export type PatchEndpointKeys = keyof typeof TASKS_PATCH;
export type DeleteEndpointKeys = keyof typeof TASKS_DELETE;
*/
