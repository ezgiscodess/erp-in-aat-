import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * Modül 2 grafik parçaları. Renkler sabit sırada: --series-1 gerçekleşen, --series-2 planlanan.
 * Planlanan seri ayrıca kesikli çizgiyle ayrışır (renk tek başına kimlik taşımaz).
 * Her grafik üzerine gelince değer gösterir; lejant her zaman vardır.
 */

const tr = (v: number, d: number) => v.toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d })

export function Legend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[11.5px] text-[var(--muted)]">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          {i.dashed
            ? <svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke={i.color} strokeWidth="2" strokeDasharray="4 3" /></svg>
            : <span className="h-[3px] w-4 rounded-full" style={{ background: i.color }} />}
          {i.label}
        </span>
      ))}
    </div>
  )
}

/** Kapsayıcının genişliğini izler — SVG'yi gerilmeden tam genişlikte çizmek için. */
function useWidth(fallback = 600) {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(fallback)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

/**
 * Kümülatif S eğrisi: planlanan (kesikli) ve gerçekleşen. Üzerine gelince dikey çizgi ve değer kutusu.
 * Y ekseni 0–100 (%), x ekseni aylar.
 */
export function SCurve({ plan, actual, labels, today, height = 220 }: {
  plan: number[]; actual: number[]; labels: string[]; today?: number; height?: number
}) {
  const [hover, setHover] = useState<number | null>(null)
  const [ref, W] = useWidth()
  const n = plan.length
  const H = height
  const pad = { l: 34, r: 12, t: 10, b: 24 }
  const x = (i: number) => pad.l + (i / (n - 1)) * (W - pad.l - pad.r)
  const y = (v: number) => pad.t + (1 - v / 100) * (H - pad.t - pad.b)
  const path = (arr: number[]) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ')

  return (
    <div ref={ref} className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
          const px = ((e.clientX - r.left) / r.width) * W
          const i = Math.round(((px - pad.l) / (W - pad.l - pad.r)) * (n - 1))
          setHover(Math.max(0, Math.min(n - 1, i)))
        }}>
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeWidth="1" />
            <text x={pad.l - 6} y={y(v) + 3} textAnchor="end" fontSize="10" fill="var(--faint)">%{v}</text>
          </g>
        ))}
        {labels.map((l, i) => i % (W > 700 ? 2 : 3) === 0 && (
          <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--faint)">{l}</text>
        ))}
        {today != null && (
          <g>
            <line x1={x(today - 1)} x2={x(today - 1)} y1={pad.t} y2={H - pad.b} stroke="var(--border-strong)" strokeDasharray="2 3" />
            <text x={x(today - 1) + 4} y={pad.t + 10} fontSize="10" fill="var(--muted)">bugün</text>
          </g>
        )}
        <path d={path(plan)} fill="none" stroke="var(--series-2)" strokeWidth="2" strokeDasharray="5 4" />
        <path d={path(actual)} fill="none" stroke="var(--series-1)" strokeWidth="2" />
        <circle cx={x(actual.length - 1)} cy={y(actual[actual.length - 1])} r="4" fill="var(--series-1)" stroke="var(--surface)" strokeWidth="2" />
        {hover != null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="var(--muted)" strokeWidth="1" />
            <circle cx={x(hover)} cy={y(plan[hover])} r="4" fill="var(--series-2)" stroke="var(--surface)" strokeWidth="2" />
            {actual[hover] != null && <circle cx={x(hover)} cy={y(actual[hover])} r="4" fill="var(--series-1)" stroke="var(--surface)" strokeWidth="2" />}
          </g>
        )}
      </svg>
      {hover != null && (
        <div className="pointer-events-none absolute top-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[11.5px] shadow-md"
          style={{ left: `calc(${(x(hover) / W) * 100}% + ${hover > n / 2 ? -150 : 10}px)` }}>
          <div className="font-semibold text-[var(--ink)]">{labels[hover]}</div>
          <div className="text-[var(--muted)]">Planlanan <b className="text-[var(--ink)] tnum">%{plan[hover]}</b></div>
          <div className="text-[var(--muted)]">Gerçekleşen <b className="text-[var(--ink)] tnum">{actual[hover] != null ? `%${actual[hover]}` : '—'}</b></div>
          {actual[hover] != null && (
            <div className="text-[var(--muted)]">Sapma <b className="tnum" style={{ color: actual[hover] < plan[hover] ? 'var(--crit)' : 'var(--ok)' }}>
              {tr(actual[hover] - plan[hover], 1)} puan</b></div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Plan / gerçekleşen yatay çubuk çifti. Her satır: etiket, iki ince çubuk, sağda değerler.
 * Gerçekleşen planı kötü yönde (worseWhen) aşarsa ok kırmızı, iyi yönde ise yeşil olur.
 */
export function PairBars({ rows, format, worseWhen = 'higher' }: {
  rows: { label: ReactNode; plan: number; actual: number; note?: string }[]
  format: (v: number) => string
  /** Gerçekleşenin hangi yönde olması kötü (maliyet/saat: higher, ilerleme/kadro: lower) */
  worseWhen?: 'higher' | 'lower'
}) {
  const max = Math.max(...rows.flatMap((r) => [r.plan, r.actual])) || 1
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((r, i) => {
        const diff = r.actual - r.plan
        const bad = worseWhen === 'higher' ? diff > 0 : diff < 0
        return (
          <div key={i} className="grid grid-cols-[minmax(120px,190px)_1fr_auto] items-center gap-3"
            title={`Plan ${format(r.plan)} · Gerçekleşen ${format(r.actual)}${r.note ? ` · ${r.note}` : ''}`}>
            <span className="truncate text-[12px] text-[var(--ink)]">{r.label}</span>
            <span className="flex flex-col gap-[3px]">
              <span className="h-[6px] rounded-r-full" style={{ width: `${(r.plan / max) * 100}%`, background: 'var(--series-2)', opacity: 0.55 }} />
              <span className="h-[6px] rounded-r-full" style={{ width: `${(r.actual / max) * 100}%`, background: 'var(--series-1)' }} />
            </span>
            <span className="w-[176px] whitespace-nowrap text-right text-[11.5px] tnum">
              <span className="text-[var(--ink)]">{format(r.actual)}</span>
              <span className="text-[var(--faint)]"> / {format(r.plan)}</span>
              {diff !== 0 && (
                <span className="ml-1 font-semibold" style={{ color: bad ? 'var(--crit)' : 'var(--ok)' }}>
                  {diff > 0 ? '▲' : '▼'}
                </span>
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/** Aylık sütunlar: plan (açık) ve gerçekleşen (koyu) yan yana; üzerine gelince değer. */
export function MonthColumns({ data, format, height = 150 }: {
  data: { label: string; plan: number; actual: number }[]; format: (v: number) => string; height?: number
}) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(...data.flatMap((d) => [d.plan, d.actual])) * 1.1
  return (
    <div className="relative">
      <div className="flex items-end gap-1.5 border-b border-[var(--border)]" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="flex h-full flex-1 cursor-default items-end justify-center gap-[2px] rounded-sm"
            style={{ background: hover === i ? 'var(--surface-2)' : undefined }}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <span className="w-[38%] rounded-t-[3px]" style={{ height: `${(d.plan / max) * 100}%`, background: 'var(--series-2)', opacity: 0.55 }} />
            <span className="w-[38%] rounded-t-[3px]" style={{ height: `${(d.actual / max) * 100}%`, background: 'var(--series-1)' }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1.5">
        {data.map((d, i) => <span key={i} className="flex-1 text-center text-[10px] text-[var(--faint)]">{d.label}</span>)}
      </div>
      {hover != null && (
        <div className="pointer-events-none absolute top-0 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[11.5px] shadow-md"
          style={{ left: `calc(${((hover + 0.5) / data.length) * 100}% + ${hover > data.length / 2 ? -140 : 8}px)` }}>
          <div className="font-semibold text-[var(--ink)]">{data[hover].label}</div>
          <div className="text-[var(--muted)]">Planlanan <b className="text-[var(--ink)] tnum">{format(data[hover].plan)}</b></div>
          <div className="text-[var(--muted)]">Gerçekleşen <b className="text-[var(--ink)] tnum">{format(data[hover].actual)}</b></div>
        </div>
      )}
    </div>
  )
}

/** Tek satırlık yığın çubuk — bir bütünün parçaları (ör. alınan / kalan / kesinti). */
export function StackBar({ parts, height = 14 }: {
  parts: { label: string; value: number; color: string }[]; height?: number
}) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1
  return (
    <div className="flex w-full gap-[2px] overflow-hidden rounded-full" style={{ height }}>
      {parts.map((p) => (
        <span key={p.label} title={`${p.label}: ${((p.value / total) * 100).toFixed(1)}%`}
          style={{ width: `${(p.value / total) * 100}%`, background: p.color }} />
      ))}
    </div>
  )
}

/** Gösterge kutusu: büyük değer + hedefe göre küçük çubuk (CPI/SPI gibi oranlar için). */
export function Gauge({ label, value, good = 1, help }: { label: string; value: number; good?: number; help?: string }) {
  const tone = value >= good ? 'ok' : value >= good * 0.95 ? 'warn' : 'crit'
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3" title={help}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-[21px] font-bold leading-tight tnum" style={{ color: `var(--${tone})` }}>{tr(value, 2)}</span>
        <span className="text-[11.5px] text-[var(--muted)]">hedef ≥ {tr(good, 2)}</span>
      </div>
      <div className="relative mt-2 h-[6px] rounded-full bg-[var(--surface-3)]">
        <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(100, (value / 1.2) * 100)}%`, background: `var(--${tone})` }} />
        <span className="absolute -top-[3px] h-[12px] w-[2px] bg-[var(--ink)]" style={{ left: `${(good / 1.2) * 100}%` }} />
      </div>
    </div>
  )
}
