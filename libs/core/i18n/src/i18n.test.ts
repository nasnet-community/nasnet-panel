import { describe, it, expect } from 'vitest';
import {
  supportedLanguages,
  rtlLanguages,
  languageNames,
  isRTLLanguage,
  getLanguageDirection,
} from './i18n';

describe('i18n Configuration', () => {
  describe('supportedLanguages', () => {
    it('should include English as default', () => {
      expect(supportedLanguages).toContain('en');
    });

    it('should include Persian for RTL testing', () => {
      expect(supportedLanguages).toContain('fa');
    });
  });

  describe('rtlLanguages', () => {
    it('should include Persian', () => {
      expect(rtlLanguages).toContain('fa');
    });

    it('should not include English', () => {
      expect(rtlLanguages).not.toContain('en');
    });
  });

  describe('languageNames', () => {
    it('should have English name', () => {
      expect(languageNames.en).toBe('English');
    });

    it('should have Persian name in native script', () => {
      expect(languageNames.fa).toBe('فارسی');
    });

    it('should have names for all supported languages', () => {
      for (const lang of supportedLanguages) {
        expect(languageNames[lang]).toBeDefined();
        expect(languageNames[lang].length).toBeGreaterThan(0);
      }
    });
  });

  describe('isRTLLanguage', () => {
    it('should return true for Persian', () => {
      expect(isRTLLanguage('fa')).toBe(true);
    });

    it('should return false for English', () => {
      expect(isRTLLanguage('en')).toBe(false);
    });

    it('should return false for unknown languages', () => {
      expect(isRTLLanguage('unknown')).toBe(false);
    });
  });

  describe('getLanguageDirection', () => {
    it('should return rtl for Persian', () => {
      expect(getLanguageDirection('fa')).toBe('rtl');
    });

    it('should return ltr for English', () => {
      expect(getLanguageDirection('en')).toBe('ltr');
    });

    it('should return ltr for unknown languages', () => {
      expect(getLanguageDirection('unknown')).toBe('ltr');
    });
  });
});
