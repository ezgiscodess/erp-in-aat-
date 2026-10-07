import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Badge, Btn, Card, ExportButtons, Field, Modal, PageHead, Table, Td, Th } from '../../components/ui'
import { money, moneyShort, num } from '../../lib/format'
import { Legend, smoothPath, useWidth } from '../charts'
import { prj } from '../data'

/**
 * Finance ve Accounting dashboard'ları — şablon ekranlar. Veriler örnektir; gerçek sistemde muhasebe
 * entegrasyonundan (fatura, banka, cari) beslenir. Grafikler değer etiketli, üzerine gelince ayrıntı verir.
 */

const C = prj.currency
const m = (v: number) => moneyShort(v, C)
const MONTHS6 = ['Nis 26', 'May 26', 'Haz 26', 'Tem 26', 'Ağu 26', 'Eyl 26']

/* ---------------- Ortak küçük grafikler ---------------- */

/** Değer etiketli gruplu sütun grafik */
function ValueBars({ labels, series, format, height = 260 }: {
  labels: string[]; series: { label: string; color: string; values: number[] }[]; format: (v: number) => string; height?: number
}) {
  const [ref, W] = useWidth()
  const [hover, setHover] = useState<number | null>(null)
  const pad = { l: 52, r: 12, t: 22, b: 26 }
  const max = Math.max(1, ...series.flatMap((s) => s.values)) * 1.15
  const slot = (W - pad.l - pad.r) / labels.length
  const bw = Math.min(46, (slot * 0.7) / series.length)
  const y = (v: number) => pad.t + (1 - v / max) * (height - pad.t - pad.b)
  return (
    <div ref={ref}>
      <svg width={W} height={height} className="block" onMouseLeave={() => setHover(null)}>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={pad.l} x2={W - pad.r} y1={y(max * f)} y2={y(max * f)} stroke="var(--border)" />
            <text x={pad.l - 6} y={y(max * f) + 3} textAnchor="end" fontSize="10" fill="var(--faint)">{format(max * f)}</text>
          </g>
        ))}
        {labels.map((l, i) => {
          const cx = pad.l + slot * (i + 0.5)
          return (
            <g key={l} onMouseEnter={() => setHover(i)}>
              <rect x={pad.l + slot * i} y={pad.t} width={slot} height={height - pad.t - pad.b} fill={hover === i ? 'var(--surface-2)' : 'transparent'} />
              {series.map((s, j) => {
                const x = cx - (bw * series.length) / 2 + j * bw
                const v = s.values[i]
                return (
                  <g key={s.label}>
                    <rect className="grow-bar" x={x + 2} width={bw - 4} y={y(v)} height={height - pad.b - y(v)} rx={3} fill={s.color} />
                    <text x={x + bw / 2} y={y(v) - 5} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--ink)">{format(v)}</text>
                  </g>
                )
              })}
              <text x={cx} y={height - 8} textAnchor="middle" fontSize="10.5" fill="var(--muted)">{l}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/** Değer etiketli yumuşak çizgi grafik; `area` verilirse ilk serinin altı dolu çizilir */
function ValueLines({ labels, series, format, height = 260, area }: {
  labels: string[]; series: { label: string; color: string; values: number[]; dashed?: boolean }[]; format: (v: number) => string; height?: number; area?: boolean
}) {
  const [ref, W] = useWidth()
  const pad = { l: 52, r: 18, t: 24, b: 26 }
  const all = series.flatMap((s) => s.values)
  const max = Math.max(...all) * 1.15
  const min = area ? 0 : Math.min(...all) * 0.8
  const x = (i: number) => pad.l + (i / (labels.length - 1)) * (W - pad.l - pad.r)
  const y = (v: number) => pad.t + (1 - (v - min) / (max - min || 1)) * (height - pad.t - pad.b)
  return (
    <div ref={ref}>
      <svg width={W} height={height} className="block">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const v = min + (max - min) * f
          return (
            <g key={f}>
              <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="var(--border)" />
              <text x={pad.l - 6} y={y(v) + 3} textAnchor="end" fontSize="10" fill="var(--faint)">{format(v)}</text>
            </g>
          )
        })}
        {series.map((s, si) => {
          const pts = s.values.map((v, i) => [x(i), y(v)] as [number, number])
          const d = smoothPath(pts)
          return (
            <g key={s.label}>
              {area && si === 0 && <path d={`${d} L ${x(labels.length - 1)} ${y(min)} L ${x(0)} ${y(min)} Z`} fill={s.color} opacity={0.18} />}
              <path d={d} fill="none" stroke={s.color} strokeWidth="2.25" strokeDasharray={s.dashed ? '5 4' : undefined} />
              {pts.map(([px, py], i) => (
                <g key={i}>
                  <circle cx={px} cy={py} r="3.5" fill="var(--surface)" stroke={s.color} strokeWidth="2" />
                  <text x={px} y={py - 9} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--ink)">{format(s.values[i])}</text>
                </g>
              ))}
            </g>
          )
        })}
        {labels.map((l, i) => <text key={l} x={x(i)} y={height - 8} textAnchor="middle" fontSize="10.5" fill="var(--muted)">{l}</text>)}
      </svg>
    </div>
  )
}

