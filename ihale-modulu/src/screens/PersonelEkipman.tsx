import { useState } from 'react'
import { equipmentPlan, project, staffPlan } from '../data/mock'
import type { EquipmentItem, StaffItem } from '../data/types'
import {
  AddonBadge, Badge, Btn, Card, ExportButtons, Kpi, Modal, PageHead, ReadOnlyNote, Table, Td, Th,
} from '../components/ui'
import { money, moneyShort, num } from '../lib/format'

const MONTHS = 24

/**
 * Net maaştan işverene toplam aylık gidere geçiş katsayısı (vergi, SGK işveren payı, yan haklar).
 * Şimdilik yaklaşık sabit; ileride İK departmanının tanımladığı arka modül hesaplayacak.
 */
const GROSS_FACTOR = 1.65
const gross = (net: number) => Math.round(net * GROSS_FACTOR)

/** Program ayını takvim etiketine çevirir (işe başlama Kasım 2026 varsayımı). */
function monthLabel(m: number): string {
  const d = new Date(2026, 10 + m, 1)
  return new Intl.DateTimeFormat('tr-TR', { month: 'short', year: '2-digit' }).format(d)
}

/**
 * İş süresince ihtiyaç duyulacak kadro ve makine parkı.
 * Solda personel, sağda ekipman; her satıra tıklandığında hangi aylarda sahada olacağı işaretlenir.
 * Toplam tutarlar teklif fiyatındaki şantiye genel giderlerini besler.
 */
