/* global console, process */
/**
 * Design Token Build Script
 * Generates CSS variables, TypeScript constants, and Tailwind config from design tokens
 *
 * Output files:
 * - dist/variables.css - CSS custom properties for light/dark themes
 * - dist/tokens.ts - TypeScript constants with full type definitions
 * - dist/tailwind.config.js - Tailwind theme extension config
 *
 * No external dependencies required - pure Node.js implementation
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, watch } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SOURCE_PATH = resolve(__dirname, 'src/tokens.json');
const OUTPUT_DIR = resolve(__dirname, 'dist');

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Build the design tokens
 */
async function buildTokens() {
  console.log('🎨 Building design tokens...');
  const startTime = Date.now();

  try {
    // Read source tokens
    const tokensRaw = readFileSync(SOURCE_PATH, 'utf-8');
    const tokens = JSON.parse(tokensRaw);

    // Resolve token references
    const resolveReferences = (obj, root = tokens) => {
      if (typeof obj !== 'object' || obj === null) return obj;

      const resolved = Array.isArray(obj) ? [] : {};
      for (const [key, value] of Object.entries(obj)) {
        if (key.startsWith('$') && key !== '$value') {
          resolved[key] = value;
          continue;
        }

        if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
          // Resolve reference
          const refPath = value.slice(1, -1).split('.');
          let refValue = root;
          for (const part of refPath) {
            refValue = refValue?.[part];
          }
          if (refValue && typeof refValue === 'object' && '$value' in refValue) {
            resolved[key] = resolveReferences({ $value: refValue.$value }, root).$value;
          } else if (refValue !== undefined) {
            resolved[key] = resolveReferences(refValue, root);
          } else {
            resolved[key] = value; // Keep unresolved
          }
        } else if (typeof value === 'object') {
          resolved[key] = resolveReferences(value, root);
        } else {
          resolved[key] = value;
        }
      }
      return resolved;
    };

    // Build light theme tokens (primitive + semantic + component)
    const lightTokens = {
      ...resolveReferences(tokens.primitive, tokens),
      semantic: resolveReferences(tokens.semantic, tokens),
      component: resolveReferences(tokens.component, tokens),
    };

    // Build dark theme tokens (merge dark overrides)
    const darkOverrides = resolveReferences(tokens.dark, tokens);
    const darkTokens = {
      ...lightTokens,
      semantic: {
        ...lightTokens.semantic,
        color: {
          ...lightTokens.semantic?.color,
          ...darkOverrides.semantic?.color,
        },
      },
      component: {
        ...lightTokens.component,
        ...darkOverrides.component,
      },
      shadow: darkOverrides.shadow || lightTokens.shadow,
    };

    // Generate CSS variables
    const cssContent = generateCssVariables(lightTokens, darkTokens);
    writeFileSync(resolve(OUTPUT_DIR, 'variables.css'), cssContent);
    console.log('  ✓ Generated dist/variables.css');

    // Generate TypeScript constants
    const tsContent = generateTypeScript(lightTokens, tokens);
    writeFileSync(resolve(OUTPUT_DIR, 'tokens.ts'), tsContent);
    console.log('  ✓ Generated dist/tokens.ts');

    // Generate TypeScript type definitions
    const dtsContent = generateTypeDefinitions(lightTokens);
    writeFileSync(resolve(OUTPUT_DIR, 'tokens.d.ts'), dtsContent);
    console.log('  ✓ Generated dist/tokens.d.ts');

    // Generate Tailwind config extension
    const twContent = generateTailwindConfig(tokens);
    writeFileSync(resolve(OUTPUT_DIR, 'tailwind.config.js'), twContent);
    console.log('  ✓ Generated dist/tailwind.config.js');

    const duration = Date.now() - startTime;
    console.log(`✨ Build complete in ${duration}ms`);

    // Count tokens
    const countTokens = (obj) => {
      let count = 0;
      for (const [key, value] of Object.entries(obj)) {
        if (key.startsWith('$')) continue;
        if (value && typeof value === 'object' && '$value' in value) {
          count++;
        } else if (value && typeof value === 'object') {
          count += countTokens(value);
        }
      }
      return count;
    };

    const primitiveCount = countTokens(tokens.primitive || {});
    const semanticCount = countTokens(tokens.semantic || {});
    const componentCount = countTokens(tokens.component || {});
    const totalCount = primitiveCount + semanticCount + componentCount;

    console.log(
      `📊 Token counts: Primitive=${primitiveCount}, Semantic=${semanticCount}, Component=${componentCount}, Total=${totalCount}`
    );
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

/**
 * Generate CSS custom properties
 */
function generateCssVariables(lightTokens, darkTokens) {
  const toCssVarName = (path) => `--${path.join('-')}`;

  const flattenTokens = (obj, path = []) => {
    const result = [];
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('$')) continue;
      const newPath = [...path, key];
      if (value && typeof value === 'object' && '$value' in value) {
        result.push({ path: newPath, value: value.$value });
      } else if (value && typeof value === 'object') {
        result.push(...flattenTokens(value, newPath));
      }
    }
    return result;
  };

  const lightFlat = flattenTokens(lightTokens);
  const darkFlat = flattenTokens(darkTokens);

  let css = `/**
 * NasNetConnect Design Tokens - CSS Variables
 * Auto-generated by Style Dictionary - DO NOT EDIT DIRECTLY
 * Source: libs/ui/tokens/src/tokens.json
 * Generated: ${new Date().toISOString()}
 *
 * Usage:
 *   color: var(--semantic-color-primary-DEFAULT);
 *   padding: var(--primitive-spacing-4);
 */

:root {
`;

  for (const { path, value } of lightFlat) {
    const varName = toCssVarName(path);
    css += `  ${varName}: ${value};\n`;
  }

  css += `}

/* Dark theme overrides */
[data-theme="dark"],
.dark {
`;

  // Only output tokens that differ in dark mode
  const lightMap = new Map(lightFlat.map((t) => [t.path.join('-'), t.value]));
  for (const { path, value } of darkFlat) {
    const key = path.join('-');
    if (lightMap.get(key) !== value) {
      const varName = toCssVarName(path);
      css += `  ${varName}: ${value};\n`;
    }
  }

  css += `}
`;

  return css;
}

