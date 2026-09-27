import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  Badge, Btn, Card, Chips, ColumnFilter, ExportButtons, Field, IconBtn, Kpi, Modal, PageHead, RowActions,
  Search, Table, Td, Th,
} from '../../components/ui'
import type { Tone } from '../../components/ui'
import { date, moneyShort, num, pct } from '../../lib/format'
import { Legend, MonthColumns, PairBars } from '../charts'
import { evm, prj } from '../data'
import {
  equipmentRows, groupProgress, manpowerRows, phrsTotals, scheduleActivities, siteDisruptions, siteEntries,
  sitePhotos, stageOf, team, weeklyOutput,
} from '../progressData'
import type { EquipmentRow, ManpowerRow, SiteDisruption, SiteEntry, SitePhoto, Stage } from '../progressData'

/**
 * Progress alt modülü: sahadan veri girişi, 3'lü onay, günlük personel ve ekipman, aksaklıklar ve saha fotoğrafları.
 * Veri mühendisi girer → kısım şefi onaylar → şantiye şefi onaylar; şantiye şefi onayı olmadan kayıt işlenmez.
 * Tablolarda tarih her zaman son sütundadır; kolonlar olabildiğince ayrık tutulur (kolay adreslemek için).
 */

const STAGE_TONE: Record<Stage, Tone> = {
  'Onaylandı': 'ok', 'Reddedildi': 'crit', 'Şantiye şefi onayında': 'accent', 'Kısım şefi onayında': 'warn',
}
const now = () => new Date().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
const TODAY = '2026-09-27'

/* ---------------- Ortak yardımcılar ---------------- */

/** Her sütunda filtre: sütunun değerlerinden seçim yapılır */
function useColumnFilters<T>(rows: T[], getters: Record<string, (r: T) => string>) {
  const [f, setF] = useState<Record<string, string>>({})
  const filtered = rows.filter((r) => Object.entries(f).every(([k, v]) => !v || v === 'Tümü' || getters[k](r) === v))
  const head = (k: string, label: ReactNode) => (
    <span className="flex items-center gap-1.5">
      {label}
      <ColumnFilter value={f[k] ?? 'Tümü'} onChange={(v) => setF((o) => ({ ...o, [k]: v }))}
        values={[...new Set(rows.map(getters[k]))].sort((a, b) => a.localeCompare(b, 'tr'))} />
    </span>
  )
  return { filtered, head }
}

type Preset = 'Dün' | 'Geçen hafta' | 'Geçen ay'
const PRESETS: Record<Preset, [string, string]> = {
  'Dün': ['2026-09-26', '2026-09-26'],
  'Geçen hafta': ['2026-09-20', '2026-09-26'],
  'Geçen ay': ['2026-08-27', '2026-09-26'],
}

/** Takvim: başlangıç ve bitiş seçilir, "Getir" ile kayıtlar yüklenir; hazır aralıklar tek tıkla gelir */
function DateRange({ range, onApply }: { range: [string, string]; onApply: (r: [string, string]) => void }) {
  const [from, setFrom] = useState(range[0])
  const [to, setTo] = useState(range[1])
  const input = 'rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[12.5px] text-[var(--ink)] outline-none focus:border-[var(--accent)]'
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Başlangıç</span>
      <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className={input} />
      <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Bitiş</span>
      <input type="date" value={to} min={from} max={TODAY} onChange={(e) => setTo(e.target.value)} className={input} />
      <Btn small primary onClick={() => onApply([from, to])}>Getir</Btn>
      <span className="mx-1 h-5 w-px bg-[var(--border)]" />
      {(Object.keys(PRESETS) as Preset[]).map((p) => {
        const on = range[0] === PRESETS[p][0] && range[1] === PRESETS[p][1]
        return (
          <button key={p} onClick={() => { setFrom(PRESETS[p][0]); setTo(PRESETS[p][1]); onApply(PRESETS[p]) }}
            className="rounded-full border px-2.5 py-0.5 text-[12px] transition-colors"
            style={on
              ? { background: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--accent)' }
              : { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--muted)' }}>{p}</button>
        )
      })}
      <span className="ml-auto text-[11.5px] text-[var(--muted)]">{date(range[0])} – {date(range[1])}</span>
    </div>
  )
}

/* ---------------- Onay akışı şeridi (yalnızca onay mekanizmasındaki kullanıcılar görür) ---------------- */

const PIPE: { stage: Stage; label: string; note: string }[] = [
  { stage: 'Onaylandı', label: 'Onaylanan', note: 'Şantiye şefi onayladı · işlendi' },
  { stage: 'Reddedildi', label: 'Reddedilen', note: 'Geri gönderildi' },
  { stage: 'Şantiye şefi onayında', label: 'Şantiye şefi onayında', note: 'Kısım şefi onayladı' },
  { stage: 'Kısım şefi onayında', label: 'Kısım şefi onayında', note: 'Veri mühendisi girdi' },
]

