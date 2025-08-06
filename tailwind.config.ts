import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", "class"],
  theme: {
  	screens: {
  		'5xl': {
  			max: '2299px'
  		},
  		'4xl': {
  			max: '1899px'
  		},
  		'3xl': {
  			max: '1719px'
  		},
  		'2xl': {
  			max: '1419px'
  		},
  		lxl: {
  			max: '1259px'
  		},
  		xl: {
  			max: '1179px'
  		},
  		lg: {
  			max: '1023px'
  		},
  		md: {
  			max: '767px'
  		},
  		sm: {
  			max: '480px'
  		}
  	},
  	extend: {
  		colors: {
  			primary: {
  				'0': '#F5FDF1',
  				'25': '#ECFAE2',
  				'50': '#D9F6C6',
  				'100': '#75D438',
  				'200': '#B2ED8D',
  				'300': '#9FE870',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				'0': '#E8EBE6',
  				'25': '#D0D6CC',
  				'50': '#A2AD99',
  				'100': '#738566',
  				'200': '#455C33',
  				'300': '#163300',
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			greyscale: {
  				'0': '#FFFFFF',
  				'25': '#FAFAFA',
  				'50': '#F5F5F5',
  				'100': '#E5E5E5',
  				'200': '#D4D4D4',
  				'300': '#A3A3A3',
  				'400': '#737373',
  				'500': '#525252',
  				'600': '#404040',
  				'700': '#262626',
  				'800': '#171717',
  				'900': '#0A0A0A'
  			},
  			others: {
  				'0': '#F0FBFF',
  				'25': '#D1F0FA',
  				'50': '#7EDDF1',
  				'100': '#33CFFF',
  				'200': '#116B97',
  				'300': '#0C4E6E'
  			},
  			success: {
  				'0': '#EFFEFA',
  				'25': '#DDF3EF',
  				'50': '#9EE1D4',
  				'100': '#40C4AA',
  				'200': '#28806F',
  				'300': '#184E44'
  			},
  			warning: {
  				'0': '#FFF6E0',
  				'25': '#FAEDCC',
  				'50': '#FCDA83',
  				'100': '#FFBE4C',
  				'200': '#966422',
  				'300': '#5C3D1F'
  			},
  			error: {
  				'0': '#FFF0F3',
  				'25': '#FADBE1',
  				'50': '#ED8296',
  				'100': '#DF1C41',
  				'200': '#96132C',
  				'300': '#710E21'
  			},
  			dark: {
  				bg: '#0F0F0F',
  				surface: '#1A1A1A',
  				card: '#262626',
  				'card-subtle': '#1E1E1E',
  				border: '#404040',
  				text: {
  					primary: '#FFFFFF',
  					secondary: '#A3A3A3',
  					muted: '#737373'
  				}
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		zIndex: {
  			'1': '1',
  			'2': '2',
  			'3': '3',
  			'4': '4',
  			'5': '5'
  		},
  		spacing: {
  			'13': '3.25rem',
  			'15': '3.75rem',
  			'17': '4.25rem',
  			'18': '4.5rem',
  			'19': '4.75rem',
  			'21': '5.25rem',
  			'22': '5.5rem',
  			'23': '5.75rem',
  			'25': '6.25rem',
  			'26': '6.5rem',
  			'30': '7.5rem',
  			'34': '8.5rem',
  			'38': '9.5rem',
  			'42': '10.5rem',
  			'54': '13.5rem',
  			'58': '14.5rem',
  			'0.25': '0.0625rem',
  			'0.75': '0.1875rem',
  			'4.5': '1.125rem',
  			'5.5': '1.375rem',
  			'6.5': '1.75rem',
  			'7.5': '1.875rem',
  			'8.5': '2.125rem',
  			'9.5': '2.375rem'
  		},
  		transitionDuration: {
  			DEFAULT: '200ms'
  		},
  		transitionTimingFunction: {
  			DEFAULT: 'linear'
  		},
  		borderWidth: {
  			'0': '0',
  			'2': '0.125rem',
  			'3': '0.1875rem',
  			'4': '0.25rem',
  			'8': '0.5rem',
  			DEFAULT: '0.0625rem'
  		},
  		fontFamily: {
  			sans: [
  				'var(--font-inter)'
  			]
  		},
  		fontSize: {
  			'0': [
  				'0',
  				'0'
  			],
  			sm: [
  				'0.75rem',
  				'1.2rem'
  			],
  			base: [
  				'0.875rem',
  				'1.4rem'
  			],
  			lg: [
  				'1rem',
  				'1.5rem'
  			],
  			xl: [
  				'1.125rem',
  				'1.6875rem'
  			],
  			h1: [
  				'4.25rem',
  				{
  					lineHeight: '5.1rem',
  					fontWeight: '600',
  					letterSpacing: '-0.01em'
  				}
  			],
  			h2: [
  				'3.25rem',
  				{
  					lineHeight: '3.9rem',
  					fontWeight: '600',
  					letterSpacing: '-0.01em'
  				}
  			],
  			h3: [
  				'3rem',
  				{
  					lineHeight: '3.6rem',
  					fontWeight: '600',
  					letterSpacing: '-0.01em'
  				}
  			],
  			h4: [
  				'2.5rem',
  				{
  					lineHeight: '3rem',
  					fontWeight: '600',
  					letterSpacing: '-0.01em'
  				}
  			],
  			h5: [
  				'2rem',
  				{
  					lineHeight: '2.4rem',
  					fontWeight: '600',
  					letterSpacing: '-0.01em'
  				}
  			],
  			h6: [
  				'1.5rem',
  				{
  					lineHeight: '1.8rem',
  					fontWeight: '600',
  					letterSpacing: '-0.01em'
  				}
  			]
  		},
  		boxShadow: {
  			'1': '0.25rem 0.5rem 2rem 0 rgba(10, 10, 10, 0.06)',
  			'2': '0 0.25rem 0.75rem -0.0625rem rgba(10, 10, 10, 0.04)',
  			'3': '0 1.25rem 2.5rem 0 rgba(10, 10, 10, 0.06)'
  		},
  		backgroundImage: {
  			'gradient-divider-light': 'linear-gradient(to bottom, rgba(255,255,255, 0.15) 0, rgba(255,255,255, 0.15) 0.3125rem, transparent 0.3125rem, transparent 0.5rem)',
  			'gradient-divider': 'linear-gradient(to bottom, #D4D4D4 0, #D4D4D4 0.3125rem, transparent 0.3125rem, transparent 0.5rem)'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [
    plugin(function ({ addBase, addComponents, addUtilities }) {
      addBase({
        html: {
          "@apply text-[calc(1rem+.2vw)] 5xl:text-[calc(1rem+.15vw)] 4xl:text-[calc(1rem+.1vw)] 3xl:text-[1rem]":
            {},
        },
      });
      addComponents({
        ".section": {
          "@apply py-30 xl:py-24 md:py-12": {},
        },
        ".section-md": {
          "@apply py-24 md:py-12": {},
        },
        ".container": {
          "@apply max-w-[82.5rem] mx-auto px-8 3xl:max-w-[76.5rem] lg:px-12 md:px-6":
            {},
        },
        ".container-md": {
          "@apply container max-w-[90rem] 3xl:max-w-[84rem]": {},
        },
        ".btn": {
          "@apply inline-flex items-center justify-center h-13 px-7 space-x-2 border border-transparent font-sans text-lg font-semibold rounded-full transition-colors":
            {},
        },
        ".btn-primary": {
          "@apply btn bg-primary-300 text-secondary-300 hover:bg-primary-100":
            {},
        },
        ".btn-secondary": {
          "@apply btn bg-greyscale-0 dark:bg-dark-card border-greyscale-100 dark:border-dark-border text-greyscale-900 dark:text-dark-text-primary hover:bg-primary-300 hover:border-transparent hover:text-secondary-300":
            {},
        },
        ".btn-md": {
          "@apply h-12 px-6": {},
        },
        ".btn-sm": {
          "@apply h-10 px-4 text-base": {},
        },
        ".label": {
          "@apply inline-flex items-center h-8 px-4 bg-primary-25 rounded-full text-base font-medium text-secondary-300":
            {},
        },
        ".label-sm": {
          "@apply h-[1.625rem] px-2.5 text-sm": {},
        },
        ".stage": {
          "@apply mb-4 text-xl font-medium text-greyscale-400 dark:text-dark-text-secondary md:text-lg":
            {},
        },
      });
      addUtilities({
        ".tap-highlight-color": {
          "-webkit-tap-highlight-color": "rgba(0, 0, 0, 0)",
        },
      });
    }),
      require("tailwindcss-animate")
],
};
export default config;
