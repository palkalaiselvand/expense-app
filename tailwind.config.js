/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // Disable Tailwind's CSS reset to prevent conflicts with MUI's CssBaseline
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#10b981',
          dark: '#065f46',
          darker: '#064e3b',
          light: '#d1fae5',
          50: '#f0fdf4',
        },
        sidebar: {
          DEFAULT: '#0f172a',
          hover: '#1e293b',
          active: '#064e3b',
          border: '#1e293b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
