import { useState } from 'react'
import {
  Badge, Btn, Card, Chips, ColumnFilter, ExportButtons, Field, IconBtn, Kpi, Modal, PageHead, RowActions,
  Search, Switch, Table, Td, Th,
} from '../../components/ui'
import type { Tone } from '../../components/ui'
import { date, moneyShort, num, pct } from '../../lib/format'
import { Legend, MonthColumns, PairBars } from '../charts'
import { actualCum, plannedCum, prj } from '../data'
import {
  entryColumns, groupProgress, siteDisruptions, siteEntries, sitePhotos, stageOf, team, weeklyOutput,
} from '../progressData'
import type { EntryColumn, SiteDisruption, SiteEntry, SitePhoto, Stage } from '../progressData'

/**
 * Progress alt modülü: sahadan veri girişi, 3'lü onay, aksaklıklar ve saha fotoğrafları.
 * Veri mühendisi girer → kısım şefi onaylar → şantiye şefi onaylar; şantiye şefi onayı olmadan kayıt işlenmez.
 */

const STAGE_TONE: Record<Stage, Tone> = {
  'Kısım şefi onayında': 'warn', 'Şantiye şefi onayında': 'accent', 'İşlendi': 'ok', 'Reddedildi': 'crit',
}
const now = () => new Date().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

/* ---------------- Onay akışı şeridi ---------------- */

