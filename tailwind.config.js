/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          deep: '#02030a',
          mid: '#0d1424',
        },
        ink: {
          DEFAULT: '#e8ecf3',
          dim: '#a8b3c8',
        },
        accent: {
          cyan: '#5fd4ff',
          amber: '#ffb054',
          magenta: '#d96fff',
          green: '#6fe39a',
        },
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        eyebrow: '0.18em',
      },
    },
  },
  plugins: [],
};
