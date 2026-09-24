import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { project } from '../data/mock'
import type { BidRisk } from '../data/types'
import {
  Badge, Btn, Card, ColumnFilter, DocViewer, ExportButtons, Field, Modal, PageHead, ReadOnlyNote,
  RowActions, StateBadge, StickyPane, Table, Td, Th,
} from './ui'
import { money, moneyShort, num, pct } from '../lib/format'

/**
 * Olasılık puanının tutara çevrilme oranı. 5/5 bile %100 sayılmaz:
 * riskin gerçekleşmesi ile en kötü senaryonun tamamının oluşması aynı şey değildir.
 */
export const P_WEIGHT: Record<number, number> = { 1: 0.1, 2: 0.25, 3: 0.5, 4: 0.75, 5: 0.9 }

function scoreTone(s: number) {
  return s >= 16 ? 'crit' : s >= 9 ? 'warn' : s >= 4 ? 'neutral' : 'ok'
}

/** Riskin dayandığı doküman paragrafı — sağdaki Kaynak panelinde açılır. */
export interface RiskSource {
  doc: string
  page: number
  pages: number
  clause?: string
  body: string
  highlight?: string
}

export interface RiskTotals {
  worst: number
  expected: number
  provision: number
}

/**
 * Risk kaydı ekranı — Teklif Riskleri ve Kontrat Analiz aynı yapıyı kullanır.
 * Üç sayı ayrı durur: en kötü senaryo, olasılıkla ağırlıklı beklenen bedel ve teklife eklenen karşılık.
 * Karşılık otomatik hesaplanmaz; her satır için ayrı ayrı karar verilir.
 * Solda kayıtlar ve seçili riskin hesabı, sağda yalnızca kaynak doküman durur.
 */
