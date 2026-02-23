import { useCallback, useState, useMemo } from 'react';

import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  supportedLanguages,
  languageNames,
  type SupportedLanguage,
} from '@nasnet/core/i18n';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  cn,
} from '@nasnet/ui/primitives';

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
export function LanguageSwitcher({
  className,
  showLabel = false,
  onBeforeChange,
}: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const currentLanguage = i18n.language as SupportedLanguage;
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = useCallback(
    async (newLang: SupportedLanguage) => {
      if (newLang === currentLanguage) {
        setIsOpen(false);
        return;
      }

      // Check with parent before changing
      if (onBeforeChange) {
        const shouldProceed = await onBeforeChange(newLang);
        if (!shouldProceed) {
          setIsOpen(false);
          return;
        }
      }

      // Store the new language preference
      localStorage.setItem('nasnet-language', newLang);

      // Reload the page to apply the new language
      // This is the architectural decision for clean state
      window.location.reload();
    },
    [currentLanguage, onBeforeChange]
  );

  const currentLanguageName = languageNames[currentLanguage] || languageNames.en;
  const ariaLabel = useMemo(
    () => `${t('settings.language.title')}: ${currentLanguageName}`,
    [t, currentLanguageName]
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={showLabel ? 'default' : 'icon'}
          className={cn(
            'rounded-full hover:bg-accent transition-all duration-200',
            showLabel && 'gap-2 px-3',
            className
          )}
          aria-label={ariaLabel}
          title={ariaLabel}
        >
          <Globe className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          {showLabel && (
            <span className="text-sm text-muted-foreground">
              {currentLanguageName}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {supportedLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => handleLanguageChange(lang)}
            className={cn(
              'cursor-pointer',
              lang === currentLanguage && 'bg-accent font-medium'
            )}
            role="option"
            aria-selected={lang === currentLanguage}
          >
            <span className="flex-1">{languageNames[lang]}</span>
            {lang === currentLanguage && (
              <span className="text-xs text-muted-foreground" aria-hidden="true">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

LanguageSwitcher.displayName = 'LanguageSwitcher';
