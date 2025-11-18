import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

/**
 * Helper function to parse a CSV file and return it as array of T
 * 
 * Accepts an object of key-value pairs
 * 
 * @param filePath path to the file
 * @param converters an object defining keys which should be converted from a string to another type
 * @returns a T[] list of records from the file
 * 
 * @example
 * ```
 * interface MyDataType = {username: string, password:string}
 * // will return a MyDataType array of data from the file
 * const fileContents = readCSV<MyDataType>('path/to/csv/file.csv')
 * ```
 * 
 * @example
 * ```
 * interface MyDataType = {filter1: string, filter2:string, expectedResult:number}
 * // will return a MyDataType array of data from the file, but expectedResult will still be a *string*
 * const fileContents = readCSV<MyDataType>('path/to/csv/file.csv')
 * ```
 * 
 * @example
 * ```
 * interface MyDataType = {filter1: string, filter2:string, expectedResult:number}
 * 
 * // pass a converters object to force a conversion of data to the expected datatype
 * // will return a MyDataType array of data from the file with expectedResult correctly being a *number*
 * const fileContents = readCSV<MyDataType>('path/to/csv/file.csv', {expectedResult: Number})
 * ```
 */
export function readCSV<T extends Record<string, any>>(
    filePath: string,
    converters: Partial<Record<keyof T, (val: string) => any>> = {}
    ): T[] {
    
    // read the csv file
    const absPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    const fileContent = fs.readFileSync(absPath, 'utf-8');
    
    // parse our csv contents
    const records: T[] = parse(fileContent, {
        columns: true,      // use first row as headers
        skip_empty_lines: true,
        trim: true
    });

    // if we didn't get any converters for our data, return what we have
    if (! Object.keys(converters).length )
        return records;

    // iterate over our records and convert our data to the type specified in the converters
    return records.map(row => {
        const result = {} as T;
        for (const key in row) {
            const castFn = converters[key as keyof T];
            result[key as keyof T] = castFn ? castFn(row[key]) : row[key];
        }
        return result;
    });

}