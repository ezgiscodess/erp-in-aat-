import { Card, ExportButtons, Kpi, PageHead, Table, Td, Th } from '../../components/ui'
import { moneyShort, num, pct } from '../../lib/format'
import { Legend, MonthColumns, PairBars, StackBar } from '../charts'
import { costLines, evm, prj, productivity } from '../data'
import { weeklyOutput } from '../progressData'

/**
 * Budget: fiyat içeren bütün analizler burada durur (planlama ve raporlama ekranlarında fiyat gösterilmez).
 * Maliyet performansı, haftalık üretim değeri, verimlilik ve imalat / malzeme oranları.
 */

const C = prj.currency
const m = (v: number) => moneyShort(v, C)

/** İş gruplarına göre imalat (işçilik + taşeron) ve malzeme maliyeti */
const groupCosts = [
  { group: 'Kaba inşaat', labor: 1_900_000, material: 2_600_000 },
  { group: 'Çelik konstrüksiyon', labor: 2_800_000, material: 3_900_000 },
  { group: 'Çatı ve cephe', labor: 900_000, material: 1_300_000 },
  { group: 'Mekanik tesisat', labor: 800_000, material: 900_000 },
  { group: 'Elektrik', labor: 500_000, material: 700_000 },
  { group: 'Saha ve zemin', labor: 600_000, material: 800_000 },
  { group: 'İnce işler', labor: 700_000, material: 500_000 },
]

/** Kalem bazında birim maliyet: plan ve gerçekleşen (EUR / birim) ile birim insan-saat */
const unitCosts: Record<string, { plan: number; actual: number }> = {
  'Tuğla bölme duvar': { plan: 16, actual: 19.4 },
  'Çelik montaj': { plan: 2_150, actual: 2_290 },
  'Sandviç panel montajı': { plan: 38, actual: 40.1 },
  'Betonarme (kalıp + donatı + beton)': { plan: 182, actual: 188 },
  'Sıva ve boya': { plan: 11.5, actual: 11.7 },
  'Epoksi zemin': { plan: 14, actual: 13.4 },
}

