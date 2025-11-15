import { MAX_SCHEMA_ERRORS } from '@configs/api/api.config.ts';
import { Logger } from '@utils/logger.ts';
import { Ajv, ErrorObject, JSONSchemaType, ValidateFunction } from 'ajv';
import formatsPlugin from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
formatsPlugin.default(ajv);

/** Cache compiled schemas to avoid recompilation cost */
const validatorCache = new Map<object, ValidateFunction>();

/**
 * Format Ajv validation errors into a readable string.
 */
function formatErrors(errors: ErrorObject[] | null | undefined): string {
    if (!errors || errors.length === 0) return '';

    const errorCount = errors.length;
    const errorCountExceeded = errorCount > MAX_SCHEMA_ERRORS;
    const addtl = errorCountExceeded
        ? `Schema error count exceeded maximum allowed count. Showing first ${MAX_SCHEMA_ERRORS} of ${errorCount} errors.\n`
        : '';

    // trim the array of errors if we exceeded max allowed count
    if (errorCountExceeded) errors.splice(MAX_SCHEMA_ERRORS + 1);

    // format the errors into a string
    const errStr = errors
        .map((err) => {
            const path = err.instancePath || '(root)';
            const message = err.message || JSON.stringify(err.params);
            return `${path} — ${message}`;
        })
        .join('\n');

    return `${addtl}${errStr}`;
}

/**
 * Validate data against a JSON schema.
 * Returns { valid, errors, message }
 *
 * @param data   - The data to validate
 * @param schema - The JSON schema (type-safe if using JSONSchemaType<T>)
 */
export function validateSchema<T>(
    data: unknown,
    schema: JSONSchemaType<T> | object
): {
    valid: boolean;
    errors: ErrorObject[] | null | undefined;
    message: string;
} {
    if (schema == null) {
        Logger.warn('No schema was configured for the route. Skipping validation');
        return { valid: true, errors: [], message: '' };
    }

    // Reuse compiled schema if available
    let validateFn = validatorCache.get(schema) as ValidateFunction<T> | undefined;

    if (!validateFn) {
        validateFn = ajv.compile<T>(schema as any);
        validatorCache.set(schema, validateFn);
    }

    // validate the schema and format the errors
    const valid = validateFn(data as T);
    const message = valid ? '' : formatErrors(validateFn.errors);

    return {
        valid, // true/false for quick check of validitity
        errors: validateFn.errors, // raw error array
        message, // formatted string of error messages
    };
}

/**
 * Variant that throws a detailed error when validation fails rather than just returning the validity state
 */
export function assertSchema<T>(
    data: unknown,
    schema: JSONSchemaType<T> | object,
    context = 'response'
): asserts data is T {
    const { valid, message, errors } = validateSchema<T>(data, schema);
    if (!valid) {
        throw new Error(
            `❌ Schema validation failed for ${context}:\n${message}\n\n${JSON.stringify(errors, null, 2)}`
        );
    }
}
