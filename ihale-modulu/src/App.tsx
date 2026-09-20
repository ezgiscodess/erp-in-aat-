import { useState } from 'react'
import type { Period, RoleKey, TabKey } from './data/types'
import { project, otherProjects } from './data/mock'
import { roles, tabs, accessFor, canWrite, roleLabel } from './lib/roles'
import { AddonLock, Badge } from './components/ui'
import { DokumanAnaliz } from './screens/DokumanAnaliz'
import { BilgiPaneli } from './screens/BilgiPaneli'
import { GoNoGo } from './screens/GoNoGo'
import { KritikSartlar } from './screens/KritikSartlar'
import { Boq } from './screens/Boq'
import { BirimFiyatHavuzu } from './screens/BirimFiyatHavuzu'
import { TeklifRiskleri } from './screens/TeklifRiskleri'
import { KontratAnaliz } from './screens/KontratAnaliz'
import { KontratHazirlama } from './screens/KontratHazirlama'
import { Sertifikalar } from './screens/Sertifikalar'
import { Ozet } from './screens/Ozet'

export default function App() {
  const [tab, setTab] = useState<TabKey>('dokuman_analiz')
  const [period, setPeriod] = useState<Period>('ihale')
  const [role, setRole] = useState<RoleKey>('teklif')
  /** Ek paketlerin bu şirkette açık olup olmadığı — demoda yan panelden değiştirilebilir. */
  const [addonsOn, setAddonsOn] = useState(true)

  const tabDef = tabs.find((t) => t.key === tab)!
  const access = accessFor(tab, role)
  const writable = canWrite(tab, role)
  const locked = !!tabDef.addon && !addonsOn

  /** Dönem değişince o dönemin veri girişi yapan rolüne geç. */
  function switchPeriod(p: Period) {
    setPeriod(p)
    const list = roles.filter((r) => r.period === p)
    setRole(list[list.length - 1].key)
  }

  return (
    <div className="flex min-h-screen bg-[var(--surface-2)]">
      {/* ---------- Sol yan panel ---------- */}
      <aside className="sticky top-0 flex h-screen w-[238px] flex-shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-4 py-3">
          <span className="grid h-6 w-6 place-items-center rounded-md text-[12px] font-extrabold text-white" style={{ background: 'var(--accent)' }}>İK</span>
          <span className="text-[13.5px] font-bold tracking-tight text-[var(--ink)]">İnşaat ERP</span>
          <span className="text-[11px] text-[var(--muted)]">İhale</span>
        </div>

        {/* Proje seçici — her proje ayrı veri alanı */}
        <div className="border-b border-[var(--border)] px-3 py-3">
          <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-[var(--faint)]">Proje</div>
          <select defaultValue={project.id}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-[12px] font-medium text-[var(--ink)] outline-none">
            {otherProjects.map((p) => <option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}
          </select>
          <div className="mt-1.5"><Badge tone="accent">Veri alanı: {project.id}</Badge></div>
        </div>

        {/* Dönem ve rol */}
        <div className="border-b border-[var(--border)] px-3 py-3">
          <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-[var(--faint)]">Dönem</div>
          <div className="flex overflow-hidden rounded-md border border-[var(--border)]">
            {(['ihale', 'proje'] as Period[]).map((p) => (
              <button key={p} onClick={() => switchPeriod(p)} className="flex-1 px-2 py-1 text-[11.5px] font-medium transition-colors"
                style={period === p ? { background: 'var(--accent)', color: '#fff' } : { background: 'var(--surface-2)', color: 'var(--muted)' }}>
                {p === 'ihale' ? 'İhale' : 'Proje'}
              </button>
            ))}
          </div>

          <div className="mb-1 mt-3 text-[10.5px] font-semibold uppercase tracking-wide text-[var(--faint)]">Rol</div>
          <div className="flex items-center gap-1.5">
            <select value={role} onChange={(e) => setRole(e.target.value as RoleKey)}
              className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-[12px] font-medium text-[var(--ink)] outline-none">
              {roles.filter((r) => r.period === period).map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
            <Badge tone={writable ? 'ok' : 'neutral'}>{access}</Badge>
          </div>
        </div>

        {/* Sekmeler */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-2">
          {tabs.map((t) => {
            const on = t.key === tab
            const isLocked = !!t.addon && !addonsOn
            return (
              <button key={t.key} onClick={() => setTab(t.key)} title={t.note}
                className="flex items-center gap-2 rounded-md px-2.5 py-[7px] text-left text-[12.5px] font-medium transition-colors"
                style={on
                  ? { background: 'var(--accent-soft)', color: 'var(--accent)' }
                  : { color: isLocked ? 'var(--faint)' : 'var(--muted)' }}>
                <span className="min-w-0 flex-1 truncate">{t.label}</span>
                {t.addon && (isLocked
                  ? <span title="Ek paket kapalı">🔒</span>
                  : <span className="rounded px-1 py-0.5 text-[9px] font-bold uppercase" style={{ background: 'var(--gold-bg)', color: 'var(--gold)', border: '1px solid var(--gold-border)' }}>Ek</span>)}
              </button>
            )
          })}
        </nav>

        {/* Alt: ek paket anahtarı ve firma */}
        <div className="border-t border-[var(--border)] px-3 py-2.5">
          <button onClick={() => setAddonsOn((v) => !v)}
            className="w-full rounded-md border px-2 py-1 text-[11.5px] font-medium"
            style={addonsOn
              ? { background: 'var(--gold-bg)', borderColor: 'var(--gold-border)', color: 'var(--gold)' }
              : { background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--muted)' }}
            title="Metraj, Kontrat Hazırlama ve Sertifikalar ek pakettedir">
            Ek paket: {addonsOn ? 'açık' : 'kapalı'}
          </button>
          <div className="mt-2 truncate text-[11.5px] text-[var(--muted)]">{project.company}</div>
        </div>
      </aside>

      {/* ---------- Sağ taraf ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sabit üst bilgi paneli — sayfa kaydırılınca yerinde kalır */}
        <header className="sticky top-0 z-40 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-[var(--border)] bg-[var(--surface)] px-6 py-2.5">
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-bold text-[var(--ink)]">{project.name}</div>
            <div className="truncate text-[11.5px] text-[var(--muted)]">
              {project.code} · {project.employer} · {project.location} · {project.contractType}
            </div>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Badge tone="warn" dot>Teklife {project.daysLeft} gün</Badge>
            <Badge tone="neutral">{project.status}</Badge>
            <span className="text-[12px] text-[var(--muted)]">{roleLabel(role)}</span>
          </div>
        </header>

        <main className="flex-1 px-6 pb-16 pt-5">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-4">
            {locked ? (
              <AddonLock
                title={tabDef.label}
                note={`${tabDef.note} Bu sekme ek pakette sunulur; şirketin aboneliğinde kapalıysa kullanıcıya bu ekran görünür.`}
                onOpen={() => setAddonsOn(true)}
              />
            ) : (
              <Screen tab={tab} writable={writable} role={roleLabel(role)} onGo={setTab} />
            )}
          </div>
        </main>

        <footer className="border-t border-[var(--border)] bg-[var(--surface)] px-6 py-2 text-[11.5px] text-[var(--faint)]">
          Görsel prototip — veriler örnektir. Yetki: <b className="text-[var(--muted)]">{roleLabel(role)}</b> ({access}) ·
          Sekme: <b className="text-[var(--muted)]">{tabDef.label}</b> · Proje verileri diğer projelerden yalıtılmıştır.
        </footer>
      </div>
    </div>
  )
}

function Screen({ tab, writable, role, onGo }: { tab: TabKey; writable: boolean; role: string; onGo: (t: TabKey) => void }) {
  switch (tab) {
    case 'dokuman_analiz': return <DokumanAnaliz writable={writable} role={role} />
    case 'bilgi_paneli': return <BilgiPaneli writable={writable} role={role} />
    case 'go_nogo': return <GoNoGo writable={writable} role={role} />
    case 'kritik_sartlar': return <KritikSartlar writable={writable} role={role} />
    case 'boq': return <Boq writable={writable} role={role} onGo={onGo} />
    case 'birim_fiyat': return <BirimFiyatHavuzu writable={writable} role={role} />
    case 'teklif_riskleri': return <TeklifRiskleri writable={writable} role={role} />
    case 'kontrat_analiz': return <KontratAnaliz writable={writable} role={role} />
    case 'kontrat_hazirlama': return <KontratHazirlama writable={writable} role={role} />
    case 'sertifikalar': return <Sertifikalar writable={writable} role={role} />
    case 'ozet': return <Ozet onGo={onGo} />
  }
}
