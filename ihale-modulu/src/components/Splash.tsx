import { useEffect, useState } from 'react'

/**
 * Açılış animasyonu: zümrüt zemin üzerinde simli altın KIMKON yazısı, üzerinden geçen ışık şeritleri ve
 * altında açılan ince altın çizgi. Oturumda bir kez gösterilir; tıklayınca ya da 2,6 sn sonra kapanır.
 * Hareket azaltma tercihi açıksa animasyonlar CSS'te kapanır, ekran kısa sürede çekilir.
 */
export function Splash() {
  const [phase, setPhase] = useState<'in' | 'out' | 'done'>(() => {
    try { return sessionStorage.getItem('kimkon-intro') ? 'done' : 'in' } catch { return 'in' }
  })

  useEffect(() => {
    if (phase !== 'in') return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const t1 = setTimeout(() => setPhase('out'), reduce ? 600 : 2600)
    return () => clearTimeout(t1)
  }, [phase])

  useEffect(() => {
    if (phase !== 'out') return
    try { sessionStorage.setItem('kimkon-intro', '1') } catch { /* gizli pencere */ }
    const t = setTimeout(() => setPhase('done'), 600)
    return () => clearTimeout(t)
  }, [phase])

  if (phase === 'done') return null
  return (
    <div className={`splash ${phase === 'out' ? 'splash-out' : ''}`} onClick={() => setPhase('out')} role="presentation">
      <span className="splash-sweep" />
      <span className="splash-sweep splash-sweep-2" />
      <div className="splash-center">
        <div className="splash-word">KIMKON</div>
        <span className="splash-line" />
        <div className="splash-tag">İnşaat yönetim platformu</div>
      </div>
    </div>
  )
}
