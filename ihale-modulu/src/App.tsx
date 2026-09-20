import { useState } from 'react'
import type { Period, RoleKey, TabKey } from './data/types'
import { project, otherProjects } from './data/mock'
import { roles, tabs, accessFor, canWrite, roleLabel } from './lib/roles'
import { AddonBadge, AddonLock, Badge } from './components/ui'
import { DokumanAnaliz } from './screens/DokumanAnaliz'
import { BilgiPaneli } from './screens/BilgiPaneli'
import { GoNoGo } from './screens/GoNoGo'
import { KritikSartlar } from './screens/KritikSartlar'
import { Boq } from './screens/Boq'
import { TeklifRiskleri } from './screens/TeklifRiskleri'
import { KontratAnaliz } from './screens/KontratAnaliz'
import { KontratHazirlama } from './screens/KontratHazirlama'
import { Sertifikalar } from './screens/Sertifikalar'
import { Ozet } from './screens/Ozet'

export default function App() {
  const [tab, setTab] = useState<TabKey>('dokuman_analiz')
  const [period, setPeriod] = useState<Period>('ihale')
  const [role, setRole] = useState<RoleKey>('teklif')
  /** Ek paketlerin bu şirkette açık olup olmadığı — demoda üstten değiştirilebilir. */
  const [addonsOn, setAddonsOn] = useState(true)

  const tabDef = tabs.find((t) => t.key === tab)!
  const access = accessFor(tab, role)
  const writable = canWrite(tab, role)
  const locked = !!tabDef.addon && !addonsOn

  /** Dönem değişince o dönemin ilk rolüne geç (ihale → Teklif, proje → Teknik Kullanıcı gibi). */
  function switchPeriod(p: Period) {
    setPeriod(p)
    const first = roles.filter((r) => r.period === p)
    setRole(first[first.length - 1].key)
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[1560px] flex-col bg-[var(--bg)]">
      {/* ---------- Üst bar ---------- */}
      <header className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-5 py-2.5">
        <div className="flex items-center gap-2.5 font-bold tracking-tight text-[var(--ink)]">
          <span className="grid h-6 w-6 place-items-center rounded-md text-[12px] font-extrabold text-white" style={{ background: 'var(--accent)' }}>İK</span>
          İnşaat ERP <span className="text-[12px] font-medium text-[var(--muted)]">İhale &amp; Kontrat</span>
        </div>

        {/* Şirket / proje seçici — her proje ayrı veri alanı */}
        <div className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Proje</span>
          <select className="max-w-[300px] bg-transparent text-[12.5px] font-medium text-[var(--ink)] outline-none" defaultValue={project.id}>
            {otherProjects.map((p) => (
              <option key={p.id} value={p.id}>{p.id} — {p.name}</option>
            ))}
          </select>
        </div>
        <Badge tone="accent">Veri alanı: {project.id}</Badge>

        <div className="flex-1" />

        {/* Dönem */}
        <div className="flex items-center overflow-hidden rounded-md border border-[var(--border)]">
          {(['ihale', 'proje'] as Period[]).map((p) => (
            <button key={p} onClick={() => switchPeriod(p)}
              className="px-2.5 py-1 text-[12px] font-medium transition-colors"
              style={period === p ? { background: 'var(--accent)', color: '#fff' } : { background: 'var(--surface-2)', color: 'var(--muted)' }}>
              {p === 'ihale' ? 'İhale Dönemi' : 'Proje Dönemi'}
            </button>
          ))}
        </div>

        {/* Rol */}
        <div className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Rol</span>
          <select value={role} onChange={(e) => setRole(e.target.value as RoleKey)}
            className="bg-transparent text-[12.5px] font-medium text-[var(--ink)] outline-none">
            {roles.filter((r) => r.period === period).map((r) => (
              <option key={r.key} value={r.key}>{r.label}</option>
            ))}
          </select>
          <Badge tone={writable ? 'ok' : 'neutral'}>{access === 'RW' ? 'R-W' : 'R'}</Badge>
        </div>

        {/* Ek paket anahtarı (demo) */}
        <button onClick={() => setAddonsOn((v) => !v)}
          className="rounded-md border px-2.5 py-1 text-[12px] font-medium"
          style={addonsOn
            ? { background: 'var(--gold-bg)', borderColor: 'var(--gold-border)', color: 'var(--gold)' }
            : { background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--muted)' }}
          title="BoQ, Kontrat Hazırlama ve Sertifikalar ek pakettedir">
          Ek paket: {addonsOn ? 'açık' : 'kapalı'}
        </button>

        <span className="text-[12px] text-[var(--muted)]">{project.company}</span>
      </header>

      {/* ---------- Sekmeler ---------- */}
      <nav className="flex gap-0.5 overflow-x-auto border-b border-[var(--border)] bg-[var(--surface)] px-3">
        {tabs.map((t) => {
          const on = t.key === tab
          const isLocked = !!t.addon && !addonsOn
          return (
            <button key={t.key} onClick={() => setTab(t.key)} title={t.note}
              className="flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-[13px] font-medium transition-colors"
              style={on
                ? { color: 'var(--accent)', borderColor: 'var(--accent)', fontWeight: 600 }
                : { color: isLocked ? 'var(--faint)' : 'var(--muted)', borderColor: 'transparent' }}>
              {t.key === 'ozet' && <span>📋</span>}
              {t.label}
              {t.addon && (isLocked ? <span title="Ek paket kapalı">🔒</span> : <AddonBadge>Ek</AddonBadge>)}
            </button>
          )
        })}
      </nav>

      {/* ---------- İçerik ---------- */}
      <main className="flex-1 overflow-y-auto bg-[var(--surface-2)] px-6 pb-16 pt-5">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4">
          {locked ? (
            <AddonLock
              title={tabDef.label}
              note={`${tabDef.note}. Bu sekme ek pakette sunulur; şirketin aboneliğinde kapalıysa kullanıcıya bu ekran görünür.`}
              onOpen={() => setAddonsOn(true)}
            />
          ) : (
            <Screen tab={tab} writable={writable} role={roleLabel(role)} onGo={setTab} />
          )}
        </div>
      </main>

      {/* ---------- Alt bilgi ---------- */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)] px-6 py-2 text-[11.5px] text-[var(--faint)]">
        Görsel prototip — veriler örnektir. Yetki: <b className="text-[var(--muted)]">{roleLabel(role)}</b> ({access}) ·
        Sekme: <b className="text-[var(--muted)]">{tabDef.label}</b> · Proje verileri diğer projelerden yalıtılmıştır.
      </footer>
    </div>
  )
}

function Screen({ tab, writable, role, onGo }: { tab: TabKey; writable: boolean; role: string; onGo: (t: TabKey) => void }) {
  switch (tab) {
    case 'dokuman_analiz': return <DokumanAnaliz writable={writable} role={role} />
    case 'bilgi_paneli': return <BilgiPaneli writable={writable} role={role} />
    case 'go_nogo': return <GoNoGo writable={writable} role={role} />
    case 'kritik_sartlar': return <KritikSartlar writable={writable} role={role} />
    case 'boq': return <Boq writable={writable} role={role} />
    case 'teklif_riskleri': return <TeklifRiskleri writable={writable} role={role} />
    case 'kontrat_analiz': return <KontratAnaliz writable={writable} role={role} />
    case 'kontrat_hazirlama': return <KontratHazirlama writable={writable} role={role} />
    case 'sertifikalar': return <Sertifikalar writable={writable} role={role} />
    case 'ozet': return <Ozet onGo={onGo} />
  }
}
