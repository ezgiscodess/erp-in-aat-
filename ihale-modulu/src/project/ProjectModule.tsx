import { useState } from 'react'
import type { LibraryItem } from '../data/types'
import { date } from '../lib/format'
import { findItem, menuFor } from './menu'
import type { Persona } from '../lib/roles'
import { prj } from './data'
import { Home } from './screens/Home'
import { Placeholder } from './screens/Placeholder'
import { BudgetDetail } from './screens/Budget'
import { ReportViewer } from './screens/Reports'
import { Sas, Stock } from './screens/Procurement'
import { Communication } from './screens/Communication'
import { ContractRisks, RiskDashboard } from './screens/Risk'
import { ContractsDashboard, MainContract, SubContracts } from './screens/Contracts'
import { CriticalPath, LookaheadSch, MicroSchedules, MitigationPlan, PlanningRisks, WorkSchedule } from './screens/Planning'
import { DailyEquipment, DailyManpower, ProgressDashboard, ProgressDisruptions, SiteActivity, SitePhotos } from './screens/Progress'
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
  /** Bitişe kalan gün — bütün ekranlarla aynı "bugün" tarihinden hesaplanır */
  const daysLeft = Math.round((new Date(item.dueAt).getTime() - new Date('2026-09-27').getTime()) / 86_400_000)

  /** Mobilde yan menü çekmece olarak açılır */
  const [navOpen, setNavOpen] = useState(false)
  const pick = (key: string) => { setPage(key); setNavOpen(false) }

  function go(key: string) {
    const { group } = findItem(key)
    if (group && !open.includes(group.key)) setOpen((o) => [...o, group.key])
    setPage(key)
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      {/* ---------- Sol menü ---------- */}
      {navOpen && <div className="backdrop fixed inset-0 z-40 bg-[rgba(15,23,42,0.40)] md:hidden" onClick={() => setNavOpen(false)} />}
      <aside className={`sidebar fixed inset-y-0 left-0 z-50 flex h-screen w-[240px] flex-shrink-0 flex-col transition-transform md:sticky md:top-0 md:translate-x-0 ${navOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-4 py-3">
          <span className="grid h-7 w-7 place-items-center rounded-md text-[12px] font-extrabold text-white" style={{ background: 'var(--accent-grad)' }}>IC</span>
          <span className="text-[13.5px] font-bold tracking-tight text-[var(--ink)]">ICCM Ecosystem</span>
          <span className="text-[11px] text-[var(--muted)]">{persona === 'patron' ? 'Patron' : 'Proje ekibi'}</span>
        </div>
        <button onClick={onBack}
          className="border-b border-[var(--border)] px-4 py-2 text-left text-[11.5px] font-semibold text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--accent)]">
          ← Yüklü işler
        </button>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-2">
          <NavLink label="Home" on={page === 'home'} onClick={() => pick('home')} strong />
          {menu.map((g) => {
            const expanded = open.includes(g.key)
            const leaf = g.items.length === 0
            return (
              <div key={g.key}>
                <button
                  onClick={() => (leaf ? pick(g.key) : setOpen((o) => (expanded ? o.filter((x) => x !== g.key) : [...o, g.key])))}
                  className={`flex w-full items-center gap-1.5 rounded-md px-3 py-1.5 text-left text-[13px] font-semibold transition-colors hover:bg-[var(--surface-2)] ${page === g.key ? 'nav-active' : ''}`}
                  style={page === g.key ? { background: 'var(--accent-soft)', color: 'var(--accent)' } : { color: 'var(--ink)' }}>
                  <span className="min-w-0 flex-1 truncate">{g.label}</span>
                  {!leaf && <span className="text-[10px] text-[var(--faint)]">{expanded ? '▾' : '▸'}</span>}
                </button>
                {expanded && !leaf && (
                  <div className="ml-2.5 flex flex-col gap-0.5 border-l border-[var(--border)] pl-1.5">
                    {g.items.map((i) => (
                      <NavLink key={i.key} label={i.label} on={page === i.key} onClick={() => pick(i.key)} dim={!i.ready} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="border-t border-[var(--border)] px-3 py-2.5">
          <div className="truncate text-[11.5px] text-[var(--muted)]">ICCM Construction LTD</div>
        </div>
      </aside>

      {/* ---------- Sağ taraf ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 shadow-sm sm:px-6">
          <button onClick={() => setNavOpen(true)} aria-label="Menü" className="btn grid h-9 w-9 place-items-center border md:hidden">☰</button>
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-bold text-[var(--ink)]">{item.name}</div>
            <div className="truncate text-[11.5px] text-[var(--muted)]">{item.code} · {item.employer} · {item.location} · Proje dönemi</div>
          </div>
          {/* Sözleşme tarihleri ve bitişe kalan gün sayacı */}
          <div className="ml-auto flex items-center gap-3">
            <div className="grid grid-cols-[auto_auto] gap-x-3 text-[11px] leading-[1.45]">
              <span className="text-[var(--faint)]">Contract Date</span>
              <span className="text-right font-medium text-[var(--ink)] tnum">{sample ? date(prj.contractDate) : '—'}</span>
              <span className="text-[var(--faint)]">Commencement Date</span>
              <span className="text-right font-medium text-[var(--ink)] tnum">{sample ? date(prj.start) : '—'}</span>
              <span className="text-[var(--faint)]">Project Completion Date</span>
              <span className="text-right font-medium text-[var(--ink)] tnum">{date(item.dueAt)}</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg px-3 py-1"
              style={{ background: daysLeft < 120 ? 'var(--warn-bg)' : 'var(--accent-soft)', color: daysLeft < 120 ? 'var(--warn-ink)' : 'var(--accent)' }}
              title="Sözleşme bitiş tarihine kalan takvim günü">
              <span className="text-[22px] font-extrabold leading-none tnum">{daysLeft}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide">gün kaldı</span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-12 pt-6 sm:px-6">
          <div key={page} className="page-in mx-auto flex max-w-[1500px] flex-col gap-4">
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
      className={`flex items-center rounded-md px-3 py-1.5 text-left text-[13px] transition-colors hover:bg-[var(--surface-2)] ${strong ? 'font-semibold' : 'font-medium'} ${on ? 'nav-active' : ''}`}
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
    case 'daily_manpower': return <DailyManpower />
    case 'daily_equipment': return <DailyEquipment />
    case 'budget_detail': return <BudgetDetail />
    case 'contracts_dashboard': return <ContractsDashboard onGo={onGo} />
    case 'main_contract': return <MainContract />
    case 'sub_contracts': return <SubContracts />
    case 'work_schedule': return <WorkSchedule />
    case 'micro': return <MicroSchedules />
    case 'lookahead': return <LookaheadSch />
    case 'critical_path': return <CriticalPath />
    case 'mitigation': return <MitigationPlan />
    case 'pl_risks': return <PlanningRisks />
    case 'r_daily': case 'r_weekly': case 'r_monthly': case 'r_employer': case 'r_hq': case 'r_presentations':
      return <ReportViewer type={page} />
    case 'sas': return <Sas />
    case 'stock': return <Stock />
    case 'communication': return <Communication />
    case 'risk_dashboard': return <RiskDashboard />
    case 'contract_risks': return <ContractRisks />
    default: return <Placeholder page={page} />
  }
}
