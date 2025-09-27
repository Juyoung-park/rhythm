/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf4ff',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
        },
        secondary: {
          50: '#fdf2f8',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
        },
        accent: {
          100: '#dbeafe',
          300: '#93c5fd',
          500: '#3b82f6',
        },
        neutral: {
          100: '#f3f4f6',
          200: '#e5e7eb',
          700: '#374151',
          900: '#111827',
        },
      },
      fontFamily: {
        heading: ['"Manrope"', '"Noto Sans KR"', 'sans-serif'],
        body: ['"Noto Sans KR"', '"Inter"', 'sans-serif'],
      },
      backgroundImage: {
        'hero-radial': 'radial-gradient(circle at top, rgba(168, 85, 247, 0.2), transparent 60%)',
        'glass-pane': 'linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.75))',
      },
      boxShadow: {
        glow: '0 25px 65px -20px rgba(147, 51, 234, 0.35)',
        lifted: '0 15px 35px -10px rgba(15, 23, 42, 0.2)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        fade: 'fadeIn 0.8s ease forwards',
        shimmer: 'shimmer 3s linear infinite',
      },
      transitionTimingFunction: {
        soft: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      borderRadius: {
        xl2: '1.5rem',
      },
      spacing: {
        18: '4.5rem',
      },
    },
  },
  plugins: [],
}
