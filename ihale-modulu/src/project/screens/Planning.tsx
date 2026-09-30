import { useState } from 'react'
import type { ReactNode } from 'react'
import { Badge, Btn, Card, Field, IconBtn, Kpi, Modal, PageHead, RowActions, Table, Td, Th } from '../../components/ui'
import type { Tone } from '../../components/ui'
import { date, num } from '../../lib/format'
import { Donut, Gantt, HistoLine, Legend, MonthColumns, MultiLine, SCurve } from '../charts'
import type { GanttRow } from '../charts'
import { actualCum, evm, monthName, plannedCum } from '../data'
import {
  cpFindings, finishForecast, lookaheads, manpowerLoad, microPrograms, programs, recoveryActions, riskTypes, scheduleChecks,
} from '../planningData'
import type { Activity, Lookahead, Program, RecoveryAction } from '../planningData'

/**
 * Planning alt modülü. Bütün sayfalarda aynı mantık: program blokları (solda çizelge, sağda bilgi paneli),
 * her blokta aç / düzenle / sil; "aç" programı tam ekran açar, orada ekle – sil – revize et – yazdır yapılır.
 * Planlama ekranlarında fiyat gösterilmez.
 */

const TODAY = '2026-09-27'
const days = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000)
const span = (acts: Activity[]) => ({
  start: acts.reduce((m, a) => (a.start < m ? a.start : m), acts[0]?.start ?? TODAY),
  finish: acts.reduce((m, a) => (a.finish > m ? a.finish : m), acts[0]?.finish ?? TODAY),
})
const toRows = (acts: Activity[]): GanttRow[] => acts.map((a) => ({ code: a.code, name: a.name, start: a.start, finish: a.finish, progress: a.progress, critical: a.critical }))
const fmt2 = (v: number) => v.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Genel çıktı seçenekleri */
function PrintButtons() {
  return <>
    <Btn small title="PDF olarak yazdır">PDF</Btn>
    <Btn small title="Excel olarak dışa aktar">Excel</Btn>
    <Btn small title="Primavera P6 (.xer)">XER</Btn>
    <Btn small title="MS Project (.xml / .mpp)">MS Project</Btn>
  </>
}

/** Bilgi panelinde satır */
function Info({ n, label, value, tone }: { n?: number; label: string; value: ReactNode; tone?: Tone }) {
  return (
    <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2 last:border-0">
      {n != null && <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--surface-3)] text-[10.5px] font-bold text-[var(--muted)]">{n}</span>}
      <span className="text-[12px] text-[var(--muted)]">{label}</span>
      <span className="ml-auto text-[12.5px] font-semibold tnum" style={{ color: tone ? `var(--${tone})` : 'var(--ink)' }}>{value}</span>
    </div>
  )
}

/* ---------------- Program analizi ---------------- */

/** Aktivitenin günlük ekip büyüklüğü: kaynak atanmışsa oradan, yoksa iş grubuna göre varsayılan */
function crewOf(a: Activity) {
  const m = a.resource?.match(/(\d+)\s*kişi/)
  if (m) return Number(m[1])
  const g = a.code.slice(0, 3)
  return ({ 'A-1': 30, 'A-2': 28, 'A-3': 18, 'A-4': 19, 'A-5': 14, 'A-9': 6 } as Record<string, number>)[g] ?? 12
}

/** Aktivitenin bugüne göre beklenen ilerlemesi (%) */
function expectedOf(a: Activity, at = TODAY) {
  const d = days(a.start, a.finish) || 1
  return Math.min(100, Math.max(0, (days(a.start, at) / d) * 100))
}

const HOURS_PER_DAY = 8.5 * (22 / 30)
const COST_PER_HOUR = 95

/**
 * Programın bütün grafik verisi, yalnızca aktivitelerden hesaplanır — yeni eklenen ya da aktarılan
 * programda da aynı yapı kendiliğinden oluşur. Veri olmayan grafik gösterilmez.
 */
function analyse(acts: Activity[]) {
  if (!acts.length) return null
  const { start, finish } = span(acts)
  const s = new Date(start), f = new Date(finish)
  const months: { from: string; to: string; label: string }[] = []
  for (let d = new Date(s.getFullYear(), s.getMonth(), 1); d <= f; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    const e = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const iso = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
    months.push({ from: iso(d), to: iso(e), label: new Intl.DateTimeFormat('tr-TR', { month: 'short', year: '2-digit' }).format(d) })
  }
  const overlap = (a: Activity, from: string, to: string) => Math.max(0, days(a.start > from ? a.start : from, a.finish < to ? a.finish : to))
  const mhOf = (a: Activity) => crewOf(a) * (days(a.start, a.finish) || 1) * HOURS_PER_DAY
  /** İlerleme ağırlığı: metraj ağırlığı girilmişse o, yoksa insan-saat payı */
  const useW = acts.some((a) => a.weight != null)
  const wOf = (a: Activity) => (useW ? a.weight ?? 0 : mhOf(a))
  const totalW = acts.reduce((t, a) => t + wOf(a), 0) || 1

  const planCrew = months.map((m) => acts.reduce((t, a) => t + crewOf(a) * (overlap(a, m.from, m.to) / days(m.from, m.to)), 0))
  const planMh = months.map((m) => acts.reduce((t, a) => t + crewOf(a) * overlap(a, m.from, m.to) * HOURS_PER_DAY, 0))
  const planCost = planMh.map((h) => h * COST_PER_HOUR)
  const planW = months.map((m) => acts.reduce((t, a) => t + wOf(a) * (overlap(a, m.from, m.to) / (days(a.start, a.finish) || 1)), 0))
  let run = 0
  const planCum = planW.map((h) => Math.min(100, Math.round(((run += h) / totalW) * 1000) / 10))

  const earned = acts.reduce((t, a) => t + wOf(a) * (a.progress / 100), 0) / totalW * 100
  const plannedNow = acts.reduce((t, a) => t + wOf(a) * (expectedOf(a) / 100), 0) / totalW * 100
  const hasActual = acts.some((a) => a.progress > 0)
  const nowIdx = months.findIndex((m) => TODAY >= m.from && TODAY < m.to)
  const upto = nowIdx === -1 ? (TODAY >= finish ? months.length - 1 : -1) : nowIdx
  const ratio = plannedNow > 0 ? earned / plannedNow : 1
  const wobble = (i: number) => 1 + 0.06 * Math.sin(i * 1.7)
  const act = <T,>(fn: (i: number) => T) => months.map((_, i) => (hasActual && i <= upto ? fn(i) : null))

  return {
    labels: months.map((m) => m.label),
    today: upto >= 0 ? upto + 1 : undefined,
    planCum,
    actualCum: hasActual && upto >= 0 ? planCum.slice(0, upto + 1).map((v, i) => (i === upto ? Math.round(earned * 10) / 10 : Math.round(v * ratio * 10) / 10)) : [],
    planCost, actualCost: act((i) => planCost[i] * ratio * wobble(i) / 0.94),
    planCrew, actualCrew: act((i) => planCrew[i] * 1.08 * wobble(i + 2)),
    planMh, actualMh: act((i) => planMh[i] * 1.1 * wobble(i + 4)),
    earned, plannedNow, hasActual,
  }
}

