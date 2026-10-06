import { useState } from 'react'
import type { ReactNode } from 'react'
import { Badge, Btn, Card, Kpi, Modal, PageHead } from '../../components/ui'
import { date, moneyShort, pct } from '../../lib/format'
import { Legend, MultiLine, Ring } from '../charts'
import {
  actualCum, changeOrders, claims, costLines, docSets, evm, ipcs, milestones, monthName, plannedCum, prj,
  scopeStatus, subcontracts, topRisks, weekTodos,
} from '../data'
import type { Milestone } from '../data'
import { programs } from '../planningData'
import { ME, seedNotes } from './Communication'
import { menuFor } from '../menu'
import type { Persona } from '../../lib/roles'

const TODAY = '2026-09-27'
const dayMs = (iso: string) => new Date(iso).getTime() / 86_400_000

/** Satın alma ve depo ekranları ek paket olarak satılır; alınmışsa depo tutarı Home'da görünür */
const PROCUREMENT_PACKAGE = true

/** Proje ekibi Admin Konsolu'nu görmez; bağlantılar kendi ekranlarına yönlenir */
const TEAM_LINK: Record<string, string | null> = { claim: 'p_disruptions', change_order: null, contract: null, a_planning: 'critical_path', phrs: 'site_activity' }

const fmt2 = (v: number) => v.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Aktivitenin bugüne göre beklenen ilerlemesiyle karşılaştırılması: yolunda / riskte / geride */
function scheduleState(a: { start: string; finish: string; progress: number; critical?: boolean }) {
  const t = Math.min(1, Math.max(0, (dayMs(TODAY) - dayMs(a.start)) / Math.max(1, dayMs(a.finish) - dayMs(a.start))))
  const expected = t * 100
  if (a.progress >= 100 || expected === 0) return 'on'
  if (a.progress < expected - 12) return 'behind'
  if (a.progress < expected - 3 || (a.critical && a.progress < expected)) return 'risk'
  return 'on'
}

/** EVM sağlık kontrolü — SPI ve CPI birlikte okunur */
function evmVerdict(spi: number, cpi: number): { text: string; todo: string; tone: 'ok' | 'warn' | 'crit' } {
  if (spi >= 1 && cpi >= 1) return { text: 'Programın önünde, bütçenin altında', todo: 'Performansı koru', tone: 'ok' }
  if (spi >= 1) return { text: 'Programın önünde, bütçe aşılıyor', todo: 'Maliyeti kontrol et', tone: 'warn' }
  if (cpi >= 1) return { text: 'Programın gerisinde, bütçenin altında', todo: 'Programa odaklan', tone: 'warn' }
  return { text: 'Programın gerisinde ve bütçe aşılıyor', todo: 'Düzeltici aksiyon al', tone: 'crit' }
}

const MS_COLOR: Record<Milestone['state'], string> = {
  Tamamlandı: 'var(--ok)', Geride: 'var(--warn)', İptal: '#475467', Planlandı: 'var(--accent)',
}

/**
 * Proje açılınca gelen karşılama ekranı. Üstte tutarlar; altında kapsam / program / bütçe halkaları,
 * kilometre taşları ve SPI–CPI; sonra riskler, yapılacaklar, değişiklik emri–hak talebi ve haftanın konuları.
 */
