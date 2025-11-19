import XLSX from 'xlsx';
import path from 'path';

/**
 * A helper function to parse an xlsx workbook and return an array of T objects
 * @param filePath path to the workbook
 * @param sheetName worksheet to read (or omit to use the first sheet)
 * @returns
 */
export function readXLSX<T extends Record<string, any>>(filePath: string, sheetName?: string): T[] {
    // read the file
    const absPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    const workbook = XLSX.readFile(absPath);

    // Determine which sheet to use
    const targetSheetName = sheetName ?? workbook.SheetNames[0]; // fallback to first sheet

    // throw if we have workbook or sheet sheet errors
    if (!targetSheetName)
        throw new Error(`Error while reading workbook '${filePath}'. No sheets found in workbook.`);

    const sheet = workbook.Sheets[targetSheetName];
    if (!sheet) throw new Error(`Worksheet not found: ${targetSheetName}`);

    const rows: T[] = XLSX.utils.sheet_to_json(sheet);

    return rows;
}
