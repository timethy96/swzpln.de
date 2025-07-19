/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
	theme: {
		extend: {
			fontFamily: {
				sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Arial', 'sans-serif'],
				'open-sans': ['OpenSans', 'Arial', 'sans-serif']
			},
			colors: {
				primary: {
					50: '#f8f9fa',
					100: '#f1f3f4',
					200: '#e8eaed',
					300: '#dadce0',
					400: '#bdc1c6',
					500: '#9aa0a6',
					600: '#80868b',
					700: '#5f6368',
					800: '#3c4043',
					900: '#202124'
				}
			},
			animation: {
				'fade-in': 'fadeIn 0.3s ease-in-out',
				'slide-in': 'slideIn 0.3s ease-in-out',
				'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
			},
			keyframes: {
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				slideIn: {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(0)' }
				}
			}
		}
	},
	plugins: []
};