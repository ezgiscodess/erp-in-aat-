import { Badge, Card, Kpi, PageHead } from '../../components/ui'
import { date, moneyShort, pct } from '../../lib/format'
import { Gauge, Legend, SCurve } from '../charts'
import {
  actualCum, claims, contractMatches, criticalPath, docSets, ipcs, monthName, plannedCum, prj, productivity,
} from '../data'
import { menu } from '../menu'

const TODAY = new Date('2026-09-26')
const daysTo = (iso: string) => Math.round((new Date(iso).getTime() - TODAY.getTime()) / 86_400_000)

/**
 * Proje açılınca gelen karşılama ekranı: genel bilgi, ilerleme, dikkat isteyen konular ve doküman setleri.
 */
export function Home({ onGo }: { onGo: (k: string) => void }) {
  const actual = actualCum[prj.today - 1]
  const planned = plannedCum[prj.today - 1]
  const spi = actual / planned
  const cpi = 0.94
  const certified = ipcs.reduce((a, i) => a + i.gross, 0)
  const slip = Math.round((new Date(prj.forecastFinish).getTime() - new Date(prj.plannedFinish).getTime()) / 86_400_000)

  /** Dikkat isteyen konular — alt modüllerden otomatik düşer */
  const alerts: { tone: 'crit' | 'warn'; title: string; body: string; go: string }[] = [
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

  return (
    <>
      <PageHead
        title="Home"
        note="Projenin genel bilgisi ve ilerlemesi. Buradaki her sayı alt modüllerden (Progress, Planning, IPC…) gelir; uyarılara ve modül kutularına tıklayınca ilgili ekran açılır."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Fiziksel ilerleme" value={pct(actual)} sub={`Planlanan ${pct(planned)} · ${(actual - planned).toLocaleString('tr-TR', { minimumFractionDigits: 1 })} puan`} tone="accent"
          help="Sahada onaylanan imalat miktarlarının metraj ağırlığıyla toplamı. Planlanan değer işverenle mutabık programdan gelir." />
        <Kpi label="Sözleşme bedeli" value={moneyShort(prj.contractValue + prj.approvedChange, prj.currency)}
          sub={`Ana ${moneyShort(prj.contractValue, prj.currency)} + değişiklik ${moneyShort(prj.approvedChange, prj.currency)}`} />
        <Kpi label="Hakediş" value={moneyShort(certified, prj.currency)} sub={`${ipcs.length} hakediş · bedelin ${pct((certified / prj.contractValue) * 100)}’i`}
          help="İşverene kesilen hakedişlerin brüt toplamı. Detayı Admin Konsolu › IPC’de." />
        <Kpi label="Bitiş" value={date(prj.plannedFinish)} sub={`Öngörü ${date(prj.forecastFinish)} (+${slip} gün)`} tone="warn"
          help="Mevcut ilerleme hızıyla (SPI) öngörülen bitiş tarihi. Kritik yoldaki gecikmeler bu tarihi öteler." />
        <Gauge label="SPI · program" value={spi} help="Kazanılmış değer ÷ planlanan değer. 1’in altı programın gerisinde olunduğunu gösterir." />
        <Gauge label="CPI · maliyet" value={cpi} help="Kazanılmış değer ÷ gerçekleşen maliyet. 1’in altı bütçenin aşıldığını gösterir." />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <Card title="İlerleme eğrisi" help="Planlanan (kesikli) ve gerçekleşen kümülatif fiziksel ilerleme. Üzerine gelince ay ay değer ve sapma görünür."
            right={<Legend items={[{ label: 'Gerçekleşen', color: 'var(--series-1)' }, { label: 'Planlanan', color: 'var(--series-2)', dashed: true }]} />}>
            <SCurve plan={plannedCum} actual={actualCum} labels={plannedCum.map((_, i) => monthName(i + 1))} today={prj.today} />
          </Card>
        </div>

        <div className="xl:col-span-4">
          <Card title={`Dikkat isteyen konular (${alerts.length})`} help="Alt modüllerden otomatik düşen uyarılar: yaklaşan bildirim süreleri, ana kontrat ile taşeron kontratı arasındaki farklar, kritik yol gecikmeleri, verim kayıpları." pad={false}>
            <div className="flex flex-col">
              {alerts.map((a, i) => (
                <button key={i} onClick={() => onGo(a.go)}
                  className="flex gap-2.5 border-b border-[var(--border)] px-4 py-2.5 text-left last:border-0 hover:bg-[var(--surface-2)]">
                  <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" style={{ background: `var(--${a.tone})` }} />
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-semibold text-[var(--ink)]">{a.title}</span>
                    <span className="block text-[11.5px] leading-snug text-[var(--muted)]">{a.body}</span>
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card title="Doküman setleri" help="İhale modülünde analiz edilip kilitlenen dokümanlar “projeye aktar” ile Set 1’e gelir. Proje dönemindeki yeni dokümanlar Set 2’ye yüklenir ve Set 1 ile karşılaştırılır. Set 2 işverenle yeni bir anlaşmayla kabul edilirse Set 3 açılır ve Set 1+2 ile karşılaştırılır.">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {docSets.map((s) => (
            <div key={s.set} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3"
              style={s.docs === 0 ? { borderStyle: 'dashed' } : undefined}>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-[var(--ink)]">{s.set}</span>
                <span className="text-[12.5px] text-[var(--muted)]">{s.title}</span>
                <span className="ml-auto">{s.locked ? <Badge tone="neutral">🔒 kilitli</Badge> : s.docs === 0 ? <Badge tone="neutral">kapalı</Badge> : <Badge tone="accent">açık</Badge>}</span>
              </div>
              <div className="mt-2 text-[22px] font-bold leading-none text-[var(--ink)] tnum">{s.docs}<span className="ml-1 text-[12px] font-normal text-[var(--muted)]">doküman</span></div>
              <div className="mt-1.5 text-[11.5px] text-[var(--muted)]">{s.note}{s.date ? ` · ${date(s.date)}` : ''}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Modüller" help="Proje dönemi modülleri. Soluk olanların kurgusu yazıldı, ekranları sıradaki adımlarda çizilecek.">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
          {menu.map((g) => {
            const ready = g.items.some((i) => i.ready)
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
    </>
  )
}
