import { useMemo, useState } from 'react'
import { boqItems, project } from '../data/mock'
import type { BoqItem, TabKey } from '../data/types'
import { Badge, Btn, Card, Chips, Kpi, PageHead, PreviewPane, ReadOnlyNote, Search, Table, Td, Th } from '../components/ui'
import { num } from '../lib/format'

/**
 * Metraj = ihale dokümanındaki poz listesi ve miktarlar.
 * İhale dokümanında birim fiyat bulunmaz; fiyat, firmanın Birim Fiyat Havuzu'ndan eşleşir.
 */
export function Boq({ writable, role, onGo }: { writable: boolean; role: string; onGo: (t: TabKey) => void }) {
  const [group, setGroup] = useState<string>('Tümü')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<BoqItem>(boqItems[3])

  const groups = useMemo(() => ['Tümü', ...new Set(boqItems.map((b) => b.group))], [])
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
          <Btn disabled={!writable}>Çizimden metraj çıkar</Btn>
          <Btn disabled={!writable}>Excel'den içe aktar</Btn>
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Chips value={group} onChange={setGroup} items={groups.map((g) => ({ key: g, label: g }))} />
            <div className="ml-auto"><Search value={q} onChange={setQ} placeholder="Poz ara…" /></div>
          </div>

          <Card
            title={`Poz listesi (${rows.length})`}
            help="Satıra tıklayınca metrajın çıkarıldığı çizim veya cetvel sağdaki önizlemede açılır. Sarı satırlar düşük ölçüm güvenine sahiptir."
            pad={false}
          >
            <Table head={
              <tr>
                <Th w={80}>Poz no</Th>
                <Th w={250}>İş kalemi</Th>
                <Th w={60}>Birim</Th>
                <Th w={85} right>Metraj</Th>
                <Th w={120}>Metraj kaynağı</Th>
                <Th w={130}>Havuz fiyatı</Th>
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
                      {b.note && <div className="mt-0.5 text-[11px] text-[var(--warn)]">⚠ {b.note}</div>}
                      {low && !b.note && <div className="mt-0.5 text-[11px] text-[var(--warn)]">⚠ Ölçüm güveni %{b.confidence} — elle kontrol edilmeli</div>}
                    </Td>
                    <Td nowrap><span className="text-[var(--muted)]">{b.unit}</span></Td>
                    <Td right>{num(b.qty)}</Td>
                    <Td nowrap><span className="text-[11.5px] text-[var(--muted)]">{b.source}</span></Td>
                    <Td nowrap>
                      {b.unitPrice != null ? (
                        <span className="flex items-center gap-1.5">
                          <span className="tnum text-[12.5px] text-[var(--ink)]">{num(b.unitPrice, b.unitPrice < 100 ? 2 : 0)}</span>
                          <span className="text-[11px] text-[var(--faint)]">{project.currency}</span>
                          {b.poolMatch === 'Benzer poz' && <Badge tone="warn">≈</Badge>}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Badge tone="crit">havuzda yok</Badge>
                          <Btn small disabled={!writable} onClick={() => onGo('birim_fiyat')}>Ekle</Btn>
                        </span>
                      )}
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
                <Td className="bg-[var(--surface-2)]">{''}</Td>
              </tr>
            </Table>
          </Card>
        </div>

        <div className="flex flex-col gap-4 xl:col-span-4">
          <PreviewPane
            title="Metraj kaynağı"
            preview={{
              doc: sel.source,
              page: 1,
              clause: sel.no,
              body: `${sel.description}\n\nMetraj: ${num(sel.qty)} ${sel.unit}\nKaynak: ${sel.source}\nÖlçüm güveni: %${sel.confidence}\n\n${sel.note ?? 'Bu kalemin metrajı çizimden otomatik çıkarılmıştır. Ölçüm güveni %80 ve üzerindeyse teklife doğrudan girebilir.'}`,
            }}
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
      </div>
    </>
  )
}
