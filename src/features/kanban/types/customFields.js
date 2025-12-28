/**
 * Custom Fields Data Model
 * Trello-style custom fields system for cards
 */

/**
 * Custom Field Types
 */
export const CUSTOM_FIELD_TYPES = {
    TEXT: "text",
    NUMBER: "number",
    DATE: "date",
    CHECKBOX: "checkbox",
    DROPDOWN: "dropdown",
};

/**
 * @typedef {object} CustomFieldDefinition
 * @property {string} id - Unique identifier
 * @property {string} name - Field name (e.g., "Priority", "Status")
 * @property {string} type - Field type (text, number, date, checkbox, dropdown)
 * @property {boolean} enabled - Whether field is active
 * @property {number} position - Display order
 * @property {object} options - Type-specific options
 */

/**
 * @typedef {object} CustomFieldValue
 * @property {string} fieldId - Reference to field definition
 * @property {any} value - The actual value (type depends on field type)
 * @property {string} updatedAt - Last update timestamp
 * @property {string} updatedBy - User ID who updated
 */

/**
 * Create a new custom field definition
 */
export const createCustomFieldDefinition = (name, type, options = {}) => {
    return {
        id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        type,
        enabled: true,
        position: 0,
        options: getDefaultOptionsForType(type, options),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
};

/**
 * Get default options for a field type
 */
const getDefaultOptionsForType = (type, customOptions = {}) => {
    const defaults = {
        [CUSTOM_FIELD_TYPES.TEXT]: {
            placeholder: "Enter text...",
            maxLength: 255,
            multiline: false,
        },
        [CUSTOM_FIELD_TYPES.NUMBER]: {
            placeholder: "0",
            min: null,
            max: null,
            step: 1,
            prefix: "",
            suffix: "",
        },
        [CUSTOM_FIELD_TYPES.DATE]: {
            includeTime: false,
            minDate: null,
            maxDate: null,
        },
        [CUSTOM_FIELD_TYPES.CHECKBOX]: {
            label: "Enabled",
            defaultValue: false,
        },
        [CUSTOM_FIELD_TYPES.DROPDOWN]: {
            options: [],
            allowMultiple: false,
            allowCustom: false,
        },
    };

    return { ...defaults[type], ...customOptions };
};

/**
 * Create a custom field value
 */
export const createCustomFieldValue = (fieldId, value, userId) => {
    return {
        fieldId,
        value,
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
    };
};

/**
 * Validate custom field value
 */
export const validateCustomFieldValue = (fieldDefinition, value) => {
    const { type, options } = fieldDefinition;

    switch (type) {
        case CUSTOM_FIELD_TYPES.TEXT:
            if (typeof value !== "string")
                return { valid: false, error: "Must be text" };
            if (options.maxLength && value.length > options.maxLength) {
                return {
                    valid: false,
                    error: `Max ${options.maxLength} characters`,
                };
            }
            return { valid: true };

        case CUSTOM_FIELD_TYPES.NUMBER:
            const num = parseFloat(value);
            if (isNaN(num)) return { valid: false, error: "Must be a number" };
            if (options.min !== null && num < options.min) {
                return {
                    valid: false,
                    error: `Minimum value is ${options.min}`,
                };
            }
            if (options.max !== null && num > options.max) {
                return {
                    valid: false,
                    error: `Maximum value is ${options.max}`,
                };
            }
            return { valid: true };

        case CUSTOM_FIELD_TYPES.DATE:
            const date = new Date(value);
            if (isNaN(date.getTime()))
                return { valid: false, error: "Invalid date" };
            if (options.minDate && date < new Date(options.minDate)) {
                return { valid: false, error: "Date is too early" };
            }
            if (options.maxDate && date > new Date(options.maxDate)) {
                return { valid: false, error: "Date is too late" };
            }
            return { valid: true };

        case CUSTOM_FIELD_TYPES.CHECKBOX:
            if (typeof value !== "boolean")
                return { valid: false, error: "Must be true/false" };
            return { valid: true };

        case CUSTOM_FIELD_TYPES.DROPDOWN:
            if (options.allowMultiple) {
                if (!Array.isArray(value))
                    return { valid: false, error: "Must be an array" };
                const validOptions = options.options.map((opt) => opt.value);
                const invalidValues = value.filter(
                    (v) => !validOptions.includes(v),
                );
                if (invalidValues.length > 0) {
                    return { valid: false, error: "Invalid option selected" };
                }
            } else {
                const validOptions = options.options.map((opt) => opt.value);
                if (!validOptions.includes(value)) {
                    return { valid: false, error: "Invalid option" };
                }
            }
            return { valid: true };

        default:
            return { valid: false, error: "Unknown field type" };
    }
};

/**
 * Format custom field value for display
 */
export const formatCustomFieldValue = (fieldDefinition, value) => {
    const { type, options } = fieldDefinition;

    if (value === null || value === undefined || value === "") {
        return "—";
    }

    switch (type) {
        case CUSTOM_FIELD_TYPES.TEXT:
            return value;

        case CUSTOM_FIELD_TYPES.NUMBER:
            const prefix = options.prefix || "";
            const suffix = options.suffix || "";
            return `${prefix}${value}${suffix}`;

        case CUSTOM_FIELD_TYPES.DATE:
            const date = new Date(value);
            if (options.includeTime) {
                return date.toLocaleString();
            }
            return date.toLocaleDateString();

        case CUSTOM_FIELD_TYPES.CHECKBOX:
            return value ? "✓ Yes" : "✗ No";

        case CUSTOM_FIELD_TYPES.DROPDOWN:
            if (options.allowMultiple && Array.isArray(value)) {
                const optionLabels = value.map((v) => {
                    const option = options.options.find(
                        (opt) => opt.value === v,
                    );
                    return option ? option.label : v;
                });
                return optionLabels.join(", ");
            } else {
                const option = options.options.find(
                    (opt) => opt.value === value,
                );
                return option ? option.label : value;
            }

        default:
            return String(value);
    }
};

/**
 * Get custom field value from card
 */
export const getCustomFieldValue = (card, fieldId) => {
    if (!card) return null;
    const customField = card.customFields?.find((cf) => cf.fieldId === fieldId);
    return customField ? customField.value : null;
};

/**
 * Update custom field value in card
 */
export const updateCustomFieldValue = (card, fieldId, value, userId) => {
    if (!card) return null;
    const existingFields = card.customFields || [];
    const existingFieldIndex = existingFields.findIndex(
        (cf) => cf.fieldId === fieldId,
    );

    if (existingFieldIndex >= 0) {
        // Update existing
        const updatedFields = [...existingFields];
        updatedFields[existingFieldIndex] = createCustomFieldValue(
            fieldId,
            value,
            userId,
        );
        return { ...card, customFields: updatedFields };
    } else {
        // Add new
        return {
            ...card,
            customFields: [
                ...existingFields,
                createCustomFieldValue(fieldId, value, userId),
            ],
        };
    }
};

/**
 * Remove custom field value from card
 */
export const removeCustomFieldValue = (card, fieldId) => {
    return {
        ...card,
        customFields: (card.customFields || []).filter(
            (cf) => cf.fieldId !== fieldId,
        ),
    };
};

/**
 * Default custom field definitions (examples)
 */
export const DEFAULT_CUSTOM_FIELDS = [
    {
        id: "field-priority",
        name: "Priority",
        type: CUSTOM_FIELD_TYPES.DROPDOWN,
        enabled: true,
        position: 0,
        options: {
            options: [
                { value: "low", label: "Low", color: "#61bd4f" },
                { value: "medium", label: "Medium", color: "#f2d600" },
                { value: "high", label: "High", color: "#ff9f1a" },
                { value: "critical", label: "Critical", color: "#eb5a46" },
            ],
            allowMultiple: false,
            allowCustom: false,
        },
    },
    {
        id: "field-status",
        name: "Status",
        type: CUSTOM_FIELD_TYPES.DROPDOWN,
        enabled: true,
        position: 1,
        options: {
            options: [
                {
                    value: "not-started",
                    label: "Not Started",
                    color: "#b3bac5",
                },
                {
                    value: "in-progress",
                    label: "In Progress",
                    color: "#00c2e0",
                },
                { value: "blocked", label: "Blocked", color: "#eb5a46" },
                { value: "completed", label: "Completed", color: "#61bd4f" },
            ],
            allowMultiple: false,
            allowCustom: false,
        },
    },
    {
        id: "field-estimate",
        name: "Time Estimate",
        type: CUSTOM_FIELD_TYPES.NUMBER,
        enabled: false,
        position: 2,
        options: {
            placeholder: "0",
            min: 0,
            max: 100,
            step: 0.5,
            suffix: " hours",
        },
    },
    {
        id: "field-completed",
        name: "Completed",
        type: CUSTOM_FIELD_TYPES.CHECKBOX,
        enabled: false,
        position: 3,
        options: {
            label: "Mark as completed",
            defaultValue: false,
        },
    },
];
