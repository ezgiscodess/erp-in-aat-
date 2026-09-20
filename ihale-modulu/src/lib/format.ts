/** Sayı, para ve tarih biçimlendirme — tüm ekranlarda aynı görünüm. */

export function money(v: number, currency = 'EUR', digits = 0): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency, maximumFractionDigits: digits, minimumFractionDigits: digits }).format(v)
}

/** Büyük tutarları kısa gösterir: 148,5 M EUR */
export function moneyShort(v: number, currency = 'EUR'): string {
  const abs = Math.abs(v)
  if (abs >= 1_000_000) return `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(v / 1_000_000)} M ${currency}`
  if (abs >= 1_000) return `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(v / 1_000)} B ${currency}`
  return `${new Intl.NumberFormat('tr-TR').format(v)} ${currency}`
}

export function num(v: number, digits = 0): string {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(v)
}

export function pct(v: number, digits = 0): string {
  return `%${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: digits }).format(v)}`
}

export function date(iso: string): string {
  if (!iso || iso === '—') return '—'
  const d = new Date(iso.length > 10 ? iso.replace(' ', 'T') : iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
}

/** "24 gün kaldı" / "5 gün geçti" */
export function daysLabel(days: number): string {
  if (days === 0) return 'bugün'
  return days > 0 ? `${days} gün kaldı` : `${Math.abs(days)} gün geçti`
}
