import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Severity } from '../data/types'

export type Tone = 'ok' | 'warn' | 'crit' | 'neutral' | 'accent' | 'gold'

/* ---------------- Kart ---------------- */

export function Card({ title, subtitle, right, children, pad = true, help }: {
  title?: ReactNode; subtitle?: ReactNode; right?: ReactNode; children: ReactNode; pad?: boolean; help?: string
}) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      {(title || right) && (
        <header className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-1.5">
            {title && <h3 className="truncate text-[13.5px] font-semibold text-[var(--ink)]">{title}</h3>}
            {help ? <Help text={help} /> : subtitle ? <span className="truncate text-[12px] text-[var(--muted)]">· {subtitle}</span> : null}
          </div>
          <div className="ml-auto flex flex-shrink-0 items-center gap-2">{right}</div>
        </header>
      )}
      <div className={pad ? 'p-4' : ''}>{children}</div>
    </section>
  )
}

/* ---------------- Buton ---------------- */

export function Btn({ children, primary, disabled, onClick, title, small }: {
  children: ReactNode; primary?: boolean; disabled?: boolean; onClick?: () => void; title?: string; small?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded-md border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${small ? 'px-2 py-1 text-[12px]' : 'px-3 py-1.5 text-[12.5px]'}`}
      style={primary
        ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }
        : { background: 'var(--surface-2)', color: 'var(--muted)', borderColor: 'var(--border)' }}
    >
      {children}
    </button>
  )
}

/* ---------------- Rozetler ---------------- */

export function Badge({ children, tone = 'neutral', dot }: { children: ReactNode; tone?: Tone; dot?: boolean }) {
  const fg = tone === 'accent' ? 'var(--accent)' : `var(--${tone})`
  const bg = tone === 'accent' ? 'var(--accent-soft)' : `var(--${tone}-bg)`
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: bg, color: fg }}>
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: fg }} />}
      {children}
    </span>
  )
}

export function severityTone(s: Severity): Tone {
  return s === 'Kritik' ? 'crit' : s === 'Yüksek' ? 'warn' : s === 'Orta' ? 'neutral' : 'ok'
}

export function SeverityBadge({ value }: { value: Severity }) {
  return <Badge tone={severityTone(value)} dot>{value}</Badge>
}

/** Serbest metin durumları için sezgisel renklendirme (referans projedeki mantık). */
export function stateTone(value: string): Tone {
  const v = value.toLocaleLowerCase('tr')
  if (['kontrol edildi', 'etkisi sıfırlandı', 'karşılanıyor', 'tamamlandı', 'kabul', 'onaylandı', 'analiz edildi', 'geçerli', 'kapandı', 'taslak hazır', 'var'].includes(v)) return 'ok'
  if (['karşılanmıyor', 'gecikti', 'ret', 'hata', 'eksik', 'açık', 'yok'].includes(v)) return 'crit'
  if (v === 'devam ediyor') return 'accent'
  if (['kontrol ediliyor', 'inceleniyor', 'incelemede', 'devam', 'analiz ediliyor', 'sırada', 'bekliyor', 'düzenleniyor', 'izleniyor', 'yeni', 'boş'].includes(v)) return 'warn'
  return 'neutral'
}

export function StateBadge({ value }: { value: string }) {
  if (!value) return <span className="text-[var(--faint)]">—</span>
  return <Badge tone={stateTone(value)} dot>{value}</Badge>
}

export function AddonBadge({ children = 'Ek Paket' }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
      style={{ background: 'var(--gold-bg)', color: 'var(--gold)', border: '1px solid var(--gold-border)' }}>
      {children}
    </span>
  )
}

/* ---------------- KPI kutusu ---------------- */

export function Kpi({ label, value, sub, tone = 'neutral', wide, help }: {
  label: string; value: ReactNode; sub?: ReactNode; tone?: Tone; wide?: boolean; help?: string
}) {
  const fg = tone === 'accent' ? 'var(--accent)' : tone === 'neutral' ? 'var(--ink)' : `var(--${tone})`
  return (
    <div className={`rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 ${wide ? 'col-span-2' : ''}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">
        {label}{help && <Help text={help} title={label} />}
      </div>
      <div className="mt-1 text-[21px] font-bold leading-tight tnum" style={{ color: fg }}>{value}</div>
      {sub && <div className="mt-0.5 text-[11.5px] text-[var(--muted)]">{sub}</div>}
    </div>
  )
}

/* ---------------- Çubuk ---------------- */

