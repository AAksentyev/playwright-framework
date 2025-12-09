export const TASKS = {
    CHROME: 'Chrome',
    FIREFOX: 'Firefox',
    IE: 'Internet Explorer',
    SYSTEM: 'System'
} as const;

export type TaskName = typeof TASKS[keyof typeof TASKS];

export const TABLE_HEADERS = {
    NAME: "Name",
    CPU: "CPU",
    MEMORY: "Memory",
    DISK: "Disk",
    NETWORK: "Network",
} as const;

export type ColumnIndex = Record<keyof typeof TABLE_HEADERS, number>;
export type RowData = Record<keyof typeof TABLE_HEADERS, string>;