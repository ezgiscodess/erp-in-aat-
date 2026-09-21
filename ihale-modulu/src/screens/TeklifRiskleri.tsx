import { useMemo, useState } from 'react'
import { bidRisks, docs, project } from '../data/mock'
import type { BidRisk } from '../data/types'
import {
  Badge, Bar, Btn, Card, Kpi, PageHead, PreviewPane, ReadOnlyNote, StateBadge, StickyPane, Table, Td, Th,
} from '../components/ui'
import { money, moneyShort, num, pct } from '../lib/format'

const P_LABELS = ['Çok düşük', 'Düşük', 'Orta', 'Yüksek', 'Çok yüksek']

/**
 * Olasılık puanının tutara çevrilme oranı. 5/5 bile %100 sayılmaz:
 * riskin gerçekleşmesi ile en kötü senaryonun tamamının oluşması aynı şey değildir.
 */
const P_WEIGHT: Record<number, number> = { 1: 0.1, 2: 0.25, 3: 0.5, 4: 0.75, 5: 0.9 }

function scoreTone(s: number) {
  return s >= 16 ? 'crit' : s >= 9 ? 'warn' : s >= 4 ? 'neutral' : 'ok'
}

/**
 * Risk matrisi ve risklerin teklif fiyatına dönüşmesi.
 * Üç sayı ayrı durur: en kötü senaryo, olasılıkla ağırlıklı beklenen bedel ve teklife eklenen karşılık.
 * Karşılık otomatik hesaplanmaz; her satır için ayrı ayrı karar verilir.
 */
