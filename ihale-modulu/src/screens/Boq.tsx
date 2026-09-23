import { useState } from 'react'
import { boqItems, project, workGroups } from '../data/mock'
import type { BoqItem, TabKey, WorkGroup } from '../data/types'
import {
  Badge, Btn, Card, Chips, ExportButtons, Field, Kpi, Modal, PageHead, PreviewPane, ReadOnlyNote,
  Search, StickyPane, Table, Td, Th,
} from '../components/ui'
import { num } from '../lib/format'

/**
 * Metraj = ihale dokümanındaki poz listesi ve miktarlar.
 * İhale dokümanında birim fiyat bulunmaz; fiyat, firmanın Birim Fiyat Havuzu'ndan eşleşir.
 */
export function Boq({ writable, role, onGo }: { writable: boolean; role: string; onGo: (t: TabKey) => void }) {
  const [group, setGroup] = useState<'Tümü' | WorkGroup>('Tümü')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<BoqItem>(boqItems[5])
  /** Elle girilen birim fiyatlar — havuzdan gelenlerden ayrı renkte görünür. */
  const [manual, setManual] = useState<Record<string, number>>({})
  /** Elle girilen fiyat havuza da işlendi mi */
  const [toPool, setToPool] = useState<Record<string, boolean>>({})
  const [editItem, setEditItem] = useState<BoqItem | null>(null)

  /** Bir kalemin geçerli birim fiyatı: elle girildiyse o, yoksa havuzdan gelen. */
  const priceOf = (b: BoqItem) => manual[b.id] ?? b.unitPrice

  /** Çipler sabit iş grubu listesinden gelir: kalemi olmayan grup da görünür. */
  const chips = [
    { key: 'Tümü' as const, label: 'Tümü', count: boqItems.length },
    ...workGroups.map((g) => ({ key: g, label: g, count: boqItems.filter((b) => b.group === g).length })),
  ]

  const rows = boqItems.filter((b) => {
    if (group !== 'Tümü' && b.group !== group) return false
    if (q.trim()) {
      const s = q.toLocaleLowerCase('tr')
      return [b.no, b.description, b.source].some((v) => v.toLocaleLowerCase('tr').includes(s))
    }
    return true
  })

  const unmatched = boqItems.filter((b) => b.poolMatch === 'Eşleşmedi')
  const lowConf = boqItems.filter((b) => b.confidence < 80)

  return (
    <>
      <PageHead
        title="Metraj (BoQ / Take-off)"
        note="İhale dokümanındaki poz listesi ve metrajlar. İhale dokümanlarında genellikle birim fiyat bulunmaz; fiyatı teklif ekibi girer. Buradaki fiyatlar firmanın Birim Fiyat Havuzu'ndan poz numarası ile eşleşir."
        right={<>
          <ExportButtons />
          <Btn disabled={!writable}>Çizimden metraj çıkar</Btn>
          <Btn primary disabled={!writable}>+ Poz ekle</Btn>
        </>}
      />

      {!writable && <ReadOnlyNote role={role} />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Poz sayısı" value={boqItems.length} sub="İhale cetveli + çizimden çıkarılan"
          help="İhale dokümanındaki iş kalemi sayısı. Poz numarası, idarenin cetvelinden veya firmanın kendi kırılımından gelir." />
        <Kpi label="Havuzda fiyatı yok" value={unmatched.length} sub="Birim fiyat girilmeli" tone="crit"
          help="Bu pozlar Birim Fiyat Havuzu'nda bulunamadı. Teklif verilmeden önce fiyatlarının havuza girilmesi gerekir." />
        <Kpi label="Düşük güvenli metraj" value={lowConf.length} sub="Ölçüm güveni %80 altı" tone="warn"
          help="Metraj AI ile çizimden çıkarıldığında bir güven yüzdesi üretilir. %80 altındaki kalemler elle kontrol edilmeden teklife girmez." />
        <Kpi label="Take-off tamamlanan" value="3 / 5" sub="Çizim seti"
          help="Metrajı çıkarılmış çizim sayısı. Eksik çizimlerde metraj geçici olarak idare cetvelinden alınır." />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Chips<'Tümü' | WorkGroup> value={group} onChange={setGroup} items={chips} />
            <div className="ml-auto"><Search value={q} onChange={setQ} placeholder="Poz ara…" /></div>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[11.5px] text-[var(--muted)]">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--ink)' }} /> Havuzdan gelen fiyat
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--gold)' }} /> Elle girilen fiyat
            </span>
            <span className="ml-auto">
              {Object.keys(manual).length > 0
                ? `${Object.keys(manual).length} kalem elle fiyatlandı · ${Object.values(toPool).filter(Boolean).length} tanesi havuza işlendi`
                : 'Bütün fiyatlar havuzdan geliyor'}
            </span>
          </div>

          <Card
            title={`Poz listesi (${rows.length})`}
            help="Satıra tıklayınca metrajın çıkarıldığı çizim veya cetvel sağdaki önizlemede açılır. Sarı satırlar düşük ölçüm güvenine sahiptir."
            pad={false}
          >
            <Table head={
              <tr>
                <Th w={72}>Poz no</Th>
                <Th w={210}>İş kalemi ve metraj kaynağı</Th>
                <Th w={46}>Birim</Th>
                <Th w={76} right>Metraj</Th>
                <Th w={118}>Havuz fiyatı</Th>
              </tr>
            }>
              {rows.map((b) => {
                const low = b.confidence < 80
                return (
                  <tr key={b.id} onClick={() => setSel(b)} className="cursor-pointer hover:bg-[var(--surface-2)]"
                    style={sel.id === b.id
                      ? { background: 'var(--accent-soft)' }
                      : low ? { background: 'color-mix(in srgb, var(--warn-bg) 45%, transparent)' } : undefined}>
                    <Td mono nowrap>{b.no}</Td>
                    <Td>
                      <div className="text-[12.5px] text-[var(--ink)]">{b.description}</div>
                      <div className="mt-0.5 text-[11px] text-[var(--faint)]">{b.source}</div>
                      {b.note && <div className="mt-0.5 text-[11px] text-[var(--warn)]">⚠ {b.note}</div>}
                      {low && !b.note && <div className="mt-0.5 text-[11px] text-[var(--warn)]">⚠ Ölçüm güveni %{b.confidence} — elle kontrol edilmeli</div>}
                    </Td>
                    <Td nowrap><span className="text-[var(--muted)]">{b.unit}</span></Td>
                    <Td right>{num(b.qty)}</Td>
                    <Td nowrap>
                      {(() => {
                        const price = priceOf(b)
                        const byHand = manual[b.id] != null
                        if (price == null) {
                          return (
                            <span className="flex items-center gap-1.5">
                              <Badge tone="crit">havuzda yok</Badge>
                              <span className="ml-auto"><Btn small minW={68} disabled={!writable} onClick={(() => setEditItem(b))}>Gir</Btn></span>
                            </span>
                          )
                        }
                        return (
                          <span className="flex items-center gap-1.5">
                            <span className="tnum text-[12.5px] font-medium"
                              style={{ color: byHand ? 'var(--gold)' : 'var(--ink)' }}
                              title={byHand ? 'Elle girilen fiyat' : 'Birim Fiyat Havuzu’ndan geldi'}>
                              {num(price, price < 100 ? 2 : 0)}
                            </span>
                            <span className="text-[11px] text-[var(--faint)]">{project.currency}</span>
                            {byHand && <Badge tone="gold">elle</Badge>}
                            {!byHand && b.poolMatch === 'Benzer poz' && <Badge tone="warn">≈</Badge>}
                            <span className="ml-auto pl-2"><Btn small minW={68} disabled={!writable} onClick={() => setEditItem(b)}>Düzenle</Btn></span>
                          </span>
                        )
                      })()}
                    </Td>
                  </tr>
                )
              })}
              <tr>
                <Td className="bg-[var(--surface-2)]" nowrap><span className="text-[var(--faint)]">+</span></Td>
                <Td className="bg-[var(--surface-2)]"><span className="text-[12px] text-[var(--faint)]">Yeni poz eklemek için tıklayın…</span></Td>
                <Td className="bg-[var(--surface-2)]">{''}</Td>
                <Td className="bg-[var(--surface-2)]">{''}</Td>
                <Td className="bg-[var(--surface-2)]">{''}</Td>
              </tr>
            </Table>
          </Card>
        </div>

        <StickyPane>
        <div className="flex flex-col gap-4">
          <PreviewPane
            title="Metraj kaynağı"
            preview={{
              doc: sel.source,
              page: 1,
              clause: sel.no,
              body: `${sel.description}\n\nMetraj: ${num(sel.qty)} ${sel.unit}\nKaynak: ${sel.source}\nÖlçüm güveni: %${sel.confidence}\n\n${sel.note ?? 'Bu kalemin metrajı çizimden otomatik çıkarılmıştır. Ölçüm güveni %80 ve üzerindeyse teklife doğrudan girebilir.'}`,
            }}
            paper
            height={230}
            footer={
              <div className="flex flex-wrap items-center gap-2">
                <Btn small disabled={!writable}>Metrajı elle düzelt</Btn>
                <Btn small disabled={!writable}>Çizimi aç</Btn>
                <span className="ml-auto text-[11.5px] text-[var(--muted)]">Poz {sel.no}</span>
              </div>
            }
          />

          <Card title="Take-off durumu" help="Çizimlerden metraj çıkarma işinin durumu. Eksik çizimler tamamlanmadan metraj kesinleşmez.">
            <div className="flex flex-col gap-2 text-[12.5px]">
              {[
                { l: 'P-102 Saha genel yerleşim', s: 'Tamamlandı', t: 'ok' as const },
                { l: 'D-204 Kazık planı', s: 'Kısmi — doğu uç eksik', t: 'warn' as const },
                { l: 'D-211 Tabliye kirişleri', s: 'Tamamlandı', t: 'ok' as const },
                { l: 'E-412 RTG besleme', s: 'Bekliyor', t: 'warn' as const },
                { l: 'A-301 Drenaj', s: 'Tamamlandı', t: 'ok' as const },
              ].map((r) => (
                <div key={r.l} className="flex items-center gap-2 border-b border-[var(--border)] pb-2 last:border-0">
                  <span className="mono text-[11.5px] text-[var(--muted)]">{r.l}</span>
                  <span className="ml-auto"><Badge tone={r.t}>{r.s}</Badge></span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Havuz eşleşmesi" help="Poz numarası havuzdaki kayıtla birebir eşleşirse fiyat otomatik gelir. Benzer poz eşleşmesinde fiyat önerilir ama onay gerekir.">
            <div className="flex flex-col gap-2 text-[12.5px]">
              {(['Eşleşti', 'Benzer poz', 'Eşleşmedi'] as const).map((m) => {
                const n = boqItems.filter((b) => b.poolMatch === m).length
                return (
                  <div key={m} className="flex items-center gap-2 border-b border-[var(--border)] pb-2 last:border-0">
                    <span className="text-[var(--ink)]">{m}</span>
                    <span className="ml-auto"><Badge tone={m === 'Eşleşti' ? 'ok' : m === 'Benzer poz' ? 'warn' : 'crit'}>{n} poz</Badge></span>
                  </div>
                )
              })}
              <Btn small onClick={() => onGo('birim_fiyat')}>Birim Fiyat Havuzu'na git →</Btn>
            </div>
          </Card>
        </div>
        </StickyPane>
      </div>

      {editItem && (
        <PriceModal
          item={editItem}
          current={priceOf(editItem)}
          onClose={() => setEditItem(null)}
          onSave={(price, updatePool) => {
            setManual((m) => ({ ...m, [editItem.id]: price }))
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
            <b className="text-[var(--ink)]">Evet:</b> Birim Fiyat Havuzu’ndaki {item.no} pozunun fiyatı güncellenir ve
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
          Havuzdan gelen fiyatlar standart renkte, elle girilenler sarı görünür. Böylece teklif kapanışında
          hangi kalemlerin elle fiyatlandığı bir bakışta ayırt edilir.
        </p>
      </div>
    </Modal>
  )
}
