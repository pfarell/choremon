import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        green: {
          primary: '#58CC02',
          dark: '#4CAD02',
          light: '#D7FFB8',
        },
        gold: {
          DEFAULT: '#FFD700',
          dark: '#E5A800',
        },
        coral: '#FF4B4B',
        purple: '#CE82FF',
        blue: '#1CB0F6',
        orange: '#FF9600',
        bg: '#FAFAF8',
        card: '#FFFFFF',
        border: '#E5E5E5',
        txt: '#3C3C3C',
        'txt-light': '#AFAFAF',
      },
      fontFamily: {
        display: ['Fredoka One', 'cursive'],
        body: ['Nunito', 'sans-serif'],
      },
      borderRadius: {
        'btn': '16px',
        'card': '16px',
      },
      animation: {
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'coin-bounce': 'coinBounce 2s ease-in-out infinite',
        'coin-glow': 'coinGlow 2s ease-in-out infinite',
        'xp-float': 'xpFloat 1s ease-out forwards',
        'shimmer': 'shimmer 2s infinite linear',
        'pulse-ring': 'pulseRing 2s infinite',
        'slide-up': 'slideUp 0.4s ease-out',
        'confetti': 'confetti 3s ease-out forwards',
        'scan-line': 'scanLine 2s linear infinite',
        'spin-slow': 'spin 2s linear infinite',
        'collect': 'collect 0.5s ease-out forwards',
        'float-up': 'floatUp 1.5s ease-out forwards',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '60%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        coinBounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        coinGlow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.4))' },
          '50%': { filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.8))' },
        },
        xpFloat: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-60px)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseRing: {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        confetti: {
          '0%': { transform: 'translateY(-100vh) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
        scanLine: {
          '0%': { top: '0%' },
          '50%': { top: '100%' },
          '100%': { top: '0%' },
        },
        collect: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.5)', opacity: '0.8' },
          '100%': { transform: 'scale(0) translateY(-100px)', opacity: '0' },
        },
        floatUp: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-80px) scale(1.2)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
export default config