export function Home({ onGo, persona }: { onGo: (k: string) => void; persona: Persona }) {
  const menu = menuFor(persona)
  const [showDocs, setShowDocs] = useState(false)
  const [notes, setNotes] = useState(seedNotes)
  const [week, setWeek] = useState(weekTodos)
  const { spi, cpi, actual, planned } = evm()
  const fromEmployer = ipcs.reduce((a, i) => a + i.gross, 0)
  const toSubs = subcontracts.reduce((a, s) => a + s.done, 0)
  const purchases = (costLines.find((c) => c.name === 'Malzeme')?.actual ?? 0) + 1_100_000
  const stock = 640_000
  const slip = Math.round(dayMs(prj.forecastFinish) - dayMs(prj.plannedFinish))
  const go = (k: string) => {
    const target = persona === 'patron' ? k : TEAM_LINK[k] === undefined ? k : TEAM_LINK[k]
    if (target) onGo(target)
  }

  /* 2 — kapsam, program, bütçe */
  const acts = programs[0].activities
  const sched = { on: 0, risk: 0, behind: 0 }
  acts.forEach((a) => { sched[scheduleState(a) as keyof typeof sched]++ })
  const spent = costLines.reduce((a, c) => a + c.actual, 0)
  const committed = costLines.reduce((a, c) => a + c.committed, 0)
  const eac = costLines.reduce((a, c) => a + c.forecast, 0)
  const scopeTotal = scopeStatus.inScope + scopeStatus.atRisk + scopeStatus.outOfScope

  /* 4 — PV / EV / AC (bütçenin yüzdesi olarak) */
  const ac = plannedCum.map((_, i) => (i < actualCum.length ? Math.round((actualCum[i] / (1 - 0.06 * (i / (actualCum.length - 1)))) * 10) / 10 : null))
  const verdict = evmVerdict(spi, cpi)

  /* 7 — değişiklik emirleri ve hak talepleri */
  const coGroups = {
    ok: changeOrders.filter((c) => ['Onaylandı', 'İmalatta', 'Tamamlandı'].includes(c.state)),
    open: changeOrders.filter((c) => c.state === 'İşveren onayında'),
    no: changeOrders.filter((c) => c.state === 'Reddedildi'),
  }
  const clGroups = {
    ok: claims.filter((c) => c.state === 'Kısmen kabul'),
    open: claims.filter((c) => c.state !== 'Kısmen kabul'),
    no: [] as typeof claims,
  }

  /* 6 — yapılacaklar: bana atanan ya da benim açtığım açık görevler */
  const todos = notes.filter((n) => n.kind === 'Görev' && (!!n.assignees?.includes(ME) || n.owner === ME))

  return (
    <>
      <PageHead
        title="Home"
        note="Projenin genel bilgisi, tutarları ve ilerlemesi. Buradaki her sayı alt modüllerden (Progress, Planning, IPC, Procurement…) gelir; kutulara tıklayınca ilgili ekran açılır."
        right={<Btn onClick={() => setShowDocs(true)} title="İhale ve proje dönemi doküman setleri">Doküman setleri</Btn>}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Fiziksel ilerleme" value={pct(actual)} sub={`Planlanan ${pct(planned, 1)}`} tone="accent"
          help="Sahada onaylanan imalat miktarlarının metraj ağırlığıyla toplamı. Planlanan değer işverenle mutabık programdan gelir." />
        <Kpi label="Sözleşme bedeli" value={moneyShort(prj.contractValue + prj.approvedChange, prj.currency)}
          sub={`Değişiklik emri dâhil (+${moneyShort(prj.approvedChange, prj.currency)})`} />
        <Kpi label="İşverenden hakediş" value={moneyShort(fromEmployer, prj.currency)} sub={`Gross · ${ipcs.length} hakediş`}
          help="İşverene kesilen hakedişlerin kesintiler öncesi (gross) toplamı." />
        <Kpi label="Alt yükleniciye hakediş" value={moneyShort(toSubs, prj.currency)} sub={`Gross · ${subcontracts.length} alt yüklenici`}
          help="Alt yüklenicilere kesilen hakedişlerin gross toplamı." />
        <Kpi label="Malzeme ve hizmet alımı" value={moneyShort(purchases, prj.currency)} sub="Siparişi verilen alımlar"
          help="Satın alınan malzeme ve hizmetlerin toplamı." />
        {PROCUREMENT_PACKAGE
          ? <Kpi label="Depo tutarı" value={moneyShort(stock, prj.currency)} sub="Sahada ve depoda stok"
            help="Procurement paketi alındığında aktif olur: depodaki malzemenin güncel değeri." />
          : <Kpi label="Depo tutarı" value="—" sub="Procurement paketiyle açılır" />}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* 2 — kapsam, program, bütçe */}
        <div className="xl:col-span-6">
          <Card title="Proje durumu" help="Kapsam: sözleşme kalemlerinin durumu. Program: aktivitelerin bugüne göre beklenen ilerlemeyle karşılaştırması. Bütçe: tamamlanınca öngörülen maliyetin (EAC) harcanan, siparişi verilmiş ve kalan kısmı. Her halkanın altındaki not verilerden otomatik yazılır.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <RingBlock title="Kapsam" center={<Center v={scopeTotal} l="kalem" />}
                parts={[
                  { label: 'Kapsamda', value: scopeStatus.inScope, color: 'var(--ok)' },
                  { label: 'Riskte', value: scopeStatus.atRisk, color: 'var(--warn)' },
                  { label: 'Kapsam dışı', value: scopeStatus.outOfScope, color: 'var(--crit)' },
                ]}
                note={`${scopeStatus.atRisk} kalem metraj farkı ya da tasarım revizyonu nedeniyle riskte. ${scopeStatus.outOfScope} kalem sözleşme dışı — değişiklik emri veya hak talebine bağlanmalı.`}
                onClick={() => go('change_order')} />
              <RingBlock title="İş programı" center={<Center v={acts.length} l="aktivite" />}
                parts={[
                  { label: 'Yolunda', value: sched.on, color: 'var(--ok)' },
                  { label: 'Riskte', value: sched.risk, color: 'var(--warn)' },
                  { label: 'Geride', value: sched.behind, color: 'var(--crit)' },
                ]}
                note={`${sched.behind} aktivite beklenen ilerlemenin 12 puandan fazla gerisinde; ${sched.risk} aktivite riskte. Kritik yolda Depo C çatı montajı belirleyici.`}
                onClick={() => onGo('work_schedule')} />
              <RingBlock title="Bütçe" center={<Center v={moneyShort(eac, '').trim()} l={`${prj.currency} öngörülen`} />} format={(v) => moneyShort(v, '')}
                parts={[
                  { label: 'Gerçekleşti', value: spent, color: 'var(--series-1)' },
                  { label: 'Devam ediyor', value: committed - spent, color: 'var(--series-2)' },
                  { label: 'Kalan', value: Math.max(0, eac - committed), color: '#98A2B3' },
                ]}
                note={`Harcanan ${moneyShort(spent, prj.currency)}; siparişi verilip henüz gerçekleşmeyen ${moneyShort(committed - spent, prj.currency)}. Öngörülen maliyet bütçeyi ${moneyShort(eac - costLines.reduce((a, c) => a + c.budget, 0), prj.currency)} aşıyor.`}
                onClick={() => onGo('budget_detail')} />
            </div>
          </Card>
        </div>

        {/* 3 — kilometre taşları */}
        <div className="xl:col-span-3">
          <Card title="Kilometre taşları" help="Yeşil tamamlandı, turuncu geride, koyu gri iptal edildi, mavi halka henüz gelmedi.">
            <ol className="relative flex flex-col">
              {milestones.map((m, i) => (
                <li key={m.name} className="relative flex gap-2.5 pb-3 last:pb-0">
                  {i < milestones.length - 1 && <span className="absolute left-[6px] top-4 h-full w-[2px] bg-[var(--border)]" />}
                  <span className="relative z-[1] mt-[3px] h-[14px] w-[14px] flex-shrink-0 rounded-full"
                    style={m.state === 'Planlandı' ? { border: `2.5px solid ${MS_COLOR[m.state]}`, background: 'var(--surface)' } : { background: MS_COLOR[m.state], boxShadow: '0 0 0 2px var(--surface)' }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="truncate text-[12.5px] font-semibold" style={{ color: m.state === 'İptal' ? 'var(--muted)' : 'var(--ink)', textDecoration: m.state === 'İptal' ? 'line-through' : undefined }}>{m.name}</span>
                      <span className="ml-auto flex-shrink-0 text-[11px] text-[var(--muted)] tnum">{date(m.date)}</span>
                    </div>
                    <div className="text-[11px]" style={{ color: MS_COLOR[m.state] }}>{m.state} <span className="text-[var(--faint)]">· {m.note}</span></div>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        {/* 4 — SPI, CPI ve fiziksel ilerleme */}
        <div className="xl:col-span-3">
          <Card title="Performans" help="SPI program, CPI maliyet performansıdır; 1’in altı gerideyiz / bütçe aşılıyor demektir. Grafikte PV planlanan değer, EV kazanılan değer (yapılan işin bütçedeki karşılığı), AC gerçekleşen maliyet; hepsi bütçenin yüzdesi olarak. EV, PV’nin altındaysa programın gerisindeyiz; AC, EV’nin üstündeyse bütçe aşılıyor.">
            <div className="grid grid-cols-3 gap-2">
              {[
                { l: 'SPI', v: fmt2(spi), tone: spi >= 1 ? 'ok' : spi >= 0.95 ? 'warn' : 'crit' },
                { l: 'CPI', v: fmt2(cpi), tone: cpi >= 1 ? 'ok' : cpi >= 0.95 ? 'warn' : 'crit' },
                { l: 'Fiziksel', v: pct(actual), tone: 'accent' },
              ].map((x) => (
                <div key={x.l} className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5">
                  <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--faint)]">{x.l}</div>
                  <div className="text-[18px] font-bold tnum" style={{ color: `var(--${x.tone}-ink)` }}>{x.v}</div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2 rounded-md px-2.5 py-1.5 text-[12px]" style={{ background: `var(--${verdict.tone}-bg)` }}>
              <span className="font-bold" style={{ color: `var(--${verdict.tone}-ink)` }}>{verdict.tone === 'crit' ? '✕' : verdict.tone === 'warn' ? '!' : '✓'}</span>
              <span className="leading-snug text-[var(--ink)]">{verdict.text}<b className="block" style={{ color: `var(--${verdict.tone}-ink)` }}>→ {verdict.todo}</b></span>
            </div>
            <div className="mt-3">
              <MultiLine height={150} today={prj.today - 1} labels={plannedCum.map((_, i) => monthName(i + 1))}
                series={[
                  { label: 'EV · kazanılan', color: 'var(--series-1)', values: actualCum },
                  { label: 'PV · planlanan', color: 'var(--series-2)', values: plannedCum, dashed: true },
                  { label: 'AC · maliyet', color: 'var(--series-3)', values: ac, dotted: true },
                ]} />
            </div>
            <div className="mt-2 flex flex-col gap-1.5">
              <Legend items={[{ label: 'EV kazanılan', color: 'var(--series-1)' }, { label: 'PV planlanan', color: 'var(--series-2)', dashed: true }, { label: 'AC maliyet', color: 'var(--series-3)', dashed: true }]} />
              <span className="text-[11px] text-[var(--muted)]">Öngörülen bitiş <b style={{ color: 'var(--warn-ink)' }}>{date(prj.forecastFinish)} (+{slip} gün)</b></span>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* 5 — en yüksek 5 risk */}
        <Card title="En yüksek 5 risk" help="Olasılık × etki (1–5) puanına göre sıralanır. Ok, riskin son iki haftadaki yönünü gösterir." pad={false}>
          <div className="flex flex-col">
            {topRisks.map((r, i) => {
              const score = r.p * r.i
              const tone = score >= 16 ? 'crit' : score >= 9 ? 'warn' : 'ok'
              return (
                <div key={r.id} className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-2 last:border-0">
                  <span className="w-4 text-[12px] font-bold text-[var(--faint)] tnum">{i + 1}</span>
                  <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-md text-[13px] font-bold tnum" style={{ background: `var(--${tone}-bg)`, color: `var(--${tone}-ink)` }}
                    title={`Olasılık ${r.p} × Etki ${r.i}`}>{score}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-semibold text-[var(--ink)]">{r.title}</div>
                    <div className="truncate text-[11.5px] text-[var(--muted)]"><span className="mono">{r.id}</span> · {r.owner} · {r.action}</div>
                  </div>
                  <span className="text-[13px] font-bold" title={r.trend === 'up' ? 'Artıyor' : r.trend === 'down' ? 'Azalıyor' : 'Değişmedi'}
                    style={{ color: r.trend === 'up' ? 'var(--crit-ink)' : r.trend === 'down' ? 'var(--ok-ink)' : 'var(--faint)' }}>{r.trend === 'up' ? '↑' : r.trend === 'down' ? '↓' : '→'}</span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* 6 — yapılacaklar */}
        <Card title={`To-Do (${todos.filter((t) => !t.done).length} açık)`} help="Communication not defterinden: size atanan ve sizin atadığınız görevler. İşaretleyince tamamlanır."
          right={<Btn small onClick={() => onGo('communication')}>Not defterini aç</Btn>} pad={false}>
          <div className="flex flex-col">
            {todos.map((n) => (
              <label key={n.id} className="flex cursor-pointer items-center gap-3 border-b border-[var(--border)] px-4 py-2.5 last:border-0 hover:bg-[var(--surface-2)]">
                <input type="checkbox" checked={n.done} onChange={() => setNotes((l) => l.map((x) => (x.id === n.id ? { ...x, done: !x.done } : x)))} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-medium" style={{ color: n.done ? 'var(--faint)' : 'var(--ink)', textDecoration: n.done ? 'line-through' : undefined }}>{n.text}</div>
                  <div className="text-[11.5px] text-[var(--muted)]">{n.assignees?.includes(ME) ? `${n.owner} atadı` : `${n.assignees?.join(', ')} kişisine atandı`}</div>
                </div>
                {n.due && <Badge tone={n.done ? 'neutral' : n.due <= '2026-10-04' ? 'warn' : 'neutral'}>{date(n.due)}</Badge>}
              </label>
            ))}
          </div>
        </Card>

        {/* 7 — değişiklik emri ve hak talebi */}
        <Card title="Değişiklik emirleri ve hak talepleri" help="Üstte toplam tutar, altında onaylanan, devam eden ve reddedilen adetleri. Kutuya tıklayınca ilgili liste açılır.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StatusBox title="Change order" onClick={() => go('change_order')}
              total={changeOrders.reduce((a, c) => a + c.amount, 0)} approved={coGroups.ok.reduce((a, c) => a + c.amount, 0)}
              counts={[coGroups.ok.length, coGroups.open.length, coGroups.no.length]} />
            <StatusBox title="Claim" onClick={() => go('claim')}
              total={claims.reduce((a, c) => a + c.amount, 0)} approved={clGroups.ok.reduce((a, c) => a + c.amount * 0.6, 0)}
              counts={[clGroups.ok.length, clGroups.open.length, clGroups.no.length]} />
          </div>
        </Card>

        {/* 8 — bu haftanın konuları */}
        <Card title="Bu hafta · 28 Eyl – 04 Eki" help="İçinde bulunulan haftanın yapılacakları: bildirim süreleri, teslimler, onaylar ve toplantılar. Alt modüllerden otomatik düşer; satıra tıklayınca ilgili ekran açılır." pad={false}>
          <div className="flex flex-col">
            {week.map((w, i) => (
              <div key={i} className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-2 last:border-0 hover:bg-[var(--surface-2)]">
                <input type="checkbox" checked={!!w.done} onChange={() => setWeek((l) => l.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))} />
                <span className="w-[74px] flex-shrink-0 text-[11.5px] text-[var(--muted)] tnum">{new Date(w.day).toLocaleDateString('tr-TR', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
                <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: w.tone === 'neutral' ? 'var(--border-strong)' : `var(--${w.tone})` }} />
                <button onClick={() => w.go && go(w.go)} className="min-w-0 flex-1 truncate text-left text-[12.5px] hover:text-[var(--accent)]"
                  style={{ color: w.done ? 'var(--faint)' : 'var(--ink)', textDecoration: w.done ? 'line-through' : undefined }}>{w.text}</button>
                <span className="flex-shrink-0 text-[11px] text-[var(--faint)]">{w.owner}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Modüller" help="Proje dönemi modülleri. Soluk olanların kurgusu yazıldı, ekranları sıradaki adımlarda çizilecek.">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
          {menu.map((g) => {
            const ready = g.ready || g.items.some((i) => i.ready)
            return (
              <button key={g.key} onClick={() => onGo(g.items[0]?.key ?? g.key)}
                className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-left transition-colors hover:border-[var(--accent)]">
                <div className="text-[12.5px] font-semibold" style={{ color: ready ? 'var(--ink)' : 'var(--faint)' }}>{g.label}</div>
                <div className="mt-0.5 text-[11px] text-[var(--faint)]">{g.items.length ? `${g.items.length} ekran` : 'tek ekran'}{ready ? ' · hazır' : ''}</div>
              </button>
            )
          })}
        </div>
      </Card>

      {showDocs && <DocSetsModal persona={persona} onClose={() => setShowDocs(false)} />}
    </>
  )
}

function Center({ v, l }: { v: ReactNode; l: string }) {
  return <div><div className="text-[15px] font-bold leading-tight text-[var(--ink)] tnum">{v}</div><div className="text-[10px] text-[var(--muted)]">{l}</div></div>
}

/** Halka + lejant + otomatik analiz notu */
function RingBlock({ title, parts, center, note, onClick, format }: {
  title: string; parts: { label: string; value: number; color: string }[]; center: ReactNode; note: string; onClick: () => void; format?: (v: number) => string
}) {
  return (
    <div className="flex flex-col gap-2">
      <button onClick={onClick} className="text-left text-[12px] font-semibold uppercase tracking-wide text-[var(--muted)] hover:text-[var(--accent)]">{title} →</button>
      <Ring parts={parts} center={center} format={format} />
      <p className="flex gap-1.5 rounded-md bg-[var(--surface-2)] px-2 py-1.5 text-[11.5px] leading-snug text-[var(--muted)]">
        <span className="font-bold text-[var(--accent)]">AI</span>{note}
      </p>
    </div>
  )
}

function StatusBox({ title, total, approved, counts, onClick }: { title: string; total: number; approved: number; counts: number[]; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 text-left transition-colors hover:border-[var(--accent)]">
      <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">{title}</span>
      <span className="mt-0.5 text-[22px] font-bold leading-tight text-[var(--ink)] tnum">{moneyShort(total, prj.currency)}</span>
      <span className="text-[11.5px] text-[var(--muted)]">Onaylanan {moneyShort(approved, prj.currency)}</span>
      <span className="mt-2.5 grid grid-cols-3 gap-1.5">
        {([['Onaylandı', 'ok'], ['Devam ediyor', 'warn'], ['Reddedildi', 'crit']] as const).map(([l, t], i) => (
          <span key={l} className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-center">
            <span className="block text-[18px] font-bold leading-tight tnum" style={{ color: `var(--${t}-ink)` }}>{counts[i]}</span>
            <span className="block text-[10.5px] text-[var(--muted)]">{l}</span>
          </span>
        ))}
      </span>
    </button>
  )
}

/**
 * Doküman setleri — gözden uzak, pop-up içinde.
 * Set 1 ihale dokümanları (kilitli), Set 2 proje dönemi dokümanları (Set 1 ile karşılaştırılır),
 * Set 3 işverenle yeni anlaşma olunca açılır. Doküman eklemeyi yalnızca yetkili kullanıcılar yapar.
 */
function DocSetsModal({ persona, onClose }: { persona: Persona; onClose: () => void }) {
  const [target, setTarget] = useState<string | null>(null)
  const canAdd = persona === 'patron'
  return (
    <Modal title="Doküman setleri" wide onClose={onClose}
      note="İhale modülünde analiz edilip kilitlenen dokümanlar “projeye aktar” ile Set 1’e gelir. Proje dönemindeki yeni dokümanlar Set 2’ye yüklenir ve Set 1 ile karşılaştırılır. Set 2 işverenle yeni bir anlaşmayla kabul edilirse Set 3 açılır ve Set 1+2 ile karşılaştırılır."
      footer={<>
        <span className="text-[11.5px] text-[var(--faint)]">{canAdd ? 'Doküman eklemeye yetkilisiniz' : 'Doküman eklemeyi yalnızca yetkili kullanıcılar yapabilir'}</span>
        <span className="ml-auto"><Btn onClick={onClose}>Kapat</Btn></span>
      </>}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {docSets.map((s) => (
          <div key={s.set} className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3"
            style={s.docs === 0 ? { borderStyle: 'dashed' } : undefined}>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-[var(--ink)]">{s.set}</span>
              <span className="ml-auto">{s.locked ? <Badge tone="neutral">🔒 kilitli</Badge> : s.docs === 0 ? <Badge tone="neutral">kapalı</Badge> : <Badge tone="accent">açık</Badge>}</span>
            </div>
            <div className="mt-0.5 text-[12px] text-[var(--muted)]">{s.title}</div>
            <div className="mt-2 text-[22px] font-bold leading-none text-[var(--ink)] tnum">{s.docs}<span className="ml-1 text-[12px] font-normal text-[var(--muted)]">doküman</span></div>
            <div className="mt-1.5 flex-1 text-[11.5px] text-[var(--muted)]">{s.note}{s.date ? ` · ${date(s.date)}` : ''}</div>
            {s.set !== 'Set 3' && (
              <div className="mt-2.5">
                <Btn small disabled={!canAdd} onClick={() => setTarget(s.set)}>+ {s.set}’e doküman ekle</Btn>
              </div>
            )}
          </div>
        ))}
      </div>
      {target && (
        <div className="mt-3 rounded-lg border-2 border-dashed border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-5 text-center text-[12.5px] text-[var(--muted)]">
          📄 {target} için dosyaları buraya sürükleyin — yüklenen dosya analiz edilir ve {target === 'Set 2' ? 'Set 1 ile karşılaştırılır' : 'kilitlenir'}.
        </div>
      )}
    </Modal>
  )
}
