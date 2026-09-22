import { useState } from 'react'
import { scheduleMilestones, scheduleTasks, project } from '../data/mock'
import type { ScheduleTask, TabKey } from '../data/types'
import {
  AddonBadge, Badge, Btn, Card, Kpi, PageHead, ReadOnlyNote, StickyPane, Table, Td, Th,
} from '../components/ui'
import { date, money, num } from '../lib/format'

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

const RELATION_NOTE: Record<string, string> = {
  FS: 'Bitince başlar (finish → start)',
  SS: 'Birlikte başlar (start → start)',
  FF: 'Birlikte biter (finish → finish)',
  SF: 'Başlayınca biter (start → finish)',
}

/**
 * Teklifle birlikte verilecek iş programı.
 * Süreler metrajdan türetilir (miktar ÷ günlük kapasite); kritik yol bitiş tarihini belirler.
 */
export function IsProgrami({ writable, role, onGo }: { writable: boolean; role: string; onGo: (t: TabKey) => void }) {
  const [sel, setSel] = useState<ScheduleTask>(scheduleTasks[4])

  const finish = Math.max(...scheduleTasks.map((t) => t.startMonth + t.months))
  const critical = scheduleTasks.filter((t) => t.critical)

  return (
    <>
      <PageHead
        title="İş Programı"
        note="Metrajdan türetilen iş programı. Her satırın süresi miktar ÷ günlük kapasite ile hesaplanır; kritik yoldaki işler bitiş tarihini doğrudan belirler. Sözleşmeden gelen tarihler kilometre taşı olarak sabit durur."
        right={<>
          <AddonBadge />
          <Btn disabled={!writable} onClick={() => onGo('boq')}>Metrajdan üret</Btn>
          <Btn disabled={!writable} title="Hazır program dosyası yükle">Kaynak ekle</Btn>
          <Btn title="MS Project dosyası (.xml / .mpp)">MS Project</Btn>
          <Btn title="Primavera P6 dosyası (.xer)">P6 (XER)</Btn>
          <Btn title="Excel olarak dışa aktar">Excel</Btn>
          <Btn primary disabled={!writable}>+ İş ekle</Btn>
        </>}
      />

      {!writable && <ReadOnlyNote role={role} />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Toplam süre" value={`${finish} ay`} sub={`${project.durationDays} takvim günü`}
          help="Programın ilk işinden son işin bitişine kadar geçen süre. Sözleşmedeki iş süresiyle aynı olmak zorundadır." />
        <Kpi label="İş kalemi" value={scheduleTasks.length} sub="WBS satırı"
          help="Programdaki ana iş kalemleri. Her biri metrajdaki bir veya birkaç poza bağlıdır." />
        <Kpi label="Kritik yol" value={`${critical.length} iş`} sub="Bitişi doğrudan belirleyen zincir" tone="crit"
          help="Gecikmesi doğrudan bitiş tarihini öteleyen işler. Bu zincirde bolluk (float) yoktur." />
        <Kpi label="Kilometre taşı" value={scheduleMilestones.length} sub="Sözleşme ve idare tarihleri" tone="accent"
          help="Sözleşmeden gelen sabit tarihler. Program bu tarihlere göre kurgulanır." />
        <Kpi label="Program riski" value="60 gün" sub="Kazık tedariki (R7)" tone="warn"
          help="Teklif Riskleri sekmesindeki en yüksek süre etkisi. Kritik yoldaki bir işi doğrudan öteler." />
      </div>

      {/* Program şeridi */}
      <Card
        title="Zaman çizelgesi"
        help="Üstteki şerit sözleşmeden gelen kilometre taşlarını gösterir. Kırmızı çubuklar kritik yoldaki işlerdir; satıra tıklayınca süre varsayımı ve metraj bağlantısı sağda açılır."
        right={<div className="flex items-center gap-2">
          <Legend color="var(--crit)" label="Kritik yol" />
          <Legend color="var(--accent)" label="Normal iş" />
          <Legend color="var(--gold)" label="Kilometre taşı" />
        </div>}
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
                {scheduleMilestones.map((m) => (
                  <span key={m.id} title={`${m.label} — ${m.source}`}
                    className="absolute top-1.5 -translate-x-1/2 cursor-default text-[11px] leading-none"
                    style={{ left: `${Math.min((m.month / MONTHS) * 100, 99)}%`, color: 'var(--gold)' }}>
                    ◆
                  </span>
                ))}
              </div>
            </div>

            {/* Satırlar */}
            {scheduleTasks.map((t) => {
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
          </div>
        </div>
      </Card>

      {/* Alt: sol ayrıntı, sağ kilometre taşları */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Card
            title={`${sel.wbs} · ${sel.name}`}
            subtitle={sel.group}
            right={sel.critical ? <Badge tone="crit" dot>Kritik yol</Badge> : <Badge tone="neutral">Bolluk var</Badge>}
          >
            <div className="flex flex-col gap-3 text-[12.5px]">
              <div className="grid grid-cols-2 gap-2">
                <Mini label="Başlangıç" value={monthDate(sel.startMonth)} />
                <Mini label="Bitiş" value={monthDate(sel.startMonth + sel.months)} />
                <Mini label="Süre" value={`${sel.months} ay ≈ ${sel.months * 30} gün`} />
                <Mini label="Metraj kalemi" value={sel.boqRef ?? '—'} />
                <Mini
                  label="Bağlantı"
                  value={sel.dependsOn ? `${sel.relation ?? 'FS'} · WBS ${sel.dependsOn}` : 'Bağlantısız'}
                />
                <Mini label="İlişki tipi" value={sel.relation ? RELATION_NOTE[sel.relation] : 'İşe başlamayla'} />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Süre varsayımı</div>
                <p className="mt-0.5 leading-relaxed text-[var(--ink)]">{sel.assumption}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Btn small disabled={!writable}>Süreyi düzenle</Btn>
                <Btn small disabled={!writable}>Bağımlılık ekle</Btn>
                <Btn small onClick={() => onGo('boq')}>Metraj kalemine git →</Btn>
              </div>
            </div>
          </Card>

          <Card title="Program logu" help="Planlama dosyasının sağlık kontrolü: kaç aktivite var, hangi ilişki tipleri kullanılmış, bağlantısız aktivite kalmış mı. Bağlantısız aktivite, programın hesaplanmasını bozar.">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Mini label="Aktivite" value={`${scheduleTasks.length} adet`} />
              <Mini label="Kritik yol" value={`${critical.length} aktivite`} />
              <Mini label="Bağlantısız" value={`${scheduleTasks.filter((t) => !t.dependsOn).length} aktivite`} />
              {(['FS', 'SS', 'FF', 'SF'] as const).map((r) => (
                <Mini key={r} label={`${r} ilişkisi`} value={`${scheduleTasks.filter((t) => (t.relation ?? (t.dependsOn ? 'FS' : undefined)) === r).length} adet`} />
              ))}
              <Mini label="En uzun aktivite" value={`${Math.max(...scheduleTasks.map((t) => t.months))} ay`} />
            </div>
            <div className="mt-3 flex flex-col gap-1.5 text-[11.5px] leading-relaxed text-[var(--muted)]">
              <div>• <b className="text-[var(--ink)]">FS</b> {RELATION_NOTE.FS} — en yaygın kurgu.</div>
              <div>• <b className="text-[var(--ink)]">SS</b> {RELATION_NOTE.SS} · <b className="text-[var(--ink)]">FF</b> {RELATION_NOTE.FF} — örtüşen işlerde.</div>
              <div>• <b className="text-[var(--ink)]">SF</b> {RELATION_NOTE.SF} — nadiren kullanılır; bu programda yok.</div>
              <div className="mt-1" style={{ color: scheduleTasks.filter((t) => !t.dependsOn).length > 1 ? 'var(--warn)' : 'var(--ok)' }}>
                {scheduleTasks.filter((t) => !t.dependsOn).length > 1
                  ? '⚠ Birden fazla bağlantısız aktivite var — kontrol edilmeli.'
                  : '✓ Yalnızca ilk aktivite bağlantısız; program zinciri bütün.'}
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
              <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--faint)]">
                Zincirin toplam süresi sözleşmedeki {project.durationDays} günü tam doldurur; bolluk yoktur.
                Kazık tedarikindeki 2 aylık gecikme doğrudan teslim tarihine yansır.
              </p>
            </div>
          </Card>
        </div>

        <StickyPane>
          <div className="flex flex-col gap-4">
            <Card
              title="Kilometre taşları (key stage)"
              help="Sözleşmeden gelen sabit tarihler. Genelde “işe başlama (CD) + X gün” biçiminde verilir ve çoğunun kendine ait gecikme cezası vardır; bu ceza ana işin cezasından ayrı işler."
              right={<Btn small disabled={!writable}>+ Kilometre taşı</Btn>}
              pad={false}
            >
              <Table head={
                <tr>
                  <Th w={50}>No</Th>
                  <Th w={220}>Açıklama</Th>
                  <Th w={110}>Tamamlanma</Th>
                  <Th w={90} right>Ceza</Th>
                  <Th w={190}>Ceza detayı ve kaynak</Th>
                </tr>
              }>
                {scheduleMilestones.map((m) => (
                  <tr key={m.id} className="hover:bg-[var(--surface-2)]">
                    <Td nowrap>
                      <div className="mono text-[11.5px] font-semibold text-[var(--accent)]">{m.no}</div>
                      <Badge tone={m.kind === 'Sözleşme' ? 'crit' : m.kind === 'İdare' ? 'warn' : 'neutral'}>{m.kind}</Badge>
                    </Td>
                    <Td><span className="text-[12.5px] text-[var(--ink)]">{m.label}</span></Td>
                    <Td nowrap>
                      <div className="text-[12px] font-medium text-[var(--ink)]">CD + {num(m.dueDays)} gün</div>
                      <div className="tnum text-[11px] text-[var(--faint)]">{date(m.dueDate)}</div>
                    </Td>
                    <Td right>
                      {m.penalty
                        ? <span className="font-semibold text-[var(--crit)] tnum">{num(m.penalty)}</span>
                        : <span className="text-[var(--faint)]">—</span>}
                    </Td>
                    <Td>
                      {m.penaltyNote && <div className="text-[11.5px] text-[var(--ink)]">{m.penaltyNote}</div>}
                      <div className="text-[11px] text-[var(--faint)]">{m.source}</div>
                    </Td>
                  </tr>
                ))}
              </Table>
              <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-[11.5px] text-[var(--muted)]">
                <span>CD = işe başlama tarihi (commencement date)</span>
                <span className="ml-auto">
                  Ara teslim cezaları toplamı: <b className="text-[var(--crit)]">{money(scheduleMilestones.reduce((a, m) => a + (m.penalty ?? 0), 0), project.currency)}</b> / hafta
                </span>
              </div>
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
    </>
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
