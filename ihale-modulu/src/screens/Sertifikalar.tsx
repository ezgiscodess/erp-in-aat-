import { useState } from 'react'
import { certificates } from '../data/mock'
import { AddonBadge, Badge, Btn, Card, Chips, Kpi, PageHead, ReadOnlyNote, Table, Td, Th } from '../components/ui'
import { date, daysLabel } from '../lib/format'

type Filter = 'Tümü' | 'Eksik' | 'Süresi yaklaşan' | 'Geçerli'

/** İhale dosyasında istenen belgeler ile firmanın elindeki belgelerin karşılaştırması. */
export function Sertifikalar({ writable, role }: { writable: boolean; role: string }) {
  const [filter, setFilter] = useState<Filter>('Tümü')

  const missing = certificates.filter((c) => c.required && !c.owned)
  const expiring = certificates.filter((c) => c.owned && c.daysLeft != null && c.daysLeft <= 60)
  const valid = certificates.filter((c) => c.owned && (c.daysLeft == null || c.daysLeft > 60))

  const list = certificates.filter((c) => {
    if (filter === 'Eksik') return c.required && !c.owned
    if (filter === 'Süresi yaklaşan') return c.owned && c.daysLeft != null && c.daysLeft <= 60
    if (filter === 'Geçerli') return c.owned && (c.daysLeft == null || c.daysLeft > 60)
    return true
  })

  return (
    <>
      <PageHead
        title="Sertifikalar"
        note="İhale dokümanında istenen belgeler otomatik çıkarılır ve firmanın belge havuzuyla karşılaştırılır."
        right={<>
          <AddonBadge />
          <Btn>Eksik listesi (PDF)</Btn>
          <Btn primary disabled={!writable}>+ Sertifika Ekle</Btn>
        </>}
      />

      {!writable && <ReadOnlyNote role={role} />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="İstenen belge" value={certificates.filter((c) => c.required).length} sub="İdari Şartname 7. madde" />
        <Kpi label="Mevcut" value={certificates.filter((c) => c.owned).length} sub="Firma belge havuzunda" tone="ok" />
        <Kpi label="Eksik" value={missing.length} sub="Teklif öncesi tamamlanmalı" tone="crit" />
        <Kpi label="Süresi yaklaşan" value={expiring.length} sub="60 günden az kalan" tone="warn" />
        <Kpi label="Dosya hazırlığı" value="%71" sub="Belge klasörü" tone="warn" />
      </div>

      {(missing.length > 0 || expiring.length > 0) && (
        <div className="rounded-lg border p-3" style={{ background: 'var(--crit-bg)', borderColor: 'var(--crit)' }}>
          <div className="text-[13px] font-semibold" style={{ color: 'var(--crit)' }}>Teklif teslimini riske atan belgeler</div>
          <ul className="mt-2 flex flex-col gap-1 text-[12.5px]" style={{ color: 'var(--crit)' }}>
            {missing.slice(0, 3).map((c) => <li key={c.id}>• <b>{c.name}</b> — {c.note}</li>)}
            {expiring.map((c) => <li key={c.id}>• <b>{c.name}</b> — geçerlilik {date(c.validUntil!)} ({daysLabel(c.daysLeft!)})</li>)}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Chips<Filter> value={filter} onChange={setFilter} items={[
          { key: 'Tümü', label: 'Tümü', count: certificates.length },
          { key: 'Eksik', label: 'Eksik', count: missing.length },
          { key: 'Süresi yaklaşan', label: 'Süresi yaklaşan', count: expiring.length },
          { key: 'Geçerli', label: 'Geçerli', count: valid.length },
        ]} />
      </div>

      <Card title={`Belgeler (${list.length})`} help="Kırmızı satırlar teklif dosyasını eksik bırakan belgelerdir. Sarı satırların geçerlilik süresi teklif tarihinden önce dolar." pad={false}>
        <Table head={
          <tr>
            <Th w={280}>Belge</Th>
            <Th w={80}>İstenen</Th>
            <Th w={90}>Durum</Th>
            <Th w={130}>Belge no</Th>
            <Th w={120}>Geçerlilik</Th>
            <Th w={220}>Açıklama</Th>
            <Th w={110}>İşlem</Th>
          </tr>
        }>
          {list.map((c) => {
            const isMissing = c.required && !c.owned
            const isExpiring = c.owned && c.daysLeft != null && c.daysLeft <= 60
            return (
              <tr key={c.id} className="hover:bg-[var(--surface-2)]"
                style={isMissing
                  ? { background: 'color-mix(in srgb, var(--crit-bg) 50%, transparent)' }
                  : isExpiring ? { background: 'color-mix(in srgb, var(--warn-bg) 45%, transparent)' } : undefined}>
                <Td><span className="text-[12.5px] font-medium text-[var(--ink)]">{c.name}</span></Td>
                <Td nowrap>{c.required ? <Badge tone="neutral">Zorunlu</Badge> : <span className="text-[var(--faint)]">Opsiyonel</span>}</Td>
                <Td nowrap>{c.owned ? <Badge tone="ok" dot>Var</Badge> : <Badge tone="crit" dot>Yok</Badge>}</Td>
                <Td mono nowrap>{c.number ?? '—'}</Td>
                <Td nowrap>
                  {c.validUntil && c.validUntil !== '—' ? (
                    <div>
                      <div className="tnum text-[12.5px] text-[var(--ink)]">{date(c.validUntil)}</div>
                      {c.daysLeft != null && (
                        <div className="text-[11px]" style={{ color: c.daysLeft <= 60 ? 'var(--warn)' : 'var(--faint)' }}>{daysLabel(c.daysLeft)}</div>
                      )}
                    </div>
                  ) : <span className="text-[var(--faint)]">—</span>}
                </Td>
                <Td><span className="text-[12px] text-[var(--muted)]">{c.note}</span></Td>
                <Td nowrap>
                  <span className="flex gap-1.5">
                    {c.owned ? <Btn small>Görüntüle</Btn> : <Btn small primary disabled={!writable}>Yükle</Btn>}
                  </span>
                </Td>
              </tr>
            )
          })}
        </Table>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Belge takvimi" help="Geçerlilik süresi yaklaşan belgeler. Proje dönemine geçildiğinde bu tarihler için otomatik hatırlatma kurulur.">
          <div className="flex flex-col gap-2 text-[12.5px]">
            {certificates.filter((c) => c.daysLeft != null).sort((a, b) => a.daysLeft! - b.daysLeft!).slice(0, 6).map((c) => (
              <div key={c.id} className="flex items-center gap-2 border-b border-[var(--border)] pb-2 last:border-0">
                <span className="text-[var(--ink)]">{c.name}</span>
                <span className="ml-auto tnum text-[var(--muted)]">{date(c.validUntil!)}</span>
                <Badge tone={c.daysLeft! <= 60 ? 'warn' : 'ok'}>{daysLabel(c.daysLeft!)}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Nasıl çalışıyor?" help="Sertifika listesi ihale dokümanından otomatik çıkarılır; firma belge havuzuyla karşılaştırılır.">
          <ol className="flex list-decimal flex-col gap-2 pl-4 text-[12.5px] leading-relaxed text-[var(--muted)]">
            <li>İdari şartnamedeki “istenen belgeler” maddesi AI ile çıkarılır ve bu listeye düşer.</li>
            <li>Liste, firmanın belge havuzuyla eşleştirilir; eksikler ve süresi dolanlar kırmızı işaretlenir.</li>
            <li>Alt yüklenici veya iş ortağından gelecek belgeler ayrı işaretlenir (ör. EN 1090, ISO 3834).</li>
            <li>Proje dönemine geçildiğinde belge geçerlilikleri otomatik izlenir; süresi dolmadan önce uyarı gider.</li>
          </ol>
        </Card>
      </div>
    </>
  )
}
