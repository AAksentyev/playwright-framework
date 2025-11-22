import { Serializable } from 'child_process';
import { APIResponse, Page } from '@playwright/test';
import { Logger } from '@utils/logger.ts';

/**
 * response object to pass to route.fulfill
 * This structure matches what .fullfill is expecting
 */
interface MockResponse {
    body?: string | Buffer<ArrayBufferLike>;
    contentType?: string;
    headers?: {
        [key: string]: string;
    };
    json?: Serializable;
    path?: string;
    response?: APIResponse;
    status?: number;
}

/** route string or regex to mock */
type RouteToMock = string | RegExp;

/**
 * Mock a given API request
 * @param page Page object
 * @param route route to mock
 * @param mockResponse response object
 */
export function mockRequest(page: Page, routeToMock: RouteToMock, mockResponse: MockResponse) {
    page.route(routeToMock, (route) => {
        Logger.debug(`Route ${routeToMock.toString()} will respond with a mock response`);
        route.fulfill(mockResponse);
    });
}

/**
 * Remove any mocking from a route if defined
 * @param page Page object
 * @param route route to unmock
 */
export function unmockRequest(page: Page, route: RouteToMock) {
    Logger.debug(`Removing the response mocking (if exists) from route '${route}'`);
    page.unroute(route);
}
