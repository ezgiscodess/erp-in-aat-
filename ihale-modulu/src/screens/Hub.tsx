import { useState } from 'react'
import { library, project } from '../data/mock'
import type { LibraryItem, Period } from '../data/types'
import { Badge, Bar, Btn, Chips, ColumnFilter, Field, Modal, RowActions, Search, StateBadge, Table, Td, Th } from '../components/ui'
import { date, daysLabel, moneyShort } from '../lib/format'
import { personaOf } from '../lib/roles'
import type { Persona } from '../lib/roles'

type Filter = 'Tümü' | 'İhaleler' | 'Projeler'

/** Liste görünümündeki sütun filtreleri — her sütun kendi değer grubuna göre süzülür. */
type ColKey = 'tur' | 'kod' | 'is' | 'tarih' | 'bedel' | 'dosya' | 'ilerleme' | 'durum'

const COL_VALUES: Record<ColKey, (i: LibraryItem) => string> = {
  tur: (i) => (i.kind === 'ihale' ? 'İhale' : 'Proje'),
  kod: (i) => i.code.split('-')[1] ?? '—',
  is: (i) => i.employer,
  tarih: (i) => (i.daysLeft < 0 ? 'Geçmiş' : i.daysLeft <= 30 ? '30 gün içinde' : '30 günden sonra'),
  bedel: (i) => (i.value < 30e6 ? '30 M altı' : i.value <= 60e6 ? '30–60 M' : '60 M üstü'),
  dosya: (i) => (i.docCount < 10 ? '0–9 dosya' : i.docCount < 20 ? '10–19 dosya' : '20+ dosya'),
  ilerleme: (i) => (i.progress >= 100 ? '%100' : i.progress >= 50 ? '%50–99' : '%50 altı'),
  durum: (i) => i.status,
}

const NO_FILTER: Record<ColKey, string> = {
  tur: 'Tümü', kod: 'Tümü', is: 'Tümü', tarih: 'Tümü', bedel: 'Tümü', dosya: 'Tümü', ilerleme: 'Tümü', durum: 'Tümü',
}

/**
 * Giriş sonrası ara sayfa: şirkete yüklenmiş ihale ve projeler.
 * Buradan bir iş açılır ya da "Yükle" ile yeni bir ihale/proje dosyası eklenir.
 */
