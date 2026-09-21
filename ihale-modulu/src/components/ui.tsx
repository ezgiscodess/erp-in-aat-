import { useState } from 'react'
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
  if (['karşılanıyor', 'tamamlandı', 'kabul', 'onaylandı', 'analiz edildi', 'geçerli', 'kapandı', 'taslak hazır', 'var'].includes(v)) return 'ok'
  if (['karşılanmıyor', 'gecikti', 'ret', 'hata', 'eksik', 'açık', 'yok'].includes(v)) return 'crit'
  if (['inceleniyor', 'incelemede', 'devam', 'analiz ediliyor', 'sırada', 'bekliyor', 'düzenleniyor', 'izleniyor', 'yeni', 'boş'].includes(v)) return 'warn'
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
  return <div className="xl:sticky xl:top-[62px]">{children}</div>
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
