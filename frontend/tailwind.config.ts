import type { Config } from "tailwindcss";

const config: Config = {
	darkMode: ["class"],
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			fontFamily: {
				sans: [
					'-apple-system',
					'BlinkMacSystemFont',
					'"SF Pro Display"',
					'"SF Pro Text"',
					'Inter',
					'"Helvetica Neue"',
					'Arial',
					'sans-serif'
				],
				mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
			},
			fontSize: {
				'micro': ['12px', '16px'],
				'secondary': ['14px', '20px'],
				'body': ['16px', '24px'],
				'emphasis': ['18px', '26px'],
				'title-section': ['20px', '28px'],
				'title-page': ['24px', '32px'],
				'title-hero': ['32px', '40px'],
				'headline-dashboard': ['40px', '48px'],
				'hero-product': ['44px', '52px'],
			},
			borderRadius: {
				'apple': '12px',
				'button': '8px',
			},
			colors: {
				black: '#0A0A0A',
				white: '#FFFFFF',
				gray: {
					100: '#F5F5F5',
					200: '#E5E5E5',
					300: '#D4D4D4',
					400: '#A3A3A3',
					500: '#737373',
					600: '#525252',
					700: '#404040',
					800: '#262626',
					900: '#1A1A1A',
					950: '#111111',
				},
				green: {
					primary: '#16A34A',
					soft: '#DCFCE7',
					text: '#14532D',
				},
				blue: {
					primary: '#2563EB',
					soft: '#DBEAFE',
					text: '#1E3A8A',
				},
				yellow: {
					primary: '#CA8A04',
					soft: '#FEF9C3',
					text: '#713F12',
				},
				red: {
					primary: '#DC2626',
					soft: '#FEE2E2',
					text: '#7F1D1D',
				}
			},
			transitionDuration: {
				'apple': '150ms',
			},
			transitionTimingFunction: {
				'apple': 'ease-out',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
};
export default config;