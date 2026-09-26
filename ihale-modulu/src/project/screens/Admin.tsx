import { Badge, Bar, Card, ExportButtons, Kpi, PageHead, StateBadge, Table, Td, Th } from '../../components/ui'
import { date, money, moneyShort, num, pct } from '../../lib/format'
import { Gauge, Legend, MonthColumns, PairBars, SCurve, StackBar } from '../charts'
import {
  actualCum, changeOrders, claims, contractMatches, costLines, criticalPath, dailyReport, disruptions, ipcs, machines,
  monthName, monthlyPhrs, plannedCum, prj, productivity, subcontracts, trades,
} from '../data'

/**
 * Admin Konsolu: üst yöneticinin alt modüllerden gelen verinin en özet hâlini gördüğü ekranlar.
 * Detaylı veri girişi ve düzenleme teknik kullanıcının alt modüllerindedir; burada yalnızca görülür.
 */

const C = prj.currency
const m = (v: number) => moneyShort(v, C)
const TODAY = new Date('2026-09-26')
const daysTo = (iso: string) => Math.round((new Date(iso).getTime() - TODAY.getTime()) / 86_400_000)
const PLAN_ACTUAL = [{ label: 'Gerçekleşen', color: 'var(--series-1)' }, { label: 'Planlanan', color: 'var(--series-2)', dashed: true }]

function Head({ title, note }: { title: string; note: string }) {
  return <PageHead title={`Admin Konsolu · ${title}`} note={note} right={<ExportButtons />} />
}

/* ---------------- Budget ---------------- */

