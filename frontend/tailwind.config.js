module.exports = {
  content: [
    "./index.html",
    "./landing.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./views/**/*.html",
  ],
  theme: {
    extend: {
      colors: {
        'syn-primary': '#a280ff',
      },
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
