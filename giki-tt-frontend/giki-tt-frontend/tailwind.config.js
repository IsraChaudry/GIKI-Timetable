/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Space Mono"', 'ui-monospace', 'monospace'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#08090f',
          900: '#0c0e16',
          850: '#11141e',
          800: '#161a26',
          700: '#1f2433',
          600: '#2a3045',
          500: '#3a4258',
        },
        accent: {
          DEFAULT: '#5b8cff',
          400: '#7aa3ff',
          600: '#3a6fe6',
        },
        ok: '#34d399',
        warn: '#f59e0b',
        bad: '#f87171',
        muted: '#7a8294',
      },
    },
  },
  plugins: [],
}
