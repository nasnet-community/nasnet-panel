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
export const ntfyConfigSchema = z
  .object({
    enabled: z.boolean().default(false),

    // Server Settings
    serverUrl: z
      .string()
      .min(1, 'Server URL is required (must be provided)')
      .url('Invalid URL format - must be a valid web address')
      .refine(
        (url) => {
          // Ensure URL uses https:// or http://
          const urlObj = new URL(url);
          return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
        },
        { message: 'Server URL must use http:// or https:// protocol' }
      )
      .default('https://ntfy.sh'),

    // Topic (ntfy topic naming rules: alphanumeric, hyphens, underscores)
    topic: z
      .string()
      .min(1, 'Topic is required (must be provided)')
      .max(255, 'Topic must not exceed 255 characters')
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        'Topic can only contain letters, numbers, hyphens, and underscores (no spaces or special characters)'
      ),

    // Authentication (Optional)
    username: z
      .string()
      .max(255, 'Username must not exceed 255 characters')
      .optional()
      .or(z.literal('')),

    password: z
      .string()
      .max(255, 'Password must not exceed 255 characters')
      .optional()
      .or(z.literal('')),

    // Priority (1=min, 2=low, 3=default, 4=high, 5=urgent/max)
    priority: z
      .number()
      .int('Priority must be a whole number')
      .min(1, 'Priority must be between 1 (minimum) and 5 (maximum)')
      .max(5, 'Priority must be between 1 (minimum) and 5 (maximum)')
      .default(3),

    // Tags for categorization (comma-separated or array)
    tags: z
      .array(z.string().trim().min(1))
      .max(10, 'Maximum 10 tags allowed per notification')
      .optional()
      .default([]),
  })
  .refine(
    (data) => {
      // If username is provided, password must also be provided
      const hasUsername = data.username && data.username.trim().length > 0;
      const hasPassword = data.password && data.password.trim().length > 0;

      if (hasUsername && !hasPassword) {
        return false;
      }
      if (hasPassword && !hasUsername) {
        return false;
      }

      return true;
    },
    {
      message: 'Both username and password must be provided together for authentication',
      path: ['password'],
    }
  );

/**
 * Type inference from schema
 * @description Exported type representing validated ntfy configuration
 */
export type NtfyConfig = z.infer<typeof ntfyConfigSchema>;

/**
 * Default values for new ntfy configuration
 * @description Pre-populated defaults for new ntfy notification forms
 */
export const DEFAULT_NTFY_CONFIG: Partial<NtfyConfig> = {
  enabled: false,
  serverUrl: 'https://ntfy.sh',
  topic: '',
  username: '',
  password: '',
  priority: 3,
  tags: [],
};

/**
 * Ntfy priority presets with descriptions
 * @description Available notification priority levels for ntfy messages
 */
export const NTFY_PRIORITY_PRESETS = [
  {
    value: 1,
    label: 'Min Priority',
    description: 'Minimal priority, no sound, no vibration',
    icon: '🔕',
  },
  {
    value: 2,
    label: 'Low Priority',
    description: 'Low priority, no sound, no vibration',
    icon: '🔉',
  },
  {
    value: 3,
    label: 'Default Priority',
    description: 'Normal priority, sound and vibration',
    icon: '🔔',
  },
  {
    value: 4,
    label: 'High Priority',
    description: 'High priority, longer sound and vibration',
    icon: '⏰',
  },
  {
    value: 5,
    label: 'Urgent Priority',
    description: 'Maximum priority, repeating sound and vibration',
    icon: '🚨',
  },
] as const;

/**
 * Common ntfy server presets
 * @description Pre-configured ntfy server URLs for quick setup
 */
export const NTFY_SERVER_PRESETS = [
  {
    label: 'ntfy.sh (Public)',
    url: 'https://ntfy.sh',
    description: 'Free public ntfy.sh server (no auth required)',
  },
  {
    label: 'Self-hosted',
    url: '',
    description: 'Enter your own ntfy server URL',
  },
] as const;

/**
 * Validate ntfy topic name
 * @description Topics must be alphanumeric with hyphens and underscores
 * @param topic The topic name to validate
 * @returns True if topic is valid, false otherwise
 */
export function isValidNtfyTopic(topic: string): boolean {
  if (!topic || topic.length === 0 || topic.length > 255) {
    return false;
  }
  return /^[a-zA-Z0-9_-]+$/.test(topic);
}

/**
 * Validate ntfy server URL
 * @description Checks if URL uses http or https protocol
 * @param url The server URL to validate
 * @returns True if URL is valid, false otherwise
 */
export function isValidNtfyServerUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Helper to format tags array for display
 * @description Joins tags with comma separator for UI display
 * @param tags Array of tag strings
 * @returns Comma-separated string of tags
 */
export function formatNtfyTags(tags: string[]): string {
  return tags.join(', ');
}

/**
 * Helper to parse tags string into array
 * @description Splits comma-separated tag string and trims whitespace
 * @param tagsString Comma-separated tag string from input
 * @returns Array of trimmed tag strings
 */
export function parseNtfyTags(tagsString: string): string[] {
  return tagsString
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}
