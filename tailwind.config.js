/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a1a1a',
        secondary: '#2d2d2d',
        accent: '#6366f1',
      },
      keyframes: {
        'pulse-danger': {
          '0%, 100%': { backgroundColor: '#1a1a1a' },
          '50%': { backgroundColor: '#2d1a1a' },
        },
      },
      animation: {
        'pulse-danger': 'pulse-danger 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