/** Madde 9: toplam, tamamlanan ve geciken aktivite sayıları */
function Counts({ acts }: { acts: Activity[] }) {
  const done = acts.filter((a) => a.progress >= 100).length
  const late = acts.filter((a) => a.progress < 100 && a.progress < expectedOf(a) - 5).length
  return (
    <div className="grid grid-cols-3 border-b border-[var(--border)]">
      {[['Total activity', acts.length, 'ink'], ['Completed', done, 'ok'], ['Delayed', late, late ? 'crit' : 'ink']].map(([l, v, t]) => (
        <div key={l as string} className="border-r border-[var(--border)] px-2.5 py-2 last:border-0">
          <div className="whitespace-nowrap text-[9.5px] font-semibold uppercase tracking-tight text-[var(--faint)]">{l}</div>
          <div className="text-[17px] font-bold tnum" style={{ color: `var(--${t})` }}>{v}</div>
        </div>
      ))}
    </div>
  )
}

function MiniCard({ title, help, children, legend = true }: { title: string; help: string; children: ReactNode; legend?: boolean }) {
  return (
    <Card title={title} help={help}>
      <div className="-mx-1 -my-1">{children}</div>
      {legend && <div className="mt-1.5"><Legend items={[{ label: 'Gerçekleşen', color: 'var(--series-1)' }, { label: 'Planlanan', color: 'var(--series-2)', dashed: true }]} /></div>}
    </Card>
  )
}

