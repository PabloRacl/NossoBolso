/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neuro: {
          bg: '#0A0B0E',
          card: '#12141A',
          border: '#1E2330',
          accent: '#00FF88',
          accentHover: '#00CC6D',
          income: '#10B981',
          expense: '#EF4444',
          purple: '#8B5CF6',
          cyan: '#06B6D4',
          muted: '#64748B',
          text: '#F8FAFC',
          subtext: '#94A3B8'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
