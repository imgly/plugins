/** @type {import('tailwindcss').Config} */
export const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}'
  ],
  corePlugins: {
    // preflight: false,
  },
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
        // border: "var(--border)",
        // input: "var(--input)",
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',

        // --ubq-interactive-default: linear-gradient(to bottom, hsla(0, 0%, 100%, 0.04), hsla(0, 0%, 100%, 0)), hsla(0, 0%, 100%, 0.1);
        // --ubq-interactive-hover: linear-gradient(to bottom, hsla(0, 0%, 100%, 0.04), hsla(0, 0%, 100%, 0)), hsla(0, 0%, 100%, 0.06);
        // --ubq-interactive-pressed: hsla(0, 0%, 100%, 0.06);
        // --ubq-interactive-selected: linear-gradient(180deg, hsla(0, 0%, 100%, 0.04), hsla(0, 0%, 100%, 0)), hsla(0, 0%, 100%, 0.2);
        // --ubq-interactive-active-default: linear-gradient(to bottom, hsla(0, 0%, 100%, 1), hsla(0, 0%, 100%, 0)), hsla(0, 0%, 100%, 0.88);
        // --ubq-interactive-active-hover: linear-gradient(to bottom, hsla(0, 0%, 100%, 0.8), hsla(0, 0%, 100%, 0)), hsla(210, 100%, 95%, 0.65);
        // --ubq-interactive-active-pressed: hsla(0, 0%, 100%, 0.65);
        // --ubq-interactive-accent-default: linear-gradient(180deg, hsla(0, 0%, 100%, 0.06), hsla(0, 0%, 100%, 0)), hsla(230, 90%, 60%, 0.8);
        // --ubq-interactive-accent-hover: linear-gradient(180deg, hsla(0, 0%, 100%, 0.1), hsla(0, 0%, 100%, 0)), hsla(230, 90%, 60%, 0.7);
        // --ubq-interactive-accent-pressed: hsla(230, 90%, 60%, 0.7);
        // --ubq-interactive-danger-default: linear-gradient(180deg, hsla(0, 0%, 100%, 0.07), hsla(0, 0%, 100%, 0)), hsla(338, 64%, 62%, 0.85);
        // --ubq-interactive-danger-hover: linear-gradient(180deg, hsla(0, 0%, 100%, 0.07), hsla(0, 0%, 100%, 0)), hsla(338, 64%, 62%, 0.65);
        // --ubq-interactive-danger-pressed: hsla(338, 64%, 62%, 0.65);
        // --ubq-interactive-template-default: linear-gradient(180deg, hsla(0, 0%, 100%, 0.06), hsla(0, 0%, 100%, 0)), hsla(274, 97%, 60%, 0.6);
        // --ubq-interactive-template-hover: linear-gradient(180deg, hsla(0, 0%, 100%, 0.06), hsla(0, 0%, 100%, 0)), hsla(274, 97%, 60%, 0.5);
        // --ubq-interactive-template-pressed: hsla(274, 97%, 60%, 0.5);

        // --ubq-foreground-default: hsla(210, 0%, 100%, 0.9);
        // --ubq-foreground-light: hsla(210, 0%, 100%, 0.7);
        // --ubq-foreground-info: hsla(210, 0%, 100%, 0.5);
        // --ubq-foreground-active: hsla(210, 30%, 10%, 0.9);
        // --ubq-foreground-accent: hsla(210, 0%, 100%, 1);
        // --ubq-foreground-danger: hsla(210, 0%, 100%, 1);
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

        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)'
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)'
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)'
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)'
        },
        // --ubq-input-default: hsl(207 18% 10%);
        // --ubq-input-hover: hsl(207 17% 12%);
        // --ubq-progress: hsl(206 8% 62%);
        // --ubq-border-default: hsl(0 0 100% / 0.16);
        // --ubq-stroke-contrast-1: hsl(200 11% 95% / 0.12);
        // --ubq-stroke-contrast-2: hsl(200 11% 95% / 0.25);
        // --ubq-stroke-contrast-3: hsl(200 11% 95% / 0.9);
        // --ubq-focus-default: hsl(221 100% 80%);
        // --ubq-focus-outline: hsl(221 100% 80% / 0.35);
        // --ubq-overlay: hsl(207 18% 10% / 0.8);
        // --ubq-notice-error: hsl(346 98% 81%);
        // --ubq-notice-info: hsl(205 9% 75%);
        // --ubq-notice-success: hsl(158 42% 67%);
        // --ubq-notice-warning: hsl(37 61% 67%);
        // --ubq-effect-shadow: 0px 1px 2px 0px hsla(0, 0%, 0%, 0.24), 0px 0px 0px 0.5px hsla(0, 0%, 0%, 0.12);
        // --ubq-effect-focus: 0px 1px 2px 0px hsla(0, 0%, 0%, 0.24), 0px 0px 0px 0.5px hsla(0, 0%, 0%, 0.12), 0px 0px 0px 2px var(--ubq-elevation-2), 0px 0px 0px 3px var(--ubq-focus-default), 0px 0px 0px 7px var(--ubq-focus-outline);

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
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  }
};
