/**
 * Pivot the given array of test data by key into {[key]: data[]}
 * format
 * @param data
 * @param key
 * @param opts
 * @returns
 */
export function pivotCSVDataByKey<T>(data: any[], key: string): T {
    return data.reduce((acc, row) => {
        if (acc[row[key]] == null) acc[row[key]] = [];

        acc[row[key]]!.push(row);
        return acc;
    }, {} as T);
}
