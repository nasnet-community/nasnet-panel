/**
 * Zod validation schema for ntfy.sh notification configuration
 * @description Per Task 11 (NAS-18.X): Ntfy.sh notification channel
 *
 * Matches backend NtfyChannelInput type from GraphQL schema.
 */
import { z } from 'zod';
/**
 * Ntfy configuration schema
 * @description Validates ntfy notification endpoint configuration with topics, authentication, and priority settings
 *
 * Field names match backend GraphQL NtfyChannelInput:
 * - enabled: Whether ntfy notifications are enabled
 * - serverUrl: Ntfy server URL (e.g., https://ntfy.sh or self-hosted)
 * - topic: Topic to publish to (validated against ntfy naming rules)
 * - username: Optional username for authentication
 * - password: Optional password for authentication
 * - priority: Message priority (1-5, default: 3)
 * - tags: Optional tags for categorization
 */
export declare const ntfyConfigSchema: z.ZodEffects<z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    serverUrl: z.ZodDefault<z.ZodEffects<z.ZodString, string, string>>;
    topic: z.ZodString;
    username: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    password: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    priority: z.ZodDefault<z.ZodNumber>;
    tags: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    tags: string[];
    topic: string;
    priority: number;
    serverUrl: string;
    password?: string | undefined;
    username?: string | undefined;
}, {
    topic: string;
    password?: string | undefined;
    username?: string | undefined;
    enabled?: boolean | undefined;
    tags?: string[] | undefined;
    priority?: number | undefined;
    serverUrl?: string | undefined;
}>, {
    enabled: boolean;
    tags: string[];
    topic: string;
    priority: number;
    serverUrl: string;
    password?: string | undefined;
    username?: string | undefined;
}, {
    topic: string;
    password?: string | undefined;
    username?: string | undefined;
    enabled?: boolean | undefined;
    tags?: string[] | undefined;
    priority?: number | undefined;
    serverUrl?: string | undefined;
}>;
/**
 * Type inference from schema
 * @description Exported type representing validated ntfy configuration
 */
export type NtfyConfig = z.infer<typeof ntfyConfigSchema>;
/**
 * Default values for new ntfy configuration
 * @description Pre-populated defaults for new ntfy notification forms
 */
export declare const DEFAULT_NTFY_CONFIG: Partial<NtfyConfig>;
/**
 * Ntfy priority presets with descriptions
 * @description Available notification priority levels for ntfy messages
 */
export declare const NTFY_PRIORITY_PRESETS: readonly [{
    readonly value: 1;
    readonly label: "Min Priority";
    readonly description: "Minimal priority, no sound, no vibration";
    readonly icon: "🔕";
}, {
    readonly value: 2;
    readonly label: "Low Priority";
    readonly description: "Low priority, no sound, no vibration";
    readonly icon: "🔉";
}, {
    readonly value: 3;
    readonly label: "Default Priority";
    readonly description: "Normal priority, sound and vibration";
    readonly icon: "🔔";
}, {
    readonly value: 4;
    readonly label: "High Priority";
    readonly description: "High priority, longer sound and vibration";
    readonly icon: "⏰";
}, {
    readonly value: 5;
    readonly label: "Urgent Priority";
    readonly description: "Maximum priority, repeating sound and vibration";
    readonly icon: "🚨";
}];
/**
 * Common ntfy server presets
 * @description Pre-configured ntfy server URLs for quick setup
 */
export declare const NTFY_SERVER_PRESETS: readonly [{
    readonly label: "ntfy.sh (Public)";
    readonly url: "https://ntfy.sh";
    readonly description: "Free public ntfy.sh server (no auth required)";
}, {
    readonly label: "Self-hosted";
    readonly url: "";
    readonly description: "Enter your own ntfy server URL";
}];
/**
 * Validate ntfy topic name
 * @description Topics must be alphanumeric with hyphens and underscores
 * @param topic The topic name to validate
 * @returns True if topic is valid, false otherwise
 */
export declare function isValidNtfyTopic(topic: string): boolean;
/**
 * Validate ntfy server URL
 * @description Checks if URL uses http or https protocol
 * @param url The server URL to validate
 * @returns True if URL is valid, false otherwise
 */
export declare function isValidNtfyServerUrl(url: string): boolean;
/**
 * Helper to format tags array for display
 * @description Joins tags with comma separator for UI display
 * @param tags Array of tag strings
 * @returns Comma-separated string of tags
 */
export declare function formatNtfyTags(tags: string[]): string;
/**
 * Helper to parse tags string into array
 * @description Splits comma-separated tag string and trims whitespace
 * @param tagsString Comma-separated tag string from input
 * @returns Array of trimmed tag strings
 */
export declare function parseNtfyTags(tagsString: string): string[];
//# sourceMappingURL=ntfy-config.schema.d.ts.map