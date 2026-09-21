import { useState } from 'react'
import type { LibraryItem, TabKey } from './data/types'
import { library, project } from './data/mock'
import { tabs, accessFor, canWrite, defaultRole, roleLabel } from './lib/roles'
import { Badge, Btn } from './components/ui'
import { Login } from './screens/Login'
import { Hub } from './screens/Hub'
import { DokumanAnaliz } from './screens/DokumanAnaliz'
import { BilgiPaneli } from './screens/BilgiPaneli'
import { GoNoGo } from './screens/GoNoGo'
import { KritikSartlar } from './screens/KritikSartlar'
import { Boq } from './screens/Boq'
import { BirimFiyatHavuzu } from './screens/BirimFiyatHavuzu'
import { IsProgrami } from './screens/IsProgrami'
import { TeklifRiskleri } from './screens/TeklifRiskleri'
import { KontratAnaliz } from './screens/KontratAnaliz'
import { KontratHazirlama } from './screens/KontratHazirlama'
import { Sertifikalar } from './screens/Sertifikalar'
import { Ozet } from './screens/Ozet'

type View = 'login' | 'hub' | 'module'

export default function App() {
  const [view, setView] = useState<View>('login')
  /** Ara sayfadan açılan iş — modül bu işin verisiyle çalışır. */
  const [open, setOpen] = useState<LibraryItem>(library[0])
  const [tab, setTab] = useState<TabKey>('dokuman_analiz')

  /**
   * Rol panelde seçilmez; açılan işin dönemine göre arka planda gelir.
   * Yetki matrisi lib/roles.ts içinde durur, ileride talebe göre burada değiştirilir.
   */
  const role = defaultRole(open.kind)
  const tabDef = tabs.find((t) => t.key === tab)!
  const access = accessFor(tab, role)
  const writable = canWrite(tab, role)

  function openItem(item: LibraryItem) {
    setOpen(item)
    setTab('dokuman_analiz')
    setView('module')
  }

  if (view === 'login') return <Login onLogin={() => setView('hub')} />
  if (view === 'hub') return <Hub onOpen={openItem} onLogout={() => setView('login')} />

  /** Prototipte bütün ekranlar örnek ihale dosyasının verisiyle açılır. */
  const sample = open.id === project.id

  return (
    <div className="flex min-h-screen bg-[var(--surface-2)]">
      {/* ---------- Sol yan panel ---------- */}
      <aside className="sticky top-0 flex h-screen w-[238px] flex-shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-4 py-3">
          <span className="grid h-6 w-6 place-items-center rounded-md text-[12px] font-extrabold text-white" style={{ background: 'var(--accent)' }}>İK</span>
          <span className="text-[13.5px] font-bold tracking-tight text-[var(--ink)]">İnşaat ERP</span>
          <span className="text-[11px] text-[var(--muted)]">{open.kind === 'ihale' ? 'İhale' : 'Proje'}</span>
        </div>

        {/* Açık iş ve ara sayfaya dönüş */}
        <button
          onClick={() => setView('hub')}
          className="flex flex-col gap-0.5 border-b border-[var(--border)] px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-2)]"
          title="Yüklü proje ve ihaleler sayfasına dön"
        >
          <span className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--faint)]">← Yüklü işler</span>
          <span className="mono text-[11.5px] text-[var(--accent)]">{open.code}</span>
          <span className="line-clamp-2 text-[12px] leading-snug text-[var(--muted)]">{open.name}</span>
        </button>

        {/* Sekmeler */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-2">
          {tabs.map((t) => {
            const on = t.key === tab
            return (
              <button key={t.key} onClick={() => setTab(t.key)} title={t.note}
                className="flex items-center gap-2 rounded-md px-2.5 py-[7px] text-left text-[12.5px] font-medium transition-colors"
                style={on
                  ? { background: 'var(--accent-soft)', color: 'var(--accent)' }
                  : { color: 'var(--muted)' }}>
                <span className="min-w-0 flex-1 truncate">{t.label}</span>
                {t.addon && (
                  <span className="rounded px-1 py-0.5 text-[9px] font-bold uppercase" style={{ background: 'var(--gold-bg)', color: 'var(--gold)', border: '1px solid var(--gold-border)' }}>Ek</span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-[var(--border)] px-3 py-2.5">
          <div className="truncate text-[11.5px] text-[var(--muted)]">{project.company}</div>
        </div>
      </aside>

      {/* ---------- Sağ taraf ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sabit üst bilgi paneli — sayfa kaydırılınca yerinde kalır */}
        <header className="sticky top-0 z-40 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-[var(--border)] bg-[var(--surface)] px-6 py-2.5">
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-bold text-[var(--ink)]">{open.name}</div>
            <div className="truncate text-[11.5px] text-[var(--muted)]">
              {open.code} · {open.employer} · {open.location}{sample ? ` · ${project.contractType}` : ''}
            </div>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {open.kind === 'ihale'
              ? <Badge tone="warn" dot>Teklife {open.daysLeft} gün</Badge>
              : <Badge tone="ok" dot>Yapım · %{open.progress}</Badge>}
            <Badge tone="neutral">{open.status}</Badge>
            <Btn small onClick={() => setView('hub')}>Yüklü işler</Btn>
          </div>
        </header>

        <main className="flex-1 px-6 pb-16 pt-5">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-4">
            {open.kind === 'proje' && (
              <div className="rounded-md border px-3 py-2 text-[12.5px]"
                style={{ background: 'var(--gold-bg)', borderColor: 'var(--gold-border)', color: 'var(--gold)' }}>
                Proje dönemi ekranları (hakediş, şantiye, talepler) hazırlanıyor. Şimdilik bu işin ihale dosyası açılıyor.
              </div>
            )}
            {!sample && (
              <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[12.5px] text-[var(--muted)]">
                Görsel prototip: ekrandaki veriler örnek ihale dosyasına ({project.code}) aittir.
              </div>
            )}
            <Screen tab={tab} writable={writable} role={roleLabel(role)} onGo={setTab} />
          </div>
        </main>

        <footer className="border-t border-[var(--border)] bg-[var(--surface)] px-6 py-2 text-[11.5px] text-[var(--faint)]">
          Görsel prototip — veriler örnektir. Sekme: <b className="text-[var(--muted)]">{tabDef.label}</b> ({access}) ·
          Yetkiler panelde seçilmez, talep üzerine arka planda tanımlanır · Proje verileri diğer işlerden yalıtılmıştır.
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
    case 'is_programi': return <IsProgrami writable={writable} role={role} onGo={onGo} />
    case 'teklif_riskleri': return <TeklifRiskleri writable={writable} role={role} />
    case 'kontrat_analiz': return <KontratAnaliz writable={writable} role={role} />
    case 'kontrat_hazirlama': return <KontratHazirlama writable={writable} role={role} />
    case 'sertifikalar': return <Sertifikalar writable={writable} role={role} />
    case 'ozet': return <Ozet onGo={onGo} />
  }
}
