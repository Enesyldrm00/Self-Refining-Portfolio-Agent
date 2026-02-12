/** @type {import('tailwindcss').Config} */
const config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                'cyber': {
                    'dark': '#0a0e27',
                    'darker': '#050812',
                    'blue': '#00d9ff',
                    'purple': '#b537f2',
                    'pink': '#ff2c70',
                    'green': '#00ff88',
                    'yellow': '#ffcb00',
                },
                'neon': {
                    'blue': '#00f0ff',
                    'purple': '#c77dff',
                    'pink': '#ff006e',
                    'green': '#39ff14',
                    'red': '#ff0000',
                }
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-cyber': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'gradient-neon': 'linear-gradient(135deg, #00d9ff 0%, #b537f2 50%, #ff2c70 100%)',
            },
            boxShadow: {
                'neon-blue': '0 0 20px rgba(0, 217, 255, 0.5)',
                'neon-purple': '0 0 20px rgba(181, 55, 242, 0.5)',
                'neon-pink': '0 0 20px rgba(255, 44, 112, 0.5)',
            },
            animation: {
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(0, 217, 255, 0.5), 0 0 10px rgba(0, 217, 255, 0.3)' },
                    '100%': { boxShadow: '0 0 20px rgba(0, 217, 255, 0.8), 0 0 30px rgba(0, 217, 255, 0.5)' },
                }
            }
        },
    },
    plugins: [],
};

export default config;

