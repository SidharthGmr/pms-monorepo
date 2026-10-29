import type { Config } from 'tailwindcss';
import colors from 'tailwindcss/colors';

const config = {
  darkMode: ['class'],
  content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  prefix: '',
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		// The dashboard sidebar docks at this width; below it the header hamburger opens it
  		// as a sheet. Keep in sync with MOBILE_BREAKPOINT in src/hooks/use-mobile.tsx.
  		screens: {
  			sidebar: '1200px'
  		},
  		fontFamily: {
  			sans: ['var(--font-outfit, Outfit)', 'var(--font-jakarta, "Plus Jakarta Sans")', 'var(--font-devanagari, "Noto Sans Devanagari")', 'sans-serif']
  		},
  		colors: {
  			violet: {
                    ...colors.violet,
  				DEFAULT: 'hsl(var(--violet))'
  			},
  			blue: {
                    ...colors.blue,
  				DEFAULT: 'hsl(var(--blue))'
  			},
  			cyan: {
                    ...colors.cyan,
  				DEFAULT: 'hsl(var(--cyan))'
  			},
  			grey: 'hsl(var(--grey))',
  			red: {
                    ...colors.red,
  				DEFAULT: 'hsl(var(--red))'
  			},
  			green: {
                    ...colors.green,
  				DEFAULT: 'hsl(var(--green))'
  			},
  			yellow: {
                    ...colors.yellow,
  				DEFAULT: 'hsl(var(--yellow))'
  			},
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
  			success: {
  				DEFAULT: 'hsl(var(--success))',
  				foreground: 'hsl(var(--success-foreground))'
  			},
  			warning: {
  				DEFAULT: 'hsl(var(--warning))',
  				foreground: 'hsl(var(--warning-foreground))'
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
  			storefront: {
  				'hero-from': 'hsl(var(--storefront-hero-from))',
  				'hero-to': 'hsl(var(--storefront-hero-to))',
  				'hero-foreground': 'hsl(var(--storefront-hero-foreground))',
  				'hero-cta': 'hsl(var(--storefront-hero-cta))',
  				'hero-cta-foreground': 'hsl(var(--storefront-hero-cta-foreground))',
  				accent: 'hsl(var(--storefront-accent))',
  				'accent-foreground': 'hsl(var(--storefront-accent-foreground))',
  				surface: 'hsl(var(--storefront-surface))',
  				'surface-heading': 'hsl(var(--storefront-surface-heading))',
  				'surface-foreground': 'hsl(var(--storefront-surface-foreground))',
  				'surface-muted': 'hsl(var(--storefront-surface-muted))',
  				'surface-border': 'hsl(var(--storefront-surface-border))',
  				'promo-1': 'hsl(var(--storefront-promo-1))',
  				'promo-1-foreground': 'hsl(var(--storefront-promo-1-foreground))',
  				'promo-2': 'hsl(var(--storefront-promo-2))',
  				'promo-2-foreground': 'hsl(var(--storefront-promo-2-foreground))',
  				'promo-3': 'hsl(var(--storefront-promo-3))',
  				'promo-3-foreground': 'hsl(var(--storefront-promo-3-foreground))'
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
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			gradient: {
  				'0%, 100%': {
  					'background-size': '200% 200%',
  					'background-position': 'left center'
  				},
  				'50%': {
  					'background-size': '200% 200%',
  					'background-position': 'right center'
  				}
  			},
  			'bell-ring': {
  				'0%, 55%, 100%': {
  					transform: 'rotate(0deg)'
  				},
  				'5%': {
  					transform: 'rotate(14deg)'
  				},
  				'10%': {
  					transform: 'rotate(-12deg)'
  				},
  				'15%': {
  					transform: 'rotate(10deg)'
  				},
  				'20%': {
  					transform: 'rotate(-8deg)'
  				},
  				'25%': {
  					transform: 'rotate(6deg)'
  				},
  				'30%': {
  					transform: 'rotate(-4deg)'
  				},
  				'35%': {
  					transform: 'rotate(2deg)'
  				},
  				'40%': {
  					transform: 'rotate(0deg)'
  				}
  			}
  		},
  		animation: {
  			gradient: 'gradient 8s linear infinite',
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'gradient-bg': 'gradient 50s ease infinite',
  			'bell-ring': 'bell-ring 2.5s ease-in-out infinite'
  		},
  		backgroundImage: {
  			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))'
  		}
  	}
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

export default config;