export function TeklifRiskleri({ writable, role }: { writable: boolean; role: string }) {
  const [sel, setSel] = useState<BidRisk>(bidRisks[0])
  /** Karşılık tutarları ve teklife dâhil olup olmadığı — ekranda değiştirilebilir. */
  const [prov, setProv] = useState<Record<string, number>>(
    Object.fromEntries(bidRisks.map((r) => [r.id, r.provision])),
  )
  const [inBid, setInBid] = useState<Record<string, boolean>>(
    Object.fromEntries(bidRisks.map((r) => [r.id, r.inBid])),
  )

  const { worst, expected, provision } = useMemo(() => ({
    worst: bidRisks.reduce((a, r) => a + r.costImpact, 0),
    expected: bidRisks.reduce((a, r) => a + P_WEIGHT[r.probability] * r.costImpact, 0),
    provision: bidRisks.reduce((a, r) => a + (inBid[r.id] ? prov[r.id] : 0), 0),
  }), [prov, inBid])

  const maxTime = Math.max(...bidRisks.map((r) => r.timeImpact))
  const high = bidRisks.filter((r) => r.probability * r.impact >= 16).length
  const covered = (provision / expected) * 100
  const doc = docs.find((d) => d.name.startsWith(
    sel.category === 'Sözleşmesel' ? 'Sozlesme' : sel.category === 'Zemin' ? 'Zemin' : sel.category === 'Program' ? 'Teknik' : 'Idari',
  )) ?? docs[0]

  /** 5×5 matris hücrelerine düşen riskler */
  const cell = (p: number, i: number) => bidRisks.filter((r) => r.probability === p && r.impact === i)

  return (
    <>
      <PageHead
        title="Teklif Riskleri"
        note="Her risk üç sayıyla tutulur: gerçekleşirse oluşacak tutar (en kötü senaryo), bu tutarın açık hesabı ve teklife gerçekten eklenen karşılık. Karşılık otomatik gelmez; satır satır karar verilir ve gerekçesiyle kaydedilir."
        right={<>
          <Btn disabled={!writable}>+ Risk ekle</Btn>
          <Btn>Risk raporu (PDF)</Btn>
        </>}
      />

      {!writable && <ReadOnlyNote role={role} />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Toplam risk" value={bidRisks.length} sub={`${bidRisks.filter((r) => r.state === 'Açık').length} açık`} />
        <Kpi label="Yüksek risk" value={high} sub="Olasılık × etki ≥ 16" tone="crit" />
        <Kpi label="En yüksek süre etkisi" value={`${maxTime} gün`} sub="Kazık tedariki (R7)" tone="warn"
          help="Risklerin programa etkisi. Kritik yoldaki bir işi öteliyorsa doğrudan gecikme cezası riskine dönüşür." />
        <Kpi label="En kötü senaryo" value={moneyShort(worst, project.currency)} sub="Hepsi aynı anda gerçekleşirse" tone="warn"
          help="Bütün risklerin tam tutarıyla gerçekleşmesi hâli. Teklife bu tutar eklenmez; yalnızca üst sınırı gösterir." />
        <Kpi label="Beklenen bedel" value={moneyShort(expected, project.currency)} sub="Olasılıkla ağırlıklı" tone="neutral"
          help="Her riskin tutarı gerçekleşme olasılığıyla çarpılıp toplanır (1/5 → %10 … 5/5 → %90). Karşılığın makul aralığını gösterir, kendiliğinden uygulanmaz." />
        <Kpi label="Teklife eklenen karşılık" value={moneyShort(provision, project.currency)}
          sub={`Beklenenin ${pct(covered, 0)}’i · yaklaşık bedelin ${pct((provision / project.estimatedValue) * 100, 1)}’i`} tone="accent"
          help="Teklif fiyatına gerçekten eklenen tutar. Karşılık ayrılmayan riskler için gerekçe yazılır (doğal hedge, idare yükümlülüğü, alternatif tedarikçi gibi)." />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* ---------- Sol: kayıtlar ve fiyata yansıma ---------- */}
        <div className="flex flex-col gap-4">
          <Card
            title="Risk kayıtları"
            help="O = olasılık (1–5), E = etki (1–5), Skor = O × E. “Karşılık” teklife eklenen tutardır; kutucuk işaretliyse teklif fiyatına girer. Satıra tıklayınca hesabı ve dayanağı sağda açılır."
            pad={false}
          >
            <Table head={
              <tr>
                <Th w={230}>Risk ve bedelin hesabı</Th>
                <Th w={52}>O × E</Th>
                <Th w={90} right>Bedel</Th>
                <Th w={100} right>Karşılık</Th>
                <Th w={40}>Teklifte</Th>
              </tr>
            }>
              {[...bidRisks].sort((a, b) => b.probability * b.impact - a.probability * a.impact).map((r) => {
                const s = r.probability * r.impact
                return (
                  <tr key={r.id} onClick={() => setSel(r)} className="cursor-pointer hover:bg-[var(--surface-2)]"
                    style={sel.id === r.id ? { background: 'var(--accent-soft)' } : undefined}>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12.5px] font-medium text-[var(--ink)]">{r.title}</span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-[var(--muted)]">{r.category} · {r.basis}</div>
                    </Td>
                    <Td nowrap><Badge tone={scoreTone(s)}>{r.probability}×{r.impact}</Badge></Td>
                    <Td right>{r.costImpact ? num(r.costImpact) : '—'}</Td>
                    <Td right>
                      <span className="tnum" style={{ color: inBid[r.id] && prov[r.id] ? 'var(--accent)' : 'var(--faint)' }}>
                        {prov[r.id] ? num(prov[r.id]) : '—'}
                      </span>
                    </Td>
                    <Td nowrap>
                      <input type="checkbox" checked={!!inBid[r.id]} disabled={!writable}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => setInBid((v) => ({ ...v, [r.id]: !v[r.id] }))} />
                    </Td>
                  </tr>
                )
              })}
              <tr>
                <Td className="bg-[var(--surface-2)]">
                  <span className="text-[12px] font-bold text-[var(--ink)]">Toplam</span>
                  <span className="ml-2 text-[11.5px] text-[var(--muted)]">teklif fiyatına eklenen karşılık</span>
                </Td>
                <Td className="bg-[var(--surface-2)]">{''}</Td>
                <Td className="bg-[var(--surface-2)]" right><span className="text-[12px] text-[var(--muted)] tnum">{num(worst)}</span></Td>
                <Td className="bg-[var(--surface-2)]" right><span className="text-[12.5px] font-bold text-[var(--accent)] tnum">{num(provision)}</span></Td>
                <Td className="bg-[var(--surface-2)]">{''}</Td>
              </tr>
            </Table>
          </Card>

          <Card
            title="Teklif fiyatına yansıma"
            help="Üç sayı arasındaki farkı gösterir. Fark, karşılık ayrılmayan risklerden gelir; her biri için gerekçe aşağıda listelenir."
          >
            <div className="flex flex-col gap-3">
              <Line label="En kötü senaryo (hepsi gerçekleşirse)" value={worst} max={worst} tone="warn" />
              <Line label="Olasılıkla ağırlıklı beklenen bedel" value={expected} max={worst} tone="neutral" />
              <Line label="Teklife eklenen karşılık" value={provision} max={worst} tone="accent" />

              <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3 text-[12px] leading-relaxed text-[var(--muted)]">
                <b className="text-[var(--ink)]">Aradaki fark nereden geliyor?</b> Karşılık, beklenen bedelin
                {' '}{pct(covered, 0)}’i kadar. Karşılık ayrılmayan riskler ve gerekçeleri:
                <ul className="mt-1.5 flex flex-col gap-1">
                  {bidRisks.filter((r) => !inBid[r.id]).map((r) => (
                    <li key={r.id} className="flex gap-2">
                      <span className="text-[var(--ink)]">• {r.title}</span>
                      <span className="ml-auto whitespace-nowrap text-[var(--faint)] tnum">{moneyShort(r.costImpact, project.currency)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone="accent">Karşılık payı {pct((provision / project.estimatedValue) * 100, 1)}</Badge>
                  <Badge tone="ok">Zeyilname kabul edilirse ≈ {moneyShort(1_900_000, project.currency)} geri kazanılır</Badge>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Risk matrisi" help="Satır olasılığı, sütun etkiyi gösterir. Hücredeki sayı o kutudaki risk sayısıdır; tıklayınca ilgili risk açılır. Sağ üst köşe en tehlikeli bölgedir.">
            <div className="flex gap-2">
              <div className="flex flex-col justify-around pb-6 text-right text-[10px] text-[var(--faint)]">
                {[5, 4, 3, 2, 1].map((p) => <div key={p} className="h-10 leading-[2.5rem]">{P_LABELS[p - 1]}</div>)}
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-5 gap-1">
                  {[5, 4, 3, 2, 1].map((p) =>
                    [1, 2, 3, 4, 5].map((i) => {
                      const items = cell(p, i)
                      const tone = scoreTone(p * i)
                      return (
                        <button key={`${p}-${i}`} onClick={() => items[0] && setSel(items[0])}
                          className="grid h-10 place-items-center rounded text-[12px] font-bold transition-transform hover:scale-[1.04]"
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
        </div>

        {/* ---------- Sağ: seçili riskin hesabı ve dayanağı ---------- */}
        <StickyPane>
          <div className="flex flex-col gap-4">
            <Card
              title={sel.title}
              subtitle={`${sel.category} · sorumlu: ${sel.owner}`}
              right={<StateBadge value={sel.state} />}
            >
              <div className="flex flex-col gap-3 text-[12.5px]">
                <p className="leading-relaxed text-[var(--ink)]">{sel.description}</p>

                {/* Bedelin hesabı — sayının nereden geldiği */}
                <div className="rounded-md border px-3 py-2.5" style={{ background: 'var(--surface-2)', borderColor: 'var(--border-strong)' }}>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Bedelin hesabı</div>
                  <p className="mt-1 leading-relaxed text-[var(--ink)]">{sel.basis}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-bold text-[var(--warn)] tnum">{sel.costImpact ? money(sel.costImpact, project.currency) : '—'}</span>
                    {sel.basisRef && <span className="text-[11px] text-[var(--muted)]">📎 {sel.basisRef}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Mini label="Olasılık" value={`${sel.probability}/5 · ${pct(P_WEIGHT[sel.probability] * 100)}`} />
                  <Mini label="Etki" value={`${sel.impact}/5`} />
                  <Mini label="Beklenen bedel" value={moneyShort(P_WEIGHT[sel.probability] * sel.costImpact, project.currency)} />
                  <Mini label="Süre etkisi" value={sel.timeImpact ? `${sel.timeImpact} gün` : '—'} />
                </div>

                {/* Karşılık kararı */}
                <div className="rounded-md border px-3 py-2.5" style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>Teklife eklenecek karşılık</span>
                    <label className="ml-auto flex items-center gap-1.5 text-[11.5px]" style={{ color: 'var(--accent)' }}>
                      <input type="checkbox" checked={!!inBid[sel.id]} disabled={!writable}
                        onChange={() => setInBid((v) => ({ ...v, [sel.id]: !v[sel.id] }))} />
                      teklife dâhil
                    </label>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="number" step={50_000} min={0} value={prov[sel.id]} disabled={!writable}
                      onChange={(e) => setProv((v) => ({ ...v, [sel.id]: Number(e.target.value) || 0 }))}
                      className="w-40 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[13px] font-semibold text-[var(--ink)] outline-none tnum"
                    />
                    <span className="text-[12px] text-[var(--muted)]">{project.currency}</span>
                    <span className="ml-auto text-[11px] text-[var(--muted)]">
                      Beklenen: {moneyShort(P_WEIGHT[sel.probability] * sel.costImpact, project.currency)}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Önlem</div>
                  <p className="mt-0.5 leading-relaxed text-[var(--ink)]">{sel.mitigation}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Btn small disabled={!writable}>Önlemi güncelle</Btn>
                  <Btn small primary disabled={!writable}>Karşılığı teklife işle</Btn>
                </div>
              </div>
            </Card>

            <PreviewPane
              title="Riskin dayanağı"
              preview={{
                doc: doc.name,
                page: sel.category === 'Sözleşmesel' ? 63 : sel.category === 'Zemin' ? 23 : 41,
                pages: doc.pages,
                body: `${sel.description}\n\nHesap: ${sel.basis}\nKaynak: ${sel.basisRef ?? '—'}\n\nÖnlem: ${sel.mitigation}`,
              }}
              paper
              height={240}
              footer={
                <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-[var(--muted)]">
                  <span>Olasılık {sel.probability}/5 · Etki {sel.impact}/5 · Skor {sel.probability * sel.impact}</span>
                  <span className="ml-auto"><Btn small>Kaynağı aç</Btn></span>
                </div>
              }
            />
          </div>
        </StickyPane>
      </div>
    </>
  )
}

function Line({ label, value, max, tone }: { label: string; value: number; max: number; tone: 'warn' | 'neutral' | 'accent' }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[12.5px]">
        <span className="text-[var(--ink)]">{label}</span>
        <span className="font-semibold tnum" style={{ color: tone === 'accent' ? 'var(--accent)' : 'var(--muted)' }}>
          {money(value, project.currency)}
        </span>
      </div>
      <Bar value={(value / max) * 100} tone={tone} height={8} />
    </div>
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