function Pipeline({ entries, onPick }: { entries: SiteEntry[]; onPick?: (s: Stage) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {PIPE.map((s) => {
        const n = entries.filter((e) => stageOf(e) === s.stage).length
        const t = STAGE_TONE[s.stage]
        return (
          <button key={s.stage} onClick={() => onPick?.(s.stage)}
            className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-left transition-colors hover:border-[var(--accent)]">
            <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full text-[13px] font-bold tnum"
              style={{ background: t === 'accent' ? 'var(--accent-soft)' : `var(--${t}-bg)`, color: t === 'accent' ? 'var(--accent)' : `var(--${t})` }}>{n}</span>
            <span className="min-w-0">
              <span className="block text-[12.5px] font-semibold text-[var(--ink)]">{s.label}</span>
              <span className="block text-[11px] text-[var(--muted)]">{s.note}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** Satırdaki üç onay noktası: girildi · kısım şefi · şantiye şefi */
function ApprovalDots({ e }: { e: SiteEntry }) {
  const dots = [
    { label: `Girdi: ${e.entered.by} · ${e.entered.at}`, done: true },
    { label: e.sectionChief ? `Kısım şefi: ${e.sectionChief.by} · ${e.sectionChief.at}` : 'Kısım şefi onayı bekleniyor', done: !!e.sectionChief },
    { label: e.siteChief ? `Şantiye şefi: ${e.siteChief.by} · ${e.siteChief.at}` : 'Şantiye şefi onayı bekleniyor', done: !!e.siteChief },
  ]
  return (
    <span className="inline-flex items-center gap-1">
      {dots.map((d, i) => (
        <span key={i} title={d.label} className="h-2.5 w-2.5 rounded-full border"
          style={e.rejected && i > 0 && !d.done
            ? { background: 'var(--crit-bg)', borderColor: 'var(--crit)' }
            : d.done ? { background: 'var(--ok)', borderColor: 'var(--ok)' } : { background: 'var(--surface)', borderColor: 'var(--border-strong)' }} />
      ))}
    </span>
  )
}

/* ---------------- Dashboard ---------------- */

export function ProgressDashboard({ onGo }: { onGo: (k: string) => void }) {
  const { actual, planned } = evm()
  const yesterday = siteEntries.filter((e) => e.date === '2026-09-25')
  const pending = siteEntries.filter((e) => ['Kısım şefi onayında', 'Şantiye şefi onayında'].includes(stageOf(e)))
  const openDis = siteDisruptions.filter((d) => d.state === 'Açık' || d.state === 'Çözümde')

  return (
    <>
      <PageHead title="Progress · Dashboard" note="Genel ilerlemeler ve KPI’lar. Sayılar sahadan girilip şantiye şefi onayından geçmiş kayıtlardan hesaplanır; onay bekleyen kayıtlar henüz ilerlemeye yansımaz. Bu ekranda fiyat gösterilmez; maliyet analizleri Budget modülündedir." right={<ExportButtons />} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Fiziksel ilerleme" value={pct(actual)} sub={`Planlanan ${pct(planned, 1)}`} tone="accent" />
        <Kpi label="Dünkü kayıt" value={yesterday.length} sub={`${yesterday.reduce((a, e) => a + e.people, 0)} kişi · ${num(yesterday.reduce((a, e) => a + e.people * e.hours, 0))} inxsa`} />
        <Kpi label="İnsan-saat" value={`${num(phrsTotals.actual / 1000)} bin`}
          sub={`Planlanan ${num(phrsTotals.plan / 1000)} bin · %${Math.round((phrsTotals.actual / phrsTotals.plan) * 100)} gerçekleşti`} tone="accent"
          help={`İşin tamamı için planlanan insan-saat (inxsa) ve bugüne kadar onaylanmış kayıtlardan gerçekleşen. Bugün olması gereken: ${num(phrsTotals.planToDate)}.`} />
        <Kpi label="Onay bekleyen" value={pending.length} sub="İlerlemeye henüz yansımadı" tone="warn"
          help="Kısım şefi veya şantiye şefi onayı bekleyen kayıtlar. Şantiye şefi onaylamadan kayıt işlenmez." />
        <Kpi label="Reddedilen" value={siteEntries.filter((e) => e.rejected).length} sub="Düzeltilip yeniden girilecek" tone="crit" />
        <Kpi label="Açık aksaklık" value={openDis.length} sub={`${num(openDis.reduce((a, d) => a + d.lostHours, 0))} saat kayıp`} tone="warn" />
      </div>

      <Card title="Onay akışı" help="Yalnızca onay mekanizmasındaki kullanıcılar (veri mühendisi, kısım şefi, şantiye şefi) görür. Kutuya tıklayınca kayıtlar Site Activity’de açılır.">
        <Pipeline entries={siteEntries} onPick={() => onGo('site_activity')} />
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="İş gruplarına göre ilerleme" help="Açık çubuk bugün olması gereken, koyu çubuk onaylanmış kayıtlardan gerçekleşen ilerleme."
          right={<Legend items={[{ label: 'Gerçekleşen', color: 'var(--series-1)' }, { label: 'Planlanan', color: 'var(--series-2)' }]} />}>
          <PairBars rows={groupProgress.map((g) => ({ label: g.group, plan: g.plan, actual: g.actual }))} format={(v) => `%${v}`} worseWhen="lower" />
        </Card>
        <Card title="Haftalık ilerleme (puan)" help="Her hafta eklenen fiziksel ilerleme puanı: planlanan ve onaylanmış kayıtlardan gerçekleşen. Fiyat içermez."
          right={<Legend items={[{ label: 'Gerçekleşen', color: 'var(--series-1)' }, { label: 'Planlanan', color: 'var(--series-2)' }]} />}>
          <MonthColumns data={weeklyOutput.map((w) => ({ label: w.w, plan: w.plan, actual: w.actual }))} format={(v) => `%${v.toLocaleString('tr-TR')} ilerleme`} height={170} />
        </Card>
      </div>

      <Card title="Son saha fotoğrafları" right={<Btn small onClick={() => onGo('site_photos')}>Tümü →</Btn>}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
          {sitePhotos.slice(0, 6).map((p) => <PhotoThumb key={p.id} p={p} />)}
        </div>
      </Card>
    </>
  )
}

/* ---------------- Site Activity ---------------- */

export function SiteActivity() {
  const [entries, setEntries] = useState<SiteEntry[]>(siteEntries)
  const [range, setRange] = useState<[string, string]>(PRESETS['Geçen hafta'])
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<SiteEntry | null>(null)
  const [editing, setEditing] = useState<SiteEntry | 'new' | null>(null)

  const inRange = entries.filter((e) => e.date >= range[0] && e.date <= range[1])
  const searched = inRange.filter((e) => {
    if (!q.trim()) return true
    const s = q.toLocaleLowerCase('tr')
    return [e.id, e.code, e.activity, e.loc1, e.loc2, e.loc3, e.company].some((v) => v.toLocaleLowerCase('tr').includes(s))
  })
  const { filtered: rows, head } = useColumnFilters(searched, {
    code: (e) => e.code, activity: (e) => e.activity, loc1: (e) => e.loc1, loc2: (e) => e.loc2, loc3: (e) => e.loc3,
    unit: (e) => e.unit, qty: (e) => num(e.qty), company: (e) => e.company, people: (e) => String(e.people),
    inxsa: (e) => num(e.people * e.hours), by: (e) => e.entered.by, stage: (e) => stageOf(e), date: (e) => date(e.date),
  })

  function update(e: SiteEntry) {
    setEntries((l) => (l.some((x) => x.id === e.id) ? l.map((x) => (x.id === e.id ? e : x)) : [e, ...l]))
    setOpen((o) => (o && o.id === e.id ? e : o))
  }

  return (
    <>
      <PageHead
        title="Progress · Site Activity"
        note="Tanımlı veri girişi kullanıcılarının sahadan eklediği imalat kayıtları. Her kayıt 3’lü onaya tabidir: veri mühendisi → kısım şefi → şantiye şefi; şantiye şefi onayı olmadan kayıt işleme (ilerleme, inxsa, hakediş) aktarılmaz. Kolonlar sistemde tanımlıdır ve ilgili modüllere bağlanır. Mobilde aynı ekran görünür."
        right={<>
          <ExportButtons />
          <Btn primary onClick={() => setEditing('new')}>+ Veri girişi</Btn>
        </>}
      />

      <DateRange range={range} onApply={setRange} />

      <Card title={`Kayıtlar (${rows.length})`}
        help="Her sütun başlığındaki ▼ ile filtrelenir. Onay sütunundaki noktalar: girildi · kısım şefi · şantiye şefi. Göz simgesiyle kayıt açılır ve onay verilir; onaylanmış kayıt düzenlenemez ve silinemez."
        right={<Search value={q} onChange={setQ} placeholder="Kod, açıklama, lokasyon…" />} pad={false}>
        <Table dense head={
          <tr>
            <Th>{head('code', 'Aktivite kodu')}</Th>
            <Th w={160}>{head('activity', 'Açıklama')}</Th>
            <Th>{head('loc1', 'Lokasyon 1')}</Th>
            <Th>{head('loc2', 'Lokasyon 2')}</Th>
            <Th>{head('loc3', 'Lokasyon 3')}</Th>
            <Th>{head('unit', 'Birim')}</Th>
            <Th right>{head('qty', 'Miktar')}</Th>
            <Th>{head('company', 'Sorumlu firma')}</Th>
            <Th right>{head('people', 'Personel')}</Th>
            <Th right>{head('inxsa', 'inxsa')}</Th>
            <Th>{head('by', 'Veri giren')}</Th>
            <Th>{head('stage', 'Onay')}</Th>
            <Th>{head('date', 'Tarih')}</Th>
            <Th w={100} center>İşlem</Th>
          </tr>
        }>
          {rows.map((e) => {
            const st = stageOf(e)
            return (
              <tr key={e.id} onClick={() => setOpen(e)} className="cursor-pointer hover:bg-[var(--surface-2)]">
                <Td mono nowrap><span className="font-semibold text-[var(--accent)]">{e.code}</span></Td>
                <Td>
                  <div className="text-[12.5px] text-[var(--ink)]">{e.activity}</div>
                  {e.rejected && <div className="mt-0.5 text-[11px] text-[var(--crit)]">✕ {e.rejected.note}</div>}
                  {e.note && !e.rejected && <div className="mt-0.5 text-[11px] text-[var(--warn)]">⚠ {e.note}</div>}
                </Td>
                <Td>{e.loc1}</Td>
                <Td>{e.loc2}</Td>
                <Td>{e.loc3}</Td>
                <Td nowrap>{e.unit}</Td>
                <Td right>{num(e.qty)}</Td>
                <Td>{e.company}</Td>
                <Td right>{e.people}</Td>
                <Td right>{num(e.people * e.hours)}</Td>
                <Td nowrap mono>{e.entered.by}</Td>
                <Td>
                  <div className="flex flex-col items-start gap-1"><ApprovalDots e={e} /><span className="text-[11px] font-semibold" style={{ color: `var(--${STAGE_TONE[st] === 'accent' ? 'accent' : STAGE_TONE[st]})` }}>{st}</span></div>
                </Td>
                <Td nowrap><span className="tnum">{date(e.date)}</span></Td>
                <Td nowrap center>
                  <RowActions name={e.code} onOpen={() => setOpen(e)} onEdit={() => setEditing(e)}
                    disabled={st === 'Onaylandı'} onDelete={() => setEntries((l) => l.filter((x) => x.id !== e.id))} />
                </Td>
              </tr>
            )
          })}
        </Table>
        {rows.length === 0 && <div className="px-4 py-8 text-center text-[12.5px] text-[var(--faint)]">Bu tarih aralığında kayıt yok.</div>}
      </Card>

      {open && <EntryModal entry={open} onClose={() => setOpen(null)} onChange={update} onEdit={() => { setEditing(open); setOpen(null) }} />}
      {editing && <EntryForm entry={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSave={(e) => { update(e); setEditing(null) }} />}
    </>
  )
}

/** Kaydın ayrıntısı ve onay adımları */
function EntryModal({ entry: e, onClose, onChange, onEdit }: {
  entry: SiteEntry; onClose: () => void; onChange: (e: SiteEntry) => void; onEdit: () => void
}) {
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')
  const st = stageOf(e)
  const chief = team.sectionChiefs[e.section] ?? 'b.yildiz'

  const fields: [string, string][] = [
    ['Aktivite kodu', e.code], ['Açıklama', e.activity], ['Lokasyon 1', e.loc1], ['Lokasyon 2', e.loc2], ['Lokasyon 3', e.loc3],
    ['Miktar', `${num(e.qty)} ${e.unit}`], ['Sorumlu firma', e.company], ['Personel', `${e.people} kişi × ${e.hours} saat`],
    ['inxsa', num(e.people * e.hours)], ['Not', e.note ?? '—'], ['Tarih', `${date(e.date)} · ${e.shift}`],
  ]
  const steps = [
    { title: 'Veri mühendisi girdi', a: e.entered },
    { title: `Kısım şefi onayı · ${e.section}`, a: e.sectionChief, wait: chief },
    { title: 'Şantiye şefi onayı', a: e.siteChief, wait: team.siteChief },
  ]

  return (
    <Modal title={`${e.code} · ${e.activity}`} note={`${e.loc1} / ${e.loc2} / ${e.loc3} · ${date(e.date)}`} onClose={onClose} wide
      footer={<>
        {st !== 'Onaylandı' && st !== 'Reddedildi' && !rejecting && <Btn onClick={() => setRejecting(true)}>Reddet / geri gönder</Btn>}
        {st !== 'Onaylandı' && <IconBtn icon="edit" title="Kaydı düzenle" onClick={onEdit} />}
        <span className="ml-auto flex gap-2">
          {st === 'Kısım şefi onayında' && <Btn primary onClick={() => onChange({ ...e, sectionChief: { by: chief, at: now() } })}>Kısım şefi olarak onayla</Btn>}
          {st === 'Şantiye şefi onayında' && <Btn primary onClick={() => onChange({ ...e, siteChief: { by: team.siteChief, at: now() } })}>Şantiye şefi olarak onayla</Btn>}
          {st === 'Reddedildi' && <Btn primary onClick={() => onChange({ ...e, rejected: undefined, sectionChief: undefined, entered: { by: e.entered.by, at: now() } })}>Düzeltildi, yeniden gönder</Btn>}
          {st === 'Onaylandı' && <Badge tone="ok" dot>Onaylandı — ilerleme, inxsa ve hakedişe aktarıldı</Badge>}
        </span>
      </>}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 md:col-span-3">
          {fields.map(([l, v]) => (
            <div key={l} className={l === 'Açıklama' || l === 'Not' ? 'col-span-2' : ''}>
              <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--faint)]">{l}</div>
              <div className="text-[12.5px] text-[var(--ink)]">{v}</div>
            </div>
          ))}
        </div>
        <div className="md:col-span-2">
          <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--faint)]">Onay adımları</div>
          <ol className="mt-2 flex flex-col gap-2.5">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full text-[10.5px] font-bold"
                  style={s.a ? { background: 'var(--ok)', color: '#fff' } : e.rejected && i > 0 ? { background: 'var(--crit-bg)', color: 'var(--crit)' } : { background: 'var(--surface-3)', color: 'var(--muted)' }}>
                  {s.a ? '✓' : i + 1}
                </span>
                <span className="text-[12px]">
                  <span className="block font-medium text-[var(--ink)]">{s.title}</span>
                  <span className="block text-[var(--muted)]">{s.a ? `${s.a.by} · ${s.a.at}` : e.rejected && i > 0 ? '—' : `Bekleniyor · ${s.wait}`}</span>
                </span>
              </li>
            ))}
          </ol>
          {e.rejected && (
            <div className="mt-3 rounded-md border px-2.5 py-2 text-[12px]" style={{ background: 'var(--crit-bg)', borderColor: 'var(--crit)', color: 'var(--crit)' }}>
              ✕ {e.rejected.by} geri gönderdi · {e.rejected.at}<br /><span className="text-[var(--ink)]">{e.rejected.note}</span>
            </div>
          )}
          <div className="mt-3 text-[10.5px] font-semibold uppercase tracking-wide text-[var(--faint)]">Saha fotoğrafı ({e.photos})</div>
          <div className="mt-1.5 grid grid-cols-4 gap-1.5">
            {Array.from({ length: Math.min(4, e.photos) }, (_, i) => (
              <span key={i} className="grid aspect-square place-items-center rounded-md text-[14px]"
                style={{ background: `hsl(${(e.id.charCodeAt(5) * 37 + i * 25) % 360} 35% 86%)` }}>📷</span>
            ))}
          </div>
        </div>
      </div>
      {rejecting && (
        <div className="mt-4 flex flex-col gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
          <Field label="Geri gönderme nedeni" value={note} onChange={setNote} placeholder="Ör. Miktar metraja göre fazla; aplikasyon ölçüsü eklensin" />
          <div className="flex justify-end gap-2">
            <Btn small onClick={() => setRejecting(false)}>Vazgeç</Btn>
            <button disabled={!note.trim()} onClick={() => { onChange({ ...e, rejected: { by: st === 'Kısım şefi onayında' ? chief : team.siteChief, at: now(), note: note.trim() } }); setRejecting(false) }}
              className="rounded-md border px-2 py-1 text-[12px] font-medium text-white disabled:opacity-45"
              style={{ background: 'var(--crit)', borderColor: 'var(--crit)' }}>Geri gönder</button>
          </div>
        </div>
      )}
    </Modal>
  )
}

