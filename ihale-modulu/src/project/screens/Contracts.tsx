import { useState } from 'react'
import { Badge, Card, IconBtn, Kpi, PageHead, RowActions, StickyPane, Table, Td, Th } from '../../components/ui'
import type { Tone } from '../../components/ui'
import { date, moneyShort, num, pct } from '../../lib/format'
import { Legend, StackBar } from '../charts'
import { changeOrders, claims, contractMatches, ipcs, monthName, prj, subcontracts } from '../data'
import type { Subcontract } from '../data'

/**
 * Contracts alt modülü: Dashboard, Main Contract (işverenle) ve Sub-Contracts (alt yükleniciler).
 * Ana kontrat ile alt yüklenici kontratları aynı kalemde karşılaştırılır; fark varsa uyarı düşer.
 */

const m = (v: number) => moneyShort(v, prj.currency)
const TODAY = '2026-09-27'
const mainTotal = prj.contractValue + prj.approvedChange

/** Alt yüklenici sözleşme bilgileri — prototipte sabit */
const SUB_META: Record<string, { no: string; signed: string; finish: string; retention: number; state: 'Devam ediyor' | 'Tamamlanıyor' | 'Askıda' }> = {
  'Kuzey Çelik Yapı': { no: 'SC-01', signed: '2025-06-20', finish: '2026-10-31', retention: 0.05, state: 'Devam ediyor' },
  'Marmara Yapı': { no: 'SC-02', signed: '2025-02-10', finish: '2026-01-15', retention: 0.05, state: 'Tamamlanıyor' },
  'Panelsan': { no: 'SC-03', signed: '2025-11-05', finish: '2026-11-20', retention: 0.05, state: 'Devam ediyor' },
  'Tesisat Grup': { no: 'SC-04', signed: '2026-02-18', finish: '2026-12-05', retention: 0.05, state: 'Devam ediyor' },
  'Volt Elektrik': { no: 'SC-05', signed: '2026-03-01', finish: '2026-12-05', retention: 0.05, state: 'Devam ediyor' },
  'Zemin Pro': { no: 'SC-06', signed: '2026-06-10', finish: '2026-11-30', retention: 0.05, state: 'Devam ediyor' },
  'Öz Duvar': { no: 'SC-07', signed: '2026-04-01', finish: '2026-10-18', retention: 0.05, state: 'Askıda' },
}
const STATE_TONE: Record<string, Tone> = { 'Devam ediyor': 'accent', 'Tamamlanıyor': 'ok', 'Askıda': 'warn' }

const diffs = contractMatches.filter((c) => c.subQty > c.mainQty || c.subPrice > c.mainPrice)
const diffLoss = diffs.reduce((a, c) => a + (c.subQty * c.subPrice - c.mainQty * c.mainPrice), 0)

/* ---------------- Dashboard ---------------- */