/** Simge dairesi — KPI kutularının solunda */
const ICONS: Record<string, ReactNode> = {
  doc: <><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5M10 13h6M10 17h6" /></>,
  up: <><path d="M4 18l6-6 4 4 6-8" /><path d="M14 8h6v6" /></>,
  percent: <><path d="M5 19L19 5" /><circle cx="7" cy="7" r="2.5" /><circle cx="17" cy="17" r="2.5" /></>,
  flame: <path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 1 1 2 2 3 2 0-2 0-3 0-5z" />,
  scale: <><path d="M12 4v16M5 20h14M6 8l-3 6h6zM18 8l-3 6h6zM6 8h12" /></>,
  out: <><path d="M7 3h7l5 5v13H7z" /><path d="M12 11v7M9 15l3 3 3-3" /></>,
  ratio: <><circle cx="12" cy="12" r="8" /><path d="M12 12V4M12 12l6 4" /></>,
  bank: <><path d="M3 9l9-5 9 5M5 9v9M10 9v9M14 9v9M19 9v9M3 20h18" /></>,
  cash: <><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="3" /></>,
}
function IconKpi({ icon, label, value, sub, tone = 'accent' }: { icon: keyof typeof ICONS; label: string; value: string; sub?: ReactNode; tone?: 'accent' | 'ok' | 'warn' | 'crit' | 'info' }) {
  return (
    <div className="card lift flex items-center gap-3 px-4 py-3">
      <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full" style={{ background: `var(--${tone}-soft, var(--${tone}-bg))`, color: `var(--${tone}-ink)` }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{ICONS[icon]}</svg>
      </span>
      <div className="min-w-0">
        <div className="truncate text-[12px] font-medium text-[var(--muted)]">{label}</div>
        <div className="text-[20px] font-bold leading-tight text-[var(--ink)] tnum">{value}</div>
        {sub && <div className="text-[11.5px] text-[var(--muted)]">{sub}</div>}
      </div>
    </div>
  )
}

/* ---------------- Finance dashboard ---------------- */

