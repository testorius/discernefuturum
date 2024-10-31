/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
	  extend: {
		fontFamily: {
		  sans: ['Outfit', 'sans-serif'], // Base font
		  display: ['Radley', 'serif'], // For headings
		  logo: ['Bebas Neue', 'sans-serif'], // For logo
		},
	  },
	},
	plugins: [],
  }
  