export function ContractsDashboard({ onGo }: { onGo: (k: string) => void }) {
  const paid = ipcs.filter((i) => i.state === 'Ödendi').reduce((a, i) => a + i.gross, 0)
  const waiting = ipcs.filter((i) => i.state !== 'Ödendi').reduce((a, i) => a + i.gross, 0)
  const subValue = subcontracts.reduce((a, s) => a + s.value, 0)
  const subDone = subcontracts.reduce((a, s) => a + s.done, 0)
  const subPaid = subcontracts.reduce((a, s) => a + s.paid, 0)

  return (
    <>
      <PageHead title="Contracts · Dashboard"
        note="İşverenle yapılan ana kontrat ve alt yüklenici kontratlarının özeti: bedeller, alınan ve ödenen tutarlar, taşere oranı ve ana kontratla uyuşmayan kalemler." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Ana kontrat" value={m(mainTotal)} sub={`Değişiklik emri dâhil (+${m(prj.approvedChange)})`} tone="accent" />
        <Kpi label="İşverenden alınan" value={m(paid)} sub={`${pct((paid / mainTotal) * 100)} · onay bekleyen ${m(waiting)}`} tone="ok" />
        <Kpi label="Alt yüklenici kontratları" value={m(subValue)} sub={`${subcontracts.length} sözleşme · taşere oranı ${pct((subValue / mainTotal) * 100)}`} />
        <Kpi label="Alt yükleniciye ödenen" value={m(subPaid)} sub={`Yapılan iş ${m(subDone)}`} />
        <Kpi label="Kontrat farkı" value={m(diffLoss)} sub={`${diffs.length} kalemde ana kontrattan pahalı`} tone="crit"
          help="Aynı kalem alt yükleniciye ana kontrattan daha fazla miktar ya da daha yüksek birim fiyatla verilmişse oluşan fark." />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Ana kontrat" help="Sözleşme bedelinin alınan, onay bekleyen ve kalan kısmı." right={<button onClick={() => onGo('main_contract')} className="text-[12px] font-medium text-[var(--accent)]">Main Contract →</button>}>
          <StackBar height={16} parts={[
            { label: 'Alınan', value: paid, color: 'var(--series-1)' },
            { label: 'Onay bekleyen', value: waiting, color: 'var(--series-2)' },
            { label: 'Kalan', value: mainTotal - paid - waiting, color: 'var(--surface-3)' },
          ]} />
          <div className="mt-2"><Legend items={[{ label: `Alınan ${m(paid)}`, color: 'var(--series-1)' }, { label: `Onay bekleyen ${m(waiting)}`, color: 'var(--series-2)' }, { label: `Kalan ${m(mainTotal - paid - waiting)}`, color: 'var(--border-strong)' }]} /></div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              ['Avans', m(prj.advance), 'Mahsup ediliyor'],
              ['Teminat kesintisi', `%${prj.retentionRate * 100}`, m(ipcs.reduce((a, i) => a + i.retention, 0))],
              ['Değişiklik emri', `${changeOrders.length} adet`, `${changeOrders.filter((c) => c.state === 'İşveren onayında').length} onay bekliyor`],
            ].map(([l, v, s]) => (
              <div key={l} className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--faint)]">{l}</div>
                <div className="text-[15px] font-bold text-[var(--ink)] tnum">{v}</div>
                <div className="text-[11px] text-[var(--muted)]">{s}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Alt yüklenici kontratları" help="Her sözleşmede ödenen, yapılıp ödenmeyen ve kalan iş." right={<button onClick={() => onGo('sub_contracts')} className="text-[12px] font-medium text-[var(--accent)]">Sub-Contracts →</button>}>
          <div className="flex flex-col gap-2">
            {subcontracts.map((s) => (
              <div key={s.name} className="grid grid-cols-[130px_1fr_70px] items-center gap-2 text-[12px]">
                <span className="truncate font-medium text-[var(--ink)]" title={s.scope}>{s.name}</span>
                <StackBar height={10} parts={[
                  { label: 'Ödenen', value: s.paid, color: 'var(--series-1)' },
                  { label: 'Yapılan, ödenmedi', value: s.done - s.paid, color: 'var(--series-2)' },
                  { label: 'Kalan', value: s.value - s.done, color: 'var(--surface-3)' },
                ]} />
                <span className="text-right text-[var(--muted)] tnum">{m(s.value)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3"><Legend items={[{ label: 'Ödenen', color: 'var(--series-1)' }, { label: 'Yapılan, ödenmedi', color: 'var(--series-2)' }, { label: 'Kalan', color: 'var(--border-strong)' }]} /></div>
        </Card>
      </div>

      {diffs.length > 0 && (
        <Card title={`Ana kontratla uyuşmayan kalemler (${diffs.length})`} help="Alt yükleniciye verilen miktar ya da birim fiyat ana kontrattan yüksekse otomatik düşer." pad={false}>
          {diffs.map((d) => (
            <div key={d.item} className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-2 text-[12.5px] last:border-0">
              <span className="h-2 w-2 rounded-full bg-[var(--crit)]" />
              <span className="font-semibold text-[var(--ink)]">{d.item}</span>
              <span className="text-[var(--muted)]">İşverenle {num(d.mainQty)} {d.unit} × {num(d.mainPrice, 2)} · {d.sub} ile {num(d.subQty)} {d.unit} × {num(d.subPrice, 2)}</span>
              <span className="ml-auto font-bold text-[var(--crit)] tnum">+{m(d.subQty * d.subPrice - d.mainQty * d.mainPrice)}</span>
            </div>
          ))}
        </Card>
      )}
    </>
  )
}

/* ---------------- Main Contract ---------------- */

export function MainContract() {
  const terms: [string, string][] = [
    ['İşveren', prj.employer],
    ['Sözleşme türü', 'Birim fiyat · FIDIC Red Book 1999'],
    ['Sözleşme tarihi', date(prj.contractDate)],
    ['İşe başlama', date(prj.start)],
    ['Bitiş (sözleşme)', date(prj.plannedFinish)],
    ['Sözleşme bedeli', m(prj.contractValue)],
    ['Onaylı değişiklik', `+${m(prj.approvedChange)}`],
    ['Avans', `${m(prj.advance)} (%10)`],
    ['Teminat kesintisi', `%${prj.retentionRate * 100} · geçici kabulde yarısı iade`],
    ['Ödeme süresi', 'Hakediş onayından sonra 60 gün'],
    ['Gecikme cezası', 'Günlük ‰0,5 · tavan %10'],
    ['Bildirim süresi (claim)', 'Olaydan itibaren 28 gün'],
  ]
  return (
    <>
      <PageHead title="Contracts · Main Contract"
        note="İşverenle imzalanan ana kontrat: künye, hakedişler, değişiklik emirleri ve bildirim süreleri. Kontrat riskleri Risk › Contract Risks sayfasındadır." />
      <Card title="Sözleşme künyesi">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
          {terms.map(([l, v]) => (
            <div key={l} className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
              <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--faint)]">{l}</div>
              <div className="text-[13px] font-semibold text-[var(--ink)]">{v}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <Card title={`Hakedişler (${ipcs.length})`} help="İşverene kesilen hakedişler: gross, avans mahsubu, teminat kesintisi ve net. Son on hakediş gösterilir." pad={false}>
            <Table dense head={<tr><Th>No</Th><Th>Dönem</Th><Th right>Gross</Th><Th right>Avans mahsubu</Th><Th right>Teminat</Th><Th right>Net</Th><Th>Durum</Th></tr>}>
              {[...ipcs].reverse().slice(0, 10).map((i) => (
                <tr key={i.no} className="hover:bg-[var(--surface-2)]">
                  <Td mono nowrap>IPC-{String(i.no).padStart(2, '0')}</Td><Td nowrap>{monthName(i.month)}</Td>
                  <Td right>{num(i.gross)}</Td><Td right>{num(i.advanceRecovery)}</Td><Td right>{num(i.retention)}</Td><Td right><b>{num(i.net)}</b></Td>
                  <Td nowrap><Badge tone={i.state === 'Ödendi' ? 'ok' : i.state === 'Onaylandı' ? 'accent' : 'warn'}>{i.state}</Badge>{i.lateDays ? <span className="ml-1 text-[11px] text-[var(--crit)]">{i.lateDays} gün geç</span> : null}</Td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
        <div className="flex flex-col gap-4 xl:col-span-5">
          <Card title={`Değişiklik emirleri (${changeOrders.length})`} pad={false}>
            {changeOrders.map((c) => (
              <div key={c.no} className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2 text-[12.5px] last:border-0">
                <span className="mono w-12 text-[11px] text-[var(--faint)]">{c.no}</span>
                <span className="min-w-0 flex-1 truncate text-[var(--ink)]">{c.title}</span>
                <span className="text-[var(--muted)] tnum">{m(c.amount)}</span>
                <Badge tone={c.state === 'Reddedildi' ? 'crit' : c.state === 'İşveren onayında' ? 'warn' : 'ok'}>{c.state}</Badge>
              </div>
            ))}
          </Card>
          <Card title="Bildirim süreleri" help="Hak taleplerinde sözleşmedeki 28 günlük bildirim süresi; kaçırılırsa hak düşer." pad={false}>
            {claims.map((c) => {
              const left = Math.round((new Date(c.noticeDue).getTime() - new Date(TODAY).getTime()) / 86_400_000)
              return (
                <div key={c.no} className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2 text-[12.5px] last:border-0">
                  <span className="mono w-12 text-[11px] text-[var(--faint)]">{c.no}</span>
                  <span className="min-w-0 flex-1 truncate text-[var(--ink)]">{c.title}</span>
                  {c.noticed ? <Badge tone="ok">Bildirildi</Badge> : <Badge tone="crit" dot>{left} gün kaldı</Badge>}
                </div>
              )
            })}
          </Card>
        </div>
      </div>
    </>
  )
}

/* ---------------- Sub-Contracts ---------------- */

export function SubContracts() {
  const [list, setList] = useState<Subcontract[]>(subcontracts)
  const [selName, setSelName] = useState(subcontracts[0].name)
  const sel = list.find((s) => s.name === selName) ?? list[0]
  const meta = sel ? SUB_META[sel.name] : undefined
  const matches = contractMatches.filter((c) => c.sub === sel?.name)

  return (
    <>
      <PageHead title="Contracts · Sub-Contracts"
        note="Alt yüklenici sözleşmeleri: kapsam, bedel, yapılan ve ödenen iş. Satıra tıklayınca sağda sözleşmenin detayı ve ana kontratla karşılaştırması açılır." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Sözleşme" value={list.length} sub={`${list.filter((s) => SUB_META[s.name]?.state === 'Askıda').length} askıda`} />
        <Kpi label="Toplam bedel" value={m(list.reduce((a, s) => a + s.value, 0))} tone="accent" />
        <Kpi label="Yapılan iş" value={m(list.reduce((a, s) => a + s.done, 0))} sub={pct((list.reduce((a, s) => a + s.done, 0) / list.reduce((a, s) => a + s.value, 0)) * 100)} />
        <Kpi label="Ödenen" value={m(list.reduce((a, s) => a + s.paid, 0))} sub={`Ödenmemiş hakediş ${m(list.reduce((a, s) => a + s.done - s.paid, 0))}`} tone="ok" />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <Card title="Sözleşmeler" right={<IconBtn icon="add" title="Sözleşme ekle" />} pad={false}>
            <Table dense head={<tr><Th>No</Th><Th>İmza</Th><Th>Bitiş</Th><Th w={170}>Alt yüklenici</Th><Th right>Bedel</Th><Th w={120}>İlerleme</Th><Th right>Ödenen</Th><Th>Durum</Th><Th w={70} center>İşlem</Th></tr>}>
              {list.map((s) => {
                const mt = SUB_META[s.name]
                const done = (s.done / s.value) * 100
                return (
                  <tr key={s.name} onClick={() => setSelName(s.name)} className="cursor-pointer hover:bg-[var(--surface-2)]"
                    style={sel?.name === s.name ? { background: 'var(--accent-soft)' } : undefined}>
                    <Td mono nowrap>{mt?.no}</Td><Td nowrap>{mt ? date(mt.signed) : '—'}</Td><Td nowrap>{mt ? date(mt.finish) : '—'}</Td>
                    <Td><span className="block font-medium text-[var(--ink)]">{s.name}</span><span className="block truncate text-[11px] text-[var(--faint)]" title={s.scope}>{s.scope}</span></Td>
                    <Td right>{num(s.value)}</Td>
                    <Td><span className="flex items-center gap-1.5"><span className="h-[6px] flex-1 overflow-hidden rounded-full bg-[var(--surface-3)]"><span className="block h-full rounded-full bg-[var(--series-1)]" style={{ width: `${done}%` }} /></span><span className="w-8 text-right text-[11px] tnum">%{Math.round(done)}</span></span></Td>
                    <Td right>{num(s.paid)}</Td>
                    <Td nowrap>{mt && <Badge tone={STATE_TONE[mt.state]}>{mt.state}</Badge>}</Td>
                    <Td center nowrap><RowActions name={s.name} onEdit={() => setSelName(s.name)} onDelete={() => setList((l) => l.filter((x) => x.name !== s.name))} /></Td>
                  </tr>
                )
              })}
            </Table>
          </Card>
        </div>
        <div className="xl:col-span-4">
          <StickyPane>
            {sel && meta && (
              <Card title={sel.name} subtitle={meta.no}>
                <div className="flex flex-col gap-3 text-[12.5px]">
                  <div className="text-[var(--muted)]">{sel.scope}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ['Bedel', m(sel.value)], ['Yapılan', m(sel.done)], ['Ödenen', m(sel.paid)], ['Teminat', m(sel.done * meta.retention)],
                      ['İmza', date(meta.signed)], ['Bitiş', date(meta.finish)],
                    ].map(([l, v]) => (
                      <div key={l} className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5">
                        <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--faint)]">{l}</div>
                        <div className="font-bold text-[var(--ink)] tnum">{v}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Ana kontratla karşılaştırma</div>
                    {matches.length === 0 && <div className="text-[12px] text-[var(--faint)]">Eşleşen kalem tanımlanmadı.</div>}
                    {matches.map((c) => {
                      const diff = c.subQty * c.subPrice - c.mainQty * c.mainPrice
                      const bad = c.subQty > c.mainQty || c.subPrice > c.mainPrice
                      return (
                        <div key={c.item} className="rounded-md border px-2.5 py-2" style={{ borderColor: bad ? 'var(--crit)' : 'var(--border)', background: bad ? 'var(--crit-bg)' : 'var(--surface-2)' }}>
                          <div className="font-semibold text-[var(--ink)]">{c.item}</div>
                          <div className="text-[11.5px] text-[var(--muted)]">Ana: {num(c.mainQty)} {c.unit} × {num(c.mainPrice, 2)} · Alt: {num(c.subQty)} {c.unit} × {num(c.subPrice, 2)}</div>
                          <div className="text-[12px] font-bold tnum" style={{ color: bad ? 'var(--crit)' : 'var(--ok)' }}>{diff > 0 ? '+' : ''}{m(diff)}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </Card>
            )}
          </StickyPane>
        </div>
      </div>
    </>
  )
}