function Pipeline({ entries, value, onPick }: { entries: SiteEntry[]; value?: Stage | 'Tümü'; onPick?: (s: Stage | 'Tümü') => void }) {
  const steps: { stage: Stage; who: string }[] = [
    { stage: 'Kısım şefi onayında', who: 'Veri mühendisi girdi' },
    { stage: 'Şantiye şefi onayında', who: 'Kısım şefi onayladı' },
    { stage: 'İşlendi', who: 'Şantiye şefi onayladı' },
    { stage: 'Reddedildi', who: 'Geri gönderildi' },
  ]
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {steps.map((s, i) => {
        const n = entries.filter((e) => stageOf(e) === s.stage).length
        const on = value === s.stage
        return (
          <button key={s.stage} onClick={() => onPick?.(on ? 'Tümü' : s.stage)}
            className="relative flex items-center gap-3 rounded-lg border bg-[var(--surface)] px-3.5 py-2.5 text-left transition-colors"
            style={{ borderColor: on ? `var(--${STAGE_TONE[s.stage] === 'accent' ? 'accent' : STAGE_TONE[s.stage]})` : 'var(--border)' }}>
            <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full text-[13px] font-bold tnum"
              style={{ background: STAGE_TONE[s.stage] === 'accent' ? 'var(--accent-soft)' : `var(--${STAGE_TONE[s.stage]}-bg)`, color: STAGE_TONE[s.stage] === 'accent' ? 'var(--accent)' : `var(--${STAGE_TONE[s.stage]})` }}>{n}</span>
            <span className="min-w-0">
              <span className="block text-[12.5px] font-semibold text-[var(--ink)]">{s.stage}</span>
              <span className="block text-[11px] text-[var(--muted)]">{i < 3 ? `${i + 1}. adım · ` : ''}{s.who}</span>
            </span>
            {i < 2 && <span className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 text-[var(--faint)] lg:block">›</span>}
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
  const actual = actualCum[prj.today - 1]
  const planned = plannedCum[prj.today - 1]
  const yesterday = siteEntries.filter((e) => e.date === '2026-09-25')
  const pending = siteEntries.filter((e) => ['Kısım şefi onayında', 'Şantiye şefi onayında'].includes(stageOf(e)))
  const openDis = siteDisruptions.filter((d) => d.state === 'Açık' || d.state === 'Çözümde')

  return (
    <>
      <PageHead title="Progress · Dashboard" note="Genel ilerlemeler ve KPI’lar. Sayılar sahadan girilip şantiye şefi onayından geçmiş kayıtlardan hesaplanır; onay bekleyen kayıtlar henüz ilerlemeye yansımaz." right={<ExportButtons />} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Fiziksel ilerleme" value={pct(actual)} sub={`Planlanan ${pct(planned)}`} tone="accent" />
        <Kpi label="Dünkü kayıt" value={yesterday.length} sub={`${yesterday.reduce((a, e) => a + e.people, 0)} kişi · ${num(yesterday.reduce((a, e) => a + e.people * e.hours, 0))} inxsa`} />
        <Kpi label="Onay bekleyen" value={pending.length} sub="İlerlemeye henüz yansımadı" tone="warn"
          help="Kısım şefi veya şantiye şefi onayı bekleyen kayıtlar. Şantiye şefi onaylamadan kayıt işlenmez." />
        <Kpi label="Reddedilen" value={siteEntries.filter((e) => e.rejected).length} sub="Düzeltilip yeniden girilecek" tone="crit" />
        <Kpi label="Açık aksaklık" value={openDis.length} sub={`${openDis.reduce((a, d) => a + d.lostHours, 0).toLocaleString('tr-TR')} saat kayıp`} tone="warn" />
      </div>

      <Card title="Onay akışı" help="Veri mühendisi girer → kısım şefi onaylar → şantiye şefi onaylar. Kutuya tıklayınca o aşamadaki kayıtlar Site Activity’de açılır.">
        <Pipeline entries={siteEntries} onPick={() => onGo('site_activity')} />
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="İş gruplarına göre ilerleme" help="Açık çubuk bugün olması gereken, koyu çubuk onaylanmış kayıtlardan gerçekleşen ilerleme."
          right={<Legend items={[{ label: 'Gerçekleşen', color: 'var(--series-1)' }, { label: 'Planlanan', color: 'var(--series-2)' }]} />}>
          <PairBars rows={groupProgress.map((g) => ({ label: g.group, plan: g.plan, actual: g.actual }))} format={(v) => `%${v}`} worseWhen="lower" />
        </Card>
        <Card title="Haftalık üretim (bin EUR)" help="Onaylanmış kayıtların iş değeri: miktar × sözleşme birim fiyatı."
          right={<Legend items={[{ label: 'Gerçekleşen', color: 'var(--series-1)' }, { label: 'Planlanan', color: 'var(--series-2)' }]} />}>
          <MonthColumns data={weeklyOutput.map((w) => ({ label: w.w, plan: w.plan, actual: w.actual }))} format={(v) => `${num(v)} bin EUR`} height={170} />
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

type Period = 'Dün' | 'Son 3 gün' | 'Tümü'

export function SiteActivity() {
  const [entries, setEntries] = useState<SiteEntry[]>(siteEntries)
  const [columns, setColumns] = useState<EntryColumn[]>(entryColumns)
  const [period, setPeriod] = useState<Period>('Son 3 gün')
  const [stage, setStage] = useState<Stage | 'Tümü'>('Tümü')
  const [sectionFilter, setSectionFilter] = useState('Tümü')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<SiteEntry | null>(null)
  const [editing, setEditing] = useState<SiteEntry | 'new' | null>(null)
  const [showColumns, setShowColumns] = useState(false)
  const [showMobile, setShowMobile] = useState(false)

  const inPeriod = (e: SiteEntry) => period === 'Tümü' || (period === 'Dün' ? e.date === '2026-09-25' : e.date >= '2026-09-23')
  const rows = entries.filter((e) => {
    if (!inPeriod(e)) return false
    if (stage !== 'Tümü' && stageOf(e) !== stage) return false
    if (sectionFilter !== 'Tümü' && e.section !== sectionFilter) return false
    if (q.trim()) {
      const s = q.toLocaleLowerCase('tr')
      return [e.id, e.activity, e.area, e.crew, e.poz].some((v) => v.toLocaleLowerCase('tr').includes(s))
    }
    return true
  })

  function update(e: SiteEntry) {
    setEntries((l) => (l.some((x) => x.id === e.id) ? l.map((x) => (x.id === e.id ? e : x)) : [e, ...l]))
    setOpen((o) => (o && o.id === e.id ? e : o))
  }

  return (
    <>
      <PageHead
        title="Progress · Site Activity"
        note="Tanımlı veri girişi kullanıcılarının sahadan eklediği kayıtlar, iş akışı olarak ve seçilen periyotta. Her kayıt 3’lü onaya tabidir: veri mühendisi → kısım şefi → şantiye şefi. Şantiye şefi onayı olmadan kayıt işleme (ilerleme, inxsa, hakediş) aktarılmaz. Giriş formu bütün projelerde ortak veri formatını kullanır; kolonlar proje özelinde aktif veya pasif yapılır."
        right={<>
          <ExportButtons />
          <Btn onClick={() => setShowColumns(true)} title="Bu projede formda hangi kolonların kullanılacağı">Kolonlar</Btn>
          <Btn onClick={() => setShowMobile(true)} title="Sahadan telefonla giriş ekranı">📱 Mobil giriş</Btn>
          <Btn primary onClick={() => setEditing('new')}>+ Veri girişi</Btn>
        </>}
      />

      <Pipeline entries={entries.filter(inPeriod)} value={stage} onPick={setStage} />

      <div className="flex flex-wrap items-center gap-2">
        <Chips<Period> value={period} onChange={setPeriod} items={(['Dün', 'Son 3 gün', 'Tümü'] as Period[]).map((p) => ({ key: p, label: p }))} />
        {stage !== 'Tümü' && <Badge tone={STAGE_TONE[stage]}>Aşama: {stage} · <button onClick={() => setStage('Tümü')}>×</button></Badge>}
        <div className="ml-auto"><Search value={q} onChange={setQ} placeholder="Kayıt, aktivite, bölge…" /></div>
      </div>

      <Card title={`Kayıtlar (${rows.length})`} help="Nokta sırası: girildi · kısım şefi · şantiye şefi. Göz simgesiyle kayıt açılır ve onay verilir; kalem ve çöp kutusu yalnızca henüz işlenmemiş kayıtlarda çalışır." pad={false}>
        <Table head={
          <tr>
            <Th w={96}>Kayıt</Th>
            <Th w={250}>
              <span className="flex items-center gap-1.5">
                Aktivite ve bölge
                <ColumnFilter value={sectionFilter} onChange={setSectionFilter} values={[...new Set(entries.map((e) => e.section))]} />
              </span>
            </Th>
            <Th right>Miktar</Th>
            <Th w={150}>Ekip · inxsa</Th>
            <Th center>Onay</Th>
            <Th>Durum</Th>
            <Th w={100} center>İşlem</Th>
          </tr>
        }>
          {rows.map((e) => {
            const st = stageOf(e)
            const locked = st === 'İşlendi'
            return (
              <tr key={e.id} onClick={() => setOpen(e)} className="cursor-pointer hover:bg-[var(--surface-2)]">
                <Td nowrap>
                  <div className="mono text-[11.5px] font-semibold text-[var(--accent)]">{e.id}</div>
                  <div className="text-[11px] text-[var(--faint)]">{date(e.date)} · {e.shift}</div>
                </Td>
                <Td>
                  <div className="text-[12.5px] font-medium text-[var(--ink)]">{e.activity}</div>
                  <div className="text-[11px] text-[var(--muted)]">{e.area} · poz {e.poz}</div>
                  {e.note && <div className="mt-0.5 text-[11px] text-[var(--warn)]">⚠ {e.note}</div>}
                  {e.rejected && <div className="mt-0.5 text-[11px] text-[var(--crit)]">✕ {e.rejected.by}: {e.rejected.note}</div>}
                </Td>
                <Td right nowrap><b>{num(e.qty)}</b> <span className="text-[var(--muted)]">{e.unit}</span></Td>
                <Td>
                  <div className="text-[12px] text-[var(--ink)]">{e.crew}</div>
                  <div className="text-[11px] text-[var(--muted)] tnum">{e.people} kişi × {e.hours} sa = {e.people * e.hours} inxsa</div>
                </Td>
                <Td nowrap center><ApprovalDots e={e} /></Td>
                <Td nowrap><Badge tone={STAGE_TONE[st]} dot>{st}</Badge></Td>
                <Td nowrap center>
                  <RowActions name={e.id} onOpen={() => setOpen(e)} onEdit={() => setEditing(e)}
                    disabled={locked} onDelete={() => setEntries((l) => l.filter((x) => x.id !== e.id))} />
                </Td>
              </tr>
            )
          })}
        </Table>
      </Card>

      {open && <EntryModal entry={open} columns={columns} onClose={() => setOpen(null)} onChange={update} onEdit={() => { setEditing(open); setOpen(null) }} />}
      {editing && <EntryForm entry={editing === 'new' ? null : editing} columns={columns} onClose={() => setEditing(null)}
        onSave={(e) => { update(e); setEditing(null) }} />}
      {showColumns && <ColumnsModal columns={columns} onClose={() => setShowColumns(false)} onChange={setColumns} />}
      {showMobile && <MobileModal columns={columns} onClose={() => setShowMobile(false)} />}
    </>
  )
}

/** Kaydın ayrıntısı ve onay adımları */
function EntryModal({ entry: e, columns, onClose, onChange, onEdit }: {
  entry: SiteEntry; columns: EntryColumn[]; onClose: () => void; onChange: (e: SiteEntry) => void; onEdit: () => void
}) {
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')
  const st = stageOf(e)
  const active = (k: string) => columns.find((c) => c.key === k)?.active
  const chief = team.sectionChiefs[e.section] ?? 'b.yildiz'

  const fields: [string, string, string][] = [
    ['date', 'Tarih', date(e.date)], ['shift', 'Vardiya', e.shift], ['activity', 'Aktivite', e.activity], ['poz', 'Poz no', e.poz],
    ['area', 'Bölge / aks', e.area], ['level', 'Kat / kot', e.level ?? '—'], ['qty', 'Miktar', `${num(e.qty)} ${e.unit}`],
    ['crew', 'Ekip / taşeron', e.crew], ['people', 'Kişi sayısı', String(e.people)], ['hours', 'Çalışılan saat', `${e.hours} sa · ${e.people * e.hours} inxsa`],
    ['machine', 'Makine', e.machine ?? '—'], ['machineHours', 'Makine saati', e.machineHours ? `${e.machineHours} sa` : '—'],
    ['weather', 'Hava durumu', e.weather], ['waste', 'Fire', e.waste ? `%${e.waste}` : '—'], ['note', 'Not', e.note ?? '—'],
  ]

  const steps = [
    { title: 'Veri mühendisi girdi', a: e.entered },
    { title: `Kısım şefi onayı · ${e.section}`, a: e.sectionChief, wait: chief },
    { title: 'Şantiye şefi onayı', a: e.siteChief, wait: team.siteChief },
  ]

  return (
    <Modal title={`${e.id} · ${e.activity}`} note={`${e.area} · ${date(e.date)} · ${e.shift} vardiyası`} onClose={onClose} wide
      footer={<>
        {st !== 'İşlendi' && st !== 'Reddedildi' && !rejecting && <Btn onClick={() => setRejecting(true)}>Reddet / geri gönder</Btn>}
        {st !== 'İşlendi' && <IconBtn icon="edit" title="Kaydı düzenle" onClick={onEdit} />}
        <span className="ml-auto flex gap-2">
          {st === 'Kısım şefi onayında' && <Btn primary onClick={() => onChange({ ...e, sectionChief: { by: chief, at: now() } })}>Kısım şefi olarak onayla</Btn>}
          {st === 'Şantiye şefi onayında' && <Btn primary onClick={() => onChange({ ...e, siteChief: { by: team.siteChief, at: now() } })}>Şantiye şefi olarak onayla</Btn>}
          {st === 'Reddedildi' && <Btn primary onClick={() => onChange({ ...e, rejected: undefined, sectionChief: undefined, entered: { by: e.entered.by, at: now() } })}>Düzeltildi, yeniden gönder</Btn>}
          {st === 'İşlendi' && <Badge tone="ok" dot>İşlendi — ilerleme, inxsa ve hakedişe aktarıldı</Badge>}
        </span>
      </>}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 md:col-span-3">
          {fields.filter(([k]) => active(k)).map(([k, l, v]) => (
            <div key={k} className={k === 'note' || k === 'activity' ? 'col-span-2' : ''}>
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
          {active('photos') && (
            <div className="mt-3">
              <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--faint)]">Saha fotoğrafı ({e.photos})</div>
              <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                {Array.from({ length: Math.min(4, e.photos) }, (_, i) => (
                  <span key={i} className="grid aspect-square place-items-center rounded-md text-[14px]"
                    style={{ background: `hsl(${(e.id.charCodeAt(5) * 37 + i * 25) % 360} 35% 86%)` }}>📷</span>
                ))}
              </div>
            </div>
          )}
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

/** Veri giriş formu — yalnızca projede aktif olan kolonlar görünür */
function EntryForm({ entry, columns, onClose, onSave }: {
  entry: SiteEntry | null; columns: EntryColumn[]; onClose: () => void; onSave: (e: SiteEntry) => void
}) {
  const [v, setV] = useState<Record<string, string>>({
    date: entry?.date ?? '2026-09-26', shift: entry?.shift ?? 'Gündüz', activity: entry?.activity ?? '', poz: entry?.poz ?? '',
    area: entry?.area ?? '', level: entry?.level ?? '', qty: entry ? String(entry.qty) : '', unit: entry?.unit ?? 'm²',
    crew: entry?.crew ?? '', people: entry ? String(entry.people) : '', hours: entry ? String(entry.hours) : '10',
    machine: entry?.machine ?? '', machineHours: entry?.machineHours ? String(entry.machineHours) : '',
    weather: entry?.weather ?? 'Açık', waste: entry?.waste ? String(entry.waste) : '', material: '', note: entry?.note ?? '',
  })
  const set = (k: string) => (x: string) => setV((o) => ({ ...o, [k]: x }))
  const active = columns.filter((c) => c.active && c.key !== 'photos')
  const missing = active.filter((c) => c.required && !v[c.key]?.trim())
  const inxsa = (Number(v.people) || 0) * (Number(v.hours) || 0)

  return (
    <Modal title={entry ? `${entry.id} düzenle` : 'Veri girişi'} wide onClose={onClose}
      note="Kayıt kaydedilince kısım şefinin onayına düşer. Kişi × saat otomatik insan-saate (inxsa) çevrilir."
      footer={<>
        <span className="text-[11.5px] text-[var(--faint)]">{missing.length ? `Zorunlu: ${missing.map((m) => m.label).join(', ')}` : `${inxsa} inxsa · kısım şefi onayına gidecek`}</span>
        <span className="ml-auto flex gap-2">
          <Btn onClick={onClose}>Vazgeç</Btn>
          <Btn primary disabled={missing.length > 0} onClick={() => onSave({
            ...(entry ?? { id: `SA-${1047 + Math.floor(Math.random() * 50)}`, section: 'Kaba ve çelik', photos: 0, entered: { by: 'k.aslan', at: now() } }),
            date: v.date, shift: v.shift as SiteEntry['shift'], activity: v.activity, poz: v.poz, area: v.area, level: v.level || undefined,
            qty: Number(v.qty) || 0, unit: v.unit, crew: v.crew, people: Number(v.people) || 0, hours: Number(v.hours) || 0,
            machine: v.machine || undefined, machineHours: Number(v.machineHours) || undefined, weather: v.weather,
            waste: Number(v.waste) || undefined, note: v.note || undefined,
            ...(entry ? { sectionChief: undefined, siteChief: undefined, rejected: undefined } : {}),
          })}>Kaydet ve onaya gönder</Btn>
        </span>
      </>}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {active.map((c) => {
          if (c.key === 'shift') return (
            <label key={c.key} className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">{c.label}</span>
              <select value={v.shift} onChange={(e) => set('shift')(e.target.value)} className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-2 text-[13px] text-[var(--ink)] outline-none">
                <option>Gündüz</option><option>Gece</option>
              </select>
            </label>
          )
          if (c.key === 'qty') return (
            <div key={c.key} className="grid grid-cols-[1fr_72px] gap-1.5">
              <Field label={`${c.label}${c.required ? ' *' : ''}`} value={v.qty} onChange={set('qty')} type="number" />
              <Field label="Birim" value={v.unit} onChange={set('unit')} />
            </div>
          )
          return (
            <div key={c.key} className={c.key === 'note' || c.key === 'activity' ? 'sm:col-span-2' : ''}>
              <Field label={`${c.label}${c.required ? ' *' : ''}`} value={v[c.key] ?? ''} onChange={set(c.key)} hint={c.hint}
                type={['date'].includes(c.key) ? 'date' : ['people', 'hours', 'machineHours', 'waste'].includes(c.key) ? 'number' : 'text'} />
            </div>
          )
        })}
        {columns.find((c) => c.key === 'photos')?.active && (
          <div className="flex items-center gap-2 rounded-md border-2 border-dashed border-[var(--border-strong)] px-3 py-2 text-[12px] text-[var(--muted)] sm:col-span-3">
            📷 Saha fotoğrafı ekle — telefondan çekilen fotoğraflar kayda ve konuma bağlanır
          </div>
        )}
      </div>
    </Modal>
  )
}

/** Proje özelinde kolonların aktif / pasif yapılması */
function ColumnsModal({ columns, onClose, onChange }: { columns: EntryColumn[]; onClose: () => void; onChange: (c: EntryColumn[]) => void }) {
  return (
    <Modal title="Veri giriş kolonları" wide onClose={onClose}
      note="Kolonlar bütün projelerde ortak veri formatından gelir. Bu projede kullanılmayanları pasife çekin: formda görünmezler ama format bozulmaz, girilen her veri arka planda aynı yapıda birikir (know-how). Zorunlu kolonlar kapatılamaz."
      footer={<span className="ml-auto"><Btn primary onClick={onClose}>Tamam</Btn></span>}>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {columns.map((c) => (
          <div key={c.key} className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
            <span className="text-[12.5px] text-[var(--ink)]">{c.label}</span>
            {c.required && <Badge tone="neutral">zorunlu</Badge>}
            <span className="ml-auto">
              <Switch on={c.active} disabled={c.required}
                onChange={(on) => onChange(columns.map((x) => (x.key === c.key ? { ...x, active: on } : x)))} />
            </span>
          </div>
        ))}
      </div>
    </Modal>
  )
}

/** Sahadan telefonla giriş — veri sorumlusunun göreceği ekranın önizlemesi */
function MobileModal({ columns, onClose }: { columns: EntryColumn[]; onClose: () => void }) {
  const shown = columns.filter((c) => c.active && ['activity', 'area', 'qty', 'crew', 'people', 'hours', 'note'].includes(c.key))
  return (
    <Modal title="Mobil veri girişi" onClose={onClose}
      note="Veri sorumlusu sahadan telefonla kayıt girer, fotoğraf ekler ve kaydının onay durumunu takip eder. Form, bu projede aktif olan kolonlarla oluşur."
      footer={<span className="ml-auto"><Btn onClick={onClose}>Kapat</Btn></span>}>
      <div className="mx-auto w-[280px] rounded-[34px] border-[9px] border-[#1f2733] bg-[var(--surface-2)] shadow-xl">
        <div className="flex items-center justify-between rounded-t-[24px] bg-[var(--accent)] px-4 pb-2.5 pt-3 text-white">
          <span className="text-[12px] font-semibold">Yeni kayıt</span>
          <span className="text-[10.5px] opacity-80">{prj.code}</span>
        </div>
        <div className="flex flex-col gap-2 p-3">
          {shown.map((c) => (
            <div key={c.key} className="rounded-lg bg-[var(--surface)] px-3 py-1.5 shadow-sm">
              <div className="text-[9.5px] font-semibold uppercase tracking-wide text-[var(--faint)]">{c.label}</div>
              <div className="text-[12px] text-[var(--muted)]">{c.key === 'activity' ? 'Sandviç panel montajı ▾' : c.key === 'area' ? 'Depo B · kuzey cephe ▾' : '…'}</div>
            </div>
          ))}
          <div className="grid grid-cols-3 gap-1.5">
            {[0, 1].map((i) => <span key={i} className="grid aspect-square place-items-center rounded-lg text-[16px]" style={{ background: `hsl(${200 + i * 20} 35% 85%)` }}>📷</span>)}
            <span className="grid aspect-square place-items-center rounded-lg border-2 border-dashed border-[var(--border-strong)] text-[18px] text-[var(--muted)]">＋</span>
          </div>
          <div className="mt-1 rounded-lg bg-[var(--accent)] py-2 text-center text-[12.5px] font-semibold text-white">Onaya gönder</div>
          <div className="pb-1 text-center text-[10px] text-[var(--faint)]">Konum ve saat otomatik eklenir</div>
        </div>
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
  const [catFilter, setCatFilter] = useState('Tümü')
  const [open, setOpen] = useState<SiteDisruption | null>(null)
  const [editing, setEditing] = useState<SiteDisruption | 'new' | null>(null)
  const rows = list.filter((d) => catFilter === 'Tümü' || d.category === catFilter)

  function save(d: SiteDisruption) {
    setList((l) => (l.some((x) => x.id === d.id) ? l.map((x) => (x.id === d.id ? d : x)) : [d, ...l]))
    setOpen((o) => (o && o.id === d.id ? d : o))
  }

  return (
    <>
      <PageHead title="Progress · Disruptions"
        note="Sahada verimsizlik oluşturan her olay sebep – etki – çözüm mantığıyla kaydedilir: ne oldu, programa ve maliyete etkisi ne, ne yapıldı. İşveren veya kurum kaynaklı olanlar kanıtlarıyla (kayıt, fotoğraf) hak talebine dönüştürülür."
        right={<><ExportButtons /><Btn primary onClick={() => setEditing('new')}>+ Aksaklık ekle</Btn></>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Aksaklık" value={list.length} sub={`${list.filter((d) => d.state === 'Açık' || d.state === 'Çözümde').length} açık`} />
        <Kpi label="Kayıp insan-saat" value={num(list.reduce((a, d) => a + d.lostHours, 0))} tone="warn" />
        <Kpi label="Maliyet etkisi" value={moneyShort(list.reduce((a, d) => a + d.cost, 0), prj.currency)} tone="crit" />
        <Kpi label="Kritik yola etki" value={`${list.filter((d) => d.critical).reduce((a, d) => a + d.effectDays, 0)} gün`} tone="crit" />
        <Kpi label="Hak talebine dönüşen" value={list.filter((d) => d.claim).length} tone="accent" />
      </div>
      <Card title={`Aksaklıklar (${rows.length})`} pad={false}>
        <Table head={
          <tr>
            <Th w={210}>Aksaklık</Th>
            <Th w={100}>
              <span className="flex items-center gap-1.5">Sebep
                <ColumnFilter value={catFilter} onChange={setCatFilter} values={[...new Set(list.map((d) => d.category))]} />
              </span>
            </Th>
            <Th w={210}>Sebep → etki</Th>
            <Th w={220}>Çözüm</Th>
            <Th>Durum</Th>
            <Th w={100} center>İşlem</Th>
          </tr>
        }>
          {rows.map((d) => (
            <tr key={d.id} onClick={() => setOpen(d)} className="cursor-pointer hover:bg-[var(--surface-2)]">
              <Td>
                <div className="text-[12.5px] font-medium text-[var(--ink)]">{d.title}</div>
                <div className="text-[11px] text-[var(--faint)]">{d.id} · {date(d.date)} · {d.activity}</div>
              </Td>
              <Td nowrap><Badge tone={CAT_TONE[d.category]}>{d.category}</Badge></Td>
              <Td>
                <div className="text-[12px] text-[var(--muted)]">{d.cause}</div>
                <div className="mt-0.5 text-[11.5px] tnum text-[var(--ink)]">
                  → {d.effectDays ? <b style={{ color: d.critical ? 'var(--crit)' : undefined }}>{d.effectDays} gün{d.critical ? ' (kritik yol)' : ''}</b> : 'süre etkisi yok'} · {num(d.lostHours)} saat · {moneyShort(d.cost, prj.currency)}
                </div>
              </Td>
              <Td><span className="text-[12px] text-[var(--ink)]">{d.solution}</span></Td>
              <Td nowrap>
                <Badge tone={DIS_TONE[d.state]} dot>{d.state}</Badge>
                {d.claim && <div className="mono mt-0.5 text-[11px] text-[var(--accent)]">{d.claim}</div>}
              </Td>
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
                <Btn primary onClick={() => save({ ...open, state: 'Hak talebine dönüştü', claim: 'CL-04' })}>Hak talebine dönüştür</Btn>
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
            {Array.from({ length: Math.max(0, Math.min(5, open.photos) - sitePhotos.filter((p) => p.disruption === open.id).length) }, (_, i) => (
              <span key={i} className="grid aspect-[4/3] place-items-center rounded-md text-[16px]" style={{ background: `hsl(${(i * 47 + 20) % 360} 30% 87%)` }}>📷</span>
            ))}
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
          ...(d ?? { id: `DS-${String(Math.floor(Math.random() * 90) + 10)}`, date: '2026-09-26', state: 'Açık' as const, photos: 0 }),
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
        right={<Btn primary onClick={() => setPhotos((l) => [{ id: `P-${312 + l.length}`, date: '2026-09-26', activity: 'Genel', area: 'Saha', by: 'k.aslan', caption: 'Yeni yüklenen fotoğraf', hue: 160 }, ...l])}>+ Fotoğraf yükle</Btn>} />
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