export function Hub({ persona, onOpen, onLogout }: { persona: Persona; onOpen: (item: LibraryItem) => void; onLogout: () => void }) {
  const [filter, setFilter] = useState<Filter>('Tümü')
  const [view, setView] = useState<'kare' | 'sirali'>('kare')
  const [q, setQ] = useState('')
  /** Her giriş tipi yalnızca kendi işlerini görür; patron hepsini görür */
  const [items, setItems] = useState<LibraryItem[]>(
    library.filter((i) => persona === 'patron' || (persona === 'ihale' ? i.kind === 'ihale' : i.kind === 'proje')),
  )
  const [uploading, setUploading] = useState(false)
  const [justAdded, setJustAdded] = useState<string | null>(null)
  const [cols, setCols] = useState<Record<ColKey, string>>(NO_FILTER)

  const tenders = items.filter((i) => i.kind === 'ihale')
  const projects = items.filter((i) => i.kind === 'proje')

  const list = items.filter((i) => {
    if (filter === 'İhaleler' && i.kind !== 'ihale') return false
    if (filter === 'Projeler' && i.kind !== 'proje') return false
    if ((Object.keys(cols) as ColKey[]).some((k) => cols[k] !== 'Tümü' && COL_VALUES[k](i) !== cols[k])) return false
    if (q.trim()) {
      const s = q.toLocaleLowerCase('tr')
      return [i.code, i.name, i.employer, i.location].some((v) => v.toLocaleLowerCase('tr').includes(s))
    }
    return true
  })

  /** Teklif tarihi en yakın olan açık ihale */
  const nearest = tenders.filter((t) => t.daysLeft >= 0).sort((a, b) => a.daysLeft - b.daysLeft)[0]

  /** Sütun başlığı + o sütunun filtresi */
  function head(k: ColKey, label: string) {
    return (
      <span className="flex items-center gap-1.5">
        {label}
        <ColumnFilter value={cols[k]} onChange={(v) => setCols((c) => ({ ...c, [k]: v }))}
          values={[...new Set(items.map(COL_VALUES[k]))]} />
      </span>
    )
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function addItem(item: LibraryItem) {
    setItems((prev) => [item, ...prev])
    setJustAdded(item.id)
    setUploading(false)
  }

  return (
    <div className="min-h-screen bg-[var(--surface-2)]">
      {/* Üst şerit */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-6 py-2.5">
        <span className="grid h-6 w-6 place-items-center rounded-md text-[12px] font-extrabold text-white" style={{ background: 'var(--accent)' }}>İK</span>
        <span className="text-[13.5px] font-bold tracking-tight text-[var(--ink)]">İnşaat ERP</span>
        <span className="text-[11.5px] text-[var(--muted)]">{project.company}</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[12px] text-[var(--muted)]">e.yilmaz</span>
          <Badge tone="accent">{personaOf(persona).label}</Badge>
          <Btn small onClick={onLogout}>Çıkış</Btn>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1400px] flex-col gap-5 px-6 pb-16 pt-6">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <h1 className="text-[19px] font-bold tracking-tight text-[var(--ink)]">
              {persona === 'ihale' ? 'İhaleler' : persona === 'proje' ? 'Projeler' : 'Portföy'}
            </h1>
            <p className="mt-1 text-[12.5px] text-[var(--muted)]">
              {persona === 'ihale' && 'Teklif hazırlanan ihaleler. Çalışmak istediğiniz ihaleyi açın ya da yeni ihale dosyası yükleyin.'}
              {persona === 'proje' && 'Yürüyen projeler. Çalışmak istediğiniz projeyi açın; saha verisi, planlama ve raporlar proje içinde.'}
              {persona === 'patron' && 'Bütün ihale ve projeler tek ekranda. Dikkat isteyen konular en üstte; işe tıklayınca ayrıntısı açılır.'}
              {' '}Her işin verisi kendi alanında durur; diğer işlerden yalıtılmıştır.
            </p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Search value={q} onChange={setQ} placeholder="İş adı, işveren, kod…" />
            <Btn primary onClick={() => setUploading(true)}>+ Yükle</Btn>
          </div>
        </div>

        {/* Özet şerit — giriş tipine göre */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {persona !== 'proje' && (
            <Summary label="Devam eden ihaleler" value={tenders.filter((t) => t.daysLeft >= 0).length}
              sub={nearest ? `En yakını ${nearest.code} · ${daysLabel(nearest.daysLeft)}` : 'Devam eden ihale yok'} tone="accent" />
          )}
          {persona === 'ihale' && <>
            <Summary label="Hazırlanan teklif bedeli" value={moneyShort(tenders.filter((t) => t.daysLeft >= 0).reduce((a, t) => a + t.value, 0))} sub="Devam eden ihalelerin yaklaşık bedeli" tone="neutral" />
            <Summary label="Kazanılan / kaybedilen" value={`${tenders.filter((t) => t.status === 'Kazanıldı').length} / ${tenders.filter((t) => t.status === 'Kaybedildi').length}`} sub="Sonuçlanan ihaleler" tone="neutral" />
          </>}
          {persona !== 'ihale' && (
            <Summary label="Devam eden projeler" value={projects.length} sub={`Toplam sözleşme ${moneyShort(projects.reduce((a, p) => a + p.value, 0))}`} tone="ok" />
          )}
          {persona === 'proje' && <>
            <Summary label="Ortalama ilerleme" value={`%${Math.round(projects.reduce((a, p) => a + p.progress, 0) / (projects.length || 1))}`} sub="Fiziksel ilerleme" tone="accent" />
            <Summary label="En yakın bitiş" value={projects.length ? date([...projects].sort((a, b) => a.daysLeft - b.daysLeft)[0].dueAt) : '—'} sub={projects.length ? [...projects].sort((a, b) => a.daysLeft - b.daysLeft)[0].name : ''} tone="neutral" />
          </>}
          {persona === 'patron' && (
            <Summary label="Portföy" value={moneyShort(items.reduce((a, i) => a + i.value, 0))} sub={`${tenders.length} ihale + ${projects.length} proje`} tone="neutral" />
          )}
        </div>

        {persona === 'patron' && <Attention items={items} onOpen={onOpen} />}

        <div className="flex flex-wrap items-center gap-2">
          {persona === 'patron' && (
            <Chips<Filter> value={filter} onChange={setFilter} items={[
              { key: 'Tümü', label: 'Tümü', count: items.length },
              { key: 'İhaleler', label: 'İhaleler', count: tenders.length },
              { key: 'Projeler', label: 'Projeler', count: projects.length },
            ]} />
          )}

          {/* Görünüm seçici: kare ızgara / sıralı liste */}
          <div className="ml-auto flex overflow-hidden rounded-md border border-[var(--border)]">
            {([['kare', '▦', 'Kare ızgara'], ['sirali', '☰', 'Sıralı liste']] as const).map(([k, icon, label]) => (
              <button key={k} onClick={() => setView(k)} title={label} aria-label={label}
                className="px-2.5 py-1 text-[13px] leading-none transition-colors"
                style={view === k
                  ? { background: 'var(--accent)', color: '#fff' }
                  : { background: 'var(--surface)', color: 'var(--muted)' }}>
                {icon}
              </button>
            ))}
          </div>
        </div>

        {view === 'kare' ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {list.map((i) => (
              <ItemCard key={i.id} item={i} fresh={i.id === justAdded} onOpen={() => onOpen(i)} onDelete={() => removeItem(i.id)} />
            ))}
            <button onClick={() => setUploading(true)}
              className="flex min-h-[188px] flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-[var(--border-strong)] bg-[var(--surface)] text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]">
              <span className="text-[22px]">＋</span>
              <span className="text-[13px] font-semibold">{persona === 'ihale' ? 'Yeni ihale ekle' : persona === 'proje' ? 'Yeni proje ekle' : 'Yeni ihale / proje ekle'}</span>
              <span className="text-[11.5px] text-[var(--faint)]">Şartname, sözleşme, cetvel ve çizimler</span>
            </button>
          </div>
        ) : (
          <Table head={
            <tr>
              <Th w={64}>{head('tur', 'Tür')}</Th>
              <Th w={110}>{head('kod', 'Kod')}</Th>
              <Th w={300}>{head('is', 'İş')}</Th>
              <Th w={120}>{head('tarih', 'Tarih')}</Th>
              <Th w={100}>{head('bedel', 'Bedel')}</Th>
              <Th w={60}>{head('dosya', 'Dosya')}</Th>
              <Th w={130}>{head('ilerleme', 'İlerleme')}</Th>
              <Th w={110}>{head('durum', 'Durum')}</Th>
              <Th w={96} center>İşlem</Th>
            </tr>
          }>
            {list.map((i) => (
              <tr key={i.id} className="cursor-pointer hover:bg-[var(--surface-2)]" onClick={() => onOpen(i)}
                style={i.id === justAdded ? { background: 'var(--accent-soft)' } : undefined}>
                <Td nowrap><Badge tone={i.kind === 'ihale' ? 'accent' : 'ok'}>{i.kind === 'ihale' ? 'İhale' : 'Proje'}</Badge></Td>
                <Td mono nowrap>{i.code}</Td>
                <Td>
                  <div className="text-[12.5px] font-medium text-[var(--ink)]">{i.name}</div>
                  <div className="text-[11px] text-[var(--muted)]">{i.employer} · {i.location}</div>
                </Td>
                <Td nowrap>
                  <div className="tnum text-[12px] text-[var(--ink)]">{date(i.dueAt)}</div>
                  <div className="text-[11px] text-[var(--faint)]">{daysLabel(i.daysLeft)}</div>
                </Td>
                <Td right>{moneyShort(i.value, i.currency)}</Td>
                <Td right>{i.docCount}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="w-16"><Bar value={i.progress} tone={i.progress >= 80 ? 'ok' : i.progress >= 40 ? 'accent' : 'warn'} /></div>
                    <span className="tnum text-[11.5px] text-[var(--muted)]">%{i.progress}</span>
                  </div>
                </Td>
                <Td nowrap><StateBadge value={i.status} /></Td>
                <Td nowrap center>
                  <span className="inline-flex items-center gap-1.5">
                    <Btn small primary onClick={() => onOpen(i)}>Aç</Btn>
                    <RowActions name={i.name} onDelete={() => removeItem(i.id)} />
                  </span>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </main>

      {uploading && <UploadModal fixedKind={persona === 'patron' ? undefined : persona === 'ihale' ? 'ihale' : 'proje'} onClose={() => setUploading(false)} onDone={addItem} />}
    </div>
  )
}

/**
 * Patronun ekranında en üstte duran, bütün işlerden toplanan dikkat listesi.
 * Gerçek sistemde her işin uyarıları (bildirim süreleri, kontrat farkları, kararlar) buraya düşer.
 */
function Attention({ items, onOpen }: { items: LibraryItem[]; onOpen: (i: LibraryItem) => void }) {
  const find = (code: string) => items.find((i) => i.code === code)
  type Row = { code: string; tone: 'crit' | 'warn' | 'accent'; title: string; body: string }
  const all: Row[] = [
    { code: 'TND-2026-014', tone: 'accent', title: 'Go / No-Go kararı 2 Ekim’de', body: 'Skor 59,9 · Şartlı GO önerisi · teklife 24 gün' },
    { code: 'PRJ-2024-008', tone: 'crit', title: 'Hak talebi bildirim süresi 10 gün', body: 'CL-03 elektrik bağlantı izni · son gün 06 Eki 2026' },
    { code: 'PRJ-2024-008', tone: 'warn', title: 'Bitiş öngörüsü 35 gün geride', body: 'SPI 0,92 · kritik yol: Depo C çatı çelik montajı' },
    { code: 'PRJ-2024-008', tone: 'warn', title: 'Taşeron kontratında 3 kalem fark', body: 'Ana kontrata göre +205 B EUR (tuğla duvar, çelik, panel)' },
  ]
  const rows = all.filter((r) => find(r.code))
  if (!rows.length) return null
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border)] px-4 py-2.5 text-[13.5px] font-semibold text-[var(--ink)]">Dikkat isteyen konular ({rows.length})</div>
      <div className="grid grid-cols-1 md:grid-cols-2">
        {rows.map((r, i) => (
          <button key={i} onClick={() => onOpen(find(r.code)!)}
            className="flex gap-2.5 border-b border-[var(--border)] px-4 py-2.5 text-left hover:bg-[var(--surface-2)] md:[&:nth-child(odd)]:border-r">
            <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" style={{ background: `var(--${r.tone})` }} />
            <span className="min-w-0">
              <span className="block text-[12.5px] font-semibold text-[var(--ink)]">{r.title}</span>
              <span className="block text-[11.5px] text-[var(--muted)]"><span className="mono">{r.code}</span> · {r.body}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function Summary({ label, value, sub, tone }: { label: string; value: number | string; sub: string; tone: 'accent' | 'ok' | 'neutral' }) {
  const fg = tone === 'accent' ? 'var(--accent)' : tone === 'ok' ? 'var(--ok)' : 'var(--ink)'
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">{label}</div>
      <div className="mt-0.5 text-[22px] font-bold leading-tight tnum" style={{ color: fg }}>{value}</div>
      <div className="mt-0.5 text-[11.5px] text-[var(--muted)]">{sub}</div>
    </div>
  )
}

function ItemCard({ item, fresh, onOpen, onDelete }: { item: LibraryItem; fresh: boolean; onOpen: () => void; onDelete: () => void }) {
  const urgent = item.kind === 'ihale' && item.daysLeft >= 0 && item.daysLeft <= 30
  return (
    <article
      className="flex flex-col gap-3 rounded-lg border bg-[var(--surface)] p-4 transition-shadow hover:shadow-md"
      style={{ borderColor: fresh ? 'var(--accent)' : 'var(--border)' }}
    >
      <div className="flex items-center gap-2">
        <Badge tone={item.kind === 'ihale' ? 'accent' : 'ok'}>{item.kind === 'ihale' ? 'İhale' : 'Proje'}</Badge>
        <span className="mono text-[11.5px] text-[var(--muted)]">{item.code}</span>
        {fresh && <Badge tone="warn" dot>yeni yüklendi</Badge>}
        <span className="ml-auto"><StateBadge value={item.status} /></span>
      </div>

      <div className="min-h-[58px]">
        <h3 className="text-[13.5px] font-semibold leading-snug text-[var(--ink)]">{item.name}</h3>
        <p className="mt-1 text-[11.5px] text-[var(--muted)]">{item.employer} · {item.location}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[11.5px]">
        <Cell label={item.kind === 'ihale' ? 'Teklif' : 'Bitiş'} value={date(item.dueAt)}
          tone={urgent ? 'var(--warn)' : undefined} sub={daysLabel(item.daysLeft)} />
        <Cell label="Bedel" value={moneyShort(item.value, item.currency)} />
        <Cell label="Doküman" value={`${item.docCount}`} sub="dosya" />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-[11px] text-[var(--muted)]">
          <span>{item.kind === 'ihale' ? 'Teklif hazırlığı' : 'Fiziksel ilerleme'}</span>
          <span className="tnum">%{item.progress}</span>
        </div>
        <Bar value={item.progress} tone={item.progress >= 80 ? 'ok' : item.progress >= 40 ? 'accent' : 'warn'} />
      </div>

      <div className="flex items-center gap-2 border-t border-[var(--border)] pt-3">
        <span className="text-[11px] text-[var(--faint)]">Son işlem {item.updatedAt} · {item.updatedBy}</span>
        <span className="ml-auto flex items-center gap-1.5">
          <Btn small primary onClick={onOpen}>Aç</Btn>
          <RowActions name={item.name} onDelete={onDelete} />
        </span>
      </div>
    </article>
  )
}

function Cell({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--faint)]">{label}</div>
      <div className="mt-0.5 truncate text-[12px] font-semibold tnum" style={{ color: tone ?? 'var(--ink)' }}>{value}</div>
      {sub && <div className="truncate text-[10.5px] text-[var(--faint)]">{sub}</div>}
    </div>
  )
}

/* ---------------- Ekleme penceresi ---------------- */

/**
 * Yeni ihale / proje kaydı. Dosya burada yüklenmez:
 * kayıt oluşturulup açıldıktan sonra Doküman Analiz sekmesinde yükleme ve analiz yapılır.
 */
function UploadModal({ fixedKind, onClose, onDone }: { fixedKind?: Period; onClose: () => void; onDone: (item: LibraryItem) => void }) {
  const [kind, setKind] = useState<Period>(fixedKind ?? 'ihale')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [due, setDue] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [warranty, setWarranty] = useState('730')

  const ready = name.trim().length > 2 && code.trim().length > 2

  function submit() {
    if (!ready) return
    onDone({
      id: code.trim(),
      kind,
      code: code.trim(),
      name: name.trim(),
      employer: 'Doküman analizinden gelecek',
      location: '—',
      dueAt: due || '2026-12-31',
      daysLeft: 60,
      value: 0,
      currency,
      status: 'Doküman bekleniyor',
      warrantyDays: Number(warranty) || 0,
      docCount: 0,
      progress: 0,
      updatedAt: 'şimdi',
      updatedBy: 'e.yilmaz',
    })
  }

  return (
    <Modal
      title="İhale / proje ekle"
      note="Türü seçip işin künyesini girin. Kayıt oluşunca iş açılır; dokümanlar Doküman Analiz sekmesinden yüklenir ve orada analiz edilir."
      onClose={onClose}
      wide
      footer={<>
        <span className="text-[11.5px] text-[var(--faint)]">
          {ready ? 'Kayıt oluşturulmaya hazır' : 'İşin adı ve takip kodu zorunlu'}
        </span>
        <span className="ml-auto flex gap-2">
          <Btn onClick={onClose}>Vazgeç</Btn>
          <Btn primary disabled={!ready} onClick={submit}>Oluştur</Btn>
        </span>
      </>}
    >
      <div className="flex flex-col gap-4">
        {/* Tür seçimi — yalnızca patron ikisini de ekleyebilir */}
        {!fixedKind && (<>
        <div>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Ne ekliyorsunuz?</div>
          <div className="grid grid-cols-2 gap-2">
            {([
              { k: 'ihale' as Period, t: 'İhale', d: 'Teklif aşamasındaki iş — şartname, sözleşme tasarısı, cetvel, çizim' },
              { k: 'proje' as Period, t: 'Proje', d: 'Sözleşmesi imzalanmış, yürüyen iş — sözleşme eki ve uygulama dosyaları' },
            ]).map((o) => {
              const on = kind === o.k
              return (
                <button key={o.k} onClick={() => setKind(o.k)}
                  className="rounded-lg border p-3 text-left transition-colors"
                  style={on
                    ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)' }
                    : { borderColor: 'var(--border)', background: 'var(--surface)' }}>
                  <div className="text-[13px] font-semibold" style={{ color: on ? 'var(--accent)' : 'var(--ink)' }}>{o.t}</div>
                  <div className="mt-0.5 text-[11.5px] leading-relaxed text-[var(--muted)]">{o.d}</div>
                </button>
              )
            })}
          </div>
        </div>

        </>)}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="İşin adı" value={name} onChange={setName} placeholder="Ör. Mersin Konteyner Limanı Genişleme" />
          <Field
            label={kind === 'ihale' ? 'İhale takip no' : 'Proje takip no'}
            value={code} onChange={setCode}
            placeholder={kind === 'ihale' ? 'Ör. TND-2026-014' : 'Ör. PRJ-2026-003'}
            hint="Firmanın kendi ERP takip kodu"
          />
          <Field
            label={kind === 'ihale' ? 'Teklif tarihi' : 'Sözleşme bitiş tarihi'}
            value={due} onChange={setDue} type="date"
            hint={kind === 'ihale' ? 'Genelde davet mektubunda yazar' : undefined}
          />
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Para birimi</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}
              className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-2 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--accent)]">
              {['EUR', 'USD', 'TRY', 'GBP'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <span className="text-[11px] text-[var(--faint)]">Teklif ve hakedişlerin para birimi</span>
          </label>
          <Field
            label="Garanti (kusur sorumluluğu) süresi"
            value={warranty} onChange={setWarranty} type="number"
            hint="Gün — kabulden sonra kusurlardan sorumlu olunan süre (DLP)"
          />
        </div>

        <p className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[11.5px] leading-relaxed text-[var(--muted)]">
          İşveren, yer, bedel ve süre gibi alanlar doküman analizinden otomatik dolar;
          eksik kalırsa İhale Bilgi Paneli’nden elle düzeltilir.
        </p>
      </div>
    </Modal>
  )
}
