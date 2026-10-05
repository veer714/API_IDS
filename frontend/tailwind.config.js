/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sentinel: {
          950: '#07090e',
          900: '#0b0f19',
          850: '#111726',
          800: '#182032',
          750: '#222d44',
          700: '#2e3c59',
          600: '#475569',
          500: '#64748b',
          400: '#94a3b8',
          300: '#cbd5e1',
          200: '#e2e8f0',
          100: '#f1f5f9',
          50: '#f8fafc',
        },
        decision: {
          allow: '#10b981',
          challenge: '#f59e0b',
          throttle: '#f97316',
          block: '#f43f5e',
        },
        severity: {
          critical: '#f43f5e',
          high: '#ea580c',
          medium: '#f59e0b',
          low: '#38bdf8',
          info: '#64748b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
