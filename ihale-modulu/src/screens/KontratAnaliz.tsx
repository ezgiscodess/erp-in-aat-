import { useState } from 'react'
import { clauses } from '../data/mock'
import type { ClauseAnalysis } from '../data/types'
import {
  Badge, Bar, Btn, Card, Chips, Kpi, PageHead, PreviewPane, ReadOnlyNote, SeverityBadge, StickyPane, Table, Td, Th,
} from '../components/ui'
import { pct } from '../lib/format'

type Filter = 'Tümü' | 'Aleyhine' | 'Süre sınırı' | 'Çelişki'

function positionTone(p: ClauseAnalysis['position']) {
  return p === 'Yüklenici aleyhine' ? 'crit' : p === 'Dengeli' ? 'neutral' : 'ok'
}

/** Sözleşme maddelerinin tek tek analizi: risk paylaşımı, çelişkiler ve bildirim süreleri. */
export function KontratAnaliz({ writable, role }: { writable: boolean; role: string }) {
  const [filter, setFilter] = useState<Filter>('Tümü')
  const [sel, setSel] = useState<ClauseAnalysis>(clauses[0])

  const list = clauses.filter((c) => {
    if (filter === 'Aleyhine') return c.position === 'Yüklenici aleyhine'
    if (filter === 'Süre sınırı') return !!c.timeBarDays
    if (filter === 'Çelişki') return !!c.conflictWith
    return true
  })

  const against = clauses.filter((c) => c.position === 'Yüklenici aleyhine').length
  const conflicts = clauses.filter((c) => c.conflictWith)
  const timeBars = clauses.filter((c) => c.timeBarDays)

  return (
    <>
      <PageHead
        title="Kontrat Analiz"
        note="Sözleşme maddeleri madde madde değerlendirilir: risk kimde, hangi süre sınırları var, hangi maddeler çelişiyor."
        right={<>
          <Btn disabled={!writable}>Revizyon talebi oluştur</Btn>
          <Btn>Karşılaştır (FIDIC standardı)</Btn>
          <Btn>Excel</Btn>
        </>}
      />

      {!writable && <ReadOnlyNote role={role} />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="İncelenen madde" value={clauses.length} sub="Özel Şartlar + İdari Şartname" />
        <Kpi label="Yüklenici aleyhine" value={against} sub={pct((against / clauses.length) * 100)} tone="crit" />
        <Kpi label="Çelişki" value={conflicts.length} sub="Dokümanlar arası" tone="warn" />
        <Kpi label="Süre sınırı" value={timeBars.length} sub="Bildirim yükümlülüğü" tone="warn" />
        <Kpi label="En kısa süre" value="48 saat" sub="Sözlü talimat teyidi" tone="crit" />
      </div>

      {/* Solda madde listesi ve analiz kartları, sağda yalnızca doküman önizlemesi */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div>
            <Chips<Filter> value={filter} onChange={setFilter} items={[
              { key: 'Tümü', label: 'Tümü', count: clauses.length },
              { key: 'Aleyhine', label: 'Aleyhimize', count: against },
              { key: 'Süre sınırı', label: 'Süre sınırlı', count: timeBars.length },
              { key: 'Çelişki', label: 'Çelişkili', count: conflicts.length },
            ]} />
          </div>

          <Card title={`Maddeler (${list.length})`} help="Satıra tıklayınca maddenin sözleşmedeki asıl metni sağdaki önizlemede vurgulanarak açılır." pad={false}>
            <Table head={
              <tr>
                <Th w={74}>Madde</Th>
                <Th w={195}>Başlık ve kategori</Th>
                <Th w={110}>Konum</Th>
                <Th w={74}>Önem</Th>
                <Th w={70}>Süre</Th>
              </tr>
            }>
              {list.map((c) => (
                <tr key={c.id} onClick={() => setSel(c)} className="cursor-pointer hover:bg-[var(--surface-2)]"
                  style={sel.id === c.id ? { background: 'var(--accent-soft)' } : undefined}>
                  <Td mono nowrap><span className="text-[var(--accent)]">{c.clause}</span></Td>
                  <Td>
                    <div className="text-[12.5px] font-medium text-[var(--ink)]">{c.title}</div>
                    <div className="mt-0.5 text-[11px] text-[var(--faint)]">{c.category}</div>
                    {c.conflictWith && <div className="mt-0.5 text-[11px] text-[var(--warn)]">⚠ Çelişki: {c.conflictWith}</div>}
                  </Td>
                  <Td nowrap><Badge tone={positionTone(c.position)} dot>{c.position.replace('Yüklenici ', '')}</Badge></Td>
                  <Td nowrap><SeverityBadge value={c.severity} /></Td>
                  <Td nowrap>{c.timeBarDays ? <Badge tone="warn">{c.timeBarDays < 3 ? '48 saat' : `${c.timeBarDays} gün`}</Badge> : <span className="text-[var(--faint)]">—</span>}</Td>
                </tr>
              ))}
            </Table>
          </Card>

          <Card title="Risk paylaşımı dengesi" help="Maddelerin hangi tarafın lehine olduğunun dağılımı. Standart FIDIC dengesine göre sapma, revizyon talebi için gerekçedir.">
            <div className="flex flex-col gap-3">
              {(['Yüklenici aleyhine', 'Dengeli', 'Yüklenici lehine'] as const).map((p) => {
                const n = clauses.filter((c) => c.position === p).length
                return (
                  <div key={p}>
                    <div className="mb-1 flex items-center justify-between text-[12px]">
                      <span className="text-[var(--ink)]">{p}</span>
                      <span className="text-[var(--muted)] tnum">{n} madde · {pct((n / clauses.length) * 100)}</span>
                    </div>
                    <Bar value={(n / clauses.length) * 100} tone={positionTone(p)} />
                  </div>
                )
              })}
              <p className="text-[12px] leading-relaxed text-[var(--muted)]">
                Sözleşme, standart FIDIC dengesine göre belirgin biçimde işveren lehine kaydırılmış.
                Özellikle ödeme, fiyat farkı ve fesih maddeleri revizyon talebi için öncelikli.
              </p>
            </div>
          </Card>

          <Card title="Süre sınırları (time-bar)" help="Sözleşmede bildirim için öngörülen süreler. Kaçırılırsa ek süre ve ek bedel talebi hakkı tamamen düşer; proje döneminde otomatik geri sayıma bağlanır.">
            <div className="flex flex-col gap-2">
              {timeBars.map((c) => (
                <div key={c.id} className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                  <span className="mono text-[11.5px] text-[var(--accent)]">{c.clause}</span>
                  <span className="text-[12px] text-[var(--ink)]">{c.title}</span>
                  <span className="ml-auto"><Badge tone="warn">{c.timeBarDays! < 3 ? '48 saat' : `${c.timeBarDays} gün`}</Badge></span>
                </div>
              ))}
              <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--faint)]">
                Bu süreler proje döneminde otomatik geri sayıma bağlanır: olay kaydedildiğinde sistem son tarihi hesaplar ve uyarır.
              </p>
            </div>
          </Card>
        </div>

        <StickyPane>
          <PreviewPane
            title={`${sel.clause} — ${sel.title}`}
            preview={{
              doc: 'Sozlesme Tasarisi (Ozel Sartlar).pdf',
              page: sel.page,
              pages: 126,
              clause: sel.clause,
              highlight: sel.quote,
              body: `${sel.quote}\n\n${sel.summary}`,
            }}
            paper
            height={340}
            footer={
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  <Badge tone={positionTone(sel.position)} dot>{sel.position}</Badge>
                  <SeverityBadge value={sel.severity} />
                  {sel.timeBarDays && <Badge tone="warn">Süre sınırı: {sel.timeBarDays < 3 ? '48 saat' : `${sel.timeBarDays} gün`}</Badge>}
                  {sel.conflictWith && <Badge tone="crit">Çelişki: {sel.conflictWith}</Badge>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Btn small disabled={!writable}>Soru listesine ekle</Btn>
                  <Btn small disabled={!writable}>Revizyon öner</Btn>
                  <Btn small primary disabled={!writable}>Yükümlülük olarak izle</Btn>
                </div>
              </div>
            }
          />
        </StickyPane>
      </div>
    </>
  )
}
