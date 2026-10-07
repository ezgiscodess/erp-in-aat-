import { useEffect, useRef, useState } from 'react'

/**
 * Grafik renk paleti seçici. Seçilen palet bütün grafiklerin seri renklerini (--series-1…5) değiştirir
 * ve tarayıcıda hatırlanır. Durum renkleri (onay, red, bekleyen) paletten bağımsızdır.
 */
export const PALETTES: { key: string; label: string; colors: [string, string, string, string, string] }[] = [
  { key: 'zumrut', label: 'Zümrüt', colors: ['#0E6B53', '#D4AF37', '#3FA48A', '#8C6D12', '#C8553D'] },
  { key: 'canli', label: 'Canlı', colors: ['#1E63E9', '#F2B705', '#12B8A6', '#7C4DFF', '#F2545B'] },
  { key: 'kurumsal', label: 'Kurumsal', colors: ['#0B3275', '#C6A02F', '#5B8DD6', '#2E8B57', '#B8693A'] },
  { key: 'okyanus', label: 'Okyanus', colors: ['#0077B6', '#00B4D8', '#F4A261', '#2A9D8F', '#E76F51'] },
  { key: 'gunbatimi', label: 'Gün batımı', colors: ['#E63946', '#F4A300', '#7B2CBF', '#3A86FF', '#06D6A0'] },
  { key: 'toprak', label: 'Toprak', colors: ['#1F5552', '#E3B04B', '#6FB3B8', '#7A5C8E', '#C98B6B'] },
  { key: 'pastel', label: 'Pastel', colors: ['#5B8DEF', '#F6C35B', '#6DD3B6', '#B39DDB', '#F48FB1'] },
]
const STORE = 'kimkon-chart-palette-v2'

export function applyPalette(key: string) {
  const p = PALETTES.find((x) => x.key === key) ?? PALETTES[0]
  p.colors.forEach((c, i) => document.documentElement.style.setProperty(`--series-${i + 1}`, c))
  try { localStorage.setItem(STORE, p.key) } catch { /* gizli pencere */ }
}

export function initPalette() {
  let key = PALETTES[0].key
  try { key = localStorage.getItem(STORE) ?? key } catch { /* yok */ }
  applyPalette(key)
}

export function ChartPalettePicker() {
  const [open, setOpen] = useState(false)
  const [cur, setCur] = useState(() => { try { return localStorage.getItem(STORE) ?? PALETTES[0].key } catch { return PALETTES[0].key } })
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  const active = PALETTES.find((p) => p.key === cur) ?? PALETTES[0]
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} title="Grafik renkleri"
        className="btn flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[12px] font-medium">
        <span className="flex">{active.colors.slice(0, 4).map((c) => <span key={c} className="-ml-1 h-3.5 w-3.5 rounded-full border-2 border-white first:ml-0" style={{ background: c }} />)}</span>
        Grafik renkleri
      </button>
      {open && (
        <div className="pop absolute right-0 top-full z-50 mt-1.5 w-64 rounded-lg border bg-[var(--surface)] p-2 shadow-xl" style={{ borderColor: 'var(--frame-strong)' }}>
          {PALETTES.map((p) => (
            <button key={p.key} onClick={() => { applyPalette(p.key); setCur(p.key) }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[12.5px] hover:bg-[var(--surface-2)]"
              style={p.key === cur ? { background: 'var(--accent-soft)' } : undefined}>
              <span className="flex gap-1">{p.colors.map((c) => <span key={c} className="h-4 w-4 rounded" style={{ background: c }} />)}</span>
              <span className="flex-1 font-medium text-[var(--ink)]">{p.label}</span>
              {p.key === cur && <span className="text-[var(--accent)]">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
