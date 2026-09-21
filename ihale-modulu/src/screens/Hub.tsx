import { useState } from 'react'
import { library, project } from '../data/mock'
import type { LibraryItem, Period } from '../data/types'
import { Badge, Bar, Btn, Chips, Dropzone, Field, Modal, Search, StateBadge } from '../components/ui'
import { date, daysLabel, moneyShort } from '../lib/format'

type Filter = 'Tümü' | 'İhaleler' | 'Projeler'

/**
 * Giriş sonrası ara sayfa: şirkete yüklenmiş ihale ve projeler.
 * Buradan bir iş açılır ya da "Yükle" ile yeni bir ihale/proje dosyası eklenir.
 */
export function Hub({ onOpen, onLogout }: { onOpen: (item: LibraryItem) => void; onLogout: () => void }) {
  const [filter, setFilter] = useState<Filter>('Tümü')
  const [q, setQ] = useState('')
  const [items, setItems] = useState<LibraryItem[]>(library)
  const [uploading, setUploading] = useState(false)
  const [justAdded, setJustAdded] = useState<string | null>(null)

  const tenders = items.filter((i) => i.kind === 'ihale')
  const projects = items.filter((i) => i.kind === 'proje')

  const list = items.filter((i) => {
    if (filter === 'İhaleler' && i.kind !== 'ihale') return false
    if (filter === 'Projeler' && i.kind !== 'proje') return false
    if (q.trim()) {
      const s = q.toLocaleLowerCase('tr')
      return [i.code, i.name, i.employer, i.location].some((v) => v.toLocaleLowerCase('tr').includes(s))
    }
    return true
  })

  /** Teklif tarihi en yakın olan açık ihale */
  const nearest = tenders.filter((t) => t.daysLeft >= 0).sort((a, b) => a.daysLeft - b.daysLeft)[0]

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
          <Btn small onClick={onLogout}>Çıkış</Btn>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1400px] flex-col gap-5 px-6 pb-16 pt-6">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <h1 className="text-[19px] font-bold tracking-tight text-[var(--ink)]">Yüklü proje ve ihaleler</h1>
            <p className="mt-1 text-[12.5px] text-[var(--muted)]">
              Çalışmak istediğiniz işi açın ya da yeni bir ihale / proje dosyası yükleyin.
              Her işin verisi kendi alanında durur; diğer işlerden yalıtılmıştır.
            </p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Search value={q} onChange={setQ} placeholder="İş adı, işveren, kod…" />
            <Btn primary onClick={() => setUploading(true)}>+ Yükle</Btn>
          </div>
        </div>

        {/* Özet şerit */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Summary label="Açık ihale" value={tenders.filter((t) => t.daysLeft >= 0).length}
            sub={nearest ? `En yakını ${nearest.code} · ${daysLabel(nearest.daysLeft)}` : 'Açık ihale yok'} tone="accent" />
          <Summary label="Yürüyen proje" value={projects.length} sub="Sözleşmesi imzalanmış işler" tone="ok" />
          <Summary label="Toplam dosya" value={items.reduce((a, i) => a + i.docCount, 0)} sub="Yüklenmiş doküman" tone="neutral" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Chips<Filter> value={filter} onChange={setFilter} items={[
            { key: 'Tümü', label: 'Tümü', count: items.length },
            { key: 'İhaleler', label: 'İhaleler', count: tenders.length },
            { key: 'Projeler', label: 'Projeler', count: projects.length },
          ]} />
        </div>

        {/* Kartlar */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {list.map((i) => (
            <ItemCard key={i.id} item={i} fresh={i.id === justAdded} onOpen={() => onOpen(i)} />
          ))}
          <button onClick={() => setUploading(true)}
            className="flex min-h-[188px] flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-[var(--border-strong)] bg-[var(--surface)] text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]">
            <span className="text-[22px]">＋</span>
            <span className="text-[13px] font-semibold">Yeni ihale / proje yükle</span>
            <span className="text-[11.5px] text-[var(--faint)]">Şartname, sözleşme, cetvel ve çizimler</span>
          </button>
        </div>
      </main>

      {uploading && <UploadModal onClose={() => setUploading(false)} onDone={addItem} />}
    </div>
  )
}

