# Internationalization Flow Guide

Cross-cutting guide for i18next setup, RTL support, form validation i18n, and formatter usage.

## Table of Contents

1. [i18n Architecture](#i18n-architecture)
2. [Namespace Loading Strategy](#namespace-loading-strategy)
3. [RTL Support Flow](#rtl-support-flow)
4. [Form Validation i18n](#form-validation-i18n)
5. [Formatter Comparison](#formatter-comparison)
6. [Adding New Translations](#adding-new-translations)
7. [Adding New Language Support](#adding-new-language-support)
8. [Usage Examples](#usage-examples)

---

## i18n Architecture

NasNetConnect uses **i18next + React-i18next** with HTTP backend for lazy-loaded translations:

```
┌─────────────────────────────────────────────────────────────┐
│              i18next Configuration                          │
│         (libs/core/i18n/src/i18n.ts)                       │
└──────────────┬──────────────────────────────────────────────┘
               │
               ├─────────────────────────────────────────┐
               │                                         │
               ▼                                         ▼
     ┌──────────────────────┐          ┌─────────────────────┐
     │ Language Detection   │          │ Namespace Loading   │
     │                      │          │                     │
     │ 1. localStorage      │          │ • Default namespaces│
     │ 2. Browser navigator │          │   (eager load)      │
     │ 3. Fallback: 'en'    │          │ • Feature namespaces│
     └─────────────────────┘          │   (lazy load)       │
                                       └─────────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ Language Loaded      │
         │ (e.g., 'en', 'fa')   │
         └──────┬───────────────┘
                │
                ├─ Provide i18n instance to React
                ├─ useTranslation() hooks available
                ├─ RTL detection (if fa, ar, he)
                └─ Set document direction if RTL

         ┌──────────────────────┐
         │ User Interactions    │
         │                      │
         │ • Form validation    │
         │ • Date formatting    │
         │ • Number formatting  │
         │ • Relative times     │
         └──────────────────────┘
```

### Key Files

```
libs/core/i18n/
├── src/
│   ├── i18n.ts                    # Main i18next config
│   ├── hooks/
│   │   ├── useTranslation.ts       # Get translations
│   │   ├── useFormatters.ts        # Locale-aware formatters
│   │   └── useDirection.ts         # RTL/LTR detection
│   └── index.ts                   # Public exports
├── locales/
│   ├── en/
│   │   ├── common.json            # UI strings
│   │   ├── validation.json        # Validation messages
│   │   ├── errors.json            # Error messages
│   │   ├── wizard.json            # Setup wizard
│   │   └── ...                    # Other feature namespaces
│   └── fa/
│       ├── common.json
│       ├── validation.json
│       └── ...                    # Same structure as en
```

### Configuration Summary

```typescript
// Supported languages - add more as translations are completed
export const supportedLanguages = ['en', 'fa'] as const;
export type SupportedLanguage = 'en' | 'fa';

// Right-to-left languages
export const rtlLanguages: readonly SupportedLanguage[] = ['fa'];

// Language display names in native script
export const languageNames = {
  en: 'English',
  fa: 'فارسی',
};

// i18next initialization config
i18n
  .use(HttpBackend) // Load from /locales/{{lng}}/{{ns}}.json
  .use(LanguageDetector) // Auto-detect language
  .use(initReactI18next) // React integration
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'fa'],
    ns: ['common', 'validation', 'errors'],
    defaultNS: 'common',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'nasnet-language',
    },
  });
```

---

## Namespace Loading Strategy

### Default Namespaces (Eager Load)

Loaded at app startup, always available:

```typescript
export const defaultNamespaces = ['common', 'validation', 'errors'] as const;
```

**common.json** — UI text

```json
{
  "yes": "Yes",
  "no": "No",
  "save": "Save",
  "cancel": "Cancel",
  "loading": "Loading...",
  "error": "An error occurred",
  "nav": {
    "dashboard": "Dashboard",
    "network": "Network",
    "firewall": "Firewall"
  }
}
```

**validation.json** — Form validation messages

```json
{
  "required": "This field is required",
  "email": "Please enter a valid email address",
  "minLength": "Must be at least {{min}} characters",
  "maxLength": "Must be at most {{max}} characters",
  "ipAddress": "Invalid IP address",
  "portRange": "Invalid port or port range"
}
```

**errors.json** — Error messages

```json
{
  "generic": "Something went wrong. Please try again.",
  "network": "Network connection error",
  "unauthorized": "Authentication required",
  "forbidden": "You do not have permission to perform this action",
  "notFound": "Resource not found"
}
```

### Feature Namespaces (Lazy Load)

Loaded on-demand when feature modules use them:

```typescript
export const featureNamespaces = [
  'wizard', // Setup wizard shell
  'network', // Network interfaces, DHCP, DNS
  'dashboard', // Dashboard widgets, charts
  'vpn', // VPN servers, clients
  'wifi', // Wireless interfaces
  'firewall', // Firewall rules, NAT
  'services', // Feature marketplace
  'diagnostics', // Ping, traceroute, DNS lookup
  'router', // Router discovery, health
] as const;
```

**Benefits of lazy loading:**

- Smaller initial bundle
- Faster app startup
- Translations loaded only when needed
- Better code splitting

### Using Feature Namespaces

```typescript
import { useTranslation } from 'react-i18next';

function NetworkPage() {
  // Load 'network' namespace lazily
  const { t } = useTranslation('network');

  return <div>{t('interfaces.title')}</div>;
}

// locales/en/network.json
{
  "interfaces": {
    "title": "Network Interfaces",
    "ethernet": "Ethernet",
    "bridge": "Bridge",
    "vlan": "VLAN"
  }
}
```

---

## RTL Support Flow

### Language Detection and Direction

Located in `libs/core/i18n/src/i18n.ts`:

```typescript
// Check if language is RTL
export function isRTLLanguage(lang: string): boolean {
  return rtlLanguages.includes(lang as SupportedLanguage);
}

// Get text direction
export function getLanguageDirection(lang: string): 'ltr' | 'rtl' {
  return isRTLLanguage(lang) ? 'rtl' : 'ltr';
}

// RTL languages configured
export const rtlLanguages: readonly SupportedLanguage[] = ['fa']; // Persian
// Add 'ar' for Arabic, 'he' for Hebrew when translations added
```

### Applying RTL to Page

```typescript
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getLanguageDirection } from '@nasnet/core/i18n';

export function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Update document direction
    const direction = getLanguageDirection(i18n.language);
    document.documentElement.dir = direction;
    document.documentElement.lang = i18n.language;

    // Update HTML element for CSS RTL detection
    if (direction === 'rtl') {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
  }, [i18n.language]);

  return <MainContent />;
}
```

### RTL-Aware CSS

```css
/* Global styles */
:root {
  --spacing-left: var(--spacing-4);
  --spacing-right: 0;
}

html.rtl {
  --spacing-left: 0;
  --spacing-right: var(--spacing-4);
}

/* Component with RTL support */
.sidebar {
  margin-left: var(--spacing-left);
  margin-right: var(--spacing-right);
  border-right: 1px solid var(--border-color);
}

html.rtl .sidebar {
  border-right: none;
  border-left: 1px solid var(--border-color);
}

/* Or use logical properties (modern approach) */
.sidebar {
  margin-inline-start: var(--spacing-4); /* Left in LTR, right in RTL */
  border-inline-end: 1px solid var(--border-color);
}
```

### Tailwind RTL Support

```tsx
// Use direction modifiers
<div className="rtl:flex-row-reverse">
  <span>Left aligned</span>
  <span className="rtl:ml-4 rtl:mr-0">Right aligned in RTL</span>
</div>
```

---

## Form Validation i18n

### Zod with i18n Translation

Located in `forms/error-messages.ts`:

```typescript
import { z } from 'zod';
import { TFunction } from 'i18next';

// Create validation schemas with i18n-aware error messages
export function createValidationSchemas(t: TFunction) {
  return {
    email: z.string().min(1, t('validation:required')).email(t('validation:email')),

    ipAddress: z.string().refine(isValidIPv4, {
      message: t('validation:ipAddress'),
    }),

    port: z.string().refine(isValidPort, {
      message: t('validation:portRange'),
    }),

    password: z
      .string()
      .min(8, t('validation:minLength', { min: 8 }))
      .regex(/[A-Z]/, t('validation:requiresUppercase'))
      .regex(/[0-9]/, t('validation:requiresNumber')),
  };
}
```

### Using Translated Schemas in Forms

```typescript
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function SettingsForm() {
  const { t } = useTranslation('validation');
  const schemas = createValidationSchemas(t);

  const form = useForm({
    resolver: zodResolver(schemas.email),
    mode: 'onBlur',
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('email')} />
      {form.formState.errors.email && (
        <span className="text-red-500">
          {form.formState.errors.email.message}
        </span>
      )}
    </form>
  );
}

// In Persian:
// required: "این فیلد الزامی است"
// email: "لطفاً آدرس ایمیل معتبر وارد کنید"
// minLength: "حداقل {{min}} حرف وارد کنید"
```

### i18n Parameters in Error Messages

```json
{
  "validation": {
    "required": "This field is required",
    "minLength": "Must be at least {{min}} characters",
    "maxLength": "Must be at most {{max}} characters",
    "lengthBetween": "Must be between {{min}} and {{max}} characters",
    "pattern": "Invalid format. Expected {{pattern}}",
    "requiresUppercase": "Must contain at least one uppercase letter",
    "requiresNumber": "Must contain at least one number",
    "requiresSpecial": "Must contain at least one special character (!@#$%)"
  }
}
```

**Using parameters:**

```typescript
t('validation:minLength', { min: 8 });
// en: "Must be at least 8 characters"
// fa: "حداقل ۸ حرف وارد کنید"
```

---

## Formatter Comparison

### Table: Locale-Agnostic vs Locale-Aware Formatters

| Use Case          | Locale-Agnostic Utils | Locale-Aware Hook | When to Use                           |
| ----------------- | --------------------- | ----------------- | ------------------------------------- |
| **IP Addresses**  | ✓                     | ✗                 | Always utils (universal format)       |
| **MAC Addresses** | ✓                     | ✗                 | Always utils (universal format)       |
| **Port Numbers**  | ✓                     | ✗                 | Always utils (universal format)       |
| **Dates**         | ✗                     | ✓                 | UI display, user-facing               |
| **Numbers**       | ✗                     | ✓                 | UI display with locale separators     |
| **Data Sizes**    | Partial               | ✓                 | useFormatters for locale-aware units  |
| **Durations**     | Partial               | ✓                 | useFormatters for h/m/s formatting    |
| **Bandwidth**     | ✗                     | ✓                 | Network graphs with locale formatting |
| **Relative Time** | ✗                     | ✓                 | "5 minutes ago", "in 2 hours"         |

### Locale-Agnostic Utilities - `utils/formatters/`

Technical data that must remain universal:

```typescript
import { formatIPAddress, formatMACAddress, formatPort } from '@nasnet/core/utils/formatters';

// Always display in standard format
formatIPAddress('192.168.1.1'); // "192.168.1.1" (never localized)
formatMACAddress('aabbccddeeff'); // "AA:BB:CC:DD:EE:FF" (never localized)
formatPort(8080); // "8080" (never localized)
formatPort('8000-9000'); // "8000-9000" (range stays consistent)
```

**Rule:** Technical specifications never change based on locale

### Locale-Aware Formatters - `useFormatters()` Hook

Display-oriented formatting respects user locale:

```typescript
import { useFormatters } from '@nasnet/core/i18n/hooks';

export function DeviceSummary({ lastSeen, bytesTransferred }) {
  const { formatDate, formatBytes, formatRelativeTime, locale } = useFormatters();

  return (
    <div>
      {/* Relative time: changes per locale */}
      <p>Last seen: {formatRelativeTime(lastSeen)}</p>
      {/* en: "5 minutes ago" */}
      {/* fa: "۵ دقیقه پیش" */}

      {/* Data size: locale-aware number formatting */}
      <p>Transferred: {formatBytes(bytesTransferred)}</p>
      {/* en: "2.50 MB" */}
      {/* fa: "۲٫۵ مگابایت" */}

      {/* Date: fully localized */}
      <p>Updated: {formatDate(new Date(), { includeTime: true })}</p>
      {/* en: "January 15, 2024, 2:30 PM" */}
      {/* fa: "۱۵ ژانویه ۲۰۲۴ ۲:۳۰ بعدازظهر" */}
    </div>
  );
}
```

### Formatter Methods

Located in `libs/core/i18n/src/hooks/useFormatters.ts`:

```typescript
export interface UseFormattersResult {
  // Date formatting
  formatDate(date: Date | string | number, options?: DateFormatOptions): string;
  // Options: style ('short'|'medium'|'long'|'full'), includeTime (boolean)

  // Number formatting
  formatNumber(value: number, options?: NumberFormatOptions): string;
  // Options: style ('decimal'|'percent'), minimumFractionDigits, maximumFractionDigits

  // Data size (B, KB, MB, GB)
  formatBytes(bytes: number, decimals?: number): string;

  // Duration (e.g., "2h 30m 15s")
  formatDuration(seconds: number): string;

  // Relative time (e.g., "5 minutes ago")
  formatRelativeTime(date: Date | string | number, options?: RelativeTimeOptions): string;
  // Options: style ('long'|'short'|'narrow'), numeric ('always'|'auto')

  // Network bandwidth (Mbps, Gbps)
  formatBandwidth(bitsPerSecond: number): string;

  // Current locale
  locale: string;
}
```

### Usage Patterns

```typescript
// ❌ Wrong: Using formatters for technical data
const displayIP = formatNumber(ipAddress); // Breaks the IP!

// ✅ Correct: Use utils for technical, formatters for UI
const technicalIP = ipAddress; // "192.168.1.1"
const userBytes = formatBytes(1048576); // "1.00 MB"

// ❌ Wrong: Using utils for user-facing dates
const displayDate = dateToString(new Date()); // "2024-01-15"

// ✅ Correct: Use formatters for dates
const userDate = formatDate(new Date()); // "January 15, 2024" (or locale equivalent)
```

---

## Adding New Translations

### Step 1: Create Translation Files

```bash
# Create directory structure
mkdir -p public/locales/en/extra
mkdir -p public/locales/fa/extra

# Create translation files
touch public/locales/en/extra.json
touch public/locales/fa/extra.json
```

### Step 2: Add Translations

**public/locales/en/extra.json:**

```json
{
  "feature": {
    "title": "New Feature",
    "description": "Feature description",
    "action": {
      "button": "Click me",
      "tooltip": "This does something"
    }
  },
  "messages": {
    "success": "Operation completed successfully",
    "error": "Something went wrong",
    "loading": "Please wait..."
  }
}
```

**public/locales/fa/extra.json:**

```json
{
  "feature": {
    "title": "ویژگی جدید",
    "description": "توضیح ویژگی",
    "action": {
      "button": "بر روی من کلیک کنید",
      "tooltip": "این کار کاری انجام می‌دهد"
    }
  },
  "messages": {
    "success": "عملیات با موفقیت انجام شد",
    "error": "مشکلی پیش آمد",
    "loading": "لطفاً صبر کنید..."
  }
}
```

### Step 3: Register Namespace

**libs/core/i18n/src/i18n.ts:**

```typescript
export const featureNamespaces = [
  // ... existing
  'extra', // Add new namespace
] as const;
```

### Step 4: Use Translations

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('extra');

  return (
    <div>
      <h1>{t('feature.title')}</h1>
      <p>{t('feature.description')}</p>
      <button title={t('feature.action.tooltip')}>
        {t('feature.action.button')}
      </button>
    </div>
  );
}
```

### Step 5: Translation Keys Checklist

- ✓ Keys match in all languages
- ✓ No HTML/special chars in values (use interpolation)
- ✓ Pluralization handled correctly
- ✓ Context variables properly named
- ✓ RTL text tested in Persian

---

## Adding New Language Support

### Step 1: Configure Language

**libs/core/i18n/src/i18n.ts:**

```typescript
// Add language code
export const supportedLanguages = ['en', 'fa', 'ar'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

// Add to RTL if needed
export const rtlLanguages: readonly SupportedLanguage[] = ['fa', 'ar'];

// Add display name
export const languageNames: Record<SupportedLanguage, string> = {
  en: 'English',
  fa: 'فارسی',
  ar: 'العربية',
};

// Update i18next config
i18n.init({
  supportedLngs: ['en', 'fa', 'ar'],
  // ... rest of config
});
```

### Step 2: Create Translation Files

Create complete translation structure for new language:

```bash
mkdir -p public/locales/ar/
cp -r public/locales/en/* public/locales/ar/

# Files to translate:
# • common.json
# • validation.json
# • errors.json
# • wizard.json
# • network.json
# • dashboard.json
# • ... (all feature namespaces)
```

### Step 3: Key Changes for RTL Languages

**Arabic/Hebrew Translations (public/locales/ar/common.json):**

```json
{
  "yes": "نعم",
  "no": "لا",
  "save": "حفظ",
  "cancel": "إلغاء",
  "nav": {
    "dashboard": "لوحة المعلومات",
    "network": "الشبكة",
    "firewall": "الجدار الناري"
  }
}
```

**RTL-specific CSS Adjustments:**

```css
/* For RTL languages (Arabic, Hebrew, Persian) */
html.rtl {
  direction: rtl;
  text-align: right;
}

html.rtl .sidebar {
  left: auto;
  right: 0;
  border-left: 1px solid var(--border);
  border-right: none;
}

html.rtl .navigation {
  flex-direction: row-reverse;
}

html.rtl .dropdown-menu {
  right: 0;
  left: auto;
}
```

### Step 4: Language Selector Component

```typescript
import { useTranslation } from 'react-i18next';
import { supportedLanguages, languageNames } from '@nasnet/core/i18n';

export function LanguageSelector() {
  const { i18n } = useTranslation();

  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
    >
      {supportedLanguages.map((lang) => (
        <option key={lang} value={lang}>
          {languageNames[lang]}
        </option>
      ))}
    </select>
  );
}
```

### Step 5: Testing Checklist

- ✓ All namespaces translated
- ✓ HTML and formatting preserved
- ✓ Variables (`{{var}}`) match source
- ✓ RTL layout flows correctly
- ✓ Font supports all characters
- ✓ Date/number formats work for locale
- ✓ Form validation messages appear correctly
- ✓ No missing translation warnings in console

---

## Usage Examples

### Example 1: Complete Localized Form

```typescript
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormatters } from '@nasnet/core/i18n/hooks';

export function ProfileForm() {
  const { t } = useTranslation(['common', 'validation']);
  const { formatDate } = useFormatters();

  const schemas = createValidationSchemas(t);
  const form = useForm({
    resolver: zodResolver(z.object({
      email: schemas.email,
      name: z.string().min(1, t('validation:required')),
    })),
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <label>{t('common:email')}</label>
      <input {...form.register('email')} />
      {form.formState.errors.email && (
        <span className="error">{form.formState.errors.email.message}</span>
      )}

      <label>{t('common:name')}</label>
      <input {...form.register('name')} />
      {form.formState.errors.name && (
        <span className="error">{form.formState.errors.name.message}</span>
      )}

      <p className="help-text">
        {t('common:lastUpdated')}: {formatDate(new Date(), { includeTime: true })}
      </p>

      <button type="submit">{t('common:save')}</button>
    </form>
  );
}
```

### Example 2: Network Statistics Display

```typescript
import { useFormatters } from '@nasnet/core/i18n/hooks';
import { formatIPAddress } from '@nasnet/core/utils/formatters';

export function NetworkStats({ interface: iface }) {
  const { formatBytes, formatBandwidth, locale } = useFormatters();

  return (
    <div>
      {/* Technical data - always universal format */}
      <p>IP Address: {formatIPAddress(iface.ip)}</p>
      <p>MAC: {formatIPAddress(iface.mac)}</p>

      {/* User-facing metrics - locale-aware */}
      <p>Downloaded: {formatBytes(iface.rxBytes)}</p>
      <p>Uploaded: {formatBytes(iface.txBytes)}</p>
      <p>Speed: {formatBandwidth(iface.currentSpeed)}</p>

      {/* Locale indicator */}
      <small>Displayed in locale: {locale}</small>
    </div>
  );
}
```

### Example 3: Switching Languages

```typescript
import { useTranslation } from 'react-i18next';
import { getLanguageDirection } from '@nasnet/core/i18n';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleChangeLanguage = async (lang: string) => {
    // Change language
    await i18n.changeLanguage(lang);

    // Update document direction for RTL
    const direction = getLanguageDirection(lang);
    document.documentElement.dir = direction;
    document.documentElement.lang = lang;

    // Persist to localStorage
    localStorage.setItem('nasnet-language', lang);
  };

  return (
    <div>
      <button onClick={() => handleChangeLanguage('en')}>English</button>
      <button onClick={() => handleChangeLanguage('fa')}>فارسی</button>
      <button onClick={() => handleChangeLanguage('ar')}>العربية</button>
    </div>
  );
}
```

---

## Related Documentation

- **i18n Configuration:** `libs/core/i18n/src/i18n.ts`
- **Formatters Hook:** `libs/core/i18n/src/hooks/useFormatters.ts`
- **Form Validators:** `libs/core/docs/guides/network-configuration.md#layer-2-zod-validators`
- **Architecture:** `Docs/architecture/implementation-patterns/17-localization-patterns.md`
