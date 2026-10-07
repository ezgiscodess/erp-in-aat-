import { useEffect, useMemo, useState } from 'react'

/**
 * KIMKON açılış sahnesi (≈3,4 sn, oturumda bir kez):
 *  1. Derin zümrüt sahne, yavaş dönen ışık huzmeleri ve süzülen sim parçacıkları
 *  2. İnce altın halka çizilir, içinde serif "K" monogramı belirir
 *  3. KIMKON harfleri tek tek bulanıklıktan netleşerek yükselir; üzerinden ışık geçer
 *  4. İki yana açılan altın çizgiler ve alt satır; ardından perde yukarı çekilir
 * Tıklayınca ya da Esc ile geçilir. Hareket azaltma tercihi açıksa kısa bir solmayla kapanır.
 */
export function Splash() {
  const [phase, setPhase] = useState<'in' | 'out' | 'done'>(() => {
    try { return sessionStorage.getItem('kimkon-intro') ? 'done' : 'in' } catch { return 'in' }
  })
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  /** Rastgele ama her açılışta aynı dağılan sim parçacıkları */
  const motes = useMemo(() => Array.from({ length: 34 }, (_, i) => {
    const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1
    return { left: r(1) * 100, top: 20 + r(2) * 70, size: 1 + r(3) * 2.6, delay: r(4) * 2.4, dur: 3.5 + r(5) * 3 }
  }), [])

  useEffect(() => {
    if (phase !== 'in') return
    const t = setTimeout(() => setPhase('out'), reduce ? 700 : 3400)
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setPhase('out') }
    window.addEventListener('keydown', key)
    return () => { clearTimeout(t); window.removeEventListener('keydown', key) }
  }, [phase, reduce])

  useEffect(() => {
    if (phase !== 'out') return
    try { sessionStorage.setItem('kimkon-intro', '1') } catch { /* gizli pencere */ }
    const t = setTimeout(() => setPhase('done'), 900)
    return () => clearTimeout(t)
  }, [phase])

  if (phase === 'done') return null
  return (
    <div className={`splash ${phase === 'out' ? 'splash-out' : ''}`} onClick={() => setPhase('out')} role="presentation" aria-label="KIMKON">
      <span className="splash-rays" />
      <span className="splash-vignette" />
      <div className="splash-motes" aria-hidden>
        {motes.map((m, i) => (
          <span key={i} style={{ left: `${m.left}%`, top: `${m.top}%`, width: m.size, height: m.size, animationDelay: `${m.delay}s`, animationDuration: `${m.dur}s` }} />
        ))}
      </div>

      <div className="splash-center">
        <svg className="splash-emblem" viewBox="0 0 120 120" aria-hidden>
          <defs>
            <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#8C6D12" /><stop offset=".45" stopColor="#FFF2C2" /><stop offset=".6" stopColor="#D4AF37" /><stop offset="1" stopColor="#8C6D12" />
            </linearGradient>
          </defs>
          <circle className="splash-ring" cx="60" cy="60" r="54" fill="none" stroke="url(#sg)" strokeWidth="1.2" />
          <circle className="splash-ring splash-ring-2" cx="60" cy="60" r="47" fill="none" stroke="url(#sg)" strokeWidth=".6" />
          <text className="splash-mono" x="60" y="77" textAnchor="middle" fill="url(#sg)">K</text>
        </svg>

        <div className="splash-word" aria-hidden>
          {'KIMKON'.split('').map((c, i) => <span key={i} style={{ animationDelay: `${0.9 + i * 0.09}s` }}>{c}</span>)}
          <span className="splash-glint">KIMKON</span>
        </div>

        <div className="splash-rule">
          <span className="splash-rule-l" /><span className="splash-diamond" /><span className="splash-rule-r" />
        </div>
        <div className="splash-tag">İnşaat Yönetim Platformu</div>
      </div>

      <span className="splash-curtain" />
    </div>
  )
}
