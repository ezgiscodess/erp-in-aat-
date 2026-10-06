import { useState } from 'react'
import { boqItems, project, workGroups } from '../data/mock'
import type { BoqItem, TabKey } from '../data/types'
import {
  Badge, Btn, Card, Chips, ColumnFilter, Dropzone, ExportButtons, Field, Kpi, Modal, PageHead, ReadOnlyNote, Search, Table, Td, Th,
} from '../components/ui'
import { money, num } from '../lib/format'
import { codeFor, methodOf } from '../lib/methods'
import type { MethodKey } from '../lib/methods'

/**
 * BOQ = Take-Offs'ta çıkan yalın metrajların birim fiyatlarla birleştiği keşif cetveli.
 * İhale dokümanında birim fiyat bulunmaz; fiyat, Pool'daki firma havuzundan aynı kodla eşleşir.
 */
export function Boq({ writable, role, method, onGo }: { writable: boolean; role: string; method: MethodKey; onGo: (t: TabKey) => void }) {
  const [q, setQ] = useState('')
  const [fGroup, setFGroup] = useState('Tümü')
  const [fMatch, setFMatch] = useState('Tümü')
  /** Elle girilen birim fiyatlar — havuzdan gelenlerden ayrı renkte görünür. */
  const [manual, setManual] = useState<Record<string, number>>({})
  /** Elle girilen fiyat havuza da işlendi mi */
  const [toPool, setToPool] = useState<Record<string, boolean>>({})
  const [editItem, setEditItem] = useState<BoqItem | null>(null)
  /** Alttaki fiyat özetinde açık olan liste */
  const [view, setView] = useState<SummaryView>('Fiyatı yok')
  /** Özetten açılan "Birim fiyat ekle" penceresi */
  const [adding, setAdding] = useState<BoqItem | null>(null)
  const m = methodOf(method)

  /** Bir kalemin geçerli birim fiyatı: elle girildiyse o, yoksa havuzdan gelen. */
  const priceOf = (b: BoqItem) => manual[b.id] ?? b.unitPrice
  const matchOf = (b: BoqItem) => (manual[b.id] != null ? 'Elle girildi' : b.poolMatch)

  const rows = boqItems.filter((b) => {
    if (fGroup !== 'Tümü' && b.group !== fGroup) return false
    if (fMatch !== 'Tümü' && matchOf(b) !== fMatch) return false
    if (q.trim()) {
      const s = q.toLocaleLowerCase('tr')
      return [codeFor(b, method), b.description].some((v) => v.toLocaleLowerCase('tr').includes(s))
    }
    return true
  })

  const amount = (b: BoqItem) => (priceOf(b) ?? 0) * b.qty
  const total = boqItems.reduce((a, b) => a + amount(b), 0)
  const unpriced = boqItems.filter((b) => priceOf(b) == null)
  const similar = boqItems.filter((b) => manual[b.id] == null && b.poolMatch === 'Benzer poz')
  const groups = workGroups.filter((g) => rows.some((b) => b.group === g))
  const handPriced = boqItems.filter((b) => manual[b.id] != null)
  const summaryList = view === 'Fiyatı yok' ? unpriced : view === 'Benzer kalem' ? similar : handPriced

  /** KPI kutusuna tıklayınca alttaki özette o liste açılır */
  function showSummary(v: SummaryView) {
    setView(v)
    document.getElementById('boq-summary')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <PageHead
        title="BOQ"
        note={`Take-Offs’ta çıkan yalın metrajlar (duvar 50 m², beton 150 m³…) burada birim fiyatlarla birleşir. Fiyatlar Pool’daki firma havuzundan ${m.label} koduyla eşleşir; havuzda olmayan kalemlere fiyat elle girilir.`}
        right={<>
          <ExportButtons />
          <Btn onClick={() => onGo('takeoff')}>← Take-Offs</Btn>
          <Btn onClick={() => onGo('birim_fiyat')}>Pool’u aç</Btn>
        </>}
      />

      {!writable && <ReadOnlyNote role={role} />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="BOQ toplamı" value={money(total, project.currency)} sub={`${boqItems.length} kalem · fiyatı olanlar`} tone="accent"
          help="Metraj × birim fiyat toplamı. Fiyatı girilmemiş kalemler toplama girmez." />
        <Kpi label="Fiyatı yok" value={unpriced.length} sub="Havuzda eşleşmedi" tone="crit" onClick={() => showSummary('Fiyatı yok')}
          help="Pool’da karşılığı bulunmayan kalemler. Teklif verilmeden önce fiyatları girilmeli." />
        <Kpi label="Benzer kalem" value={similar.length} sub="Önerilen fiyat onay bekliyor" tone="warn" onClick={() => showSummary('Benzer kalem')}
          help="Kod birebir eşleşmedi; iş kalemi metnine göre benzer kalemin fiyatı önerildi." />
        <Kpi label="Elle fiyatlanan" value={Object.keys(manual).length} onClick={() => showSummary('Elle fiyatlanan')}
          sub={`${Object.values(toPool).filter(Boolean).length} tanesi havuza işlendi`}
          help="Teklif ekibinin elle girdiği fiyatlar sarı görünür." />
      </div>

      <Card
        title={`Keşif cetveli (${rows.length})`}
        help="Metraj Take-Offs’tan gelir ve burada değiştirilmez. Fiyata tıklayınca birim fiyat düzenlenir. Siyah fiyatlar havuzdan, sarılar elle girilmiştir."
        right={<Search value={q} onChange={setQ} placeholder="Kod veya kalem ara…" />}
        pad={false}
      >
        <Table head={
          <tr>
            <Th w={90}>Kod · {m.label}</Th>
            <Th w={300}>
              <span className="flex items-center gap-1.5">İş kalemi
                <ColumnFilter value={fGroup} onChange={setFGroup} values={workGroups.filter((g) => boqItems.some((b) => b.group === g))} />
              </span>
            </Th>
            <Th w={56}>Birim</Th>
            <Th w={90} right>Metraj</Th>
            <Th w={130}>
              <span className="flex items-center gap-1.5">Birim fiyat
                <ColumnFilter value={fMatch} onChange={setFMatch} values={['Eşleşti', 'Benzer poz', 'Eşleşmedi', 'Elle girildi']} />
              </span>
            </Th>
            <Th w={130} right>Tutar ({project.currency})</Th>
          </tr>
        }>
          {groups.map((g) => {
            const list = rows.filter((b) => b.group === g)
            return [
              <tr key={g} className="bg-[var(--surface-2)]">
                <Td><span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{g}</span></Td>
                <Td><span className="text-[11px] text-[var(--faint)]">{list.length} kalem</span></Td>
                <Td>{''}</Td><Td>{''}</Td><Td>{''}</Td>
                <Td right><span className="text-[12px] font-semibold text-[var(--ink)]">{num(list.reduce((a, b) => a + amount(b), 0))}</span></Td>
              </tr>,
              ...list.map((b) => {
                const price = priceOf(b)
                const byHand = manual[b.id] != null
                return (
                  <tr key={b.id} className="hover:bg-[var(--surface-2)]">
                    <Td mono nowrap>{codeFor(b, method)}</Td>
                    <Td><span className="text-[12.5px] text-[var(--ink)]">{b.description}</span></Td>
                    <Td nowrap><span className="text-[var(--muted)]">{b.unit}</span></Td>
                    <Td right>{num(b.qty)}</Td>
                    <Td nowrap>
                      {price == null ? (
                        <button disabled={!writable} onClick={() => setEditItem(b)} title="Birim fiyat gir">
                          <Badge tone="crit">havuzda yok · gir</Badge>
                        </button>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <button disabled={!writable} onClick={() => setEditItem(b)}
                            className="tnum text-[12.5px] font-medium underline decoration-dotted underline-offset-2"
                            style={{ color: byHand ? 'var(--gold)' : 'var(--ink)' }}
                            title={byHand ? 'Elle girilen fiyat' : 'Pool’dan geldi'}>
                            {num(price, price < 100 ? 2 : 0)}
                          </button>
                          {byHand && <Badge tone="gold">elle</Badge>}
                          {!byHand && b.poolMatch === 'Benzer poz' && <Badge tone="warn">≈</Badge>}
                        </span>
                      )}
                    </Td>
                    <Td right>{price == null ? <span className="text-[var(--faint)]">—</span> : num(amount(b))}</Td>
                  </tr>
                )
              }),
            ]
          })}
          <tr style={{ background: 'var(--accent-soft)' }}>
            <Td><span className="text-[12px] font-bold text-[var(--ink)]">Toplam</span></Td>
            <Td><span className="text-[11px] text-[var(--muted)]">{rows.length} kalem</span></Td>
            <Td>{''}</Td><Td>{''}</Td><Td>{''}</Td>
            <Td right><span className="text-[13px] font-bold text-[var(--ink)]">{num(rows.reduce((a, b) => a + amount(b), 0))}</span></Td>
          </tr>
        </Table>
      </Card>

      {/* Fiyat özeti — üstteki üç kutunun listesi */}
      <div id="boq-summary" className="scroll-mt-20">
        <Card
          title="Fiyat özeti"
          help="Üstteki kutuların ayrıntısı: fiyatı olmayan, benzer kalemden fiyat önerilen ve elle fiyatlanan kalemler. Birim fiyat ekle ile kalemin fiyatı ve dayandığı reçete / analiz girilir."
          right={<Chips<SummaryView> value={view} onChange={setView} items={[
            { key: 'Fiyatı yok', label: 'Fiyatı yok', count: unpriced.length },
            { key: 'Benzer kalem', label: 'Benzer kalem', count: similar.length },
            { key: 'Elle fiyatlanan', label: 'Elle fiyatlanan', count: handPriced.length },
          ]} />}
          pad={false}
        >
          <Table head={
            <tr>
              <Th w={100}>Kod · {m.label}</Th>
              <Th w={360}>Açıklama</Th>
              <Th w={70}>Birim</Th>
              <Th w={100} right>Metraj</Th>
              <Th w={120} right>{view === 'Fiyatı yok' ? 'Birim fiyat' : view === 'Benzer kalem' ? 'Önerilen fiyat' : 'Elle girilen'}</Th>
              <Th w={150} center>İşlem</Th>
            </tr>
          }>
            {summaryList.length === 0 && (
              <tr><Td><span className="text-[12px] text-[var(--faint)]">Bu listede kalem yok.</span></Td><Td>{''}</Td><Td>{''}</Td><Td>{''}</Td><Td>{''}</Td><Td>{''}</Td></tr>
            )}
            {summaryList.map((b) => {
              const price = priceOf(b)
              return (
                <tr key={b.id} className="hover:bg-[var(--surface-2)]">
                  <Td mono nowrap>{codeFor(b, method)}</Td>
                  <Td><span className="text-[12.5px] text-[var(--ink)]">{b.description}</span></Td>
                  <Td nowrap><span className="text-[var(--muted)]">{b.unit}</span></Td>
                  <Td right>{num(b.qty)}</Td>
                  <Td right>{price == null ? <span className="text-[var(--faint)]">—</span> : <span style={{ color: manual[b.id] != null ? 'var(--gold)' : 'var(--ink)' }}>{num(price, price < 100 ? 2 : 0)}</span>}</Td>
                  <Td nowrap center>
                    <Btn small minW={124} primary={view === 'Fiyatı yok'} disabled={!writable} onClick={() => setAdding(b)}>
                      {view === 'Elle fiyatlanan' ? 'Fiyatı düzenle' : '+ Birim fiyat ekle'}
                    </Btn>
                  </Td>
                </tr>
              )
            })}
          </Table>
        </Card>
      </div>

      {adding && (
        <AddPriceModal item={adding} code={codeFor(adding, method)} current={priceOf(adding)}
          onClose={() => setAdding(null)}
          onSave={(price) => {
            setManual((x) => ({ ...x, [adding.id]: price }))
            setToPool((t) => ({ ...t, [adding.id]: true }))
            setAdding(null)
          }} />
      )}

      {editItem && (
        <PriceModal
          item={editItem}
          current={priceOf(editItem)}
          onClose={() => setEditItem(null)}
          onSave={(price, updatePool) => {
            setManual((x) => ({ ...x, [editItem.id]: price }))
            setToPool((t) => ({ ...t, [editItem.id]: updatePool }))
            setEditItem(null)
          }}
        />
      )}
    </>
  )
}

type SummaryView = 'Fiyatı yok' | 'Benzer kalem' | 'Elle fiyatlanan'

/* ---------------- Birim fiyat ekleme (reçete / analizle) ---------------- */

/**
 * Fiyatı olmayan kaleme birim fiyat girişi: kod, açıklama ve birim kalemden gelir;
 * birim fiyat ile dayandığı reçete / analiz dosyası girilir. Kaydedilen fiyat Pool'a işlenir.
 */
function AddPriceModal({ item, code, current, onClose, onSave }: {
  item: BoqItem; code: string; current?: number; onClose: () => void; onSave: (price: number) => void
}) {
  const [desc, setDesc] = useState(item.description)
  const [unit, setUnit] = useState(item.unit)
  const [value, setValue] = useState(current != null ? String(current) : '')
  const [files, setFiles] = useState<string[]>([])
  const price = Number(value.replace(',', '.')) || 0
  return (
    <Modal title="Birim fiyat ekle" note={`${code} · metraj ${num(item.qty)} ${item.unit}`} onClose={onClose} wide
      footer={<>
        <span className="text-[11.5px] text-[var(--faint)]">
          {price > 0 ? <>Kalem tutarı <b className="text-[var(--ink)]">{num(price * item.qty)} {project.currency}</b> · fiyat Pool’a işlenir</> : 'Birim fiyat zorunlu'}
        </span>
        <span className="ml-auto flex gap-2">
          <Btn onClick={onClose}>Vazgeç</Btn>
          <Btn primary disabled={price <= 0} onClick={() => onSave(price)}>Kaydet</Btn>
        </span>
      </>}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="sm:col-span-1"><Field label="Kod" value={code} onChange={() => {}} /></div>
        <div className="sm:col-span-3"><Field label="Açıklama" value={desc} onChange={setDesc} /></div>
        <div className="sm:col-span-1"><Field label="Birim" value={unit} onChange={setUnit} /></div>
        <div className="sm:col-span-1"><Field required label={`Birim fiyat (${project.currency})`} value={value} onChange={setValue} type="number" /></div>
        <div className="sm:col-span-2 self-end rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-2 text-[11.5px] text-[var(--muted)]">
          Reçete yüklenirse AI malzeme, işçilik ve makine kalemlerini okuyup birim fiyatı önerir.
        </div>
        <div className="sm:col-span-4">
          <div className="mb-1.5 text-[12px] font-medium text-[var(--ink)]">Birim fiyat reçetesi / analizi</div>
          <Dropzone files={files} onAdd={(n) => setFiles((f) => [...f, ...n])} onRemove={(n) => setFiles((f) => f.filter((x) => x !== n))}
            samples={['Birim fiyat analizi.xlsx', 'Malzeme recetesi.pdf', 'Tedarikci teklifi.pdf']}
            hint="Excel veya PDF · malzeme, işçilik, makine ve genel gider kırılımı" />
        </div>
      </div>
    </Modal>
  )
}

/* ---------------- Birim fiyat düzenleme ---------------- */

/**
 * Elle birim fiyat girişi. Kaydederken havuzun da güncellenip güncellenmeyeceği sorulur:
 * evet denirse fiyat bütün ihalelerde geçerli olur, hayır denirse yalnızca bu ihaleye özel kalır.
 */
function PriceModal({ item, current, onClose, onSave }: {
  item: BoqItem
  current?: number
  onClose: () => void
  onSave: (price: number, updatePool: boolean) => void
}) {
  const [value, setValue] = useState(String(current ?? ''))
  const [asking, setAsking] = useState(false)
  const price = Number(value.replace(',', '.')) || 0

  if (asking) {
    return (
      <Modal
        title="Havuz verisi güncellensin mi?"
        note={`${item.no} · ${item.description}`}
        onClose={onClose}
        footer={<>
          <Btn onClick={() => onSave(price, false)}>Hayır — yalnızca bu ihalede</Btn>
          <span className="ml-auto"><Btn primary onClick={() => onSave(price, true)}>Evet — havuzu güncelle</Btn></span>
        </>}
      >
        <div className="flex flex-col gap-2.5 text-[12.5px] leading-relaxed">
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-[var(--muted)]">Yeni birim fiyat</span>
              <span className="ml-auto text-[15px] font-bold text-[var(--gold)] tnum">{num(price, price < 100 ? 2 : 0)} {project.currency}</span>
            </div>
            {current != null && (
              <div className="mt-1 flex items-center gap-2 text-[11.5px] text-[var(--faint)]">
                <span>Önceki (havuz)</span>
                <span className="ml-auto tnum">{num(current, current < 100 ? 2 : 0)} {project.currency}</span>
              </div>
            )}
          </div>
          <p className="text-[var(--muted)]">
            <b className="text-[var(--ink)]">Evet:</b> Pool’daki {item.no} pozunun fiyatı güncellenir ve
            bundan sonraki bütün ihalelerde bu fiyat kullanılır.
          </p>
          <p className="text-[var(--muted)]">
            <b className="text-[var(--ink)]">Hayır:</b> Fiyat yalnızca bu ihaleye özel kalır; havuzdaki kayıt değişmez.
            Kalem listede elle girildiği belli olacak şekilde işaretlenir.
          </p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      title="Birim fiyat düzenle"
      note={`${item.no} · ${item.description}`}
      onClose={onClose}
      footer={<>
        <span className="text-[11.5px] text-[var(--faint)]">
          {current != null ? 'Havuzdan gelen fiyatın üzerine yazılıyor' : 'Bu poz havuzda fiyatlandırılmamış'}
        </span>
        <span className="ml-auto flex gap-2">
          <Btn onClick={onClose}>Vazgeç</Btn>
          <Btn primary disabled={price <= 0} onClick={() => setAsking(true)}>Kaydet</Btn>
        </span>
      </>}
    >
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Field required label={`Birim fiyat (${project.currency}/${item.unit})`} value={value} onChange={setValue} type="number" />
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Kalem tutarı</div>
            <div className="mt-1 text-[15px] font-bold text-[var(--ink)] tnum">
              {num(price * item.qty)} {project.currency}
            </div>
            <div className="mt-0.5 text-[11px] text-[var(--faint)]">{num(item.qty)} {item.unit} × birim fiyat</div>
          </div>
        </div>
        <p className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[11.5px] leading-relaxed text-[var(--muted)]">
          Pool’dan gelen fiyatlar standart renkte, elle girilenler sarı görünür. Böylece teklif kapanışında
          hangi kalemlerin elle fiyatlandığı bir bakışta ayırt edilir.
        </p>
      </div>
    </Modal>
  )
}