export function Bar({ value, tone = 'accent', height = 6 }: { value: number; tone?: Tone; height?: number }) {
  const fg = tone === 'accent' ? 'var(--accent)' : `var(--${tone})`
  return (
    <div className="w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-3)', height }}>
      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: fg }} />
    </div>
  )
}

/* ---------------- Tablo yardımcıları ---------------- */

export function Table({ children, head }: { children: ReactNode; head: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      <table className="w-full border-collapse text-[13px]">
        <thead>{head}</thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function Th({ children, w, right }: { children: ReactNode; w?: number; right?: boolean }) {
  return (
    <th className={`whitespace-nowrap border-b border-r border-[var(--border)] bg-[var(--surface-3)] px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[var(--muted)] ${right ? 'text-right' : 'text-left'}`}
      style={{ minWidth: w }}>
      {children}
    </th>
  )
}

export function Td({ children, right, mono, nowrap, className = '' }: {
  children: ReactNode; right?: boolean; mono?: boolean; nowrap?: boolean; className?: string
}) {
  return (
    <td className={`border-b border-r border-[var(--border)] px-3 py-1.5 align-top ${right ? 'text-right tnum' : ''} ${mono ? 'mono text-[12px]' : ''} ${nowrap ? 'whitespace-nowrap' : ''} ${className}`}>
      {children}
    </td>
  )
}

/* ---------------- Kanıt kartı ---------------- */

export function Evidence({ doc, page, clause, quote, verification }: {
  doc: string; page: number; clause?: string; quote: string; verification?: 'exact' | 'fuzzy' | 'unverified'
}) {
  const vTone: Tone = verification === 'exact' ? 'ok' : verification === 'fuzzy' ? 'warn' : 'crit'
  const vLabel = verification === 'exact' ? 'Alıntı doğrulandı' : verification === 'fuzzy' ? 'Yaklaşık eşleşme' : 'Doğrulanamadı'
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
      <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-[var(--muted)]">
        <span className="font-semibold text-[var(--ink)]">{doc}</span>
        <span>•</span>
        <span>s. {page}</span>
        {clause && clause !== '—' && (<><span>•</span><span className="mono">Madde {clause}</span></>)}
        <span className="ml-auto"><Badge tone={vTone} dot>{vLabel}</Badge></span>
      </div>
      <blockquote className="mt-2 border-l-2 border-[var(--accent)] bg-[var(--surface)] px-3 py-2 text-[12.5px] italic leading-relaxed text-[var(--ink)]">
        “{quote}”
      </blockquote>
    </div>
  )
}

/* ---------------- Bilgi şeritleri ---------------- */

export function ReadOnlyNote({ role }: { role: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-[12.5px]"
      style={{ background: 'var(--neutral-bg)', borderColor: 'var(--border)', color: 'var(--neutral)' }}>
      <span>🔒</span>
      <span><b>{role}</b> rolü bu sekmede yalnızca görüntüleme (R) yetkisine sahip. Düzenleme yapmak için Teklif veya Teknik Kullanıcı rolüne geçin.</span>
    </div>
  )
}

export function AddonLock({ title, note, onOpen }: { title: string; note: string; onOpen: () => void }) {
  return (
    <div className="mx-auto mt-10 max-w-xl rounded-lg border p-6 text-center"
      style={{ background: 'var(--gold-bg)', borderColor: 'var(--gold-border)' }}>
      <div className="text-[28px]">🔐</div>
      <h3 className="mt-2 text-[15px] font-bold" style={{ color: 'var(--gold)' }}>{title} — Ek Paket</h3>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed" style={{ color: 'var(--gold)' }}>{note}</p>
      <div className="mt-4"><Btn primary onClick={onOpen}>Ek paketi bu demoda aç</Btn></div>
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-3 py-8 text-center text-[13px] text-[var(--faint)]">{children}</div>
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-[14px] font-bold text-[var(--ink)]">{children}</h2>
      <div className="ml-auto flex items-center gap-2">{right}</div>
    </div>
  )
}

/** Sayfa başlığı + "?" bilgi balonu + sağdaki aksiyonlar */
export function PageHead({ title, note, right }: { title: string; note: string; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] pb-3">
      <div className="flex min-w-0 items-center gap-1.5">
        <h1 className="text-[16px] font-bold tracking-tight text-[var(--ink)]">{title}</h1>
        <Help text={note} />
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-2">{right}</div>
    </div>
  )
}

/**
 * Başlıkların yanındaki "?" — üzerine gelince veya tıklayınca açıklama açılır.
 * Ekranlardaki uzun açıklama metinleri buraya taşındı.
 */
