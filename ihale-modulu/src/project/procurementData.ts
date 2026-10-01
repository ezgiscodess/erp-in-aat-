/**
 * Procurement örnek verisi: satın alma talepleri (SAS), sipariş durumları, depo stoku ve hareket kayıtları.
 */

export type SasStage = 'Onay bekliyor' | 'Sipariş verildi' | 'Yolda' | 'Sahada' | 'Depoda'

export interface SasItem {
  id: string
  code: string
  desc: string
  qty: number
  unit: string
  needBy: string
  urgency: 'Acil' | 'Normal' | 'Düşük'
  approvers: string[]
  approved: string[]
  stage: SasStage
  value: number
  supplier?: string
  requestedBy: string
  requestedAt: string
  orderedAt?: string
  arrivedAt?: string
  /** Depoya teslim (stoka giriş) tarihi */
  depotAt?: string
  /** Kullanılacak yer */
  site: string
}

export const sasItems: SasItem[] = [
  { id: 'SAS-121', code: 'MLZ-4410-07', desc: 'NYY 4×16 enerji kablosu', qty: 1_200, unit: 'm', needBy: '2026-10-05', urgency: 'Acil', approvers: ['o.kara', 'h.demir'], approved: ['o.kara'], stage: 'Onay bekliyor', value: 14_200, requestedBy: 'k.aslan', requestedAt: '2026-09-25', site: 'Depo C · elektrik' },
  { id: 'SAS-122', code: 'MLZ-4230-02', desc: 'Yangın dolabı (hortumlu, tip C)', qty: 24, unit: 'ad', needBy: '2026-10-15', urgency: 'Normal', approvers: ['o.kara', 'h.demir'], approved: [], stage: 'Onay bekliyor', value: 9_600, requestedBy: 't.celik', requestedAt: '2026-09-26', site: 'Depo A-B · yangın' },
  { id: 'SAS-123', code: 'HZM-0310-01', desc: 'Hidrostatik test pompası kiralama (2 hafta)', qty: 1, unit: 'hizmet', needBy: '2026-10-18', urgency: 'Normal', approvers: ['o.kara'], approved: [], stage: 'Onay bekliyor', value: 3_800, requestedBy: 'k.aslan', requestedAt: '2026-09-27', site: 'Yangın testleri' },
  { id: 'SAS-115', code: 'MLZ-2150-11', desc: 'Çatı paneli vidası ve conta seti', qty: 180, unit: 'kutu', needBy: '2026-10-01', urgency: 'Acil', approvers: ['b.yildiz', 'h.demir'], approved: ['b.yildiz', 'h.demir'], stage: 'Sipariş verildi', value: 6_300, supplier: 'Bağlantı Market', requestedBy: 't.celik', requestedAt: '2026-09-19', orderedAt: '2026-09-22', site: 'Depo C · çatı' },
  { id: 'SAS-112', code: 'MLZ-3310-04', desc: 'Epoksi son kat boya (RAL 7035)', qty: 2_400, unit: 'kg', needBy: '2026-10-08', urgency: 'Normal', approvers: ['b.yildiz', 'h.demir'], approved: ['b.yildiz', 'h.demir'], stage: 'Yolda', value: 22_800, supplier: 'Kimya Boya', requestedBy: 't.celik', requestedAt: '2026-09-12', orderedAt: '2026-09-15', site: 'Depo A · zemin' },
  { id: 'SAS-110', code: 'MLZ-2120-09', desc: 'HEA 200 aşık profili', qty: 36, unit: 'ton', needBy: '2026-09-30', urgency: 'Acil', approvers: ['b.yildiz', 'h.demir'], approved: ['b.yildiz', 'h.demir'], stage: 'Yolda', value: 41_400, supplier: 'Marmara Çelik', requestedBy: 'k.aslan', requestedAt: '2026-09-08', orderedAt: '2026-09-10', site: 'Depo C · çatı' },
  { id: 'SAS-106', code: 'MLZ-4210-03', desc: 'Sprinkler başlığı ESFR K25', qty: 640, unit: 'ad', needBy: '2026-09-25', urgency: 'Normal', approvers: ['o.kara', 'h.demir'], approved: ['o.kara', 'h.demir'], stage: 'Sahada', value: 18_600, supplier: 'Yangın Sistem', requestedBy: 'k.aslan', requestedAt: '2026-09-01', orderedAt: '2026-09-04', arrivedAt: '2026-09-24', site: 'Depo B · sprinkler' },
  { id: 'SAS-104', code: 'MLZ-3120-01', desc: 'Yatay delikli tuğla 19 cm', qty: 18_000, unit: 'ad', needBy: '2026-09-22', urgency: 'Normal', approvers: ['b.yildiz'], approved: ['b.yildiz'], stage: 'Sahada', value: 7_900, supplier: 'Tuğla AŞ', requestedBy: 't.celik', requestedAt: '2026-09-03', orderedAt: '2026-09-05', arrivedAt: '2026-09-18', site: 'Ofis bloğu' },
  { id: 'SAS-099', code: 'MLZ-4410-02', desc: 'Kablo tavası 300 mm', qty: 850, unit: 'm', needBy: '2026-09-15', urgency: 'Normal', approvers: ['o.kara'], approved: ['o.kara'], stage: 'Depoda', value: 11_050, supplier: 'Elektro Tava', requestedBy: 'k.aslan', requestedAt: '2026-08-25', orderedAt: '2026-08-27', arrivedAt: '2026-09-11', site: 'Depo A · elektrik', depotAt: '2026-09-12' },
]