export function PersonelEkipman({ writable, role }: { writable: boolean; role: string }) {
  const [staff, setStaff] = useState<StaffItem[]>(staffPlan)
  const [equipment, setEquipment] = useState<EquipmentItem[]>(equipmentPlan)
  const [openStaff, setOpenStaff] = useState<StaffItem | null>(null)
  const [openEquip, setOpenEquip] = useState<EquipmentItem | null>(null)

  const staffCost = staff.reduce((a, s) => a + s.count * gross(s.monthlyCost) * s.months.length, 0)
  const equipCost = equipment.reduce((a, e) => a + e.count * e.monthlyCost * e.months.length, 0)
  const headcount = staff.reduce((a, s) => a + s.count, 0)
  const machines = equipment.reduce((a, e) => a + e.count, 0)

  return (
    <>
      <PageHead
        title="Personel & Ekipman"
        note="İş süresince sahada bulunacak kadro ve makine parkı. Her satır için hangi aylarda ihtiyaç olduğu işaretlenir; aylık maliyet × ay sayısı × adet, teklifteki şantiye genel giderini oluşturur."
        right={<>
          <AddonBadge />
          <ExportButtons />
          <Btn primary disabled={!writable}>+ Satır ekle</Btn>
        </>}
      />

      {!writable && <ReadOnlyNote role={role} />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Personel" value={headcount} sub={`${staff.length} görev tanımı`}
          help="İş süresince sahada bulunacak toplam kişi sayısı. Aynı görevde birden fazla kişi olabilir." />
        <Kpi label="Personel gideri" value={moneyShort(staffCost, project.currency)} sub="Süre boyunca toplam"
          help="Kişi sayısı × brüt aylık gider × sahada olduğu ay sayısı. Brüt gider, net maaşa vergi, SGK işveren payı ve yan hakların eklenmiş hâlidir." />
        <Kpi label="Makine / ekipman" value={machines} sub={`${equipment.length} kalem`}
          help="Şantiyede kullanılacak toplam makine adedi. Kendi filomuz ve kiralananlar ayrı işaretlenir." />
        <Kpi label="Ekipman gideri" value={moneyShort(equipCost, project.currency)} sub="Kira + amortisman"
          help="Adet × aylık maliyet × kullanım ayı. Kiralık ekipman fiyat dalgalanması Teklif Riskleri R12 ile bağlantılıdır." />
      </div>

      {/* Sol: personel · Sağ: makine-ekipman */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card
          title={`Personel (${staff.length})`}
          help="Satıra tıklayınca görevin ayrıntısı ve hangi aylarda sahada olacağı açılır. Aylar işaretlendikçe toplam gider güncellenir."
          right={<Btn small disabled={!writable}>+ Personel</Btn>}
          pad={false}
        >
          <Table head={
            <tr>
              <Th w={190}>Görev</Th>
              <Th w={40} right>Kişi</Th>
              <Th w={76} right>Net aylık<br />maaş</Th>
              <Th w={76} right>Brüt aylık<br />gider</Th>
              <Th w={44} right>Ay</Th>
              <Th w={96} right>Toplam</Th>
              <Th w={84} center>İşlem</Th>
            </tr>
          }>
            {staff.map((s) => (
              <tr key={s.id} onClick={() => setOpenStaff(s)} className="cursor-pointer hover:bg-[var(--surface-2)]">
                <Td>
                  <div className="text-[12.5px] font-medium text-[var(--ink)]">{s.title}</div>
                  <div className="mt-0.5 text-[11px] text-[var(--muted)]">{s.duty}</div>
                  {s.note && <div className="mt-0.5 text-[11px] text-[var(--warn)]">⚠ {s.note}</div>}
                </Td>
                <Td right>{s.count}</Td>
                <Td right>{num(s.monthlyCost)}</Td>
                <Td right><span title={`Net maaş × ${GROSS_FACTOR} — İK tanımlarına göre güncellenecek`}>{num(gross(s.monthlyCost))}</span></Td>
                <Td right>{s.months.length}</Td>
                <Td right><span className="font-semibold text-[var(--ink)]">{num(s.count * gross(s.monthlyCost) * s.months.length)}</span></Td>
                <Td nowrap center><Btn small minW={68} disabled={!writable} onClick={() => setOpenStaff(s)}>Düzenle</Btn></Td>
              </tr>
            ))}
            <tr>
              <Td className="bg-[var(--surface-2)]"><span className="text-[12px] font-bold text-[var(--ink)]">Toplam</span></Td>
              <Td className="bg-[var(--surface-2)]" right><span className="text-[12px] font-bold">{headcount}</span></Td>
              <Td className="bg-[var(--surface-2)]">{''}</Td>
              <Td className="bg-[var(--surface-2)]">{''}</Td>
              <Td className="bg-[var(--surface-2)]">{''}</Td>
              <Td className="bg-[var(--surface-2)]" right><span className="text-[12.5px] font-bold text-[var(--ink)]">{num(staffCost)}</span></Td>
              <Td className="bg-[var(--surface-2)]">{''}</Td>
            </tr>
          </Table>
        </Card>

        <Card
          title={`Makine ve ekipman (${equipment.length})`}
          help="Kendi filomuzdaki ekipman amortisman, kiralananlar kira bedeliyle hesaplanır. Satıra tıklayınca kullanım ayları işaretlenir."
          right={<Btn small disabled={!writable}>+ Ekipman</Btn>}
          pad={false}
        >
          <Table head={
            <tr>
              <Th w={190}>Ekipman</Th>
              <Th w={40} right>Ad.</Th>
              <Th w={76} right>Aylık<br />gider</Th>
              <Th w={44} right>Ay</Th>
              <Th w={96} right>Toplam</Th>
              <Th w={84} center>İşlem</Th>
            </tr>
          }>
            {equipment.map((e) => (
              <tr key={e.id} onClick={() => setOpenEquip(e)} className="cursor-pointer hover:bg-[var(--surface-2)]">
                <Td>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12.5px] font-medium text-[var(--ink)]">{e.name}</span>
                    <Badge tone={e.ownership === 'Kira' ? 'warn' : 'ok'}>{e.ownership}</Badge>
                  </div>
                  <div className="mt-0.5 text-[11px] text-[var(--muted)]">{e.group}</div>
                  {e.note && <div className="mt-0.5 text-[11px] text-[var(--warn)]">⚠ {e.note}</div>}
                </Td>
                <Td right>{e.count}</Td>
                <Td right>{num(e.monthlyCost)}</Td>
                <Td right>{e.months.length}</Td>
                <Td right><span className="font-semibold text-[var(--ink)]">{num(e.count * e.monthlyCost * e.months.length)}</span></Td>
                <Td nowrap center><Btn small minW={68} disabled={!writable} onClick={() => setOpenEquip(e)}>Düzenle</Btn></Td>
              </tr>
            ))}
            <tr>
              <Td className="bg-[var(--surface-2)]"><span className="text-[12px] font-bold text-[var(--ink)]">Toplam</span></Td>
              <Td className="bg-[var(--surface-2)]" right><span className="text-[12px] font-bold">{machines}</span></Td>
              <Td className="bg-[var(--surface-2)]">{''}</Td>
              <Td className="bg-[var(--surface-2)]">{''}</Td>
              <Td className="bg-[var(--surface-2)]" right><span className="text-[12.5px] font-bold text-[var(--ink)]">{num(equipCost)}</span></Td>
              <Td className="bg-[var(--surface-2)]">{''}</Td>
            </tr>
          </Table>
        </Card>
      </div>

      <Card title="Şantiye genel giderine yansıma" help="Personel ve ekipman toplamı, teklif fiyatındaki şantiye genel gideri kaleminin ana bileşenidir.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Total label="Personel" value={staffCost} tone="var(--ink)" />
          <Total label="Makine ve ekipman" value={equipCost} tone="var(--ink)" />
          <Total label="Toplam şantiye kadrosu gideri" value={staffCost + equipCost} tone="var(--ink)" />
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-[var(--muted)]">
          Aylık dağılım iş programındaki sürelere bağlıdır: bir aktivite uzarsa o aylardaki kadro ve ekipman
          gideri de doğrudan artar. Kiralık deniz ekipmanının fiyat dalgalanması Teklif Riskleri sekmesindeki
          R12 riskiyle eşleşir.
        </p>
      </Card>

      {openStaff && (
        <MonthModal
          title={openStaff.title}
          subtitle={`${openStaff.duty} · ${openStaff.count} kişi · net ${num(openStaff.monthlyCost)} · brüt ${num(gross(openStaff.monthlyCost))} ${project.currency}/ay`}
          months={openStaff.months}
          writable={writable}
          unit={openStaff.count * gross(openStaff.monthlyCost)}
          onClose={() => setOpenStaff(null)}
          onSave={(months) => {
            setStaff((list) => list.map((s) => (s.id === openStaff.id ? { ...s, months } : s)))
            setOpenStaff(null)
          }}
        />
      )}

      {openEquip && (
        <MonthModal
          title={openEquip.name}
          subtitle={`${openEquip.group} · ${openEquip.count} adet · ${openEquip.ownership} · ${num(openEquip.monthlyCost)} ${project.currency}/ay`}
          months={openEquip.months}
          writable={writable}
          unit={openEquip.count * openEquip.monthlyCost}
          onClose={() => setOpenEquip(null)}
          onSave={(months) => {
            setEquipment((list) => list.map((e) => (e.id === openEquip.id ? { ...e, months } : e)))
            setOpenEquip(null)
          }}
        />
      )}
    </>
  )
}

function Total({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">{label}</div>
      <div className="mt-0.5 text-[17px] font-bold tnum" style={{ color: tone }}>{money(value, project.currency)}</div>
    </div>
  )
}

/** Seçili satırın hangi aylarda sahada olacağını işaretleyen pencere. */
function MonthModal({ title, subtitle, months, unit, writable, onClose, onSave }: {
  title: string
  subtitle: string
  months: number[]
  /** Bir aylık maliyet (adet × birim) — toplam anında hesaplanır */
  unit: number
  writable: boolean
  onClose: () => void
  onSave: (months: number[]) => void
}) {
  const [sel, setSel] = useState<number[]>(months)

  function toggle(m: number) {
    if (!writable) return
    setSel((v) => (v.includes(m) ? v.filter((x) => x !== m) : [...v, m].sort((a, b) => a - b)))
  }

  return (
    <Modal
      title={title}
      note={subtitle}
      onClose={onClose}
      wide
      footer={<>
        <span className="text-[12px] text-[var(--muted)]">
          {sel.length} ay seçildi · toplam <b className="text-[var(--ink)]">{money(unit * sel.length, project.currency)}</b>
        </span>
        <span className="ml-auto flex gap-2">
          <Btn onClick={onClose}>Vazgeç</Btn>
          <Btn primary disabled={!writable} onClick={() => onSave(sel)}>Kaydet</Btn>
        </span>
      </>}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">İhtiyaç duyulan aylar</span>
          <span className="ml-auto flex gap-1.5">
            <Btn small disabled={!writable} onClick={() => setSel(Array.from({ length: MONTHS }, (_, i) => i))}>Tümünü seç</Btn>
            <Btn small disabled={!writable} onClick={() => setSel([])}>Temizle</Btn>
          </span>
        </div>

        <div className="grid grid-cols-6 gap-1.5">
          {Array.from({ length: MONTHS }, (_, m) => {
            const on = sel.includes(m)
            return (
              <button key={m} onClick={() => toggle(m)}
                className="flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-left text-[11.5px] transition-colors"
                style={on
                  ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)' }
                  : { borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--muted)' }}>
                <input type="checkbox" checked={on} readOnly className="pointer-events-none" />
                <span className="truncate">{m + 1}. {monthLabel(m)}</span>
              </button>
            )
          })}
        </div>

        <p className="text-[11.5px] leading-relaxed text-[var(--faint)]">
          Aylar iş programındaki aktivite sürelerine göre önerilir. Program değişirse bu işaretler
          güncellenmeli; aksi hâlde teklifteki genel gider gerçekleşmeden sapar.
        </p>
      </div>
    </Modal>
  )
}
