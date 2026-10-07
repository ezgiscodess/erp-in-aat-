import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * Modül 2 grafik parçaları. Renkler sabit sırada: --series-1 gerçekleşen, --series-2 planlanan.
 * Planlanan seri ayrıca kesikli çizgiyle ayrışır (renk tek başına kimlik taşımaz).
 * Her grafik üzerine gelince değer gösterir; lejant her zaman vardır.
 */

/**
 * Noktalardan yumuşak eğri (monoton kübik): kümülatif seriler kırık çizgi gibi değil, S eğrisi gibi akar.
 * Monoton olduğu için eğri hiçbir noktada geri dönmez ya da veriyi aşmaz.
 */
export function smoothPath(pts: [number, number][]): string {
  const n = pts.length
  if (n === 0) return ''
  if (n < 3) return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ')
  const dx = pts.slice(1).map((p, i) => p[0] - pts[i][0])
  const sl = pts.slice(1).map((p, i) => (p[1] - pts[i][1]) / (dx[i] || 1))
  const m = pts.map((_, i) => {
    if (i === 0) return sl[0]
    if (i === n - 1) return sl[n - 2]
    return sl[i - 1] * sl[i] <= 0 ? 0 : (2 * sl[i - 1] * sl[i]) / (sl[i - 1] + sl[i])
  })
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3
    d += ` C${pts[i][0] + h},${pts[i][1] + m[i] * h} ${pts[i + 1][0] - h},${pts[i + 1][1] - m[i + 1] * h} ${pts[i + 1][0]},${pts[i + 1][1]}`
  }
  return d
}

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
export function useWidth(fallback = 600) {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(fallback)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(160, Math.round(e.contentRect.width))))
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
  const path = (arr: number[]) => smoothPath(arr.map((v, i) => [x(i), y(v)]))

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
        {(H < 170 ? [0, 50, 100] : [0, 25, 50, 75, 100]).map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeWidth="1" />
            <text x={pad.l - 6} y={y(v) + 3} textAnchor="end" fontSize="10" fill="var(--faint)">%{v}</text>
          </g>
        ))}
        {labels.map((l, i) => i % Math.max(1, Math.ceil(n / Math.max(2, Math.floor((W - 40) / 58)))) === 0 && (
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
        {actual.length > 0 && <circle cx={x(actual.length - 1)} cy={y(actual[actual.length - 1])} r="4" fill="var(--series-1)" stroke="var(--surface)" strokeWidth="2" />}
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
            <div className="text-[var(--muted)]">Sapma <b className="tnum" style={{ color: actual[hover] < plan[hover] ? 'var(--crit-ink)' : 'var(--ok-ink)' }}>
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
                <span className="ml-1 font-semibold" style={{ color: bad ? 'var(--crit-ink)' : 'var(--ok-ink)' }}>
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
    <div className="card px-3.5 py-3" title={help}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-[21px] font-bold leading-tight tnum" style={{ color: `var(--${tone}-ink)` }}>{tr(value, 2)}</span>
        <span className="text-[11.5px] text-[var(--muted)]">hedef ≥ {tr(good, 2)}</span>
      </div>
      <div className="relative mt-2 h-[6px] rounded-full bg-[var(--surface-3)]">
        <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(100, (value / 1.2) * 100)}%`, background: `var(--${tone})` }} />
        <span className="absolute -top-[3px] h-[12px] w-[2px] bg-[var(--ink)]" style={{ left: `${(good / 1.2) * 100}%` }} />
      </div>
    </div>
  )
}

/* ---------------- Çoklu çizgi ---------------- */

export interface LineSeries { label: string; color: string; values: (number | null)[]; dashed?: boolean; dotted?: boolean }

/**
 * Aynı eksende birden fazla kümülatif seri (plan · mevcut · recovery gibi). Üzerine gelince dikey çizgi ve değer kutusu.
 * Değerler 0–100 aralığındadır; seri boyu x eksenindeki nokta sayısıdır.
 */
export function MultiLine({ series, labels, height = 180, today, max = 100, format }: {
  series: LineSeries[]; labels: string[]; height?: number; today?: number
  /** Y ekseninin üst değeri — yüzde dışındaki değerler (tutar vb.) için */
  max?: number; format?: (v: number) => string
}) {
  const fv = format ?? ((v: number) => `%${tr(v, 1)}`)
  const [hover, setHover] = useState<number | null>(null)
  const [ref, W] = useWidth()
  const n = labels.length
  const H = height
  const pad = { l: format ? 52 : 34, r: 10, t: 8, b: 22 }
  const x = (i: number) => pad.l + (i / (n - 1)) * (W - pad.l - pad.r)
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b)
  /** Boşluklu seriler parça parça çizilir; her parça yumuşak eğridir */
  const path = (arr: (number | null)[]) => {
    const parts: [number, number][][] = [[]]
    arr.forEach((v, i) => (v == null ? parts.push([]) : parts[parts.length - 1].push([x(i), y(v)])))
    return parts.filter((p) => p.length).map(smoothPath).join(' ')
  }
  return (
    <div ref={ref} className="relative">
      <svg width={W} height={H} className="block" onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
          const i = Math.round((((e.clientX - r.left) / r.width) * W - pad.l) / (W - pad.l - pad.r) * (n - 1))
          setHover(Math.max(0, Math.min(n - 1, i)))
        }}>
        {[0, max / 2, max].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="var(--border)" />
            <text x={pad.l - 6} y={y(v) + 3} textAnchor="end" fontSize="10" fill="var(--faint)">{format ? format(v) : `%${v}`}</text>
          </g>
        ))}
        {labels.map((l, i) => i % Math.max(1, Math.ceil(n / Math.max(2, Math.floor((W - 40) / 58)))) === 0 && <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--faint)">{l}</text>)}
        {today != null && <line x1={x(today)} x2={x(today)} y1={pad.t} y2={H - pad.b} stroke="var(--border-strong)" strokeDasharray="2 3" />}
        {series.map((s) => (
          <path key={s.label} d={path(s.values)} fill="none" stroke={s.color} strokeWidth="2"
            strokeDasharray={s.dashed ? '5 4' : s.dotted ? '1.5 3' : undefined} strokeLinecap="round" />
        ))}
        {hover != null && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="var(--muted)" />}
        {hover != null && series.map((s) => s.values[hover] != null && (
          <circle key={s.label} cx={x(hover)} cy={y(s.values[hover]!)} r="3.5" fill={s.color} stroke="var(--surface)" strokeWidth="2" />
        ))}
      </svg>
      {hover != null && (
        <div className="pointer-events-none absolute top-0 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[11.5px] shadow-md"
          style={{ left: `calc(${(x(hover) / W) * 100}% + ${hover > n / 2 ? -150 : 10}px)` }}>
          <div className="font-semibold text-[var(--ink)]">{labels[hover]}</div>
          {series.map((s) => (
            <div key={s.label} className="text-[var(--muted)]">{s.label} <b className="text-[var(--ink)] tnum">{s.values[hover] != null ? fv(s.values[hover]!) : '—'}</b></div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------------- Halka (dağılım) ---------------- */

/** Az sayıda kategorinin paylarını gösteren halka; lejant ve yüzdeler yanında yazılıdır. */
export function Donut({ parts, size = 150, center }: { parts: { label: string; value: number; color: string }[]; size?: number; center?: ReactNode }) {
  const [hover, setHover] = useState<number | null>(null)
  const total = parts.reduce((a, p) => a + p.value, 0) || 1
  const r = size / 2 - 10
  const c = 2 * Math.PI * r
  let acc = 0
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          {parts.map((p, i) => {
            const len = (p.value / total) * c
            const el = (
              <circle key={p.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={p.color}
                strokeWidth={hover === i ? 20 : 16} strokeDasharray={`${Math.max(0, len - 2)} ${c - Math.max(0, len - 2)}`} strokeDashoffset={-acc}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
            )
            acc += len
            return el
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          {hover != null
            ? <div><div className="text-[18px] font-bold text-[var(--ink)] tnum">%{Math.round((parts[hover].value / total) * 100)}</div><div className="text-[10.5px] text-[var(--muted)]">{parts[hover].label}</div></div>
            : center}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {parts.map((p, i) => (
          <div key={p.label} className="flex items-center gap-2 text-[12px]" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} />
            <span className="text-[var(--ink)]">{p.label}</span>
            <span className="ml-2 text-[var(--muted)] tnum">%{Math.round((p.value / total) * 100)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------------- Zaman çizelgesi (Gantt) ---------------- */

export interface GanttRow {
  code: string
  name: string
  start: string
  finish: string
  progress?: number
  critical?: boolean
  /** Karşılaştırma için ikinci çubuk (ör. geçen haftanın planı, recovery planı) */
  ghost?: { start: string; finish: string }
}

const day = (iso: string) => new Date(iso).getTime() / 86_400_000

/**
 * Tarihe dayalı zaman çizelgesi. Çubuğun koyu kısmı gerçekleşen ilerlemedir; kırmızı çubuk kritik yoldadır.
 * `ghost` verilirse aynı satırda ince gri çubukla karşılaştırma (plan / önceki sürüm) gösterilir.
 */
/** Gantt'ın sol tablosundaki tarih sütunlarının toplam genişliği (başlangıç + bitiş + gün) */
export const GANTT_DATE_W = 64 + 64 + 40

const ganttDate = (iso: string) => {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y.slice(2)}`
}

export function Gantt({ rows, from, to, today, compact, labelW = 260, onRow }: {
  rows: GanttRow[]; from: string; to: string; today?: string; compact?: boolean
  /** Kod + aktivite sütunlarının genişliği; tarih sütunları (başlangıç, bitiş, gün) bunun sağına eklenir */
  labelW?: number
  onRow?: (r: GanttRow) => void
}) {
  const LW = labelW + GANTT_DATE_W
  const a = day(from)
  const b = day(to)
  const pos = (iso: string) => Math.max(0, Math.min(100, ((day(iso) - a) / (b - a)) * 100))
  const months: { label: string; left: number }[] = []
  const d = new Date(from); d.setDate(1)
  while (d.getTime() / 86_400_000 <= b) {
    if (d.getTime() / 86_400_000 >= a) months.push({ label: new Intl.DateTimeFormat('tr-TR', { month: 'short', year: '2-digit' }).format(d), left: pos(d.toISOString().slice(0, 10)) })
    d.setMonth(d.getMonth() + 1)
  }
  const step = Math.max(1, Math.ceil(months.length / 12))
  const rowH = compact ? 22 : 28
  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: 600 + GANTT_DATE_W }}>
        <div className="flex border-b border-[var(--border)] bg-[var(--surface-3)] text-[10px] text-[var(--muted)]">
          <div className="flex flex-shrink-0 items-center border-r border-[var(--border)] text-[10.5px] font-bold uppercase tracking-wide" style={{ width: LW }}>
            <span className="w-[64px] flex-shrink-0 px-3">Kod</span>
            <span className="min-w-0 flex-1">Aktivite</span>
            <span className="w-[64px] flex-shrink-0 text-center">Başlangıç</span>
            <span className="w-[64px] flex-shrink-0 text-center">Bitiş</span>
            <span className="w-[40px] flex-shrink-0 pr-2 text-right">Gün</span>
          </div>
          <div className="relative h-7 flex-1">
            {months.map((m, i) => i % step === 0 && (
              <span key={i} className="absolute top-1.5 -translate-x-1/2 whitespace-nowrap" style={{ left: `${m.left}%` }}>{m.label}</span>
            ))}
          </div>
        </div>
        {rows.map((r) => {
          const l = pos(r.start)
          const w = Math.max(0.6, pos(r.finish) - l)
          return (
            <div key={r.code} onClick={() => onRow?.(r)} className={`flex border-b border-[var(--border)] last:border-0 ${onRow ? 'cursor-pointer hover:bg-[var(--surface-2)]' : ''}`} style={{ height: rowH }}>
              <div className="flex flex-shrink-0 items-center border-r border-[var(--border)]" style={{ width: LW }}>
                <span className="mono w-[64px] flex-shrink-0 px-3 text-[10.5px] text-[var(--muted)]">{r.code}</span>
                <span className="min-w-0 flex-1 truncate pr-1 text-[12px] text-[var(--ink)]" title={r.name}>{r.name}</span>
                <span className="w-[64px] flex-shrink-0 text-center text-[10.5px] text-[var(--muted)] tnum">{ganttDate(r.start)}</span>
                <span className="w-[64px] flex-shrink-0 text-center text-[10.5px] text-[var(--muted)] tnum">{ganttDate(r.finish)}</span>
                <span className="w-[40px] flex-shrink-0 pr-2 text-right text-[10.5px] font-semibold text-[var(--ink)] tnum">{Math.round(day(r.finish) - day(r.start))}</span>
              </div>
              <div className="relative flex-1">
                {months.map((m, i) => <span key={i} className="absolute inset-y-0 w-px bg-[var(--border)] opacity-60" style={{ left: `${m.left}%` }} />)}
                {today && <span className="absolute inset-y-0 w-px" style={{ left: `${pos(today)}%`, background: 'var(--crit)', opacity: 0.5 }} />}
                {r.ghost && (
                  <span className="absolute h-[4px] rounded-full" title={`${r.ghost.start} → ${r.ghost.finish}`}
                    style={{ left: `${pos(r.ghost.start)}%`, width: `${Math.max(0.6, pos(r.ghost.finish) - pos(r.ghost.start))}%`, top: rowH - 7, background: 'var(--border-strong)' }} />
                )}
                <span className="absolute overflow-hidden rounded-[3px]" title={`${r.name} · ${r.start} → ${r.finish}${r.progress != null ? ` · %${r.progress}` : ''}`}
                  style={{ left: `${l}%`, width: `${w}%`, top: 5, height: rowH - 13, background: r.critical ? 'var(--crit)' : 'var(--series-1)', opacity: 0.35 }}>
                </span>
                {r.progress != null && r.progress > 0 && (
                  <span className="absolute rounded-l-[3px]" style={{ left: `${l}%`, width: `${(w * r.progress) / 100}%`, top: 5, height: rowH - 13, background: r.critical ? 'var(--crit)' : 'var(--series-1)' }} />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Küçük halka grafik: ortada toplam ya da başlık, altında lejant satırları (sayı ve yüzde).
 * Durum halkalarında renkler durum renkleridir (iyi / uyarı / kritik) ve her dilim etiketle birlikte gelir.
 */
export function Ring({ parts, size = 112, center, format = (v: number) => String(v) }: {
  parts: { label: string; value: number; color: string }[]; size?: number; center: ReactNode; format?: (v: number) => string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const total = parts.reduce((a, p) => a + p.value, 0) || 1
  const r = size / 2 - 9
  const c = 2 * Math.PI * r
  let acc = 0
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth="14" />
          {parts.map((p, i) => {
            const len = (p.value / total) * c
            const el = (
              <circle key={p.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={p.color}
                strokeWidth={hover === i ? 17 : 14} strokeDasharray={`${Math.max(0, len - 2)} ${c - Math.max(0, len - 2)}`} strokeDashoffset={-acc}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
            )
            acc += len
            return el
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          {hover != null
            ? <div><div className="text-[16px] font-bold text-[var(--ink)] tnum">%{Math.round((parts[hover].value / total) * 100)}</div><div className="px-2 text-[10px] leading-tight text-[var(--muted)]">{parts[hover].label}</div></div>
            : center}
        </div>
      </div>
      <div className="flex w-full flex-col gap-1">
        {parts.map((p, i) => (
          <div key={p.label} className="flex items-center gap-1.5 rounded px-1 text-[11.5px]" style={{ background: hover === i ? 'var(--surface-2)' : undefined }}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <span className="h-2.5 w-2.5 flex-shrink-0 rounded-sm" style={{ background: p.color }} />
            <span className="min-w-0 flex-1 truncate text-[var(--ink)]">{p.label}</span>
            <span className="text-[var(--muted)] tnum">{format(p.value)}</span>
            <span className="w-8 text-right font-semibold text-[var(--ink)] tnum">%{Math.round((p.value / total) * 100)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Histogram + çizgi: aylık gerçekleşen çubuk, aylık planlanan çizgi (kesikli). İkisi aynı ölçekte — tek eksen.
 */
export function HistoLine({ plan, actual, labels, format, height = 130 }: {
  plan: number[]; actual: (number | null)[]; labels: string[]; format: (v: number) => string; height?: number
}) {
  const [hover, setHover] = useState<number | null>(null)
  const [ref, W] = useWidth(240)
  const n = labels.length
  const H = height
  const pad = { l: 6, r: 6, t: 16, b: 18 }
  const max = Math.max(1, ...plan, ...actual.map((v) => v ?? 0)) * 1.08
  const bw = (W - pad.l - pad.r) / Math.max(1, n)
  const cx = (i: number) => pad.l + bw * (i + 0.5)
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b)
  const line = plan.map((v, i) => `${i ? 'L' : 'M'}${cx(i)},${y(v)}`).join(' ')
  const step = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(W / 56))))
  return (
    <div ref={ref} className="relative">
      <svg width={W} height={H} className="block" onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
          const i = Math.floor(((e.clientX - r.left) / r.width * W - pad.l) / bw)
          setHover(Math.max(0, Math.min(n - 1, i)))
        }}>
        <line x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} stroke="var(--border-strong)" />
        <line x1={pad.l} x2={W - pad.r} y1={y(max / 1.08)} y2={y(max / 1.08)} stroke="var(--border)" strokeDasharray="2 3" />
        <text x={pad.l} y={y(max / 1.08) - 4} fontSize="9.5" fill="var(--faint)">{format(max / 1.08)}</text>
        {actual.map((v, i) => v != null && v > 0 && (
          <rect key={i} x={cx(i) - Math.max(1.5, bw * 0.34)} width={Math.max(3, bw * 0.68)} y={y(v)} height={Math.max(0, H - pad.b - y(v))}
            rx={Math.min(3, bw * 0.3)} fill="var(--series-1)" opacity={hover == null || hover === i ? 1 : 0.55} />
        ))}
        <path d={line} fill="none" stroke="var(--series-2)" strokeWidth="2" strokeDasharray="4 3" strokeLinejoin="round" />
        {labels.map((l, i) => i % step === 0 && <text key={i} x={i === 0 ? pad.l : cx(i)} y={H - 5} textAnchor={i === 0 ? 'start' : 'middle'} fontSize="9.5" fill="var(--faint)">{l}</text>)}
        {hover != null && <circle cx={cx(hover)} cy={y(plan[hover])} r="3.5" fill="var(--series-2)" stroke="var(--surface)" strokeWidth="2" />}
      </svg>
      {hover != null && (
        <div className="pointer-events-none absolute top-0 z-10 whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[11px] shadow-md"
          style={{ left: hover > n / 2 ? undefined : `${(cx(hover) / W) * 100}%`, right: hover > n / 2 ? `${100 - (cx(hover) / W) * 100}%` : undefined }}>
          <div className="font-semibold text-[var(--ink)]">{labels[hover]}</div>
          <div className="text-[var(--muted)]">Planlanan <b className="text-[var(--ink)] tnum">{format(plan[hover])}</b></div>
          <div className="text-[var(--muted)]">Gerçekleşen <b className="text-[var(--ink)] tnum">{actual[hover] != null ? format(actual[hover]!) : '—'}</b></div>
        </div>
      )}
    </div>
  )
}

/**
 * Çubuk + kümülatif çizgi. Çubuklar aylık değerler (sol eksen), çizgiler kümülatif toplam (sağ eksen).
 * Kümülatif değer aylıkların çok üstünde olduğu için iki ayrı cetvel kullanılır; her eksen kendi rengindeki
 * seriyle etiketlenir ki hangi cetvelin hangi seriye ait olduğu karışmasın.
 */
export function ComboChart({ labels, bars, lines, format, lineFormat, lineMax, height = 260 }: {
  labels: string[]
  bars: { label: string; color: string; values: number[] }[]
  lines: { label: string; color: string; values: number[]; dashed?: boolean }[]
  format: (v: number) => string
  /** Sağ eksen (çizgiler) için ayrı biçim — ör. kümülatif yüzde */
  lineFormat?: (v: number) => string
  /** Sağ eksenin üst değeri sabitse (ör. %100) */
  lineMax?: number
  height?: number
}) {
  const lf = lineFormat ?? format
  const [hover, setHover] = useState<number | null>(null)
  const [ref, W] = useWidth()
  const n = labels.length
  const H = height
  const pad = { l: 50, r: 64, t: 26, b: 24 }
  const nice = (v: number) => { const p = 10 ** Math.floor(Math.log10(v || 1)); return Math.ceil(v / p / 0.5) * 0.5 * p }
  const maxBar = nice(Math.max(1, ...bars.flatMap((b) => b.values)) * 1.05)
  const maxLine = lineMax ?? nice(Math.max(1, ...lines.flatMap((l) => l.values)) * 1.02)
  const slot = (W - pad.l - pad.r) / n
  const cx = (i: number) => pad.l + slot * (i + 0.5)
  const yb = (v: number) => pad.t + (1 - v / maxBar) * (H - pad.t - pad.b)
  const yl = (v: number) => pad.t + (1 - v / maxLine) * (H - pad.t - pad.b)
  const bw = Math.max(2, Math.min(14, (slot - 4) / bars.length))
  const step = Math.max(1, Math.ceil(n / Math.max(2, Math.floor((W - 100) / 52))))
  return (
    <div ref={ref} className="relative">
      <svg width={W} height={H} className="block" onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
          const i = Math.floor((((e.clientX - r.left) / r.width) * W - pad.l) / slot)
          setHover(i >= 0 && i < n ? i : null)
        }}>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={pad.l} x2={W - pad.r} y1={yb(maxBar * f)} y2={yb(maxBar * f)} stroke="var(--border)" />
            <text x={pad.l - 6} y={yb(maxBar * f) + 3} textAnchor="end" fontSize="10" fill="var(--faint)">{format(maxBar * f)}</text>
            <text x={W - pad.r + 6} y={yl(maxLine * f) + 3} textAnchor="start" fontSize="10" fill="var(--faint)">{lf(maxLine * f)}</text>
          </g>
        ))}
        <text x={pad.l - 6} y={9} textAnchor="end" fontSize="9.5" fontWeight="600" fill="var(--muted)">aylık ▮</text>
        <text x={W - pad.r + 6} y={9} textAnchor="start" fontSize="9.5" fontWeight="600" fill="var(--muted)">— kümülatif</text>
        {hover != null && <rect x={pad.l + hover * slot} y={pad.t} width={slot} height={H - pad.t - pad.b} fill="var(--surface-2)" />}
        {labels.map((_, i) => bars.map((b, j) => {
          const v = b.values[i] ?? 0
          const x = cx(i) - (bw * bars.length) / 2 + j * bw
          return v > 0 && <rect key={`${i}-${j}`} x={x + 0.5} width={bw - 1} y={yb(v)} height={H - pad.b - yb(v)} rx={Math.min(2.5, bw / 3)} fill={b.color} />
        }))}
        {lines.map((l) => (
          <path key={l.label} d={smoothPath(l.values.map((v, i) => [cx(i), yl(v)]))} fill="none" stroke={l.color} strokeWidth="2.25"
            strokeDasharray={l.dashed ? '5 4' : undefined} strokeLinejoin="round" />
        ))}
        {hover != null && lines.map((l) => <circle key={l.label} cx={cx(hover)} cy={yl(l.values[hover])} r="3.5" fill={l.color} stroke="var(--surface)" strokeWidth="2" />)}
        {labels.map((l, i) => i % step === 0 && <text key={i} x={cx(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--faint)">{l}</text>)}
      </svg>
      {hover != null && (
        <div className="pointer-events-none absolute top-0 z-10 whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[11.5px] shadow-md"
          style={hover > n / 2 ? { right: `${100 - ((pad.l + hover * slot) / W) * 100}%` } : { left: `${((pad.l + (hover + 1) * slot) / W) * 100}%` }}>
          <div className="font-semibold text-[var(--ink)]">{labels[hover]}</div>
          {bars.map((b) => <div key={b.label} className="text-[var(--muted)]">{b.label} <b className="text-[var(--ink)] tnum">{format(b.values[hover] ?? 0)}</b></div>)}
          {lines.map((l) => <div key={l.label} className="text-[var(--muted)]">{l.label} <b className="text-[var(--ink)] tnum">{format(l.values[hover])}</b></div>)}
        </div>
      )}
    </div>
  )
}

/**
 * Pasta grafik: dilimler toplamın payı kadar; yanında lejant (etiket, değer, yüzde).
 * Üzerine gelinen dilim hafifçe dışarı çıkar ve ortadaki değer kutusu güncellenir.
 */
export function Pie({ parts, size = 140, format = (v: number) => tr(v, 0) }: {
  parts: { label: string; value: number; color: string }[]; size?: number; format?: (v: number) => string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const total = parts.reduce((a, p) => a + p.value, 0) || 1
  const r = size / 2 - 6
  const cx = size / 2
  let a0 = -Math.PI / 2
  const slices = parts.map((p, i) => {
    const ang = (p.value / total) * Math.PI * 2
    const a1 = a0 + ang
    const mid = (a0 + a1) / 2
    const off = hover === i ? 5 : 0
    const ox = Math.cos(mid) * off, oy = Math.sin(mid) * off
    const large = ang > Math.PI ? 1 : 0
    const d = parts.length === 1
      ? `M ${cx} ${cx - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cx - r} Z`
      : `M ${cx + ox} ${cx + oy} L ${cx + ox + r * Math.cos(a0)} ${cx + oy + r * Math.sin(a0)} A ${r} ${r} 0 ${large} 1 ${cx + ox + r * Math.cos(a1)} ${cx + oy + r * Math.sin(a1)} Z`
    a0 = a1
    return <path key={p.label} d={d} fill={p.color} stroke="var(--surface)" strokeWidth="1.5"
      onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ transition: 'all 150ms ease-out' }} />
  })
  return (
    <div className="flex flex-wrap items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">{slices}</svg>
      <div className="flex min-w-[140px] flex-1 flex-col gap-2">
        {parts.map((p, i) => (
          <div key={p.label} className="flex items-center gap-2 rounded-md px-1 text-[12px]" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
            style={hover === i ? { background: 'var(--surface-2)' } : undefined}>
            <span className="h-2.5 w-2.5 flex-shrink-0 rounded-sm" style={{ background: p.color }} />
            <span className="min-w-0 flex-1 truncate text-[var(--ink)]">{p.label}</span>
            <span className="text-[var(--muted)] tnum">{format(p.value)}</span>
            <span className="w-9 text-right font-semibold text-[var(--ink)] tnum">%{Math.round((p.value / total) * 100)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Pasta grafikler için sabit sıra renkleri */
export const PIE_COLORS = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)', 'var(--series-5)', 'var(--border-strong)']
