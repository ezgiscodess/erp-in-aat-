import { useState } from 'react'
import { Badge, Btn, Card, Kpi, Modal, PageHead } from '../../components/ui'
import { date, moneyShort, pct } from '../../lib/format'
import { Legend, SCurve } from '../charts'
import {
  actualCum, claims, contractMatches, costLines, criticalPath, docSets, evm, ipcs, monthName, plannedCum, prj,
  productivity, subcontracts,
} from '../data'
import { menuFor } from '../menu'
import type { Persona } from '../../lib/roles'

const TODAY = new Date('2026-09-27')
const daysTo = (iso: string) => Math.round((new Date(iso).getTime() - TODAY.getTime()) / 86_400_000)

/** Satın alma ve depo ekranları ek paket olarak satılır; alınmışsa depo tutarı Home'da görünür */
const PROCUREMENT_PACKAGE = true

/** Proje ekibi Admin Konsolu'nu görmez; uyarıları kendi ekranlarına yönlenir */
const TEAM_LINK: Record<string, string | null> = { claim: 'p_disruptions', contract: null, a_planning: 'critical_path', phrs: 'site_activity' }

/**
 * Proje açılınca gelen karşılama ekranı: genel bilgi, tutarlar, ilerleme eğrisi ve dikkat isteyen konular.
 */
