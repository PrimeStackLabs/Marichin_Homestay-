/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          forest: '#0F2A20',
          emerald: '#1B4332',
          footer: '#0A1A13',
          ivory: '#FAF6EC',
          cream: '#F1E9D8',
          linen: '#F1E9D8',
          sage: '#DDE6D3',
          gold: '#B8964A',
          lightgold: '#D9BC7A',
          terracotta: '#A8654A',
          darktext: '#1A2A21',
          mutedtext: '#5F6B62',
          textondark: '#F3EDDD',
          mutedondark: '#B9C4B8',
        },
        forest: {
          deep: '#0F2A20',
          rich: '#1B4332',
          footer: '#0A1A13',
          950: '#0A1A13',
          900: '#0F2A20',
          850: '#14382A',
          800: '#1B4332',
          700: '#224835',
          600: '#2E5A44',
          500: '#416252',
          400: '#648875',
        },
        gold: {
          DEFAULT: '#B8964A',
          light: '#D9BC7A',
          300: '#E9D5A5',
          400: '#D9BC7A',
          500: '#B8964A',
          600: '#A1823C',
          700: '#876C2F',
        },
        ivory: {
          DEFAULT: '#FAF6EC',
          50: '#FCFAF7',
          100: '#FAF6EC',
          200: '#F1E9D8',
          300: '#E5D9C4',
          400: '#5F6B62',
        },
        linen: {
          DEFAULT: '#F1E9D8',
          100: '#F8F3E9',
          200: '#F1E9D8',
          300: '#E5D9C4',
        },
        sage: {
          DEFAULT: '#DDE6D3',
          50: '#F4F7F1',
          100: '#E9EFE3',
          200: '#DDE6D3',
          300: '#CAD8BE',
          400: '#AABFA0',
          500: '#899E7F',
        },
        terracotta: {
          DEFAULT: '#A8654A',
          400: '#BA775D',
          500: '#A8654A',
          600: '#8F4F37',
        },
        charcoal: {
          900: '#1A2A21',
          800: '#232724',
          700: '#5F6B62',
          600: '#7A867E',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        playfair: ['"Playfair Display"', 'Georgia', 'serif'],
        poppins: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        sans: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'boutique': '0 10px 40px rgba(15, 42, 32, 0.08)',
        'luxury': '0 25px 60px -15px rgba(15, 42, 32, 0.45), 0 10px 25px -5px rgba(0, 0, 0, 0.2)',
        'floating': '0 20px 45px -10px rgba(15, 42, 32, 0.25)',
        'floating-hover': '0 25px 55px -10px rgba(15, 42, 32, 0.35), 0 0 20px rgba(184, 150, 74, 0.2)',
        'gold-glow': '0 0 20px rgba(184, 150, 74, 0.35)',
        'card': '0 10px 40px rgba(15, 42, 32, 0.08)',
        'card-light': '0 10px 40px rgba(15, 42, 32, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'pulse-subtle': 'pulseSubtle 3s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.03)', opacity: '0.9' },
        }
      }
    },
  },
  plugins: [],
}