export function AdminBudget() {
  const bac = costLines.reduce((a, c) => a + c.budget, 0)
  const ac = costLines.reduce((a, c) => a + c.actual, 0)
  const eac = costLines.reduce((a, c) => a + c.forecast, 0)
  const revenue = prj.contractValue + prj.approvedChange
  const planMargin = prj.contractValue - bac
  const fcMargin = revenue - eac

  return (
    <>
      <Head title="Budget" note="Birim fiyatlar ve girilen verilere göre tahmini maliyet (estimated cost). Detayı finans, planlama ve bütçe alt modüllerinde; burada yönetici için özet ve görsel hâli durur." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Bütçe (BAC)" value={m(bac)} sub="Metraj × birim fiyat" help="Budget at completion: işin tamamı için onaylanan maliyet bütçesi." />
        <Kpi label="Gerçekleşen (AC)" value={m(ac)} sub={`Bütçenin ${pct((ac / bac) * 100)}’i`} />
        <Kpi label="Öngörülen (EAC)" value={m(eac)} sub={`Bütçeyi ${m(eac - bac)} aşıyor`} tone="crit" help="Estimate at completion: bugünkü gidişle işin sonunda oluşacak toplam maliyet." />
        <Kpi label="Planlanan kâr" value={m(planMargin)} sub={pct((planMargin / prj.contractValue) * 100, 1)} />
        <Kpi label="Öngörülen kâr" value={m(fcMargin)} sub={`${pct((fcMargin / revenue) * 100, 1)} · değişiklikler dâhil`} tone="warn" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Kalem bazında bütçe ve öngörü" help="Açık çubuk bütçe, koyu çubuk tamamlanınca öngörülen maliyet. Kırmızı ok bütçe aşımını gösterir."
          right={<Legend items={[{ label: 'Öngörülen', color: 'var(--series-1)' }, { label: 'Bütçe', color: 'var(--series-2)' }]} />}>
          <PairBars rows={costLines.map((c) => ({ label: c.name, plan: c.budget, actual: c.forecast }))} format={m} />
        </Card>
        <Card title="Maliyet dağılımı" help="Gerçekleşen maliyetin kalemlere dağılımı ve bütçenin ne kadarının sözleşmeye bağlandığı (committed).">
          <div className="flex flex-col gap-3">
            {costLines.map((c) => (
              <div key={c.name}>
                <div className="mb-1 flex items-center text-[12px]">
                  <span className="text-[var(--ink)]">{c.name}</span>
                  <span className="ml-auto text-[var(--muted)] tnum">harcanan {m(c.actual)} · bağlanan {m(c.committed)}</span>
                </div>
                <Bar value={(c.actual / c.budget) * 100} tone={c.committed > c.budget ? 'crit' : 'accent'} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Bütçe tablosu" pad={false}>
        <Table head={<tr><Th w={200}>Kalem</Th><Th right>Bütçe</Th><Th right>Bağlanan</Th><Th right>Gerçekleşen</Th><Th right>Öngörülen</Th><Th right>Sapma</Th></tr>}>
          {costLines.map((c) => (
            <tr key={c.name} className="hover:bg-[var(--surface-2)]">
              <Td>{c.name}</Td>
              <Td right>{num(c.budget)}</Td>
              <Td right>{num(c.committed)}</Td>
              <Td right>{num(c.actual)}</Td>
              <Td right>{num(c.forecast)}</Td>
              <Td right><span className="font-semibold" style={{ color: c.forecast > c.budget ? 'var(--crit)' : 'var(--ok)' }}>{c.forecast > c.budget ? '+' : ''}{num(c.forecast - c.budget)}</span></Td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  )
}

/* ---------------- IPC (hakedişler) ---------------- */

export function AdminIpc() {
  const gross = ipcs.reduce((a, i) => a + i.gross, 0)
  const paid = ipcs.filter((i) => i.state === 'Ödendi').reduce((a, i) => a + i.net, 0)
  const pending = ipcs.filter((i) => i.state !== 'Ödendi').reduce((a, i) => a + i.net, 0)
  const recovered = ipcs.reduce((a, i) => a + i.advanceRecovery, 0)
  const retention = ipcs.reduce((a, i) => a + i.retention, 0)
  const monthly = ipcs.slice(-12).map((i) => ({
    label: monthName(i.month),
    plan: Math.round(((plannedCum[i.month - 1] - (plannedCum[i.month - 2] ?? 0)) * prj.contractValue) / 100),
    actual: i.gross,
  }))
  const subPaid = subcontracts.reduce((a, s) => a + s.paid, 0)
  const subDone = subcontracts.reduce((a, s) => a + s.done, 0)

  return (
    <>
      <Head title="IPC" note="İşverenle yapılan ana kontrat ve metraj tutarlarına göre alınan periyodik ödemeler (Interim Payment Certificate — ara hakediş) ile alt yüklenicilere verilen işler, miktarlar ve ödemeler." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Kesilen hakediş" value={m(gross)} sub={`${ipcs.length} hakediş · brüt`} />
        <Kpi label="Tahsil edilen" value={m(paid)} sub="Net, kesintiler sonrası" tone="ok" />
        <Kpi label="Bekleyen" value={m(pending)} sub="Onaylı + incelemede" tone="warn" />
        <Kpi label="Avans mahsubu" value={m(recovered)} sub={`Verilen ${m(prj.advance)} · kalan ${m(prj.advance - recovered)}`} />
        <Kpi label="Teminat kesintisi" value={m(retention)} sub={`%${prj.retentionRate * 100} · kabulde iade`} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <Card title="Aylık hakediş — planlanan ve kesilen" help="Planlanan: işverenle mutabık programın o ayki payı × sözleşme bedeli. Kesilen: onaylanan hakedişin brüt tutarı."
            right={<Legend items={[{ label: 'Kesilen', color: 'var(--series-1)' }, { label: 'Planlanan', color: 'var(--series-2)' }]} />}>
            <MonthColumns data={monthly} format={m} />
          </Card>
        </div>
        <div className="xl:col-span-5">
          <Card title="Son hakedişler" pad={false}>
            <Table head={<tr><Th>No</Th><Th>Ay</Th><Th right>Brüt</Th><Th right>Net</Th><Th>Durum</Th></tr>}>
              {ipcs.slice(-6).reverse().map((i) => (
                <tr key={i.no} className="hover:bg-[var(--surface-2)]">
                  <Td mono nowrap>IPC-{String(i.no).padStart(2, '0')}</Td>
                  <Td nowrap>{monthName(i.month)}</Td>
                  <Td right>{num(i.gross)}</Td>
                  <Td right>{num(i.net)}</Td>
                  <Td nowrap>
                    <StateBadge value={i.state} />
                    {i.lateDays && <div className="mt-0.5 text-[11px] text-[var(--crit)]">{i.lateDays} gün geç ödendi</div>}
                  </Td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
      </div>

      <Card title="Alt yüklenici ödemeleri" help="Alt yüklenicilere verilen işin tutarı, yapılan kısmı ve ödenen. Yapılan ile ödenen arasındaki fark alt yükleniciye olan borcumuzdur."
        right={<span className="text-[12px] text-[var(--muted)]">Yapılan {m(subDone)} · ödenen {m(subPaid)} · borç <b className="text-[var(--ink)]">{m(subDone - subPaid)}</b></span>} pad={false}>
        <Table head={<tr><Th w={170}>Alt yüklenici</Th><Th w={220}>Kapsam</Th><Th right>Sözleşme</Th><Th w={160}>Yapılan</Th><Th right>Ödenen</Th><Th right>Borç</Th></tr>}>
          {subcontracts.map((s) => (
            <tr key={s.name} className="hover:bg-[var(--surface-2)]">
              <Td><span className="font-medium text-[var(--ink)]">{s.name}</span></Td>
              <Td><span className="text-[12px] text-[var(--muted)]">{s.scope}</span></Td>
              <Td right>{num(s.value)}</Td>
              <Td>
                <div className="flex items-center gap-2">
                  <div className="w-20"><Bar value={(s.done / s.value) * 100} /></div>
                  <span className="text-[11.5px] text-[var(--muted)] tnum">%{Math.round((s.done / s.value) * 100)}</span>
                </div>
              </Td>
              <Td right>{num(s.paid)}</Td>
              <Td right><b>{num(s.done - s.paid)}</b></Td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  )
}

/* ---------------- Contract ---------------- */

export function AdminContract() {
  const paid = ipcs.filter((i) => i.state === 'Ödendi').reduce((a, i) => a + i.gross, 0)
  const waiting = ipcs.filter((i) => i.state !== 'Ödendi').reduce((a, i) => a + i.gross, 0)
  const total = prj.contractValue + prj.approvedChange
  const deductions = ipcs.reduce((a, i) => a + i.advanceRecovery + i.retention, 0)
  const subTotal = subcontracts.reduce((a, s) => a + s.value, 0)
  const diffs = contractMatches.filter((c) => c.subQty > c.mainQty || c.subPrice > c.mainPrice)

  return (
    <>
      <Head title="Contract" note="İşverenle ana kontrat (tutar, alınan, kalan, kesintiler, avans) ve alt yüklenici kontratlarının ana kontratla karşılaştırması. Aynı kalemde miktar veya birim fiyat farkı varsa sistem otomatik uyarır." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Ana kontrat" value={m(total)} sub={`${m(prj.contractValue)} + değişiklik ${m(prj.approvedChange)}`} />
        <Kpi label="Alınan" value={m(paid)} sub={pct((paid / total) * 100)} tone="ok" />
        <Kpi label="Kalan" value={m(total - paid - waiting)} sub={`Onay bekleyen ${m(waiting)}`} />
        <Kpi label="Kesintiler" value={m(deductions)} sub="Avans mahsubu + teminat" />
        <Kpi label="Taşere oranı" value={pct((subTotal / prj.contractValue) * 100)} sub={`${subcontracts.length} alt yüklenici · ${subcontracts.length} sözleşme · ${m(subTotal)}`} tone="accent"
          help="Ana kontratın alt yüklenicilere verilen kısmı." />
      </div>

      <Card title="Ana kontratın durumu" help="Sözleşme bedelinin alınan, onay bekleyen ve kalan kısımlara dağılımı.">
        <StackBar parts={[
          { label: 'Alınan', value: paid, color: 'var(--series-1)' },
          { label: 'Onay bekleyen', value: waiting, color: 'var(--series-2)' },
          { label: 'Kalan', value: total - paid - waiting, color: 'var(--surface-3)' },
        ]} />
        <div className="mt-2 flex flex-wrap gap-4 text-[12px] text-[var(--muted)]">
          <span><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--series-1)' }} />Alınan {m(paid)}</span>
          <span><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--series-2)' }} />Onay bekleyen {m(waiting)}</span>
          <span><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm border border-[var(--border-strong)]" style={{ background: 'var(--surface-3)' }} />Kalan {m(total - paid - waiting)}</span>
          <span className="ml-auto">Avans {m(prj.advance)} verildi · teminat %{prj.retentionRate * 100}</span>
        </div>
      </Card>

      {diffs.length > 0 && (
        <div className="rounded-lg border p-3" style={{ background: 'var(--crit-bg)', borderColor: 'var(--crit)' }}>
          <div className="text-[13px] font-semibold" style={{ color: 'var(--crit)' }}>Ana kontrat ile alt yüklenici kontratı arasında {diffs.length} fark</div>
          <ul className="mt-1.5 flex flex-col gap-1 text-[12.5px]" style={{ color: 'var(--crit)' }}>
            {diffs.map((d) => {
              const loss = d.subQty * d.subPrice - d.mainQty * d.mainPrice
              return (
                <li key={d.item}>• <b>{d.item}</b> — işverenle {num(d.mainQty)} {d.unit} × {num(d.mainPrice, 2)} EUR, {d.sub} ile {num(d.subQty)} {d.unit} × {num(d.subPrice, 2)} EUR · fark {m(loss)}</li>
              )
            })}
          </ul>
        </div>
      )}

      <Card title="Kalem karşılaştırması" help="Aynı iş kaleminin işverene verilen (ana kontrat) ve alt yükleniciye verilen hâli. Miktar fazlası veya birim fiyat farkı kırmızı işaretlenir." pad={false}>
        <Table head={<tr><Th w={190}>Kalem</Th><Th>Alt yüklenici</Th><Th right>Ana miktar</Th><Th right>Taşeron miktar</Th><Th right>Ana birim fiyat</Th><Th right>Taşeron birim fiyat</Th><Th right>Tutar farkı</Th></tr>}>
          {contractMatches.map((c) => {
            const qBad = c.subQty > c.mainQty
            const pBad = c.subPrice > c.mainPrice
            const diff = c.subQty * c.subPrice - c.mainQty * c.mainPrice
            return (
              <tr key={c.item} className="hover:bg-[var(--surface-2)]">
                <Td><span className="font-medium text-[var(--ink)]">{c.item}</span> <span className="text-[11px] text-[var(--faint)]">{c.unit}</span></Td>
                <Td nowrap><span className="text-[12px] text-[var(--muted)]">{c.sub}</span></Td>
                <Td right>{num(c.mainQty)}</Td>
                <Td right><span style={{ color: qBad ? 'var(--crit)' : undefined, fontWeight: qBad ? 600 : undefined }}>{num(c.subQty)}</span></Td>
                <Td right>{num(c.mainPrice, 2)}</Td>
                <Td right><span style={{ color: pBad ? 'var(--crit)' : undefined, fontWeight: pBad ? 600 : undefined }}>{num(c.subPrice, 2)}</span></Td>
                <Td right><span className="font-semibold" style={{ color: diff > 0 ? 'var(--crit)' : 'var(--ok)' }}>{diff > 0 ? '+' : ''}{num(diff)}</span></Td>
              </tr>
            )
          })}
        </Table>
      </Card>
    </>
  )
}

/* ---------------- Planning ---------------- */

export function AdminPlanning() {
  const actual = actualCum[prj.today - 1]
  const planned = plannedCum[prj.today - 1]
  return (
    <>
      <Head title="Planning" note="İşverenle mutabık kalınan program üzerinden ilerleme: girilen verilere göre işin olması gereken ilerlemesi, kritik hat ve önümüzdeki dönemin iş planı." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Gerçekleşen" value={pct(actual)} sub={`Planlanan ${pct(planned)}`} tone="accent" />
        <Gauge label="SPI" value={actual / planned} />
        <Gauge label="CPI" value={0.94} />
        <Kpi label="Öngörülen bitiş" value={date(prj.forecastFinish)} sub={`Sözleşme ${date(prj.plannedFinish)}`} tone="warn" />
        <Kpi label="4 haftalık plan" value="14 aktivite" sub="3’ü riskte" tone="warn" help="Lookahead: önümüzdeki 4 haftada başlaması veya bitmesi gereken aktiviteler." />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <Card title="İlerleme eğrisi" right={<Legend items={PLAN_ACTUAL} />}>
            <SCurve plan={plannedCum} actual={actualCum} labels={plannedCum.map((_, i) => monthName(i + 1))} today={prj.today} height={240} />
          </Card>
        </div>
        <div className="xl:col-span-5">
          <Card title="Kritik yol" help="Bolluğu (float) sıfır olan aktiviteler; herhangi birinin gecikmesi bitişi doğrudan öteler." pad={false}>
            <Table head={<tr><Th>Aktivite</Th><Th>Bitiş</Th><Th right>Bolluk</Th><Th>Durum</Th></tr>}>
              {criticalPath.map((c) => (
                <tr key={c.name} className="hover:bg-[var(--surface-2)]">
                  <Td><span className="text-[12.5px] text-[var(--ink)]">{c.name}</span></Td>
                  <Td nowrap>{date(c.finish)}</Td>
                  <Td right>{c.float} gün</Td>
                  <Td nowrap><Badge tone={c.state.startsWith('Gecikmede') ? 'crit' : c.state === 'Hedef' ? 'accent' : 'neutral'}>{c.state}</Badge></Td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
      </div>
    </>
  )
}

/* ---------------- Report ---------------- */

export function AdminReport() {
  const sent = [
    { kind: 'Günlük rapor', last: '2026-09-26 07:00', next: '2026-09-27 07:00', to: 'Proje ekibi (14)' },
    { kind: 'Haftalık rapor', last: '2026-09-22 09:00', next: '2026-09-29 09:00', to: 'Proje + merkez ofis (22)' },
    { kind: 'Aylık rapor', last: '2026-09-01 10:00', next: '2026-10-01 10:00', to: 'İşveren + merkez ofis (9)' },
    { kind: 'İşveren raporu', last: '2026-09-15 12:00', next: '2026-10-15 12:00', to: 'Anadolu Lojistik (4)' },
  ]
  return (
    <>
      <Head title="Report" note="Proje ekibinin ve işverenin ilerlemeyi gördüğü kısım: bir önceki günün imalatları; imalatın toplam miktarı ve bitiş tarihi. Raporlar belirlenen periyotlarda mail listesine otomatik gider." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Rapor tarihi" value={date(dailyReport.date)} sub={dailyReport.weather} />
        <Kpi label="Sahadaki personel" value={dailyReport.manpower} sub="Dün puantaja giren" />
        <Kpi label="Çalışan makine" value={dailyReport.machines} sub="Dün sahada" />
        <Kpi label="İmalat kalemi" value={dailyReport.items.length} sub="Dün veri girilen" />
      </div>
      <Card title={`Dünün imalatları · ${date(dailyReport.date)}`} help="Sahadan girilen ve şantiye şefi onayından geçen veriler. Satırdaki çubuk kalemin toplam miktarına göre ilerlemesidir." pad={false}>
        <Table head={<tr><Th w={260}>İmalat</Th><Th right>Dün</Th><Th right>Kümülatif</Th><Th right>Toplam</Th><Th w={160}>İlerleme</Th><Th>Bitiş</Th></tr>}>
          {dailyReport.items.map((i) => (
            <tr key={i.item} className="hover:bg-[var(--surface-2)]">
              <Td><span className="text-[12.5px] text-[var(--ink)]">{i.item}</span></Td>
              <Td right>{i.today ? `${num(i.today)} ${i.unit}` : '—'}</Td>
              <Td right>{num(i.cum)}</Td>
              <Td right>{num(i.total)} {i.unit}</Td>
              <Td>
                <div className="flex items-center gap-2">
                  <div className="w-20"><Bar value={(i.cum / i.total) * 100} /></div>
                  <span className="text-[11.5px] text-[var(--muted)] tnum">%{Math.round((i.cum / i.total) * 100)}</span>
                </div>
              </Td>
              <Td nowrap>{date(i.finish)}</Td>
            </tr>
          ))}
        </Table>
      </Card>
      <Card title="Otomatik gönderimler" pad={false}>
        <Table head={<tr><Th>Rapor</Th><Th>Son gönderim</Th><Th>Sonraki</Th><Th>Alıcılar</Th></tr>}>
          {sent.map((s) => (
            <tr key={s.kind} className="hover:bg-[var(--surface-2)]">
              <Td><span className="font-medium text-[var(--ink)]">{s.kind}</span></Td>
              <Td nowrap><span className="tnum">{s.last}</span></Td>
              <Td nowrap><span className="tnum">{s.next}</span></Td>
              <Td><span className="text-[12px] text-[var(--muted)]">{s.to}</span></Td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  )
}

/* ---------------- Phrs (insan-saat) ---------------- */

export function AdminPhrs() {
  const planHours = productivity.reduce((a, p) => a + p.planRate * p.done, 0)
  const actualHours = productivity.reduce((a, p) => a + p.actualRate * p.done, 0)
  const eff = planHours / actualHours
  return (
    <>
      <Head title="Phrs (manhour)" note="İnsan-saat (inxsa) fiyattan sonra projenin en önemli birimidir: malzeme birim fiyatla hesaplanır, ama 1 birim imalatın gerektirdiği insan gücü projeye göre değişir. Planlanan ve gerçekleşen birim inxsa karşılaştırılarak verimsizlik ölçülür." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Planlanan inxsa" value={num(planHours)} sub="Yapılan miktar × plan birim saat" />
        <Kpi label="Harcanan inxsa" value={num(actualHours)} sub="Puantajdan" />
        <Kpi label="Verim" value={pct(eff * 100)} sub={`${num(actualHours - planHours)} saat kayıp`} tone={eff >= 0.95 ? 'ok' : 'warn'}
          help="Planlanan saat ÷ harcanan saat. %100’ün altı aynı işi daha fazla saatte yaptığımızı gösterir." />
        <Kpi label="Kalan işte ek saat" value={num(productivity.reduce((a, p) => a + (p.actualRate - p.planRate) * (p.total - p.done), 0))}
          sub="Bu verimle gidilirse" tone="warn" />
      </div>

      <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[12.5px] leading-relaxed text-[var(--muted)]">
        <b className="text-[var(--ink)]">Örnek:</b> 100 m² duvar için 200 inxsa planlandı (1 m² = 2 inxsa), ama ekip 200 saatte 80 m² yaptı.
        Verim %80, kayıp %20; yani 200 saatlik iş 250 saatte bitecek. Aşağıdaki tablo bu hesabı her kalem için yapar.
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <Card title="Kalem bazında birim inxsa" pad={false}>
            <Table head={<tr><Th w={200}>Kalem</Th><Th right>Plan / birim</Th><Th right>Gerçek / birim</Th><Th right>Yapılan</Th><Th w={130}>Verim</Th></tr>}>
              {productivity.map((p) => {
                const e = p.planRate / p.actualRate
                return (
                  <tr key={p.item} className="hover:bg-[var(--surface-2)]">
                    <Td><span className="text-[12.5px] text-[var(--ink)]">{p.item}</span></Td>
                    <Td right>{num(p.planRate, 2)}</Td>
                    <Td right>{num(p.actualRate, 2)}</Td>
                    <Td right>{num(p.done)} {p.unit}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="w-16"><Bar value={Math.min(100, e * 100)} tone={e >= 0.95 ? 'ok' : e >= 0.85 ? 'warn' : 'crit'} /></div>
                        <span className="text-[11.5px] font-semibold tnum" style={{ color: e >= 0.95 ? 'var(--ok)' : e >= 0.85 ? 'var(--warn)' : 'var(--crit)' }}>%{Math.round(e * 100)}</span>
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </Table>
          </Card>
        </div>
        <div className="xl:col-span-5">
          <Card title="Aylık insan-saat (bin)" right={<Legend items={[{ label: 'Harcanan', color: 'var(--series-1)' }, { label: 'Planlanan', color: 'var(--series-2)' }]} />}>
            <MonthColumns data={monthlyPhrs.map((x) => ({ label: monthName(x.m), plan: x.plan, actual: x.actual }))} format={(v) => `${num(v)} bin saat`} />
          </Card>
        </div>
      </div>
    </>
  )
}

/* ---------------- Personel ---------------- */

export function AdminPersonel() {
  const plan = trades.reduce((a, t) => a + t.plan, 0)
  const actual = trades.reduce((a, t) => a + t.actual, 0)
  return (
    <>
      <Head title="Personel" note="Meslek gruplarına göre planlanan ve sahadaki kadro. Eksik kadro programı, fazla kadro maliyeti etkiler." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Planlanan kadro" value={plan} />
        <Kpi label="Sahadaki kadro" value={actual} sub={`${actual - plan > 0 ? '+' : ''}${actual - plan} kişi`} tone={actual < plan ? 'warn' : 'neutral'} />
        <Kpi label="Eksik grup" value={trades.filter((t) => t.actual < t.plan).length} sub="Plandan az" tone="warn" />
        <Kpi label="Fazla grup" value={trades.filter((t) => t.actual > t.plan).length} sub="Plandan çok" />
      </div>
      <Card title="Meslek gruplarına göre kadro" help="Açık çubuk planlanan, koyu çubuk sahadaki kişi sayısı. Kırmızı ok plandan eksik olan grupları gösterir."
        right={<Legend items={[{ label: 'Sahada', color: 'var(--series-1)' }, { label: 'Planlanan', color: 'var(--series-2)' }]} />}>
        <PairBars rows={trades.map((t) => ({ label: t.trade, plan: t.plan, actual: t.actual }))} format={(v) => `${v} kişi`} worseWhen="lower" />
      </Card>
    </>
  )
}

/* ---------------- Makine-ekipman ---------------- */

export function AdminMachinery() {
  const count = machines.reduce((a, x) => a + x.count, 0)
  const plan = machines.reduce((a, x) => a + x.planHours, 0)
  const actual = machines.reduce((a, x) => a + x.actualHours, 0)
  const idle = machines.reduce((a, x) => a + x.idleHours, 0)
  const spend = machines.reduce((a, x) => a + x.fuel + x.maintenance, 0)
  return (
    <>
      <Head title="Machinery-Equipment" note="Kaç makine var, planlanan ve gerçekleşen makine saati, sapma, yakıt ve bakım harcamaları." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Makine" value={count} sub={`${machines.length} tip`} />
        <Kpi label="Planlanan saat" value={num(plan)} />
        <Kpi label="Gerçekleşen saat" value={num(actual)} sub={`Sapma ${actual - plan > 0 ? '+' : ''}${num(actual - plan)} saat`} tone={actual > plan ? 'warn' : 'neutral'} />
        <Kpi label="Boşta bekleme" value={num(idle)} sub={`Çalışma saatinin ${pct((idle / actual) * 100)}’i`} tone="warn" />
        <Kpi label="Yakıt + bakım" value={m(spend)} />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <Card title="Plan ve gerçekleşen saat" right={<Legend items={[{ label: 'Gerçekleşen', color: 'var(--series-1)' }, { label: 'Planlanan', color: 'var(--series-2)' }]} />}>
            <PairBars rows={machines.map((x) => ({ label: x.name, plan: x.planHours, actual: x.actualHours }))} format={(v) => num(v)} />
          </Card>
        </div>
        <div className="xl:col-span-7">
          <Card title="Makine listesi" pad={false}>
            <Table head={<tr><Th w={170}>Makine</Th><Th right>Adet</Th><Th>Mülkiyet</Th><Th right>Sapma</Th><Th right>Boşta</Th><Th right>Yakıt</Th><Th right>Bakım</Th></tr>}>
              {machines.map((x) => (
                <tr key={x.name} className="hover:bg-[var(--surface-2)]">
                  <Td><span className="text-[12.5px] text-[var(--ink)]">{x.name}</span></Td>
                  <Td right>{x.count}</Td>
                  <Td nowrap><Badge tone={x.ownership === 'Kira' ? 'warn' : 'ok'}>{x.ownership}</Badge></Td>
                  <Td right><span style={{ color: x.actualHours > x.planHours ? 'var(--crit)' : 'var(--ok)' }}>{x.actualHours > x.planHours ? '+' : ''}{num(x.actualHours - x.planHours)}</span></Td>
                  <Td right>{num(x.idleHours)}</Td>
                  <Td right>{x.fuel ? num(x.fuel) : '—'}</Td>
                  <Td right>{x.maintenance ? num(x.maintenance) : '—'}</Td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
      </div>
    </>
  )
}

/* ---------------- Disruptions ---------------- */

export function AdminDisruptions() {
  const cost = disruptions.reduce((a, d) => a + d.cost, 0)
  const critDays = disruptions.filter((d) => d.critical).reduce((a, d) => a + d.days, 0)
  const causes = [...new Set(disruptions.map((d) => d.cause))].map((c) => ({
    cause: c, cost: disruptions.filter((d) => d.cause === c).reduce((a, d) => a + d.cost, 0),
  })).sort((a, b) => b.cost - a.cost)
  const max = Math.max(...causes.map((c) => c.cost))
  return (
    <>
      <Head title="Disruptions" note="Projenin geri kaldığı, verimsizlik oluşan kalemler, maliyetleri ve iş programı üzerindeki etkileri. Sebep – etki – çözüm detayı Disruptions modülündedir." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Aksaklık" value={disruptions.length} sub={`${disruptions.filter((d) => d.state === 'Açık').length} açık`} />
        <Kpi label="Maliyet etkisi" value={m(cost)} tone="crit" />
        <Kpi label="Kritik yola etkisi" value={`${critDays} gün`} sub="Bitişi öteleyen" tone="crit" />
        <Kpi label="Talebe dönüşen" value={disruptions.filter((d) => d.state === 'Talebe dönüştü').length} sub="Hak talebi açıldı" tone="accent" />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <Card title="Kaynağına göre maliyet">
            <div className="flex flex-col gap-2.5">
              {causes.map((c) => (
                <div key={c.cause} title={`${c.cause}: ${m(c.cost)}`}>
                  <div className="mb-1 flex text-[12px]"><span className="text-[var(--ink)]">{c.cause}</span><span className="ml-auto text-[var(--muted)] tnum">{m(c.cost)}</span></div>
                  <div className="h-[6px] rounded-r-full" style={{ width: `${(c.cost / max) * 100}%`, background: 'var(--series-1)' }} />
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="xl:col-span-8">
          <Card title="Aksaklıklar" pad={false}>
            <Table head={<tr><Th w={230}>Aksaklık</Th><Th>Kaynak</Th><Th right>Gün</Th><Th right>Maliyet</Th><Th>Durum</Th></tr>}>
              {disruptions.map((d) => (
                <tr key={d.id} className="hover:bg-[var(--surface-2)]">
                  <Td>
                    <div className="text-[12.5px] text-[var(--ink)]">{d.title}</div>
                    <div className="mt-0.5 text-[11px] text-[var(--muted)]">→ {d.action}</div>
                  </Td>
                  <Td nowrap>{d.cause}</Td>
                  <Td right>{d.days ? <span style={{ color: d.critical ? 'var(--crit)' : undefined }}>{d.days}{d.critical ? ' · KY' : ''}</span> : '—'}</Td>
                  <Td right>{num(d.cost)}</Td>
                  <Td nowrap><Badge tone={d.state === 'Açık' ? 'warn' : d.state === 'Çözüldü' ? 'ok' : 'accent'} dot>{d.state}</Badge></Td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
      </div>
    </>
  )
}

/* ---------------- Change Order ---------------- */

const CO_TONE: Record<string, 'ok' | 'warn' | 'crit' | 'accent' | 'neutral'> = {
  'Tamamlandı': 'ok', 'İmalatta': 'accent', 'Onaylandı': 'accent', 'İşveren onayında': 'warn', 'Reddedildi': 'crit',
}

export function AdminChangeOrder() {
  const approved = changeOrders.filter((c) => ['Onaylandı', 'İmalatta', 'Tamamlandı'].includes(c.state))
  const pending = changeOrders.filter((c) => c.state === 'İşveren onayında')
  return (
    <>
      <Head title="Change Order" note="Değişiklik emri: kontrat şartları içinde, işverenle mutabık kalınan ek imalat, fiyat ve süre. Adet, toplam tutar ve durum (onaylandı mı, imalatı yapılıyor mu) takip edilir." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Değişiklik emri" value={changeOrders.length} />
        <Kpi label="Onaylanan tutar" value={m(approved.reduce((a, c) => a + c.amount, 0))} sub={`${approved.length} adet · +${approved.reduce((a, c) => a + c.days, 0)} gün`} tone="ok" />
        <Kpi label="Onay bekleyen" value={m(pending.reduce((a, c) => a + c.amount, 0))} sub={`${pending.length} adet`} tone="warn" />
        <Kpi label="Reddedilen" value={changeOrders.filter((c) => c.state === 'Reddedildi').length} tone="crit" />
      </div>
      <Card title="Duruma göre dağılım">
        <StackBar parts={(['Tamamlandı', 'İmalatta', 'Onaylandı', 'İşveren onayında', 'Reddedildi'] as const).map((s) => ({
          label: s, value: changeOrders.filter((c) => c.state === s).reduce((a, c) => a + c.amount, 0), color: `var(--${CO_TONE[s]})`,
        }))} />
        <div className="mt-2 flex flex-wrap gap-4 text-[12px] text-[var(--muted)]">
          {(['Tamamlandı', 'İmalatta', 'Onaylandı', 'İşveren onayında', 'Reddedildi'] as const).map((s) => (
            <span key={s}><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: `var(--${CO_TONE[s]})` }} />{s} · {m(changeOrders.filter((c) => c.state === s).reduce((a, c) => a + c.amount, 0))}</span>
          ))}
        </div>
      </Card>
      <Card title="Değişiklik emirleri" pad={false}>
        <Table head={<tr><Th>No</Th><Th w={320}>Konu</Th><Th>Talep eden</Th><Th right>Tutar</Th><Th right>Süre</Th><Th>Durum</Th></tr>}>
          {changeOrders.map((c) => (
            <tr key={c.no} className="hover:bg-[var(--surface-2)]">
              <Td mono nowrap>{c.no}</Td>
              <Td><span className="text-[12.5px] text-[var(--ink)]">{c.title}</span></Td>
              <Td nowrap><span className="text-[12px] text-[var(--muted)]">{c.requestedBy}</span></Td>
              <Td right>{num(c.amount)}</Td>
              <Td right>{c.days ? `+${c.days} gün` : '—'}</Td>
              <Td nowrap><Badge tone={CO_TONE[c.state]} dot>{c.state}</Badge></Td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  )
}

/* ---------------- Claim ---------------- */

export function AdminClaim() {
  const total = claims.reduce((a, c) => a + c.amount, 0)
  const nearest = claims.filter((c) => !c.noticed).sort((a, b) => a.noticeDue.localeCompare(b.noticeDue))[0]
  return (
    <>
      <Head title="Claim" note="Hak talebi: ana kontratla örtüşmeyen, yükleniciden kaynaklanmayan ama zarara uğratan durumlar (işveren revizyonu, lisans alınamaması, yer tesliminin gecikmesi…) için ek bedel ve süre talebi. Amaç tahkime gitmeden, dokümanla güçlü bir pazarlıkla çözmek; ICCM bu durumları oluştuğu an saptar." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Hak talebi" value={claims.length} />
        <Kpi label="Talep edilen" value={m(total)} sub={`+${claims.reduce((a, c) => a + c.days, 0)} gün süre`} tone="accent" />
        <Kpi label="Bildirim bekleyen" value={claims.filter((c) => !c.noticed).length} tone="crit" />
        <Kpi label="En yakın süre sınırı" value={nearest ? `${daysTo(nearest.noticeDue)} gün` : '—'} sub={nearest ? `${nearest.no} · ${date(nearest.noticeDue)}` : 'Bekleyen yok'} tone="crit"
          help="Olaydan sonra 28 gün içinde bildirim yapılmazsa hak düşer (time-bar)." />
      </div>
      <Card title="Hak talepleri" pad={false}>
        <Table head={<tr><Th>No</Th><Th w={260}>Konu ve dayanak</Th><Th right>Tutar</Th><Th right>Süre</Th><Th>Olay</Th><Th w={150}>Bildirim süresi</Th><Th>Durum</Th></tr>}>
          {claims.map((c) => {
            const left = daysTo(c.noticeDue)
            return (
              <tr key={c.no} className="hover:bg-[var(--surface-2)]">
                <Td mono nowrap>{c.no}</Td>
                <Td>
                  <div className="text-[12.5px] text-[var(--ink)]">{c.title}</div>
                  <div className="mt-0.5 text-[11px] text-[var(--muted)]">{c.basis}</div>
                </Td>
                <Td right>{num(c.amount)}</Td>
                <Td right>+{c.days} gün</Td>
                <Td nowrap>{date(c.eventDate)}</Td>
                <Td nowrap>
                  {c.noticed
                    ? <span className="text-[12px] text-[var(--ok)]">✓ Bildirildi</span>
                    : <span className="text-[12px] font-semibold text-[var(--crit)]">{left} gün kaldı · {date(c.noticeDue)}</span>}
                </Td>
                <Td nowrap><Badge tone={c.state === 'Bildirim bekliyor' ? 'crit' : c.state === 'Kısmen kabul' ? 'ok' : 'warn'} dot>{c.state}</Badge></Td>
              </tr>
            )
          })}
        </Table>
      </Card>
      <p className="text-[12px] leading-relaxed text-[var(--muted)]">
        Toplam talep {money(total, C)}. Aksaklıklar ekranındaki kritik yol gecikmeleri ile hak talepleri eşleşir; bildirimi yapılmamış
        aksaklıklar burada kırmızı görünür.
      </p>
    </>
  )
}
