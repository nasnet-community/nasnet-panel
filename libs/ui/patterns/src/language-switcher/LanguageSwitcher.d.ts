import { type SupportedLanguage } from '@nasnet/core/i18n';
/**
 * Props for LanguageSwitcher component
 * Controls appearance and behavior of language selection
 */
export interface LanguageSwitcherProps {
    /**
     * Optional className for styling
     */
    className?: string;
    /**
     * Whether to show the current language name next to the icon
     * @default false
     */
    showLabel?: boolean;
    /**
     * Callback when language is about to change (before reload)
     * Return false to prevent the change
     */
    onBeforeChange?: (newLang: SupportedLanguage) => boolean | Promise<boolean>;
}
/**
 * LanguageSwitcher Component
 *
 * Provides a dropdown menu to switch between supported languages.
 * Language names are displayed in their native script.
 *
 * Features:
 * - Dropdown menu with all supported languages
 * - Shows language names in native script (English, فارسی, etc.)
 * - Warns about unsaved data before language switch
 * - Full keyboard accessibility (arrow keys, enter, escape)
 * - Screen reader friendly with aria-labels
 * - Full RTL support
 *
 * Note: Changing language will reload the page (per architectural decision).
 *
 * @example
 * ```tsx
 * <LanguageSwitcher />
 * <LanguageSwitcher showLabel />
 * <LanguageSwitcher onBeforeChange={handleUnsavedData} />
 * ```
 */
export declare function LanguageSwitcher({ className, showLabel, onBeforeChange, }: LanguageSwitcherProps): import("react/jsx-runtime").JSX.Element;
export declare namespace LanguageSwitcher {
    var displayName: string;
}
//# sourceMappingURL=LanguageSwitcher.d.ts.map