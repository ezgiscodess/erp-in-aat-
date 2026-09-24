import { useState } from 'react'
import { boqItems, scheduleMilestones, scheduleTasks, project } from '../data/mock'
import type { ScheduleMilestone, ScheduleTask, TabKey } from '../data/types'
import {
  AddonBadge, Badge, Bar, Btn, Card, Field, IconBtn, Kpi, Modal, PageHead, RowActions, ReadOnlyNote, StickyPane, Table, Td, Th,
} from '../components/ui'
import { date, num } from '../lib/format'

const MONTHS = 24

/** Ay numarasından takvim etiketi — işe başlama Kasım 2026 varsayımıyla. */
const START = new Date(2026, 10, 1)
function monthLabel(m: number): string {
  const d = new Date(START.getFullYear(), START.getMonth() + m, 1)
  return new Intl.DateTimeFormat('tr-TR', { month: 'short', year: '2-digit' }).format(d)
}

/** Aktiviteler ayın 1'inde başlar/biter — planlama dosyalarındaki alışkanlık. */
function monthDate(m: number): string {
  const d = new Date(START.getFullYear(), START.getMonth() + m, 1)
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
}

/**
 * Teklifle birlikte verilecek iş programı.
 * Süreler metrajdan türetilir (miktar ÷ günlük kapasite); kritik yol bitiş tarihini belirler.
 */
