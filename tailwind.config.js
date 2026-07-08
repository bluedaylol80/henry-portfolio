/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0A1931',
        elev: '#1A2B4C',
        ink: {
          DEFAULT: '#F8F9FA',
          dim: '#AAB8D0',
          mute: '#5F7195',
        },
        era: {
          amber: '#F5B041',
          coral: '#F39C12',
          violet: '#E67E22',
          cyan: '#4FACFE',
          sky: '#00F2FE',
        },
      },
      fontFamily: {
        sans: [
          '"Pretendard Variable"',
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
        display: [
          '"Space Grotesk Variable"',
          '"Space Grotesk"',
          '"Pretendard Variable"',
          'Pretendard',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
