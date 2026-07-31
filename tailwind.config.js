/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
      },
      colors: {
        medical: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        brand: {
          dark: '#0f172a',
          surface: '#1e293b',
          card: '#1e293b',
          accent: '#10b981',
          blue: '#3b82f6',
          purple: '#8b5cf6',
          amber: '#f59e0b'
        }
      }
    },
  },
  plugins: [],
}
