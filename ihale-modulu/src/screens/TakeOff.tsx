import { useState } from 'react'
import { boqItems, workGroups } from '../data/mock'
import type { BoqItem, TabKey, WorkGroup } from '../data/types'
import {
  Badge, Btn, Card, ColumnFilter, Dropzone, ExportButtons, Field, IconBtn, Kpi, Modal, PageHead, PreviewPane, ReadOnlyNote,
  RowActions, Search, StickyPane, Table, Td, Th,
} from '../components/ui'
import { num } from '../lib/format'
import { codeFor, methodOf } from '../lib/methods'
import type { MethodKey } from '../lib/methods'

/** Çizim setinin take-off durumu */
const DRAWINGS = [
  { code: 'P-102', name: 'Saha genel yerleşim', state: 'Tamamlandı', tone: 'ok' as const },
  { code: 'D-204', name: 'Kazık planı', state: 'Kısmi — doğu uç eksik', tone: 'warn' as const },
  { code: 'D-211', name: 'Tabliye kirişleri', state: 'Tamamlandı', tone: 'ok' as const },
  { code: 'E-412', name: 'RTG besleme', state: 'Bekliyor', tone: 'warn' as const },
  { code: 'A-301', name: 'Drenaj', state: 'Tamamlandı', tone: 'ok' as const },
]

/** Kalemin dayandığı çizim ve dokümanlar: metraj kaynağı + ilgili şartname bölümü */
function docsFor(b: BoqItem): string[] {
  return [...b.source.split('+').map((s) => s.trim()), `Teknik Şartname — ${b.group}`]
}

/**
 * Take-Offs = çizim ve dokümanlardan AI ile çıkarılan yalın metrajlar (duvar 50 m², beton 150 m³…).
 * Kodlar Pool sekmesinde seçilen standardın kırılımıyla gelir; birim fiyat burada yoktur, BOQ'da birleşir.
 */
