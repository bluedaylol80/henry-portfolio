/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#06070C',
        elev: '#0B0D16',
        ink: {
          DEFAULT: '#F4F5F7',
          dim: '#A3ABB8',
          mute: '#5C6470',
        },
        era: {
          amber: '#FFB454',
          coral: '#FF9A62',
          violet: '#8B5CF6',
          cyan: '#22D3EE',
          sky: '#38BDF8',
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
