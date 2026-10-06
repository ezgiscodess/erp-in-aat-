import { useState } from 'react'
import { Badge, Btn, Card, Kpi, PageHead } from '../../components/ui'
import { moneyShort, num } from '../../lib/format'
import { Donut, Legend } from '../charts'
import { prj } from '../data'
import { KontratAnaliz } from '../../screens/KontratAnaliz'

/**
 * Risk modülü: saha ve yönetim riskleri tek listede (Dashboard) + kontrat riskleri.
 * Dashboard dört görünümden oluşur: olasılık × etki matrisi, risk etki haritası,
 * şiddet × sıklık dağılımı ve tiplere göre ayrım.
 */

type RiskType = 'İşveren' | 'Tasarım' | 'Tedarik' | 'Kaynak' | 'Hava' | 'Kurum'
type Origin = 'Saha' | 'Yönetim'

interface Impact { activity: string; cost: number; mh: number; days: number }

interface ProjectRisk {
  id: string
  title: string
  type: RiskType
  origin: Origin
  /** Olasılık ve etki (1–5) */
  p: number
  i: number
  /** Yılda kaç kez gerçekleşmesi beklenir (sıklık) */
  freq: number
  owner: string
  /** Riskin tetiklediği işler ve her birinin maliyet, inxsa ve program etkisi */
  impacts: Impact[]
}

const RISKS: ProjectRisk[] = [
  { id: 'R-01', title: 'İşverenin Parsel B yer teslimini geciktirmesi', type: 'İşveren', origin: 'Yönetim', p: 4, i: 5, freq: 2, owner: 'h.demir',
    impacts: [
      { activity: 'Temel betonu dökümü aksar', cost: 180_000, mh: 4_200, days: 14 },
      { activity: 'Kalıp ve iskele ekibi bekler', cost: 95_000, mh: 3_100, days: 0 },
      { activity: 'Çelik montaj başlangıcı kayar', cost: 60_000, mh: 900, days: 7 },
    ] },
  { id: 'R-02', title: 'Depo C çatı makası tasarım revizyonu', type: 'Tasarım', origin: 'Yönetim', p: 4, i: 4, freq: 1.5, owner: 'b.yildiz',
    impacts: [
      { activity: 'Makas imalatı yeniden yapılır', cost: 150_000, mh: 2_600, days: 10 },
      { activity: 'Çatı paneli montajı kayar', cost: 90_000, mh: 1_200, days: 8 },
    ] },
  { id: 'R-03', title: 'Elektrik bağlantı izninin gecikmesi', type: 'Kurum', origin: 'Yönetim', p: 4, i: 4, freq: 1, owner: 'o.kara',
    impacts: [
      { activity: 'Yangın testleri kalıcı enerjiyle yapılamaz', cost: 70_000, mh: 800, days: 12 },
      { activity: 'Jeneratör kira ve yakıtı', cost: 70_000, mh: 300, days: 0 },
    ] },
  { id: 'R-04', title: 'Çelik profil tedarik gecikmesi', type: 'Tedarik', origin: 'Saha', p: 3, i: 4, freq: 3, owner: 'k.aslan',
    impacts: [
      { activity: 'Montaj ekibi bekler', cost: 55_000, mh: 1_800, days: 5 },
      { activity: 'Vinç kirası uzar', cost: 30_000, mh: 0, days: 4 },
    ] },
  { id: 'R-05', title: 'Duvar ekibinde verim kaybı', type: 'Kaynak', origin: 'Saha', p: 4, i: 3, freq: 12, owner: 'b.yildiz',
    impacts: [{ activity: 'Tuğla bölme duvar', cost: 95_000, mh: 5_500, days: 0 }] },
  { id: 'R-06', title: 'Kasım rüzgârında çatı montajının durması', type: 'Hava', origin: 'Saha', p: 4, i: 3, freq: 6, owner: 'm.aydin',
    impacts: [
      { activity: 'Çatı paneli montajı durur', cost: 40_000, mh: 1_100, days: 6 },
      { activity: 'Vinç boşta bekler', cost: 20_000, mh: 0, days: 0 },
    ] },
  { id: 'R-07', title: 'Tek mobil vincin iki kritik işte çakışması', type: 'Kaynak', origin: 'Saha', p: 3, i: 3, freq: 4, owner: 'm.aydin',
    impacts: [{ activity: 'Makas ve panel montajı sıraya girer', cost: 35_000, mh: 700, days: 4 }] },
  { id: 'R-08', title: 'Taşeron kontrat farkları (metraj ve birim fiyat)', type: 'Tedarik', origin: 'Yönetim', p: 3, i: 4, freq: 2, owner: 'h.demir',
    impacts: [{ activity: 'Tuğla ve çelik hakedişleri', cost: 240_000, mh: 0, days: 0 }] },
  { id: 'R-09', title: 'Yoğun yağışta saha işlerinin durması', type: 'Hava', origin: 'Saha', p: 2, i: 2, freq: 8, owner: 'm.aydin',
    impacts: [{ activity: 'Saha asfaltı ve dolgu', cost: 25_000, mh: 600, days: 3 }] },
  { id: 'R-10', title: 'İşveren onaylarının (malzeme, çizim) gecikmesi', type: 'İşveren', origin: 'Yönetim', p: 3, i: 2, freq: 10, owner: 's.kaya',
    impacts: [{ activity: 'İmalat çizimleri bekler', cost: 20_000, mh: 400, days: 2 }] },
  { id: 'R-11', title: 'Test ekipmanının zamanında gelmemesi', type: 'Tedarik', origin: 'Saha', p: 2, i: 3, freq: 1, owner: 'o.kara',
    impacts: [{ activity: 'Hidrostatik testler kayar', cost: 12_000, mh: 200, days: 4 }] },
  { id: 'R-12', title: 'Kalıp ekibinde iş kazası sonrası duruş', type: 'Kaynak', origin: 'Saha', p: 1, i: 4, freq: 0.3, owner: 'isg.uzman',
    impacts: [{ activity: 'Bölgesel iş durması', cost: 60_000, mh: 1_500, days: 3 }] },
]

