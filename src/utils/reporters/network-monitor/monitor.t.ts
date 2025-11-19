/** what data are we tracking for network request failures  */
export interface FailureEntry {
    testName: string;
    responseCode: number;
}
/** Network traffic statistic tracker */
export interface RequestStats {
    success: number;
    fail: number;
    failures: FailureEntry[];
}

/** stat tracker per test defined as a Map for efficient updates of existing data */
export type RequestMap = Map<string, RequestStats>;

/** Data structure that we need for bar graph in the network traffic report */
export interface ChartData {
    urls: string[];
    successCounts: number[];
    failCounts: number[];
}
/**  */
//export interface NetworkReportEntry { success: number; fail: number; failures: FailureEntry[]; }
export type NetworkReport = Record<string, RequestStats>;
