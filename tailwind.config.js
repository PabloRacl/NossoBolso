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
        },
        bolso: {
          dark: '#0B0F19',
          card: '#0D1424',
          surface: '#090D18',
          border: '#1E293B',
          borderLight: '#2E3B52',
          emerald: '#00FF88',
          emeraldHover: '#00CC6D',
          cyan: '#06B6D4',
          amber: '#F59E0B',
          rose: '#FF4D6D',
          purple: '#8B5CF6',
          blue: '#38BDF8',
          text: '#F8FAFC',
          muted: '#94A3B8',
          faded: '#64748B'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
