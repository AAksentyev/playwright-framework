export interface MakeEntry {
    Make_ID: number;
    Make_Name: string;
}

export interface GetAllMakesResponse {
    Count: string;
    Message: string;
    SearchCriteria: string | null;
    Results: MakeEntry[];
}

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