export function FinanceDashboard() {
  const [refreshed, setRefreshed] = useState('07 Eki 2026 10:00')
  return (
    <>
      <PageHead title="Finance · Dashboard"
        note="Projenin finansal sağlığı: alacak ve borçlar, gelir ve kârlılık, nakit yakımı, işletme sermayesi ve vade yapısı. Şablon ekran — muhasebe entegrasyonu bağlandığında veriler otomatik dolar."
        right={<>
          <span className="text-[11.5px] text-[var(--muted)]">Veriler {refreshed} itibarıyla</span>
          <Btn small onClick={() => setRefreshed(new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date()))}>↻ Yenile</Btn>
          <ExportButtons />
        </>} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <IconKpi icon="doc" label="Alacaklar" value={m(3_800_000)} sub="İşverenden kesilmiş, tahsil edilmemiş" />
        <IconKpi icon="up" label="Gelir (sözleşme yılı)" value={m(11_300_000)} sub="Hakediş + değişiklik emirleri" tone="ok" />
        <IconKpi icon="percent" label="Brüt kâr marjı" value="%39,3" sub="Hedef %35" tone="ok" />
        <IconKpi icon="flame" label="Aylık ortalama nakit yakımı" value={m(96_000)} sub="Son 6 ay" tone="warn" />
        <IconKpi icon="out" label="Borçlar" value={m(1_300_000)} sub="Taşeron + tedarikçi" tone="crit" />
        <IconKpi icon="ratio" label="Alacak / borç karşılama" value="2,8" sub="1’in üstü sağlıklı" tone="info" />
        <IconKpi icon="scale" label="Borç / özkaynak" value="%53,2" sub="Banka kovenantı ≤ %80" />
        <IconKpi icon="bank" label="Özkaynak oranı" value="%65,3" sub="Toplam varlığa oranı" tone="info" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card fill title="Stok kapanış bakiyesi" help="Ay sonu depo ve saha stokunun parasal değeri (son 6 ay).">
          <ValueLines labels={MONTHS6} area series={[{ label: 'Stok', color: 'var(--series-1)', values: [36_000, 49_000, 38_000, 44_000, 39_000, 43_000] }]} format={(v) => `${num(v / 1000)}B`} />
        </Card>
        <Card fill title="Net ve brüt işletme sermayesi" help="Brüt: dönen varlıklar. Net: dönen varlıklar − kısa vadeli borçlar."
          right={<Legend items={[{ label: 'Net işletme sermayesi', color: 'var(--ok)' }, { label: 'Brüt işletme sermayesi', color: 'var(--series-1)', dashed: true }]} />}>
          <ValueLines labels={MONTHS6} series={[
            { label: 'Net', color: 'var(--ok)', values: [103_000, 275_000, 159_000, 117_000, 60_000, 65_000] },
            { label: 'Brüt', color: 'var(--series-1)', dashed: true, values: [123_000, 366_000, 219_000, 210_000, 143_000, 136_000] },
          ]} format={(v) => `${num(v / 1000)}B`} />
        </Card>
        <Card fill title="Alacak ve borç devir hızı" help="Ay içinde tahsil edilen alacak ve ödenen borç tutarı."
          right={<Legend items={[{ label: 'Alacak devri', color: 'var(--neutral)' }, { label: 'Borç devri', color: 'var(--series-2)' }]} />}>
          <ValueBars labels={MONTHS6} series={[
            { label: 'Alacak', color: 'var(--neutral)', values: [6_000, 9_000, 13_000, 9_000, 10_000, 4_000] },
            { label: 'Borç', color: 'var(--series-2)', values: [1_000, 2_000, 3_000, 6_000, 11_000, 4_000] },
          ]} format={(v) => `${num(v / 1000)}B`} />
        </Card>
        <Card fill title="Vadeye göre borçlar" help="Ödenmemiş borçların vadesi geçen gün sayısına göre dağılımı (DPD: days past due).">
          <ValueBars labels={['1–30 gün', '31–60 gün', '61–90 gün', '91+ gün', 'Vadesi gelmedi']} series={[
            { label: 'Borç', color: 'var(--info)', values: [441_000, 251_000, 65_000, 112_000, 436_000] },
          ]} format={(v) => `${num(v / 1000)}B`} />
        </Card>
      </div>
    </>
  )
}

/* ---------------- Accounting dashboard ---------------- */

interface Entry { id: string; date: string; kind: 'Gelir' | 'Gider'; party: string; text: string; amount: number; category: string }