export function RiskRegister({ title, note, risks: initial, writable, role, kpis, source }: {
  title: string
  note: string
  risks: BidRisk[]
  writable: boolean
  role: string
  kpis: (t: RiskTotals) => ReactNode
  source: (r: BidRisk) => RiskSource
}) {
  const [list, setList] = useState<BidRisk[]>(initial)
  const [sel, setSel] = useState<BidRisk>(initial[0])
  /**
   * İki tik: "Aktif" riskin ekranda görünüp çıktıya girmesini,
   * "Teklifte" karşılığın teklif fiyatına etki etmesini belirler. Standartta hepsi aktiftir.
   */
  const [passive, setPassive] = useState<string[]>([])
  const [showPassive, setShowPassive] = useState(false)
  const [editing, setEditing] = useState<BidRisk | 'new' | null>(null)
  const risks = list.filter((r) => !passive.includes(r.id))
  /** Toplu işlem için işaretlenen riskler */
  const [checked, setChecked] = useState<string[]>([])
  const [catFilter, setCatFilter] = useState('Tümü')
  const [stateFilter, setStateFilter] = useState('Tümü')
  /** Karşılık tutarları ve teklife dâhil olup olmadığı — ekranda değiştirilebilir. */
  const [prov, setProv] = useState<Record<string, number>>(
    Object.fromEntries(initial.map((r) => [r.id, r.provision])),
  )
  const [inBid, setInBid] = useState<Record<string, boolean>>(
    Object.fromEntries(initial.map((r) => [r.id, r.inBid])),
  )

  const totals = useMemo(() => ({
    worst: risks.reduce((a, r) => a + r.costImpact, 0),
    expected: risks.reduce((a, r) => a + P_WEIGHT[r.probability] * r.costImpact, 0),
    provision: risks.reduce((a, r) => a + (inBid[r.id] ? prov[r.id] : 0), 0),
  }), [risks, prov, inBid])

  const rows = (showPassive ? list : risks)
    .filter((r) => (catFilter === 'Tümü' || r.category === catFilter) && (stateFilter === 'Tümü' || r.state === stateFilter))
    .sort((a, b) => b.probability * b.impact - a.probability * a.impact)

  const src = source(sel)

  function save(r: BidRisk) {
    setList((l) => (l.some((x) => x.id === r.id) ? l.map((x) => (x.id === r.id ? r : x)) : [...l, r]))
    setProv((v) => ({ ...v, [r.id]: v[r.id] ?? r.provision }))
    setInBid((v) => ({ ...v, [r.id]: v[r.id] ?? r.inBid }))
    setSel(r)
    setEditing(null)
  }

  function remove(id: string) {
    const rest = list.filter((x) => x.id !== id)
    setList(rest)
    if (sel.id === id && rest[0]) setSel(rest[0])
  }

  return (
    <>
      <PageHead
        title={title}
        note={note}
        right={<>
          <ExportButtons excluded={passive.length} />
          <Btn primary disabled={!writable} onClick={() => setEditing('new')}>+ Risk ekle</Btn>
        </>}
      />

      {!writable && <ReadOnlyNote role={role} />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">{kpis(totals)}</div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* ---------- Sol: kayıtlar, altında seçili riskin hesabı ---------- */}
        <div className="flex flex-col gap-4">
          {checked.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2"
              style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent)' }}>
              <span className="text-[12.5px] font-semibold" style={{ color: 'var(--accent)' }}>{checked.length} risk seçildi</span>
              <span className="ml-auto flex flex-wrap gap-1.5">
                <Btn small disabled={!writable}>Sorumlu ata</Btn>
                <Btn small disabled={!writable}>Karşılığı teklife işle</Btn>
                <Btn small onClick={() => setChecked([])}>Seçimi temizle</Btn>
              </span>
            </div>
          )}

          <Card
            title="Risk kayıtları"
            help="O = olasılık (1–5), E = etki (1–5), Skor = O × E. İki tik vardır: “Aktif” işaretliyse risk ekranda görünür ve PDF / Excel / Word çıktısına girer; “Teklifte” işaretliyse karşılığı teklif fiyatına etki eder. Satıra tıklayınca hesabı aşağıda, dayandığı doküman sağda açılır."
            right={passive.length > 0
              ? <label className="flex items-center gap-1.5 text-[11.5px] text-[var(--muted)]">
                <input type="checkbox" checked={showPassive} onChange={() => setShowPassive((v) => !v)} />
                Pasifleri göster ({passive.length})
              </label>
              : undefined}
            pad={false}
          >
            <Table head={
              <tr>
                <Th w={28}>
                  <input type="checkbox" checked={checked.length === rows.length && rows.length > 0}
                    onChange={(e) => setChecked(e.target.checked ? rows.map((r) => r.id) : [])} />
                </Th>
                <Th w={190}>
                  <span className="flex items-center gap-1.5">
                    Risk ve bedelin hesabı
                    <ColumnFilter value={catFilter} onChange={setCatFilter} values={[...new Set(risks.map((r) => r.category))]} />
                  </span>
                </Th>
                <Th w={48}>O × E</Th>
                <Th w={86} right>Bedel</Th>
                <Th w={96} right>Karşılık</Th>
                <Th w={40} center>Aktif</Th>
                <Th w={40}>
                  <span className="flex items-center gap-1.5">
                    Teklifte
                    <ColumnFilter value={stateFilter} onChange={setStateFilter} values={['Açık', 'İzleniyor', 'Kapandı']} />
                  </span>
                </Th>
              </tr>
            }>
              {rows.map((r) => {
                const s = r.probability * r.impact
                return (
                  <tr key={r.id} onClick={() => setSel(r)} className="cursor-pointer hover:bg-[var(--surface-2)]"
                    style={{
                      ...(sel.id === r.id ? { background: 'var(--accent-soft)' } : {}),
                      ...(passive.includes(r.id) ? { opacity: 0.5 } : {}),
                    }}>
                    <Td nowrap>
                      <input type="checkbox" checked={checked.includes(r.id)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => setChecked((c) => (c.includes(r.id) ? c.filter((x) => x !== r.id) : [...c, r.id]))} />
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12.5px] font-medium text-[var(--ink)]">{r.title}</span>
                        {r.timeBar && <Badge tone="warn">{r.timeBar}</Badge>}
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
                    <Td nowrap center>
                      <input type="checkbox" checked={!passive.includes(r.id)} disabled={!writable}
                        title="Aktif: ekranda görünür ve çıktıya girer"
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => setPassive((p) => (p.includes(r.id) ? p.filter((x) => x !== r.id) : [...p, r.id]))} />
                    </Td>
                    <Td nowrap center>
                      <input type="checkbox" checked={!!inBid[r.id]} disabled={!writable || passive.includes(r.id)}
                        title="Teklifte: karşılık teklif fiyatına etki eder"
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => setInBid((v) => ({ ...v, [r.id]: !v[r.id] }))} />
                    </Td>
                  </tr>
                )
              })}
              <tr>
                <Td className="bg-[var(--surface-2)]">{''}</Td>
                <Td className="bg-[var(--surface-2)]">
                  <span className="text-[12px] font-bold text-[var(--ink)]">Toplam</span>
                  <span className="ml-2 text-[11.5px] text-[var(--muted)]">teklif fiyatına eklenen karşılık</span>
                </Td>
                <Td className="bg-[var(--surface-2)]">{''}</Td>
                <Td className="bg-[var(--surface-2)]" right><span className="text-[12px] text-[var(--muted)] tnum">{num(totals.worst)}</span></Td>
                <Td className="bg-[var(--surface-2)]" right><span className="text-[12.5px] font-bold text-[var(--accent)] tnum">{num(totals.provision)}</span></Td>
                <Td className="bg-[var(--surface-2)]">{''}</Td>
                <Td className="bg-[var(--surface-2)]">{''}</Td>
              </tr>
            </Table>
          </Card>

          {/* Seçili riskin hesabı ve karşılık kararı */}
          <Card
            title={sel.title}
            subtitle={`${sel.category} · sorumlu: ${sel.owner}`}
            right={<>
              <StateBadge value={sel.state} />
              <RowActions name={sel.title} disabled={!writable} onEdit={() => setEditing(sel)} onDelete={() => remove(sel.id)} />
            </>}
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

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Mini label="Olasılık" value={`${sel.probability}/5 · ${pct(P_WEIGHT[sel.probability] * 100)}`} />
                <Mini label="Etki" value={`${sel.impact}/5`} />
                <Mini label="Beklenen bedel" value={moneyShort(P_WEIGHT[sel.probability] * sel.costImpact, project.currency)} />
                {sel.timeBar
                  ? <Mini label="Bildirim süresi" value={sel.timeBar} />
                  : <Mini label="Süre etkisi" value={sel.timeImpact ? `${sel.timeImpact} gün` : '—'} />}
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
                <Btn small primary disabled={!writable}>Karşılığı teklife işle</Btn>
              </div>
            </div>
          </Card>
        </div>

        {/* ---------- Sağ: yalnızca kaynak doküman ---------- */}
        <StickyPane>
          <DocViewer {...src} />
        </StickyPane>
      </div>

      {editing && (
        <RiskModal risk={editing === 'new' ? null : editing} categories={[...new Set(list.map((r) => r.category))]}
          onClose={() => setEditing(null)} onSave={save} />
      )}
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