/**
 * Generate TypeScript constants
 */
function generateTypeScript(resolvedTokens, rawTokens) {
  const extractValues = (obj, path = []) => {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('$')) continue;
      if (value && typeof value === 'object' && '$value' in value) {
        result[key] = value.$value;
      } else if (value && typeof value === 'object') {
        result[key] = extractValues(value, [...path, key]);
      }
    }
    return result;
  };

  const primitiveValues = extractValues(rawTokens.primitive || {});
  const semanticValues = extractValues(rawTokens.semantic || {});
  const componentValues = extractValues(rawTokens.component || {});

  return `/**
 * NasNetConnect Design Tokens - TypeScript Constants
 * Auto-generated by Style Dictionary - DO NOT EDIT DIRECTLY
 * Source: libs/ui/tokens/src/tokens.json
 * Generated: ${new Date().toISOString()}
 *
 * Usage:
 *   import { designTokens, cssVar } from '@nasnet/ui-tokens';
 *   const primary = designTokens.semantic.color.primary.DEFAULT;
 *   const spacing = cssVar('primitive-spacing-4');
 */

/** Primitive tokens - raw foundational values */
export const primitive = ${JSON.stringify(primitiveValues, null, 2)} as const;

/** Semantic tokens - purpose-based values */
export const semantic = ${JSON.stringify(semanticValues, null, 2)} as const;

/** Component tokens - implementation-specific values */
export const component = ${JSON.stringify(componentValues, null, 2)} as const;

/** Combined design tokens object */
export const designTokens = {
  primitive,
  semantic,
  component,
} as const;

/** Type definitions */
export type Primitive = typeof primitive;
export type Semantic = typeof semantic;
export type Component = typeof component;
export type DesignTokens = typeof designTokens;

/**
 * Helper to get CSS variable reference
 * @example cssVar('semantic-color-primary-DEFAULT') => 'var(--semantic-color-primary-DEFAULT)'
 */
export function cssVar(tokenPath: string): string {
  return \`var(--\${tokenPath})\`;
}

/**
 * Helper to get token value by path
 * @example getToken('semantic.color.primary.DEFAULT') => '#EFC729'
 */
export function getToken(path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = designTokens;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

export default designTokens;
`;
}