const SEED: Entry[] = [
  { id: 'e1', date: '2026-10-01', kind: 'Gelir', party: 'Anadolu Lojistik A.Ş.', text: 'IPC-19 hakediş tahsilatı', amount: 1_623_812, category: 'Hakediş' },
  { id: 'e2', date: '2026-10-02', kind: 'Gider', party: 'Kuzey Çelik Yapı', text: 'Eylül alt yüklenici hakedişi', amount: 410_000, category: 'Taşeron' },
  { id: 'e3', date: '2026-10-05', kind: 'Gider', party: 'SGK / maaşlar', text: 'Eylül personel ödemeleri', amount: 286_000, category: 'Personel' },
  { id: 'e4', date: '2026-10-07', kind: 'Gider', party: 'Akaryakıt A.Ş.', text: 'Şantiye yakıtı', amount: 38_500, category: 'Makine' },
  { id: 'e5', date: '2026-10-09', kind: 'Gider', party: 'Panelsan', text: 'Sandviç panel sevkiyatı', amount: 152_000, category: 'Malzeme' },
  { id: 'e6', date: '2026-10-12', kind: 'Gelir', party: 'Anadolu Lojistik A.Ş.', text: 'CO-02 değişiklik emri avansı', amount: 155_000, category: 'Değişiklik' },
  { id: 'e7', date: '2026-10-15', kind: 'Gider', party: 'Vergi dairesi', text: 'KDV ödemesi', amount: 96_400, category: 'Vergi' },
  { id: 'e8', date: '2026-10-20', kind: 'Gider', party: 'Marmara Yapı', text: 'Betonarme hakediş', amount: 182_000, category: 'Taşeron' },
  { id: 'e9', date: '2026-10-22', kind: 'Gelir', party: 'Anadolu Lojistik A.Ş.', text: 'IPC-20 hakediş (beklenen)', amount: 1_454_160, category: 'Hakediş' },
  { id: 'e10', date: '2026-10-28', kind: 'Gider', party: 'Kira — mobil vinç', text: 'Ekim kira bedeli', amount: 46_000, category: 'Makine' },
]

const INVOICES = [
  { party: 'Anadolu Lojistik A.Ş.', no: 'IPC-20', due: '2026-10-22', amount: 1_454_160, split: 'Vadesi gelmedi' },
  { party: 'Anadolu Lojistik A.Ş.', no: 'CO-05', due: '2026-08-30', amount: 95_000, split: '31–60' },
  { party: 'Medport Liman İşl.', no: 'FT-2026-118', due: '2026-07-14', amount: 42_300, split: '61–90' },
  { party: 'Anadolu Lojistik A.Ş.', no: 'CO-06', due: '2026-06-20', amount: 64_000, split: '90+' },
  { party: 'Ege Tersane A.Ş.', no: 'FT-2026-097', due: '2026-06-02', amount: 18_750, split: '90+' },
  { party: 'Sağlık Yatırım A.Ş.', no: 'FT-2026-121', due: '2026-09-12', amount: 27_900, split: '1–30' },
]

