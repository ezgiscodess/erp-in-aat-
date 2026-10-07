/**
 * KIMKON marka işareti ve adı. Lacivert zemin üzerinde mat altın; her yerde bu bileşen kullanılır.
 */
export const APP_NAME = 'KIMKON'

export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <span className="brand-serif grid flex-shrink-0 place-items-center rounded-md font-bold leading-none"
      style={{
        width: size, height: size, fontSize: Math.round(size * 0.56),
        background: 'linear-gradient(135deg,#0B3275,#061A3B)', color: '#D8B84D',
        boxShadow: 'inset 0 0 0 1px rgba(216,184,77,.45)',
      }}
      aria-hidden>
      K
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
