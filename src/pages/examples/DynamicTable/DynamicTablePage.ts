import { expect, Locator, Page } from '@playwright/test';
import { Logger } from '@utils/logger.ts';
import { BasePage } from '@pages/base/BasePage.ts';
import { Interaction } from '@utils/reporters/heatmap/interaction.ts';
import { ColumnIndex, RowData, TABLE_HEADERS, TaskName } from './DynamicTablePage.t.ts';

/**
 * Example Page Object Model with a Dynamic Table
 *
 */
export class DynamicTablePage extends BasePage {

    constructor(protected page: Page) {
        super(page, 'DynamicTablePage');
    }

    /**
     * Defined non-null page url
     * Allows the use of `this.navigateToByUrl()` when using this POM
     */
    protected get url(): string | null {
        return '/dynamictable';
    }

    /** page header */
    private get pageHeader(): Locator {
        return this.page.getByRole('heading', { name: 'Dynamic Table' });
    }
    /** Locator for the textbox on the page */
    private get warningLabelLocator(): Locator {
        return this.page.locator('p.bg-warning');
    }

    /** Locator for the button on the page */
    private get tableLocator(): Locator {
        return this.page.getByRole('table', { name: 'Tasks' });
    }
    
    /**
     * Condition(s) to wait for when navigating to the page or waiting for it to load
     * Automatically invoked when using `this.navigateToByUrl()`
     */
    @Interaction('visibility_check', 'pageHeader')
    public async waitForPageLoad(): Promise<void> {
        await expect(this.pageHeader, `Text Input header should be visible`).toBeVisible();
    }

    @Interaction('visibility_check', 'warningLabelLocator')
    public async getWarningLabelText(): Promise<string> {
        await expect(this.warningLabelLocator).toBeVisible();
        return this.warningLabelLocator.innerText();
    }

    @Interaction('visibility_check', 'tableLocator')
    public async getTasksTable(): Promise<Locator> {
        await expect(this.tableLocator).toBeVisible();
        return this.tableLocator;
    }

    /**
     * Return the data from the row by the 'Name' column
     * @param name - the 'Name' value in the table to search by
     */
    public async getRowDataByName(name: TaskName): Promise<RowData> {
        // get the row from the table and ensure it exists
        // we should only have one match
        const row = this.tableLocator.getByRole('row').filter({ has: this.page.getByRole('cell', { name, exact: true }) })
        await expect(row).toHaveCount(1);

        // get the column order
        const indexes = await this.getColumnIndexes();
        
        let rowData: RowData = {
            CPU: '',
            NAME: '',
            MEMORY: '',
            DISK: '',
            NETWORK: ''
        };

        // fetch the row data for each column by index and return data
        for (const [key, label] of Object.entries(TABLE_HEADERS)) {
            const k = key as keyof typeof TABLE_HEADERS;
            if (indexes[k] === -1)
                throw new Error(`Column ${label} was not found in the table`);

            rowData[k] = await row.getByRole('cell').nth(indexes[k]).innerText();
        }

        return rowData;
    }

    /**
     * Get the column order of the table since the columns are inconsistent
     * @returns 
     */
    private async getColumnIndexes(): Promise<ColumnIndex> {
        // get our header row and figure out the column indices since they are inconsistent
        const headers = this.tableLocator.getByRole('row').first().getByRole('columnheader');
        const headerTexts = await headers.allInnerTexts();

        let result: ColumnIndex = {
            CPU: -1,
            NAME: -1,
            MEMORY: -1,
            DISK: -1,
            NETWORK: -1
        };

        // for each header find the index of the column by the column header label
        for (const [key, label] of Object.entries(TABLE_HEADERS)) {
            const index = headerTexts.findIndex(h => h.trim() === label);
            // if column was not found, throw
            if (index === -1)
                throw new Error(`Column Header '${label}' was not found in the table.`);

            result[key as keyof typeof TABLE_HEADERS] = index;
        }

        return result;
    }
}
