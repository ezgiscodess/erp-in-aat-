import { useEffect, useMemo, useRef, useState } from 'react'
import { boqItems, unitPrices } from '../data/mock'
import type { TabKey, UnitPrice } from '../data/types'
import { Badge, Btn, Card, ExportButtons, Chips, Dropzone, Empty, IconBtn, Kpi, Modal, PageHead, ReadOnlyNote, RowActions, Search, Table, Td, Th } from '../components/ui'
import { date, num } from '../lib/format'
import { codeFor, methodOf, methods } from '../lib/methods'
import type { MethodKey } from '../lib/methods'

type Filter = 'Tümü' | 'Analiz' | 'BCBS' | 'Piyasa teklifi' | 'Geçmiş proje'

/**
 * Pool = firmanın birim fiyat havuzu. Projeye değil firmaya aittir.
 * Üstte seçilen ölçüm standardı (RICS, CESMM4, Master Method, In-House, Import) Take-Offs'un kod kırılımını
 * ve BOQ'daki fiyat eşleşmesini belirler.
 */
export function BirimFiyatHavuzu({ writable, role, method, onMethod, onGo }: {
  writable: boolean; role: string; method: MethodKey; onMethod: (m: MethodKey) => void; onGo?: (t: TabKey) => void
}) {
  const [imported, setImported] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [analysis, setAnalysis] = useState<UnitPrice | null>(null)
  const m = methodOf(method)
  const [prices, setPrices] = useState<UnitPrice[]>(unitPrices)
  const [filter, setFilter] = useState<Filter>('Tümü')
  const [q, setQ] = useState('')
  const [draft, setDraft] = useState(false)

  const rows = prices.filter((u) => {
    if (filter !== 'Tümü' && u.source !== filter) return false
    if (q.trim()) {
      const s = q.toLocaleLowerCase('tr')
      return [u.no, u.description, u.unit].some((v) => v.toLocaleLowerCase('tr').includes(s))
    }
    return true
  })

  const counts = useMemo(() => {
    const c: Record<string, number> = { 'Tümü': prices.length }
    for (const u of prices) c[u.source] = (c[u.source] ?? 0) + 1
    return c
  }, [prices])

  /** Bu projede kullanılan ama havuzda olmayan pozlar */
  const missing = boqItems.filter((b) => b.poolMatch === 'Eşleşmedi')
  const stale = prices.filter((u) => new Date(u.updatedAt) < new Date('2026-06-01'))

  return (
    <>
      <PageHead
        title="Pool"
        note="Firmanın birim fiyat havuzu ve ölçüm standardı. Havuz projeye değil firmaya aittir: bir kez girilen fiyat bütün ihalelerde kullanılır. Üstte seçilen standart, Take-Offs’taki kod kırılımını ve BOQ’daki fiyat eşleşmesini belirler."
        left={<>
          <MethodPicker method={method} onMethod={onMethod} writable={writable} />
          <IconBtn icon="add" title="Import — firmanın kendi metodunu ya da fiyat listesini yükle" disabled={!writable} onClick={() => setImporting(true)} />
        </>}
        right={<>
          {onGo && <Btn onClick={() => onGo('boq')}>← BOQ</Btn>}
          <ExportButtons />
          <Btn primary disabled={!writable} onClick={() => setDraft((v) => !v)}>+ Birim fiyat ekle</Btn>
        </>}
      />

      {!writable && <ReadOnlyNote role={role} />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Havuzdaki poz" value={prices.length} sub="Tüm projelerde ortak"
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
          <div className="text-[13px] font-semibold" style={{ color: 'var(--crit-ink)' }}>Bu ihalede fiyatı olmayan pozlar</div>
          <ul className="mt-2 flex flex-col gap-1 text-[12.5px]" style={{ color: 'var(--crit-ink)' }}>
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
            <Field required label="Poz no" placeholder="1000458" />
            <Field required label="İş kalemi" placeholder="Yumuşak zeminlerde makineli kazı yapılması" wide />
            <Field required label="Birim" placeholder="m³" />
            <Field required label="Birim fiyat" placeholder="4,85" />
            <Field label="Para birimi" placeholder="EUR" />
            <Field label="Kaynak" placeholder="Analiz" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Btn primary disabled={!writable}>Havuza kaydet</Btn>
            <span className="text-[11.5px] text-[var(--muted)]">Kaydedilen fiyat, metraj listesinde aynı poz numarasına sahip kalemlere otomatik uygulanır.</span>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Chips<Filter> value={filter} onChange={setFilter}
          items={(['Tümü', 'Analiz', 'BCBS', 'Piyasa teklifi', 'Geçmiş proje'] as Filter[])
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
            <Th w={100}>Kod · {m.label}</Th>
            <Th w={320}>İş kalemi</Th>
            <Th w={70}>Birim</Th>
            <Th w={110} right>Birim fiyat</Th>
            <Th w={80}>Para</Th>
            <Th w={130}>Kaynak</Th>
            <Th w={110}>Güncelleme</Th>
            <Th w={90} right>Kullanım</Th>
            <Th w={170} center>İşlem</Th>
          </tr>
        }>
          {rows.length === 0 && (
            <tr><Td className="text-center"><Empty>Bu filtrede kayıt yok.</Empty></Td></tr>
          )}
          {rows.map((u) => (
            <Row key={u.id} u={u} code={(() => { const b = boqItems.find((x) => x.no === u.no); return b ? codeFor(b, method) : u.no })()} writable={writable} onAnalysis={() => setAnalysis(u)} onEdit={() => setDraft(true)}
              onDelete={() => setPrices((l) => l.filter((x) => x.id !== u.id))} />
          ))}
        </Table>
      </Card>

      {importing && (
        <Modal title="Import" note="Firmanın kendi ölçüm metodu ya da birim fiyat listesi yüklenir. AI kod kırılımını ve fiyatları okuyup havuza ekler; çakışan kodlar onaya düşer." onClose={() => setImporting(false)} wide
          footer={<>
            <span className="text-[11.5px] text-[var(--faint)]">{imported.length ? `${imported.length} dosya yüklenecek` : 'Excel, PDF veya CSV'}</span>
            <span className="ml-auto flex gap-2">
              <Btn onClick={() => setImporting(false)}>Vazgeç</Btn>
              <Btn primary disabled={!imported.length} onClick={() => { onMethod('import'); setImporting(false) }}>Yükle ve uygula</Btn>
            </span>
          </>}>
          <Dropzone files={imported} onAdd={(n) => setImported((f) => [...f, ...n])} onRemove={(n) => setImported((f) => f.filter((x) => x !== n))}
            samples={['Firma olcum metodu.xlsx', 'BCBS birim fiyat listesi.xlsx', 'Gecmis proje fiyatlari.csv']}
            hint="Ölçüm metodu (kod kırılımı) ya da birim fiyat listesi" />
        </Modal>
      )}

      {analysis && <AnalysisModal u={analysis} onClose={() => setAnalysis(null)} />}

      <Card title="Havuz nasıl çalışır?" help="Take-Offs, BOQ ve havuz arasındaki bağın kuralları.">
        <ol className="flex list-decimal flex-col gap-1.5 pl-4 text-[12.5px] leading-relaxed text-[var(--muted)]">
          <li>Take-Offs’ta çıkarılan metraj kalemleri seçilen standardın koduyla gelir ve yalnızca <b className="text-[var(--ink)]">poz no, iş kalemi, birim ve miktar</b> içerir; birim fiyat içermez.</li>
          <li>BOQ’da sistem bu kodu havuzda arar. Birebir eşleşme varsa fiyat otomatik gelir.</li>
          <li>Birebir eşleşme yoksa iş kalemi metnine göre <b className="text-[var(--ink)]">benzer poz</b> önerilir; teklif ekibi onaylar.</li>
          <li>Hiç eşleşme yoksa kalem “havuzda yok” olarak işaretlenir ve teklif tamamlanmadan önce fiyatlandırılması istenir.</li>
          <li>Havuz firmaya aittir: bir projede girilen fiyat diğer ihalelerde de kullanılır, fiyat geçmişi tutulur.</li>
        </ol>
      </Card>
    </>
  )
}

function Row({ u, code, writable, onAnalysis, onEdit, onDelete }: { u: UnitPrice; code: string; writable: boolean; onAnalysis: () => void; onEdit: () => void; onDelete: () => void }) {
  const old = new Date(u.updatedAt) < new Date('2026-06-01')
  const tone = u.source === 'BCBS' ? 'neutral' : u.source === 'Analiz' ? 'accent' : u.source === 'Piyasa teklifi' ? 'ok' : 'warn'
  return (
    <tr className="hover:bg-[var(--surface-2)]">
      <Td mono nowrap>{u.no}</Td>
      <Td mono nowrap>{code}</Td>
      <Td><span className="text-[12.5px] text-[var(--ink)]">{u.description}</span></Td>
      <Td nowrap><span className="text-[var(--muted)]">{u.unit}</span></Td>
      <Td right><span className="font-semibold text-[var(--ink)]">{num(u.price, u.price < 100 ? 2 : 0)}</span></Td>
      <Td nowrap><span className="text-[var(--muted)]">{u.currency}</span></Td>
      <Td nowrap><Badge tone={tone}>{u.source}</Badge></Td>
      <Td nowrap>
        <div className="tnum text-[12px] text-[var(--ink)]">{date(u.updatedAt)}</div>
        <div className="text-[11px]" style={{ color: old ? 'var(--warn-ink)' : 'var(--faint)' }}>{old ? 'güncellenmeli' : u.updatedBy}</div>
      </Td>
      <Td right><span className="text-[12px] text-[var(--muted)]">{u.usedIn} proje</span></Td>
      <Td nowrap center>
        <span className="inline-flex items-center gap-1.5">
          <Btn small minW={82} onClick={onAnalysis}>Analizi aç</Btn>
          <RowActions name={`Poz ${u.no}`} disabled={!writable} onEdit={onEdit} onDelete={onDelete} />
        </span>
      </Td>
    </tr>
  )
}

function Field({ label, placeholder, wide, required }: { label: string; placeholder: string; wide?: boolean; required?: boolean }) {
  return (
    <label className={`flex flex-col gap-1.5 ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="text-[12px] font-medium text-[var(--ink)]">
        {label}{required && <span className="ml-0.5 text-[var(--crit-ink)]" aria-label="zorunlu">*</span>}
      </span>
      <input placeholder={placeholder} required={required}
        className="h-10 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-[13px] text-[var(--ink)] outline-none placeholder:text-[var(--faint)]" />
    </label>
  )
}

/**
 * Başlığın yanındaki standart seçici: seçili metodu gösterir, tıklayınca beş seçenek ve
 * seçilenin kod kırılımı açılır.
 */
function MethodPicker({ method, onMethod, writable }: { method: MethodKey; onMethod: (m: MethodKey) => void; writable: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const m = methodOf(method)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border px-2.5 py-1 text-[12.5px] font-semibold transition-colors"
        style={{ borderColor: 'var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)' }}
        title="Ölçüm / birim fiyat standardı">
        {m.label}
        <span className="mono text-[11px] font-normal opacity-70">{m.pattern}</span>
        <span className="text-[9px]">▼</span>
      </button>
      {open && (
        <div className="pop absolute left-0 top-full z-50 mt-1.5 w-[560px] card p-3 shadow-xl">
          <div className="grid grid-cols-5 gap-1.5">
            {methods.map((x) => {
              const on = x.key === method
              return (
                <button key={x.key} disabled={!writable && !on} onClick={() => onMethod(x.key)}
                  className="flex flex-col items-start gap-0.5 rounded-md border px-2 py-2 text-left transition-colors disabled:opacity-60"
                  style={on ? { background: 'var(--accent-soft)', borderColor: 'var(--accent)' } : { background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <span className="text-[12.5px] font-bold" style={{ color: on ? 'var(--accent)' : 'var(--ink)' }}>{x.label}</span>
                  <span className="mono text-[10.5px] text-[var(--muted)]">{x.pattern}</span>
                </button>
              )
            })}
          </div>
          <div className="mt-3 border-t border-[var(--border)] pt-3">
            <div className="text-[12px] font-semibold text-[var(--ink)]">{m.label} — kod kırılımı</div>
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--muted)]">{m.note}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11.5px]">
              {m.levels.map((l, i) => (
                <span key={l} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-[var(--faint)]">→</span>}
                  <span className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 text-[var(--ink)]">{l}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Birim fiyatın dayandığı analiz: malzeme, işçilik, makine ve genel gider kırılımı (örnek oranlar). */
function AnalysisModal({ u, onClose }: { u: UnitPrice; onClose: () => void }) {
  const seed = Number(u.no.slice(-2)) || 7
  const mat = 38 + (seed % 17), lab = 22 + (seed % 9), mach = 14 + (seed % 7)
  const parts = [
    { k: 'Malzeme', p: mat, c: 'var(--series-1)' },
    { k: 'İşçilik', p: lab, c: 'var(--series-2)' },
    { k: 'Makine', p: mach, c: 'var(--series-3)' },
    { k: 'Genel gider + kâr', p: 100 - mat - lab - mach, c: 'var(--border-strong)' },
  ]
  return (
    <Modal title={`Birim fiyat analizi · ${u.no}`} note={`${u.description} · ${num(u.price, u.price < 100 ? 2 : 0)} ${u.currency}/${u.unit}`} onClose={onClose} wide
      footer={<>
        <span className="text-[11.5px] text-[var(--faint)]">Kaynak: {u.source} · {date(u.updatedAt)} · {u.updatedBy}</span>
        <span className="ml-auto flex gap-2"><Btn>Reçeteyi indir</Btn><Btn primary onClick={onClose}>Kapat</Btn></span>
      </>}>
      <div className="flex flex-col gap-3">
        <div className="flex h-3 overflow-hidden rounded-full">
          {parts.map((x) => <span key={x.k} style={{ width: `${x.p}%`, background: x.c }} />)}
        </div>
        <Table head={<tr><Th w={200}>Bileşen</Th><Th w={80} right>Pay</Th><Th w={140} right>Tutar ({u.currency}/{u.unit})</Th></tr>}>
          {parts.map((x) => (
            <tr key={x.k}>
              <Td><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: x.c }} />{x.k}</span></Td>
              <Td right>%{x.p}</Td>
              <Td right>{num((u.price * x.p) / 100, 2)}</Td>
            </tr>
          ))}
        </Table>
      </div>
    </Modal>
  )
}
