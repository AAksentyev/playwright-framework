import { TAG } from '@constants/tags.ts';
import { expect } from '@fixtures/base.ts';
import { test } from '@fixtures/dynamic-table-page.fixture.ts';
import { TASKS } from '@pages/examples/DynamicTable/DynamicTablePage.t.ts';

/**
 * Dynamic table tests
*/
test.describe('Dynamic Table tests', { tag: [TAG.UI, TAG.WIP] }, async () => {
    
    test('Tasks table has 5 rows', async({ dynamicTablePage })=>{
        const table = await dynamicTablePage.getTasksTable()
        expect(await table.getByRole('row').count()).toBe(5);
    })

    test('Chrome CPU table value matches the label value', async({ dynamicTablePage })=>{
        const chromeTableData = await dynamicTablePage.getRowDataByName('Chrome');
        const labelValue = await dynamicTablePage.getWarningLabelText();
        expect(`Chrome CPU: ${chromeTableData.CPU}`).toBe(labelValue);
    })

    // run a generic test for each row and ensure data exists for each cell and the format of the cell matches expected
    for ( const r of Object.keys(TASKS) as (keyof typeof TASKS)[] ){
        const taskName = TASKS[r];
        test.describe(`${taskName} tests`, async()=>{
            test(`${taskName} data should exist in the table`, async({ dynamicTablePage })=>{
                const chromeTableData = await dynamicTablePage.getRowDataByName(taskName);
                for (const [key, data] of Object.entries(chromeTableData)){
                    expect.soft(data, `${key} data is not empty`).not.toBe('');
                }
            })

            test(`Data format should be correct`, async({ dynamicTablePage })=>{
                const chromeTableData = await dynamicTablePage.getRowDataByName(taskName);
                
                expect.soft(chromeTableData.CPU, "CPU is in a '#%' or '#.#%' format").toMatch(/\d+(?:\.\d+)?\%/gm);
                expect.soft(chromeTableData.DISK, "Disk is in a '# MB/s' or '#.# MB/s' format").toMatch(/\d+(?:\.\d+)?\sMB\/s/g);
                expect.soft(chromeTableData.MEMORY, "Memory is in a '#.# MB' format").toMatch(/\d+(?:\.\d+)?\sMB/g);
                expect.soft(chromeTableData.NETWORK, "Network is in a '#.# Mbps' format").toMatch(/\d+(?:\.\d+)?\sMbps/g);
            })
        })
        
        
    }
    
});