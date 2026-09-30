import { useState } from 'react'
import { Badge, Btn, Card, ColumnFilter, ExportButtons, Field, IconBtn, Kpi, Modal, PageHead, RowActions, Table, Td, Th } from '../../components/ui'
import type { Tone } from '../../components/ui'
import { date, moneyShort, num } from '../../lib/format'
import { Donut, Legend, MonthColumns } from '../charts'
import { prj } from '../data'
import { sasItems, stockFlow, stockHistory, stockMoves } from '../procurementData'
import type { SasItem, SasStage } from '../procurementData'

/**
 * Procurement: satın alma talepleri (SAS) ve depo (Stock).
 * Talep → onay → sipariş → sahaya ulaşma → depoya aktarma akışı; süreler analiz için tutulur.
 */

const C = prj.currency
const m = (v: number) => moneyShort(v, C)
const TODAY = '2026-09-27'
const dd = (a?: string, b?: string) => (a && b ? Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000) : null)
const URG: Record<SasItem['urgency'], Tone> = { 'Acil': 'crit', 'Normal': 'accent', 'Düşük': 'neutral' }
const PEOPLE = ['b.yildiz', 'o.kara', 'h.demir', 'm.aydin']

/* ---------------- SAS ---------------- */

export function Sas() {
  const [items, setItems] = useState<SasItem[]>(sasItems)
  const [adding, setAdding] = useState(false)
  const set = (id: string, patch: Partial<SasItem>) => setItems((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)))

  const req = items.filter((i) => i.stage === 'Onay bekliyor')
  const ord = items.filter((i) => i.stage === 'Sipariş verildi' || i.stage === 'Yolda')
  const arr = items.filter((i) => i.stage === 'Sahada' || i.stage === 'Depoda')
  const approvalDays = items.map((i) => dd(i.requestedAt, i.orderedAt)).filter((x): x is number => x != null)
  const deliveryDays = items.map((i) => dd(i.orderedAt, i.arrivedAt)).filter((x): x is number => x != null)
  const avg = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0)

  return (
    <>
      <PageHead title="Procurement · SAS"
        note="Tanımlı kullanıcıların malzeme, satın alma ve hizmet talepleri. Talep eklenirken malzeme kodu, gerektiği tarih, aciliyet ve onaycılar seçilir; onaycıların ana sayfasına bildirim düşer. Onaylar tamamlanınca sipariş verilir; ürün sahaya ulaşınca “depoya aktar” ile stoka girer. Onay ve teslim süreleri analiz için tutulur."
        right={<ExportButtons />} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Toplam talep" value={items.length} sub="Bu proje" />
        <Kpi label="Onay bekleyen" value={req.length} sub={`${req.filter((i) => i.urgency === 'Acil').length} acil`} tone="warn" />
        <Kpi label="Devam eden sipariş" value={ord.length} sub="Sipariş verildi + yolda" tone="accent" />
        <Kpi label="Tamamlanan" value={arr.length} sub={`${items.filter((i) => i.stage === 'Depoda').length} depoya aktarıldı`} tone="ok" />
        <Kpi label="Toplam değer" value={m(items.reduce((a, i) => a + i.value, 0))} sub={`Ort. onay ${avg(approvalDays).toFixed(1).replace('.', ',')} gün · teslim ${Math.round(avg(deliveryDays))} gün`} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* 1. Talepler — yapılacaklar listesi gibi */}
        <Card title={`Talepler (${req.length})`} help="Yeni talep + ile eklenir. Her onaycı kendi onayını verir; hepsi onaylayınca talep siparişe geçer."
          right={<IconBtn icon="add" primary title="Talep ekle" onClick={() => setAdding(true)} />} pad={false}>
          {req.map((i) => {
            const next = i.approvers.find((a) => !i.approved.includes(a))
            return (
              <div key={i.id} className="border-b border-[var(--border)] px-4 py-2.5 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="mono text-[11px] text-[var(--faint)]">{i.id}</span>
                  <Badge tone={URG[i.urgency]}>{i.urgency}</Badge>
                  <span className="ml-auto"><RowActions name={i.id} onDelete={() => setItems((l) => l.filter((x) => x.id !== i.id))} /></span>
                </div>
                <div className="mt-1 text-[12.5px] font-medium text-[var(--ink)]">{i.desc}</div>
                <div className="text-[11px] text-[var(--muted)]"><span className="mono">{i.code}</span> · {num(i.qty)} {i.unit} · gerek: {date(i.needBy)} · {m(i.value)}</div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  {i.approvers.map((a) => (
                    <span key={a} className="mono rounded px-1.5 py-0.5 text-[10.5px]"
                      style={i.approved.includes(a) ? { background: 'var(--ok-bg)', color: 'var(--ok)' } : { background: 'var(--surface-3)', color: 'var(--muted)' }}>
                      {i.approved.includes(a) ? '✓ ' : ''}{a}
                    </span>
                  ))}
                  {next && (
                    <span className="ml-auto">
                      <Btn small primary onClick={() => {
                        const approved = [...i.approved, next]
                        set(i.id, approved.length === i.approvers.length ? { approved, stage: 'Sipariş verildi', orderedAt: TODAY, supplier: 'Tedarikçi seçilecek' } : { approved })
                      }}>{next} olarak onayla</Btn>
                    </span>
                  )}
                </div>
              </div>
            )
          })}
          {req.length === 0 && <div className="px-4 py-6 text-center text-[12px] text-[var(--faint)]">Onay bekleyen talep yok.</div>}
        </Card>

        {/* 2. Sipariş durumu */}
        <Card title={`Sipariş durumu (${ord.length})`} help="Onaydan geçen talepler: sipariş verildi → yolda → sahaya ulaştı." pad={false}>
          {ord.map((i) => {
            const steps: SasStage[] = ['Sipariş verildi', 'Yolda', 'Sahada']
            const at = steps.indexOf(i.stage)
            return (
              <div key={i.id} className="border-b border-[var(--border)] px-4 py-2.5 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="mono text-[11px] text-[var(--faint)]">{i.id}</span>
                  <Badge tone={URG[i.urgency]}>{i.urgency}</Badge>
                  <span className="ml-auto text-[11px] text-[var(--muted)]">{i.supplier}</span>
                </div>
                <div className="mt-1 text-[12.5px] font-medium text-[var(--ink)]">{i.desc}</div>
                <div className="text-[11px] text-[var(--muted)]">{num(i.qty)} {i.unit} · gerek: {date(i.needBy)} · sipariş {date(i.orderedAt!)}</div>
                <div className="mt-2 flex items-center gap-1">
                  {steps.map((s, k) => (
                    <span key={s} className="flex flex-1 flex-col gap-1">
                      <span className="h-[5px] rounded-full" style={{ background: k <= at ? 'var(--series-1)' : 'var(--surface-3)' }} />
                      <span className="text-[10px]" style={{ color: k <= at ? 'var(--ink)' : 'var(--faint)' }}>{s}</span>
                    </span>
                  ))}
                </div>
                <div className="mt-1.5 flex justify-end gap-1.5">
                  {i.stage === 'Sipariş verildi' && <Btn small onClick={() => set(i.id, { stage: 'Yolda' })}>Yola çıktı</Btn>}
                  {i.stage === 'Yolda' && <Btn small primary onClick={() => set(i.id, { stage: 'Sahada', arrivedAt: TODAY })}>Sahaya ulaştı</Btn>}
                </div>
              </div>
            )
          })}
        </Card>

        {/* 3. Sahaya ulaşan — depoya aktar */}
        <Card title={`Sahaya ulaşan (${arr.length})`} help="Sahaya ulaşan malzeme ve hizmetler “depoya aktar” ile stoka girer. Onay ve teslim süreleri analiz için tutulur." pad={false}>
          {arr.map((i) => (
            <div key={i.id} className="border-b border-[var(--border)] px-4 py-2.5 last:border-0">
              <div className="flex items-center gap-2">
                <span className="mono text-[11px] text-[var(--faint)]">{i.id}</span>
                <span className="ml-auto">{i.stage === 'Depoda' ? <Badge tone="ok" dot>Depoda</Badge> : <Btn small primary onClick={() => set(i.id, { stage: 'Depoda' })}>Depoya aktar</Btn>}</span>
              </div>
              <div className="mt-1 text-[12.5px] font-medium text-[var(--ink)]">{i.desc}</div>
              <div className="mt-1 grid grid-cols-3 gap-1.5 text-[11px]">
                <span className="rounded bg-[var(--surface-2)] px-1.5 py-1"><span className="block text-[var(--faint)]">Onay</span><b className="tnum">{dd(i.requestedAt, i.orderedAt)} gün</b></span>
                <span className="rounded bg-[var(--surface-2)] px-1.5 py-1"><span className="block text-[var(--faint)]">Teslim</span><b className="tnum">{dd(i.orderedAt, i.arrivedAt)} gün</b></span>
                <span className="rounded bg-[var(--surface-2)] px-1.5 py-1"><span className="block text-[var(--faint)]">Gereğe göre</span>
                  <b className="tnum" style={{ color: (dd(i.needBy, i.arrivedAt) ?? 0) > 0 ? 'var(--crit)' : 'var(--ok)' }}>
                    {(dd(i.needBy, i.arrivedAt) ?? 0) > 0 ? `${dd(i.needBy, i.arrivedAt)} gün geç` : 'zamanında'}</b></span>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {adding && <SasForm onClose={() => setAdding(false)} onAdd={(i) => { setItems((l) => [i, ...l]); setAdding(false) }} />}
    </>
  )
}

function SasForm({ onClose, onAdd }: { onClose: () => void; onAdd: (i: SasItem) => void }) {
  const [v, setV] = useState({ code: '', desc: '', qty: '', unit: 'ad', needBy: '2026-10-10', value: '' })
  const [urgency, setUrgency] = useState<SasItem['urgency']>('Normal')
  const [approvers, setApprovers] = useState<string[]>(['h.demir'])
  const set = (k: keyof typeof v) => (x: string) => setV((o) => ({ ...o, [k]: x }))
  const ready = v.code.trim() && v.desc.trim() && Number(v.qty) > 0 && approvers.length > 0
  return (
    <Modal title="Talep ekle" wide onClose={onClose} note="Talep kaydedilince seçilen onaycıların ana sayfasına bildirim düşer."
      footer={<><span className="text-[11.5px] text-[var(--faint)]">{approvers.length} onaycıya bildirim gidecek</span>
        <span className="ml-auto flex gap-2"><Btn onClick={onClose}>Vazgeç</Btn>
          <Btn primary disabled={!ready} onClick={() => onAdd({
            id: `SAS-${124 + Math.floor(Math.random() * 50)}`, code: v.code.trim(), desc: v.desc.trim(), qty: Number(v.qty), unit: v.unit,
            needBy: v.needBy, urgency, approvers, approved: [], stage: 'Onay bekliyor', value: Number(v.value) || 0, requestedBy: 'k.aslan', requestedAt: TODAY,
          })}>Talep oluştur</Btn></span></>}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Malzeme / hizmet kodu" value={v.code} onChange={set('code')} placeholder="MLZ-4410-07" />
        <div className="sm:col-span-2"><Field label="Açıklama" value={v.desc} onChange={set('desc')} /></div>
        <Field label="Miktar" value={v.qty} onChange={set('qty')} type="number" />
        <Field label="Birim" value={v.unit} onChange={set('unit')} />
        <Field label="Gerektiği tarih" value={v.needBy} onChange={set('needBy')} type="date" />
        <Field label={`Tahmini tutar (${C})`} value={v.value} onChange={set('value')} type="number" />
        <div className="sm:col-span-2">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Aciliyet</div>
          <div className="flex gap-1.5">
            {(['Acil', 'Normal', 'Düşük'] as const).map((u) => (
              <button key={u} onClick={() => setUrgency(u)} className="rounded-full border px-2.5 py-1 text-[12px]"
                style={urgency === u ? { background: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--accent)' } : { borderColor: 'var(--border)', color: 'var(--muted)' }}>{u}</button>
            ))}
          </div>
        </div>
        <div className="sm:col-span-3">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Onay ataması</div>
          <div className="flex flex-wrap gap-1.5">
            {PEOPLE.map((p) => {
              const on = approvers.includes(p)
              return (
                <button key={p} onClick={() => setApprovers((a) => (on ? a.filter((x) => x !== p) : [...a, p]))} className="mono rounded-full border px-2.5 py-1 text-[12px]"
                  style={on ? { background: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--accent)' } : { borderColor: 'var(--border)', color: 'var(--muted)' }}>{on ? '✓ ' : ''}{p}</button>
              )
            })}
          </div>
        </div>
      </div>
    </Modal>
  )
}

/* ---------------- Stock ---------------- */

const GROUP_COLORS: Record<string, string> = {
  'Çelik': 'var(--series-1)', 'Elektrik': 'var(--series-2)', 'Mekanik': 'var(--series-3)', 'İnşaat malzemesi': 'var(--series-4)', 'Sarf': 'var(--series-5)', 'Hizmet': 'var(--faint)',
}

export function Stock() {
  const [moves, setMoves] = useState(stockMoves)
  const [f, setF] = useState<Record<string, string>>({})
  const inStock = moves.filter((x) => !x.exitDate && x.location !== 'Yolda')
  const value = inStock.reduce((a, x) => a + x.amount, 0)
  const byGroup = Object.keys(GROUP_COLORS).map((g) => ({ label: g, value: moves.filter((x) => x.group === g).reduce((a, x) => a + x.amount, 0), color: GROUP_COLORS[g] })).filter((p) => p.value > 0)
  const getters: Record<string, (x: typeof moves[number]) => string> = {
    code: (x) => x.code, desc: (x) => x.desc, group: (x) => x.group, qty: (x) => num(x.qty), unit: (x) => x.unit, amount: (x) => m(x.amount),
    invoice: (x) => x.invoice, supplier: (x) => x.supplier, location: (x) => x.location,
    orderDate: (x) => date(x.orderDate), arrivalDate: (x) => date(x.arrivalDate), exitDate: (x) => (x.exitDate ? date(x.exitDate) : '—'),
  }
  const rows = moves.filter((x) => Object.entries(f).every(([k, v]) => !v || v === 'Tümü' || getters[k](x) === v))
  const head = (k: string, label: string) => (
    <span className="flex items-center gap-1.5">{label}
      <ColumnFilter value={f[k] ?? 'Tümü'} onChange={(v) => setF((o) => ({ ...o, [k]: v }))} values={[...new Set(moves.map(getters[k]))]} />
    </span>
  )

  return (
    <>
      <PageHead title="Procurement · Stock"
        note="Sahada, depoda ve yolda olan malzeme ile hizmet alımları: stok değeri, doluluk, giriş-çıkış hareketleri ve bütün işlemlerin kaydı."
        right={<ExportButtons />} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Stok değeri" value={m(value)} sub="Depoda ve sahada" tone="accent" />
        <Kpi label="Kalem çeşidi" value={new Set(inStock.map((x) => x.code)).size} sub={`${new Set(moves.map((x) => x.group)).size} grup`} />
        <Kpi label="Depo doluluğu" value="%68" sub="Ana depo 1.200 m²" />
        <Kpi label="Bu ay giriş" value={m(stockFlow[stockFlow.length - 1].in * 1000)} sub="Eylül 2026" tone="ok" />
        <Kpi label="Bu ay çıkış" value={m(stockFlow[stockFlow.length - 1].out * 1000)} sub="Eylül 2026" tone="warn" />
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <Card title={`Genel kayıt (${rows.length})`} help="Her malzeme ve hizmet alımının siparişten depodan çıkışa kadar kaydı. Sıra: kod, tarihler, açıklama." pad={false}>
            <Table dense head={<tr>
              <Th>{head('code', 'Kod')}</Th><Th>{head('orderDate', 'Sipariş')}</Th><Th>{head('arrivalDate', 'Geliş')}</Th><Th>{head('exitDate', 'Çıkış')}</Th>
              <Th w={180}>{head('desc', 'Açıklama')}</Th><Th>{head('group', 'Grup')}</Th>
              <Th right>{head('qty', 'Miktar')}</Th><Th>{head('unit', 'Birim')}</Th><Th right>{head('amount', 'Tutar')}</Th>
              <Th>{head('invoice', 'Fatura no')}</Th><Th>{head('supplier', 'Tedarikçi')}</Th><Th>{head('location', 'Yer')}</Th>
              <Th w={70} center>İşlem</Th>
            </tr>}>
              {rows.map((x) => (
                <tr key={x.code + x.orderDate} className="hover:bg-[var(--surface-2)]">
                  <Td mono nowrap>{x.code}</Td>
                  <Td nowrap>{date(x.orderDate)}</Td><Td nowrap>{date(x.arrivalDate)}</Td><Td nowrap>{x.exitDate ? date(x.exitDate) : '—'}</Td>
                  <Td>{x.desc}</Td>
                  <Td nowrap><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: GROUP_COLORS[x.group] }} />{x.group}</span></Td>
                  <Td right>{num(x.qty)}</Td><Td nowrap>{x.unit}</Td><Td right>{num(x.amount)}</Td>
                  <Td mono>{x.invoice}</Td><Td>{x.supplier}</Td>
                  <Td nowrap><Badge tone={x.location === 'Yolda' ? 'warn' : x.location === 'Saha' ? 'accent' : 'ok'}>{x.location}</Badge></Td>
                  <Td nowrap center><RowActions name={x.code} onDelete={() => setMoves((l) => l.filter((y) => y !== x))} /></Td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card title="Depo dağılımı" help="Malzeme gruplarına ve hizmet alımlarına göre tutar dağılımı.">
            <Donut size={150} parts={byGroup} center={<div><div className="text-[14px] font-bold text-[var(--ink)]">{m(byGroup.reduce((a, p) => a + p.value, 0))}</div><div className="text-[10.5px] text-[var(--muted)]">toplam</div></div>} />
          </Card>
          <Card title="Giriş · çıkış (bin EUR)" right={<Legend items={[{ label: 'Giriş', color: 'var(--series-1)' }, { label: 'Çıkış', color: 'var(--series-2)' }]} />}>
            <MonthColumns data={stockFlow.map((s) => ({ label: s.m, plan: s.out, actual: s.in }))} format={(v) => `${num(v)} bin EUR`} height={140} />
          </Card>
          <Card title="İşlem geçmişi" pad={false}>
            {stockHistory.map((h, i) => (
              <div key={i} className="border-b border-[var(--border)] px-3 py-2 text-[12px] last:border-0">
                <div className="mono text-[10.5px] text-[var(--faint)]">{h.at} · {h.by}</div>
                <div className="text-[var(--ink)]">{h.text}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </>
  )
}