function Summary({ label, value, sub, tone }: { label: string; value: number; sub: string; tone: 'accent' | 'ok' | 'neutral' }) {
  const fg = tone === 'accent' ? 'var(--accent)' : tone === 'ok' ? 'var(--ok)' : 'var(--ink)'
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">{label}</div>
      <div className="mt-0.5 text-[22px] font-bold leading-tight tnum" style={{ color: fg }}>{value}</div>
      <div className="mt-0.5 text-[11.5px] text-[var(--muted)]">{sub}</div>
    </div>
  )
}

function ItemCard({ item, fresh, onOpen }: { item: LibraryItem; fresh: boolean; onOpen: () => void }) {
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
        <span className="ml-auto"><Btn small primary onClick={onOpen}>Aç</Btn></span>
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

/* ---------------- Yükleme penceresi ---------------- */

function UploadModal({ onClose, onDone }: { onClose: () => void; onDone: (item: LibraryItem) => void }) {
  const [kind, setKind] = useState<Period>('ihale')
  const [name, setName] = useState('')
  const [employer, setEmployer] = useState('')
  const [location, setLocation] = useState('')
  const [due, setDue] = useState('')
  const [files, setFiles] = useState<string[]>([])

  const ready = name.trim().length > 2 && files.length > 0

  function submit() {
    if (!ready) return
    const year = new Date().getFullYear()
    const seq = String(Math.floor(Math.random() * 90) + 10)
    onDone({
      id: `${kind === 'ihale' ? 'TND' : 'PRJ'}-${year}-${seq}`,
      kind,
      code: `${kind === 'ihale' ? 'TND' : 'PRJ'}-${year}-${seq}`,
      name: name.trim(),
      employer: employer.trim() || 'Belirtilmedi',
      location: location.trim() || 'Belirtilmedi',
      dueAt: due || '2026-12-31',
      daysLeft: 60,
      value: 0,
      currency: 'EUR',
      status: 'Analiz ediliyor',
      docCount: files.length,
      progress: 4,
      updatedAt: 'şimdi',
      updatedBy: 'e.yilmaz',
    })
  }

  return (
    <Modal
      title="İhale / proje yükle"
      note="Önce türü seçin, sonra dosyaları bırakın. Yükleme biter bitmez dokümanlar sıraya alınır ve analiz başlar."
      onClose={onClose}
      wide
      footer={<>
        <span className="text-[11.5px] text-[var(--faint)]">
          {files.length > 0 ? `${files.length} dosya seçildi` : 'En az bir dosya seçin'}
        </span>
        <span className="ml-auto flex gap-2">
          <Btn onClick={onClose}>Vazgeç</Btn>
          <Btn primary disabled={!ready} onClick={submit}>Yükle ve analize başla</Btn>
        </span>
      </>}
    >
      <div className="flex flex-col gap-4">
        {/* Tür seçimi */}
        <div>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Ne yüklüyorsunuz?</div>
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="İşin adı" value={name} onChange={setName} placeholder="Ör. Mersin Konteyner Limanı Genişleme" />
          <Field label="İşveren / İdare" value={employer} onChange={setEmployer} placeholder="Ör. Medport Liman İşletmeleri A.Ş." />
          <Field label="Yer" value={location} onChange={setLocation} placeholder="Ör. Mersin / Akdeniz" />
          <Field label={kind === 'ihale' ? 'Teklif tarihi' : 'Sözleşme bitiş tarihi'} value={due} onChange={setDue} type="date" />
        </div>

        <div>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Dosyalar</div>
          <Dropzone
            files={files}
            onAdd={(names) => setFiles((f) => [...f, ...names.filter((n) => !f.includes(n))])}
            onRemove={(n) => setFiles((f) => f.filter((x) => x !== n))}
          />
        </div>
      </div>
    </Modal>
  )
}
