/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    screens: {
      xs: "431px",
      sm: "560px",
      md: "640px",
      lg: "768px",
    },
    extend: {},
  },
  plugins: [require("@tailwindcss/aspect-ratio")],
};
