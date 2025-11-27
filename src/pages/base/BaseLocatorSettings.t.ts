/**
 * Available element types in the Dropdown
 */
export const ElementType = {
    button: 'Button',
    input: 'Input',
    textarea: 'Textarea',
    select: 'Select',
    label: 'Label',
} as const;
export type ElementTypeOption = keyof typeof ElementType;

/**
 * Available element settings in the checkboxes
 */
export const ElementSetting = {
    visible: 'Visible',
    enabled: 'Enabled',
    editable: 'Editable',
    onTop: 'On Top',
    nonZeroSize: 'Non Zero Size',
} as const;

export type ElementSettingOption = keyof typeof ElementSetting;

// State map of element states that are tracked/modified with checkboxes
export type ElementStates = Record<ElementSettingOption, boolean>;
