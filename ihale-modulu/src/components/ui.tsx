import type { ReactNode } from 'react'
import type { Severity } from '../data/types'

export type Tone = 'ok' | 'warn' | 'crit' | 'neutral' | 'accent' | 'gold'

/* ---------------- Kart ---------------- */

export function Card({ title, subtitle, right, children, pad = true }: {
  title?: ReactNode; subtitle?: ReactNode; right?: ReactNode; children: ReactNode; pad?: boolean
}) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      {(title || right) && (
        <header className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-2.5">
          <div className="min-w-0">
            {title && <h3 className="truncate text-[13.5px] font-semibold text-[var(--ink)]">{title}</h3>}
            {subtitle && <p className="mt-0.5 truncate text-[12px] text-[var(--muted)]">{subtitle}</p>}
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

export function Kpi({ label, value, sub, tone = 'neutral', wide }: {
  label: string; value: ReactNode; sub?: ReactNode; tone?: Tone; wide?: boolean
}) {
  const fg = tone === 'accent' ? 'var(--accent)' : tone === 'neutral' ? 'var(--ink)' : `var(--${tone})`
  return (
    <div className={`rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 ${wide ? 'col-span-2' : ''}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">{label}</div>
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

/** Sayfa başlığı + açıklama + sağdaki aksiyonlar */
export function PageHead({ title, note, right }: { title: string; note: string; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start gap-3 border-b border-[var(--border)] pb-3">
      <div className="min-w-0">
        <h1 className="text-[16px] font-bold tracking-tight text-[var(--ink)]">{title}</h1>
        <p className="mt-0.5 text-[12.5px] text-[var(--muted)]">{note}</p>
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-2">{right}</div>
    </div>
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
