import { useState } from 'react'
import { boqItems, project, workGroups } from '../data/mock'
import type { BoqItem, TabKey } from '../data/types'
import {
  Badge, Btn, Card, ColumnFilter, ExportButtons, Field, Kpi, Modal, PageHead, ReadOnlyNote, Search, Table, Td, Th,
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="BOQ toplamı" value={money(total, project.currency)} sub={`${boqItems.length} kalem · fiyatı olanlar`} tone="accent"
          help="Metraj × birim fiyat toplamı. Fiyatı girilmemiş kalemler toplama girmez." />
        <Kpi label="Fiyatı yok" value={unpriced.length} sub="Havuzda eşleşmedi" tone="crit"
          help="Pool’da karşılığı bulunmayan kalemler. Teklif verilmeden önce fiyatları girilmeli." />
        <Kpi label="Benzer kalem" value={similar.length} sub="Önerilen fiyat onay bekliyor" tone="warn"
          help="Kod birebir eşleşmedi; iş kalemi metnine göre benzer kalemin fiyatı önerildi." />
        <Kpi label="Elle fiyatlanan" value={Object.keys(manual).length}
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
          <Field label={`Birim fiyat (${project.currency}/${item.unit})`} value={value} onChange={setValue} type="number" />
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

