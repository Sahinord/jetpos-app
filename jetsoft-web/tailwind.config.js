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
          DEFAULT: '#3b82f6', // Electric Blue
          dark: '#1e40af',
        },
        accent: {
          DEFAULT: '#ef4444', // Neon Red
          dark: '#b91c1c',
        },
      },
    },
  },
  plugins: [],
}
