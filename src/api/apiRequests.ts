import { APIRequestContext } from '@playwright/test';
import { APIHelpers } from './apiHelpers.ts';
import { ParamValues } from '@configs/api/api.t.ts';
import { ResponseThreshold } from '@decorators/responseThreshold.ts';
import { GetAllMakesResponse } from '@testdata/schemas/json/getAllMakes.schema.ts';
import { GetModelsForMakeResponse } from '@testdata/schemas/json/getModelsForMake.schema.ts';
import { GetMakesByManufacturerAndYearResponse } from '@testdata/schemas/json/getMakesByManufacturerAndYear.schema.ts';
import { Step } from '@decorators/step.ts';

/**
 * A wrapper class for APIHelpers that stores aliased methods for each API call
 * Reduces boilerplate and imports in test files while preserving
 */
export class API extends APIHelpers {
    @Step('Send a Get All Makes API Request')
    static async getAllMakes(
        request: APIRequestContext,
        values: ParamValues = [],
        config?: object
    ) {
        return this.doGetData<GetAllMakesResponse>(request, 'getAllMakes', values, config);
    }

    @Step('Send a Get All Makes Request')
    static async getAllMakesNoSchema(
        request: APIRequestContext,
        values: ParamValues = [],
        config?: object
    ) {
        return this.doGetData<GetAllMakesResponse>(request, 'getAllMakesNoSchema', values, config);
    }

    @Step('Send a Get Models For Make API Request')
    static async getModelsForMake(
        request: APIRequestContext,
        values: ParamValues = [],
        config?: object
    ) {
        return this.doGetData<GetModelsForMakeResponse>(
            request,
            'getModelsForMake',
            values,
            config
        );
    }

    @Step('Send a Get Makes By Manufacturer API Request')
    static async getMakesByManufacturerAndYear(
        request: APIRequestContext,
        values: ParamValues = [],
        config?: object
    ) {
        return this.doGetData<GetMakesByManufacturerAndYearResponse>(
            request,
            'getMakesByManufacturerAndYear',
            values,
            config
        );
    }

    @Step('Send an API request that will return a 404 code')
    static async apiCallThatReturns404(
        request: APIRequestContext,
        values: ParamValues = [],
        config?: object
    ) {
        return this.doGetData<any>(request, 'routeThatReturns404', values, config);
    }

    @Step('Send an API request that has a Response Threshold decorator')
    @ResponseThreshold({
        maxMs: 2,
        label: 'This api exceeds configured response time threshold',
        soft: false,
    })
    static async apiThatExceedsResponseThresholdHard(
        request: APIRequestContext,
        values: ParamValues = [],
        config?: object
    ) {
        return this.doGetData<GetAllMakesResponse>(request, 'getAllMakes', values, config);
    }

    @Step('Send an API request that has a Response Threshold decorator')
    @ResponseThreshold({
        maxMs: 2,
        label: 'This api exceeds configured response time threshold (soft)',
    })
    static async apiThatExceedsResponseThresholdSoft(
        request: APIRequestContext,
        values: ParamValues = [],
        config?: object
    ) {
        return this.doGetData<GetAllMakesResponse>(request, 'getAllMakes', values, config);
    }
}