const TYPES: RiskType[] = ['İşveren', 'Tasarım', 'Tedarik', 'Kaynak', 'Hava', 'Kurum']
const TYPE_COLOR: Record<RiskType, string> = {
  İşveren: 'var(--series-1)', Tasarım: 'var(--series-2)', Tedarik: 'var(--series-3)', Kaynak: 'var(--series-4)', Hava: 'var(--series-5)', Kurum: '#667085',
}
const ORIGIN_COLOR: Record<Origin, string> = { Saha: 'var(--series-1)', Yönetim: 'var(--series-2)' }

const total = (r: ProjectRisk) => ({
  cost: r.impacts.reduce((a, x) => a + x.cost, 0),
  mh: r.impacts.reduce((a, x) => a + x.mh, 0),
  days: r.impacts.reduce((a, x) => a + x.days, 0),
})
/** Olasılık 1–5 → %10 … %90 */
const prob = (p: number) => [0, 0.1, 0.3, 0.5, 0.7, 0.9][p]

/** Isı matrisi hücresi: puana göre düşük / orta / yüksek / çok yüksek */
function level(score: number) {
  if (score >= 15) return { label: 'Çok yüksek', bg: '#F4C7C3', fg: 'var(--crit)' }
  if (score >= 10) return { label: 'Yüksek', bg: '#FAD9B5', fg: 'var(--warn)' }
  if (score >= 5) return { label: 'Orta', bg: '#FCEFB4', fg: '#8A6100' }
  return { label: 'Düşük', bg: '#D5EEDC', fg: 'var(--ok)' }
}

const eur = (v: number) => moneyShort(v, prj.currency)

