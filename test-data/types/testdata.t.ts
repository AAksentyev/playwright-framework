import { ElementTypeOption } from '@pages/base/BaseLocatorSettings.t.ts';

/**
 * example test data structure for type safety
 */
export interface ManufacturerYearTest {
    manufacturer: string;
    year: number;
    expectedRecordCount: number;
}

export interface InputSettingTestData {
    type: ElementTypeOption;
    visible: boolean;
    enabled: boolean;
    editable: boolean;
    onTop: boolean;
    nonZeroSize: boolean;
}