/**
 * Veri giriş formu. Kolonlar sistemde tanımlıdır. Açıklama yazılırken iş programındaki
 * tanımlı aktiviteler önerilir; seçilince aktivite kodu, birim ve sorumlu firma kendiliğinden dolar.
 */
function EntryForm({ entry, onClose, onSave }: { entry: SiteEntry | null; onClose: () => void; onSave: (e: SiteEntry) => void }) {
  const [v, setV] = useState({
    date: entry?.date ?? '2026-09-26', activity: entry?.activity ?? '', code: entry?.code ?? '',
    loc1: entry?.loc1 ?? '', loc2: entry?.loc2 ?? '', loc3: entry?.loc3 ?? '', unit: entry?.unit ?? '',
    qty: entry ? String(entry.qty) : '', company: entry?.company ?? '', people: entry ? String(entry.people) : '',
    hours: entry ? String(entry.hours) : '10', note: entry?.note ?? '',
  })
  const [suggest, setSuggest] = useState(false)
  const set = (k: keyof typeof v) => (x: string) => setV((o) => ({ ...o, [k]: x }))
  const matches = scheduleActivities.filter((a) => {
    const s = v.activity.toLocaleLowerCase('tr')
    return !s || a.name.toLocaleLowerCase('tr').includes(s) || a.code.toLocaleLowerCase('tr').includes(s)
  }).slice(0, 6)
  const required: (keyof typeof v)[] = ['date', 'code', 'loc1', 'qty', 'company', 'people', 'hours']
  const missing = required.filter((k) => !v[k].trim())
  const inxsa = (Number(v.people) || 0) * (Number(v.hours) || 0)

  return (
    <Modal title={entry ? `${entry.code} düzenle` : 'Veri girişi'} wide onClose={onClose}
      note="Açıklamayı yazmaya başlayın; iş programındaki tanımlı aktiviteler önerilir. Kayıt kaydedilince kısım şefinin onayına düşer."
      footer={<>
        <span className="text-[11.5px] text-[var(--faint)]">{missing.length ? 'Aktivite, lokasyon 1, miktar, firma, personel ve saat zorunlu' : `${inxsa} inxsa · kısım şefi onayına gidecek`}</span>
        <span className="ml-auto flex gap-2">
          <Btn onClick={onClose}>Vazgeç</Btn>
          <Btn primary disabled={missing.length > 0} onClick={() => onSave({
            ...(entry ?? {
              id: `SA-${1047 + Math.floor(Math.random() * 50)}`, section: 'Kaba ve çelik', shift: 'Gündüz' as const, poz: '—',
              crew: v.company, weather: 'Açık', photos: 0, entered: { by: 'k.aslan', at: now() },
            }),
            date: v.date, activity: v.activity, code: v.code, loc1: v.loc1, loc2: v.loc2 || '—', loc3: v.loc3 || '—',
            area: [v.loc1, v.loc2].filter(Boolean).join(' · '), unit: v.unit, qty: Number(v.qty) || 0, company: v.company,
            people: Number(v.people) || 0, hours: Number(v.hours) || 0, note: v.note || undefined,
            ...(entry ? { sectionChief: undefined, siteChief: undefined, rejected: undefined } : {}),
          })}>Kaydet ve onaya gönder</Btn>
        </span>
      </>}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="relative sm:col-span-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Açıklama (aktivite) *</span>
            <input value={v.activity} placeholder="Ör. panel, epoksi, A-2140…"
              onFocus={() => setSuggest(true)} onBlur={() => setTimeout(() => setSuggest(false), 150)}
              onChange={(e) => { set('activity')(e.target.value); set('code')(''); setSuggest(true) }}
              className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-2 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--accent)]" />
          </label>
          {suggest && matches.length > 0 && (
            <div className="absolute left-0 right-0 top-[62px] z-50 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)] shadow-lg">
              {matches.map((a) => (
                <button key={a.code} onMouseDown={() => setV((o) => ({ ...o, activity: a.name, code: a.code, unit: a.unit, company: o.company || a.company }))}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12.5px] hover:bg-[var(--surface-2)]">
                  <span className="mono text-[11.5px] font-semibold text-[var(--accent)]">{a.code}</span>
                  <span className="text-[var(--ink)]">{a.name}</span>
                  <span className="ml-auto text-[11px] text-[var(--faint)]">{a.unit} · {a.company}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <Field label="Aktivite kodu *" value={v.code} onChange={set('code')} hint="Öneriden seçince dolar" />
        <Field label="Lokasyon 1 *" value={v.loc1} onChange={set('loc1')} placeholder="Bina" />
        <Field label="Lokasyon 2" value={v.loc2} onChange={set('loc2')} placeholder="Bölge / kat" />
        <Field label="Lokasyon 3" value={v.loc3} onChange={set('loc3')} placeholder="Aks" />
        <Field label="Tarih *" value={v.date} onChange={set('date')} type="date" />
        <Field label="Birim" value={v.unit} onChange={set('unit')} />
        <Field label="Miktar *" value={v.qty} onChange={set('qty')} type="number" />
        <Field label="Sorumlu firma *" value={v.company} onChange={set('company')} />
        <Field label="Personel sayısı *" value={v.people} onChange={set('people')} type="number" />
        <Field label="Çalışılan saat *" value={v.hours} onChange={set('hours')} type="number" hint={`= ${inxsa} inxsa`} />
        <div className="sm:col-span-3"><Field label="Not" value={v.note} onChange={set('note')} /></div>
        <div className="flex items-center gap-2 rounded-md border-2 border-dashed border-[var(--border-strong)] px-3 py-2 text-[12px] text-[var(--muted)] sm:col-span-4">
          📷 Saha fotoğrafı ekle — fotoğraflar kayda ve lokasyona bağlanır
        </div>
      </div>
    </Modal>
  )
}

/* ---------------- Günlük personel ---------------- */

export function DailyManpower() {
  const [rows, setRows] = useState<ManpowerRow[]>(manpowerRows)
  const [range, setRange] = useState<[string, string]>(PRESETS['Dün'])
  const [editing, setEditing] = useState<ManpowerRow | 'new' | null>(null)
  const inRange = rows.filter((r) => r.date >= range[0] && r.date <= range[1])
  const { filtered, head } = useColumnFilters(inRange, {
    company: (r) => r.company, trade: (r) => r.trade, loc1: (r) => r.loc1, people: (r) => String(r.people),
    hours: (r) => String(r.hours), inxsa: (r) => num(r.people * r.hours), by: (r) => r.by, date: (r) => date(r.date),
  })
  const people = filtered.reduce((a, r) => a + r.people, 0)
  const hours = filtered.reduce((a, r) => a + r.people * r.hours, 0)

  return (
    <>
      <PageHead title="Progress · Daily Manpower"
        note="Saha veri mühendisinin her gün girdiği personel kaydı: firma, meslek, kişi sayısı ve çalışılan saat. İnsan-saat (inxsa) analizleri ve raporlar bu kayıtlardan beslenir."
        right={<><ExportButtons /><Btn primary onClick={() => setEditing('new')}>+ Personel girişi</Btn></>} />
      <DateRange range={range} onApply={setRange} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Sahadaki personel" value={people} sub={`${new Set(filtered.map((r) => r.company)).size} firma`} tone="accent" />
        <Kpi label="İnsan-saat" value={num(hours)} sub="Kişi × saat" />
        <Kpi label="Kendi personelimiz" value={filtered.filter((r) => r.company === 'ICCM Construction').reduce((a, r) => a + r.people, 0)} sub="ICCM Construction" />
        <Kpi label="Alt yüklenici personeli" value={filtered.filter((r) => r.company !== 'ICCM Construction').reduce((a, r) => a + r.people, 0)} sub="Taşeron ekipler" />
      </div>
      <Card title={`Personel kayıtları (${filtered.length})`} pad={false}>
        <Table dense head={<tr>
          <Th>{head('company', 'Firma')}</Th><Th>{head('trade', 'Meslek')}</Th><Th>{head('loc1', 'Lokasyon')}</Th>
          <Th right>{head('people', 'Kişi')}</Th><Th right>{head('hours', 'Saat')}</Th><Th right>{head('inxsa', 'inxsa')}</Th>
          <Th>Not</Th><Th>{head('by', 'Veri giren')}</Th><Th>{head('date', 'Tarih')}</Th><Th w={80} center>İşlem</Th>
        </tr>}>
          {filtered.map((r) => (
            <tr key={r.id} className="hover:bg-[var(--surface-2)]">
              <Td nowrap><span className="font-medium text-[var(--ink)]">{r.company}</span></Td>
              <Td nowrap>{r.trade}</Td><Td nowrap>{r.loc1}</Td>
              <Td right>{r.people}</Td><Td right>{r.hours}</Td><Td right>{num(r.people * r.hours)}</Td>
              <Td><span className="text-[12px] text-[var(--muted)]">{r.note ?? '—'}</span></Td>
              <Td nowrap mono>{r.by}</Td><Td nowrap><span className="tnum">{date(r.date)}</span></Td>
              <Td nowrap center><RowActions name={`${r.company} · ${r.trade}`} onEdit={() => setEditing(r)} onDelete={() => setRows((l) => l.filter((x) => x.id !== r.id))} /></Td>
            </tr>
          ))}
        </Table>
      </Card>
      {editing && (
        <SimpleForm title={editing === 'new' ? 'Personel girişi' : 'Personel kaydını düzenle'} onClose={() => setEditing(null)}
          fields={[['company', 'Firma'], ['trade', 'Meslek'], ['loc1', 'Lokasyon'], ['people', 'Kişi sayısı', 'number'], ['hours', 'Çalışılan saat', 'number'], ['date', 'Tarih', 'date'], ['note', 'Not']]}
          initial={editing === 'new' ? { date: '2026-09-26', hours: '10' } : { ...editing, people: String(editing.people), hours: String(editing.hours) }}
          onSave={(v) => {
            const row: ManpowerRow = { id: editing === 'new' ? `MP-${Date.now()}` : editing.id, by: 'k.aslan', company: v.company, trade: v.trade, loc1: v.loc1, people: Number(v.people) || 0, hours: Number(v.hours) || 0, date: v.date, note: v.note || undefined }
            setRows((l) => (l.some((x) => x.id === row.id) ? l.map((x) => (x.id === row.id ? row : x)) : [row, ...l]))
            setEditing(null)
          }} />
      )}
    </>
  )
}

/* ---------------- Günlük makine-ekipman ---------------- */

const EQ_TONE: Record<EquipmentRow['state'], Tone> = { 'Çalıştı': 'ok', 'Beklemede': 'warn', 'Arızalı': 'crit' }

export function DailyEquipment() {
  const [rows, setRows] = useState<EquipmentRow[]>(equipmentRows)
  const [range, setRange] = useState<[string, string]>(PRESETS['Dün'])
  const [editing, setEditing] = useState<EquipmentRow | 'new' | null>(null)
  const inRange = rows.filter((r) => r.date >= range[0] && r.date <= range[1])
  const { filtered, head } = useColumnFilters(inRange, {
    machine: (r) => r.machine, plate: (r) => r.plate, ownership: (r) => r.ownership, operator: (r) => r.operator,
    work: (r) => String(r.workHours), idle: (r) => String(r.idleHours), fuel: (r) => num(r.fuel), loc1: (r) => r.loc1,
    state: (r) => r.state, by: (r) => r.by, date: (r) => date(r.date),
  })
  const work = filtered.reduce((a, r) => a + r.workHours, 0)
  const idle = filtered.reduce((a, r) => a + r.idleHours, 0)

  return (
    <>
      <PageHead title="Progress · Daily Equipment"
        note="Saha veri mühendisinin her gün girdiği makine-ekipman kaydı: çalışma ve bekleme saati, yakıt, operatör ve durum. Makine verimliliği ve raporlar bu kayıtlardan beslenir."
        right={<><ExportButtons /><Btn primary onClick={() => setEditing('new')}>+ Ekipman girişi</Btn></>} />
      <DateRange range={range} onApply={setRange} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Sahadaki makine" value={filtered.length} sub={`${filtered.filter((r) => r.ownership === 'Kira').length} kiralık`} tone="accent" />
        <Kpi label="Çalışma saati" value={num(work)} />
        <Kpi label="Bekleme saati" value={num(idle)} sub={`Toplamın %${Math.round((idle / ((work + idle) || 1)) * 100)}’i`} tone="warn" />
        <Kpi label="Yakıt" value={`${num(filtered.reduce((a, r) => a + r.fuel, 0))} lt`} />
        <Kpi label="Arızalı" value={filtered.filter((r) => r.state === 'Arızalı').length} tone="crit" />
      </div>
      <Card title={`Ekipman kayıtları (${filtered.length})`} pad={false}>
        <Table dense head={<tr>
          <Th>{head('machine', 'Makine')}</Th><Th>{head('plate', 'Plaka / no')}</Th><Th>{head('ownership', 'Mülkiyet')}</Th>
          <Th>{head('operator', 'Operatör')}</Th><Th right>{head('work', 'Çalışma sa.')}</Th><Th right>{head('idle', 'Bekleme sa.')}</Th>
          <Th right>{head('fuel', 'Yakıt (lt)')}</Th><Th>{head('loc1', 'Lokasyon')}</Th><Th>{head('state', 'Durum')}</Th>
          <Th>{head('by', 'Veri giren')}</Th><Th>{head('date', 'Tarih')}</Th><Th w={80} center>İşlem</Th>
        </tr>}>
          {filtered.map((r) => (
            <tr key={r.id} className="hover:bg-[var(--surface-2)]">
              <Td nowrap><span className="font-medium text-[var(--ink)]">{r.machine}</span></Td>
              <Td nowrap mono>{r.plate}</Td>
              <Td nowrap><Badge tone={r.ownership === 'Kira' ? 'warn' : 'ok'}>{r.ownership}</Badge></Td>
              <Td nowrap>{r.operator}</Td>
              <Td right>{r.workHours}</Td><Td right>{r.idleHours}</Td><Td right>{num(r.fuel)}</Td>
              <Td nowrap>{r.loc1}</Td>
              <Td nowrap><Badge tone={EQ_TONE[r.state]} dot>{r.state}</Badge></Td>
              <Td nowrap mono>{r.by}</Td><Td nowrap><span className="tnum">{date(r.date)}</span></Td>
              <Td nowrap center><RowActions name={`${r.machine} · ${r.plate}`} onEdit={() => setEditing(r)} onDelete={() => setRows((l) => l.filter((x) => x.id !== r.id))} /></Td>
            </tr>
          ))}
        </Table>
      </Card>
      {editing && (
        <SimpleForm title={editing === 'new' ? 'Ekipman girişi' : 'Ekipman kaydını düzenle'} onClose={() => setEditing(null)}
          fields={[['machine', 'Makine'], ['plate', 'Plaka / no'], ['operator', 'Operatör'], ['workHours', 'Çalışma saati', 'number'], ['idleHours', 'Bekleme saati', 'number'], ['fuel', 'Yakıt (lt)', 'number'], ['loc1', 'Lokasyon'], ['date', 'Tarih', 'date']]}
          initial={editing === 'new' ? { date: '2026-09-26' } : { ...editing, workHours: String(editing.workHours), idleHours: String(editing.idleHours), fuel: String(editing.fuel) }}
          onSave={(v) => {
            const row: EquipmentRow = {
              id: editing === 'new' ? `EQ-${Date.now()}` : editing.id, by: 'k.aslan', machine: v.machine, plate: v.plate, operator: v.operator,
              ownership: editing === 'new' ? 'Kira' : editing.ownership, workHours: Number(v.workHours) || 0, idleHours: Number(v.idleHours) || 0,
              fuel: Number(v.fuel) || 0, loc1: v.loc1, date: v.date, state: (Number(v.workHours) || 0) > 0 ? 'Çalıştı' : 'Beklemede',
            }
            setRows((l) => (l.some((x) => x.id === row.id) ? l.map((x) => (x.id === row.id ? row : x)) : [row, ...l]))
            setEditing(null)
          }} />
      )}
    </>
  )
}

/** Basit ekle / düzenle formu — alan listesiyle kurulur */
function SimpleForm({ title, fields, initial, onClose, onSave }: {
  title: string; fields: [string, string, string?][]; initial: Record<string, unknown>
  onClose: () => void; onSave: (v: Record<string, string>) => void
}) {
  const [v, setV] = useState<Record<string, string>>(Object.fromEntries(fields.map(([k]) => [k, String(initial[k] ?? '')])))
  const ready = fields.slice(0, 2).every(([k]) => v[k]?.trim())
  return (
    <Modal title={title} wide onClose={onClose}
      footer={<span className="ml-auto flex gap-2"><Btn onClick={onClose}>Vazgeç</Btn><Btn primary disabled={!ready} onClick={() => onSave(v)}>Kaydet</Btn></span>}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {fields.map(([k, l, t]) => <Field key={k} label={l} value={v[k] ?? ''} type={t ?? 'text'} onChange={(x) => setV((o) => ({ ...o, [k]: x }))} />)}
      </div>
    </Modal>
  )
}

/* ---------------- Disruptions (saha) ---------------- */

const CAT_TONE: Record<SiteDisruption['category'], Tone> = {
  'İşveren': 'crit', 'Tasarım': 'crit', 'Kamu kurumu': 'warn', 'Tedarik': 'warn', 'Ekip / verim': 'accent', 'Hava': 'neutral',
}
const DIS_TONE: Record<SiteDisruption['state'], Tone> = { 'Açık': 'crit', 'Çözümde': 'warn', 'Kapandı': 'ok', 'Hak talebine dönüştü': 'accent' }

export function ProgressDisruptions() {
  const [list, setList] = useState<SiteDisruption[]>(siteDisruptions)
  const [open, setOpen] = useState<SiteDisruption | null>(null)
  const [editing, setEditing] = useState<SiteDisruption | 'new' | null>(null)
  const { filtered: rows, head } = useColumnFilters(list, {
    title: (d) => d.title, activity: (d) => d.activity, category: (d) => d.category, days: (d) => String(d.effectDays),
    critical: (d) => (d.critical ? 'Evet' : 'Hayır'), hours: (d) => num(d.lostHours), cost: (d) => moneyShort(d.cost, prj.currency),
    owner: (d) => d.owner, state: (d) => d.state, date: (d) => date(d.date),
  })

  function save(d: SiteDisruption) {
    setList((l) => (l.some((x) => x.id === d.id) ? l.map((x) => (x.id === d.id ? d : x)) : [d, ...l]))
    setOpen((o) => (o && o.id === d.id ? d : o))
  }

  return (
    <>
      <PageHead title="Progress · Disruptions"
        note="Sahada verimsizlik oluşturan her olay sebep – etki – çözüm mantığıyla kaydedilir: ne oldu, programa ve maliyete etkisi ne, ne yapıldı. İşveren veya kurum kaynaklı olanlar kanıtlarıyla (kayıt, fotoğraf) hak talebine dönüştürülür."
        right={<><ExportButtons /><Btn primary onClick={() => setEditing('new')}>+ Aksaklık ekle</Btn></>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Aksaklık" value={list.length} sub={`${list.filter((d) => d.state === 'Açık' || d.state === 'Çözümde').length} açık`} />
        <Kpi label="Kayıp insan-saat" value={num(list.reduce((a, d) => a + d.lostHours, 0))} tone="warn" />
        <Kpi label="Maliyet etkisi" value={moneyShort(list.reduce((a, d) => a + d.cost, 0), prj.currency)} tone="crit" />
        <Kpi label="Kritik yola etki" value={`${list.filter((d) => d.critical).reduce((a, d) => a + d.effectDays, 0)} gün`} tone="crit" />
      </div>
      <Card title={`Aksaklıklar (${rows.length})`} help="Kolonlar ayrık tutulur; her sütun başlığından filtrelenir. Tarih son sütundadır." pad={false}>
        <Table dense head={
          <tr>
            <Th w={120}>{head('title', 'Aksaklık')}</Th>
            <Th w={100}>{head('activity', 'Etkilenen aktivite')}</Th>
            <Th>{head('category', 'Sebep')}</Th>
            <Th w={130}>Sebep açıklaması</Th>
            <Th right>{head('days', 'Gün')}</Th>
            <Th>{head('critical', 'Kritik yol')}</Th>
            <Th right>{head('hours', 'Kayıp inxsa')}</Th>
            <Th right>{head('cost', 'Maliyet')}</Th>
            <Th w={130}>Çözüm</Th>
            <Th>{head('owner', 'Sorumlu')}</Th>
            <Th>{head('state', 'Durum')}</Th>
            <Th>{head('date', 'Tarih')}</Th>
            <Th w={100} center>İşlem</Th>
          </tr>
        }>
          {rows.map((d) => (
            <tr key={d.id} onClick={() => setOpen(d)} className="cursor-pointer hover:bg-[var(--surface-2)]">
              <Td><span className="text-[12.5px] font-medium text-[var(--ink)]">{d.title}</span></Td>
              <Td><span className="text-[12px] text-[var(--ink)]">{d.activity}</span></Td>
              <Td nowrap><Badge tone={CAT_TONE[d.category]}>{d.category}</Badge></Td>
              <Td><span className="text-[12px] text-[var(--muted)]">{d.cause}</span></Td>
              <Td right>{d.effectDays || '—'}</Td>
              <Td nowrap>{d.critical ? <Badge tone="crit">Evet</Badge> : <span className="text-[var(--faint)]">Hayır</span>}</Td>
              <Td right>{num(d.lostHours)}</Td>
              <Td right><span className="whitespace-nowrap">{moneyShort(d.cost, prj.currency)}</span></Td>
              <Td><span className="text-[12px] text-[var(--ink)]">{d.solution}</span></Td>
              <Td nowrap mono>{d.owner}</Td>
              <Td nowrap>
                <Badge tone={DIS_TONE[d.state]} dot>{d.state}</Badge>
                {d.claim && <div className="mono mt-0.5 text-[11px] text-[var(--accent)]">{d.claim}</div>}
              </Td>
              <Td nowrap><span className="tnum">{date(d.date)}</span></Td>
              <Td nowrap center>
                <RowActions name={d.title} onOpen={() => setOpen(d)} onEdit={() => setEditing(d)}
                  onDelete={() => setList((l) => l.filter((x) => x.id !== d.id))} />
              </Td>
            </tr>
          ))}
        </Table>
      </Card>

      {open && (
        <Modal title={`${open.id} · ${open.title}`} note={`${open.activity} · ${date(open.date)} · sorumlu ${open.owner}`} wide onClose={() => setOpen(null)}
          footer={<>
            <IconBtn icon="edit" onClick={() => { setEditing(open); setOpen(null) }} />
            <span className="ml-auto flex gap-2">
              {!open.claim && ['İşveren', 'Tasarım', 'Kamu kurumu'].includes(open.category) && (
                <Btn primary onClick={() => save({ ...open, state: 'Hak talebine dönüştü', claim: `CL-${String(list.filter((x) => x.claim).length + 2).padStart(2, '0')}` })}>Hak talebine dönüştür</Btn>
              )}
              {open.state !== 'Kapandı' && !open.claim && <Btn onClick={() => save({ ...open, state: 'Kapandı' })}>Kapat</Btn>}
            </span>
          </>}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              { t: 'Sebep', v: open.cause, tone: 'var(--warn)' },
              { t: 'Etki', v: `${open.effectDays ? `${open.effectDays} gün${open.critical ? ' — kritik yolda, bitişi öteler' : ''}` : 'Süre etkisi yok'} · ${num(open.lostHours)} insan-saat kayıp · ${moneyShort(open.cost, prj.currency)}`, tone: 'var(--crit)' },
              { t: 'Çözüm', v: open.solution, tone: 'var(--ok)' },
            ].map((b) => (
              <div key={b.t} className="rounded-md border-l-[3px] bg-[var(--surface-2)] px-3 py-2" style={{ borderColor: b.tone }}>
                <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--faint)]">{b.t}</div>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--ink)]">{b.v}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[10.5px] font-semibold uppercase tracking-wide text-[var(--faint)]">Kanıt fotoğrafları ({open.photos})</div>
          <div className="mt-1.5 grid grid-cols-4 gap-2 md:grid-cols-6">
            {sitePhotos.filter((p) => p.disruption === open.id).map((p) => <PhotoThumb key={p.id} p={p} />)}
          </div>
        </Modal>
      )}

      {editing && <DisruptionForm d={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSave={(d) => { save(d); setEditing(null) }} />}
    </>
  )
}

function DisruptionForm({ d, onClose, onSave }: { d: SiteDisruption | null; onClose: () => void; onSave: (d: SiteDisruption) => void }) {
  const [v, setV] = useState({
    title: d?.title ?? '', activity: d?.activity ?? '', category: d?.category ?? 'İşveren', cause: d?.cause ?? '',
    effectDays: String(d?.effectDays ?? 0), lostHours: String(d?.lostHours ?? 0), cost: String(d?.cost ?? 0),
    solution: d?.solution ?? '', owner: d?.owner ?? 'h.demir', critical: d?.critical ?? false,
  })
  const set = (k: keyof typeof v) => (x: string) => setV((o) => ({ ...o, [k]: x }))
  const ready = v.title.trim().length > 3 && v.cause.trim().length > 3

  return (
    <Modal title={d ? `${d.id} düzenle` : 'Aksaklık ekle'} wide onClose={onClose} note="Sebep – etki – çözüm: ne oldu, programa ve maliyete etkisi ne, ne yapılıyor."
      footer={<span className="ml-auto flex gap-2">
        <Btn onClick={onClose}>Vazgeç</Btn>
        <Btn primary disabled={!ready} onClick={() => onSave({
          ...(d ?? { id: `DS-${String(Math.floor(Math.random() * 90) + 10)}`, date: '2026-09-27', state: 'Açık' as const, photos: 0 }),
          title: v.title.trim(), activity: v.activity.trim(), category: v.category as SiteDisruption['category'], cause: v.cause.trim(),
          effectDays: Number(v.effectDays) || 0, lostHours: Number(v.lostHours) || 0, cost: Number(v.cost) || 0,
          solution: v.solution.trim(), owner: v.owner.trim(), critical: v.critical,
        })}>Kaydet</Btn>
      </span>}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2"><Field label="Aksaklık" value={v.title} onChange={set('title')} /></div>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Sebep kategorisi</span>
          <select value={v.category} onChange={(e) => set('category')(e.target.value)} className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-2 text-[13px] text-[var(--ink)] outline-none">
            {Object.keys(CAT_TONE).map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <div className="sm:col-span-3"><Field label="Etkilenen aktivite" value={v.activity} onChange={set('activity')} /></div>
        <div className="sm:col-span-3"><Field label="Sebep" value={v.cause} onChange={set('cause')} /></div>
        <Field label="Program etkisi (gün)" value={v.effectDays} onChange={set('effectDays')} type="number" />
        <Field label="Kayıp insan-saat" value={v.lostHours} onChange={set('lostHours')} type="number" />
        <Field label={`Maliyet (${prj.currency})`} value={v.cost} onChange={set('cost')} type="number" />
        <div className="sm:col-span-2"><Field label="Çözüm / aksiyon" value={v.solution} onChange={set('solution')} /></div>
        <Field label="Sorumlu" value={v.owner} onChange={set('owner')} />
        <label className="flex items-center gap-2 text-[12.5px] text-[var(--ink)]">
          <input type="checkbox" checked={v.critical} onChange={() => setV((o) => ({ ...o, critical: !o.critical }))} /> Kritik yolda
        </label>
      </div>
    </Modal>
  )
}

/* ---------------- Site Photos ---------------- */

function PhotoThumb({ p, onClick }: { p: SitePhoto; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="group overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)] text-left">
      <span className="relative grid aspect-[4/3] place-items-center text-[22px]"
        style={{ background: `linear-gradient(135deg, hsl(${p.hue} 35% 82%), hsl(${p.hue} 30% 68%))` }}>
        📷
        <span className="absolute bottom-1 left-1 rounded bg-black/45 px-1.5 py-0.5 text-[10px] text-white">{date(p.date)}</span>
      </span>
      <span className="block truncate px-2 py-1.5 text-[11.5px] text-[var(--ink)] group-hover:text-[var(--accent)]">{p.caption}</span>
    </button>
  )
}

type PhotoFilter = 'Tümü' | 'Kayıtlara bağlı' | 'Aksaklıklara bağlı'

export function SitePhotos() {
  const [photos, setPhotos] = useState<SitePhoto[]>(sitePhotos)
  const [filter, setFilter] = useState<PhotoFilter>('Tümü')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<SitePhoto | null>(null)

  const rows = photos.filter((p) => {
    if (filter === 'Kayıtlara bağlı' && !p.entry) return false
    if (filter === 'Aksaklıklara bağlı' && !p.disruption) return false
    if (q.trim()) {
      const s = q.toLocaleLowerCase('tr')
      return [p.caption, p.activity, p.area, p.by].some((v) => v.toLocaleLowerCase('tr').includes(s))
    }
    return true
  })

  return (
    <>
      <PageHead title="Progress · Site Photos"
        note="Veri sorumlusunun mobilden eklediği saha fotoğrafları. Her fotoğraf tarih, konum ve aktiviteyle birlikte bir saha kaydına ya da aksaklığa bağlanır; hak taleplerinde kanıt olarak kullanılır."
        right={<Btn primary onClick={() => setPhotos((l) => [{ id: `P-${312 + l.length}`, date: '2026-09-27', activity: 'Genel', area: 'Saha', by: 'k.aslan', caption: 'Yeni yüklenen fotoğraf', hue: 160 }, ...l])}>+ Fotoğraf yükle</Btn>} />
      <div className="flex flex-wrap items-center gap-2">
        <Chips<PhotoFilter> value={filter} onChange={setFilter} items={(['Tümü', 'Kayıtlara bağlı', 'Aksaklıklara bağlı'] as PhotoFilter[]).map((k) => ({
          key: k, label: k, count: k === 'Tümü' ? photos.length : photos.filter((p) => (k === 'Kayıtlara bağlı' ? p.entry : p.disruption)).length,
        }))} />
        <div className="ml-auto"><Search value={q} onChange={setQ} placeholder="Aktivite, bölge, açıklama…" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        {rows.map((p) => <PhotoThumb key={p.id} p={p} onClick={() => setOpen(p)} />)}
      </div>

      {open && (
        <Modal title={open.caption} note={`${open.id} · ${date(open.date)} · ${open.by}`} wide onClose={() => setOpen(null)}
          footer={<>
            <RowActions name={open.caption} onDelete={() => { setPhotos((l) => l.filter((x) => x.id !== open.id)); setOpen(null) }} />
            <span className="ml-auto"><Btn onClick={() => setOpen(null)}>Kapat</Btn></span>
          </>}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="grid aspect-[4/3] place-items-center rounded-md text-[40px] md:col-span-2"
              style={{ background: `linear-gradient(135deg, hsl(${open.hue} 35% 82%), hsl(${open.hue} 30% 62%))` }}>📷</div>
            <div className="flex flex-col gap-2 text-[12.5px]">
              {[['Aktivite', open.activity], ['Bölge', open.area], ['Tarih', date(open.date)], ['Çeken', open.by],
                ['Bağlı kayıt', open.entry ?? '—'], ['Bağlı aksaklık', open.disruption ?? '—']].map(([l, v]) => (
                <div key={l}>
                  <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--faint)]">{l}</div>
                  <div className="text-[var(--ink)]">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