export function RiskDashboard() {
  const ranked = [...RISKS].sort((a, b) => b.p * b.i - a.p * a.i || total(b).cost - total(a).cost)
  const [selId, setSelId] = useState(ranked[0].id)
  const sel = RISKS.find((r) => r.id === selId)!
  const sum = RISKS.reduce((a, r) => { const t = total(r); return { cost: a.cost + t.cost, mh: a.mh + t.mh, days: a.days + t.days } }, { cost: 0, mh: 0, days: 0 })
  const expected = RISKS.reduce((a, r) => a + total(r).cost * prob(r.p), 0)

  return (
    <>
      <PageHead title="Risk · Dashboard"
        note="Saha ve yönetim riskleri tek listede. Riskler sahadan ve alt modüllerden (Disruptions, Planning, Procurement) gelen veriyle güncellenir; her riskin tetiklediği işler ve bunların maliyet, inxsa ve iş programı etkisi hesaplanır." />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi label="Toplam risk" value={RISKS.length} sub={`${RISKS.filter((r) => r.origin === 'Saha').length} saha · ${RISKS.filter((r) => r.origin === 'Yönetim').length} yönetim`} />
        <Kpi label="Çok yüksek" value={RISKS.filter((r) => r.p * r.i >= 15).length} sub="Olasılık × etki ≥ 15" tone="crit" />
        <Kpi label="Maliyet etkisi" value={eur(sum.cost)} sub={`Beklenen ${eur(expected)}`} tone="warn"
          help="Bütün riskler gerçekleşirse toplam maliyet; beklenen değer olasılıkla ağırlıklıdır." />
        <Kpi label="inxsa etkisi" value={`${num(sum.mh)} sa`} sub="Kayıp insan-saat" />
        <Kpi label="Süre etkisi" value={`${sum.days} gün`} sub="Kritik yolda olmayanlar dâhil" tone="warn" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <Card title="Olasılık × etki matrisi" help="Her hücrede o olasılık ve etkideki riskler. Renk puana göre: yeşil düşük, sarı orta, turuncu yüksek, kırmızı çok yüksek. Riske tıklayınca etki haritası o riske geçer.">
            <HeatMatrix onPick={setSelId} sel={selId} />
          </Card>
        </div>
        <div className="xl:col-span-7">
          <Card title="Şiddet × sıklık" help="Yatay eksen yılda kaç kez gerçekleşmesinin beklendiği, dikey eksen tek seferde maliyet etkisi; iki eksen de logaritmik. Sağ üst köşe hem sık hem pahalı risklerdir."
            right={<Legend items={[{ label: 'Saha', color: ORIGIN_COLOR.Saha }, { label: 'Yönetim', color: ORIGIN_COLOR.Yönetim }]} />}>
            <Scatter onPick={setSelId} sel={selId} />
          </Card>
        </div>
      </div>

      <Card title="Risk etki haritası" help="Riskler olasılık × etki puanına göre sıralanır. Seçilen riskin tetiklediği işler ve her birinin maliyet, inxsa ve iş programı etkisi. Örneğin işverenin yer teslim edememesi beton dökümünü aksatır; bu da maliyet, inxsa kaybı ve gecikme doğurur.">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="flex flex-col gap-1 xl:col-span-4">
            {ranked.map((r, k) => {
              const lv = level(r.p * r.i)
              return (
                <button key={r.id} onClick={() => setSelId(r.id)}
                  className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-left transition-colors"
                  style={r.id === selId ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)' } : { borderColor: 'var(--border)' }}>
                  <span className="w-4 text-[11px] font-bold text-[var(--faint)] tnum">{k + 1}</span>
                  <span className="grid h-6 w-7 flex-shrink-0 place-items-center rounded text-[11.5px] font-bold tnum" style={{ background: lv.bg, color: lv.fg }}>{r.p * r.i}</span>
                  <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--ink)]">{r.title}</span>
                  <span className="text-[11px] text-[var(--muted)] tnum">{eur(total(r).cost)}</span>
                </button>
              )
            })}
          </div>
          <div className="xl:col-span-8">
            <ImpactMap risk={sel} />
          </div>
        </div>
      </Card>

      <Card title="Risk tipleri" help="Riskler tiplerine göre ayrılır. Halkada her tipin maliyet etkisindeki payı; kartlarda o tipteki riskler.">
        <TypeView onPick={setSelId} />
      </Card>
    </>
  )
}

