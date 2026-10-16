/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      spacing: {
        4.5: '1.125rem',
      },
      colors: {
        void: '#070B0A',
        surface: '#0E1512',
        raised: '#141C19',
        line: '#1F2B26',
        'line-strong': '#2B3A34',
        ink: '#EAF2EE',
        dim: '#9DB0A7',
        faint: '#6C7F77',
        ev: {
          DEFAULT: '#3DDC84',
          hover: '#33C976',
          soft: 'rgba(61, 220, 132, 0.12)',
          line: 'rgba(61, 220, 132, 0.35)',
        },
        warn: {
          DEFAULT: '#FBBF24',
          soft: 'rgba(251, 191, 36, 0.12)',
        },
        danger: {
          DEFAULT: '#F05252',
          soft: 'rgba(240, 82, 82, 0.12)',
        },
        info: {
          DEFAULT: '#60A5FA',
          soft: 'rgba(96, 165, 250, 0.12)',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        panel: '0 12px 32px -16px rgba(0,0,0,0.7)',
        pop: '0 24px 60px -24px rgba(0,0,0,0.85)',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0.85)', opacity: '0.7' },
          '70%': { transform: 'scale(1.5)', opacity: '0' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.2, 0.6, 0.4, 1) infinite',
        'fade-up': 'fade-up 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};
