export interface MakeEntry {
    Make_ID: number;
    Make_Name: string;
    Model_ID: number;
    Model_Name: string;
}

export interface GetModelsForMakeResponse {
    Count: string;
    Message: string;
    SearchCriteria: string | null;
    Results: MakeEntry[];
}

export const getModelsForMakeSchema = {
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
                required: ['Make_ID', 'Make_Name', 'Model_ID', 'Model_Name'],
                properties: {
                    Make_ID: { type: 'integer' },
                    Make_Name: { type: 'string' },
                    Model_ID: { type: 'integer' },
                    Model_Name: { type: 'string' },
                },
            },
        },
    },
} as const;
