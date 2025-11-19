import { config } from '@config';
import { API_ENDPOINTS, GetEndpointKeys, PostEndpointKeys } from '@configs/api/api.routes.ts';
import { RequestType, RouteDetails } from '@configs/api/api.t.ts';
import { APIRetry } from '@decorators/apiRetry.ts';
import { APIRequestContext, APIResponse } from '@playwright/test';
import { Logger } from '@utils/logger.ts';
import { vsprintf } from 'sprintf-js';

export interface Response<T> {
    response: APIResponse; // full api response object from the request
    body: T; // parsed response body of given type (response.json()) and typecast to the expect type
    expectedSchema: any; // schema object (if configured for the route) that is expected
    duration: number; // request duration
}

export abstract class APIHelpers {
    private static readonly BASE_URL = config.API_URL;
    /**
     * a standardized function for GET requests to the server.
     * leverages aliases and configuration defined in api.routes.ts to
     * simplify api requests.
     * @param request - request context passed from the test
     * @param alias - the alias for the request as defined in api.routes.ts
     * @param values - optional array of values to sprintf into the URL request
     * @param config - optional config object to override default http request config
     * @param callback - optional callback to execute upon completion
     * @returns
     */
    @APIRetry({
        attempts: 2, // override default API_RETRY_MAX_ATTEMPTS
        onRetry(error, attempt) {
            Logger.info(`RETRYING doGetData - ${attempt}`);
        },
    })
    protected static async doGetData<T>(
        request: APIRequestContext,
        alias: GetEndpointKeys,
        values: any[] = [],
        config?: object
    ): Promise<Response<T>> {
        // get the endpoint
        const ENDPOINT:RouteDetails = this.getEndpoint('get', alias);
        // ensure the parameters that were passed match what's expected
        this.verifyInterpolationCount(ENDPOINT.route, values);

        // execute the request
        const start = performance.now();
        const response: APIResponse = await request.get(
            `${this.BASE_URL}${vsprintf(ENDPOINT.route, values)}`,
            this.getConfig(ENDPOINT.config, config)
        );
        const duration = performance.now() - start;

        // parse the body (handle the error if it's not a parseable json)
        const body:T = await this.parseResponseBody<T>(response, ENDPOINT);

        // return the response and the body
        return { response, body, duration, expectedSchema: ENDPOINT.schema };
    }

    /**
     * a standardized function for POST requests to the server.
     * leverages aliases and configuration defined in api.routes.ts to
     * simplify api requests.
     * @param request - request context passed from the test
     * @param alias - the alias for the request as defined in api.routes.ts
     * @param values - optional array of values to sprintf into the URL request if any are required
     * @param body - optional payload body
     * @param config - optional config object to add to the request. Should match available request.post options. These will override any route-specific config
     * @returns
     */
    protected static async doPostData<T>(
        request: APIRequestContext,
        alias: PostEndpointKeys,
        values: any[] = [],
        data?: any | {},
        config?: object
    ): Promise<Response<T>> {
        const ENDPOINT = this.getEndpoint('post', alias);
        this.verifyInterpolationCount(ENDPOINT.route, values);

        const start = performance.now();
        const response: APIResponse = await request.post(
            `${this.BASE_URL}${vsprintf(ENDPOINT.route, values)}`, {
            data,
            ...this.getConfig(ENDPOINT.config, config),
        });
        const duration = performance.now() - start;

        // parse the body (handle the error if it's not a parseable json)
        const body:T = await this.parseResponseBody<T>(response, ENDPOINT);

        // return the response and the body
        return { response, body, duration, expectedSchema: ENDPOINT.schema };
    }

    /**doPatchData<T>( alias:PatchEndpointKeys, values?:any[], body?:any|{}, config?: object, callback?:() => any): Observable<T | null> {

        const ENDPOINT = apiEndpoints.patch[alias];

        if (!ENDPOINT) 
            return throwError(() => new Error(`Route alias "${String(alias)}" not found`));
        
        const url = values ? vsprintf(ENDPOINT.route, values) : ENDPOINT.route;
        const mergedConfig = this.getConfig(ENDPOINT.config, config);
        
        // return the observable
        return this.patch<T>(url, body, mergedConfig).pipe(
                    tap(() => callback?.())
        );
        
    }

    doDeleteData<T>( alias:DeleteEndpointKeys, values?:any[], body?:any|{}, config?: object, callback?:() => any): Observable<T | null> {

        const ENDPOINT = apiEndpoints.delete[alias];

        if (!ENDPOINT) 
            return throwError(() => new Error(`Route alias "${String(alias)}" not found`));
        
        const url = values ? vsprintf(ENDPOINT.route, values) : ENDPOINT.route;
        const mergedConfig = this.getConfig(ENDPOINT.config, config);
        
        // return the observable
        return this.delete<T>(url, mergedConfig).pipe(
                    tap(() => callback?.())
        );
        
    }*/

    //#########################
    // private helper methods
    //#########################
    /**
     * Verify that the requested endpoint exists and
     * @param type
     * @param alias
     * @returns
     */
    private static getEndpoint(
        type: RequestType,
        alias: GetEndpointKeys | PostEndpointKeys
    ): RouteDetails {
        const ENDPOINT = API_ENDPOINTS[type][alias];
        if (!ENDPOINT)
            throw new Error(`Route alias "${String(alias)}" for request type '${type}' not found`);

        return ENDPOINT;
    }

    /**
     * Verify that the number of passed variables to interpolate into the URL matches the expected number
     * Throw if there's a mismatch
     * @param route
     * @param values
     * @param specifiers
     */
    private static verifyInterpolationCount(
        route: string,
        values: any[],
        specifiers = ['d', 's', 'f']
    ): void {
        const regex = new RegExp(`%[${specifiers.join('')}]`, 'g');
        const expectedNumParams = (route.match(regex) || []).length;

        if (expectedNumParams !== values.length) {
            throw new Error(`
                Number of expected parameter variables in the route does not match the passed number of values.
                    - Route: ${route}\n
                    - Number of expected parameters: ${expectedNumParams}
                    - Number of passed parameters: ${values.length}
            `);
        }
    }

    /**
     * Merge default and passed configuration objects for HTTP requests.
     * @param defaultConfig - The default configuration object.
     * @param passedConfig - The configuration object passed during the request.
     * @returns The merged configuration object or undefined if both are absent.
     */
    private static getConfig(
        defaultConfig?: { [key: string]: any },
        passedConfig?: { [key: string]: any }
    ): { [key: string]: any } | undefined {
        let obj;

        if (defaultConfig && passedConfig) {
            obj = Object.assign({ ...defaultConfig, ...passedConfig });
        } else {
            obj = defaultConfig ? defaultConfig : passedConfig ? passedConfig : undefined;
        }

        return obj;
    }

    /** 
     * Parse the response body of the request 
     * 
     * @param response APIResponse object from the request
     * @todo Support non-json response parsing (such as xml)
    */
    private static async parseResponseBody<T>(response:APIResponse, endpoint:RouteDetails):Promise<T>{
        let body: any = {};
        
        // try parsing our request body
        // if it fails, it's not json
        try {
            body = await response.json();
        } catch (e: any) {
            const errMsg = `Failed to parse response body. It may not be a valid json: ${e.message}\n
                            Response URL: ${response.url()}\n                
                            Response code: ${response.status()}\n
                            Response body: ${response.status() !== 404 ? await response.body() : '...Resource not found...'}
                            `
            
            Logger.error(errMsg);
            throw new Error(errMsg);
        }
        
        return body as T;
    }
}
