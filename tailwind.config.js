/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cs: {
          primary: '#1E3A5F',
          secondary: '#2563EB',
          accent: '#F59E0B',
          dark: '#0F172A',
          light: '#F8FAFC',
        }
      }
    },
  },
  plugins: [],
};