export function Home({ onGo, persona }: { onGo: (k: string) => void; persona: Persona }) {
  const menu = menuFor(persona)
  const [showDocs, setShowDocs] = useState(false)
  const { spi, cpi, actual, planned } = evm()
  const fromEmployer = ipcs.reduce((a, i) => a + i.gross, 0)
  const toSubs = subcontracts.reduce((a, s) => a + s.done, 0)
  const purchases = (costLines.find((c) => c.name === 'Malzeme')?.actual ?? 0) + 1_100_000
  const stock = 640_000
  const slip = Math.round((new Date(prj.forecastFinish).getTime() - new Date(prj.plannedFinish).getTime()) / 86_400_000)

  /** Dikkat isteyen konular — alt modüllerden otomatik düşer */
  const allAlerts: { tone: 'crit' | 'warn'; title: string; body: string; go: string }[] = [
    ...claims.filter((c) => !c.noticed).map((c) => ({
      tone: 'crit' as const, title: `${c.no} bildirim süresi: ${daysTo(c.noticeDue)} gün kaldı`,
      body: `${c.title}. Son gün ${date(c.noticeDue)}; kaçırılırsa hak talebi düşer.`, go: 'claim',
    })),
    ...contractMatches.filter((m) => m.subQty > m.mainQty || m.subPrice > m.mainPrice).slice(0, 2).map((m) => ({
      tone: 'warn' as const, title: `Kontrat farkı: ${m.item}`,
      body: `İşverenle ${m.mainQty.toLocaleString('tr-TR')} ${m.unit} × ${m.mainPrice} EUR; ${m.sub} ile ${m.subQty.toLocaleString('tr-TR')} ${m.unit} × ${m.subPrice} EUR.`,
      go: 'contract',
    })),
    { tone: 'crit', title: `Kritik yol: ${criticalPath[0].name}`, body: `${criticalPath[0].state}. Bitiş öngörüsü ${slip} gün kaydı.`, go: 'a_planning' },
    ...productivity.filter((p) => p.planRate / p.actualRate < 0.85).map((p) => ({
      tone: 'warn' as const, title: `Verim düşük: ${p.item}`,
      body: `Planlanan ${p.planRate} inxsa/${p.unit}, gerçekleşen ${p.actualRate}. Verim %${Math.round((p.planRate / p.actualRate) * 100)}.`,
      go: 'phrs',
    })),
  ]
  const alerts = persona === 'patron'
    ? allAlerts
    : allAlerts.filter((a) => TEAM_LINK[a.go] !== null).map((a) => ({ ...a, go: TEAM_LINK[a.go] ?? a.go }))

  const fmt = (v: number) => v.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <>
      <PageHead
        title="Home"
        note="Projenin genel bilgisi, tutarları ve ilerlemesi. Buradaki her sayı alt modüllerden (Progress, Planning, IPC, Procurement…) gelir; uyarılara ve modül kutularına tıklayınca ilgili ekran açılır."
        right={<Btn onClick={() => setShowDocs(true)} title="İhale ve proje dönemi doküman setleri">Doküman setleri</Btn>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Fiziksel ilerleme" value={pct(actual)} sub={`Planlanan ${pct(planned, 1)}`} tone="accent"
          help="Sahada onaylanan imalat miktarlarının metraj ağırlığıyla toplamı. Planlanan değer işverenle mutabık programdan gelir." />
        <Kpi label="Sözleşme bedeli" value={moneyShort(prj.contractValue + prj.approvedChange, prj.currency)}
          sub={`Değişiklik emri dâhil (+${moneyShort(prj.approvedChange, prj.currency)})`} />
        <Kpi label="İşverenden hakediş" value={moneyShort(fromEmployer, prj.currency)} sub={`Gross · ${ipcs.length} hakediş`}
          help="İşverene kesilen hakedişlerin kesintiler öncesi (gross) toplamı." />
        <Kpi label="Alt yükleniciye hakediş" value={moneyShort(toSubs, prj.currency)} sub={`Gross · ${subcontracts.length} alt yüklenici`}
          help="Alt yüklenicilere kesilen hakedişlerin gross toplamı." />
        <Kpi label="Malzeme ve hizmet alımı" value={moneyShort(purchases, prj.currency)} sub="Siparişi verilen alımlar"
          help="Satın alınan malzeme ve hizmetlerin toplamı." />
        {PROCUREMENT_PACKAGE
          ? <Kpi label="Depo tutarı" value={moneyShort(stock, prj.currency)} sub="Sahada ve depoda stok"
            help="Procurement paketi alındığında aktif olur: depodaki malzemenin güncel değeri." />
          : <Kpi label="Depo tutarı" value="—" sub="Procurement paketiyle açılır" />}
      </div>

      <Card title="İlerleme eğrisi" help="Planlanan (kesikli) ve gerçekleşen kümülatif fiziksel ilerleme. Üzerine gelince ay ay değer ve sapma görünür. SPI program, CPI maliyet performansıdır; 1’in altı gerideyiz / bütçe aşılıyor demektir."
        right={<Legend items={[{ label: 'Gerçekleşen', color: 'var(--series-1)' }, { label: 'Planlanan', color: 'var(--series-2)', dashed: true }]} />}>
        <div className="mb-3 flex flex-wrap items-stretch gap-2">
          {[
            { l: 'SPI · program', v: fmt(spi), tone: spi >= 1 ? 'ok' : spi >= 0.95 ? 'warn' : 'crit' },
            { l: 'CPI · maliyet', v: fmt(cpi), tone: cpi >= 1 ? 'ok' : cpi >= 0.95 ? 'warn' : 'crit' },
            { l: 'Sapma', v: `${(actual - planned).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} puan`, tone: 'crit' },
            { l: 'Öngörülen bitiş', v: `${date(prj.forecastFinish)} (+${slip} gün)`, tone: 'warn' },
          ].map((x) => (
            <div key={x.l} className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5">
              <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--faint)]">{x.l}</div>
              <div className="text-[15px] font-bold tnum" style={{ color: `var(--${x.tone})` }}>{x.v}</div>
            </div>
          ))}
        </div>
        <SCurve plan={plannedCum} actual={actualCum} labels={plannedCum.map((_, i) => monthName(i + 1))} today={prj.today} height={250} />
      </Card>

      <Card title={`Dikkat isteyen konular (${alerts.length})`} help="Alt modüllerden otomatik düşen uyarılar: yaklaşan bildirim süreleri, ana kontrat ile taşeron kontratı arasındaki farklar, kritik yol gecikmeleri, verim kayıpları." pad={false}>
        <div className="grid grid-cols-1 md:grid-cols-2">
          {alerts.map((a, i) => (
            <button key={i} onClick={() => onGo(a.go)}
              className="flex gap-2.5 border-b border-[var(--border)] px-4 py-2.5 text-left hover:bg-[var(--surface-2)] md:[&:nth-child(odd)]:border-r">
              <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" style={{ background: `var(--${a.tone})` }} />
              <span className="min-w-0">
                <span className="block text-[12.5px] font-semibold text-[var(--ink)]">{a.title}</span>
                <span className="block text-[11.5px] leading-snug text-[var(--muted)]">{a.body}</span>
              </span>
            </button>
          ))}
        </div>
      </Card>

      <Card title="Modüller" help="Proje dönemi modülleri. Soluk olanların kurgusu yazıldı, ekranları sıradaki adımlarda çizilecek.">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
          {menu.map((g) => {
            const ready = g.ready || g.items.some((i) => i.ready)
            return (
              <button key={g.key} onClick={() => onGo(g.items[0]?.key ?? g.key)}
                className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-left transition-colors hover:border-[var(--accent)]">
                <div className="text-[12.5px] font-semibold" style={{ color: ready ? 'var(--ink)' : 'var(--faint)' }}>{g.label}</div>
                <div className="mt-0.5 text-[11px] text-[var(--faint)]">{g.items.length ? `${g.items.length} ekran` : 'tek ekran'}{ready ? ' · hazır' : ''}</div>
              </button>
            )
          })}
        </div>
      </Card>

      {showDocs && <DocSetsModal persona={persona} onClose={() => setShowDocs(false)} />}
    </>
  )
}

