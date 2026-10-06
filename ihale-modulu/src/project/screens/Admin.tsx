import { useState } from 'react'
import type { ReactNode } from 'react'
import { Badge, Bar, Btn, Card, Chips, Dropzone, ExportButtons, Field, Kpi, Modal, PageHead, PreviewPane, RowActions, StateBadge, Table, Td, Th } from '../../components/ui'
import { date, money, moneyShort, num, pct } from '../../lib/format'
import { ComboChart, Gantt, Gauge, Legend, MonthColumns, PairBars, Pie, PIE_COLORS, SCurve, StackBar } from '../charts'
import { programs } from '../planningData'
import {
  actualCum, changeOrders, evm, claims, contractMatches, costLines, criticalPath, dailyReport, disruptions, ipcs, machines,
  machineLog, machineWaste, materialWaste, monthName, monthlyPhrs, phrsLog, plannedCum, prj, productivity, staffWaste, subcontracts,
  timesheet, timesheetDays, trades,
} from '../data'
import type { ChangeOrder, Claim, Impact } from '../data'

/**
 * Admin Konsolu: üst yöneticinin alt modüllerden gelen verinin en özet hâlini gördüğü ekranlar.
 * Detaylı veri girişi ve düzenleme teknik kullanıcının alt modüllerindedir; burada yalnızca görülür.
 */

const C = prj.currency
const m = (v: number) => moneyShort(v, C)
const TODAY = new Date('2026-09-27')
const daysTo = (iso: string) => Math.round((new Date(iso).getTime() - TODAY.getTime()) / 86_400_000)
const PLAN_ACTUAL = [{ label: 'Gerçekleşen', color: 'var(--series-1)' }, { label: 'Planlanan', color: 'var(--series-2)', dashed: true }]

