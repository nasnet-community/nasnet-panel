import { z } from 'zod';
import type { ConfigSchema } from '@nasnet/api-client/generated';
/**
 * Builds a Zod schema from a backend ConfigSchema for dynamic form validation
 *
 * Converts backend ConfigSchema (with ConfigFieldType enum) into a Zod validation schema
 * for use with React Hook Form. Error messages are localized via i18n.
 *
 * This utility handles all standard field types: TEXT, PASSWORD, EMAIL, URL, NUMBER,
 * TOGGLE, SELECT, MULTI_SELECT, TEXT_ARRAY, IP, PORT, and PATH. Each field type
 * receives appropriate validation rules (length, range, format, options).
 *
 * @param configSchema - The configuration schema from the backend
 * @returns A Zod object schema for validation
 *
 * @example
 * ```tsx
 * function ConfigureService() {
 *   const { t } = useTranslation();
 *   const schema = useServiceConfigSchema('tor');
 *   const zodSchema = buildZodSchema(schema);
 *
 *   const form = useForm({
 *     resolver: zodResolver(zodSchema),
 *     defaultValues: schema.fields.reduce((acc, field) => ({
 *       ...acc,
 *       [field.name]: field.defaultValue
 *     }), {})
 *   });
 *
 *   return <form><RHFFormField form={form} {...field} /></form>;
 * }
 * ```
 *
 * @see useServiceConfigSchema - Hook to fetch schema from backend
 * @see evaluateCondition - For field visibility conditions
 */
export declare function buildZodSchema(configSchema: ConfigSchema): z.ZodObject<any>;
/**
 * Evaluates a conditional visibility expression (showIf field)
 *
 * The showIf expression is a simple condition like "field === 'value'" or "field !== 'value'"
 *
 * @param condition - The showIf condition string
 * @param formValues - Current form values
 * @returns True if the field should be shown
 *
 * @example
 * ```tsx
 * // Field definition: { name: 'port', showIf: 'enableCustomPort === true' }
 * const shouldShow = evaluateCondition('enableCustomPort === true', { enableCustomPort: true });
 * // shouldShow = true
 * ```
 */
export declare function evaluateCondition(condition: string | undefined, formValues: Record<string, any>): boolean;
//# sourceMappingURL=zodSchemaBuilder.d.ts.map