export function AccountingDashboard() {
  const [entries, setEntries] = useState<Entry[]>(SEED)
  const [month, setMonth] = useState(new Date(2026, 9, 1))
  const [day, setDay] = useState<string | null>(null)
  const [adding, setAdding] = useState<{ kind: Entry['kind']; date: string } | null>(null)
  const inc = entries.filter((e) => e.kind === 'Gelir').reduce((a, e) => a + e.amount, 0)
  const exp = entries.filter((e) => e.kind === 'Gider').reduce((a, e) => a + e.amount, 0)
  const splitTone = (s: string) => (s === '90+' ? 'crit' : s === '61–90' ? 'warn' : s === 'Vadesi gelmedi' ? 'ok' : 'neutral')

  return (
    <>
      <PageHead title="Accounting · Dashboard"
        note="Muhasebe özeti: faturalar, borç ve alacaklar, gelir-gider, banka bakiyesi ve vade yapısı. Takvimde günlere gelir ve gider işaretlenir; güne tıklayınca hareketler açılır. Şablon ekran."
        right={<>
          <ExportButtons />
          <Btn small onClick={() => setAdding({ kind: 'Gider', date: '2026-10-07' })}>− Gider ekle</Btn>
          <Btn small primary onClick={() => setAdding({ kind: 'Gelir', date: '2026-10-07' })}>+ Gelir ekle</Btn>
        </>} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <IconKpi icon="doc" label="Faturalar" value="69 toplam" sub={<span className="text-[var(--crit-ink)]">33 vadesi geçmiş</span>} />
        <IconKpi icon="out" label="Borçlar" value={m(1_140_000)} sub="Ödenecek faturalar" tone="crit" />
        <IconKpi icon="up" label="Gelir (bu ay)" value={m(inc)} sub="Takvimdeki gelirler" tone="ok" />
        <IconKpi icon="cash" label="Gider (bu ay)" value={m(exp)} sub="Takvimdeki giderler" tone="warn" />
        <IconKpi icon="flame" label="Vadesi geçen tutar" value={m(247_950)} sub="Alacaklarda" tone="crit" />
        <IconKpi icon="bank" label="Banka bakiyesi" value={m(3_420_000)} sub="3 hesap · 07 Eki" tone="info" />
        <IconKpi icon="ratio" label="Bu ay vadesi geçen" value={m(82_400)} sub="Ekim 2026" tone="warn" />
        <IconKpi icon="ratio" label="Geçen ay vadesi geçen" value={m(96_100)} sub="Eylül 2026" />
      </div>

      <Calendar month={month} onMonth={setMonth} entries={entries} onDay={setDay} onAdd={(kind, date) => setAdding({ kind, date })} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card fill title="Alacak ve borç — son 6 ay" right={<Legend items={[{ label: 'Alacaklar', color: 'var(--series-1)' }, { label: 'Borçlar', color: 'var(--series-4)' }]} />}>
          <ValueLines labels={MONTHS6} series={[
            { label: 'Alacaklar', color: 'var(--series-1)', values: [1_700, 2_800, 1_500, 600, 2_400, 1_200] },
            { label: 'Borçlar', color: 'var(--series-4)', values: [2_000, 2_800, 1_300, 400, 3_100, 800] },
          ]} format={(v) => `${num(v / 1000, 1)}M`} />
        </Card>
        <Card fill title="Fatura durumu" help="Bu yıl kesilen ve alınan faturaların durumu.">
          <InvoiceStatus />
        </Card>
        <Card fill title="Vade dilimine göre alacak ve borç" right={<Legend items={[{ label: 'Borçlar', color: 'var(--series-4)' }, { label: 'Alacaklar', color: 'var(--series-1)' }]} />}>
          <ValueBars labels={['31–60 gün', '61–90 gün', '90+ gün']} series={[
            { label: 'Borç', color: 'var(--series-4)', values: [1_200, 3_100, 7_100] },
            { label: 'Alacak', color: 'var(--series-1)', values: [800, 2_400, 5_500] },
          ]} format={(v) => `${num(v / 1000, 1)}M`} />
        </Card>
        <Card fill title="Cari bazında vade detayı" pad={false}>
          <Table head={<tr><Th w={190}>Cari</Th><Th>Fatura no</Th><Th>Vade</Th><Th right>Tutar</Th><Th center>Gecikme</Th></tr>}>
            {INVOICES.map((i) => (
              <tr key={i.no}>
                <Td><span className="font-medium text-[var(--ink)]">{i.party}</span></Td>
                <Td mono nowrap>{i.no}</Td>
                <Td nowrap><span className="tnum">{new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(new Date(i.due))}</span></Td>
                <Td right>{num(i.amount)}</Td>
                <Td nowrap center><Badge tone={splitTone(i.split)}>{i.split}</Badge></Td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>

      {day && <DayModal day={day} entries={entries.filter((e) => e.date === day)} onClose={() => setDay(null)}
        onAdd={(kind) => { setAdding({ kind, date: day }); setDay(null) }}
        onDelete={(id) => setEntries((l) => l.filter((e) => e.id !== id))} />}
      {adding && <EntryModal init={adding} onClose={() => setAdding(null)}
        onSave={(e) => { setEntries((l) => [...l, e]); setAdding(null); setMonth(new Date(Number(e.date.slice(0, 4)), Number(e.date.slice(5, 7)) - 1, 1)) }} />}
    </>
  )
}

function InvoiceStatus() {
  const parts = [
    { k: 'Onaylandı', v: 47.8, c: 'var(--series-1)' },
    { k: 'Ödendi', v: 37.7, c: 'var(--ok)' },
    { k: 'İptal', v: 5.8, c: 'var(--chart-rest)' },
    { k: 'Taslak', v: 4.3, c: 'var(--neutral)' },
    { k: 'Silindi', v: 4.4, c: 'var(--border-strong)' },
  ]
  return (
    <div className="flex flex-1 flex-col justify-center gap-4">
      <div className="flex h-10 overflow-hidden rounded-md">
        {parts.map((p) => (
          <span key={p.k} className="grid place-items-center text-[11px] font-semibold text-white" style={{ width: `${p.v}%`, background: p.c }} title={`${p.k} %${p.v}`}>
            {p.v > 8 ? `%${num(p.v, 1)}` : ''}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 text-[12px] text-[var(--muted)]">
        {parts.map((p) => <span key={p.k} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: p.c }} />{p.k} · %{num(p.v, 1)}</span>)}
      </div>
    </div>
  )
}

/* ---------------- Takvim ---------------- */

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const TODAY = '2026-10-07'

/**
 * Aylık gelir-gider takvimi: her gün bir düğmedir. Günün gelirleri yeşil, giderleri kırmızı etiketle görünür;
 * tıklayınca o günün hareketleri pop-up'ta açılır. Boş güne tıklayınca yeni kayıt eklenebilir.
 */
function Calendar({ month, onMonth, entries, onDay, onAdd }: {
  month: Date; onMonth: (d: Date) => void; entries: Entry[]; onDay: (d: string) => void; onAdd: (k: Entry['kind'], d: string) => void
}) {
  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7))
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d })
  }, [month])
  const title = new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(month)
  const inMonth = entries.filter((e) => e.date.slice(0, 7) === iso(month).slice(0, 7))
  const net = inMonth.reduce((a, e) => a + (e.kind === 'Gelir' ? e.amount : -e.amount), 0)

  return (
    <Card title={`Gelir - gider takvimi · ${title}`} help="Her gün bir düğmedir: tıklayınca o günün hareketleri açılır, oradan gelir veya gider eklenir. Yeşil gelir, kırmızı gider."
      right={<>
        <span className="text-[12px] text-[var(--muted)]">Ay neti <b style={{ color: net >= 0 ? 'var(--ok-ink)' : 'var(--crit-ink)' }}>{net >= 0 ? '+' : ''}{m(net)}</b></span>
        <Btn small onClick={() => onMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</Btn>
        <Btn small onClick={() => onMonth(new Date(2026, 9, 1))}>Bugün</Btn>
        <Btn small onClick={() => onMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</Btn>
      </>}>
      <div className="grid grid-cols-7 gap-1.5">
        {DAYS.map((d) => <div key={d} className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{d}</div>)}
        {cells.map((d) => {
          const k = iso(d)
          const list = entries.filter((e) => e.date === k)
          const other = d.getMonth() !== month.getMonth()
          const isToday = k === TODAY
          return (
            <button key={k} onClick={() => (list.length ? onDay(k) : onAdd('Gelir', k))}
              title={list.length ? `${list.length} hareket` : 'Hareket ekle'}
              className="lift group flex min-h-[84px] flex-col gap-1 rounded-md border p-1.5 text-left transition-colors hover:border-[var(--accent)]"
              style={{ background: other ? 'var(--surface-2)' : 'var(--surface)', borderColor: isToday ? 'var(--brand-gold)' : 'var(--border)', opacity: other ? 0.55 : 1, boxShadow: isToday ? 'inset 0 0 0 1px var(--brand-gold)' : undefined }}>
              <span className="flex items-center text-[11.5px] font-semibold" style={{ color: isToday ? 'var(--brand-gold-dark)' : 'var(--ink)' }}>
                {d.getDate()}{isToday && <span className="ml-1 text-[10px] font-medium">bugün</span>}
                <span className="ml-auto text-[13px] text-[var(--faint)] opacity-0 group-hover:opacity-100">＋</span>
              </span>
              {list.slice(0, 2).map((e) => (
                <span key={e.id} className="truncate rounded px-1.5 py-0.5 text-[10.5px] font-semibold tnum"
                  style={e.kind === 'Gelir' ? { background: 'var(--ok-bg)', color: 'var(--ok-ink)' } : { background: 'var(--crit-bg)', color: 'var(--crit-ink)' }}>
                  {e.kind === 'Gelir' ? '+' : '−'}{m(e.amount)}
                </span>
              ))}
              {list.length > 2 && <span className="text-[10.5px] text-[var(--muted)]">+{list.length - 2} hareket</span>}
            </button>
          )
        })}
      </div>
    </Card>
  )
}

function DayModal({ day, entries, onClose, onAdd, onDelete }: {
  day: string; entries: Entry[]; onClose: () => void; onAdd: (k: Entry['kind']) => void; onDelete: (id: string) => void
}) {
  const label = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'full' }).format(new Date(day))
  const net = entries.reduce((a, e) => a + (e.kind === 'Gelir' ? e.amount : -e.amount), 0)
  return (
    <Modal title={label} note={`${entries.length} hareket · net ${net >= 0 ? '+' : ''}${money(net, C)}`} onClose={onClose} wide
      footer={<>
        <Btn onClick={() => onAdd('Gider')}>− Gider ekle</Btn>
        <Btn primary onClick={() => onAdd('Gelir')}>+ Gelir ekle</Btn>
        <span className="ml-auto"><Btn onClick={onClose}>Kapat</Btn></span>
      </>}>
      <div className="flex flex-col gap-2">
        {entries.map((e) => (
          <div key={e.id} className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-3 py-2.5">
            <Badge tone={e.kind === 'Gelir' ? 'ok' : 'crit'} dot>{e.kind}</Badge>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium text-[var(--ink)]">{e.text}</span>
              <span className="block text-[11.5px] text-[var(--muted)]">{e.party} · {e.category}</span>
            </span>
            <b className="tnum" style={{ color: e.kind === 'Gelir' ? 'var(--ok-ink)' : 'var(--crit-ink)' }}>{e.kind === 'Gelir' ? '+' : '−'}{money(e.amount, C)}</b>
            <Btn small danger onClick={() => onDelete(e.id)}>Sil</Btn>
          </div>
        ))}
      </div>
    </Modal>
  )
}