function Head({ title, note, extra }: { title: string; note: string; extra?: ReactNode }) {
  return <PageHead title={`Admin Konsolu · ${title}`} note={note} right={<><ExportButtons />{extra}</>} />
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
              <Td right><span className="font-semibold" style={{ color: c.forecast > c.budget ? 'var(--crit-ink)' : 'var(--ok-ink)' }}>{c.forecast > c.budget ? '+' : ''}{num(c.forecast - c.budget)}</span></Td>
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi label="Kesilen hakediş" value={m(gross)} sub={`${ipcs.length} hakediş · brüt`} />
        <Kpi label="Tahsil edilen" value={m(paid)} sub="Net, kesintiler sonrası" tone="ok" />
        <Kpi label="Bekleyen" value={m(pending)} sub="Onaylı + incelemede" tone="warn" />
        <Kpi label="Avans mahsubu" value={m(recovered)} sub={`Verilen ${m(prj.advance)} · kalan ${m(prj.advance - recovered)}`} />
        <Kpi label="Teminat kesintisi" value={m(retention)} sub={`%${prj.retentionRate * 100} · kabulde iade`} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <Card fill title="Aylık hakediş — planlanan ve kesilen" help="Planlanan: işverenle mutabık programın o ayki payı × sözleşme bedeli. Kesilen: onaylanan hakedişin brüt tutarı."
            right={<Legend items={[{ label: 'Kesilen', color: 'var(--series-1)' }, { label: 'Planlanan', color: 'var(--series-2)' }]} />}>
            <div className="flex flex-1 flex-col justify-end"><MonthColumns data={monthly} format={m} height={300} /></div>
          </Card>
        </div>
        <div className="xl:col-span-5">
          <Card fill title="Son hakedişler" pad={false}>
            <Table head={<tr><Th>No</Th><Th>Ay</Th><Th right>Brüt</Th><Th right>Net</Th><Th>Durum</Th></tr>}>
              {ipcs.slice(-6).reverse().map((i) => (
                <tr key={i.no} className="hover:bg-[var(--surface-2)]">
                  <Td mono nowrap>IPC-{String(i.no).padStart(2, '0')}</Td>
                  <Td nowrap>{monthName(i.month)}</Td>
                  <Td right>{num(i.gross)}</Td>
                  <Td right>{num(i.net)}</Td>
                  <Td nowrap>
                    <StateBadge value={i.state} />
                    {i.lateDays && <div className="mt-0.5 text-[11px] text-[var(--crit-ink)]">{i.lateDays} gün geç ödendi</div>}
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
  const [sel, setSel] = useState(contractMatches[0])
  const art = (i: number) => `${5 + i}.${(i % 3) + 1}`
  const idx = contractMatches.indexOf(sel)

  return (
    <>
      <Head title="Contract" note="İşverenle ana kontrat (tutar, alınan, kalan, kesintiler, avans) ve alt yüklenici kontratlarının ana kontratla karşılaştırması. Aynı kalemde miktar veya birim fiyat farkı varsa sistem otomatik uyarır." />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
          <div className="text-[13px] font-semibold" style={{ color: 'var(--crit-ink)' }}>Ana kontrat ile alt yüklenici kontratı arasında {diffs.length} fark</div>
          <ul className="mt-1.5 flex flex-col gap-1 text-[12.5px]" style={{ color: 'var(--crit-ink)' }}>
            {diffs.map((d) => {
              const loss = d.subQty * d.subPrice - d.mainQty * d.mainPrice
              return (
                <li key={d.item}>• <b>{d.item}</b> — işverenle {num(d.mainQty)} {d.unit} × {num(d.mainPrice, 2)} EUR, {d.sub} ile {num(d.subQty)} {d.unit} × {num(d.subPrice, 2)} EUR · fark {m(loss)}</li>
              )
            })}
          </ul>
        </div>
      )}

      <Card title="Kalem karşılaştırması" help="Aynı iş kaleminin işverene verilen (ana kontrat) ve alt yükleniciye verilen hâli. Satıra tıklayınca iki sözleşmenin ilgili maddesi aşağıdaki önizlemede açılır." pad={false}>
        <Table head={<tr><Th w={190}>Kalem</Th><Th>Alt yüklenici</Th><Th right>Ana miktar</Th><Th right>Taşeron miktar</Th><Th right>Ana birim fiyat</Th><Th right>Taşeron birim fiyat</Th><Th right>Tutar farkı</Th></tr>}>
          {contractMatches.map((c) => {
            const qBad = c.subQty > c.mainQty
            const pBad = c.subPrice > c.mainPrice
            const diff = c.subQty * c.subPrice - c.mainQty * c.mainPrice
            return (
              <tr key={c.item} onClick={() => setSel(c)} className="cursor-pointer" style={sel === c ? { background: 'var(--accent-soft)' } : undefined}>
                <Td><span className="font-medium text-[var(--ink)]">{c.item}</span> <span className="text-[11px] text-[var(--faint)]">{c.unit}</span></Td>
                <Td nowrap><span className="text-[12px] text-[var(--muted)]">{c.sub}</span></Td>
                <Td right>{num(c.mainQty)}</Td>
                <Td right><span style={{ color: qBad ? 'var(--crit-ink)' : undefined, fontWeight: qBad ? 600 : undefined }}>{num(c.subQty)}</span></Td>
                <Td right>{num(c.mainPrice, 2)}</Td>
                <Td right><span style={{ color: pBad ? 'var(--crit-ink)' : undefined, fontWeight: pBad ? 600 : undefined }}>{num(c.subPrice, 2)}</span></Td>
                <Td right><span className="font-semibold" style={{ color: diff > 0 ? 'var(--crit-ink)' : 'var(--ok-ink)' }}>{diff > 0 ? '+' : ''}{num(diff)}</span></Td>
              </tr>
            )
          })}
        </Table>
      </Card>

      {/* Kontrat önizleme: seçili kalemin iki sözleşmedeki maddesi */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <PreviewPane title="Ana kontrat · işveren" paper height={420}
          preview={{
            doc: 'Ana Sözleşme — Ek-2 Birim Fiyat Cetveli', page: 14 + idx, pages: 86, clause: art(idx),
            highlight: `${num(sel.mainQty)} ${sel.unit} × ${num(sel.mainPrice, 2)} EUR`,
            body: `Madde ${art(idx)} — ${sel.item}\n\nYüklenici, ${sel.item.toLocaleLowerCase('tr')} imalatını teknik şartnameye uygun olarak ${num(sel.mainQty)} ${sel.unit} × ${num(sel.mainPrice, 2)} EUR birim fiyat üzerinden yapacaktır. Miktar değişiklikleri Madde 13 (Değişiklikler) hükümlerine göre değerlendirilir.\n\nBirim fiyata malzeme, işçilik, nakliye, sigorta ve yüklenici kârı dâhildir.`,
          }} />
        <PreviewPane title={`Alt yüklenici · ${sel.sub}`} paper height={420}
          preview={{
            doc: `${sel.sub} Alt Yüklenici Sözleşmesi`, page: 6 + idx, pages: 24, clause: `${3 + (idx % 2)}.${idx + 1}`,
            highlight: `${num(sel.subQty)} ${sel.unit} × ${num(sel.subPrice, 2)} EUR`,
            body: `Madde ${3 + (idx % 2)}.${idx + 1} — İşin kapsamı ve bedeli\n\nAlt yüklenici, ${sel.item.toLocaleLowerCase('tr')} işini ${num(sel.subQty)} ${sel.unit} × ${num(sel.subPrice, 2)} EUR birim fiyatla, ana sözleşmenin ilgili teknik şartlarına bağlı kalarak yapmayı kabul eder.\n\nHakedişler aylık metraj üzerinden, ana yüklenici onayıyla ödenir.`,
          }} />
      </div>
    </>
  )
}

/* ---------------- Planning ---------------- */

export function AdminPlanning() {
  const { actual, planned, spi, cpi } = evm()
  const [progId, setProgId] = useState(programs[0].id)
  const prog = programs.find((x) => x.id === progId) ?? programs[0]
  const from = prog.activities.reduce((a, x) => (x.start < a ? x.start : a), prog.activities[0].start)
  const to = prog.activities.reduce((a, x) => (x.finish > a ? x.finish : a), prog.activities[0].finish)
  return (
    <>
      <Head title="Planning" note="İşverenle mutabık kalınan program üzerinden ilerleme: girilen verilere göre işin olması gereken ilerlemesi, kritik hat ve önümüzdeki dönemin iş planı." />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi label="Gerçekleşen" value={pct(actual)} sub={`Planlanan ${pct(planned)}`} tone="accent" />
        <Gauge label="SPI" value={spi} />
        <Gauge label="CPI" value={cpi} />
        <Kpi label="Öngörülen bitiş" value={date(prj.forecastFinish)} sub={`Sözleşme ${date(prj.plannedFinish)}`} tone="warn" />
        <Kpi label="4 haftalık plan" value="14 aktivite" sub="3’ü riskte" tone="warn" help="Lookahead: önümüzdeki 4 haftada başlaması veya bitmesi gereken aktiviteler." />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <Card fill title="İlerleme eğrisi" right={<Legend items={PLAN_ACTUAL} />}>
            <SCurve plan={plannedCum} actual={actualCum} labels={plannedCum.map((_, i) => monthName(i + 1))} today={prj.today} height={240} />
          </Card>
        </div>
        <div className="xl:col-span-5">
          <Card fill title="Kritik yol" help="Bolluğu (float) sıfır olan aktiviteler; herhangi birinin gecikmesi bitişi doğrudan öteler." pad={false}>
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

      <Card title={`Kullanılan iş programı · ${prog.title}`}
        help="Planlama modülündeki programlardan seçilen. Koyu kısım gerçekleşen ilerleme, kırmızı çubuklar kritik yol, dikey çizgi bugün."
        right={<Chips<string> value={progId} onChange={setProgId} items={programs.map((x) => ({ key: x.id, label: `${x.title.split(' (')[0]} · Rev.${x.rev}` }))} />}
        pad={false}>
        <Gantt rows={prog.activities.map((x) => ({ code: x.code, name: x.name, start: x.start, finish: x.finish, progress: x.progress, critical: x.critical }))}
          from={from} to={to} today="2026-09-27" compact labelW={300} />
        <div className="border-t border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-[11.5px] text-[var(--muted)]">
          {prog.kind} · Rev.{prog.rev} · son güncelleme {date(prog.updatedAt)} · {prog.updatedBy} · {prog.activities.length} aktivite
        </div>
      </Card>
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
  const planTotal = monthlyPhrs.reduce((a, x) => a + x.plan, 0)
  return (
    <>
      <Head title="Phrs (manhour)" note="İnsan-saat (inxsa) fiyattan sonra projenin en önemli birimidir: malzeme birim fiyatla hesaplanır, ama 1 birim imalatın gerektirdiği insan gücü projeye göre değişir. Planlanan ve gerçekleşen birim inxsa karşılaştırılarak verimsizlik ölçülür." />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          <Card fill title="Kalem bazında birim inxsa" pad={false}>
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
                        <span className="text-[11.5px] font-semibold tnum" style={{ color: e >= 0.95 ? 'var(--ok-ink)' : e >= 0.85 ? 'var(--warn-ink)' : 'var(--crit-ink)' }}>%{Math.round(e * 100)}</span>
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </Table>
          </Card>
        </div>
        <div className="xl:col-span-5">
          <Card fill title="Aylık insan-saat (bin)" help="Sütunlar aylık harcanan ve planlanan insan-saat; çizgiler dönem başından kümülatif yüzde (planlanan toplamın payı)."
            right={<Legend items={[{ label: 'Harcanan', color: 'var(--series-1)' }, { label: 'Planlanan', color: 'var(--series-2)' }, { label: 'Kümülatif %', color: 'var(--crit)' }]} />}>
            <ComboChart height={300}
              labels={monthlyPhrs.map((x) => monthName(x.m))}
              bars={[
                { label: 'Harcanan', color: 'var(--series-1)', values: monthlyPhrs.map((x) => x.actual) },
                { label: 'Planlanan', color: 'var(--series-2)', values: monthlyPhrs.map((x) => x.plan) },
              ]}
              lines={[
                { label: 'Kümülatif harcanan %', color: 'var(--crit)', values: cumPct(monthlyPhrs.map((x) => x.actual), planTotal) },
                { label: 'Kümülatif plan %', color: 'var(--muted)', dashed: true, values: cumPct(monthlyPhrs.map((x) => x.plan), planTotal) },
              ]}
              format={(v) => `${num(v)} bin`} lineFormat={(v) => `%${Math.round(v)}`} lineMax={120} />
          </Card>
        </div>
      </div>

      <Card title={`inxsa harcama logu (${phrsLog.length})`} help="Sahadan 3’lü onaydan geçerek gelen kayıtlar: hangi gün, hangi kaleme, hangi ekip kaç insan-saat harcadı ve ne kadar imalat çıktı. Birim inxsa plandan yüksekse satır kırmızı işaretlenir." pad={false}>
        <Table head={<tr><Th w={96}>Tarih</Th><Th w={200}>Kalem</Th><Th>Bölge</Th><Th>Ekip</Th><Th right>Harcanan inxsa</Th><Th right>Yapılan</Th><Th right>Gerçek / birim</Th><Th right>Plan / birim</Th><Th w={110}>Verim</Th><Th>Onaylayan</Th></tr>}>
          {phrsLog.map((l, i) => {
            const rate = l.hours / l.qty
            const e = l.planRate / rate
            return (
              <tr key={i}>
                <Td nowrap><span className="tnum">{date(l.date)}</span></Td>
                <Td><span className="text-[12.5px] text-[var(--ink)]">{l.item}</span></Td>
                <Td><span className="text-[12px] text-[var(--muted)]">{l.zone}</span></Td>
                <Td nowrap><span className="text-[12px] text-[var(--muted)]">{l.crew}</span></Td>
                <Td right><b>{num(l.hours)}</b></Td>
                <Td right>{num(l.qty, l.qty < 10 ? 1 : 0)} {l.unit}</Td>
                <Td right><span style={{ color: rate > l.planRate ? 'var(--crit-ink)' : 'var(--ok-ink)' }}>{num(rate, 2)}</span></Td>
                <Td right>{num(l.planRate, 2)}</Td>
                <Td><Badge tone={e >= 0.95 ? 'ok' : e >= 0.85 ? 'warn' : 'crit'}>%{Math.round(e * 100)}</Badge></Td>
                <Td nowrap><span className="mono text-[11.5px] text-[var(--muted)]">{l.by}</span></Td>
              </tr>
            )
          })}
        </Table>
      </Card>
    </>
  )
}

/** Değerlerin kümülatif toplamını verilen toplamın yüzdesi olarak döndürür */
function cumPct(values: number[], total: number): number[] {
  let run = 0
  return values.map((v) => Math.round(((run += v) / total) * 1000) / 10)
}

/* ---------------- Personel ---------------- */

export function AdminPersonel() {
  const plan = trades.reduce((a, t) => a + t.plan, 0)
  const actual = trades.reduce((a, t) => a + t.actual, 0)
  const total = (f: (r: typeof timesheet[number]) => boolean) => timesheet.filter(f).reduce((a, r) => a + r.days.reduce((x, y) => x + y, 0), 0)
  return (
    <>
      <Head title="Personel" note="Meslek gruplarına göre planlanan ve sahadaki kadro, günlük puantaj ve kadronun yapısı. Eksik kadro programı, fazla kadro maliyeti etkiler." />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Planlanan kadro" value={plan} />
        <Kpi label="Sahadaki kadro" value={actual} sub={`${actual - plan > 0 ? '+' : ''}${actual - plan} kişi`} tone={actual < plan ? 'warn' : 'neutral'} />
        <Kpi label="Eksik grup" value={trades.filter((t) => t.actual < t.plan).length} sub="Plandan az" tone="warn" />
        <Kpi label="Fazla grup" value={trades.filter((t) => t.actual > t.plan).length} sub="Plandan çok" />
      </div>
      <Card title="Meslek gruplarına göre kadro" help="Açık çubuk planlanan, koyu çubuk sahadaki kişi sayısı. Kırmızı ok plandan eksik olan grupları gösterir."
        right={<Legend items={[{ label: 'Sahada', color: 'var(--series-1)' }, { label: 'Planlanan', color: 'var(--series-2)' }]} />}>
        <PairBars rows={trades.map((t) => ({ label: t.trade, plan: t.plan, actual: t.actual }))} format={(v) => `${v} kişi`} worseWhen="lower" />
      </Card>
      <SplitWithPies
        table={<Timesheet title="Puantaj · son 7 gün" unit="kişi" rows={timesheet.map((r) => ({ name: r.group, employer: r.employer, kind: r.kind, days: r.days }))}
          help="Günlük sahaya giren kişi sayısı (puantaj). Hafta sonu çalışmaları ayrıca görünür; ana firma ve taşeron personeli ayrı işaretlenir." />}
        pies={[
          { title: 'Taşeron / ana firma', help: 'Son 7 günün kişi-gün toplamına göre.', parts: [
            { label: 'Taşeron', value: total((r) => r.employer === 'Taşeron'), color: 'var(--series-1)' },
            { label: 'Ana firma', value: total((r) => r.employer === 'Ana firma'), color: 'var(--series-2)' },
          ], format: (v: number) => `${num(v)} kişi-gün` },
          { title: 'Direkt / endirekt', help: 'Direkt: imalatta çalışan; endirekt: teknik ofis, İSG, idari işler.', parts: [
            { label: 'Direkt', value: total((r) => r.kind === 'Direkt'), color: 'var(--series-3)' },
            { label: 'Endirekt', value: total((r) => r.kind === 'Endirekt'), color: 'var(--series-4)' },
          ], format: (v: number) => `${num(v)} kişi-gün` },
        ]}
      />
    </>
  )
}

/** Solda geniş tablo, sağda alt alta iki pasta grafik — ikisi aynı yükseklikte */
function SplitWithPies({ table, pies }: {
  table: ReactNode
  pies: { title: string; help?: string; parts: { label: string; value: number; color: string }[]; format?: (v: number) => string }[]
}) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <div className="xl:col-span-8">{table}</div>
      <div className="flex flex-col gap-4 xl:col-span-4">
        {pies.map((p) => (
          <div key={p.title} className="flex-1">
            <Card fill title={p.title} help={p.help}>
              <div className="flex flex-1 items-center"><Pie parts={p.parts} size={120} format={p.format} /></div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Günlük puantaj tablosu: satır başına 7 gün ve toplam */
function Timesheet({ title, help, unit, rows }: {
  title: string; help: string; unit: string
  rows: { name: string; employer: string; kind: string; days: number[] }[]
}) {
  const dayTotals = timesheetDays.map((_, i) => rows.reduce((a, r) => a + r.days[i], 0))
  return (
    <Card fill title={title} help={help} pad={false}>
      <Table dense head={<tr>
        <Th w={170}>{unit === 'kişi' ? 'Meslek grubu' : 'Makine'}</Th><Th>Firma</Th><Th>Tür</Th>
        {timesheetDays.map((d) => <Th key={d} right>{d}</Th>)}
        <Th right>Toplam</Th>
      </tr>}>
        {rows.map((r) => (
          <tr key={r.name}>
            <Td><span className="font-medium text-[var(--ink)]">{r.name}</span></Td>
            <Td nowrap><Badge tone={r.employer === 'Taşeron' ? 'accent' : 'neutral'}>{r.employer}</Badge></Td>
            <Td nowrap><span className="text-[12px] text-[var(--muted)]">{r.kind}</span></Td>
            {r.days.map((v, i) => <Td key={i} right><span style={{ color: v ? 'var(--ink)' : 'var(--faint)' }}>{v || '—'}</span></Td>)}
            <Td right><b>{num(r.days.reduce((a, v) => a + v, 0))}</b></Td>
          </tr>
        ))}
        <tr>
          <Td className="bg-[var(--surface-2)]"><b>Günlük toplam</b></Td><Td className="bg-[var(--surface-2)]">{''}</Td><Td className="bg-[var(--surface-2)]">{''}</Td>
          {dayTotals.map((v, i) => <Td key={i} right className="bg-[var(--surface-2)]"><b>{num(v)}</b></Td>)}
          <Td right className="bg-[var(--surface-2)]"><b>{num(dayTotals.reduce((a, v) => a + v, 0))} {unit === 'kişi' ? 'kişi-gün' : 'saat'}</b></Td>
        </tr>
      </Table>
    </Card>
  )
}

/* ---------------- Makine-ekipman ---------------- */

export function AdminMachinery() {
  const count = machines.reduce((a, x) => a + x.count, 0)
  const plan = machines.reduce((a, x) => a + x.planHours, 0)
  const actual = machines.reduce((a, x) => a + x.actualHours, 0)
  const idle = machines.reduce((a, x) => a + x.idleHours, 0)
  const spend = machines.reduce((a, x) => a + x.fuel + x.maintenance, 0)
  const hours = (f: (r: typeof machineLog[number]) => boolean) => machineLog.filter(f).reduce((a, r) => a + r.days.reduce((x, y) => x + y, 0), 0)
  return (
    <>
      <Head title="Machinery-Equipment" note="Kaç makine var, planlanan ve gerçekleşen makine saati, sapma, yakıt ve bakım harcamaları." />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi label="Makine" value={count} sub={`${machines.length} tip`} />
        <Kpi label="Planlanan saat" value={num(plan)} />
        <Kpi label="Gerçekleşen saat" value={num(actual)} sub={`Sapma ${actual - plan > 0 ? '+' : ''}${num(actual - plan)} saat`} tone={actual > plan ? 'warn' : 'neutral'} />
        <Kpi label="Boşta bekleme" value={num(idle)} sub={`Çalışma saatinin ${pct((idle / actual) * 100)}’i`} tone="warn" />
        <Kpi label="Yakıt + bakım" value={m(spend)} />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <Card fill title="Plan ve gerçekleşen saat" right={<Legend items={[{ label: 'Gerçekleşen', color: 'var(--series-1)' }, { label: 'Planlanan', color: 'var(--series-2)' }]} />}>
            <PairBars rows={machines.map((x) => ({ label: x.name, plan: x.planHours, actual: x.actualHours }))} format={(v) => num(v)} />
          </Card>
        </div>
        <div className="xl:col-span-7">
          <Card fill title="Makine listesi" pad={false}>
            <Table head={<tr><Th w={170}>Makine</Th><Th right>Adet</Th><Th>Mülkiyet</Th><Th right>Sapma</Th><Th right>Boşta</Th><Th right>Yakıt</Th><Th right>Bakım</Th></tr>}>
              {machines.map((x) => (
                <tr key={x.name} className="hover:bg-[var(--surface-2)]">
                  <Td><span className="text-[12.5px] text-[var(--ink)]">{x.name}</span></Td>
                  <Td right>{x.count}</Td>
                  <Td nowrap><Badge tone={x.ownership === 'Kira' ? 'warn' : 'ok'}>{x.ownership}</Badge></Td>
                  <Td right><span style={{ color: x.actualHours > x.planHours ? 'var(--crit-ink)' : 'var(--ok-ink)' }}>{x.actualHours > x.planHours ? '+' : ''}{num(x.actualHours - x.planHours)}</span></Td>
                  <Td right>{num(x.idleHours)}</Td>
                  <Td right>{x.fuel ? num(x.fuel) : '—'}</Td>
                  <Td right>{x.maintenance ? num(x.maintenance) : '—'}</Td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
      </div>
      <SplitWithPies
        table={<Timesheet title="Makine puantajı · son 7 gün (çalışma saati)" unit="saat" rows={machineLog.map((r) => ({ name: r.name, employer: r.employer, kind: r.kind, days: r.days }))}
          help="Makinelerin günlük çalışma saati. Direkt: imalatta çalışan; endirekt: genel hizmet (forklift, jeneratör)." />}
        pies={[
          { title: 'Taşeron / ana firma', help: 'Son 7 günün makine-saat toplamına göre.', parts: [
            { label: 'Taşeron', value: hours((r) => r.employer === 'Taşeron'), color: 'var(--series-1)' },
            { label: 'Ana firma', value: hours((r) => r.employer === 'Ana firma'), color: 'var(--series-2)' },
          ], format: (v: number) => `${num(v)} saat` },
          { title: 'Direkt / endirekt', help: 'Direkt: imalatta; endirekt: genel hizmet.', parts: [
            { label: 'Direkt', value: hours((r) => r.kind === 'Direkt'), color: 'var(--series-3)' },
            { label: 'Endirekt', value: hours((r) => r.kind === 'Endirekt'), color: 'var(--series-4)' },
          ], format: (v: number) => `${num(v)} saat` },
        ]}
      />
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
  const matCost = materialWaste.reduce((a, x) => a + x.cost, 0)
  const idle = machines.reduce((a, x) => a + x.idleHours, 0)
  const lostHours = productivity.reduce((a, p) => a + Math.max(0, (p.actualRate - p.planRate) * p.done), 0)
  const pie = <T,>(rows: T[], label: (r: T) => string, value: (r: T) => number) =>
    rows.map((r, i) => ({ label: label(r), value: value(r), color: PIE_COLORS[i % PIE_COLORS.length] }))

  return (
    <>
      <Head title="Disruptions" note="Projenin geri kaldığı ve verimsizlik oluşan noktalar dört başlıkta izlenir: imalat, malzeme, makine-ekipman ve personel. Her başlıkta takip tablosu ve kayıpların dağılımı yan yana durur. Sebep – etki – çözüm detayı Disruptions modülündedir." />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="İmalat aksaklığı" value={disruptions.length} sub={`${disruptions.filter((d) => d.state === 'Açık').length} açık · ${m(cost)}`} tone="crit" />
        <Kpi label="Malzeme firesi (fazla)" value={m(matCost)} sub={`${materialWaste.length} malzeme normal firenin üstünde`} tone="warn" />
        <Kpi label="Makine boşta" value={`${num(idle)} saat`} sub={`Çalışma saatinin ${pct((idle / machines.reduce((a, x) => a + x.actualHours, 0)) * 100)}’i`} tone="warn" />
        <Kpi label="Personel kaybı" value={`${num(lostHours)} saat`} sub={`Kritik yola etki ${critDays} gün`} tone="crit" />
      </div>

      <Track title="İmalat verimsizlik takibi" help="Programı geciktiren ya da maliyet doğuran aksaklıklar. KY: kritik yolda, bitişi öteler."
        pieTitle="Kaynağına göre maliyet" parts={pie(causes, (c) => c.cause, (c) => c.cost)} format={m}
        head={<tr><Th w={240}>Aksaklık</Th><Th>Kaynak</Th><Th right>Gün</Th><Th right>Maliyet</Th><Th>Durum</Th></tr>}>
        {disruptions.map((d) => (
          <tr key={d.id}>
            <Td>
              <div className="text-[12.5px] text-[var(--ink)]">{d.title}</div>
              <div className="mt-0.5 text-[11px] text-[var(--muted)]">→ {d.action}</div>
            </Td>
            <Td nowrap>{d.cause}</Td>
            <Td right>{d.days ? <span style={{ color: d.critical ? 'var(--crit-ink)' : undefined }}>{d.days}{d.critical ? ' · KY' : ''}</span> : '—'}</Td>
            <Td right>{num(d.cost)}</Td>
            <Td nowrap><Badge tone={d.state === 'Açık' ? 'warn' : d.state === 'Çözüldü' ? 'ok' : 'accent'} dot>{d.state}</Badge></Td>
          </tr>
        ))}
      </Track>

      <Track title="Malzeme verimsizlik takibi" help="Planlanan sarf ile kullanılan miktarın farkı. Normal fire oranını aşan kısım kayıp tutarına çevrilir."
        pieTitle="Fazla fire tutarı" parts={pie(materialWaste, (x) => x.item, (x) => x.cost)} format={m}
        head={<tr><Th w={170}>Malzeme</Th><Th right>Planlanan</Th><Th right>Kullanılan</Th><Th right>Fire</Th><Th right>Normal</Th><Th right>Kayıp</Th><Th w={200}>Sebep</Th></tr>}>
        {materialWaste.map((x) => {
          const fire = ((x.used - x.plan) / x.plan) * 100
          return (
            <tr key={x.item}>
              <Td><span className="font-medium text-[var(--ink)]">{x.item}</span></Td>
              <Td right>{num(x.plan)} {x.unit}</Td>
              <Td right>{num(x.used)} {x.unit}</Td>
              <Td right><span style={{ color: fire > x.normal ? 'var(--crit-ink)' : 'var(--ok-ink)' }}>%{num(fire, 1)}</span></Td>
              <Td right><span className="text-[var(--muted)]">%{x.normal}</span></Td>
              <Td right><b>{num(x.cost)}</b></Td>
              <Td><span className="text-[12px] text-[var(--muted)]">{x.reason}</span></Td>
            </tr>
          )
        })}
      </Track>

      <Track title="Makine - ekipman verimsizlik takibi" help="Planlanan ve gerçekleşen makine saati ile çalışmadan bekleme (boşta) süresi."
        pieTitle="Boşta bekleme sebepleri" parts={pie(machineWaste, (x) => x.cause, (x) => x.hours)} format={(v) => `${num(v)} saat`}
        head={<tr><Th w={170}>Makine</Th><Th right>Adet</Th><Th right>Plan saat</Th><Th right>Gerçek saat</Th><Th right>Boşta</Th><Th w={120}>Verim</Th></tr>}>
        {machines.map((x) => {
          const e = (x.actualHours - x.idleHours) / x.actualHours
          return (
            <tr key={x.name}>
              <Td><span className="font-medium text-[var(--ink)]">{x.name}</span></Td>
              <Td right>{x.count}</Td>
              <Td right>{num(x.planHours)}</Td>
              <Td right><span style={{ color: x.actualHours > x.planHours ? 'var(--crit-ink)' : undefined }}>{num(x.actualHours)}</span></Td>
              <Td right>{num(x.idleHours)}</Td>
              <Td><Badge tone={e >= 0.9 ? 'ok' : e >= 0.85 ? 'warn' : 'crit'}>%{Math.round(e * 100)}</Badge></Td>
            </tr>
          )
        })}
      </Track>

      <Track title="Personel verimsizlik takibi" help="Planlanan ve gerçekleşen birim insan-saat; aradaki fark kayıp saattir."
        pieTitle="Kayıp saat sebepleri" parts={pie(staffWaste, (x) => x.cause, (x) => x.hours)} format={(v) => `${num(v)} saat`}
        head={<tr><Th w={200}>Kalem</Th><Th right>Plan / birim</Th><Th right>Gerçek / birim</Th><Th right>Yapılan</Th><Th right>Kayıp saat</Th><Th w={120}>Verim</Th></tr>}>
        {productivity.map((p) => {
          const e = p.planRate / p.actualRate
          return (
            <tr key={p.item}>
              <Td><span className="font-medium text-[var(--ink)]">{p.item}</span></Td>
              <Td right>{num(p.planRate, 2)}</Td>
              <Td right>{num(p.actualRate, 2)}</Td>
              <Td right>{num(p.done)} {p.unit}</Td>
              <Td right><b>{num(Math.max(0, (p.actualRate - p.planRate) * p.done))}</b></Td>
              <Td><Badge tone={e >= 0.95 ? 'ok' : e >= 0.85 ? 'warn' : 'crit'}>%{Math.round(e * 100)}</Badge></Td>
            </tr>
          )
        })}
      </Track>
    </>
  )
}

/** Verimsizlik başlığı: solda takip tablosu, sağda aynı yükseklikte pasta grafik */
function Track({ title, help, head, children, pieTitle, parts, format }: {
  title: string; help: string; head: ReactNode; children: ReactNode
  pieTitle: string; parts: { label: string; value: number; color: string }[]; format: (v: number) => string
}) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <div className="xl:col-span-8">
        <Card fill title={title} help={help} pad={false}><Table head={head}>{children}</Table></Card>
      </div>
      <div className="xl:col-span-4">
        <Card fill title={pieTitle}>
          <div className="flex flex-1 items-center"><Pie parts={parts} size={130} format={format} /></div>
        </Card>
      </div>
    </div>
  )
}

/* ---------------- Change Order ---------------- */

const CO_TONE: Record<string, 'ok' | 'warn' | 'crit' | 'accent' | 'neutral'> = {
  'Tamamlandı': 'ok', 'İmalatta': 'accent', 'Onaylandı': 'accent', 'İşveren onayında': 'warn', 'Reddedildi': 'crit',
}
const CO_STATES = ['İşveren onayında', 'Onaylandı', 'İmalatta', 'Tamamlandı', 'Reddedildi'] as const
const CL_TONE: Record<Claim['state'], 'ok' | 'warn' | 'crit'> = { 'Onaylandı': 'ok', 'Devam ediyor': 'warn', 'Reddedildi': 'crit' }
const IMPACTS: Impact[] = ['Süre', 'Dizayn', 'Maliyet', 'Personel']
const IMPACT_TONE: Record<Impact, 'warn' | 'info' | 'crit' | 'accent'> = { 'Süre': 'warn', 'Dizayn': 'info', 'Maliyet': 'crit', 'Personel': 'accent' }

/** Etki rozetleri — süresel, dizayn, maliyet, personel (birden çok olabilir) */
function ImpactBadges({ value }: { value: Impact[] }) {
  return <span className="flex flex-wrap gap-1">{value.map((i) => <Badge key={i} tone={IMPACT_TONE[i]}>{i}</Badge>)}</span>
}

/** Başlıktaki Import ve Ekle düğmeleri */
function AddImport({ onAdd, onImport, label }: { onAdd: () => void; onImport: () => void; label: string }) {
  return <>
    <Btn small onClick={onImport} title="Excel veya PDF listeden içe aktar">⇪ Import</Btn>
    <Btn small primary onClick={onAdd}>+ {label} ekle</Btn>
  </>
}

function ImportModal({ title, onClose }: { title: string; onClose: () => void }) {
  const [files, setFiles] = useState<string[]>([])
  return (
    <Modal title={`${title} içe aktar`} note="Excel listesi, işveren yazısı ya da PDF yüklenir; AI kayıtları ayrıştırıp onaya sunar." onClose={onClose} wide
      footer={<span className="ml-auto flex gap-2"><Btn onClick={onClose}>Vazgeç</Btn><Btn primary disabled={!files.length} onClick={onClose}>İçe aktar</Btn></span>}>
      <Dropzone files={files} onAdd={(n) => setFiles((f) => [...f, ...n])} onRemove={(n) => setFiles((f) => f.filter((x) => x !== n))}
        samples={['Degisiklik listesi.xlsx', 'Isveren yazisi IY-2026-041.pdf', 'Hak talebi dosyasi.pdf']} hint="Excel, PDF veya Word" />
    </Modal>
  )
}

/** Tutarın örnek maliyet kırılımı (malzeme, işçilik, makine, genel gider) */
function costSplit(amount: number, seed: number) {
  const mat = 0.42 + (seed % 5) * 0.02, lab = 0.26 + (seed % 3) * 0.02, mac = 0.12
  return [
    { k: 'Malzeme', v: amount * mat, c: 'var(--series-1)' },
    { k: 'İşçilik', v: amount * lab, c: 'var(--series-2)' },
    { k: 'Makine', v: amount * mac, c: 'var(--series-3)' },
    { k: 'Genel gider + kâr', v: amount * (1 - mat - lab - mac), c: 'var(--border-strong)' },
  ]
}

export function AdminChangeOrder() {
  const [list, setList] = useState<ChangeOrder[]>(changeOrders)
  const [open, setOpen] = useState<{ co: ChangeOrder; edit: boolean } | null>(null)
  const [importing, setImporting] = useState(false)
  const approved = list.filter((c) => ['Onaylandı', 'İmalatta', 'Tamamlandı'].includes(c.state))
  const pending = list.filter((c) => c.state === 'İşveren onayında')
  const rejected = list.filter((c) => c.state === 'Reddedildi')
  const sum = (l: ChangeOrder[]) => l.reduce((a, c) => a + c.amount, 0)
  const days = (l: ChangeOrder[]) => l.reduce((a, c) => a + c.days, 0)
  const blank: ChangeOrder = { no: `CO-${String(list.length + 1).padStart(2, '0')}`, title: '', amount: 0, days: 0, state: 'İşveren onayında', requestedBy: 'İşveren', impact: [], request: { ref: '', date: '2026-09-27', text: '' } }

  return (
    <>
      <Head title="Change Order" note="Değişiklik emri: kontrat şartları içinde, işverenle mutabık kalınan ek imalat, fiyat ve süre. Adet, toplam tutar, süre ve durum (onaylandı mı, imalatı yapılıyor mu) takip edilir."
        extra={<AddImport label="Değişiklik" onAdd={() => setOpen({ co: blank, edit: true })} onImport={() => setImporting(true)} />} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Değişiklik emri" value={list.length} sub={`${m(sum(list))} · +${days(list)} gün`} />
        <Kpi label="Onaylanan tutar" value={m(sum(approved))} sub={`${approved.length} adet · +${days(approved)} gün`} tone="ok" />
        <Kpi label="Onay bekleyen" value={m(sum(pending))} sub={`${pending.length} adet · +${days(pending)} gün`} tone="warn" />
        <Kpi label="Reddedilen" value={rejected.length} sub={`${m(sum(rejected))} · +${days(rejected)} gün`} tone="crit" />
      </div>
      <Card title="Duruma göre dağılım">
        <StackBar parts={(['Tamamlandı', 'İmalatta', 'Onaylandı', 'İşveren onayında', 'Reddedildi'] as const).map((s) => ({
          label: s, value: list.filter((c) => c.state === s).reduce((a, c) => a + c.amount, 0), color: `var(--${CO_TONE[s]})`,
        }))} />
        <div className="mt-2 flex flex-wrap gap-4 text-[12px] text-[var(--muted)]">
          {(['Tamamlandı', 'İmalatta', 'Onaylandı', 'İşveren onayında', 'Reddedildi'] as const).map((s) => (
            <span key={s}><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: `var(--${CO_TONE[s]})` }} />{s} · {m(list.filter((c) => c.state === s).reduce((a, c) => a + c.amount, 0))}</span>
          ))}
        </div>
      </Card>
      <Card title={`Değişiklik emirleri (${list.length})`} help="Satırdaki göz simgesi işveren talebini ve analizleri açar; kalem düzenler, çöp kutusu siler." pad={false}>
        <Table head={<tr><Th>No</Th><Th w={280}>Konu</Th><Th w={170}>Etki</Th><Th>Talep eden</Th><Th right>Tutar</Th><Th right>Süre</Th><Th>Durum</Th><Th center>İşlem</Th></tr>}>
          {list.map((c) => (
            <tr key={c.no} className="cursor-pointer" onClick={() => setOpen({ co: c, edit: false })}>
              <Td mono nowrap>{c.no}</Td>
              <Td><span className="text-[12.5px] text-[var(--ink)]">{c.title}</span></Td>
              <Td><ImpactBadges value={c.impact} /></Td>
              <Td nowrap><span className="text-[12px] text-[var(--muted)]">{c.requestedBy}</span></Td>
              <Td right>{num(c.amount)}</Td>
              <Td right>{c.days ? `+${c.days} gün` : '—'}</Td>
              <Td nowrap><Badge tone={CO_TONE[c.state]} dot>{c.state}</Badge></Td>
              <Td nowrap center>
                <RowActions name={`${c.no} · ${c.title}`} onOpen={() => setOpen({ co: c, edit: false })} onEdit={() => setOpen({ co: c, edit: true })}
                  onDelete={() => setList((l) => l.filter((x) => x.no !== c.no))} />
              </Td>
            </tr>
          ))}
        </Table>
      </Card>

      {importing && <ImportModal title="Değişiklik emri" onClose={() => setImporting(false)} />}
      {open && (
        <RecordModal
          kind="co" edit={open.edit}
          rec={{ no: open.co.no, title: open.co.title, amount: open.co.amount, days: open.co.days, state: open.co.state, impact: open.co.impact,
            who: open.co.requestedBy, ref: open.co.request.ref, date: open.co.request.date, text: open.co.request.text }}
          states={[...CO_STATES]} tone={(st) => CO_TONE[st]}
          onClose={() => setOpen(null)}
          onSave={(r) => {
            const next: ChangeOrder = { ...open.co, title: r.title, amount: r.amount, days: r.days, state: r.state as ChangeOrder['state'], impact: r.impact,
              request: { ref: r.ref, date: r.date, text: r.text } }
            setList((l) => (l.some((x) => x.no === next.no) ? l.map((x) => (x.no === next.no ? next : x)) : [...l, next]))
            setOpen(null)
          }} />
      )}
    </>
  )
}

/* ---------------- Claim ---------------- */

export function AdminClaim() {
  const [list, setList] = useState<Claim[]>(claims)
  const [open, setOpen] = useState<{ cl: Claim; edit: boolean } | null>(null)
  const [importing, setImporting] = useState(false)
  const by = (st: Claim['state']) => list.filter((c) => c.state === st)
  const ok = by('Onaylandı'), no = by('Reddedildi'), wip = by('Devam ediyor')
  const req = (l: Claim[]) => l.reduce((a, c) => a + c.amount, 0)
  const d = (l: Claim[]) => l.reduce((a, c) => a + c.days, 0)
  const okAmount = ok.reduce((a, c) => a + (c.approvedAmount ?? c.amount), 0)
  const okDays = ok.reduce((a, c) => a + (c.approvedDays ?? c.days), 0)
  const eur = (v: number) => money(v, C)
  const blank: Claim = { no: `CL-${String(list.length + 1).padStart(2, '0')}`, title: '', basis: '', amount: 0, days: 0, eventDate: '2026-09-27', noticeDue: '2026-10-25', noticed: false, state: 'Devam ediyor', impact: [] }

  return (
    <>
      <Head title="Claim" note="Hak talebi: ana kontratla örtüşmeyen, yükleniciden kaynaklanmayan ama zarara uğratan durumlar (işveren revizyonu, lisans alınamaması, yer tesliminin gecikmesi…) için ek bedel ve süre talebi. Amaç tahkime gitmeden, dokümanla güçlü bir pazarlıkla çözmek; ICCM bu durumları oluştuğu an saptar."
        extra={<AddImport label="Hak talebi" onAdd={() => setOpen({ cl: blank, edit: true })} onImport={() => setImporting(true)} />} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Talep sayısı" value={list.length} sub="Açılan hak talebi" />
        <Kpi label="Talep tutarı" value={eur(req(list))} sub="Toplam talep edilen" tone="accent" />
        <Kpi label="Süre talebi" value={`+${d(list)} gün`} sub="Toplam talep edilen süre" tone="accent" />
        <ClaimTile tone="ok" label="Onay" count={ok.length} amount={eur(okAmount)} days={okDays} sub={`%${Math.round((okAmount / Math.max(1, req(ok))) * 100)} kabul`} featured />
        <ClaimTile tone="crit" label="Red" count={no.length} amount={eur(req(no))} days={d(no)} />
        <ClaimTile tone="warn" label="Devam" count={wip.length} amount={eur(req(wip))} days={d(wip)} />
      </div>

      <Card title={`Hak talepleri (${list.length})`} help="Satırdaki göz simgesi olayı, dayanağı ve analizleri açar; kalem düzenler, çöp kutusu siler." pad={false}>
        <Table head={<tr><Th>No</Th><Th>Olay tarihi</Th><Th w={260}>Konu ve dayanak</Th><Th w={160}>Etki</Th><Th right>Tutar</Th><Th right>Süre</Th><Th w={150}>Bildirim süresi</Th><Th>Durum</Th><Th center>İşlem</Th></tr>}>
          {list.map((c) => {
            const left = daysTo(c.noticeDue)
            return (
              <tr key={c.no} className="cursor-pointer" onClick={() => setOpen({ cl: c, edit: false })}>
                <Td mono nowrap>{c.no}</Td>
                <Td nowrap>{date(c.eventDate)}</Td>
                <Td>
                  <div className="text-[12.5px] text-[var(--ink)]">{c.title}</div>
                  <div className="mt-0.5 text-[11px] text-[var(--muted)]">{c.basis}</div>
                </Td>
                <Td><ImpactBadges value={c.impact} /></Td>
                <Td right>
                  <div>{num(c.amount)}</div>
                  {c.approvedAmount != null && <div className="text-[11px] text-[var(--ok-ink)]">onay {num(c.approvedAmount)}</div>}
                </Td>
                <Td right>+{c.days} gün</Td>
                <Td nowrap>
                  {c.noticed
                    ? <span className="text-[12px] text-[var(--ok-ink)]">✓ Bildirildi</span>
                    : <span className="text-[12px] font-semibold text-[var(--crit-ink)]">{left} gün kaldı · {date(c.noticeDue)}</span>}
                </Td>
                <Td nowrap><Badge tone={CL_TONE[c.state]} dot>{c.state}</Badge></Td>
                <Td nowrap center>
                  <RowActions name={`${c.no} · ${c.title}`} onOpen={() => setOpen({ cl: c, edit: false })} onEdit={() => setOpen({ cl: c, edit: true })}
                    onDelete={() => setList((l) => l.filter((x) => x.no !== c.no))} />
                </Td>
              </tr>
            )
          })}
        </Table>
      </Card>

      {importing && <ImportModal title="Hak talebi" onClose={() => setImporting(false)} />}
      {open && (
        <RecordModal
          kind="cl" edit={open.edit}
          rec={{ no: open.cl.no, title: open.cl.title, amount: open.cl.amount, days: open.cl.days, state: open.cl.state, impact: open.cl.impact,
            who: 'Yüklenici', ref: open.cl.basis, date: open.cl.eventDate, text: open.cl.title,
            approvedAmount: open.cl.approvedAmount, approvedDays: open.cl.approvedDays, noticeDue: open.cl.noticeDue, noticed: open.cl.noticed }}
          states={['Devam ediyor', 'Onaylandı', 'Reddedildi']} tone={(st) => CL_TONE[st as Claim['state']]}
          onClose={() => setOpen(null)}
          onSave={(r) => {
            const next: Claim = { ...open.cl, title: r.title, basis: r.ref, eventDate: r.date, amount: r.amount, days: r.days, state: r.state as Claim['state'], impact: r.impact }
            setList((l) => (l.some((x) => x.no === next.no) ? l.map((x) => (x.no === next.no ? next : x)) : [...l, next]))
            setOpen(null)
          }} />
      )}
    </>
  )
}

/** Hak talebi özet kutusu: adet, tutar ve süre. `featured` onay kutusunu öne çıkarır. */
function ClaimTile({ tone, label, count, amount, days, sub, featured }: {
  tone: 'ok' | 'crit' | 'warn'; label: string; count: number; amount: string; days: number; sub?: string; featured?: boolean
}) {
  if (featured) {
    return (
      <div className="card lift relative overflow-hidden px-4 py-3 text-white" style={{ background: 'linear-gradient(135deg, #16A34A, #15803D)', borderColor: '#15803D' }}>
        <span className="absolute -right-3 -top-3 grid h-16 w-16 place-items-center rounded-full bg-white/15 text-[26px]">✓</span>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-white/85">{label}</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[24px] font-bold leading-tight tnum">{count}</span>
          <span className="text-[12px] text-white/85">onay</span>
        </div>
        <div className="mt-1 text-[15px] font-bold tnum">{amount}</div>
        <div className="mt-0.5 text-[11.5px] text-white/90">+{days} gün{sub ? ` · ${sub}` : ''}</div>
      </div>
    )
  }
  return (
    <div className="card lift px-4 py-3" style={{ background: `var(--${tone}-bg)`, borderColor: `var(--${tone})` }}>
      <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: `var(--${tone}-ink)` }}>{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-[24px] font-bold leading-tight tnum" style={{ color: `var(--${tone}-ink)` }}>{count}</span>
        <span className="text-[12px] text-[var(--muted)]">{label === 'Red' ? 'red' : 'devam eden'}</span>
      </div>
      <div className="mt-1 text-[15px] font-bold text-[var(--ink)] tnum">{amount}</div>
      <div className="mt-0.5 text-[11.5px] text-[var(--muted)]">+{days} gün</div>
    </div>
  )
}

/* ---------------- Kayıt pop-up'ı (change order / claim) ---------------- */

interface Rec {
  no: string; title: string; amount: number; days: number; state: string; impact: Impact[]
  who: string; ref: string; date: string; text: string
  approvedAmount?: number; approvedDays?: number; noticeDue?: string; noticed?: boolean
}

/**
 * Aç: üstte işveren talebi (claim'de olay ve dayanak), altta analizler — maliyet kırılımı, süre etkisi, etki ve durum akışı.
 * Düzenle: aynı pencere form olarak açılır.
 */
function RecordModal({ kind, rec, edit, states, tone, onClose, onSave }: {
  kind: 'co' | 'cl'; rec: Rec; edit: boolean; states: string[]
  tone: (state: string) => 'ok' | 'warn' | 'crit' | 'accent' | 'neutral'
  onClose: () => void; onSave: (r: Rec) => void
}) {
  const [r, setR] = useState<Rec>(rec)
  const [editing, setEditing] = useState(edit)
  const set = <K extends keyof Rec>(k: K, v: Rec[K]) => setR((x) => ({ ...x, [k]: v }))
  const split = costSplit(r.amount, Number(r.no.slice(-2)) || 1)
  const isCo = kind === 'co'
  const stepIdx = states.indexOf(r.state)
  const ready = r.title.trim().length > 2

  return (
    <Modal wide title={`${r.no} · ${r.title || (isCo ? 'Yeni değişiklik emri' : 'Yeni hak talebi')}`}
      note={isCo ? `${r.who} · ${r.ref || 'yazı no yok'} · ${date(r.date)}` : `${r.ref} · olay ${date(r.date)}`}
      onClose={onClose}
      footer={editing ? <>
        <span className="text-[11.5px] text-[var(--faint)]">{ready ? 'Kaydedilmeye hazır' : 'Konu zorunlu'}</span>
        <span className="ml-auto flex gap-2"><Btn onClick={onClose}>Vazgeç</Btn><Btn primary disabled={!ready} onClick={() => onSave(r)}>Kaydet</Btn></span>
      </> : <>
        <Badge tone={tone(r.state)} dot>{r.state}</Badge>
        <span className="ml-auto flex gap-2"><Btn onClick={() => setEditing(true)}>Düzenle</Btn><Btn primary onClick={onClose}>Kapat</Btn></span>
      </>}>
      {editing ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field required label="Konu" value={r.title} onChange={(v) => set('title', v)} /></div>
          <Field label={isCo ? 'Yazı no' : 'Sözleşme dayanağı'} value={r.ref} onChange={(v) => set('ref', v)} />
          <Field label={isCo ? 'Talep tarihi' : 'Olay tarihi'} type="date" value={r.date} onChange={(v) => set('date', v)} />
          <Field label={`Tutar (${C})`} type="number" value={String(r.amount)} onChange={(v) => set('amount', Number(v) || 0)} />
          <Field label="Süre (gün)" type="number" value={String(r.days)} onChange={(v) => set('days', Number(v) || 0)} />
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-[var(--ink)]">Durum</span>
            <select value={r.state} onChange={(e) => set('state', e.target.value)}
              className="h-10 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-[13px] text-[var(--ink)]">
              {states.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-[var(--ink)]">Etki</span>
            <div className="flex flex-wrap gap-1.5">
              {IMPACTS.map((i) => {
                const on = r.impact.includes(i)
                return (
                  <button key={i} onClick={() => set('impact', on ? r.impact.filter((x) => x !== i) : [...r.impact, i])}
                    className="h-10 rounded-md border px-3 text-[12.5px] font-medium transition-colors"
                    style={on ? { background: `var(--${IMPACT_TONE[i]}-bg)`, borderColor: `var(--${IMPACT_TONE[i]})`, color: `var(--${IMPACT_TONE[i]}-ink)` } : { background: 'var(--surface)', borderColor: 'var(--border-strong)', color: 'var(--muted)' }}>
                    {on ? '✓ ' : ''}{i}
                  </button>
                )
              })}
            </div>
          </div>
          {isCo && (
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-[12px] font-medium text-[var(--ink)]">İşveren talebi</span>
              <textarea value={r.text} onChange={(e) => set('text', e.target.value)} rows={3}
                className="rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-[13px] text-[var(--ink)]" />
            </label>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* İşveren talebi / olay */}
          <section>
            <div className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-[var(--muted)]">{isCo ? 'İşveren talebi' : 'Olay ve dayanak'}</div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 text-[13px] leading-relaxed text-[var(--ink)]">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-[11.5px] text-[var(--muted)]">
                <span className="mono">{r.ref}</span><span>·</span><span>{date(r.date)}</span><span>·</span><span>{r.who}</span>
              </div>
              {isCo ? r.text : <>{r.title}. Dayanak: <b>{r.ref}</b>. {r.noticed ? 'Bildirim süresi içinde yapıldı.' : `Bildirim son günü ${date(r.noticeDue ?? r.date)} — ${daysTo(r.noticeDue ?? r.date)} gün kaldı.`}</>}
            </div>
          </section>

          {/* Analizler */}
          <section>
            <div className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-[var(--muted)]">Analizler</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-[var(--border)] p-3">
                <div className="text-[11.5px] text-[var(--muted)]">{isCo ? 'Tutar' : 'Talep / onay'}</div>
                <div className="mt-0.5 text-[18px] font-bold text-[var(--ink)] tnum">{money(r.amount, C)}</div>
                {r.approvedAmount != null && <div className="text-[12px] text-[var(--ok-ink)]">Onaylanan {money(r.approvedAmount, C)} · %{Math.round((r.approvedAmount / r.amount) * 100)}</div>}
              </div>
              <div className="rounded-lg border border-[var(--border)] p-3">
                <div className="text-[11.5px] text-[var(--muted)]">Süre etkisi</div>
                <div className="mt-0.5 text-[18px] font-bold text-[var(--ink)] tnum">{r.days ? `+${r.days} gün` : 'Yok'}</div>
                <div className="text-[12px] text-[var(--muted)]">{r.approvedDays != null ? `Onaylanan +${r.approvedDays} gün` : r.days > 10 ? 'Kritik yolu etkiler' : 'Bollukla karşılanır'}</div>
              </div>
              <div className="rounded-lg border border-[var(--border)] p-3">
                <div className="text-[11.5px] text-[var(--muted)]">Etki</div>
                <div className="mt-1.5"><ImpactBadges value={r.impact} /></div>
              </div>
            </div>
            <div className="mt-3 rounded-lg border border-[var(--border)] p-3">
              <div className="mb-2 text-[12px] font-semibold text-[var(--ink)]">Maliyet kırılımı</div>
              <div className="flex h-3 overflow-hidden rounded-full">{split.map((x) => <span key={x.k} style={{ width: `${(x.v / Math.max(1, r.amount)) * 100}%`, background: x.c }} />)}</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[12px] sm:grid-cols-4">
                {split.map((x) => (
                  <span key={x.k} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: x.c }} />{x.k}<b className="ml-auto tnum">{num(x.v)}</b></span>
                ))}
              </div>
            </div>
            <div className="mt-3 rounded-lg border border-[var(--border)] p-3">
              <div className="mb-2 text-[12px] font-semibold text-[var(--ink)]">Durum akışı</div>
              <div className="flex flex-wrap items-center gap-1.5">
                {states.map((st, i) => (
                  <span key={st} className="flex items-center gap-1.5">
                    {i > 0 && <span className="text-[var(--faint)]">→</span>}
                    <span className="rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium"
                      style={i === stepIdx ? { background: `var(--${tone(st)}-bg)`, borderColor: `var(--${tone(st)})`, color: `var(--${tone(st)}-ink)` } : { borderColor: 'var(--border)', color: i < stepIdx ? 'var(--ink)' : 'var(--faint)' }}>
                      {i < stepIdx ? '✓ ' : ''}{st}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </Modal>
  )
}
