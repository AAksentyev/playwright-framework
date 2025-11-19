export type RequestType = 'get' | 'post' | 'patch' | 'delete';

export type ParamValues = (string | number)[];

/**
 * Details for a specific API route.
 */
export type RouteDetails = {
    route: string; // route relative to the configured base url  (example: my/test/route)
    description?: string; // route description (strictly informational)
    schema?: any;
    config?: { [key: string]: any }; // playwright option request override
};

/**
 * A mapping of API route aliases to their details.
 * Used to standardize API requests throughout the application.
 */
export type RouteConfig = Record<string, RouteDetails>;

/**
 * A mapping of HTTP methods to their corresponding route configurations.
 * Used to organize API endpoints by method type.
 */
export type RouteMap = Record<RequestType, RouteConfig>;