function HeatMatrix({ onPick, sel }: { onPick: (id: string) => void; sel: string }) {
  const labels = ['Çok düşük', 'Düşük', 'Orta', 'Yüksek', 'Çok yüksek']
  return (
    <div className="flex gap-2">
      <div className="flex w-5 items-center justify-center">
        <span className="-rotate-90 whitespace-nowrap text-[10.5px] font-semibold uppercase tracking-wide text-[var(--faint)]">Olasılık →</span>
      </div>
      <div className="flex-1">
        <div className="grid gap-[3px]" style={{ gridTemplateColumns: '64px repeat(5, 1fr)' }}>
          {[5, 4, 3, 2, 1].map((p) => <MatrixRow key={p} p={p} label={labels[p - 1]} onPick={onPick} sel={sel} />)}
          <span />
          {labels.map((l, k) => <span key={l} className="pt-1 text-center text-[10px] text-[var(--muted)]">{k + 1}<br />{l}</span>)}
        </div>
        <div className="mt-1 text-center text-[10.5px] font-semibold uppercase tracking-wide text-[var(--faint)]">Etki →</div>
      </div>
    </div>
  )
}

function MatrixRow({ p, label, onPick, sel }: { p: number; label: string; onPick: (id: string) => void; sel: string }) {
  return (
    <>
      <span className="flex items-center justify-end pr-1.5 text-right text-[10px] leading-tight text-[var(--muted)]">{p} · {label}</span>
      {[1, 2, 3, 4, 5].map((i) => {
        const lv = level(p * i)
        const here = RISKS.filter((r) => r.p === p && r.i === i)
        return (
          <div key={i} className="flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-[4px] p-1" style={{ background: lv.bg }}
            title={`${lv.label} · puan ${p * i}${here.length ? `\n${here.map((r) => `${r.id} ${r.title}`).join('\n')}` : ''}`}>
            <span className="text-[10px] font-semibold tnum" style={{ color: lv.fg, opacity: 0.7 }}>{p * i}</span>
            <span className="flex flex-wrap justify-center gap-0.5">
              {here.map((r) => (
                <button key={r.id} onClick={() => onPick(r.id)} className="mono rounded bg-white px-1 text-[9.5px] font-semibold"
                  style={{ color: lv.fg, outline: r.id === sel ? '2px solid var(--accent)' : undefined }}>{r.id.slice(2)}</button>
              ))}
            </span>
          </div>
        )
      })}
    </>
  )
}

