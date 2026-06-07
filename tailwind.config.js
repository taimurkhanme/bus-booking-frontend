/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#3B82F6', // blue-500
          DEFAULT: '#2563EB', // blue-600
          dark: '#1D4ED8', // blue-700
        },
        secondary: {
          light: '#A855F7', // purple-500
          DEFAULT: '#9333EA', // purple-600
          dark: '#7E22CE', // purple-700
        },
        success: '#10B981', // green-500
        error: '#EF4444', // red-500
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
