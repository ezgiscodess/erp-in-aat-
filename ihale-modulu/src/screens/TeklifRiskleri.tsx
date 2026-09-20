import { useState } from 'react'
import { bidRisks, project } from '../data/mock'
import type { BidRisk } from '../data/types'
import { Badge, Btn, Card, Kpi, PageHead, PreviewPane, ReadOnlyNote, StateBadge, Table, Td, Th } from '../components/ui'
import { money, moneyShort, num, pct } from '../lib/format'

const P_LABELS = ['Çok düşük', 'Düşük', 'Orta', 'Yüksek', 'Çok yüksek']

function scoreTone(s: number) {
  return s >= 16 ? 'crit' : s >= 9 ? 'warn' : s >= 4 ? 'neutral' : 'ok'
}

/** Risk matrisi + risk kayıtları. Bedel etkisi teklife eklenen risk primini besler. */
export function TeklifRiskleri({ writable, role }: { writable: boolean; role: string }) {
  const [sel, setSel] = useState<BidRisk | null>(bidRisks[0])

  const totalCost = bidRisks.reduce((a, r) => a + r.costImpact, 0)
  const expected = bidRisks.reduce((a, r) => a + (r.probability / 5) * r.costImpact, 0)
  const maxTime = Math.max(...bidRisks.map((r) => r.timeImpact))
  const high = bidRisks.filter((r) => r.probability * r.impact >= 16).length

  /** 5×5 matris hücrelerine risk sayısı */
  const cell = (p: number, i: number) => bidRisks.filter((r) => r.probability === p && r.impact === i)

  return (
    <>
      <PageHead
        title="Teklif Riskleri"
        note="Olasılık × etki matrisi, bedel ve süre etkisi. Riskler teklif fiyatındaki karşılıkları besler."
        right={<>
          <Btn disabled={!writable}>+ Risk ekle</Btn>
          <Btn>Risk raporu (PDF)</Btn>
        </>}
      />

      {!writable && <ReadOnlyNote role={role} />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Toplam risk" value={bidRisks.length} sub={`${bidRisks.filter((r) => r.state === 'Açık').length} açık`} />
        <Kpi label="Yüksek risk" value={high} sub="Olasılık × etki ≥ 16" tone="crit" />
        <Kpi label="Toplam bedel etkisi" value={moneyShort(totalCost, project.currency)} sub="En kötü senaryo toplamı" tone="warn"
          help="Bütün risklerin aynı anda gerçekleşmesi hâlindeki toplam maliyet. Teklife bu tutar değil, olasılıkla ağırlıklı karşılık eklenir." />
        <Kpi label="Beklenen değer" value={moneyShort(expected, project.currency)} sub="Olasılıkla ağırlıklı" tone="accent"
          help="Her riskin bedeli, gerçekleşme olasılığıyla çarpılıp toplanır. Teklife eklenecek risk karşılığı bu değere yakın belirlenir." />
        <Kpi label="En yüksek süre etkisi" value={`${maxTime} gün`} sub="Kazık tedariki" tone="warn" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Card title="Risk matrisi" help="Satır olasılığı, sütun etkiyi gösterir. Hücredeki sayı o kutudaki risk sayısıdır; tıklayınca ilgili risk açılır. Sağ üst köşe (yüksek olasılık + yüksek etki) en tehlikeli bölgedir.">
            <div className="flex gap-2">
              <div className="flex flex-col justify-around pb-6 text-right text-[10px] text-[var(--faint)]">
                {[5, 4, 3, 2, 1].map((p) => <div key={p} className="h-12 leading-[3rem]">{P_LABELS[p - 1]}</div>)}
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-5 gap-1">
                  {[5, 4, 3, 2, 1].map((p) =>
                    [1, 2, 3, 4, 5].map((i) => {
                      const items = cell(p, i)
                      const s = p * i
                      const tone = scoreTone(s)
                      return (
                        <button key={`${p}-${i}`} onClick={() => items[0] && setSel(items[0])}
                          className="grid h-12 place-items-center rounded text-[12px] font-bold transition-transform hover:scale-[1.04]"
                          title={items.map((r) => r.title).join('\n') || 'Bu hücrede risk yok'}
                          style={{
                            background: items.length ? `var(--${tone}-bg)` : 'var(--surface-2)',
                            color: items.length ? `var(--${tone})` : 'var(--faint)',
                            border: `1px solid ${items.length ? `var(--${tone})` : 'var(--border)'}`,
                          }}>
                          {items.length || ''}
                        </button>
                      )
                    }),
                  )}
                </div>
                <div className="mt-1 grid grid-cols-5 gap-1 text-center text-[10px] text-[var(--faint)]">
                  {['Çok az', 'Az', 'Orta', 'Yüksek', 'Çok yüksek'].map((l) => <div key={l}>{l}</div>)}
                </div>
              </div>
            </div>
          </Card>

          {sel && (
            <div className="mt-4">
              <Card title={sel.title} subtitle={`${sel.category} · sorumlu: ${sel.owner}`} right={<StateBadge value={sel.state} />}>
                <div className="flex flex-col gap-3 text-[12.5px]">
                  <p className="leading-relaxed text-[var(--ink)]">{sel.description}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Mini label="Olasılık" value={`${sel.probability}/5`} />
                    <Mini label="Etki" value={`${sel.impact}/5`} />
                    <Mini label="Bedel etkisi" value={sel.costImpact ? money(sel.costImpact, project.currency) : '—'} />
                    <Mini label="Süre etkisi" value={sel.timeImpact ? `${sel.timeImpact} gün` : '—'} />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Önlem</div>
                    <p className="mt-0.5 leading-relaxed text-[var(--ink)]">{sel.mitigation}</p>
                  </div>
                  <div className="flex gap-2">
                    <Btn small disabled={!writable}>Önlemi güncelle</Btn>
                    <Btn small primary disabled={!writable}>Teklife karşılık ekle</Btn>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 lg:col-span-8">
          <Card title="Risk kayıtları" help="O = olasılık (1–5), E = etki (1–5), Skor = O × E. Satıra tıklayınca sol panelde ayrıntısı, sağda ilgili doküman açılır." pad={false}>
            <Table head={
              <tr>
                <Th w={110}>Kategori</Th>
                <Th w={260}>Risk</Th>
                <Th w={60} right>O</Th>
                <Th w={60} right>E</Th>
                <Th w={70} right>Skor</Th>
                <Th w={110} right>Bedel</Th>
                <Th w={80} right>Süre</Th>
                <Th w={100}>Sorumlu</Th>
                <Th w={100}>Durum</Th>
              </tr>
            }>
              {[...bidRisks].sort((a, b) => b.probability * b.impact - a.probability * a.impact).map((r) => {
                const s = r.probability * r.impact
                return (
                  <tr key={r.id} onClick={() => setSel(r)} className="cursor-pointer hover:bg-[var(--surface-2)]"
                    style={sel?.id === r.id ? { background: 'var(--accent-soft)' } : undefined}>
                    <Td nowrap><span className="text-[var(--muted)]">{r.category}</span></Td>
                    <Td><span className="text-[12.5px] font-medium text-[var(--ink)]">{r.title}</span></Td>
                    <Td right>{r.probability}</Td>
                    <Td right>{r.impact}</Td>
                    <Td right><Badge tone={scoreTone(s)}>{s}</Badge></Td>
                    <Td right>{r.costImpact ? num(r.costImpact) : '—'}</Td>
                    <Td right>{r.timeImpact ? `${r.timeImpact} g` : '—'}</Td>
                    <Td nowrap><span className="text-[12px] text-[var(--muted)]">{r.owner}</span></Td>
                    <Td nowrap><StateBadge value={r.state} /></Td>
                  </tr>
                )
              })}
            </Table>
          </Card>

          {sel && (
            <PreviewPane
              title={`Riskin dayanağı — ${sel.title}`}
              preview={{
                doc: sel.category === 'Sözleşmesel' ? 'Sozlesme Tasarisi (Ozel Sartlar).pdf'
                  : sel.category === 'Zemin' ? 'Zemin Etut Raporu.pdf'
                  : sel.category === 'Program' ? 'Teknik Sartname - Deniz Yapilari.pdf'
                  : 'Idari Sartname.pdf',
                page: 41,
                body: `${sel.description}\n\nÖnlem: ${sel.mitigation}\n\nOlasılık ${sel.probability}/5 · Etki ${sel.impact}/5 · Skor ${sel.probability * sel.impact}`,
              }}
              footer={
                <div className="flex flex-wrap items-center gap-2">
                  <Btn small disabled={!writable}>Önlemi güncelle</Btn>
                  <Btn small primary disabled={!writable}>Teklife karşılık ekle</Btn>
                  <span className="ml-auto text-[11.5px] text-[var(--muted)]">Sorumlu: {sel.owner}</span>
                </div>
              }
            />
          )}

          <Card title="Teklif fiyatına yansıma" help="Risklerin teklif fiyatına eklenen karşılık olarak yansıması. Bu tutar, en kötü senaryonun tamamı değil, olasılıkla ağırlıklı bir paydır.">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2 text-[12.5px]">
                {[
                  { l: 'Eskalasyon karşılığı (fiyat farkı yok)', v: 3_900_000 },
                  { l: 'Finansman maliyeti (90 gün ödeme)', v: 1_650_000 },
                  { l: 'Zemin belirsizliği karşılığı', v: 1_400_000 },
                  { l: 'Program / verimlilik karşılığı', v: 1_100_000 },
                  { l: 'Diğer riskler', v: 850_000 },
                ].map((r) => (
                  <div key={r.l} className="flex items-center gap-2 border-b border-[var(--border)] pb-2 last:border-0">
                    <span className="text-[var(--ink)]">{r.l}</span>
                    <span className="ml-auto tnum text-[var(--muted)]">{money(r.v, project.currency)}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-1 text-[13px] font-bold">
                  <span className="text-[var(--ink)]">Toplam karşılık</span>
                  <span className="ml-auto tnum text-[var(--crit)]">{money(8_900_000, project.currency)}</span>
                </div>
              </div>
              <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3 text-[12.5px] leading-relaxed text-[var(--muted)]">
                <b className="text-[var(--ink)]">Yorum:</b> Risk karşılıkları ön teklif bedelinin yaklaşık {pct(12, 0)}’sine denk geliyor.
                En kötü senaryo toplamı {moneyShort(totalCost, project.currency)}; karşılık bunun yarısı kadar tutuluyor.
                Gecikme cezası tavanı ve ödeme süresi zeyilname ile iyileştirilirse karşılığın yaklaşık
                {' '}{moneyShort(1_900_000, project.currency)} kadarı geri kazanılabilir.
                <div className="mt-2 flex gap-2">
                  <Badge tone="warn">Karşılık payı {pct(12)}</Badge>
                  <Badge tone="ok">İyileştirme potansiyeli {moneyShort(1_900_000, project.currency)}</Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5">
      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--faint)]">{label}</div>
      <div className="mt-0.5 text-[13px] font-semibold text-[var(--ink)] tnum">{value}</div>
    </div>
  )
}
