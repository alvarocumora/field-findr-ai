import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
	extend: {
			fontFamily: {
				sans: ['DM Sans', 'system-ui', 'sans-serif'],
				heading: ['Space Grotesk', 'DM Sans', 'sans-serif'],
				// Titulares grandes de marketing (portada): serif editorial, separado
				// de font-heading para no cambiar la tipografia del resto de la app.
				editorial: ['Fraunces', 'Georgia', 'serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				success: 'hsl(var(--success))',
				warning: 'hsl(var(--warning))',
				info: 'hsl(var(--info))',
				emerald: {
					50: 'hsl(152, 81%, 96%)',
					100: 'hsl(149, 80%, 90%)',
					200: 'hsl(152, 76%, 80%)',
					300: 'hsl(156, 72%, 67%)',
					400: 'hsl(158, 64%, 52%)',
					500: 'hsl(160, 84%, 39%)',
					600: 'hsl(161, 94%, 30%)',
					700: 'hsl(163, 94%, 24%)',
					800: 'hsl(163, 88%, 20%)',
					900: 'hsl(164, 86%, 16%)',
				},
				sky: {
					50: 'hsl(204, 100%, 97%)',
					100: 'hsl(204, 94%, 94%)',
					200: 'hsl(201, 94%, 86%)',
					300: 'hsl(199, 95%, 74%)',
					400: 'hsl(198, 93%, 60%)',
					500: 'hsl(199, 89%, 48%)',
					600: 'hsl(200, 98%, 39%)',
					700: 'hsl(201, 96%, 32%)',
					800: 'hsl(201, 90%, 27%)',
					900: 'hsl(202, 80%, 24%)',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			zIndex: {
				// Semantic layering tokens — mirror CSS vars in index.css.
				// Prefer these over ad-hoc z-[123]. See docs/UI_LAYERING.md.
				base:        'var(--z-base)',
				content:     'var(--z-content)',
				'map-overlay': 'var(--z-map-overlay)',
				sticky:      'var(--z-sticky)',
				header:      'var(--z-header)',
				fab:         'var(--z-fab)',
				overlay:     'var(--z-overlay)',
				modal:       'var(--z-modal)',
				toast:       'var(--z-toast)',
				tour:        'var(--z-tour)',
			},
			spacing: {
				header: 'var(--header-h)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'fade-in-up': {
					'0%': { opacity: '0', transform: 'translateY(40px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'scale-in': {
					'0%': { opacity: '0', transform: 'scale(0.9)' },
					'100%': { opacity: '1', transform: 'scale(1)' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'pulse-glow': {
					'0%, 100%': { boxShadow: '0 0 20px hsla(82, 100%, 50%, 0.2)' },
					'50%': { boxShadow: '0 0 40px hsla(82, 100%, 50%, 0.5)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.6s ease-out forwards',
				'fade-in-up': 'fade-in-up 0.8s ease-out forwards',
				'scale-in': 'scale-in 0.5s ease-out forwards',
				'float': 'float 4s ease-in-out infinite',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite'
			}
		}
	},
	plugins: [animate],
} satisfies Config;