export function TakeOff({ writable, role, method, onGo }: { writable: boolean; role: string; method: MethodKey; onGo: (t: TabKey) => void }) {
  const [q, setQ] = useState('')
  const [fGroup, setFGroup] = useState('Tümü')
  const [fUnit, setFUnit] = useState('Tümü')
  const [fConf, setFConf] = useState('Tümü')
  const [items, setItems] = useState<BoqItem[]>(boqItems)
  const [sel, setSel] = useState<BoqItem>(boqItems[5])
  /** Önizlemede açık olan çizim / doküman */
  const [doc, setDoc] = useState(docsFor(boqItems[5])[0])
  const [editPoz, setEditPoz] = useState<BoqItem | 'new' | null>(null)
  const [upload, setUpload] = useState(false)
  const m = methodOf(method)

  const confLabel = (b: BoqItem) => (b.confidence < 80 ? '%80 altı' : '%80 ve üstü')

  const rows = items.filter((b) => {
    if (fGroup !== 'Tümü' && b.group !== fGroup) return false
    if (fUnit !== 'Tümü' && b.unit !== fUnit) return false
    if (fConf !== 'Tümü' && confLabel(b) !== fConf) return false
    if (q.trim()) {
      const s = q.toLocaleLowerCase('tr')
      return [codeFor(b, method), b.description, b.source].some((v) => v.toLocaleLowerCase('tr').includes(s))
    }
    return true
  })

  const lowConf = items.filter((b) => b.confidence < 80)

  function pick(b: BoqItem) {
    setSel(b)
    setDoc(docsFor(b)[0])
  }

  const isDrawing = doc.startsWith('Çizim')

  return (
    <>
      <PageHead
        title="Take-Offs"
        note={`Çizim ve dokümanlardan AI yardımıyla çıkarılan yalın metrajlar. Kalemler Pool’da seçilen ${m.label} standardının kod kırılımıyla gelir. Birim fiyat burada yoktur; metrajlar BOQ sekmesinde birim fiyatlarla birleşir.`}
        right={<>
          <ExportButtons />
          <Btn disabled={!writable} onClick={() => setUpload(true)}>Çizim yükle</Btn>
          <Btn primary disabled={!writable}>AI ile metraj çıkar</Btn>
        </>}
      />

      {!writable && <ReadOnlyNote role={role} />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Metraj kalemi" value={items.length} sub="Çizim + idare cetveli"
          help="Çizim ve dokümanlardan çıkarılan iş kalemi sayısı." />
        <Kpi label="Kod kırılımı" value={m.label} sub={`Örnek kod ${m.pattern}`} tone="accent"
          help="Kalem kodları Pool sekmesinde seçilen standarda göre üretilir. Standart değişirse kodlar yeniden kırılır." />
        <Kpi label="Düşük güvenli metraj" value={lowConf.length} sub="Ölçüm güveni %80 altı" tone="warn"
          help="AI çizimden metraj çıkarırken bir güven yüzdesi üretir. %80 altındaki kalemler elle kontrol edilmeden BOQ’ya geçmez." />
        <Kpi label="Take-off tamamlanan" value={`${DRAWINGS.filter((d) => d.tone === 'ok').length} / ${DRAWINGS.length}`} sub="Çizim seti"
          help="Metrajı çıkarılmış çizim sayısı. Ayrıntı için Çizim yükle penceresine bakın." />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card
          title={`Metraj listesi (${rows.length})`}
          help="Satıra tıklayınca kalemin çizim ve dokümanları sağdaki önizlemede açılır. Sütun başlıklarındaki ▼ ile filtrelenir. Sarı satırlar düşük ölçüm güvenine sahiptir."
          right={<>
            <Search value={q} onChange={setQ} placeholder="Kod veya kalem ara…" />
            <IconBtn icon="add" primary title="Kalem ekle" disabled={!writable} onClick={() => setEditPoz('new')} />
          </>}
          pad={false}
        >
          <Table head={
            <tr>
              <Th w={84}>Kod · {m.label}</Th>
              <Th w={230}>
                <span className="flex items-center gap-1.5">İş kalemi ve kaynak
                  <ColumnFilter value={fGroup} onChange={setFGroup} values={workGroups.filter((g) => items.some((b) => b.group === g))} />
                </span>
              </Th>
              <Th w={56}>
                <span className="flex items-center gap-1.5">Birim
                  <ColumnFilter value={fUnit} onChange={setFUnit} values={[...new Set(items.map((b) => b.unit))]} />
                </span>
              </Th>
              <Th w={84} right>Metraj</Th>
              <Th w={70}>
                <span className="flex items-center gap-1.5">Güven
                  <ColumnFilter value={fConf} onChange={setFConf} values={['%80 altı', '%80 ve üstü']} />
                </span>
              </Th>
              <Th w={64} center>İşlem</Th>
            </tr>
          }>
            {rows.map((b) => {
              const low = b.confidence < 80
              return (
                <tr key={b.id} onClick={() => pick(b)} className="cursor-pointer hover:bg-[var(--surface-2)]"
                  style={sel.id === b.id
                    ? { background: 'var(--accent-soft)' }
                    : low ? { background: 'color-mix(in srgb, var(--warn-bg) 45%, transparent)' } : undefined}>
                  <Td mono nowrap>{codeFor(b, method)}</Td>
                  <Td>
                    <div className="text-[12.5px] text-[var(--ink)]">{b.description}</div>
                    <div className="mt-0.5 text-[11px] text-[var(--faint)]">{b.group} · {b.source}</div>
                    {b.note && <div className="mt-0.5 text-[11px] text-[var(--warn-ink)]">⚠ {b.note}</div>}
                  </Td>
                  <Td nowrap><span className="text-[var(--muted)]">{b.unit}</span></Td>
                  <Td right>{num(b.qty)}</Td>
                  <Td nowrap><Badge tone={low ? 'warn' : 'ok'}>%{b.confidence}</Badge></Td>
                  <Td nowrap center>
                    <RowActions name={`Kalem ${codeFor(b, method)}`} disabled={!writable} onEdit={() => setEditPoz(b)}
                      onDelete={() => {
                        const rest = items.filter((x) => x.id !== b.id)
                        setItems(rest)
                        if (sel.id === b.id && rest[0]) pick(rest[0])
                      }} />
                  </Td>
                </tr>
              )
            })}
          </Table>
        </Card>

        <StickyPane>
          <PreviewPane
            title="Preview"
            preview={{
              doc,
              page: 1,
              pages: 1,
              body: isDrawing
                ? `${doc} · ${sel.description}\n\nÇizimden ölçülen: ${num(sel.qty)} ${sel.unit}\nKod (${m.label}): ${codeFor(sel, method)}\nÖlçüm güveni: %${sel.confidence}\n\n${sel.note ?? 'Metraj çizimden otomatik çıkarılmıştır. Ölçüm güveni %80 ve üzerindeyse BOQ’ya doğrudan geçer.'}`
                : `${doc}\n\n${sel.description} kalemine ait imalat tarifi, malzeme ve ölçüm kuralları bu bölümde yer alır. Metraj ${m.label} ölçüm kurallarına göre ${sel.unit} biriminden hesaplanır.`,
            }}
            paper
            footer={
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[11.5px] text-[var(--muted)]">Çizim ve dokümanlar</span>
                {docsFor(sel).map((d) => (
                  <button key={d} onClick={() => setDoc(d)}
                    className="rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors"
                    style={d === doc
                      ? { background: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--accent)' }
                      : { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--muted)' }}>
                    {d}
                  </button>
                ))}
              </div>
            }
          />
        </StickyPane>
      </div>

      {upload && <UploadModal onClose={() => setUpload(false)} />}

      {editPoz && (
        <PozModal item={editPoz === 'new' ? null : editPoz} onClose={() => setEditPoz(null)}
          onSave={(b) => {
            setItems((l) => (l.some((x) => x.id === b.id) ? l.map((x) => (x.id === b.id ? b : x)) : [...l, b]))
            pick(b); setEditPoz(null)
          }} />
      )}

      <div className="flex justify-end">
        <Btn onClick={() => onGo('boq')}>Metrajları BOQ’da fiyatlandır →</Btn>
      </div>
    </>
  )
}

/* ---------------- Çizim yükleme ---------------- */

function UploadModal({ onClose }: { onClose: () => void }) {
  const [files, setFiles] = useState<string[]>([])
  return (
    <Modal title="Çizim yükle" note="Yüklenen çizimlerden AI metraj çıkarır. Eksik çizimler tamamlanmadan metraj kesinleşmez." onClose={onClose} wide
      footer={<>
        <span className="text-[11.5px] text-[var(--faint)]">{files.length ? `${files.length} dosya yüklenecek` : 'PDF, DWG veya IFC'}</span>
        <span className="ml-auto flex gap-2">
          <Btn onClick={onClose}>Kapat</Btn>
          <Btn primary disabled={!files.length} onClick={onClose}>Yükle ve metraj çıkar</Btn>
        </span>
      </>}>
      <div className="flex flex-col gap-4">
        <Dropzone files={files} onAdd={(n) => setFiles((f) => [...f, ...n])} onRemove={(n) => setFiles((f) => f.filter((x) => x !== n))} />
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Çizim seti · take-off durumu</div>
          <div className="flex flex-col gap-2 text-[12.5px]">
            {DRAWINGS.map((r) => (
              <div key={r.code} className="flex items-center gap-2 border-b border-[var(--border)] pb-2 last:border-0">
                <span className="mono text-[11.5px] text-[var(--muted)]">{r.code}</span>
                <span className="text-[var(--ink)]">{r.name}</span>
                <span className="ml-auto"><Badge tone={r.tone}>{r.state}</Badge></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}

/* ---------------- Kalem ekleme / düzenleme ---------------- */

function PozModal({ item, onClose, onSave }: { item: BoqItem | null; onClose: () => void; onSave: (b: BoqItem) => void }) {
  const [no, setNo] = useState(item?.no ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [unit, setUnit] = useState(item?.unit ?? 'm³')
  const [qty, setQty] = useState(String(item?.qty ?? ''))
  const [group, setGroup] = useState<WorkGroup>(item?.group ?? workGroups[0])
  const [source, setSource] = useState(item?.source ?? '')
  const ready = no.trim().length > 2 && description.trim().length > 2 && Number(qty) > 0

  return (
    <Modal
      title={item ? 'Kalemi düzenle' : 'Kalem ekle'}
      note="Elle değiştirilen metraj 'elle düzeltildi' olarak işaretlenir. Kod, Pool’da seçilen standarda göre yeniden kırılır."
      onClose={onClose}
      wide
      footer={<>
        <span className="text-[11.5px] text-[var(--faint)]">{ready ? 'Kaydedilmeye hazır' : 'Poz no, iş kalemi ve metraj zorunlu'}</span>
        <span className="ml-auto flex gap-2">
          <Btn onClick={onClose}>Vazgeç</Btn>
          <Btn primary disabled={!ready} onClick={() => onSave({
            ...(item ?? { id: `B${Date.now()}`, poolMatch: 'Eşleşmedi' as const, confidence: 100 }),
            no: no.trim(), description: description.trim(), unit, qty: Number(qty), group, source: source.trim() || 'Elle eklendi',
          })}>Kaydet</Btn>
        </span>
      </>}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field required label="Poz no (firma)" value={no} onChange={setNo} placeholder="Ör. 1000487" />
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">İş grubu</span>
          <select value={group} onChange={(e) => setGroup(e.target.value as WorkGroup)}
            className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-2 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--accent)]">
            {workGroups.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>
        <div className="sm:col-span-2"><Field required label="İş kalemi" value={description} onChange={setDescription} /></div>
        <Field label="Birim" value={unit} onChange={setUnit} />
        <Field required label="Metraj" value={qty} onChange={setQty} type="number" />
        <div className="sm:col-span-2"><Field label="Metraj kaynağı" value={source} onChange={setSource} placeholder="Ör. Çizim D-204" /></div>
      </div>
    </Modal>
  )
}
