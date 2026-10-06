/** @type {import('tailwindcss').Config} */
/*
 * Tasarım sistemi ölçekleri — değerler src/index.css'teki değişkenlerle aynıdır.
 * Köşe: kontrol 8px, kart 12px. Boşluk: yalnızca 4px katları (yarım adımlar en yakın 4 katına yuvarlanır).
 * Gölge: kart / hover / pop-up — üçü de çok hafif.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      borderRadius: { md: '8px', lg: '12px', xl: '12px', '2xl': '16px' },
      spacing: { '0.5': '4px', '1.5': '8px', '2.5': '12px', '3.5': '16px' },
      boxShadow: {
        sm: 'var(--shadow-card)',
        DEFAULT: 'var(--shadow-card)',
        md: 'var(--shadow-hover)',
        lg: 'var(--shadow-pop)',
        xl: 'var(--shadow-pop)',
        '2xl': 'var(--shadow-pop)',
      },
      transitionDuration: { DEFAULT: '180ms' },
      transitionTimingFunction: { DEFAULT: 'cubic-bezier(.2,.8,.2,1)' },
    },
  },
  plugins: [],
}