/**
 * Generate TypeScript type definitions
 */
function generateTypeDefinitions(tokens) {
  return `/**
 * NasNetConnect Design Tokens - Type Definitions
 * Auto-generated by Style Dictionary - DO NOT EDIT DIRECTLY
 */

export declare const primitive: import('./tokens').Primitive;
export declare const semantic: import('./tokens').Semantic;
export declare const component: import('./tokens').Component;
export declare const designTokens: import('./tokens').DesignTokens;

export type Primitive = import('./tokens').Primitive;
export type Semantic = import('./tokens').Semantic;
export type Component = import('./tokens').Component;
export type DesignTokens = import('./tokens').DesignTokens;

export declare function cssVar(tokenPath: string): string;
export declare function getToken(path: string): string | undefined;

export default designTokens;
`;
}

/**
 * Generate Tailwind CSS config extension
 */
function generateTailwindConfig(tokens) {
  // Extract color values for Tailwind, using CSS variables for theme support
  const buildColorObject = (prefix) => {
    const colors = {};

    // Brand colors
    colors.primary = {
      DEFAULT: `var(--semantic-color-primary-DEFAULT)`,
      hover: `var(--semantic-color-primary-hover)`,
      active: `var(--semantic-color-primary-active)`,
      light: `var(--semantic-color-primary-light)`,
      dark: `var(--semantic-color-primary-dark)`,
      foreground: `var(--semantic-color-primary-foreground)`,
    };

    colors.secondary = {
      DEFAULT: `var(--semantic-color-secondary-DEFAULT)`,
      hover: `var(--semantic-color-secondary-hover)`,
      active: `var(--semantic-color-secondary-active)`,
      light: `var(--semantic-color-secondary-light)`,
      dark: `var(--semantic-color-secondary-dark)`,
      foreground: `var(--semantic-color-secondary-foreground)`,
    };

    // Status colors
    colors.success = {
      DEFAULT: `var(--semantic-color-success-DEFAULT)`,
      hover: `var(--semantic-color-success-hover)`,
      light: `var(--semantic-color-success-light)`,
      dark: `var(--semantic-color-success-dark)`,
      foreground: `var(--semantic-color-success-foreground)`,
    };

    colors.warning = {
      DEFAULT: `var(--semantic-color-warning-DEFAULT)`,
      hover: `var(--semantic-color-warning-hover)`,
      light: `var(--semantic-color-warning-light)`,
      dark: `var(--semantic-color-warning-dark)`,
      foreground: `var(--semantic-color-warning-foreground)`,
    };

    colors.error = {
      DEFAULT: `var(--semantic-color-error-DEFAULT)`,
      hover: `var(--semantic-color-error-hover)`,
      light: `var(--semantic-color-error-light)`,
      dark: `var(--semantic-color-error-dark)`,
      foreground: `var(--semantic-color-error-foreground)`,
    };

    colors.info = {
      DEFAULT: `var(--semantic-color-info-DEFAULT)`,
      hover: `var(--semantic-color-info-hover)`,
      light: `var(--semantic-color-info-light)`,
      dark: `var(--semantic-color-info-dark)`,
      foreground: `var(--semantic-color-info-foreground)`,
    };

    // Surface colors
    colors.background = `var(--semantic-color-surface-background)`;
    colors.foreground = `var(--semantic-color-surface-foreground)`;
    colors.card = {
      DEFAULT: `var(--semantic-color-surface-card)`,
      foreground: `var(--semantic-color-surface-cardForeground)`,
    };
    colors.popover = {
      DEFAULT: `var(--semantic-color-surface-popover)`,
      foreground: `var(--semantic-color-surface-popoverForeground)`,
    };
    colors.muted = {
      DEFAULT: `var(--semantic-color-surface-muted)`,
      foreground: `var(--semantic-color-surface-mutedForeground)`,
    };
    colors.accent = {
      DEFAULT: `var(--semantic-color-surface-accent)`,
      foreground: `var(--semantic-color-surface-accentForeground)`,
    };

    // Border colors
    colors.border = `var(--semantic-color-border-DEFAULT)`;
    colors.input = `var(--semantic-color-border-DEFAULT)`;
    colors.ring = `var(--semantic-color-primary-DEFAULT)`;

    // Category colors
    colors.category = {
      security: `var(--semantic-color-category-security)`,
      monitoring: `var(--semantic-color-category-monitoring)`,
      networking: `var(--semantic-color-category-networking)`,
      vpn: `var(--semantic-color-category-vpn)`,
      wifi: `var(--semantic-color-category-wifi)`,
      firewall: `var(--semantic-color-category-firewall)`,
      system: `var(--semantic-color-category-system)`,
      dhcp: `var(--semantic-color-category-dhcp)`,
      routing: `var(--semantic-color-category-routing)`,
      tunnels: `var(--semantic-color-category-tunnels)`,
      qos: `var(--semantic-color-category-qos)`,
      hotspot: `var(--semantic-color-category-hotspot)`,
      logging: `var(--semantic-color-category-logging)`,
      backup: `var(--semantic-color-category-backup)`,
    };

    // Network interface type colors (AC1)
    colors.network = {
      wan: `var(--semantic-color-network-wan)`,
      lan: `var(--semantic-color-network-lan)`,
      vpn: `var(--semantic-color-network-vpn)`,
      wireless: `var(--semantic-color-network-wireless)`,
    };

    // Network status colors (AC1)
    colors.networkStatus = {
      connected: `var(--semantic-color-networkStatus-connected)`,
      disconnected: `var(--semantic-color-networkStatus-disconnected)`,
      pending: `var(--semantic-color-networkStatus-pending)`,
      error: `var(--semantic-color-networkStatus-error)`,
    };

    // Confidence indicator colors (AC5)
    colors.confidence = {
      high: `var(--semantic-confidence-high)`,
      highBg: `var(--semantic-confidence-highBg)`,
      highText: `var(--semantic-confidence-highText)`,
      medium: `var(--semantic-confidence-medium)`,
      mediumBg: `var(--semantic-confidence-mediumBg)`,
      mediumText: `var(--semantic-confidence-mediumText)`,
      low: `var(--semantic-confidence-low)`,
      lowBg: `var(--semantic-confidence-lowBg)`,
      lowText: `var(--semantic-confidence-lowText)`,
    };

    // Stepper component colors (AC4)
    colors.stepper = {
      connector: `var(--component-stepper-connectorColor)`,
      active: `var(--component-stepper-activeColor)`,
      activeBg: `var(--component-stepper-activeBg)`,
      completed: `var(--component-stepper-completedColor)`,
      completedBg: `var(--component-stepper-completedBg)`,
      pending: `var(--component-stepper-pendingColor)`,
      pendingBg: `var(--component-stepper-pendingBg)`,
      error: `var(--component-stepper-errorColor)`,
      errorBg: `var(--component-stepper-errorBg)`,
    };

    return colors;
  };

  const config = {
    colors: buildColorObject(),
    borderRadius: {
      none: 'var(--primitive-borderRadius-none)',
      sm: 'var(--primitive-borderRadius-sm)',
      DEFAULT: 'var(--primitive-borderRadius-base)',
      md: 'var(--primitive-borderRadius-md)',
      lg: 'var(--primitive-borderRadius-lg)',
      xl: 'var(--primitive-borderRadius-xl)',
      '2xl': 'var(--primitive-borderRadius-2xl)',
      '3xl': 'var(--primitive-borderRadius-3xl)',
      full: 'var(--primitive-borderRadius-full)',
      button: 'var(--semantic-radius-button)',
      card: 'var(--semantic-radius-card)',
      input: 'var(--semantic-radius-input)',
    },
    fontFamily: {
      sans: 'var(--primitive-typography-fontFamily-sans)',
      mono: 'var(--primitive-typography-fontFamily-mono)',
      display: 'var(--primitive-typography-fontFamily-display)',
    },
    boxShadow: {
      sm: 'var(--primitive-shadow-sm)',
      DEFAULT: 'var(--primitive-shadow-base)',
      md: 'var(--primitive-shadow-md)',
      lg: 'var(--primitive-shadow-lg)',
      xl: 'var(--primitive-shadow-xl)',
      '2xl': 'var(--primitive-shadow-2xl)',
      inner: 'var(--primitive-shadow-inner)',
      none: 'var(--primitive-shadow-none)',
      card: 'var(--semantic-shadow-card)',
      dropdown: 'var(--semantic-shadow-dropdown)',
      modal: 'var(--semantic-shadow-modal)',
    },
    // Wizard spacing utilities (AC2)
    spacing: {
      'wizard-sidebar': 'var(--semantic-wizard-sidebarWidth)',
      'wizard-preview': 'var(--semantic-wizard-previewWidth)',
      'wizard-step-gap': 'var(--semantic-wizard-stepGap)',
      'wizard-content-max': 'var(--semantic-wizard-contentMaxWidth)',
      'wizard-mobile-header': 'var(--semantic-wizard-mobileHeaderHeight)',
      'wizard-mobile-stepper': 'var(--semantic-wizard-mobileStepper)',
      'stepper-item': 'var(--component-stepper-itemSize)',
      'stepper-item-mobile': 'var(--component-stepper-itemSizeMobile)',
    },
    // Wizard max-width utilities
    maxWidth: {
      'wizard-content': 'var(--semantic-wizard-contentMaxWidth)',
    },
    // Wizard width utilities
    width: {
      'wizard-sidebar': 'var(--semantic-wizard-sidebarWidth)',
      'wizard-preview': 'var(--semantic-wizard-previewWidth)',
    },
    // Animation timing utilities (AC6)
    transitionDuration: {
      step: 'var(--semantic-animation-wizard-stepTransition)',
      validation: 'var(--semantic-animation-wizard-validationFeedback)',
    },
    transitionTimingFunction: {
      step: 'var(--semantic-animation-wizard-easing)',
    },
  };

  return `/**
 * NasNetConnect Design Tokens - Tailwind CSS Configuration
 * Auto-generated by Style Dictionary - DO NOT EDIT DIRECTLY
 * Source: libs/ui/tokens/src/tokens.json
 * Generated: ${new Date().toISOString()}
 *
 * Usage in tailwind.config.js:
 *   const tokenConfig = require('@nasnet/ui-tokens/tailwind');
 *   module.exports = {
 *     theme: { extend: tokenConfig }
 *   };
 */

module.exports = ${JSON.stringify(config, null, 2)};
`;
}

// Run build
const isWatch = process.argv.includes('--watch');

buildTokens();

if (isWatch) {
  console.log('\n👀 Watching for changes...');
  watch(SOURCE_PATH, { persistent: true }, (eventType) => {
    if (eventType === 'change') {
      console.log('\n🔄 Token file changed, rebuilding...');
      buildTokens();
    }
  });
}