export function IsProgrami({ writable, role, onGo }: { writable: boolean; role: string; onGo: (t: TabKey) => void }) {
  const [tasks, setTasks] = useState<ScheduleTask[]>(scheduleTasks)
  const [milestones, setMilestones] = useState<ScheduleMilestone[]>(scheduleMilestones)
  const [sel, setSel] = useState<ScheduleTask>(scheduleTasks[4])
  const [editTask, setEditTask] = useState<ScheduleTask | 'new' | null>(null)
  const [editMs, setEditMs] = useState<ScheduleMilestone | 'new' | null>(null)
  const curve = sCurve(tasks)

  function removeTask(id: string) {
    const rest = tasks.filter((t) => t.id !== id)
    setTasks(rest)
    if (sel.id === id && rest[0]) setSel(rest[0])
  }
  const [openMs, setOpenMs] = useState<ScheduleMilestone | null>(null)

  const finish = Math.max(...tasks.map((t) => t.startMonth + t.months))
  const critical = tasks.filter((t) => t.critical)

  return (
    <>
      <PageHead
        title="İş Programı"
        note="Metrajdan türetilen iş programı. Doküman analiz edildiğinde ve metraj güncellendiğinde program otomatik yenilenir. Her satırın süresi miktar ÷ günlük kapasite ile hesaplanır; kritik yoldaki işler bitiş tarihini doğrudan belirler. Sözleşmeden gelen tarihler kilometre taşı olarak sabit durur."
        right={<>
          <AddonBadge />
          <Btn disabled={!writable} title="Doküman analizi ve metrajdaki son değişiklikleri programa yansıtır. Program bu değişikliklerle zaten otomatik güncellenir; bu düğme hemen yenilemek içindir.">↻ Güncelle</Btn>
          <Btn title="MS Project dosyası (.xml / .mpp)">MS Project</Btn>
          <Btn title="Primavera P6 dosyası (.xer)">P6 (XER)</Btn>
          <Btn title="PDF olarak dışa aktar">PDF</Btn>
          <Btn title="Excel olarak dışa aktar">Excel</Btn>
        </>}
      />

      {!writable && <ReadOnlyNote role={role} />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Toplam süre" value={`${finish} ay`} sub={`${project.durationDays} takvim günü`}
          help="Programın ilk işinden son işin bitişine kadar geçen süre. Sözleşmedeki iş süresiyle aynı olmak zorundadır." />
        <Kpi label="Aktivite" value={tasks.length} sub="WBS satırı"
          help="Programdaki ana iş kalemleri. Her biri metrajdaki bir veya birkaç poza bağlıdır." />
        <Kpi label="Kritik yol" value={`${critical.length} iş`} sub="Bitişi doğrudan belirleyen zincir" tone="crit"
          help="Gecikmesi doğrudan bitiş tarihini öteleyen işler. Bu zincirde bolluk (float) yoktur." />
        <Kpi label="Kilometre taşı" value={milestones.length} sub="Sözleşme ve idare tarihleri" tone="accent"
          help="Sözleşmeden gelen sabit tarihler. Program bu tarihlere göre kurgulanır." />
        <Kpi label="Program riski" value="60 gün" sub="Kazık tedariki (R7)" tone="warn"
          help="Teklif Riskleri sekmesindeki en yüksek süre etkisi. Kritik yoldaki bir işi doğrudan öteler." />
      </div>

      {/* Program şeridi */}
      <Card
        title="Zaman çizelgesi"
        help="Üstteki şerit sözleşmeden gelen kilometre taşlarını gösterir. Kırmızı çubuklar kritik yoldaki işlerdir; satıra tıklayınca ayrıntısı aşağıda açılır. En alttaki S eğrisi, işin aylık dağılımından (metraj × birim fiyat) hesaplanan planlanan kümülatif ilerlemedir. + ile aktivite eklenir, çöp kutusu seçili aktiviteyi siler."
        right={<span className="flex items-center gap-1.5">
          <IconBtn icon="add" primary title="Aktivite ekle" disabled={!writable} onClick={() => setEditTask('new')} />
          <RowActions name={`${sel.wbs} · ${sel.name}`} disabled={!writable} onDelete={() => removeTask(sel.id)} />
        </span>}
        pad={false}
      >
        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            {/* Ay başlıkları */}
            <div className="flex border-b border-[var(--border)] bg-[var(--surface-3)]">
              <div className="w-[310px] flex-shrink-0 border-r border-[var(--border)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">
                İş kalemi
              </div>
              <div className="relative flex flex-1">
                {Array.from({ length: MONTHS }, (_, m) => (
                  <div key={m} className="flex-1 border-r border-[var(--border)] px-0.5 py-1.5 text-center text-[9.5px] text-[var(--muted)]">
                    {m % 3 === 0 ? `01 ${monthLabel(m)}` : m + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Kilometre taşları şeridi */}
            <div className="flex border-b border-[var(--border)] bg-[var(--surface-2)]">
              <div className="w-[310px] flex-shrink-0 border-r border-[var(--border)] px-3 py-2 text-[11.5px] font-semibold text-[var(--ink)]">
                Kilometre taşları
              </div>
              <div className="relative flex-1 py-2">
                {milestones.map((m) => (
                  <span key={m.id} title={`${m.label} — ${m.source}`}
                    className="absolute top-1.5 -translate-x-1/2 cursor-default text-[11px] leading-none"
                    style={{ left: `${Math.min((m.month / MONTHS) * 100, 99)}%`, color: 'var(--gold)' }}>
                    ◆
                  </span>
                ))}
              </div>
            </div>

            {/* Satırlar */}
            {tasks.map((t) => {
              const on = t.id === sel.id
              return (
                <div key={t.id} onClick={() => setSel(t)}
                  className="flex cursor-pointer border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]"
                  style={on ? { background: 'var(--accent-soft)' } : undefined}>
                  <div className="flex w-[310px] flex-shrink-0 items-center gap-2 border-r border-[var(--border)] px-3 py-1.5">
                    <span className="mono w-5 flex-shrink-0 text-[11px] text-[var(--faint)]">{t.wbs}</span>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] text-[var(--ink)]" title={t.name}>{t.name}</span>
                    <span className="flex-shrink-0 text-[10.5px] text-[var(--faint)] tnum">{t.months} ay</span>
                  </div>
                  <div className="relative flex-1 py-1.5">
                    {/* Ay ızgarası */}
                    <div className="absolute inset-0 flex">
                      {Array.from({ length: MONTHS }, (_, m) => (
                        <div key={m} className="flex-1 border-r border-[var(--border)] opacity-40" />
                      ))}
                    </div>
                    <div
                      className="relative h-4 rounded-sm"
                      style={{
                        marginLeft: `${(t.startMonth / MONTHS) * 100}%`,
                        width: `${(t.months / MONTHS) * 100}%`,
                        background: t.critical ? 'var(--crit)' : 'var(--accent)',
                        opacity: on ? 1 : 0.85,
                      }}
                      title={`${t.name} · ${t.months} ay`}
                    />
                  </div>
                </div>
              )
            })}

            {/* S eğrisi — aylık planlanan iş ve kümülatif ilerleme */}
            <div className="flex border-t border-[var(--border-strong)] bg-[var(--surface-2)]">
              <div className="w-[310px] flex-shrink-0 border-r border-[var(--border)] px-3 py-2">
                <div className="text-[11.5px] font-semibold text-[var(--ink)]">S eğrisi</div>
                <div className="mt-0.5 text-[11px] leading-snug text-[var(--muted)]">
                  Planlanan kümülatif ilerleme — işin aylık dağılımına göre (metraj × birim fiyat)
                </div>
                <div className="mt-2 flex flex-col gap-1 text-[11px] text-[var(--muted)]">
                  <span>Ay {Math.max(1, curve.findIndex((c) => c.cum >= 50) + 1)}’de %50</span>
                  <span>En yoğun ay: {monthLabel(curve.reduce((a, c, i) => (c.month > curve[a].month ? i : a), 0))} (%{num(Math.max(...curve.map((c) => c.month)), 1)})</span>
                </div>
              </div>
              <div className="relative flex-1" style={{ height: 150 }}>
                <div className="absolute inset-0 flex">
                  {Array.from({ length: MONTHS }, (_, m) => (
                    <div key={m} className="flex-1 border-r border-[var(--border)] opacity-40" />
                  ))}
                </div>
                <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${MONTHS} 100`} preserveAspectRatio="none">
                  {[25, 50, 75].map((y) => (
                    <line key={y} x1={0} x2={MONTHS} y1={100 - y} y2={100 - y} stroke="var(--border)" strokeWidth={0.4} vectorEffect="non-scaling-stroke" strokeDasharray="3 3" />
                  ))}
                  {curve.map((c, i) => {
                    const peak = Math.max(...curve.map((x) => x.month))
                    const h = (c.month / peak) * 45
                    return <rect key={i} x={i + 0.2} width={0.6} y={100 - h} height={h} fill="var(--accent)" opacity={0.25} />
                  })}
                  <polyline fill="none" stroke="var(--accent)" strokeWidth={2} vectorEffect="non-scaling-stroke"
                    points={['0,100', ...curve.map((c, i) => `${i + 1},${100 - c.cum}`)].join(' ')} />
                </svg>
                <span className="absolute right-1 top-0.5 text-[10px] text-[var(--faint)]">%100</span>
                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-[var(--faint)]">%50</span>
              </div>
            </div>

            {/* Lejant */}
            <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] px-3 py-2">
              <Legend color="var(--crit)" label="Kritik yol" />
              <Legend color="var(--accent)" label="Normal iş" />
              <Legend color="var(--gold)" label="Kilometre taşı" />
              <span className="flex items-center gap-1 text-[11px] text-[var(--muted)]">
                <span className="h-0.5 w-4" style={{ background: 'var(--accent)' }} />S eğrisi (kümülatif)
              </span>
              <span className="flex items-center gap-1 text-[11px] text-[var(--muted)]">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--accent)', opacity: 0.25 }} />Aylık planlanan iş
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Alt: sol ayrıntı, sağ kilometre taşları */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Card
            title={`${sel.wbs} · ${sel.name}`}
            subtitle={sel.group}
            right={<>
              {sel.critical && <Badge tone="crit" dot>Kritik yol</Badge>}
              <RowActions name={`${sel.wbs} · ${sel.name}`} disabled={!writable}
                onEdit={() => setEditTask(sel)} onDelete={() => removeTask(sel.id)} />
            </>}
          >
            <div className="flex flex-col gap-3 text-[12.5px]">
              <div className="grid grid-cols-2 gap-2">
                <Mini label="Başlangıç" value={monthDate(sel.startMonth)} />
                <Mini label="Bitiş" value={monthDate(sel.startMonth + sel.months)} />
                <Mini label="Süre" value={`${sel.months} ay ≈ ${sel.months * 30} gün`} />
                <Mini label="Metraj kalemi" value={sel.boqRef ?? '—'} />
                <Progress task={sel} />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Süre varsayımı</div>
                <p className="mt-0.5 leading-relaxed text-[var(--ink)]">{sel.assumption}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Btn small onClick={() => onGo('boq')}>Metraj kalemine git →</Btn>
              </div>
            </div>
          </Card>

          <Card title="Kritik yol zinciri" help="Bu işlerden herhangi birinin gecikmesi teslim tarihini doğrudan öteler. Gecikme cezası riski bu zincire bağlıdır.">
            <div className="flex flex-col gap-2 text-[12.5px]">
              {critical.map((t, i) => (
                <div key={t.id} className="flex items-center gap-2 border-b border-[var(--border)] pb-2 last:border-0">
                  <span className="mono text-[11px] text-[var(--faint)]">{i + 1}.</span>
                  <button onClick={() => setSel(t)} className="text-left text-[var(--ink)] hover:text-[var(--accent)]">{t.name}</button>
                  <span className="ml-auto tnum text-[11.5px] text-[var(--muted)]">
                    {monthDate(t.startMonth)} → {monthDate(t.startMonth + t.months)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <StickyPane>
          <div className="flex flex-col gap-4">
            <Card
              title="Kilometre taşları"
              help="Sözleşmeden gelen sabit tarihler. Genelde “işe başlama (CD) + X gün” biçiminde verilir (CD: commencement date, işe başlama tarihi) ve çoğunun kendine ait gecikme cezası vardır; bu ceza ana işin cezasından ayrı işler. Dokümanda tamamlanma tanımı ve kabul şartları verilmişse göz simgesiyle açılır."
              right={<IconBtn icon="add" title="Kilometre taşı ekle" disabled={!writable} onClick={() => setEditMs('new')} />}
              pad={false}
            >
              <Table head={
                <tr>
                  <Th w={46}>No</Th>
                  <Th w={190}>Açıklama</Th>
                  <Th w={104}>Tamamlanma</Th>
                  <Th w={170}>Ceza ve kaynak</Th>
                  <Th w={96} center>İşlem</Th>
                </tr>
              }>
                {milestones.map((m) => (
                  <tr key={m.id} className="hover:bg-[var(--surface-2)]">
                    <Td nowrap><span className="mono text-[11.5px] font-semibold text-[var(--accent)]">{m.no}</span></Td>
                    <Td><span className="text-[12.5px] text-[var(--ink)]">{m.label}</span></Td>
                    <Td nowrap>
                      <div className="text-[12px] font-medium text-[var(--ink)]">CD + {num(m.dueDays)} gün</div>
                      <div className="tnum text-[11px] text-[var(--faint)]">{date(m.dueDate)}</div>
                    </Td>
                    <Td>
                      {m.penalty
                        ? <div className="font-semibold text-[var(--crit)] tnum">{num(m.penalty)} {project.currency}</div>
                        : <div className="text-[var(--faint)]">Ceza yok</div>}
                      {m.penaltyNote && <div className="text-[11.5px] text-[var(--ink)]">{m.penaltyNote}</div>}
                      <div className="text-[11px] text-[var(--faint)]">{m.source}</div>
                    </Td>
                    <Td nowrap center>
                      <RowActions name={m.no} disabled={!writable}
                        onOpen={() => setOpenMs(m)} openDisabled={!m.definition}
                        openTitle={m.definition ? 'Tamamlanma tanımı ve kabul şartları' : 'Dokümanda tamamlanma tanımı yok'}
                        onEdit={() => setEditMs(m)}
                        onDelete={() => setMilestones((l) => l.filter((x) => x.id !== m.id))} />
                    </Td>
                  </tr>
                ))}
              </Table>
            </Card>

            <Card title="Programın dayanağı ve açık konular" help="Programı bağlayan sözleşme maddeleri ve henüz netleşmemiş konular.">
              <div className="flex flex-col gap-2.5 text-[12.5px]">
                <Note tone="crit" title="Program sunum süresi çelişkili">
                  İdari Şartname 21.1 “14 gün” derken Sözleşme 8.3 “28 gün” diyor. Zeyilname ile netleşmeli;
                  14 gün kalırsa program teklif aşamasında büyük ölçüde hazır olmalı.
                </Note>
                <Note tone="warn" title="Çalışma penceresi 10 saat">
                  Liman operasyonu nedeniyle günlük çalışma 07:00–17:00 ile sınırlı. Bütün kapasiteler bu pencereye göre alındı.
                </Note>
                <Note tone="warn" title="Kış dönemi duraklaması">
                  Dalga yüksekliği 1,5 m üzerinde deniz imalatları durur. Deniz işleri yaz penceresine öne çekildi.
                </Note>
                <Note tone="neutral" title="Kaynak varsayımı">
                  2 şahmerdan, 1 tarak gemisi, 2 beton ekibi. Ekipman kira teklifleri Teklif Riskleri sekmesindeki R12 ile bağlantılı.
                </Note>
              </div>
            </Card>
          </div>
        </StickyPane>
      </div>

      {editTask && (
        <ActivityModal task={editTask === 'new' ? null : editTask} tasks={tasks} onClose={() => setEditTask(null)}
          onSave={(t) => {
            setTasks((l) => (l.some((x) => x.id === t.id) ? l.map((x) => (x.id === t.id ? t : x)) : [...l, t]))
            setSel(t); setEditTask(null)
          }} />
      )}

      {editMs && (
        <MilestoneModal ms={editMs === 'new' ? null : editMs} count={milestones.length} onClose={() => setEditMs(null)}
          onSave={(m) => {
            setMilestones((l) => (l.some((x) => x.id === m.id) ? l.map((x) => (x.id === m.id ? m : x)) : [...l, m]))
            setEditMs(null)
          }} />
      )}

      {openMs && (
        <Modal
          title={`${openMs.no} · ${openMs.label}`}
          note={`${openMs.source} · CD + ${num(openMs.dueDays)} gün (${date(openMs.dueDate)})`}
          onClose={() => setOpenMs(null)}
          footer={<span className="ml-auto"><Btn onClick={() => setOpenMs(null)}>Kapat</Btn></span>}
        >
          <div className="flex flex-col gap-3 text-[12.5px]">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Tamamlanma tanımı</div>
              <p className="mt-1 leading-relaxed text-[var(--ink)]">{openMs.definition}</p>
            </div>
            {openMs.acceptance && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Kabul şartları</div>
                <ul className="mt-1 flex flex-col gap-1.5">
                  {openMs.acceptance.map((a) => (
                    <li key={a} className="flex gap-2 leading-relaxed text-[var(--ink)]">
                      <span className="text-[var(--accent)]">•</span>{a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {openMs.penaltyNote && (
              <div className="rounded-md border px-3 py-2" style={{ background: 'var(--crit-bg)', borderColor: 'var(--crit)' }}>
                <span className="font-semibold text-[var(--crit)]">Ceza: </span>
                <span className="text-[var(--ink)]">{openMs.penaltyNote}</span>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  )
}

/**
 * Aktivitenin ilerlemesi: yüzde ve metraj olarak.
 * Miktar, aktivitenin bağlı olduğu metraj kaleminden gelir; yapılan miktar proje döneminde sahadan girilir.
 */
function Progress({ task }: { task: ScheduleTask }) {
  const item = boqItems.find((b) => b.no === task.boqRef)
  const done = item ? (item.qty * task.progress) / 100 : 0
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5">
      <div className="flex items-center gap-2">
        <span className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--faint)]">İlerleme</span>
        <span className="ml-auto text-[12.5px] font-semibold text-[var(--ink)] tnum">
          %{task.progress}
          {item && <span className="ml-2 font-normal text-[var(--muted)]">{num(done)} / {num(item.qty)} {item.unit}</span>}
        </span>
      </div>
      <div className="mt-1.5"><Bar value={task.progress} tone={task.progress >= 100 ? 'ok' : 'accent'} /></div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-[11px] text-[var(--muted)]">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />{label}
    </span>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5">
      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--faint)]">{label}</div>
      <div className="mt-0.5 text-[12.5px] font-semibold text-[var(--ink)]">{value}</div>
    </div>
  )
}

function Note({ tone, title, children }: { tone: 'crit' | 'warn' | 'neutral'; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border px-3 py-2"
      style={{ background: `var(--${tone}-bg)`, borderColor: tone === 'neutral' ? 'var(--border)' : `var(--${tone})` }}>
      <div className="text-[12px] font-semibold" style={{ color: `var(--${tone})` }}>{title}</div>
      <p className="mt-0.5 text-[11.5px] leading-relaxed" style={{ color: 'var(--ink)' }}>{children}</p>
    </div>
  )
}

/**
 * S eğrisi: her aktivitenin tutarı (metraj × birim fiyat) süresine eşit dağıtılır,
 * aylık toplamlar yüzdeye çevrilip kümülatif toplanır. Metrajı bağlı olmayan aktivite
 * süresiyle orantılı küçük bir ağırlık alır.
 */
function sCurve(tasks: ScheduleTask[]): { month: number; cum: number }[] {
  const monthly = Array.from({ length: MONTHS }, () => 0)
  for (const t of tasks) {
    const item = boqItems.find((b) => b.no === t.boqRef)
    const value = item?.unitPrice ? item.qty * item.unitPrice : t.months * 50_000
    for (let m = t.startMonth; m < Math.min(MONTHS, t.startMonth + t.months); m++) monthly[m] += value / t.months
  }
  const total = monthly.reduce((a, v) => a + v, 0) || 1
  let cum = 0
  return monthly.map((v) => {
    cum += v
    return { month: (v / total) * 100, cum: (cum / total) * 100 }
  })
}

/** Aktivite ekleme / düzenleme. */
function ActivityModal({ task, tasks, onClose, onSave }: {
  task: ScheduleTask | null; tasks: ScheduleTask[]; onClose: () => void; onSave: (t: ScheduleTask) => void
}) {
  const [name, setName] = useState(task?.name ?? '')
  const [start, setStart] = useState(String((task?.startMonth ?? 0) + 1))
  const [months, setMonths] = useState(String(task?.months ?? 1))
  const [dependsOn, setDependsOn] = useState(task?.dependsOn ?? '')
  const [relation, setRelation] = useState<NonNullable<ScheduleTask['relation']>>(task?.relation ?? 'FS')
  const [critical, setCritical] = useState(task?.critical ?? false)
  const [assumption, setAssumption] = useState(task?.assumption ?? '')
  const ready = name.trim().length > 2 && Number(months) > 0

  return (
    <Modal
      title={task ? 'Aktiviteyi düzenle' : 'Aktivite ekle'}
      note="Başlangıç ayı işe başlamadan itibaren sayılır. Bağlı aktivite ve ilişki tipi (FS: bitince başlar, SS: birlikte başlar, FF: birlikte biter) programın zincirini kurar."
      onClose={onClose}
      wide
      footer={<>
        <span className="text-[11.5px] text-[var(--faint)]">{ready ? 'Kaydedilmeye hazır' : 'Ad ve süre zorunlu'}</span>
        <span className="ml-auto flex gap-2">
          <Btn onClick={onClose}>Vazgeç</Btn>
          <Btn primary disabled={!ready} onClick={() => onSave({
            ...(task ?? { id: `W${Date.now()}`, wbs: String(tasks.length + 1), group: 'Genel' as const, progress: 0 }),
            name: name.trim(), startMonth: Math.max(0, (Number(start) || 1) - 1), months: Number(months) || 1,
            dependsOn: dependsOn || undefined, relation: dependsOn ? relation : undefined, critical, assumption: assumption.trim(),
          })}>Kaydet</Btn>
        </span>
      </>}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Aktivite" value={name} onChange={setName} placeholder="Ör. Kazık çakımı" /></div>
        <Field label="Başlangıç (ay)" value={start} onChange={setStart} type="number" />
        <Field label="Süre (ay)" value={months} onChange={setMonths} type="number" />
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Bağlı olduğu aktivite</span>
          <select value={dependsOn} onChange={(e) => setDependsOn(e.target.value)}
            className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-2 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--accent)]">
            <option value="">— İşe başlamayla —</option>
            {tasks.filter((t) => t.id !== task?.id).map((t) => <option key={t.id} value={t.wbs}>{t.wbs} · {t.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">İlişki tipi</span>
          <select value={relation} disabled={!dependsOn} onChange={(e) => setRelation(e.target.value as typeof relation)}
            className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-2 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--accent)] disabled:opacity-50">
            {(['FS', 'SS', 'FF', 'SF'] as const).map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <div className="sm:col-span-2"><Field label="Süre varsayımı" value={assumption} onChange={setAssumption} placeholder="Ör. 9.850 ton ÷ 48 ton/gün" /></div>
        <label className="flex items-center gap-2 text-[12.5px] text-[var(--ink)]">
          <input type="checkbox" checked={critical} onChange={() => setCritical((v) => !v)} /> Kritik yolda
        </label>
      </div>
    </Modal>
  )
}

/** Kilometre taşı ekleme / düzenleme. */
function MilestoneModal({ ms, count, onClose, onSave }: {
  ms: ScheduleMilestone | null; count: number; onClose: () => void; onSave: (m: ScheduleMilestone) => void
}) {
  const [label, setLabel] = useState(ms?.label ?? '')
  const [dueDays, setDueDays] = useState(String(ms?.dueDays ?? 0))
  const [penalty, setPenalty] = useState(String(ms?.penalty ?? ''))
  const [penaltyNote, setPenaltyNote] = useState(ms?.penaltyNote ?? '')
  const [source, setSource] = useState(ms?.source ?? '')
  const [definition, setDefinition] = useState(ms?.definition ?? '')
  const ready = label.trim().length > 2 && Number(dueDays) > 0

  return (
    <Modal
      title={ms ? `${ms.no} düzenle` : 'Kilometre taşı ekle'}
      onClose={onClose}
      wide
      footer={<>
        <span className="text-[11.5px] text-[var(--faint)]">{ready ? 'Kaydedilmeye hazır' : 'Açıklama ve süre zorunlu'}</span>
        <span className="ml-auto flex gap-2">
          <Btn onClick={onClose}>Vazgeç</Btn>
          <Btn primary disabled={!ready} onClick={() => {
            const days = Number(dueDays) || 0
            const d = new Date(2026, 10, 1 + days)
            onSave({
              ...(ms ?? { id: `M${Date.now()}`, no: `KS-${count + 1}`, kind: 'Sözleşme' as const }),
              label: label.trim(), dueDays: days, dueDate: d.toISOString().slice(0, 10), month: Math.round(days / 30),
              penalty: Number(penalty) || undefined, penaltyNote: penaltyNote.trim() || undefined,
              source: source.trim() || '—', definition: definition.trim() || undefined,
            })
          }}>Kaydet</Btn>
        </span>
      </>}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Açıklama" value={label} onChange={setLabel} /></div>
        <Field label="Tamamlanma (CD + gün)" value={dueDays} onChange={setDueDays} type="number" />
        <Field label="Ceza (haftalık tutar)" value={penalty} onChange={setPenalty} type="number" />
        <div className="sm:col-span-2"><Field label="Ceza detayı" value={penaltyNote} onChange={setPenaltyNote} /></div>
        <Field label="Kaynak" value={source} onChange={setSource} placeholder="Ör. Özel Şartlar 8.2 (a)" />
        <Field label="Tamamlanma tanımı" value={definition} onChange={setDefinition} hint="Dokümanda varsa" />
      </div>
    </Modal>
  )
}
