import type { Config } from 'tailwindcss'

// IPCM design tokens. Parent brand = TSU (navy, Sora, Inter, 12px cards, pill buttons).
// IPCM accent = peace teal. Crimson is reserved for errors, overdue and destructive actions.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
    extend: {
      colors: {
        navy: { DEFAULT: '#0F1F3D', 700: '#13284A', 900: '#0A1730', 50: '#EEF1F6' },
        teal: { DEFAULT: '#0E7C6B', 700: '#0A5F52', 100: '#CDEAE4', 50: '#E8F5F2' },
        crimson: { DEFAULT: '#C4293B', 50: '#FDF1F2' },
        amber: { DEFAULT: '#B7791F', 50: '#FDF6E7' },
        success: { DEFAULT: '#2F855A', 50: '#EAF6EF' },
        ink: { DEFAULT: '#1C2536', muted: '#4A5468' },
        line: '#E3E7EE',
        canvas: '#F6F8FB',
      },
      fontFamily: {
        display: ['"Sora Variable"', 'Sora', 'system-ui', 'sans-serif'],
        body: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
      },
      // Type scale: nothing below 14px. Body is 16px+.
      fontSize: {
        sm: ['0.875rem', { lineHeight: '1.375rem' }], // 14 — absolute minimum
        label: ['0.9375rem', { lineHeight: '1.375rem' }], // 15
        base: ['1rem', { lineHeight: '1.625rem' }], // 16
        lead: ['1.25rem', { lineHeight: '2rem' }], // 20
        h3: ['1.375rem', { lineHeight: '1.875rem' }], // 22
        h2: ['1.875rem', { lineHeight: '2.375rem' }], // 30
        h1: ['2.5rem', { lineHeight: '3rem' }], // 40
        stat: ['2.25rem', { lineHeight: '2.5rem' }], // 36
        display: ['3rem', { lineHeight: '3.5rem' }], // 48
      },
      borderRadius: { card: '12px', input: '10px' },
      boxShadow: {
        card: '0 1px 2px rgba(15,31,61,.06)',
        raised: '0 12px 32px rgba(15,31,61,.12)',
      },
      maxWidth: { container: '1200px' },
    },
  },
  plugins: [],
}

export default config