/** Risk ekleme / düzenleme — ekle ve düzenle aynı formu kullanır. */
function RiskModal({ risk, categories, onClose, onSave }: {
  risk: BidRisk | null; categories: string[]; onClose: () => void; onSave: (r: BidRisk) => void
}) {
  const [title, setTitle] = useState(risk?.title ?? '')
  const [category, setCategory] = useState(risk?.category ?? categories[0] ?? 'Genel')
  const [description, setDescription] = useState(risk?.description ?? '')
  const [probability, setProbability] = useState(String(risk?.probability ?? 3))
  const [impact, setImpact] = useState(String(risk?.impact ?? 3))
  const [cost, setCost] = useState(String(risk?.costImpact ?? 0))
  const [basis, setBasis] = useState(risk?.basis ?? '')
  const [mitigation, setMitigation] = useState(risk?.mitigation ?? '')
  const [owner, setOwner] = useState(risk?.owner ?? '')
  const ready = title.trim().length > 2
  const clamp = (v: string) => Math.min(5, Math.max(1, Number(v) || 1)) as BidRisk['probability']

  return (
    <Modal
      title={risk ? 'Riski düzenle' : 'Risk ekle'}
      note="Bedelin açık hesabını (metraj × birim fiyat × oran) yazın; sayının nereden geldiği görünür olmalı."
      onClose={onClose}
      wide
      footer={<>
        <span className="text-[11.5px] text-[var(--faint)]">{ready ? 'Kaydedilmeye hazır' : 'Risk adı zorunlu'}</span>
        <span className="ml-auto flex gap-2">
          <Btn onClick={onClose}>Vazgeç</Btn>
          <Btn primary disabled={!ready} onClick={() => onSave({
            ...(risk ?? { id: `R${Date.now()}`, timeImpact: 0, state: 'Açık' as const, provision: 0, inBid: false }),
            title: title.trim(), category, description: description.trim(),
            probability: clamp(probability), impact: clamp(impact) as BidRisk['impact'],
            costImpact: Number(cost) || 0, basis: basis.trim(), mitigation: mitigation.trim(), owner: owner.trim() || '—',
          })}>Kaydet</Btn>
        </span>
      </>}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Risk" value={title} onChange={setTitle} placeholder="Ör. Kazık boyu belirsizliği" />
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Kategori</span>
          <input list="risk-cats" value={category} onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-2 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--accent)]" />
          <datalist id="risk-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
        </label>
        <div className="sm:col-span-2"><Field label="Açıklama" value={description} onChange={setDescription} /></div>
        <div className="grid grid-cols-3 gap-3 sm:col-span-2">
          <Field label="Olasılık (1–5)" value={probability} onChange={setProbability} type="number" />
          <Field label="Etki (1–5)" value={impact} onChange={setImpact} type="number" />
          <Field label={`Bedel (${project.currency})`} value={cost} onChange={setCost} type="number" />
        </div>
        <div className="sm:col-span-2"><Field label="Bedelin hesabı" value={basis} onChange={setBasis} placeholder="Ör. 9.850 ton × 1.640 EUR/ton × %12" /></div>
        <div className="sm:col-span-2"><Field label="Önlem" value={mitigation} onChange={setMitigation} /></div>
        <Field label="Sorumlu" value={owner} onChange={setOwner} />
      </div>
    </Modal>
  )
}
