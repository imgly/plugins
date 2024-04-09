/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}'
  ],
  corePlugins: {},
  theme: {
    boxShadow: {
      DEFAULT: 'var(--ubq-effect-shadow)',
      focus: 'var(--ubq-effect-focus)'
    },
    fontFamily: {
      sans: [
        'var( --ubq-typography-font_family, "Inter", sans-serif )',
        'sans-serif'
      ]
    },
    fontSize: {
      lg: [
        'var(--ubq-typography-headline-l-size)',
        { lineHeight: 'var(--ubq-typography-headline-l-line_height)' }
      ],
      base: [
        'var(--ubq-typography-label-m-size)',
        { lineHeight: 'var(--ubq-typography-label-m-line_height)' }
      ],
      sm: [
        'var(--ubq-typography-label-s-size)',
        { lineHeight: 'var(--ubq-typography-label-s-line_height)' }
      ]
    },
    borderRadius: {
      xs: 'var(--ubq-border_radius-xs)',
      sm: 'var(--ubq-border_radius-s)',
      md: 'var(--ubq-border_radius-m)',
      lg: 'var(--ubq-border_radius-l)'
    },

    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    colors: {},
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--ubq-interactive-default)',
          hover: 'var(--ubq-interactive-hover)',
          pressed: 'var(--ubq-interactive-pressed)',
          selected: 'var(--ubq-interactive-selected)',
          foreground: 'var(--ubq-foreground-default)'
        },
        primaryActive: {
          DEFAULT: 'var(--ubq-interactive-active-default)',
          hover: 'var(--ubq-interactive-active-hover)',
          pressed: 'var(--ubq-interactive-active-pressed)',
          foreground: 'var(--ubq-foreground-active)'
        },
        accent: {
          DEFAULT: 'var(--ubq-interactive-accent-default)',
          hover: 'var(--ubq-interactive-accent-hover)',
          pressed: 'var(--ubq-interactive-accent-pressed)',
          foreground: 'var(--ubq-foreground-accent)'
        },
        danger: {
          DEFAULT: 'var(--ubq-interactive-danger-default)',
          hover: 'var(--ubq-interactive-danger-hover)',
          pressed: 'var(--ubq-interactive-danger-pressed)',
          foreground: 'var(--ubq-foreground-danger)'
        },
        template: {
          DEFAULT: 'var(--ubq-interactive-template-default)',
          hover: 'var(--ubq-interactive-template-hover)',
          pressed: 'var(--ubq-interactive-template-pressed)',
          foreground: 'var(--ubq-foreground-accent)'
        },
        input: {
          DEFAULT: 'var(--ubq-input-default)',
          hover: 'var(--ubq-input-hover)'
        },
        progress: 'var(--ubq-progress)',
        border: {
          DEFAULT: 'var(--ubq-border-default)'
        },
        stroke: {
          'contrast-1': 'var(--ubq-stroke-contrast-1)',
          'contrast-2': 'var(--ubq-stroke-contrast-2)',
          'contrast-3': 'var(--ubq-stroke-contrast-3)'
        },
        focus: {
          DEFAULT: 'var(--ubq-focus-default)',
          outline: 'var(--ubq-focus-outline)'
        },
        overlay: 'var(--ubq-overlay)',
        notice: {
          error: 'var(--ubq-notice-error)',
          info: 'var(--ubq-notice-info)',
          success: 'var(--ubq-notice-success)',
          warning: 'var(--ubq-notice-warning)'
        },
        effect: {
          shadow: 'var(--ubq-effect-shadow)',
          focus: 'var(--ubq-effect-focus)'
        }
      },
      spacing: {
        xs: 'var(--ubq-margin-xs)',
        sm: 'var(--ubq-margin-s)',
        md: 'var(--ubq-margin-m)',
        lg: 'var(--ubq-margin-l)',
        xl: 'var(--ubq-margin-xl)'
      }
    }
  }
};
