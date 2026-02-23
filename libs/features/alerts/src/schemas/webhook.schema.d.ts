/**
 * Zod validation schema for webhook notification configuration
 * @description Per Task 9 (NAS-18.4): Webhook configuration form with HTTPS enforcement
 *
 * Matches backend CreateWebhookInput/UpdateWebhookInput types from GraphQL schema.
 */
import { z } from 'zod';
/**
 * Webhook configuration schema
 * @description Validates webhook endpoints with authentication, templates, and delivery options
 *
 * Field names match backend exactly from CreateWebhookInput
 */
export declare const webhookConfigSchema: z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    url: z.ZodEffects<z.ZodString, string, string>;
    authType: z.ZodDefault<z.ZodEnum<["NONE", "BASIC", "BEARER"]>>;
    username: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodString>;
    bearerToken: z.ZodOptional<z.ZodString>;
    template: z.ZodDefault<z.ZodEnum<["GENERIC", "SLACK", "DISCORD", "TEAMS", "CUSTOM"]>>;
    customTemplate: z.ZodOptional<z.ZodString>;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    method: z.ZodOptional<z.ZodDefault<z.ZodEnum<["POST", "PUT"]>>>;
    signingSecret: z.ZodOptional<z.ZodString>;
    timeoutSeconds: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    retryEnabled: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    maxRetries: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    enabled: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    url: string;
    template: "GENERIC" | "CUSTOM" | "SLACK" | "DISCORD" | "TEAMS";
    enabled: boolean;
    authType: "NONE" | "BASIC" | "BEARER";
    method?: "POST" | "PUT" | undefined;
    password?: string | undefined;
    username?: string | undefined;
    headers?: Record<string, string> | undefined;
    description?: string | undefined;
    maxRetries?: number | undefined;
    bearerToken?: string | undefined;
    customTemplate?: string | undefined;
    timeoutSeconds?: number | undefined;
    retryEnabled?: boolean | undefined;
    signingSecret?: string | undefined;
}, {
    name: string;
    url: string;
    method?: "POST" | "PUT" | undefined;
    password?: string | undefined;
    username?: string | undefined;
    template?: "GENERIC" | "CUSTOM" | "SLACK" | "DISCORD" | "TEAMS" | undefined;
    headers?: Record<string, string> | undefined;
    description?: string | undefined;
    enabled?: boolean | undefined;
    maxRetries?: number | undefined;
    authType?: "NONE" | "BASIC" | "BEARER" | undefined;
    bearerToken?: string | undefined;
    customTemplate?: string | undefined;
    timeoutSeconds?: number | undefined;
    retryEnabled?: boolean | undefined;
    signingSecret?: string | undefined;
}>, {
    name: string;
    url: string;
    template: "GENERIC" | "CUSTOM" | "SLACK" | "DISCORD" | "TEAMS";
    enabled: boolean;
    authType: "NONE" | "BASIC" | "BEARER";
    method?: "POST" | "PUT" | undefined;
    password?: string | undefined;
    username?: string | undefined;
    headers?: Record<string, string> | undefined;
    description?: string | undefined;
    maxRetries?: number | undefined;
    bearerToken?: string | undefined;
    customTemplate?: string | undefined;
    timeoutSeconds?: number | undefined;
    retryEnabled?: boolean | undefined;
    signingSecret?: string | undefined;
}, {
    name: string;
    url: string;
    method?: "POST" | "PUT" | undefined;
    password?: string | undefined;
    username?: string | undefined;
    template?: "GENERIC" | "CUSTOM" | "SLACK" | "DISCORD" | "TEAMS" | undefined;
    headers?: Record<string, string> | undefined;
    description?: string | undefined;
    enabled?: boolean | undefined;
    maxRetries?: number | undefined;
    authType?: "NONE" | "BASIC" | "BEARER" | undefined;
    bearerToken?: string | undefined;
    customTemplate?: string | undefined;
    timeoutSeconds?: number | undefined;
    retryEnabled?: boolean | undefined;
    signingSecret?: string | undefined;
}>, {
    name: string;
    url: string;
    template: "GENERIC" | "CUSTOM" | "SLACK" | "DISCORD" | "TEAMS";
    enabled: boolean;
    authType: "NONE" | "BASIC" | "BEARER";
    method?: "POST" | "PUT" | undefined;
    password?: string | undefined;
    username?: string | undefined;
    headers?: Record<string, string> | undefined;
    description?: string | undefined;
    maxRetries?: number | undefined;
    bearerToken?: string | undefined;
    customTemplate?: string | undefined;
    timeoutSeconds?: number | undefined;
    retryEnabled?: boolean | undefined;
    signingSecret?: string | undefined;
}, {
    name: string;
    url: string;
    method?: "POST" | "PUT" | undefined;
    password?: string | undefined;
    username?: string | undefined;
    template?: "GENERIC" | "CUSTOM" | "SLACK" | "DISCORD" | "TEAMS" | undefined;
    headers?: Record<string, string> | undefined;
    description?: string | undefined;
    enabled?: boolean | undefined;
    maxRetries?: number | undefined;
    authType?: "NONE" | "BASIC" | "BEARER" | undefined;
    bearerToken?: string | undefined;
    customTemplate?: string | undefined;
    timeoutSeconds?: number | undefined;
    retryEnabled?: boolean | undefined;
    signingSecret?: string | undefined;
}>, {
    name: string;
    url: string;
    template: "GENERIC" | "CUSTOM" | "SLACK" | "DISCORD" | "TEAMS";
    enabled: boolean;
    authType: "NONE" | "BASIC" | "BEARER";
    method?: "POST" | "PUT" | undefined;
    password?: string | undefined;
    username?: string | undefined;
    headers?: Record<string, string> | undefined;
    description?: string | undefined;
    maxRetries?: number | undefined;
    bearerToken?: string | undefined;
    customTemplate?: string | undefined;
    timeoutSeconds?: number | undefined;
    retryEnabled?: boolean | undefined;
    signingSecret?: string | undefined;
}, {
    name: string;
    url: string;
    method?: "POST" | "PUT" | undefined;
    password?: string | undefined;
    username?: string | undefined;
    template?: "GENERIC" | "CUSTOM" | "SLACK" | "DISCORD" | "TEAMS" | undefined;
    headers?: Record<string, string> | undefined;
    description?: string | undefined;
    enabled?: boolean | undefined;
    maxRetries?: number | undefined;
    authType?: "NONE" | "BASIC" | "BEARER" | undefined;
    bearerToken?: string | undefined;
    customTemplate?: string | undefined;
    timeoutSeconds?: number | undefined;
    retryEnabled?: boolean | undefined;
    signingSecret?: string | undefined;
}>;
/**
 * Type inference from schema
 * @description Exported type representing validated webhook configuration
 */