function EntryModal({ init, onClose, onSave }: { init: { kind: Entry['kind']; date: string }; onClose: () => void; onSave: (e: Entry) => void }) {
  const [kind, setKind] = useState(init.kind)
  const [date, setDate] = useState(init.date)
  const [party, setParty] = useState('')
  const [text, setText] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(init.kind === 'Gelir' ? 'Hakediş' : 'Malzeme')
  const ready = text.trim().length > 2 && Number(amount) > 0
  return (
    <Modal title={`${kind} ekle`} note="Kayıt takvimde ilgili güne işlenir ve dashboard toplamlarına yansır." onClose={onClose} wide
      footer={<span className="ml-auto flex gap-2"><Btn onClick={onClose}>Vazgeç</Btn>
        <Btn primary disabled={!ready} onClick={() => onSave({ id: `e${Date.now()}`, date, kind, party: party || '—', text, amount: Number(amount), category })}>Kaydet</Btn></span>}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex gap-2 sm:col-span-2">
          {(['Gelir', 'Gider'] as const).map((k) => (
            <button key={k} onClick={() => setKind(k)} className="h-10 flex-1 rounded-md border text-[13px] font-semibold transition-colors"
              style={kind === k
                ? (k === 'Gelir' ? { background: 'var(--ok-bg)', borderColor: 'var(--ok)', color: 'var(--ok-ink)' } : { background: 'var(--crit-bg)', borderColor: 'var(--crit)', color: 'var(--crit-ink)' })
                : { background: 'var(--surface)', borderColor: 'var(--border-strong)', color: 'var(--muted)' }}>
              {k === 'Gelir' ? '+ Gelir' : '− Gider'}
            </button>
          ))}
        </div>
        <Field required label="Tarih" type="date" value={date} onChange={setDate} />
        <Field required label={`Tutar (${C})`} type="number" value={amount} onChange={setAmount} />
        <div className="sm:col-span-2"><Field required label="Açıklama" value={text} onChange={setText} placeholder="Ör. IPC-21 hakediş tahsilatı" /></div>
        <Field label="Cari" value={party} onChange={setParty} placeholder="Firma / kişi" />
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-[var(--ink)]">Kategori</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-[13px] text-[var(--ink)]">
            {['Hakediş', 'Değişiklik', 'Taşeron', 'Malzeme', 'Personel', 'Makine', 'Vergi', 'Diğer'].map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
      </div>
    </Modal>
  )
}
