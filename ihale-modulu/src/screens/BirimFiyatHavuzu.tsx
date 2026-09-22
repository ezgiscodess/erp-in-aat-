import { useMemo, useState } from 'react'
import { boqItems, unitPrices } from '../data/mock'
import type { UnitPrice } from '../data/types'
import { Badge, Btn, Card, ExportButtons, Chips, Empty, Kpi, PageHead, ReadOnlyNote, Search, Table, Td, Th } from '../components/ui'
import { date, num } from '../lib/format'

type Filter = 'Tümü' | 'Kendi analizimiz' | 'BCBS' | 'Piyasa teklifi' | 'Geçmiş proje'

/**
 * Firmanın kendi birim fiyat havuzu. Projeye değil firmaya aittir; arka planda çalışır ve
 * metraj kalemleri poz numarası ile buradan fiyatlanır.
 */
export function BirimFiyatHavuzu({ writable, role }: { writable: boolean; role: string }) {
  const [filter, setFilter] = useState<Filter>('Tümü')
  const [q, setQ] = useState('')
  const [draft, setDraft] = useState(false)

  const rows = unitPrices.filter((u) => {
    if (filter !== 'Tümü' && u.source !== filter) return false
    if (q.trim()) {
      const s = q.toLocaleLowerCase('tr')
      return [u.no, u.description, u.unit].some((v) => v.toLocaleLowerCase('tr').includes(s))
    }
    return true
  })

  const counts = useMemo(() => {
    const c: Record<string, number> = { 'Tümü': unitPrices.length }
    for (const u of unitPrices) c[u.source] = (c[u.source] ?? 0) + 1
    return c
  }, [])

  /** Bu projede kullanılan ama havuzda olmayan pozlar */
  const missing = boqItems.filter((b) => b.poolMatch === 'Eşleşmedi')
  const stale = unitPrices.filter((u) => new Date(u.updatedAt) < new Date('2026-06-01'))

  return (
    <>
      <PageHead
        title="Birim Fiyat Havuzu"
        note="Firmanın kendi poz numarası ve iş kalemi bazlı fiyat havuzu. Bu havuz projeye değil firmaya aittir: bir kez girilen fiyat bütün ihalelerde kullanılır. İhale dokümanındaki metraj kalemleri poz numarası ile buradan fiyatlanır."
        right={<>
          <Btn disabled={!writable}>BCBS Excel'i içe aktar</Btn>
          <ExportButtons />
          <Btn primary disabled={!writable} onClick={() => setDraft((v) => !v)}>+ Birim fiyat ekle</Btn>
        </>}
      />

      {!writable && <ReadOnlyNote role={role} />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Havuzdaki poz" value={unitPrices.length} sub="Tüm projelerde ortak"
          help="Firmanın tanımladığı toplam iş kalemi sayısı. Kaynağı kendi analizimiz, BCBS, piyasa teklifi veya geçmiş proje olabilir." />
        <Kpi label="Bu projede eksik" value={missing.length} sub="Metrajda var, havuzda yok" tone="crit"
          help="Bu ihalenin metraj listesinde olup havuzda karşılığı bulunmayan pozlar. Teklif öncesi fiyatlandırılmalı." />
        <Kpi label="Güncellenmeli" value={stale.length} sub="3 aydan eski fiyat" tone="warn"
          help="Uzun süredir güncellenmemiş fiyatlar. Malzeme fiyatları değiştiğinde teklif yanlış çıkar." />
        <Kpi label="En çok kullanılan" value="1000520" sub="Betonarme imalat · 11 projede"
          help="Havuzdaki en sık kullanılan poz. Bu kalemlerin fiyat doğruluğu en kritik olanlardır." />
      </div>

      {missing.length > 0 && (
        <div className="rounded-lg border p-3" style={{ background: 'var(--crit-bg)', borderColor: 'var(--crit)' }}>
          <div className="text-[13px] font-semibold" style={{ color: 'var(--crit)' }}>Bu ihalede fiyatı olmayan pozlar</div>
          <ul className="mt-2 flex flex-col gap-1 text-[12.5px]" style={{ color: 'var(--crit)' }}>
            {missing.map((b) => (
              <li key={b.id} className="flex items-center gap-2">
                <span className="mono">{b.no}</span>
                <span>{b.description}</span>
                <span className="ml-auto"><Btn small disabled={!writable} onClick={() => setDraft(true)}>Havuza ekle</Btn></span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {draft && (
        <Card title="Yeni birim fiyat" help="Poz numarası, iş kalemi ve birim havuzun anahtarıdır. Aynı poz numarası ikinci kez girilemez; yeni fiyat sürüm olarak eklenir." right={<Btn small onClick={() => setDraft(false)}>Kapat</Btn>}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
            <Field label="Poz no" placeholder="1000458" />
            <Field label="İş kalemi" placeholder="Yumuşak zeminlerde makineli kazı yapılması" wide />
            <Field label="Birim" placeholder="m³" />
            <Field label="Birim fiyat" placeholder="4,85" />
            <Field label="Para birimi" placeholder="EUR" />
            <Field label="Kaynak" placeholder="Kendi analizimiz" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Btn primary disabled={!writable}>Havuza kaydet</Btn>
            <span className="text-[11.5px] text-[var(--muted)]">Kaydedilen fiyat, metraj listesinde aynı poz numarasına sahip kalemlere otomatik uygulanır.</span>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Chips<Filter> value={filter} onChange={setFilter}
          items={(['Tümü', 'Kendi analizimiz', 'BCBS', 'Piyasa teklifi', 'Geçmiş proje'] as Filter[])
            .map((k) => ({ key: k, label: k, count: counts[k] ?? 0 }))} />
        <div className="ml-auto"><Search value={q} onChange={setQ} placeholder="Poz no veya iş kalemi ara…" /></div>
      </div>

      <Card
        title={`Birim fiyatlar (${rows.length})`}
        help="Kaynak sütunu fiyatın nereden geldiğini gösterir. BCBS satırları toplu içe aktarma ile gelir ve elle değiştirilirse 'kendi analizimiz' olarak işaretlenir."
        pad={false}
      >
        <Table head={
          <tr>
            <Th w={90}>Poz no</Th>
            <Th w={320}>İş kalemi</Th>
            <Th w={70}>Birim</Th>
            <Th w={110} right>Birim fiyat</Th>
            <Th w={80}>Para</Th>
            <Th w={130}>Kaynak</Th>
            <Th w={110}>Güncelleme</Th>
            <Th w={90} right>Kullanım</Th>
            <Th w={90}>İşlem</Th>
          </tr>
        }>
          {rows.length === 0 && (
            <tr><Td className="text-center"><Empty>Bu filtrede kayıt yok.</Empty></Td></tr>
          )}
          {rows.map((u) => <Row key={u.id} u={u} writable={writable} />)}
        </Table>
      </Card>

      <Card title="Havuz nasıl çalışır?" help="Metraj ile havuz arasındaki bağın kuralları.">
        <ol className="flex list-decimal flex-col gap-1.5 pl-4 text-[12.5px] leading-relaxed text-[var(--muted)]">
          <li>İhale dokümanından çıkarılan metraj kalemleri yalnızca <b className="text-[var(--ink)]">poz no, iş kalemi, birim ve miktar</b> içerir; birim fiyat içermez.</li>
          <li>Sistem, poz numarasını havuzda arar. Birebir eşleşme varsa fiyat otomatik gelir.</li>
          <li>Birebir eşleşme yoksa iş kalemi metnine göre <b className="text-[var(--ink)]">benzer poz</b> önerilir; teklif ekibi onaylar.</li>
          <li>Hiç eşleşme yoksa kalem “havuzda yok” olarak işaretlenir ve teklif tamamlanmadan önce fiyatlandırılması istenir.</li>
          <li>Havuz firmaya aittir: bir projede girilen fiyat diğer ihalelerde de kullanılır, fiyat geçmişi tutulur.</li>
        </ol>
      </Card>
    </>
  )
}

function Row({ u, writable }: { u: UnitPrice; writable: boolean }) {
  const old = new Date(u.updatedAt) < new Date('2026-06-01')
  const tone = u.source === 'BCBS' ? 'neutral' : u.source === 'Kendi analizimiz' ? 'accent' : u.source === 'Piyasa teklifi' ? 'ok' : 'warn'
  return (
    <tr className="hover:bg-[var(--surface-2)]">
      <Td mono nowrap>{u.no}</Td>
      <Td><span className="text-[12.5px] text-[var(--ink)]">{u.description}</span></Td>
      <Td nowrap><span className="text-[var(--muted)]">{u.unit}</span></Td>
      <Td right><span className="font-semibold text-[var(--ink)]">{num(u.price, u.price < 100 ? 2 : 0)}</span></Td>
      <Td nowrap><span className="text-[var(--muted)]">{u.currency}</span></Td>
      <Td nowrap><Badge tone={tone}>{u.source}</Badge></Td>
      <Td nowrap>
        <div className="tnum text-[12px] text-[var(--ink)]">{date(u.updatedAt)}</div>
        <div className="text-[11px]" style={{ color: old ? 'var(--warn)' : 'var(--faint)' }}>{old ? 'güncellenmeli' : u.updatedBy}</div>
      </Td>
      <Td right><span className="text-[12px] text-[var(--muted)]">{u.usedIn} proje</span></Td>
      <Td nowrap><Btn small disabled={!writable}>✎ Düzenle</Btn></Td>
    </tr>
  )
}

function Field({ label, placeholder, wide }: { label: string; placeholder: string; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">{label}</div>
      <input placeholder={placeholder}
        className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-[12.5px] text-[var(--ink)] outline-none placeholder:text-[var(--faint)] focus:border-[var(--accent)]" />
    </div>
  )
}
