const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');

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
      colors: {
        // shadcn/ui CSS variable-based colors (maintain compatibility)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          // Full Golden Amber scale (50-900) - NasNetConnect brand color
          50: '#FDF8E3',
          100: '#FCF2C7',
          200: '#F9E58F',
          300: '#F5D857',
          400: '#F2CB1F',
          500: '#EFC729', // Base - empowerment, confidence, energy
          600: '#D4A50E',
          700: '#9C790A',
          800: '#644E07',
          900: '#2C2203',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          // Full Trust Blue scale (50-900) - reliability, safety
          50: '#EDF2FA',
          100: '#D7E2F4',
          200: '#AFC5E9',
          300: '#87A8DE',
          400: '#5F8BD3',
          500: '#4972ba', // Base - trust, stability
          600: '#3A5B95',
          700: '#2C4470',
          800: '#1D2D4A',
          900: '#0F1725',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Semantic colors - theme-aware via dark mode variants
        success: {
          DEFAULT: '#22C55E',
          light: '#86EFAC',
          dark: '#16A34A',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FCD34D',
          dark: '#D97706',
        },
        error: {
          DEFAULT: '#EF4444',
          light: '#FCA5A5',
          dark: '#DC2626',
        },
        info: {
          DEFAULT: '#0EA5E9',
          light: '#7DD3FC',
          dark: '#0284C7',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        // Custom radius tokens from design spec
        button: '0.75rem', // 12px
        'card-sm': '1rem', // 16px for mobile
        'card-lg': '1.5rem', // 24px for desktop
        pill: '9999px',
      },
      // Typography system from UX Design Specification
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Fira Code', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        display: ['Satoshi', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }], // 12px
        sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
        base: ['1rem', { lineHeight: '1.5rem' }], // 16px
        lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
        xl: ['1.25rem', { lineHeight: '1.75rem' }], // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
      },
      // Custom spacing scale (4px base unit)
      spacing: {
        18: '4.5rem', // 72px
        88: '22rem', // 352px
        112: '28rem', // 448px
        128: '32rem', // 512px
      },
      // Shadow & elevation system (theme-specific)
      boxShadow: {
        // Light mode shadows
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        // Semantic shadows (glows)
        'primary-glow': '0 0 0 4px rgb(239 199 41 / 0.2)',
        'success-glow': '0 0 0 4px rgb(34 197 94 / 0.2)',
        'warning-glow': '0 0 0 4px rgb(245 158 11 / 0.2)',
        'error-glow': '0 0 0 4px rgb(239 68 68 / 0.2)',
        'info-glow': '0 0 0 4px rgb(14 165 233 / 0.2)',
      },
      // Custom animations
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgb(34 197 94 / 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgb(34 197 94 / 0)' },
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
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s infinite',
        'fade-in': 'fade-in 200ms ease-in-out',
        'slide-up': 'slide-up 200ms ease-out',
        'slide-down': 'slide-down 200ms ease-out',
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