const kEur = (v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} M€` : `${Math.round(v / 1000).toLocaleString('tr-TR')} k€`
const kH = (v: number) => v >= 1000 ? `${(v / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} bin sa` : `${Math.round(v)} sa`

/** Madde 10–14: program grafik satırı. Aynı yapı bütün programlarda sabittir. */
function ProgramCharts({ acts }: { acts: Activity[] }) {
  const d = analyse(acts)
  if (!d) {
    return <div className="xl:col-span-12 rounded-lg border border-dashed border-[var(--border-strong)] px-4 py-3 text-[12px] text-[var(--muted)]">Programda aktivite yok — aktivite eklenince S eğrisi, maliyet, kaynak, inxsa ve ilerleme grafikleri kendiliğinden oluşur.</div>
  }
  const r = 34, c = 2 * Math.PI * r
  const tone = d.earned >= d.plannedNow - 1 ? 'ok' : d.earned >= d.plannedNow - 5 ? 'warn' : 'crit'
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-9 xl:grid-cols-4">
        <MiniCard title="S-curve" help="Aktivitelerin süre ve kaynak ağırlığıyla hesaplanan kümülatif planlanan ilerleme (kesikli) ve gerçekleşen.">
          <SCurve plan={d.planCum} actual={d.actualCum} labels={d.labels} today={d.today} height={130} />
        </MiniCard>
        <MiniCard title="Cost" help="Aylık maliyet: çubuk gerçekleşen, kesikli çizgi planlanan. Aktivitelerin insan-saatinden ve birim maliyetten hesaplanır.">
          <HistoLine plan={d.planCost} actual={d.actualCost} labels={d.labels} format={kEur} />
        </MiniCard>
        <MiniCard title="Resource" help="Aylık ortalama sahadaki kişi: çubuk gerçekleşen, kesikli çizgi planlanan (kaynak yüklemesi).">
          <HistoLine plan={d.planCrew} actual={d.actualCrew} labels={d.labels} format={(v) => `${Math.round(v)} kişi`} />
        </MiniCard>
        <MiniCard title="inxsa" help="Aylık insan-saat: çubuk gerçekleşen, kesikli çizgi planlanan. Gerçekleşenin planı aşması verim kaybını gösterir.">
          <HistoLine plan={d.planMh} actual={d.actualMh} labels={d.labels} format={kH} />
        </MiniCard>
      </div>
      <div className="xl:col-span-3">
        <Card title="Program ilerlemesi" help="Aktivitelerin ağırlıklı gerçekleşen ilerlemesi; altında bugün itibarıyla olması gereken değer.">
          <div className="flex items-center gap-4">
            <svg width="92" height="92" viewBox="0 0 92 92" className="-rotate-90 flex-shrink-0">
              <circle cx="46" cy="46" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="11" />
              <circle cx="46" cy="46" r={r} fill="none" stroke="var(--series-1)" strokeWidth="11" strokeLinecap="round"
                strokeDasharray={`${(d.earned / 100) * c} ${c}`} />
              <line x1={46 + (r - 8) * Math.cos((d.plannedNow / 100) * 2 * Math.PI)} y1={46 + (r - 8) * Math.sin((d.plannedNow / 100) * 2 * Math.PI)}
                x2={46 + (r + 8) * Math.cos((d.plannedNow / 100) * 2 * Math.PI)} y2={46 + (r + 8) * Math.sin((d.plannedNow / 100) * 2 * Math.PI)}
                stroke="var(--series-2)" strokeWidth="2.5" />
            </svg>
            <div>
              <div className="text-[28px] font-bold leading-none text-[var(--ink)] tnum">%{Math.round(d.earned)}</div>
              <div className="mt-1 text-[11.5px] text-[var(--muted)]">Planlanan <b className="text-[var(--ink)] tnum">%{Math.round(d.plannedNow)}</b></div>
              <div className="text-[11.5px] font-semibold tnum" style={{ color: `var(--${tone})` }}>
                {d.earned - d.plannedNow >= 0 ? '+' : '−'}{Math.abs(d.earned - d.plannedNow).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} puan
              </div>
            </div>
          </div>
          <div className="mt-2"><Legend items={[{ label: 'Gerçekleşen', color: 'var(--series-1)' }, { label: 'Bugün planlanan', color: 'var(--series-2)' }]} /></div>
        </Card>
      </div>
    </>
  )
}

/**
 * Program bloğu: solda çizelge önizlemesi, sağda bilgi paneli.
 * "Aç" programı tam ekran açar ve düğme "Kapat"a döner.
 */
function ProgramBlock({ program, info, onChange, onDelete, extra }: {
  program: Program; info: ReactNode; onChange: (p: Program) => void; onDelete: () => void; extra?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const { start, finish } = span(program.activities)
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <div className="xl:col-span-9">
        <Card title={program.title} subtitle={`${program.kind} · Rev.${program.rev} · ${program.activities.length} aktivite`}
          right={<>
            {extra}
            <Btn small primary={!open} onClick={() => setOpen((v) => !v)}>{open ? 'Kapat' : 'Aç'}</Btn>
            <IconBtn icon="edit" title="Başlığı düzenle" onClick={() => setRenaming(true)} />
            <IconBtn icon="add" title="Aktivite ekle (tam ekran açılır)" onClick={() => setOpen(true)} />
            <RowActions name={program.title} onDelete={onDelete} />
          </>} pad={false}>
          <Gantt rows={toRows(program.activities).slice(0, 9)} from={start} to={finish} today={TODAY} compact />
          {program.activities.length > 9 && <div className="border-t border-[var(--border)] px-3 py-1.5 text-[11px] text-[var(--faint)]">+{program.activities.length - 9} aktivite daha · tamamı için “Aç”</div>}
        </Card>
      </div>
      <div className="xl:col-span-3">
        <Card title="Program bilgisi" pad={false}>{info}</Card>
      </div>
      <ProgramCharts acts={program.activities} />
      {open && <FullProgram program={program} onClose={() => setOpen(false)} onChange={onChange} />}
      {renaming && (
        <TitleModal title={program.title} onClose={() => setRenaming(false)} onSave={(t) => { onChange({ ...program, title: t }); setRenaming(false) }} />
      )}
    </div>
  )
}

function TitleModal({ title, onClose, onSave }: { title: string; onClose: () => void; onSave: (t: string) => void }) {
  const [t, setT] = useState(title)
  return (
    <Modal title="Başlığı düzenle" onClose={onClose}
      footer={<span className="ml-auto flex gap-2"><Btn onClick={onClose}>Vazgeç</Btn><Btn primary disabled={!t.trim()} onClick={() => onSave(t.trim())}>Kaydet</Btn></span>}>
      <Field label="Program başlığı" value={t} onChange={setT} />
    </Modal>
  )
}

/** Programın tam ekran hâli: aktivite ekle, sil, düzenle, revize et, yazdır */
function FullProgram({ program, onClose, onChange }: { program: Program; onClose: () => void; onChange: (p: Program) => void }) {
  const [editing, setEditing] = useState<Activity | 'new' | null>(null)
  const [log, setLog] = useState<string[]>([])
  const { start, finish } = span(program.activities)
  const note = (s: string) => setLog((l) => [`${new Date().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · m.aydin · ${s}`, ...l])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--surface-2)]">
      <header className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-5 py-2.5">
        <div className="min-w-0">
          <div className="text-[14px] font-bold text-[var(--ink)]">{program.title}</div>
          <div className="text-[11.5px] text-[var(--muted)]">{program.kind} · Rev.{program.rev} · {date(start)} – {date(finish)} · {program.activities.length} aktivite</div>
        </div>
        <span className="ml-auto flex flex-wrap items-center gap-1.5">
          <Btn small primary onClick={() => setEditing('new')}>+ Aktivite</Btn>
          <Btn small onClick={() => { onChange({ ...program, rev: program.rev + 1, updatedAt: TODAY }); note(`Rev.${program.rev + 1} oluşturuldu`) }}>Revize et</Btn>
          <PrintButtons />
          <Btn small onClick={onClose}>Kapat</Btn>
        </span>
      </header>
      <div className="flex-1 overflow-auto p-5">
        <div className="flex flex-col gap-4">
          <Card title="Çizelge" pad={false}>
            <Gantt rows={toRows(program.activities)} from={start} to={finish} today={TODAY} onRow={(r) => setEditing(program.activities.find((a) => a.code === r.code) ?? null)} />
          </Card>
          <Card title="Aktiviteler" pad={false}>
            <Table head={<tr><Th>Kod</Th><Th>Başlangıç</Th><Th>Bitiş</Th><Th w={260}>Aktivite</Th><Th>Öncül</Th><Th right>Süre</Th><Th right>İlerleme</Th><Th>Kaynak</Th><Th>Kritik</Th><Th w={80} center>İşlem</Th></tr>}>
              {program.activities.map((a) => (
                <tr key={a.code} className="hover:bg-[var(--surface-2)]">
                  <Td mono nowrap>{a.code}</Td>
                  <Td nowrap>{date(a.start)}</Td>
                  <Td nowrap>{date(a.finish)}</Td>
                  <Td>{a.name}</Td>
                  <Td mono nowrap>{a.pred ?? '—'}</Td>
                  <Td right>{days(a.start, a.finish)} gün</Td>
                  <Td right>%{a.progress}</Td>
                  <Td><span className="text-[12px] text-[var(--muted)]">{a.resource ?? '—'}</span></Td>
                  <Td nowrap>{a.critical ? <Badge tone="crit">Evet</Badge> : <span className="text-[var(--faint)]">—</span>}</Td>
                  <Td nowrap center>
                    <RowActions name={a.code} onEdit={() => setEditing(a)} onDelete={() => { onChange({ ...program, activities: program.activities.filter((x) => x.code !== a.code) }); note(`${a.code} silindi`) }} />
                  </Td>
                </tr>
              ))}
            </Table>
          </Card>
          <Card title="İşlem kaydı" help="Programda yapılan her değişiklik kim ve ne zaman bilgisiyle kaydedilir.">
            {log.length === 0 ? <div className="text-[12px] text-[var(--faint)]">Bu oturumda değişiklik yapılmadı. Son revizyon: Rev.{program.rev} · {date(program.updatedAt)} · {program.updatedBy}</div>
              : <ul className="flex flex-col gap-1 text-[12px] text-[var(--ink)]">{log.map((l, i) => <li key={i} className="mono">{l}</li>)}</ul>}
          </Card>
        </div>
      </div>
      {editing && (
        <ActivityForm act={editing === 'new' ? null : editing} codes={program.activities.map((a) => a.code)} onClose={() => setEditing(null)}
          onSave={(a) => {
            const exists = program.activities.some((x) => x.code === (editing === 'new' ? a.code : editing.code))
            onChange({ ...program, activities: exists && editing !== 'new' ? program.activities.map((x) => (x.code === editing.code ? a : x)) : [...program.activities, a] })
            note(`${a.code} ${editing === 'new' ? 'eklendi' : 'düzenlendi'}`)
            setEditing(null)
          }} />
      )}
    </div>
  )
}

function ActivityForm({ act, codes, onClose, onSave }: { act: Activity | null; codes: string[]; onClose: () => void; onSave: (a: Activity) => void }) {
  const [v, setV] = useState({ code: act?.code ?? '', name: act?.name ?? '', start: act?.start ?? TODAY, finish: act?.finish ?? TODAY, pred: act?.pred ?? '', progress: String(act?.progress ?? 0), critical: act?.critical ?? false })
  const set = (k: keyof typeof v) => (x: string) => setV((o) => ({ ...o, [k]: x }))
  const ready = v.code.trim() && v.name.trim() && v.finish >= v.start
  return (
    <Modal title={act ? `${act.code} düzenle` : 'Aktivite ekle'} wide onClose={onClose}
      footer={<span className="ml-auto flex gap-2"><Btn onClick={onClose}>Vazgeç</Btn>
        <Btn primary disabled={!ready} onClick={() => onSave({ ...(act ?? {}), code: v.code.trim(), name: v.name.trim(), start: v.start, finish: v.finish, pred: v.pred || undefined, progress: Number(v.progress) || 0, critical: v.critical })}>Kaydet</Btn></span>}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Kod" value={v.code} onChange={set('code')} placeholder="A-2160" />
        <div className="sm:col-span-2"><Field label="Aktivite" value={v.name} onChange={set('name')} /></div>
        <Field label="Başlangıç" value={v.start} onChange={set('start')} type="date" />
        <Field label="Bitiş" value={v.finish} onChange={set('finish')} type="date" />
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Öncül</span>
          <select value={v.pred} onChange={(e) => set('pred')(e.target.value)} className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-2 text-[13px] text-[var(--ink)] outline-none">
            <option value="">—</option>{codes.filter((c) => c !== act?.code).map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <Field label="İlerleme (%)" value={v.progress} onChange={set('progress')} type="number" />
        <label className="flex items-center gap-2 text-[12.5px] text-[var(--ink)]"><input type="checkbox" checked={v.critical} onChange={() => setV((o) => ({ ...o, critical: !o.critical }))} /> Kritik yolda</label>
      </div>
    </Modal>
  )
}

/** "Ekle" penceresi: iki seçenek — mevcut programı duplike et ya da boş program aç */
function AddProgramModal({ sources, onClose, onAdd }: { sources: Program[]; onClose: () => void; onAdd: (p: Program) => void }) {
  const [mode, setMode] = useState<'dup' | 'empty'>('dup')
  const [src, setSrc] = useState(sources[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const base = sources.find((s) => s.id === src)
  return (
    <Modal title="Program ekle" wide onClose={onClose} note="İstediğiniz kadar program ekleyebilirsiniz; her birine başlık verilir."
      footer={<span className="ml-auto flex gap-2"><Btn onClick={onClose}>Vazgeç</Btn>
        <Btn primary disabled={!title.trim()} onClick={() => onAdd({
          id: `WS-${Date.now()}`, title: title.trim(), kind: 'Firma programı', rev: 0, updatedAt: TODAY, updatedBy: 'm.aydin',
          activities: mode === 'dup' && base ? base.activities.map((a) => ({ ...a })) : [],
        })}>Ekle</Btn></span>}>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          {([['dup', 'Duplike et', 'Seçilen programın kopyası; üzerinde revize edilir'], ['empty', 'Boş program aç', 'Sıfırdan yeni program']] as const).map(([k, t, d]) => (
            <button key={k} onClick={() => setMode(k)} className="rounded-lg border p-3 text-left"
              style={mode === k ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)' } : { borderColor: 'var(--border)' }}>
              <div className="text-[13px] font-semibold" style={{ color: mode === k ? 'var(--accent)' : 'var(--ink)' }}>{t}</div>
              <div className="text-[11.5px] text-[var(--muted)]">{d}</div>
            </button>
          ))}
        </div>
        {mode === 'dup' && (
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Kopyalanacak program</span>
            <select value={src} onChange={(e) => setSrc(e.target.value)} className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-2 text-[13px] text-[var(--ink)] outline-none">
              {sources.map((s) => <option key={s.id} value={s.id}>{s.title} · Rev.{s.rev}</option>)}
            </select>
          </label>
        )}
        <Field label="Başlık" value={title} onChange={setTitle} placeholder="Ör. Hızlandırılmış program (Ekim)" />
      </div>
    </Modal>
  )
}

/* ---------------- Work Schedule ---------------- */

export function WorkSchedule() {
  const [list, setList] = useState<Program[]>(programs)
  const [adding, setAdding] = useState(false)
  const { spi, cpi } = evm()
  const update = (p: Program) => setList((l) => l.map((x) => (x.id === p.id ? p : x)))

  return (
    <>
      <PageHead title="Planning · Work Schedule"
        note="İşverenle anlaşılan program ve firmanın kendi (kaynak yüklü) programları. Programlar birbirinden bağımsız ama aynı saha verisine bağlı ilerler; hepsi aynı panel ve grafik yapısındadır. “Aç” programı tam ekran açar; ekle, sil, revize et ve yazdır oradan yapılır."
        right={<><PrintButtons /><Btn primary onClick={() => setAdding(true)}>+ Program ekle</Btn></>} />
      {list.map((p) => {
        const { start, finish } = span(p.activities)
        const est = p.id === 'WS-1' ? '2027-01-24' : p.id === 'WS-2' ? '2027-01-12' : finish
        return (
          <ProgramBlock key={p.id} program={p} onChange={update} onDelete={() => setList((l) => l.filter((x) => x.id !== p.id))}
            info={<>
              <div className="grid grid-cols-2 border-b border-[var(--border)]">
                {[['CPI', cpi], ['SPI', p.id === 'WS-2' ? spi + 0.02 : spi]].map(([l, v]) => (
                  <div key={l as string} className="border-r border-[var(--border)] px-2.5 py-2 last:border-0">
                    <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--faint)]">{l}</div>
                    <div className="text-[18px] font-bold tnum" style={{ color: (v as number) >= 1 ? 'var(--ok)' : 'var(--crit)' }}>{fmt2(v as number)}</div>
                  </div>
                ))}
              </div>
              <Counts acts={p.activities} />
              <Info n={1} label="Start date" value={date(start)} />
              <Info n={2} label="Finish date" value={date(finish)} />
              <Info n={3} label="Estimated finish date" value={date(est)} tone={est > finish ? 'crit' : 'ok'} />
              <Info n={4} label="Days left" value={`${days(TODAY, finish)} gün`} tone="accent" />
            </>} />
        )
      })}
      {adding && <AddProgramModal sources={list} onClose={() => setAdding(false)} onAdd={(p) => { setList((l) => [...l, p]); setAdding(false) }} />}
    </>
  )
}

/* ---------------- Micro Schedules ---------------- */

export function MicroSchedules() {
  const [list, setList] = useState<Program[]>(microPrograms)
  const [adding, setAdding] = useState(false)
  const [analysis, setAnalysis] = useState<Program | null>(null)
  const update = (p: Program) => setList((l) => l.map((x) => (x.id === p.id ? p : x)))
  const mainActs = programs[0].activities

  return (
    <>
      <PageHead title="Planning · Micro Schedules"
        note="Ana programın bazı kısımlarının (genelde kritik işlerin veya taşerona verilen kapsamların) detay programları. Ana programa bağlanacaksa önceki ve sonraki aktivitenin kodu verilir; bu aralık detaylandırılır ve “ana programa dahil et / analiz et” ile etkisi görülür. Bağımsız boş program da açılabilir."
        right={<><PrintButtons /><Btn primary onClick={() => setAdding(true)}>+ Micro program ekle</Btn></>} />
      {list.map((p) => {
        const { start, finish } = span(p.activities)
        return (
          <ProgramBlock key={p.id} program={p} onChange={update} onDelete={() => setList((l) => l.filter((x) => x.id !== p.id))}
            extra={p.between && (p.integrated
              ? <Badge tone="ok" dot>Ana programa dahil</Badge>
              : <Btn small onClick={() => setAnalysis(p)}>Ana programa dahil et</Btn>)}
            info={<>
              <Counts acts={p.activities} />
              <Info n={1} label="Start date" value={date(start)} />
              <Info n={2} label="Finish date" value={date(finish)} />
              <Info n={3} label="Gereken gün" value={`${days(start, finish)} gün`} />
              <Info n={4} label="Days left" value={`${Math.max(0, days(TODAY, finish))} gün`} tone="accent" />
              <Info label="Kritik aktivite" value={p.activities.filter((a) => a.critical).length} tone="crit" />
              <Info label="Bağlı aralık" value={p.between ? `${p.between.from} → ${p.between.to}` : 'Bağımsız'} />
            </>} />
        )
      })}
      {adding && <AddMicroModal mainActs={mainActs} onClose={() => setAdding(false)} onAdd={(p) => { setList((l) => [...l, p]); setAdding(false) }} />}
      {analysis && (
        <Modal title="Ana programa dahil et — analiz" wide onClose={() => setAnalysis(null)} note={`${analysis.title} · ${analysis.between?.from} → ${analysis.between?.to}`}
          footer={<span className="ml-auto flex gap-2"><Btn onClick={() => setAnalysis(null)}>Vazgeç</Btn>
            <Btn primary onClick={() => { update({ ...analysis, integrated: true }); setAnalysis(null) }}>Ana programa dahil et</Btn></span>}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              { t: 'Aralık', v: `${analysis.between?.from} bitişi ile ${analysis.between?.to} başlangıcı arasında ${analysis.activities.length} detay aktivite` },
              { t: 'Etki', v: 'Detay programa göre A-2150 çatı paneli 4 gün erken başlayabilir; C-05 kritikte kalıyor, ana bitiş değişmiyor.' },
              { t: 'Uyum', v: 'Detay programın bitişi (24 Eki) ana programdaki A-2120 bitişinden (22 Eki) 2 gün geç — uyarı.' },
            ].map((b) => (
              <div key={b.t} className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--faint)]">{b.t}</div>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--ink)]">{b.v}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11.5px] text-[var(--faint)]">Bu analiz geliştirilecek: dahil edildiğinde ana programın ilgili aralığı detay aktivitelerle değiştirilir ve kritik yol yeniden hesaplanır.</p>
        </Modal>
      )}
    </>
  )
}

function AddMicroModal({ mainActs, onClose, onAdd }: { mainActs: Activity[]; onClose: () => void; onAdd: (p: Program) => void }) {
  const [mode, setMode] = useState<'linked' | 'free'>('linked')
  const [from, setFrom] = useState(mainActs[3]?.code ?? '')
  const [to, setTo] = useState(mainActs[6]?.code ?? '')
  const [title, setTitle] = useState('')
  const a = mainActs.find((x) => x.code === from)
  const b = mainActs.find((x) => x.code === to)
  const window = a && b ? mainActs.filter((x) => x.start >= a.finish.slice(0, 7) && x.start <= b.start && x.code !== from && x.code !== to) : []
  const sel = 'rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-2 text-[13px] text-[var(--ink)] outline-none'
  return (
    <Modal title="Micro program ekle" wide onClose={onClose}
      footer={<span className="ml-auto flex gap-2"><Btn onClick={onClose}>Vazgeç</Btn>
        <Btn primary disabled={!title.trim()} onClick={() => onAdd({
          id: `MS-${Date.now()}`, title: title.trim(), kind: 'Micro program', rev: 0, updatedAt: TODAY, updatedBy: 'b.yildiz',
          between: mode === 'linked' ? { from, to } : undefined, integrated: false,
          activities: mode === 'linked' ? window.map((x, i) => ({ ...x, code: `M-${String(i + 1).padStart(2, '0')}` })) : [],
        })}>Ekle</Btn></span>}>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          {([['linked', 'Ana programa bağlı', 'Önceki ve sonraki aktivite arasındaki aralık detaylandırılır'], ['free', 'Bağımsız boş program', 'Ana programdan bağımsız']] as const).map(([k, t, d]) => (
            <button key={k} onClick={() => setMode(k)} className="rounded-lg border p-3 text-left"
              style={mode === k ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)' } : { borderColor: 'var(--border)' }}>
              <div className="text-[13px] font-semibold" style={{ color: mode === k ? 'var(--accent)' : 'var(--ink)' }}>{t}</div>
              <div className="text-[11.5px] text-[var(--muted)]">{d}</div>
            </button>
          ))}
        </div>
        {mode === 'linked' && (
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1"><span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Önceki aktivite</span>
              <select value={from} onChange={(e) => setFrom(e.target.value)} className={sel}>{mainActs.map((x) => <option key={x.code} value={x.code}>{x.code} · {x.name}</option>)}</select></label>
            <label className="flex flex-col gap-1"><span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Sonraki aktivite</span>
              <select value={to} onChange={(e) => setTo(e.target.value)} className={sel}>{mainActs.map((x) => <option key={x.code} value={x.code}>{x.code} · {x.name}</option>)}</select></label>
            <div className="col-span-2 rounded-md bg-[var(--surface-2)] px-3 py-2 text-[12px] text-[var(--muted)]">
              Aralıktaki ana program aktiviteleri ({window.length}): {window.map((x) => x.code).join(', ') || '—'} — detay program bunlarla başlar.
            </div>
          </div>
        )}
        <Field label="Başlık" value={title} onChange={setTitle} placeholder="Ör. Depo B cephe paneli — detay" />
      </div>
    </Modal>
  )
}

/* ---------------- Lookahead ---------------- */

function windowActs(la: Lookahead) {
  const p = programs.find((x) => x.id === la.program) ?? programs[0]
  return p.activities.filter((a) => a.start <= la.to && a.finish >= la.from)
}

function statusOf(a: Activity): { label: string; tone: Tone } {
  if (a.progress >= 100) return { label: 'Tamamlandı', tone: 'ok' }
  if (a.critical && a.finish < '2026-12-31' && a.progress < 75) return { label: 'Riskli', tone: 'crit' }
  if (a.start > TODAY) return { label: 'Başlayacak', tone: 'neutral' }
  return { label: 'Devam ediyor', tone: 'accent' }
}

export function LookaheadSch() {
  const [list, setList] = useState<Lookahead[]>(lookaheads)
  const [adding, setAdding] = useState(false)
  const [overlay, setOverlay] = useState<{ base: Lookahead; other?: string } | null>(null)

  return (
    <>
      <PageHead title="Planning · Lookahead Sch."
        note="İşverenin genelde haftalık istediği, önümüzdeki 2–4 haftada hangi imalatların yapılacağını gösteren kesitler. “Ekle” ile program ve iki tarih seçilir; bu aralıktaki aktiviteler bulunur. “Çakıştır” ile önceki ya da seçilen bir lookahead üst üste konur; geçen hafta ile bu hafta arasında ne durumda olduğumuz görülür."
        right={<><PrintButtons /><Btn primary onClick={() => setAdding(true)}>+ Lookahead ekle</Btn></>} />
      {list.map((la) => {
        const acts = windowActs(la)
        return (
          <div key={la.id} className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-9">
              <Card title={la.title} subtitle={`${date(la.from)} – ${date(la.to)}`}
                right={<>
                  <Btn small onClick={() => setOverlay({ base: la })}>Çakıştır</Btn>
                  <Btn small title="Pencereyi bugünkü program verisiyle yeniden al"
                    onClick={() => setList((l) => l.map((x) => (x.id === la.id ? { ...x, createdAt: TODAY, snapshot: Object.fromEntries(acts.map((a) => [a.code, a.progress])) } : x)))}>Rev et</Btn>
                  <RowActions name={la.title} onDelete={() => setList((l) => l.filter((x) => x.id !== la.id))} />
                </>} pad={false}>
                <Gantt rows={toRows(acts)} from={la.from} to={la.to} today={TODAY} compact />
              </Card>
            </div>
            <div className="xl:col-span-3">
              <Card title="Kesit bilgisi" pad={false}>
                <Info label="Program" value={programs.find((p) => p.id === la.program)?.title ?? la.program} />
                <Info label="Aralık" value={`${days(la.from, la.to) + 1} gün`} />
                <Info label="Aktivite" value={acts.length} />
                <Info label="Kritik" value={acts.filter((a) => a.critical).length} tone="crit" />
                <Info label="Riskli" value={acts.filter((a) => statusOf(a).label === 'Riskli').length} tone="warn" />
                <Info label="Alındı" value={date(la.createdAt)} />
              </Card>
            </div>
          </div>
        )
      })}
      {adding && <AddLookahead onClose={() => setAdding(false)} onAdd={(la) => { setList((l) => [la, ...l]); setAdding(false) }} />}
      {overlay && <OverlayModal base={overlay.base} list={list} onClose={() => setOverlay(null)} />}
    </>
  )
}

function AddLookahead({ onClose, onAdd }: { onClose: () => void; onAdd: (la: Lookahead) => void }) {
  const [program, setProgram] = useState(programs[0].id)
  const [from, setFrom] = useState('2026-09-28')
  const [to, setTo] = useState('2026-10-11')
  const n = windowActs({ id: '', title: '', program, from, to, createdAt: '', snapshot: {} }).length
  return (
    <Modal title="Lookahead ekle" onClose={onClose} note="Programı ve iki tarihi seçin; bu aralıktaki aktiviteler bulunur."
      footer={<><span className="text-[11.5px] text-[var(--faint)]">{n} aktivite bulunacak</span><span className="ml-auto flex gap-2"><Btn onClick={onClose}>Vazgeç</Btn>
        <Btn primary disabled={to < from} onClick={() => onAdd({
          id: `LA-${Date.now()}`, title: `${date(from)} – ${date(to)} (${days(from, to) + 1} gün)`, program, from, to, createdAt: TODAY,
          snapshot: Object.fromEntries(windowActs({ id: '', title: '', program, from, to, createdAt: '', snapshot: {} }).map((a) => [a.code, a.progress])),
        })}>Ekle</Btn></span></>}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 sm:col-span-3"><span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Program</span>
          <select value={program} onChange={(e) => setProgram(e.target.value)} className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-2 text-[13px] text-[var(--ink)] outline-none">
            {programs.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select></label>
        <Field label="Başlangıç" value={from} onChange={setFrom} type="date" />
        <Field label="Bitiş" value={to} onChange={setTo} type="date" />
      </div>
    </Modal>
  )
}

/** Çakıştır: iki lookahead üst üste — önceki kesitteki ilerleme ile bugünkü karşılaştırılır */
function OverlayModal({ base, list, onClose }: { base: Lookahead; list: Lookahead[]; onClose: () => void }) {
  const others = list.filter((l) => l.id !== base.id)
  const [other, setOther] = useState(others[0]?.id ?? '')
  const o = list.find((l) => l.id === other)
  const acts = windowActs(base)
  return (
    <Modal title="Çakıştır" wide onClose={onClose} note={`${base.title} ile karşılaştırılacak kesiti seçin.`}
      footer={<span className="ml-auto"><Btn onClick={onClose}>Kapat</Btn></span>}>
      <label className="flex items-center gap-2 text-[12.5px] text-[var(--muted)]">
        Karşılaştır:
        <select value={other} onChange={(e) => setOther(e.target.value)} className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-[12.5px] text-[var(--ink)] outline-none">
          {others.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
        </select>
      </label>
      {o && (
        <div className="mt-3">
          <Table head={<tr><Th>Kod</Th><Th w={240}>Aktivite</Th><Th right>{o.title.split(' —')[0]}</Th><Th right>{base.title.split(' —')[0]}</Th><Th right>Fark</Th><Th>Durum</Th></tr>}>
            {acts.map((a) => {
              const prev = o.snapshot[a.code]
              const cur = base.snapshot[a.code] ?? a.progress
              const d = prev != null ? cur - prev : null
              const st = statusOf(a)
              return (
                <tr key={a.code}>
                  <Td mono nowrap>{a.code}</Td><Td>{a.name}</Td>
                  <Td right>{prev != null ? `%${prev}` : '—'}</Td>
                  <Td right>%{cur}</Td>
                  <Td right>{d != null ? <b style={{ color: d >= 5 ? 'var(--ok)' : d > 0 ? 'var(--warn)' : 'var(--crit)' }}>+{d} puan</b> : 'yeni'}</Td>
                  <Td nowrap><Badge tone={st.tone} dot>{st.label}</Badge></Td>
                </tr>
              )
            })}
          </Table>
          <p className="mt-2 text-[11.5px] text-[var(--faint)]">Bir haftada 5 puanın altında ilerleyen kritik aktiviteler lookahead’de riskli işaretlenir.</p>
        </div>
      )}
    </Modal>
  )
}

/* ---------------- Critical Path ---------------- */

export function CriticalPath() {
  const [analyses, setAnalyses] = useState<{ id: string; program: string; at: string }[]>([{ id: 'CP-1', program: 'WS-1', at: '2026-09-27' }])
  const [adding, setAdding] = useState(false)
  const [pick, setPick] = useState(programs[0].id)
  return (
    <>
      <PageHead title="Planning · Critical Path"
        note="“+” ile program seçilir; kritik yol (CPM) otomatik hesaplanır. Sahadan gelen gerçekleşmeler ışığında riskler, engeller ve kısıtlar analiz edilir."
        right={<><PrintButtons /><Btn primary onClick={() => setAdding(true)}>+ Kritik yol analizi</Btn></>} />
      {analyses.map((an) => {
        const p = programs.find((x) => x.id === an.program) ?? programs[0]
        const chain = p.activities.filter((a) => a.critical && a.progress < 100)
        return (
          <Card key={an.id} title={`${p.title} — kritik yol`} subtitle={`${an.id} · ${date(an.at)}`}
            right={<><Btn small onClick={() => setAnalyses((l) => l.map((x) => (x.id === an.id ? { ...x, at: TODAY } : x)))}>Yeniden hesapla</Btn>
              <RowActions name={an.id} onDelete={() => setAnalyses((l) => l.filter((x) => x.id !== an.id))} /></>}>
            <div className="mb-4 flex flex-wrap items-center gap-1.5">
              {chain.map((a, i) => (
                <span key={a.code} className="flex items-center gap-1.5">
                  <span className="rounded-md border px-2.5 py-1.5 text-[12px]" style={{ borderColor: 'var(--crit)', background: 'var(--crit-bg)' }}>
                    <span className="mono block text-[10.5px] text-[var(--crit)]">{a.code}</span>
                    <span className="block text-[var(--ink)]">{a.name}</span>
                    <span className="block text-[10.5px] text-[var(--muted)]">{date(a.finish)} · %{a.progress}</span>
                  </span>
                  {i < chain.length - 1 && <span className="text-[var(--crit)]">→</span>}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
              <div className="xl:col-span-7">
                <Table head={<tr><Th>Kod</Th><Th>Başlangıç</Th><Th>Bitiş</Th><Th w={220}>Aktivite</Th><Th right>Bolluk</Th><Th right>İlerleme</Th><Th>Durum</Th></tr>}>
                  {chain.map((a) => {
                    const st = statusOf(a)
                    return (
                      <tr key={a.code}><Td mono nowrap>{a.code}</Td><Td nowrap>{date(a.start)}</Td><Td nowrap>{date(a.finish)}</Td><Td>{a.name}</Td>
                        <Td right>{a.code === 'A-2120' ? <b className="text-[var(--crit)]">−18 gün</b> : '0 gün'}</Td>
                        <Td right>%{a.progress}</Td><Td nowrap><Badge tone={st.tone} dot>{st.label}</Badge></Td></tr>
                    )
                  })}
                </Table>
              </div>
              <div className="flex flex-col gap-2 xl:col-span-5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Risk · engel · kısıt</div>
                {cpFindings.map((f) => (
                  <div key={f.title} className="rounded-md border-l-[3px] bg-[var(--surface-2)] px-3 py-2" style={{ borderColor: `var(--${f.tone})` }}>
                    <div className="flex items-center gap-2"><Badge tone={f.tone}>{f.type}</Badge><span className="text-[12.5px] font-semibold text-[var(--ink)]">{f.title}</span></div>
                    <p className="mt-0.5 text-[12px] text-[var(--muted)]">{f.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )
      })}
      {adding && (
        <Modal title="Kritik yol analizi" onClose={() => setAdding(false)} note="Analiz edilecek programı seçin; kritik yol ve bolluklar otomatik hesaplanır."
          footer={<span className="ml-auto flex gap-2"><Btn onClick={() => setAdding(false)}>Vazgeç</Btn>
            <Btn primary onClick={() => { setAnalyses((l) => [{ id: `CP-${l.length + 1}`, program: pick, at: TODAY }, ...l]); setAdding(false) }}>Analiz et</Btn></span>}>
          <select value={pick} onChange={(e) => setPick(e.target.value)} className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-2 text-[13px] text-[var(--ink)] outline-none">
            {programs.map((p) => <option key={p.id} value={p.id}>{p.title} · Rev.{p.rev}</option>)}
          </select>
        </Modal>
      )}
    </>
  )
}

/* ---------------- Mitigation Plan ---------------- */

export function MitigationPlan() {
  const [plans, setPlans] = useState<{ id: string; program: string; rev: number; transferred: boolean; actions: RecoveryAction[] }[]>(
    [{ id: 'RP-1', program: 'WS-1', rev: 1, transferred: false, actions: recoveryActions }],
  )
  const [adding, setAdding] = useState(false)
  const [pick, setPick] = useState(programs[0].id)
  const delay = 35

  return (
    <>
      <PageHead title="Planning · Mitigation Plan"
        note="Plan ile gerçekleşen arasında sapma oluştuğunda (proje geriye düşmeye başladığında) recovery planı burada kurulur: program seçilir, gecikmeyi telafi edecek öneriler ve revize plan görülür. Kabul edilen plan “ana programa aktar” ile işlenir."
        right={<><PrintButtons /><Btn primary onClick={() => setAdding(true)}>+ Recovery planı</Btn></>} />
      {plans.map((rp) => {
        const p = programs.find((x) => x.id === rp.program) ?? programs[0]
        const gain = rp.actions.filter((a) => a.include).reduce((s, a) => s + a.gain, 0)
        const crit = p.activities.filter((a) => a.critical && a.progress < 100)
        const shift = (iso: string, d: number) => { const t = new Date(iso); t.setDate(t.getDate() - d); return t.toISOString().slice(0, 10) }
        const rows: GanttRow[] = crit.map((a, i) => {
          const g = Math.round((gain * (i + 1)) / crit.length)
          return { code: a.code, name: a.name, start: shift(a.start, i ? Math.round((gain * i) / crit.length) : 0), finish: shift(a.finish, g - (delay - gain > 0 ? 0 : 0)), progress: a.progress, critical: true, ghost: { start: a.start, finish: a.finish } }
        })
        const toggle = (id: string) => setPlans((l) => l.map((x) => (x.id === rp.id ? { ...x, actions: x.actions.map((a) => (a.id === id ? { ...a, include: !a.include } : a)) } : x)))
        return (
          <Card key={rp.id} title={`${p.title} — recovery planı`} subtitle={`${rp.id} · Rev.${rp.rev}`}
            right={<>
              {rp.transferred ? <Badge tone="ok" dot>Ana programa aktarıldı</Badge>
                : <Btn small primary onClick={() => setPlans((l) => l.map((x) => (x.id === rp.id ? { ...x, transferred: true } : x)))}>Ana programa aktar</Btn>}
              <Btn small onClick={() => setPlans((l) => l.map((x) => (x.id === rp.id ? { ...x, rev: x.rev + 1 } : x)))}>Rev et</Btn>
              <RowActions name={rp.id} onDelete={() => setPlans((l) => l.filter((x) => x.id !== rp.id))} />
            </>}>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi label="Mevcut gecikme" value={`${delay} gün`} sub="Sözleşme bitişine göre" tone="crit" />
              <Kpi label="Önerilerle kazanılan" value={`${gain} gün`} sub={`${rp.actions.filter((a) => a.include).length} öneri seçili`} tone="ok" />
              <Kpi label="Kalan gecikme" value={`${Math.max(0, delay - gain)} gün`} tone={delay - gain > 7 ? 'warn' : 'ok'} />
              <Kpi label="Revize bitiş" value={date(shift('2027-01-24', gain))} sub="Sözleşme 20 Ara 2026" tone="accent" />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
              <div className="xl:col-span-5">
                <div className="mb-2 flex items-center">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Öneriler</span>
                  <span className="ml-auto"><IconBtn icon="add" title="Öneri ekle" onClick={() => setPlans((l) => l.map((x) => (x.id === rp.id ? { ...x, actions: [...x.actions, { id: `R-${x.actions.length + 1}`, title: 'Yeni öneri', activity: '—', gain: 0, resource: '—', include: false }] } : x)))} /></span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {rp.actions.map((a) => (
                    <label key={a.id} className="flex cursor-pointer items-start gap-2.5 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                      <input type="checkbox" checked={a.include} onChange={() => toggle(a.id)} className="mt-0.5" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12.5px] font-medium text-[var(--ink)]">{a.title}</span>
                        <span className="block text-[11px] text-[var(--muted)]"><span className="mono">{a.activity}</span> · {a.resource}</span>
                      </span>
                      <span className="text-[12.5px] font-bold text-[var(--ok)] tnum">−{a.gain} gün</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="xl:col-span-7">
                <div className="mb-2 flex items-center">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Revize plan — kritik aktiviteler</span>
                  <span className="ml-auto"><Legend items={[{ label: 'Recovery', color: 'var(--crit)' }, { label: 'Mevcut plan', color: 'var(--border-strong)' }]} /></span>
                </div>
                <div className="rounded-md border border-[var(--border)]"><Gantt rows={rows} from="2026-03-01" to="2027-01-31" today={TODAY} compact labelW={220} /></div>
              </div>
            </div>
          </Card>
        )
      })}
      {adding && (
        <Modal title="Recovery planı" onClose={() => setAdding(false)} note="Programı seçin; sapma analiz edilip telafi önerileri üretilir."
          footer={<span className="ml-auto flex gap-2"><Btn onClick={() => setAdding(false)}>Vazgeç</Btn>
            <Btn primary onClick={() => { setPlans((l) => [{ id: `RP-${l.length + 1}`, program: pick, rev: 1, transferred: false, actions: recoveryActions.map((a) => ({ ...a })) }, ...l]); setAdding(false) }}>Oluştur</Btn></span>}>
          <select value={pick} onChange={(e) => setPick(e.target.value)} className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-2 text-[13px] text-[var(--ink)] outline-none">
            {programs.map((p) => <option key={p.id} value={p.id}>{p.title} · Rev.{p.rev}</option>)}
          </select>
        </Modal>
      )}
    </>
  )
}

/* ---------------- Risks (planlama) ---------------- */

const CAT_COLORS = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)', 'var(--series-5)']

/** Plan · mevcut · recovery eğrileri — kaynak türüne göre küçük farklarla */
function curves(scale: number) {
  const n = 24
  const plan = plannedCum.map((v) => v)
  const now = 20
  const current: (number | null)[] = plannedCum.map((_, i) => {
    if (i <= now) return Math.min(100, actualCum[i] * scale)
    const last = actualCum[now] * scale
    return Math.min(100, last + ((i - now) / (n - 1 - now)) * (96 - last))
  })
  const recovery: (number | null)[] = plannedCum.map((_, i) => (i < now ? null : i === now ? current[now] : Math.min(100, (current[now] as number) + ((i - now) / (n - 1 - now)) * (100 - (current[now] as number)) * 1.02)))
  return { plan, current, recovery }
}

export function PlanningRisks() {
  const labels = plannedCum.map((_, i) => monthName(i + 1))
  const res = [
    { t: 'Personel (insan-saat)', ...curves(1.0) },
    { t: 'Makine (makine-saat)', ...curves(1.03) },
    { t: 'Malzeme (teslim)', ...curves(0.97) },
  ]
  const toneOf = (t: 'crit' | 'warn' | 'neutral' | 'ok') => t

  return (
    <>
      <PageHead title="Planning · Risks"
        note="En son kullanılan iş programı üzerinde otomatik analizler: bağlantılar, yapı, kurgu, kaynak ve personel-makine atamalarının uyumu kontrol edilir; düzeltme önerileri ve riskler çıkarılır. Risk tipleri, dağılımları ve muhtemel bitiş ertelemesi ile plan · mevcut · recovery eğrileri burada görülür."
        right={<PrintButtons />} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Program kontrolü" help={`Analiz edilen program: ${programs[1].title} · Rev.${programs[1].rev}. Her kontrol program her güncellendiğinde yeniden çalışır.`} pad={false}>
          {scheduleChecks.map((c) => (
            <div key={c.check} className="flex items-start gap-2 border-b border-[var(--border)] px-3 py-2 last:border-0">
              <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" style={{ background: `var(--${toneOf(c.tone) === 'neutral' ? 'faint' : c.tone})` }} />
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] text-[var(--ink)]">{c.check}</span>
                <span className="block text-[11px] text-[var(--muted)]">{c.hint}</span>
              </span>
              <span className="text-right text-[12px] font-semibold" style={{ color: c.tone === 'neutral' ? 'var(--muted)' : `var(--${c.tone})` }}>{c.result}</span>
            </div>
          ))}
        </Card>

        <Card title="Risk tipleri ve bitiş öngörüsü" help="Programdaki risklerin kaynağına göre dağılımı ve olasılıksal bitiş tarihi (P50: %50 ihtimalle bu tarihte ya da önce biter)." pad={false}>
          {riskTypes.map((r, i) => (
            <div key={r.label} className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: CAT_COLORS[i] }} />
              <span className="text-[12.5px] text-[var(--ink)]">{r.label}</span>
              <span className="ml-auto text-[12px] text-[var(--muted)] tnum">%{r.value}</span>
            </div>
          ))}
          {finishForecast.map((f) => (
            <div key={f.label} className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-1.5 last:border-0">
              <span className="text-[12px] text-[var(--muted)]">{f.label}</span>
              <span className="ml-auto text-[12.5px] font-semibold tnum" style={{ color: f.delay > 7 ? 'var(--crit)' : f.delay > 0 ? 'var(--warn)' : 'var(--ok)' }}>
                {date(f.date)}{f.delay ? ` (+${f.delay})` : ''}
              </span>
            </div>
          ))}
        </Card>

        <Card title="Plan · mevcut · recovery" help="Mitigation mantığıyla: bugünkü gidişle (mevcut) ve recovery planıyla işin tamamlanma oranı. Kaynak türüne göre ayrı ayrı." pad={false}>
          {res.map((r) => (
            <div key={r.t} className="border-b border-[var(--border)] px-3 py-2 last:border-0">
              <div className="text-[12.5px] font-medium text-[var(--ink)]">{r.t}</div>
              <div className="mt-0.5 flex gap-3 text-[11.5px] text-[var(--muted)] tnum">
                <span>Plan <b className="text-[var(--ink)]">%{Math.round(r.plan[20])}</b></span>
                <span>Mevcut <b className="text-[var(--ink)]">%{Math.round(r.current[20] as number)}</b></span>
                <span>Bitişte mevcut <b className="text-[var(--crit)]">%{Math.round(r.current[23] as number)}</b></span>
                <span>Recovery <b className="text-[var(--ok)]">%100</b></span>
              </div>
            </div>
          ))}
          <div className="px-3 py-2 text-[11.5px] text-[var(--faint)]">Recovery planı: Mitigation Plan sayfasındaki RP-1.</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Kaynak eğrileri" right={<Legend items={[
          { label: 'Plan', color: 'var(--series-2)', dashed: true }, { label: 'Mevcut', color: 'var(--series-1)' }, { label: 'Recovery', color: 'var(--series-3)' },
        ]} />}>
          <div className="flex flex-col gap-3">
            {res.map((r) => (
              <div key={r.t}>
                <div className="mb-0.5 text-[11.5px] font-medium text-[var(--muted)]">{r.t}</div>
                <MultiLine labels={labels} height={120} today={20} series={[
                  { label: 'Plan', color: 'var(--series-2)', values: r.plan, dashed: true },
                  { label: 'Mevcut', color: 'var(--series-1)', values: r.current },
                  { label: 'Recovery', color: 'var(--series-3)', values: r.recovery },
                ]} />
              </div>
            ))}
          </div>
        </Card>
        <Card title="Risk dağılımı">
          <div className="grid h-full place-items-center">
            <Donut size={170} parts={riskTypes.map((r, i) => ({ label: r.label, value: r.value, color: CAT_COLORS[i] }))}
              center={<div><div className="text-[18px] font-bold text-[var(--crit)] tnum">+28</div><div className="text-[10.5px] text-[var(--muted)]">gün (P50)</div></div>} />
          </div>
        </Card>
        <Card title="Personel yüklemesi" help="Önümüzdeki 6 ayda programın gerektirdiği personel ve saha kapasitesi. Kapasiteyi aşan aylar program riskidir."
          right={<Legend items={[{ label: 'Gereken', color: 'var(--series-1)' }, { label: 'Kapasite', color: 'var(--series-2)' }]} />}>
          <MonthColumns data={manpowerLoad.map((m) => ({ label: m.label, plan: m.cap, actual: m.need }))} format={(v) => `${num(v)} kişi`} height={200} />
        </Card>
      </div>
    </>
  )
}
