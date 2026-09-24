import { useMemo, useState } from 'react'
import { docs, previewBodies } from '../data/mock'
import type { TenderDoc } from '../data/types'
import {
  Badge, Btn, Card, ColumnFilter, ExportButtons, Kpi, Modal, PageHead, ReadOnlyNote,
  IconBtn, RedlineText, RowActions, SortSelect, StateBadge, StickyPane, Table, Td, Th, ViewerTools,
} from '../components/ui'
import type { Redline } from '../components/ui'

type Sort = 'tarih-yeni' | 'tarih-eski' | 'ad' | 'tur' | 'durum'

const PAGE_BANDS = ['1–20 sayfa', '21–100 sayfa', '100+ sayfa']
function pageBand(n: number) {
  return n <= 20 ? PAGE_BANDS[0] : n <= 100 ? PAGE_BANDS[1] : PAGE_BANDS[2]
}

/** En son yüklenen doküman — ekran açıldığında sağdaki panelde bu dosya durur. */
const latest = [...docs].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))[0]

/** Yüklenen ihale dokümanları solda, seçilen dosyanın orijinali sağda açılır. */
export function DokumanAnaliz({ writable, role }: { writable: boolean; role: string }) {
  const [sel, setSel] = useState<TenderDoc>(latest)
  /** Yüklü dosyalar — silinen dosya listeden ve analizden çıkar */
  const [files, setFiles] = useState<TenderDoc[]>(docs)
  const [sort, setSort] = useState<Sort>('tarih-yeni')
  const [stateFilter, setStateFilter] = useState('Tümü')
  const [kindFilter, setKindFilter] = useState('Tümü')
  const [pageFilter, setPageFilter] = useState('Tümü')
  const [userFilter, setUserFilter] = useState('Tümü')
  const [askAnalyze, setAskAnalyze] = useState(false)
  /** Dokümana yapılan elle düzeltmeler — metinde iz bırakır */
  const [edits, setEdits] = useState<Record<string, Redline[]>>({})

  const analyzed = files.filter((d) => d.state === 'Analiz edildi').length
  const pending = files.filter((d) => d.state !== 'Analiz edildi')
  const body = previewBodies[sel.id] ?? 'Bu dokümanın önizlemesi henüz hazırlanmadı. Analiz tamamlandığında sayfa içeriği burada görünür.'

  const rows = useMemo(() => {
    const list = files.filter((d) => {
      if (stateFilter !== 'Tümü' && d.state !== stateFilter) return false
      if (kindFilter !== 'Tümü' && d.kind !== kindFilter) return false
      if (pageFilter !== 'Tümü' && pageBand(d.pages) !== pageFilter) return false
      if (userFilter !== 'Tümü' && d.uploadedBy !== userFilter) return false
      return true
    })
    const by: Record<Sort, (a: TenderDoc, b: TenderDoc) => number> = {
      'tarih-yeni': (a, b) => b.uploadedAt.localeCompare(a.uploadedAt),
      'tarih-eski': (a, b) => a.uploadedAt.localeCompare(b.uploadedAt),
      'ad': (a, b) => a.name.localeCompare(b.name, 'tr'),
      'tur': (a, b) => a.kind.localeCompare(b.kind, 'tr'),
      'durum': (a, b) => a.state.localeCompare(b.state, 'tr'),
    }
    return [...list].sort(by[sort])
  }, [files, sort, stateFilter, kindFilter, pageFilter, userFilter])

  return (
    <>
      <PageHead
        title="İhale Dokümanı Analiz"
        note="İhale dosyaları buraya yüklenir ve AI ile taranır. Her dosya sürümlenir; kim, ne zaman yükledi kaydı tutulur. Analiz sonuçları ilgili sekmelere (kritik şartlar, kontrat analiz, sertifikalar) dağılır."
        right={<ExportButtons />}
      />

      {!writable && <ReadOnlyNote role={role} />}

      <div className="grid grid-cols-2 gap-3">
        <Kpi label="Doküman" value={files.length} sub={`${analyzed} analiz edildi · ${pending.length} bekliyor`}
          help="Bu ihale için yüklenen dosya sayısı. Zeyilname ve soru-cevap listeleri de buraya eklenir." />
        <Kpi label="Toplam sayfa" value={files.reduce((a, d) => a + d.pages, 0)} sub="2 dosya taranmış (OCR)"
          help="Taranmış (görüntü) dosyalar OCR ile metne çevrilir; bu dosyalar OCR etiketiyle işaretlenir." />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Sol: işlem çubuğu ve doküman listesi */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Btn disabled={!writable}>+ Doküman Yükle</Btn>
            <Btn primary disabled={!writable} onClick={() => setAskAnalyze(true)}>▶ Tümünü Analiz Et</Btn>
            <span className="ml-auto">
              <Btn disabled={!writable} onClick={() => setAskAnalyze(true)} title="Dosyaları yeniden analiz eder">Yeniden Analiz</Btn>
            </span>
          </div>

          <Card
            title={`Yüklenen dokümanlar (${rows.length})`}
            help="Satıra tıklayınca dosyanın orijinali sağda açılır. Sütun başlıklarındaki ▼ ile listeyi süzebilirsiniz."
            right={<SortSelect<Sort> value={sort} onChange={setSort} items={[
              { key: 'tarih-yeni', label: 'Tarih (yeni → eski)' },
              { key: 'tarih-eski', label: 'Tarih (eski → yeni)' },
              { key: 'ad', label: 'Ad (A → Z)' },
              { key: 'tur', label: 'Tür' },
              { key: 'durum', label: 'Durum' },
            ]} />}
            pad={false}
          >
            <Table head={
              <tr>
                <Th w={190}>
                  <span className="flex items-center gap-1.5">
                    Doküman
                    <ColumnFilter value={kindFilter} onChange={setKindFilter} values={[...new Set(docs.map((d) => d.kind))]} />
                  </span>
                </Th>
                <Th w={56}>
                  <span className="flex items-center gap-1.5">
                    Sayfa
                    <ColumnFilter value={pageFilter} onChange={setPageFilter} values={PAGE_BANDS} />
                  </span>
                </Th>
                <Th w={96}>
                  <span className="flex items-center gap-1.5">
                    Yüklendi
                    <ColumnFilter value={userFilter} onChange={setUserFilter} values={[...new Set(docs.map((d) => d.uploadedBy))]} />
                  </span>
                </Th>
                <Th w={104}>
                  <span className="flex items-center gap-1.5">
                    Durum
                    <ColumnFilter value={stateFilter} onChange={setStateFilter} values={[...new Set(docs.map((d) => d.state))]} />
                  </span>
                </Th>
                <Th w={72} center>İşlem</Th>
              </tr>
            }>
              {rows.map((d) => (
                <tr key={d.id} onClick={() => setSel(d)} className="cursor-pointer hover:bg-[var(--surface-2)]"
                  style={d.id === sel.id ? { background: 'var(--accent-soft)' } : undefined}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--ink)]">{d.name}</span>
                      {d.ocr && <Badge tone="warn">OCR</Badge>}
                      {d.id === latest.id && <Badge tone="accent">son</Badge>}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[var(--muted)]">{d.kind}</div>
                  </Td>
                  <Td right>{d.pages}</Td>
                  <Td nowrap>
                    <div className="mono text-[11.5px] text-[var(--ink)]">{d.uploadedAt.slice(0, 10)}</div>
                    <div className="mono text-[11px] text-[var(--faint)]">{d.uploadedBy}</div>
                  </Td>
                  <Td nowrap><StateBadge value={d.state} /></Td>
                  <Td nowrap center>
                    <RowActions name={d.name} disabled={!writable}
                      onOpen={() => setSel(d)}
                      onDelete={() => {
                        setFiles((f) => f.filter((x) => x.id !== d.id))
                        if (sel.id === d.id) setSel(files.find((x) => x.id !== d.id) ?? docs[0])
                      }} />
                  </Td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>

        {/* Sağ: orijinal doküman ve elle düzeltme */}
        <StickyPane>
          <DocPreview
            doc={sel}
            body={body}
            isLatest={sel.id === latest.id}
            writable={writable}
            edits={edits[sel.id] ?? []}
            onEdit={(e) => setEdits((prev) => ({ ...prev, [sel.id]: [...(prev[sel.id] ?? []), e] }))}
          />
        </StickyPane>
      </div>

      {askAnalyze && (
        <AnalyzeModal
          total={files.length}
          pending={pending.length}
          onClose={() => setAskAnalyze(false)}
        />
      )}
    </>
  )
}

/* ---------------- Orijinal doküman paneli ---------------- */

/**
 * Dosyanın orijinali. "Düzenle" ile metin elle düzeltilir:
 * eklenen kısım sarı ve altı çizili girer, çıkarılan kısım soluk ve üstü çizili kalır,
 * düzeltmeyi yapanın adı yanda görünür.
 */
function DocPreview({ doc, body, isLatest, writable, edits, onEdit }: {
  doc: TenderDoc
  body: string
  isLatest: boolean
  writable: boolean
  edits: Redline[]
  onEdit: (e: Redline) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(body)
  const [page, setPage] = useState(1)
  const [zoom, setZoom] = useState(1)

  // Seçim değişince panel yeni dokümana döner
  const [shown, setShown] = useState(doc.id)
  if (shown !== doc.id) {
    setShown(doc.id)
    setDraft(body)
    setEditing(false)
    setPage(1)
  }

  /** Metnin başı ve sonu aynı kalan kısmı atıp yalnızca değişen parçayı iz olarak kaydeder. */
  function save() {
    const a = body
    const b = draft
    let start = 0
    while (start < a.length && start < b.length && a[start] === b[start]) start++
    let end = 0
    while (end < a.length - start && end < b.length - start && a[a.length - 1 - end] === b[b.length - 1 - end]) end++
    const removed = a.slice(start, a.length - end).trim()
    const added = b.slice(start, b.length - end).trim()

    if (removed || added) {
      onEdit({
        removed: removed || undefined,
        added: added || undefined,
        by: 'e.yilmaz',
        at: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit' }),
      })
    }
    setEditing(false)
  }

  return (
    <section className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      <header className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
        <span className="text-[12.5px] font-semibold text-[var(--ink)]">
          {isLatest ? 'Son yüklenen doküman' : 'Orijinal doküman'}
        </span>
        <span className="mono text-[11.5px] text-[var(--muted)]">{doc.name}</span>
        {edits.length > 0 && <Badge tone="gold">{edits.length} düzeltme</Badge>}
      </header>

      <div className="overflow-y-auto bg-[var(--surface-3)] p-4" style={{ height: 'calc(100vh - 190px)', minHeight: 600 }}>
        {editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={18}
            className="w-full resize-y rounded-md border border-[var(--accent)] bg-[var(--surface)] p-3 text-[12.5px] leading-relaxed text-[var(--ink)] outline-none"
          />
        ) : (
          <div className="mx-auto rounded-sm border border-[var(--border)] bg-white px-9 py-8 leading-[1.9] text-[var(--ink)] shadow-sm"
            style={{ aspectRatio: '1 / 1.414', maxWidth: 600 * zoom, fontSize: 12.5 * zoom }}>
            <div className="mb-3 h-2 w-1/3 rounded bg-[var(--surface-3)]" />
            <RedlineText body={body} edits={edits} />
            <div className="mt-3 h-2 w-full rounded bg-[var(--surface-3)]" />
            <div className="mt-1 h-2 w-5/6 rounded bg-[var(--surface-3)]" />
            <div className="mt-1 h-2 w-4/6 rounded bg-[var(--surface-3)]" />
            <div className="mt-4 h-2 w-2/3 rounded bg-[var(--surface-3)]" />
            <div className="mt-1 h-2 w-full rounded bg-[var(--surface-3)]" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] p-3 text-[12px] text-[var(--muted)]">
        <span className="min-w-0 flex-1 truncate">{doc.kind} · yükleyen {doc.uploadedBy}</span>
        <ViewerTools page={page} pages={doc.pages} zoom={zoom} onZoom={setZoom}
          onPrev={() => setPage((p) => Math.max(1, p - 1))} onNext={() => setPage((p) => Math.min(doc.pages, p + 1))} />
        <span className="flex flex-1 justify-end gap-1.5">
          {editing ? (
            <>
              <Btn small onClick={() => { setDraft(body); setEditing(false) }}>Vazgeç</Btn>
              <Btn small primary onClick={save}>Kaydet</Btn>
            </>
          ) : (
            <>
              <IconBtn icon="edit" title="Metni elle düzelt" disabled={!writable} onClick={() => setEditing(true)} />
              <Btn small>İndir</Btn>
            </>
          )}
        </span>
      </div>
    </section>
  )
}

/* ---------------- Tümünü analiz et penceresi ---------------- */

function AnalyzeModal({ total, pending, onClose }: { total: number; pending: number; onClose: () => void }) {
  const [scope, setScope] = useState<'tumu' | 'eksik'>('eksik')

  return (
    <Modal
      title="Hangi dosyalar analiz edilsin?"
      onClose={onClose}
      footer={<>
        <Btn onClick={onClose}>İptal</Btn>
        <span className="ml-auto"><Btn primary onClick={onClose}>Analiz et</Btn></span>
      </>}
    >
      <div className="flex flex-col gap-2">
        {([
          { k: 'tumu' as const, t: `Bütün yüklü dosyalar (${total})`, d: 'Daha önce analiz edilenler de baştan taranır. Zeyilname sonrası tüm dosyaların yeniden değerlendirilmesi gerektiğinde kullanılır.' },
          { k: 'eksik' as const, t: `Yalnızca analiz edilmemiş dosyalar (${pending})`, d: 'Yeni yüklenen ve sırada bekleyen dosyalar taranır. Daha hızlıdır ve mevcut bulguları bozmaz.' },
        ]).map((o) => {
          const on = scope === o.k
          return (
            <button key={o.k} onClick={() => setScope(o.k)}
              className="flex items-start gap-2.5 rounded-lg border p-3 text-left transition-colors"
              style={on
                ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)' }
                : { borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <input type="checkbox" checked={on} readOnly className="pointer-events-none mt-0.5" />
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold" style={{ color: on ? 'var(--accent)' : 'var(--ink)' }}>{o.t}</span>
                <span className="mt-0.5 block text-[11.5px] leading-relaxed text-[var(--muted)]">{o.d}</span>
              </span>
            </button>
          )
        })}
      </div>
    </Modal>
  )
}