/**
 * Doküman setleri — gözden uzak, pop-up içinde.
 * Set 1 ihale dokümanları (kilitli), Set 2 proje dönemi dokümanları (Set 1 ile karşılaştırılır),
 * Set 3 işverenle yeni anlaşma olunca açılır. Doküman eklemeyi yalnızca yetkili kullanıcılar yapar.
 */
function DocSetsModal({ persona, onClose }: { persona: Persona; onClose: () => void }) {
  const [target, setTarget] = useState<string | null>(null)
  const canAdd = persona === 'patron'
  return (
    <Modal title="Doküman setleri" wide onClose={onClose}
      note="İhale modülünde analiz edilip kilitlenen dokümanlar “projeye aktar” ile Set 1’e gelir. Proje dönemindeki yeni dokümanlar Set 2’ye yüklenir ve Set 1 ile karşılaştırılır. Set 2 işverenle yeni bir anlaşmayla kabul edilirse Set 3 açılır ve Set 1+2 ile karşılaştırılır."
      footer={<>
        <span className="text-[11.5px] text-[var(--faint)]">{canAdd ? 'Doküman eklemeye yetkilisiniz' : 'Doküman eklemeyi yalnızca yetkili kullanıcılar yapabilir'}</span>
        <span className="ml-auto"><Btn onClick={onClose}>Kapat</Btn></span>
      </>}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {docSets.map((s) => (
          <div key={s.set} className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3"
            style={s.docs === 0 ? { borderStyle: 'dashed' } : undefined}>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-[var(--ink)]">{s.set}</span>
              <span className="ml-auto">{s.locked ? <Badge tone="neutral">🔒 kilitli</Badge> : s.docs === 0 ? <Badge tone="neutral">kapalı</Badge> : <Badge tone="accent">açık</Badge>}</span>
            </div>
            <div className="mt-0.5 text-[12px] text-[var(--muted)]">{s.title}</div>
            <div className="mt-2 text-[22px] font-bold leading-none text-[var(--ink)] tnum">{s.docs}<span className="ml-1 text-[12px] font-normal text-[var(--muted)]">doküman</span></div>
            <div className="mt-1.5 flex-1 text-[11.5px] text-[var(--muted)]">{s.note}{s.date ? ` · ${date(s.date)}` : ''}</div>
            {s.set !== 'Set 3' && (
              <div className="mt-2.5">
                <Btn small disabled={!canAdd} onClick={() => setTarget(s.set)}>+ {s.set}’e doküman ekle</Btn>
              </div>
            )}
          </div>
        ))}
      </div>
      {target && (
        <div className="mt-3 rounded-lg border-2 border-dashed border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-5 text-center text-[12.5px] text-[var(--muted)]">
          📄 {target} için dosyaları buraya sürükleyin — yüklenen dosya analiz edilir ve {target === 'Set 2' ? 'Set 1 ile karşılaştırılır' : 'kilitlenir'}.
        </div>
      )}
    </Modal>
  )
}