/** Log-log dağılım: sıklık (yıllık) × tek seferlik maliyet */
function Scatter({ onPick, sel }: { onPick: (id: string) => void; sel: string }) {
  const [hover, setHover] = useState<string | null>(null)
  const W = 640, H = 300, pad = { l: 58, r: 16, t: 12, b: 36 }
  const fx = [0.2, 20], fy = [1_000, 500_000]
  const x = (v: number) => pad.l + (Math.log10(v / fx[0]) / Math.log10(fx[1] / fx[0])) * (W - pad.l - pad.r)
  const y = (v: number) => pad.t + (1 - Math.log10(v / fy[0]) / Math.log10(fy[1] / fy[0])) * (H - pad.t - pad.b)
  const pts = RISKS.map((r) => {
    const cost = total(r).cost / Math.max(1, r.freq)
    return { r, cost, cx: x(r.freq), cy: y(Math.min(fy[1], Math.max(fy[0], cost))) }
  })
  const h = pts.find((d) => d.r.id === hover)
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full">
        <rect x={(W + pad.l - pad.r) / 2} y={pad.t} width={(W - pad.l - pad.r) / 2} height={(H - pad.t - pad.b) / 2} fill="var(--crit-bg)" opacity="0.6" />
        <text x={W - pad.r - 6} y={pad.t + 14} textAnchor="end" fontSize="10.5" fill="var(--crit)">sık ve pahalı</text>
        {[0.2, 0.5, 1, 2, 5, 10, 20].map((v) => (
          <g key={v}>
            <line x1={x(v)} x2={x(v)} y1={pad.t} y2={H - pad.b} stroke="var(--border)" />
            <text x={x(v)} y={H - pad.b + 14} textAnchor="middle" fontSize="10" fill="var(--faint)">{v.toLocaleString('tr-TR')}</text>
          </g>
        ))}
        {[1_000, 2_500, 10_000, 25_000, 100_000, 250_000, 500_000].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="var(--border)" />
            <text x={pad.l - 6} y={y(v) + 3} textAnchor="end" fontSize="10" fill="var(--faint)">{(v / 1000).toLocaleString('tr-TR')} B</text>
          </g>
        ))}
        <text x={(W + pad.l) / 2} y={H - 4} textAnchor="middle" fontSize="10.5" fill="var(--muted)">Sıklık (yılda kaç kez)</text>
        <text x={12} y={(H - pad.b) / 2} textAnchor="middle" fontSize="10.5" fill="var(--muted)" transform={`rotate(-90 12 ${(H - pad.b) / 2})`}>Şiddet (tek sefer, EUR)</text>
        {pts.map((d) => (
          <g key={d.r.id} className="cursor-pointer" onMouseEnter={() => setHover(d.r.id)} onMouseLeave={() => setHover(null)} onClick={() => onPick(d.r.id)}>
            <circle cx={d.cx} cy={d.cy} r="14" fill="transparent" />
            <circle cx={d.cx} cy={d.cy} r={d.r.id === sel ? 7 : 5.5} fill={ORIGIN_COLOR[d.r.origin]} stroke={d.r.id === sel ? 'var(--ink)' : 'var(--surface)'} strokeWidth="2" />
            <text x={d.cx + 9} y={d.cy + 3.5} fontSize="10" fill="var(--muted)">{d.r.id}</text>
          </g>
        ))}
      </svg>
      {h && (
        <div className="pointer-events-none absolute rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[11.5px] shadow-md"
          style={{ left: `${(h.cx / W) * 100}%`, top: `${(h.cy / H) * 100}%`, transform: `translate(${h.cx > W / 2 ? '-105%' : '12px'}, -50%)` }}>
          <div className="font-semibold text-[var(--ink)]">{h.r.id} · {h.r.title}</div>
          <div className="text-[var(--muted)]">Yılda {h.r.freq.toLocaleString('tr-TR')} kez · tek sefer {eur(h.cost)}</div>
          <div className="text-[var(--muted)]">{h.r.origin} · {h.r.type}</div>
        </div>
      )}
    </div>
  )
}

