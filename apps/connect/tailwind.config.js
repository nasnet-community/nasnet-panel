const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');

// Import generated token config from design token pipeline
const tokenConfig = require('../../libs/ui/tokens/dist/tailwind.config.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    join(
      __dirname,
      '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}',
    ),
    // Library components
    join(__dirname, '../../libs/**/*.{ts,tsx,html}'),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      // Merge generated token colors with shadcn/ui compatibility colors
      colors: {
        // Generated semantic token colors (from design token pipeline)
        ...tokenConfig.colors,
        // shadcn/ui CSS variable-based colors (maintain compatibility)
        // These use HSL format to work with shadcn/ui opacity modifiers
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // Override primary/secondary with both formats for flexibility
        primary: {
          // Token-based (recommended)
          ...tokenConfig.colors.primary,
          // shadcn/ui HSL format (for opacity modifiers)
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          hover: 'var(--semantic-color-primary-hover)',
          // Direct color values (for legacy components)
          50: 'var(--color-brand-amber-50)',
          100: 'var(--color-brand-amber-100)',
          200: 'var(--color-brand-amber-200)',
          300: 'var(--color-brand-amber-300)',
          400: 'var(--color-brand-amber-400)',
          500: 'var(--color-brand-amber-500)',
          600: 'var(--color-brand-amber-600)',
          700: 'var(--color-brand-amber-700)',
          800: 'var(--color-brand-amber-800)',
          900: 'var(--color-brand-amber-900)',
        },
        secondary: {
          ...tokenConfig.colors.secondary,
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          hover: 'var(--semantic-color-secondary-hover)',
          50: 'var(--color-brand-blue-50)',
          100: 'var(--color-brand-blue-100)',
          200: 'var(--color-brand-blue-200)',
          300: 'var(--color-brand-blue-300)',
          400: 'var(--color-brand-blue-400)',
          500: 'var(--color-brand-blue-500)',
          600: 'var(--color-brand-blue-600)',
          700: 'var(--color-brand-blue-700)',
          800: 'var(--color-brand-blue-800)',
          900: 'var(--color-brand-blue-900)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          ...tokenConfig.colors.muted,
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          ...tokenConfig.colors.accent,
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          ...tokenConfig.colors.popover,
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          ...tokenConfig.colors.card,
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Additional semantic colors needed by primitives
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // Semantic status colors (from design tokens)
        success: {
          DEFAULT: 'var(--semantic-color-success-DEFAULT)',
          light: 'var(--semantic-color-success-light)',
          dark: 'var(--semantic-color-success-dark)',
          foreground: 'hsl(var(--foreground))',
        },
        warning: {
          DEFAULT: 'var(--semantic-color-warning-DEFAULT)',
          light: 'var(--semantic-color-warning-light)',
          dark: 'var(--semantic-color-warning-dark)',
          foreground: 'hsl(var(--foreground))',
        },
        error: {
          DEFAULT: 'var(--semantic-color-error-DEFAULT)',
          light: 'var(--semantic-color-error-light)',
          dark: 'var(--semantic-color-error-dark)',
          foreground: 'hsl(var(--foreground))',
          hover: 'var(--semantic-color-error-hover)',
        },
        info: {
          DEFAULT: 'var(--semantic-color-info-DEFAULT)',
          light: 'var(--semantic-color-info-light)',
          dark: 'var(--semantic-color-info-dark)',
          foreground: 'hsl(var(--foreground))',
        },
        // Category accent colors (14 feature categories)
        category: {
          security: 'var(--semantic-color-category-security)',
          monitoring: 'var(--semantic-color-category-monitoring)',
          networking: 'var(--semantic-color-category-networking)',
          vpn: 'var(--semantic-color-category-vpn)',
          wifi: 'var(--semantic-color-category-wifi)',
          firewall: 'var(--semantic-color-category-firewall)',
          system: 'var(--semantic-color-category-system)',
          dhcp: 'var(--semantic-color-category-dhcp)',
          routing: 'var(--semantic-color-category-routing)',
          tunnels: 'var(--semantic-color-category-tunnels)',
          qos: 'var(--semantic-color-category-qos)',
          hotspot: 'var(--semantic-color-category-hotspot)',
          logging: 'var(--semantic-color-category-logging)',
          backup: 'var(--semantic-color-category-backup)',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
        },
      },
      // Generated border radius tokens
      borderRadius: {
        ...tokenConfig.borderRadius,
        // shadcn/ui compatibility
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        // Additional custom values
        'card-sm': '1rem',
        'card-lg': '1.5rem',
        pill: '9999px',
      },
      // Generated font family tokens
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
        display: ['Satoshi', 'Inter', 'system-ui', 'sans-serif'],
      },
      // Font sizes with line heights
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      // Custom spacing scale (4px base unit)
      spacing: {
        18: '4.5rem',
        88: '22rem',
        112: '28rem',
        128: '32rem',
        'component-xs': '0.25rem',
        'component-sm': '0.5rem',
        'component-md': '1rem',
        'component-lg': '1.5rem',
        'component-xl': '2rem',
        'page-mobile': '1rem',
        'page-tablet': '1.5rem',
        'page-desktop': '2rem',
      },
      // Generated shadow tokens + semantic glows
      boxShadow: {
        ...tokenConfig.boxShadow,
        // Semantic shadows (glows for focus states)
        'primary-glow': '0 0 0 4px var(--component-button-primary-focusRing)',
        'success-glow': '0 0 0 4px color-mix(in srgb, var(--semantic-color-success-DEFAULT) 20%, transparent)',
        'warning-glow': '0 0 0 4px color-mix(in srgb, var(--semantic-color-warning-DEFAULT) 20%, transparent)',
        'error-glow': '0 0 0 4px color-mix(in srgb, var(--semantic-color-error-DEFAULT) 20%, transparent)',
        'info-glow': '0 0 0 4px color-mix(in srgb, var(--semantic-color-info-DEFAULT) 20%, transparent)',
      },
      // Custom animations
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 color-mix(in srgb, var(--semantic-color-success-DEFAULT) 40%, transparent)' },
          '50%': { boxShadow: '0 0 0 8px transparent' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s infinite',
        'fade-in': 'fade-in 200ms ease-in-out',
        'slide-up': 'slide-up 200ms ease-out',
        'slide-down': 'slide-down 200ms ease-out',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      // Transition durations
      transitionDuration: {
        250: '250ms',
        350: '350ms',
      },
    },
  },
  plugins: [],
};