export function Help({ text, title }: { text: string; title?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex">
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-label="Bilgi"
        className="grid h-[15px] w-[15px] place-items-center rounded-full border text-[10px] font-bold leading-none transition-colors"
        style={{ borderColor: 'var(--border-strong)', color: 'var(--muted)', background: 'var(--surface-2)' }}
      >?</button>
      {open && (
        <span className="absolute left-0 top-[19px] z-50 w-72 rounded-md border border-[var(--border)] bg-[var(--surface)] p-2.5 text-[12px] font-normal leading-relaxed text-[var(--ink)] shadow-lg">
          {title && <b className="mb-0.5 block text-[12px]">{title}</b>}
          {text}
        </span>
      )}
    </span>
  )
}

export function Search({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-48 bg-transparent text-[13px] text-[var(--ink)] outline-none placeholder:text-[var(--faint)]" />
    </div>
  )
}

/** Yatay filtre sekmeleri (ör. bulgu türü) */
export function Chips<T extends string>({ items, value, onChange }: {
  items: { key: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((i) => {
        const on = i.key === value
        return (
          <button key={i.key} onClick={() => onChange(i.key)}
            className="rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors"
            style={on
              ? { background: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--accent)' }
              : { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--muted)' }}>
            {i.label}{i.count != null && <span className="ml-1 text-[11px] opacity-70 tnum">{i.count}</span>}
          </button>
        )
      })}
    </div>
  )
}

/* ---------------- Önizleme paneli ---------------- */

export interface PreviewDoc {
  /** Panelde gösterilecek doküman adı */
  doc: string
  page: number
  pages?: number
  clause?: string
  /** Vurgulanacak satır (AI'ın dayandığı metin) */
  highlight?: string
  /** Sayfanın düz metni; manuel düzeltmede bu metin düzenlenir */
  body: string
}

export interface EditLogEntry {
  at: string
  user: string
  kind: 'Manuel düzeltme' | 'AI önerisi' | 'Otomatik doldurma'
  note: string
}

/**
 * Sağ tarafta duran doküman önizleme ekranı.
 * `editable` verilirse metin elle düzeltilebilir ve her kayıt "Manuel düzeltme" olarak loga düşer.
 */
export function PreviewPane({ title, preview, editable, user = 'e.yilmaz', log = [], onSave, footer, height, paper }: {
  title?: string
  preview: PreviewDoc
  editable?: boolean
  user?: string
  log?: EditLogEntry[]
  onSave?: (text: string, entry: EditLogEntry) => void
  footer?: ReactNode
  /** Metin alanının sabit yüksekliği — soldaki tabloyla eşit görünmesi için */
  height?: number
  /** Orijinal dosya görünümü: beyaz sayfa çerçevesi içinde gösterir */
  paper?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(preview.body)
  const [entries, setEntries] = useState<EditLogEntry[]>(log)

  // Seçim değişince panel yeni dokümana döner
  const [shown, setShown] = useState(preview.doc + preview.page)
  if (shown !== preview.doc + preview.page) {
    setShown(preview.doc + preview.page)
    setText(preview.body)
    setEditing(false)
  }

  function save() {
    const entry: EditLogEntry = {
      at: new Date().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      user,
      kind: 'Manuel düzeltme',
      note: `${preview.doc}${preview.clause ? ` · madde ${preview.clause}` : ''} · sayfa ${preview.page} metni elle düzeltildi`,
    }
    setEntries((e) => [entry, ...e])
    setEditing(false)
    onSave?.(text, entry)
  }

  const parts = preview.highlight && text.includes(preview.highlight)
    ? text.split(preview.highlight)
    : null

  return (
    <div className="flex flex-col gap-3">
      <section className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        <header className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
          <span className="text-[12.5px] font-semibold text-[var(--ink)]">{title ?? 'Önizleme'}</span>
          <span className="mono text-[11.5px] text-[var(--muted)]">{preview.doc}</span>
          {preview.clause && <Badge tone="accent">Madde {preview.clause}</Badge>}
          <span className="ml-auto flex items-center gap-1.5">
            {editable && !editing && <Btn small onClick={() => setEditing(true)}>✎ Elle düzelt</Btn>}
            {editable && editing && <>
              <Btn small onClick={() => { setText(preview.body); setEditing(false) }}>Vazgeç</Btn>
              <Btn small primary onClick={save}>Kaydet</Btn>
            </>}
            <Btn small>‹</Btn>
            <span className="tnum text-[12px] text-[var(--muted)]">{preview.page}{preview.pages ? ` / ${preview.pages}` : ''}</span>
            <Btn small>›</Btn>
          </span>
        </header>

        <div className={`overflow-y-auto ${paper ? 'bg-[var(--surface-2)] p-4' : 'p-4'}`} style={height ? { height } : undefined}>
          {editing ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={14}
              className="w-full resize-y rounded-md border border-[var(--accent)] bg-[var(--surface)] p-3 text-[12.5px] leading-relaxed text-[var(--ink)] outline-none"
            />
          ) : (
            <div className={`text-[12.5px] leading-[1.9] text-[var(--ink)] ${paper ? 'mx-auto max-w-[620px] rounded-sm border border-[var(--border)] bg-white px-7 py-6 shadow-sm' : ''}`}>
              <div className="mb-3 h-2 w-1/3 rounded bg-[var(--surface-3)]" />
              {parts ? (
                <p>{parts[0]}<mark className="evidence">{preview.highlight}</mark>{parts.slice(1).join(preview.highlight)}</p>
              ) : (
                <p className="whitespace-pre-wrap">{text}</p>
              )}
              <div className="mt-3 h-2 w-full rounded bg-[var(--surface-3)]" />
              <div className="mt-1 h-2 w-5/6 rounded bg-[var(--surface-3)]" />
              <div className="mt-1 h-2 w-4/6 rounded bg-[var(--surface-3)]" />
              {paper && <>
                <div className="mt-4 h-2 w-full rounded bg-[var(--surface-3)]" />
                <div className="mt-1 h-2 w-11/12 rounded bg-[var(--surface-3)]" />
                <div className="mt-1 h-2 w-3/4 rounded bg-[var(--surface-3)]" />
                <div className="mt-4 h-2 w-2/3 rounded bg-[var(--surface-3)]" />
                <div className="mt-1 h-2 w-full rounded bg-[var(--surface-3)]" />
                <div className="mt-1 h-2 w-5/6 rounded bg-[var(--surface-3)]" />
              </>}
            </div>
          )}
        </div>
        {footer && <div className="border-t border-[var(--border)] p-3">{footer}</div>}
      </section>

      {editable && (
        <Card title="Düzeltme logu" help="Bu dokümanda yapılan her değişiklik kim, ne zaman ve hangi türde yaptı bilgisiyle kaydedilir. Elle yapılan düzeltmeler 'Manuel düzeltme' olarak işaretlenir." pad={false}>
          {entries.length === 0 ? (
            <Empty>Henüz düzeltme yapılmadı.</Empty>
          ) : (
            <Table head={<tr><Th w={120}>Tarih</Th><Th w={90}>Kullanıcı</Th><Th w={120}>Tür</Th><Th>Açıklama</Th></tr>}>
              {entries.map((e, i) => (
                <tr key={i} className="hover:bg-[var(--surface-2)]">
                  <Td nowrap><span className="tnum text-[12px]">{e.at}</span></Td>
                  <Td nowrap mono>{e.user}</Td>
                  <Td nowrap><Badge tone={e.kind === 'Manuel düzeltme' ? 'warn' : 'neutral'} dot>{e.kind}</Badge></Td>
                  <Td><span className="text-[12px] text-[var(--muted)]">{e.note}</span></Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}
    </div>
  )
}

/* ---------------- Kaynak doküman görüntüleyici ---------------- */

/** Hedef sayfanın dışındaki sayfalar için örnek metin — gerçek sürümde dokümanın kendi sayfaları gelir. */
const FILLER = [
  'Yüklenici, işin yapımı sırasında yürürlükteki mevzuata, sözleşme belgelerine ve Mühendisin yazılı talimatlarına uymakla yükümlüdür. Talimatların uygulanmasından doğan maliyetler sözleşmede öngörülen usule göre değerlendirilir.',
  'Sözleşme belgeleri birbirini tamamlar nitelikte olup aralarında çelişki bulunması hâlinde öncelik sırası Sözleşme Özel Şartları, İdari Şartname, Teknik Şartname ve çizimler şeklindedir.',
  'Yüklenici, iş yerinde çalışan personelin iş sağlığı ve güvenliği önlemlerini almak, gerekli ekipmanı sağlamak ve bu konudaki kayıtları düzenli olarak tutmakla sorumludur.',
  'İşverenin onayı alınmadan işin tamamı veya bir kısmı alt yüklenicilere devredilemez. Onay verilmesi, Yüklenicinin sözleşmeden doğan sorumluluklarını ortadan kaldırmaz.',
  'Hakedişler aylık olarak düzenlenir ve Mühendis tarafından onaylandıktan sonra ödemeye esas alınır. Hakediş ekinde metraj cetvelleri ve imalat fotoğrafları sunulur.',
  'Malzemelerin şartnameye uygunluğu, kullanılmadan önce yapılacak deney ve muayenelerle belirlenir. Deney masrafları aksi belirtilmedikçe Yükleniciye aittir.',
  'Yüklenici, iş programında öngörülen ara teslim tarihlerine uymakla yükümlüdür. Programdaki değişiklikler Mühendisin onayına sunulur ve onaylanan program esas alınır.',
  'İş yerinde bulunan mevcut yapı ve tesislerin korunmasından Yüklenici sorumludur. Verilen zararlar Yüklenici tarafından bedeli karşılığında giderilir.',
  'Taraflar arasındaki yazışmalar Türkçe yapılır. Bildirimler, sözleşmede gösterilen adreslere yazılı olarak ve teslim alındı belgesi karşılığında gönderilir.',
  'Yüklenici, işin sonunda şantiyeyi temizlemek, geçici tesisleri kaldırmak ve iş yerini düzenli biçimde İşverene teslim etmekle yükümlüdür.',
]

function fillerFor(page: number, n: number, offset = 0): string[] {
  return Array.from({ length: n }, (_, i) => FILLER[(page * 3 + offset + i) % FILLER.length])
}

/** Hedef sayfanın çevresinde açılan sayfa aralığı; önceki/sonraki sayfalar istenince eklenir. */
function around(page: number, total: number, span = 3) {
  return { from: Math.max(1, page - span), to: Math.min(total, page + span) }
}

/**
 * Sağ panelde duran kaynak doküman.
 * Kayda tıklanınca dokümanın ilgili sayfası açılır, bahsi geçen paragraf boyanır.
 * Belge A4 sayfaları hâlinde alt alta dizilir; yukarı-aşağı kaydırılarak
 * paragrafın öncesi ve sonrası okunabilir, önceki/sonraki sayfalar yüklenebilir.
 */
export function DocViewer({ title = 'Kaynak', doc, page, pages, clause, body, highlight, paragraph = 3 }: {
  title?: string
  doc: string
  page: number
  pages?: number
  clause?: string
  /** Hedef paragrafın metni */
  body: string
  /** Paragraf içinde boyanacak cümle; verilmezse paragrafın tamamı boyanır */
  highlight?: string
  /** Hedef paragrafın sayfadaki sırası */
  paragraph?: number
}) {
  const total = Math.max(pages ?? page + 3, page)
  const [range, setRange] = useState(() => around(page, total))
  const [current, setCurrent] = useState(page)
  const boxRef = useRef<HTMLDivElement>(null)
  const markRef = useRef<HTMLElement>(null)
  /** Sayfa eklendikten sonra kaydırılacak hedef sayfa */
  const pendingPage = useRef<number | null>(null)
  /** Başa sayfa eklenince görünen yerin kaymaması için önceki yükseklik */
  const prevHeight = useRef<number | null>(null)

  // Seçim değişince görüntüleyici yeni kaynağa döner
  const key = `${doc}|${page}|${highlight ?? body}`
  const [shown, setShown] = useState(key)
  if (shown !== key) {
    setShown(key)
    setRange(around(page, total))
    setCurrent(page)
  }

  // Hedef paragrafı görünür alanın üst üçte birine getir
  useEffect(() => {
    const box = boxRef.current
    const mark = markRef.current
    if (!box || !mark) return
    const top = mark.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop
    box.scrollTo({ top: Math.max(0, top - box.clientHeight / 3), behavior: 'smooth' })
  }, [key])

  useLayoutEffect(() => {
    const box = boxRef.current
    if (!box) return
    if (prevHeight.current != null) {
      box.scrollTop += box.scrollHeight - prevHeight.current
      prevHeight.current = null
    }
    if (pendingPage.current != null) {
      scrollToPage(pendingPage.current)
      pendingPage.current = null
    }
  }, [range])

  function scrollToPage(p: number) {
    const box = boxRef.current
    const el = box?.querySelector<HTMLElement>(`[data-page="${p}"]`)
    if (!box || !el) return
    box.scrollTo({ top: el.offsetTop - 12, behavior: 'smooth' })
  }

  function loadBefore() {
    if (boxRef.current) prevHeight.current = boxRef.current.scrollHeight
    setRange((r) => ({ ...r, from: Math.max(1, r.from - 3) }))
  }

  function go(p: number) {
    if (p < 1 || p > total) return
    if (p < range.from || p > range.to) {
      pendingPage.current = p
      setRange((r) => ({ from: Math.min(r.from, p), to: Math.max(r.to, p) }))
    } else {
      scrollToPage(p)
    }
  }

  /** Kaydırdıkça üstteki sayaç görünen sayfayı gösterir. */
  function onScroll() {
    const box = boxRef.current
    if (!box) return
    const line = box.scrollTop + box.clientHeight / 3
    let visible = range.from
    box.querySelectorAll<HTMLElement>('[data-page]').forEach((el) => {
      if (el.offsetTop <= line) visible = Number(el.dataset.page)
    })
    if (visible !== current) setCurrent(visible)
  }

  const target = highlight && body.includes(highlight) ? body.split(highlight) : null
  const list = Array.from({ length: range.to - range.from + 1 }, (_, i) => range.from + i)

  return (
    <section className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      <header className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
        <span className="text-[12.5px] font-semibold text-[var(--ink)]">{title}</span>
        <span className="mono truncate text-[11.5px] text-[var(--muted)]">{doc}</span>
        {clause && <Badge tone="accent">Madde {clause}</Badge>}
        <span className="ml-auto flex items-center gap-1.5">
          <Btn small title="Önceki sayfa" onClick={() => go(current - 1)}>‹</Btn>
          <span className="tnum text-[12px] text-[var(--muted)]">{current} / {total}</span>
          <Btn small title="Sonraki sayfa" onClick={() => go(current + 1)}>›</Btn>
          <Btn small title="Kaynak paragrafa dön" onClick={() => go(page)}>s. {page}</Btn>
        </span>
      </header>

      <div ref={boxRef} onScroll={onScroll}
        className="relative overflow-y-auto bg-[var(--surface-3)] px-4 py-3"
        style={{ height: 'calc(100vh - 140px)', minHeight: 640 }}>
        {range.from > 1 && (
          <button onClick={loadBefore}
            className="mx-auto mb-3 block rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[11.5px] text-[var(--muted)] hover:text-[var(--accent)]">
            ↑ Önceki sayfalar (s. {Math.max(1, range.from - 3)}–{range.from - 1})
          </button>
        )}

        {list.map((p) => {
          const isTarget = p === page
          const before = isTarget ? fillerFor(p, paragraph - 1) : fillerFor(p, 5)
          const after = isTarget ? fillerFor(p, 2, 5) : []
          return (
            <article key={p} data-page={p}
              className="mx-auto mb-4 flex w-full max-w-[600px] flex-col rounded-sm border border-[var(--border)] bg-white px-9 py-8 text-[12.5px] leading-[1.85] text-[#1f2937] shadow-sm"
              style={{ aspectRatio: '1 / 1.414' }}>
              <div className="mb-4 flex items-center justify-between border-b border-[#e5e7eb] pb-1.5 text-[10px] text-[#9ca3af]">
                <span className="truncate">{doc}</span>
                <span>{p}</span>
              </div>
              {before.map((t, i) => <p key={i} className="mb-3">{t}</p>)}
              {isTarget && (
                <p className="relative mb-3">
                  <span className="absolute -left-7 top-0.5 text-[10px] font-semibold text-[var(--accent)]" title={`${p}. sayfa, ${paragraph}. paragraf`}>¶{paragraph}</span>
                  {target
                    ? <>{target[0]}<mark ref={markRef} className="evidence">{highlight}</mark>{target.slice(1).join(highlight)}</>
                    : <mark ref={markRef} className="evidence">{body}</mark>}
                </p>
              )}
              {after.map((t, i) => <p key={`a${i}`} className="mb-3">{t}</p>)}
              <div className="mt-auto pt-4 text-center text-[10px] text-[#9ca3af]">Sayfa {p} / {total}</div>
            </article>
          )
        })}

        {range.to < total && (
          <button onClick={() => setRange((r) => ({ ...r, to: Math.min(total, r.to + 3) }))}
            className="mx-auto mb-1 block rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[11.5px] text-[var(--muted)] hover:text-[var(--accent)]">
            ↓ Sonraki sayfalar (s. {range.to + 1}–{Math.min(total, range.to + 3)})
          </button>
        )}
      </div>
    </section>
  )
}

/* ---------------- AI soru-cevap ---------------- */

/** Ekranın altına veya pop-up'a konan soru-cevap kutusu. Yanıtlar maddeye atıflı gelir. */
export function AiChat({ suggestions, answers, compact }: {
  suggestions: string[]
  answers: Record<string, { text: string; source: string }>
  compact?: boolean
}) {
  const [q, setQ] = useState('')
  const [history, setHistory] = useState<{ q: string; a: { text: string; source: string } }[]>([])

  function ask(question: string) {
    const key = Object.keys(answers).find((k) => question.toLocaleLowerCase('tr').includes(k.toLocaleLowerCase('tr')))
    const a = key
      ? answers[key]
      : { text: 'Bu soru için dokümanlarda doğrulanmış bir karşılık bulunamadı. Soruyu idareye iletilecek soru listesine ekleyebilirsiniz.', source: 'Kaynak bulunamadı' }
    setHistory((h) => [...h, { q: question, a }])
    setQ('')
  }

  return (
    <div className="flex flex-col gap-3">
      <div className={`flex flex-col gap-2 overflow-y-auto ${compact ? 'max-h-60' : 'max-h-72'}`}>
        {history.length === 0 && (
          <p className="text-[12.5px] leading-relaxed text-[var(--muted)]">
            İhale dokümanları hakkında soru sorun. Yanıtlar yalnızca yüklenen dokümanlara dayanır ve madde/sayfa referansı ile gelir.
          </p>
        )}
        {history.map((h, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="self-end rounded-lg rounded-br-sm px-3 py-1.5 text-[12.5px]" style={{ background: 'var(--accent-soft)', color: 'var(--ink)' }}>{h.q}</div>
            <div className="rounded-lg rounded-bl-sm border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
              <p className="text-[12.5px] leading-relaxed text-[var(--ink)]">{h.a.text}</p>
              <div className="mt-1.5 text-[11px] text-[var(--muted)]">📎 {h.a.source}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((s) => (
          <button key={s} onClick={() => ask(s)}
            className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[11.5px] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]">
            {s}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5">
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && q.trim()) ask(q) }}
          placeholder="Dokümanlara soru sorun…"
          className="flex-1 bg-transparent text-[13px] text-[var(--ink)] outline-none placeholder:text-[var(--faint)]" />
        <Btn small primary onClick={() => q.trim() && ask(q)}>Sor</Btn>
      </div>
    </div>
  )
}

/* ---------------- Sağ panel sarmalayıcı ---------------- */

/** Sayfa kaydırılırken sağdaki önizlemenin ekranda kalmasını sağlar. */
export function StickyPane({ children }: { children: ReactNode }) {
  return <div className="xl:sticky xl:top-[62px] xl:self-start">{children}</div>
}

/* ---------------- Form alanı ---------------- */

export function Field({ label, value, onChange, placeholder, type = 'text', hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; hint?: string
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">{label}</span>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-2 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--accent)]"
      />
      {hint && <span className="text-[11px] text-[var(--faint)]">{hint}</span>}
    </label>
  )
}

/* ---------------- Pencere ---------------- */

/** Ortada açılan pencere — ihale/proje yükleme gibi kısa akışlar için. */
export function Modal({ title, note, onClose, children, footer, wide }: {
  title: string; note?: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(16,24,40,0.45)] p-6" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`mt-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl ${wide ? 'max-w-3xl' : 'max-w-xl'}`}
      >
        <header className="flex items-start gap-3 border-b border-[var(--border)] px-5 py-3.5">
          <div className="min-w-0">
            <h3 className="text-[14.5px] font-bold text-[var(--ink)]">{title}</h3>
            {note && <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--muted)]">{note}</p>}
          </div>
          <button onClick={onClose} aria-label="Kapat"
            className="ml-auto grid h-7 w-7 flex-shrink-0 place-items-center rounded-md border border-[var(--border)] text-[14px] text-[var(--muted)] hover:bg-[var(--surface-2)]">×</button>
        </header>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] bg-[var(--surface-2)] px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

/* ---------------- Dosya bırakma alanı ---------------- */

/** Görsel prototipte gerçek yükleme yapılmaz; seçilen dosyalar listelenir. */
export function Dropzone({ files, onAdd, onRemove }: {
  files: string[]; onAdd: (names: string[]) => void; onRemove: (name: string) => void
}) {
  const samples = [
    'Idari Sartname.pdf', 'Sozlesme Tasarisi.pdf', 'Teknik Sartname.pdf',
    'Birim Fiyat Teklif Cetveli.xlsx', 'Cizimler.pdf', 'Zeyilname-01.pdf',
  ]
  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-lg border-2 border-dashed border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-6 text-center">
        <div className="text-[20px]">📄</div>
        <div className="mt-1 text-[13px] font-medium text-[var(--ink)]">Dosyaları buraya sürükleyin</div>
        <div className="mt-0.5 text-[11.5px] text-[var(--muted)]">PDF, Word, Excel ve çizim dosyaları · taranmış belgeler OCR ile okunur</div>
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {samples.filter((s) => !files.includes(s)).slice(0, 3).map((s) => (
            <button key={s} onClick={() => onAdd([s])}
              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[11.5px] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]">
              + {s}
            </button>
          ))}
        </div>
      </div>
      {files.length > 0 && (
        <ul className="flex flex-col gap-1">
          {files.map((f) => (
            <li key={f} className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[12.5px]">
              <span className="text-[var(--ink)]">{f}</span>
              <Badge tone="warn">yüklenecek</Badge>
              <button onClick={() => onRemove(f)} className="ml-auto text-[12px] text-[var(--faint)] hover:text-[var(--crit)]">kaldır</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ---------------- Çıktı düğmeleri ---------------- */

/** Her sayfanın sağ üstünde duran çıktı seçenekleri. */
export function ExportButtons({ extra }: { extra?: ReactNode }) {
  return (
    <>
      {extra}
      <Btn small title="PDF olarak dışa aktar">PDF</Btn>
      <Btn small title="Excel olarak dışa aktar">Excel</Btn>
      <Btn small title="Word olarak dışa aktar">Word</Btn>
    </>
  )
}

/* ---------------- Sıralama ---------------- */

/** Tablo başlıklarının yanındaki sıralama seçici (tarih, alfabe, durum…). */
export function SortSelect<T extends string>({ value, onChange, items, label = 'Sırala' }: {
  value: T; onChange: (v: T) => void; items: { key: T; label: string }[]; label?: string
}) {
  return (
    <label className="flex items-center gap-1.5 text-[11.5px] text-[var(--muted)]">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value as T)}
        className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-[12px] font-medium text-[var(--ink)] outline-none">
        {items.map((i) => <option key={i.key} value={i.key}>{i.label}</option>)}
      </select>
    </label>
  )
}

/** Sütun başlığına konan küçük filtre düğmesi — açılan listeden değer seçilir. */
export function ColumnFilter({ values, value, onChange }: {
  values: string[]; value: string; onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex">
      <button onClick={() => setOpen((v) => !v)} title="Filtrele"
        className="grid h-[15px] w-[15px] place-items-center rounded border text-[9px] leading-none transition-colors"
        style={value === 'Tümü'
          ? { borderColor: 'var(--border-strong)', color: 'var(--muted)', background: 'var(--surface)' }
          : { borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-soft)' }}>▼</button>
      {open && (
        <span className="absolute left-0 top-[19px] z-50 flex min-w-[150px] flex-col rounded-md border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg">
          {['Tümü', ...values].map((v) => (
            <button key={v} onClick={() => { onChange(v); setOpen(false) }}
              className="px-2.5 py-1 text-left text-[12px] font-normal normal-case tracking-normal hover:bg-[var(--surface-2)]"
              style={{ color: v === value ? 'var(--accent)' : 'var(--ink)' }}>
              {v}
            </button>
          ))}
        </span>
      )}
    </span>
  )
}

/* ---------------- Düzeltme izi (redline) ---------------- */

export interface Redline {
  /** Metne eklenen cümle — sarı ve altı çizili görünür */
  added?: string
  /** Metinden çıkarılan cümle — soluk ve üstü çizili kalır */
  removed?: string
  by: string
  at: string
}

/**
 * Doküman metnini düzeltme izleriyle gösterir:
 * eklenen kısım sarı ve altı çizili, çıkarılan kısım soluk ve üstü çizili kalır.
 * Değişikliği kimin yaptığı yanda görünür.
 */
export function RedlineText({ body, edits }: { body: string; edits: Redline[] }) {
  let parts: ReactNode[] = [body]

  for (const e of edits) {
    if (e.removed) {
      parts = parts.flatMap((part) => {
        if (typeof part !== 'string' || !part.includes(e.removed!)) return [part]
        const [a, ...rest] = part.split(e.removed!)
        return [a, <del key={`d${e.at}`} className="redline-del" title={`${e.by} çıkardı · ${e.at}`}>{e.removed}</del>, rest.join(e.removed!)]
      })
    }
    if (e.added) {
      parts = [...parts, <ins key={`a${e.at}`} className="redline-add" title={`${e.by} ekledi · ${e.at}`}> {e.added}</ins>]
    }
  }

  return (
    <div className="flex gap-3">
      <p className="flex-1 whitespace-pre-wrap">{parts}</p>
      {edits.length > 0 && (
        <div className="w-[104px] flex-shrink-0 border-l border-[var(--border)] pl-2">
          {edits.map((e) => (
            <div key={e.at} className="mb-2 text-[10.5px] leading-snug text-[var(--muted)]">
              <div className="font-semibold text-[var(--ink)]">{e.by}</div>
              <div>{e.at}</div>
              <div style={{ color: e.added ? 'var(--gold)' : 'var(--crit)' }}>{e.added ? 'ekledi' : 'çıkardı'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