/** Risk → tetiklediği işler → maliyet / inxsa / program etkisi */
function ImpactMap({ risk }: { risk: ProjectRisk }) {
  const t = total(risk)
  const lv = level(risk.p * risk.i)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-stretch gap-3">
        <div className="flex w-[210px] flex-shrink-0 flex-col justify-center rounded-lg border-2 px-3 py-2.5" style={{ borderColor: lv.fg, background: lv.bg }}>
          <span className="mono text-[10.5px] font-semibold" style={{ color: lv.fg }}>{risk.id} · puan {risk.p * risk.i}</span>
          <span className="mt-0.5 text-[13px] font-bold leading-snug text-[var(--ink)]">{risk.title}</span>
          <span className="mt-1 text-[11px] text-[var(--muted)]">{risk.type} · {risk.origin} · {risk.owner}</span>
        </div>
        <div className="flex flex-1 flex-col justify-center gap-2 border-l-2 border-[var(--border-strong)] pl-3">
          {risk.impacts.map((x) => (
            <div key={x.activity} className="flex items-center gap-2">
              <span className="-ml-3 h-[2px] w-3 flex-shrink-0 bg-[var(--border-strong)]" />
              <span className="w-[200px] flex-shrink-0 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--ink)]">{x.activity}</span>
              <span className="text-[var(--faint)]">→</span>
              <span className="grid flex-1 grid-cols-3 gap-1.5">
                <Chip label="Maliyet" value={x.cost ? `+${eur(x.cost)}` : '—'} tone={x.cost ? 'crit' : undefined} />
                <Chip label="inxsa" value={x.mh ? `+${num(x.mh)} sa` : '—'} tone={x.mh ? 'warn' : undefined} />
                <Chip label="Program" value={x.days ? `+${x.days} gün` : '—'} tone={x.days ? 'crit' : undefined} />
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 rounded-md bg-[var(--surface-2)] px-3 py-2 text-[12px]">
        <span className="font-semibold text-[var(--ink)]">Toplam etki</span>
        <Badge tone="crit">{eur(t.cost)}</Badge>
        <Badge tone="warn">{num(t.mh)} sa inxsa</Badge>
        <Badge tone="crit">{t.days} gün</Badge>
        <span className="ml-auto text-[var(--muted)]">Beklenen (olasılık %{Math.round(prob(risk.p) * 100)}): <b className="text-[var(--ink)]">{eur(t.cost * prob(risk.p))}</b></span>
      </div>
    </div>
  )
}

function Chip({ label, value, tone }: { label: string; value: string; tone?: 'crit' | 'warn' }) {
  return (
    <span className="rounded-md border px-2 py-1" style={{ borderColor: tone ? `var(--${tone})` : 'var(--border)', background: tone ? `var(--${tone}-bg)` : 'var(--surface)' }}>
      <span className="block text-[9.5px] font-semibold uppercase tracking-wide text-[var(--faint)]">{label}</span>
      <span className="block text-[12px] font-bold tnum" style={{ color: tone ? `var(--${tone})` : 'var(--faint)' }}>{value}</span>
    </span>
  )
}

function TypeView({ onPick }: { onPick: (id: string) => void }) {
  const parts = TYPES.map((t) => ({ label: t, value: RISKS.filter((r) => r.type === t).reduce((a, r) => a + total(r).cost, 0), color: TYPE_COLOR[t] }))
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <div className="flex items-center justify-center xl:col-span-4">
        <Donut size={200} parts={parts} center={<div><div className="text-[18px] font-bold text-[var(--ink)]">{RISKS.length}</div><div className="text-[10.5px] text-[var(--muted)]">risk · {TYPES.length} tip</div></div>} />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:col-span-8 xl:grid-cols-3">
        {TYPES.map((t) => {
          const list = RISKS.filter((r) => r.type === t)
          return (
            <div key={t} className="rounded-lg border border-[var(--border)] border-t-[3px] bg-[var(--surface)] px-3 py-2" style={{ borderTopColor: TYPE_COLOR[t] }}>
              <div className="flex items-center gap-2">
                <span className="text-[12.5px] font-bold text-[var(--ink)]">{t}</span>
                <span className="ml-auto text-[11px] text-[var(--muted)] tnum">{list.length} risk · {eur(list.reduce((a, r) => a + total(r).cost, 0))}</span>
              </div>
              <ul className="mt-1.5 flex flex-col gap-0.5">
                {list.map((r) => (
                  <li key={r.id}>
                    <button onClick={() => onPick(r.id)} className="flex w-full items-center gap-1.5 text-left text-[11.5px] text-[var(--muted)] hover:text-[var(--accent)]">
                      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: level(r.p * r.i).fg }} />
                      <span className="truncate">{r.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Kontrat riskleri. Proje ihaleden geldiyse riskler ihale aşamasındaki Kontrat Analiz'den aktarılır;
 * proje doğrudan başlatıldıysa sözleşme yüklenip analiz edilerek oluşur.
 */
export function ContractRisks() {
  const [origin, setOrigin] = useState<'ihale' | 'kontrat'>('ihale')
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[12.5px]">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Kaynak</span>
        {([['ihale', 'İhaleden aktarıldı'], ['kontrat', 'Kontrattan analiz']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setOrigin(k)} className="rounded-full border px-2.5 py-0.5 text-[12px]"
            style={origin === k ? { background: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--accent)' } : { borderColor: 'var(--border)', color: 'var(--muted)' }}>{l}</button>
        ))}
        <span className="text-[var(--muted)]">
          {origin === 'ihale'
            ? 'Bu proje ihale modülünden geldi: riskler ihale aşamasındaki Kontrat Analiz’den aktarıldı; proje dönemindeki değişiklikler buraya işlenir.'
            : 'Proje doğrudan başlatıldığında imzalı sözleşme yüklenir; AI maddeleri tarayıp kontrat risklerini aynı yapıda çıkarır.'}
        </span>
        {origin === 'kontrat' && <span className="ml-auto"><Btn small primary>Sözleşme yükle ve analiz et</Btn></span>}
      </div>
      <KontratAnaliz writable role="Teknik Kullanıcı" title="Risk · Contract Risks" />
    </>
  )
}
