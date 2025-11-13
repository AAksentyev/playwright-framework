export interface MakeEntry {
    MakeId: number;
    MakeName: string;
    MfrId: number;
    MfrName: string;
}

export interface GetMakesByManufacturerAndYearResponse {
    Count: string;
    Message: string;
    SearchCriteria: string | null;
    Results: MakeEntry[];
}

export const getMakesByManufacturerAndYearSchema = {
    type: 'object',
    required: ['Count', 'Message', 'SearchCriteria', 'Results'],
    properties: {
        Count: { type: 'integer' },
        Message: { type: 'string' },
        SearchCriteria: { type: 'string' },
        Results: {
            type: 'array',
            items: {
                type: 'object',
                additionalProperties: false,
                required: ['MakeId', 'MakeName', 'MfrId', 'MfrName'],
                properties: {
                    MakeId: { type: 'integer' },
                    MakeName: { type: 'string' },
                    MfrId: { type: 'integer' },
                    MfrName: { type: 'string' },
                },
            },
        },
    },
} as const;
