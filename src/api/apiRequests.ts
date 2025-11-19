import { APIRequestContext } from '@playwright/test';
import { APIHelpers } from './apiHelpers.ts';
import { ParamValues } from '@configs/api/api.t.ts';
import { ResponseThreshold } from '@decorators/responseThreshold.ts';
import { GetAllMakesResponse } from '@testdata/schemas/getAllMakes.schema.ts';
import { GetModelsForMakeResponse } from '@testdata/schemas/getModelsForMake.schema.ts';
import { GetMakesByManufacturerAndYearResponse } from '@testdata/schemas/getMakesByManufacturerAndYear.schema.ts';

/**
 * A wrapper class for APIHelpers that stores aliased methods for each API call
 * Reduces boilerplate and imports in test files while preserving
 */
export class API extends APIHelpers {
    static async getAllMakes(
        request: APIRequestContext,
        values: ParamValues = [],
        config?: object
    ) {
        return this.doGetData<GetAllMakesResponse>(request, 'getAllMakes', values, config);
    }

    static async getAllMakesNoSchema(
        request: APIRequestContext,
        values: ParamValues = [],
        config?: object
    ) {
        return this.doGetData<GetAllMakesResponse>(request, 'getAllMakesNoSchema', values, config);
    }

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

    static async apiCallThatReturns404(
        request: APIRequestContext,
        values: ParamValues = [],
        config?: object
    ) {
        return this.doGetData<any>(request, 'routeThatReturns404', values, config);
    }

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