export type WebhookConfig = z.infer<typeof webhookConfigSchema>;
/**
 * Default values for new webhook configuration
 * @description Pre-populated defaults for new webhook forms
 */
export declare const DEFAULT_WEBHOOK_CONFIG: Partial<WebhookConfig>;
/**
 * Template presets with descriptions
 * @description Available webhook payload templates for different services
 */
export declare const WEBHOOK_TEMPLATE_PRESETS: readonly [{
    readonly value: "GENERIC";
    readonly label: "Generic JSON";
    readonly description: "Standard JSON payload";
}, {
    readonly value: "SLACK";
    readonly label: "Slack";
    readonly description: "Slack-compatible webhook format";
}, {
    readonly value: "DISCORD";
    readonly label: "Discord";
    readonly description: "Discord webhook format";
}, {
    readonly value: "TEAMS";
    readonly label: "Microsoft Teams";
    readonly description: "Teams connector format";
}, {
    readonly value: "CUSTOM";
    readonly label: "Custom Template";
    readonly description: "Define your own JSON template";
}];
/**
 * Auth type options
 * @description Available authentication methods for webhook endpoints
 */
export declare const AUTH_TYPE_OPTIONS: readonly [{
    readonly value: "NONE";
    readonly label: "No Authentication";
    readonly description: "Public webhook endpoint";
}, {
    readonly value: "BASIC";
    readonly label: "Basic Auth";
    readonly description: "Username and password";
}, {
    readonly value: "BEARER";
    readonly label: "Bearer Token";
    readonly description: "Authorization header token";
}];
/**
 * Transform form data to GraphQL CreateWebhookInput
 * @description Converts validated webhook configuration to GraphQL mutation input, removing undefined values
 * @param config Validated webhook configuration object
 * @returns GraphQL CreateWebhookInput object
 */
export declare function toWebhookInput(config: WebhookConfig): {
    name: string;
    description: string | undefined;
    url: string;
    method: "POST" | "PUT";
    authType: "NONE" | "BASIC" | "BEARER";
    username: string | undefined;
    password: string | undefined;
    bearerToken: string | undefined;
    headers: Record<string, string> | undefined;
    template: "GENERIC" | "CUSTOM" | "SLACK" | "DISCORD" | "TEAMS";
    customTemplate: string | undefined;
    signingSecret: string | undefined;
    timeoutSeconds: number | undefined;
    retryEnabled: boolean | undefined;
    maxRetries: number | undefined;
    enabled: boolean;
};
//# sourceMappingURL=webhook.schema.d.ts.map