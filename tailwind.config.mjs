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
		typography: (theme) => ({
		  DEFAULT: {
			css: {
			  color: theme('colors.gray.700'),
			  fontFamily: theme('fontFamily.sans'),
			  h1: {
				fontFamily: theme('fontFamily.display'),
				color: theme('colors.gray.900'),
				fontSize: theme('fontSize.4xl'),
				fontWeight: 'bold',
			  },
			  h2: {
				fontFamily: theme('fontFamily.display'),
				color: theme('colors.gray.800'),
				fontSize: theme('fontSize.3xl'),
				fontWeight: 'semibold',
			  },
			  h3: {
				fontFamily: theme('fontFamily.display'),
				color: theme('colors.gray.800'),
				fontSize: theme('fontSize.2xl'),
				fontWeight: 'medium',
			  },
			  p: {
				color: theme('colors.gray.700'),
				fontSize: theme('fontSize.lg'),
				lineHeight: theme('lineHeight.relaxed'),
			  },
			  a: {
				color: theme('colors.lime.600'),
				textDecoration: 'underline',
				'&:hover': {
				  color: theme('colors.lime.800'),
				},
			  },
			  ul: {
				listStyleType: 'disc',
				paddingLeft: theme('spacing.5'),
				color: theme('colors.gray.700'),
			  },
			  ol: {
				listStyleType: 'decimal',
				paddingLeft: theme('spacing.5'),
				color: theme('colors.gray.700'),
			  },
			  blockquote: {
				fontStyle: 'italic',
				color: theme('colors.gray.600'),
				borderLeftWidth: '4px',
				borderColor: theme('colors.lime.600'),
				paddingLeft: theme('spacing.4'),
			  },
			  code: {
				color: theme('colors.red.600'),
				backgroundColor: theme('colors.gray.100'),
				padding: theme('spacing.1'),
				borderRadius: theme('borderRadius.md'),
			  },
			  pre: {
				backgroundColor: theme('colors.gray.900'),
				color: theme('colors.gray.100'),
				padding: theme('spacing.4'),
				borderRadius: theme('borderRadius.md'),
				overflowX: 'auto',
			  },
			},
		  },
		}),
	  },
	},
	plugins: [require('@tailwindcss/typography')],
  };