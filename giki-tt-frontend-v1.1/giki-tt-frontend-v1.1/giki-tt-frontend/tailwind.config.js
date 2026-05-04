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
        // ink uses CSS custom properties so dark/light themes flip automatically.
        // Values are space-separated RGB so Tailwind opacity modifiers work: bg-ink-900/50
        ink: {
          50:   'rgb(var(--ink-50)  / <alpha-value>)',
          100:  'rgb(var(--ink-100) / <alpha-value>)',
          200:  'rgb(var(--ink-200) / <alpha-value>)',
          400:  'rgb(var(--ink-400) / <alpha-value>)',
          600:  'rgb(var(--ink-600) / <alpha-value>)',
          700:  'rgb(var(--ink-700) / <alpha-value>)',
          800:  'rgb(var(--ink-800) / <alpha-value>)',
          850:  'rgb(var(--ink-850) / <alpha-value>)',
          900:  'rgb(var(--ink-900) / <alpha-value>)',
          950:  'rgb(var(--ink-950) / <alpha-value>)',
          1000: 'rgb(var(--ink-1000)/ <alpha-value>)',
        },
        accent: {
          50:      '#FEF9EC',
          100:     '#FEF3D7',
          200:     '#FDE3a0',
          400:     '#f9c445',
          DEFAULT: '#F7AD19',
          600:     '#c98a00',
          700:     '#a06c00',
          800:     '#7a5100',
        },
        cyan: {
          light: '#9FE7F5',
          mid:   '#429EBD',
          deep:  '#053F5C',
        },
        ok:   '#34d399',
        warn: '#f59e0b',
        bad:  '#f87171',
        muted:'#5a8fa5',
      },
    },
  },
  plugins: [],
}