/**
 * Proje başından bugüne aylık satın alma (EUR): o ay sipariş verilen, ay sonunda yolda olan ve o ay depoya
 * aktarılan tutar. Mobilizasyon aylarında ilk siparişler yüksektir; çelik ve kaba yapı döneminde artar.
 * Kümülatif çizgiler seçilen tarih aralığında ekranda hesaplanır.
 */
export const procurementFlow = (() => {
  const shape = [520, 410, 300, 260, 190, 170, 180, 240, 320, 400, 470, 520, 560, 570, 540, 500, 460, 410, 350, 280, 230]
  const scale = 7_900_000 / shape.reduce((a, v) => a + v, 0)
  const ordered = shape.map((v) => Math.round(v * scale))
  return ordered.map((o, i) => {
    const month = new Date(2025, i, 1)
    return {
      iso: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-01`,
      ordered: o,
      transit: Math.round(o * 0.3),
      depot: Math.round(o * 0.35 + (ordered[i - 1] ?? 0) * 0.6),
    }
  })
})()

/** SAS adım kaydı — her işlem (talep, onay, sipariş, yola çıkış, sahaya ulaşma, depoya aktarma) kim ve ne zaman */
export interface SasEvent { at: string; by: string; id: string; step: string }

export const sasEvents: SasEvent[] = [
  { at: '2026-09-27 10:40', by: 'k.aslan', id: 'SAS-123', step: 'Talep oluşturuldu' },
  { at: '2026-09-26 16:05', by: 't.celik', id: 'SAS-122', step: 'Talep oluşturuldu' },
  { at: '2026-09-26 09:05', by: 'o.kara', id: 'SAS-121', step: 'o.kara onayladı' },
  { at: '2026-09-25 11:20', by: 'k.aslan', id: 'SAS-121', step: 'Talep oluşturuldu · acil' },
  { at: '2026-09-24 11:30', by: 'depo.ali', id: 'SAS-106', step: 'Sahaya ulaştı' },
  { at: '2026-09-22 08:50', by: 'k.aslan', id: 'SAS-115', step: 'Sipariş verildi · Bağlantı Market' },
  { at: '2026-09-18 15:10', by: 'depo.ali', id: 'SAS-104', step: 'Sahaya ulaştı' },
  { at: '2026-09-17 09:30', by: 'lojistik', id: 'SAS-112', step: 'Yola çıktı' },
  { at: '2026-09-15 10:00', by: 'k.aslan', id: 'SAS-112', step: 'Sipariş verildi · Kimya Boya' },
  { at: '2026-09-12 14:15', by: 'depo.ali', id: 'SAS-099', step: 'Depoya aktarıldı' },
  { at: '2026-09-11 13:40', by: 'depo.ali', id: 'SAS-099', step: 'Sahaya ulaştı' },
  { at: '2026-09-10 09:10', by: 'k.aslan', id: 'SAS-110', step: 'Sipariş verildi · Marmara Çelik' },
]

/* ---------------- Depo ---------------- */

export interface StockMove {
  code: string
  desc: string
  group: 'Çelik' | 'Elektrik' | 'Mekanik' | 'İnşaat malzemesi' | 'Sarf' | 'Hizmet'
  orderDate: string
  arrivalDate: string
  exitDate?: string
  qty: number
  unit: string
  amount: number
  invoice: string
  supplier: string
  location: 'Ana depo' | 'Saha' | 'Yolda'
}

export const stockMoves: StockMove[] = [
  { code: 'MLZ-4410-02', desc: 'Kablo tavası 300 mm', group: 'Elektrik', orderDate: '2026-08-27', arrivalDate: '2026-09-11', qty: 850, unit: 'm', amount: 11_050, invoice: 'ETV-2026-3318', supplier: 'Elektro Tava', location: 'Ana depo' },
  { code: 'MLZ-4210-03', desc: 'Sprinkler başlığı ESFR K25', group: 'Mekanik', orderDate: '2026-09-04', arrivalDate: '2026-09-24', qty: 640, unit: 'ad', amount: 18_600, invoice: 'YS-88412', supplier: 'Yangın Sistem', location: 'Saha' },
  { code: 'MLZ-3120-01', desc: 'Yatay delikli tuğla 19 cm', group: 'İnşaat malzemesi', orderDate: '2026-09-05', arrivalDate: '2026-09-18', exitDate: '2026-09-25', qty: 18_000, unit: 'ad', amount: 7_900, invoice: 'TGL-4471', supplier: 'Tuğla AŞ', location: 'Saha' },
  { code: 'MLZ-2120-07', desc: 'M20 bulon seti (8.8)', group: 'Çelik', orderDate: '2026-08-10', arrivalDate: '2026-08-20', exitDate: '2026-09-16', qty: 4_200, unit: 'ad', amount: 5_880, invoice: 'BLN-10233', supplier: 'Bağlantı Market', location: 'Saha' },
  { code: 'MLZ-3310-02', desc: 'Epoksi astar', group: 'İnşaat malzemesi', orderDate: '2026-08-14', arrivalDate: '2026-08-28', qty: 900, unit: 'kg', amount: 7_650, invoice: 'KB-5520', supplier: 'Kimya Boya', location: 'Ana depo' },
  { code: 'MLZ-4410-05', desc: 'LED yüksek tavan armatürü 200 W', group: 'Elektrik', orderDate: '2026-08-01', arrivalDate: '2026-08-29', qty: 320, unit: 'ad', amount: 38_400, invoice: 'LUX-7781', supplier: 'Lux Aydınlatma', location: 'Ana depo' },
  { code: 'SRF-0001-12', desc: 'Kaynak elektrodu ve taşlama diski', group: 'Sarf', orderDate: '2026-09-02', arrivalDate: '2026-09-04', exitDate: '2026-09-20', qty: 60, unit: 'kutu', amount: 2_100, invoice: 'SRF-9921', supplier: 'Hırdavat Merkezi', location: 'Saha' },
  { code: 'HZM-0205-03', desc: 'Mobil vinç kiralama (Eylül)', group: 'Hizmet', orderDate: '2026-08-28', arrivalDate: '2026-09-01', qty: 1, unit: 'ay', amount: 26_000, invoice: 'VNC-2026-09', supplier: 'Vinç Kiralama', location: 'Saha' },
  { code: 'MLZ-2120-09', desc: 'HEA 200 aşık profili', group: 'Çelik', orderDate: '2026-09-10', arrivalDate: '2026-09-30', qty: 36, unit: 'ton', amount: 41_400, invoice: '—', supplier: 'Marmara Çelik', location: 'Yolda' },
  { code: 'MLZ-4230-01', desc: 'Yangın söndürme tüpü 6 kg', group: 'Mekanik', orderDate: '2026-07-20', arrivalDate: '2026-08-02', qty: 120, unit: 'ad', amount: 3_600, invoice: 'YS-86210', supplier: 'Yangın Sistem', location: 'Ana depo' },
]

/** Son 6 ayın depo giriş ve çıkış tutarları (bin EUR) */
export const stockFlow = [
  { m: 'Nis 26', in: 118, out: 96 }, { m: 'May 26', in: 142, out: 128 }, { m: 'Haz 26', in: 131, out: 140 },
  { m: 'Tem 26', in: 156, out: 138 }, { m: 'Ağu 26', in: 174, out: 151 }, { m: 'Eyl 26', in: 162, out: 149 },
]

export const stockHistory = [
  { at: '27.09 10:12', by: 'depo.ali', text: 'SAS-106 · 640 ad sprinkler başlığı sahaya çıkış → Depo B' },
  { at: '26.09 16:40', by: 'depo.ali', text: 'SAS-104 · tuğla teslim tutanağı kapatıldı' },
  { at: '26.09 09:05', by: 'h.demir', text: 'SAS-121 onay beklemede — acil işaretlendi' },
  { at: '25.09 14:22', by: 'depo.ali', text: 'SRF-0001-12 · 20 kutu sarf malzeme çıkışı' },
  { at: '24.09 11:30', by: 'depo.ali', text: 'SAS-106 · sprinkler başlıkları teslim alındı (20 günde)' },
  { at: '22.09 08:50', by: 'k.aslan', text: 'SAS-115 sipariş verildi · Bağlantı Market' },
]
