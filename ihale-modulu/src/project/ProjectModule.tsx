import { useState } from 'react'
import type { LibraryItem } from '../data/types'
import { Badge } from '../components/ui'
import { findItem, menuFor } from './menu'
import type { Persona } from '../lib/roles'
import { prj } from './data'
import { Home } from './screens/Home'
import { Placeholder } from './screens/Placeholder'
import { ProgressDashboard, ProgressDisruptions, SiteActivity, SitePhotos } from './screens/Progress'
import {
  AdminBudget, AdminChangeOrder, AdminClaim, AdminContract, AdminDisruptions, AdminIpc, AdminMachinery,
  AdminPersonel, AdminPhrs, AdminPlanning, AdminReport,
} from './screens/Admin'

/**
 * Modül 2 — proje (yapım) dönemi.
 * Yüklü işler sayfasından bir proje açılınca bu kabuk gelir: solda menü ağacı, ilk ekran Home.
 */
export function ProjectModule({ item, persona, onBack }: { item: LibraryItem; persona: Persona; onBack: () => void }) {
  const menu = menuFor(persona)
  const [page, setPage] = useState('home')
  /** Patron Admin Konsolu ile, proje ekibi Progress ile açılır */
  const [open, setOpen] = useState<string[]>([persona === 'patron' ? 'admin' : 'progress'])

  const sample = item.code === prj.code

  function go(key: string) {
    const { group } = findItem(key)
    if (group && !open.includes(group.key)) setOpen((o) => [...o, group.key])
    setPage(key)
  }

  return (
    <div className="flex min-h-screen bg-[var(--surface-2)]">
      {/* ---------- Sol menü ---------- */}
      <aside className="sticky top-0 flex h-screen w-[238px] flex-shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-4 py-3">
          <span className="grid h-6 w-6 place-items-center rounded-md text-[12px] font-extrabold text-white" style={{ background: 'var(--accent)' }}>İK</span>
          <span className="text-[13.5px] font-bold tracking-tight text-[var(--ink)]">İnşaat ERP</span>
          <span className="text-[11px] text-[var(--muted)]">{persona === 'patron' ? 'Patron' : 'Proje ekibi'}</span>
        </div>
        <button onClick={onBack}
          className="border-b border-[var(--border)] px-4 py-2 text-left text-[11.5px] font-semibold text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--accent)]">
          ← Yüklü işler
        </button>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-2">
          <NavLink label="Home" on={page === 'home'} onClick={() => setPage('home')} strong />
          {menu.map((g) => {
            const expanded = open.includes(g.key)
            const leaf = g.items.length === 0
            return (
              <div key={g.key}>
                <button
                  onClick={() => (leaf ? setPage(g.key) : setOpen((o) => (expanded ? o.filter((x) => x !== g.key) : [...o, g.key])))}
                  className="flex w-full items-center gap-1.5 rounded-md px-2.5 py-[6px] text-left text-[12.5px] font-semibold transition-colors hover:bg-[var(--surface-2)]"
                  style={page === g.key ? { background: 'var(--accent-soft)', color: 'var(--accent)' } : { color: 'var(--ink)' }}>
                  <span className="min-w-0 flex-1 truncate">{g.label}</span>
                  {!leaf && <span className="text-[10px] text-[var(--faint)]">{expanded ? '▾' : '▸'}</span>}
                </button>
                {expanded && !leaf && (
                  <div className="ml-2.5 flex flex-col gap-0.5 border-l border-[var(--border)] pl-1.5">
                    {g.items.map((i) => (
                      <NavLink key={i.key} label={i.label} on={page === i.key} onClick={() => setPage(i.key)} dim={!i.ready} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="border-t border-[var(--border)] px-3 py-2.5">
          <div className="truncate text-[11.5px] text-[var(--muted)]">Anadolu İnşaat A.Ş.</div>
        </div>
      </aside>

      {/* ---------- Sağ taraf ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-[var(--border)] bg-[var(--surface)] px-6 py-2.5">
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-bold text-[var(--ink)]">{item.name}</div>
            <div className="truncate text-[11.5px] text-[var(--muted)]">{item.code} · {item.employer} · {item.location} · Proje dönemi</div>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Badge tone="ok" dot>Yapım · %{item.progress}</Badge>
            <Badge tone={item.daysLeft < 120 ? 'warn' : 'neutral'}>Bitişe {item.daysLeft} gün</Badge>
          </div>
        </header>

        <main className="flex-1 px-6 pb-16 pt-5">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-4">
            {!sample && (
              <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[12.5px] text-[var(--muted)]">
                Görsel prototip: ekrandaki veriler örnek projeye ({prj.code} · {prj.name}) aittir.
              </div>
            )}
            <Screen page={page} onGo={go} persona={persona} />
          </div>
        </main>

        <footer className="border-t border-[var(--border)] bg-[var(--surface)] px-6 py-2 text-[11.5px] text-[var(--faint)]">
          Görsel prototip — veriler örnektir · Admin Konsolu yalnızca patron girişinde görünür · Proje verileri diğer işlerden yalıtılmıştır.
        </footer>
      </div>
    </div>
  )
}

function NavLink({ label, on, onClick, strong, dim }: { label: string; on: boolean; onClick: () => void; strong?: boolean; dim?: boolean }) {
  return (
    <button onClick={onClick}
      className={`flex items-center rounded-md px-2.5 py-[5px] text-left text-[12.5px] transition-colors hover:bg-[var(--surface-2)] ${strong ? 'font-semibold' : 'font-medium'}`}
      style={on ? { background: 'var(--accent-soft)', color: 'var(--accent)' } : { color: dim ? 'var(--faint)' : 'var(--muted)' }}
      title={dim ? 'Hazırlanıyor' : undefined}>
      <span className="truncate">{label}</span>
    </button>
  )
}

function Screen({ page, onGo, persona }: { page: string; onGo: (k: string) => void; persona: Persona }) {
  /** Admin Konsolu ekranları patron dışındaki girişlerde açılmaz */
  if (persona !== 'patron' && findItem(page).group?.key === 'admin') page = 'home'
  switch (page) {
    case 'home': return <Home onGo={onGo} persona={persona} />
    case 'budget': return <AdminBudget />
    case 'ipc': return <AdminIpc />
    case 'contract': return <AdminContract />
    case 'a_planning': return <AdminPlanning />
    case 'a_report': return <AdminReport />
    case 'phrs': return <AdminPhrs />
    case 'personel': return <AdminPersonel />
    case 'machinery': return <AdminMachinery />
    case 'a_disruptions': return <AdminDisruptions />
    case 'change_order': return <AdminChangeOrder />
    case 'claim': return <AdminClaim />
    case 'p_dashboard': return <ProgressDashboard onGo={onGo} />
    case 'site_activity': return <SiteActivity />
    case 'p_disruptions': return <ProgressDisruptions />
    case 'site_photos': return <SitePhotos />
    default: return <Placeholder page={page} />
  }
}