export function BudgetDetail() {
  const { bac, ac, ev, cpi } = evm()
  const eac = costLines.reduce((a, c) => a + c.forecast, 0)
  const revenue = prj.contractValue + prj.approvedChange
  const weekly = weeklyOutput.map((w) => ({ label: w.w, plan: Math.round((w.plan / 100) * bac / 1000), actual: Math.round((w.actual / 100) * bac / 1000) }))

  return (
    <>
      <PageHead title="Budget"
        note="Maliyet performansı ve verimlilik. Planlama ve raporlama ekranlarında fiyat gösterilmez; tutar içeren bütün analizler burada durur. Birim fiyatlar sözleşme ve birim fiyat havuzundan, gerçekleşen tutarlar hakediş ve satın alma kayıtlarından gelir."
        right={<ExportButtons />} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Bütçe (BAC)" value={m(bac)} sub="İşin tamamı" />
        <Kpi label="Kazanılmış değer (EV)" value={m(ev)} sub="İlerleme × bütçe" tone="accent"
          help="Yapılan işin bütçedeki karşılığı: gerçekleşen ilerleme × bütçe." />
        <Kpi label="Harcanan (AC)" value={m(ac)} sub="Bugüne kadar" />
        <Kpi label="CPI" value={cpi.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sub="Kazanılmış değer ÷ harcanan" tone={cpi >= 1 ? 'ok' : 'crit'} />
        <Kpi label="Öngörülen maliyet (EAC)" value={m(eac)} sub={`Bütçeyi ${m(eac - bac)} aşıyor`} tone="warn" />
        <Kpi label="Öngörülen kâr" value={m(revenue - eac)} sub={pct(((revenue - eac) / revenue) * 100, 1)} tone="warn" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Haftalık üretim değeri (bin EUR)" help="Onaylanmış saha kayıtlarının iş değeri: haftalık ilerleme × bütçe. Progress ekranındaki ilerleme puanının tutar karşılığıdır."
          right={<Legend items={[{ label: 'Gerçekleşen', color: 'var(--series-1)' }, { label: 'Planlanan', color: 'var(--series-2)' }]} />}>
          <MonthColumns data={weekly} format={(v) => `${num(v)} bin EUR`} height={170} />
        </Card>
        <Card title="Kalem bazında maliyet ve öngörü" help="Açık çubuk bütçe, koyu çubuk tamamlanınca öngörülen maliyet."
          right={<Legend items={[{ label: 'Öngörülen', color: 'var(--series-1)' }, { label: 'Bütçe', color: 'var(--series-2)' }]} />}>
          <PairBars rows={costLines.map((c) => ({ label: c.name, plan: c.budget, actual: c.forecast }))} format={m} />
        </Card>
      </div>

      <Card title="Verimlilik" help="Kalem bazında planlanan ve gerçekleşen birim maliyet ile birim insan-saat. Birim maliyet farkı × kalan miktar, işin sonuna kadar oluşacak ek maliyeti verir." pad={false}>
        <Table head={<tr>
          <Th w={220}>Kalem</Th><Th>Birim</Th><Th right>Plan birim maliyet</Th><Th right>Gerçek birim maliyet</Th><Th right>Fark</Th>
          <Th right>Plan inxsa / birim</Th><Th right>Gerçek inxsa / birim</Th><Th right>Verim</Th><Th right>Kalan işte ek maliyet</Th>
        </tr>}>
          {productivity.map((p) => {
            const u = unitCosts[p.item]
            const diff = u.actual - u.plan
            const eff = p.planRate / p.actualRate
            return (
              <tr key={p.item} className="hover:bg-[var(--surface-2)]">
                <Td><span className="text-[12.5px] text-[var(--ink)]">{p.item}</span></Td>
                <Td nowrap>{p.unit}</Td>
                <Td right>{num(u.plan, u.plan < 100 ? 2 : 0)}</Td>
                <Td right>{num(u.actual, u.actual < 100 ? 2 : 0)}</Td>
                <Td right><span className="font-semibold" style={{ color: diff > 0 ? 'var(--crit)' : 'var(--ok)' }}>{diff > 0 ? '+' : ''}{num(diff, Math.abs(diff) < 100 ? 2 : 0)}</span></Td>
                <Td right>{num(p.planRate, 2)}</Td>
                <Td right>{num(p.actualRate, 2)}</Td>
                <Td right><span className="font-semibold" style={{ color: eff >= 0.95 ? 'var(--ok)' : eff >= 0.85 ? 'var(--warn)' : 'var(--crit)' }}>%{Math.round(eff * 100)}</span></Td>
                <Td right>{diff > 0 ? m(diff * (p.total - p.done)) : '—'}</Td>
              </tr>
            )
          })}
        </Table>
      </Card>

      <Card title="İmalat / malzeme oranı" help="Her iş grubunda maliyetin ne kadarının imalata (işçilik + taşeron), ne kadarının malzemeye gittiği. Oranın bütçedekinden sapması, fiyatlandırmanın gözden geçirilmesi gereken yeri gösterir."
        right={<Legend items={[{ label: 'İmalat', color: 'var(--series-1)' }, { label: 'Malzeme', color: 'var(--series-2)' }]} />}>
        <div className="flex flex-col gap-3">
          {groupCosts.map((g) => {
            const total = g.labor + g.material
            return (
              <div key={g.group} className="grid grid-cols-[minmax(120px,190px)_1fr_auto] items-center gap-3">
                <span className="truncate text-[12px] text-[var(--ink)]">{g.group}</span>
                <StackBar height={10} parts={[
                  { label: 'İmalat', value: g.labor, color: 'var(--series-1)' },
                  { label: 'Malzeme', value: g.material, color: 'var(--series-2)' },
                ]} />
                <span className="w-[210px] text-right text-[11.5px] text-[var(--muted)] tnum">
                  imalat %{Math.round((g.labor / total) * 100)} · malzeme %{Math.round((g.material / total) * 100)} · {m(total)}
                </span>
              </div>
            )
          })}
        </div>
      </Card>
    </>
  )
}
