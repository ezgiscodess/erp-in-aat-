/**
 * KIMKON marka işareti ve adı. Zümrüt zemin üzerinde simli altın; her yerde bu bileşen kullanılır.
 */
export const APP_NAME = 'KIMKON'

export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <span className="brand-serif grid flex-shrink-0 place-items-center rounded-md font-bold leading-none"
      style={{
        width: size, height: size, fontSize: Math.round(size * 0.56),
        background: 'linear-gradient(135deg,#12805F,#063D30)',
        boxShadow: 'inset 0 0 0 1px rgba(232,199,102,.55)',
      }}
      aria-hidden>
      <span className="glitter-text">K</span>
    </span>
  )
}

export function BrandName({ size = 14, light }: { size?: number; light?: boolean }) {
  return (
    <span className="font-extrabold leading-none" style={{ fontSize: size, letterSpacing: '.16em', color: light ? '#FFFFFF' : 'var(--ink)' }}>
      {APP_NAME}
    </span>
  )
}
