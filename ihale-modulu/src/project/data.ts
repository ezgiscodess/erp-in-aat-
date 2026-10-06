/**
 * Modül 2 (proje / yapım dönemi) örnek verisi.
 * Prototipte bütün projeler bu tek örnek projenin (Gebze Lojistik Merkezi) verisiyle açılır.
 * Para birimi EUR; program Ocak 2025'te başlar, 24 ay sürer. Bugün = 21. ay (Eylül 2026).
 */

export const prj = {
  code: 'PRJ-2024-008',
  name: 'Gebze Lojistik Merkezi Depo Yapıları',
  employer: 'Anadolu Lojistik A.Ş.',
  location: 'Kocaeli / Gebze',
  currency: 'EUR',
  contractValue: 29_200_000,
  /** Onaylanan değişiklik emirleriyle eklenen bedel */
  approvedChange: 1_140_000,
  contractDate: '2024-11-28',
  start: '2025-01-06',
  plannedFinish: '2026-12-20',
  /** Mevcut hızla (SPI) öngörülen bitiş */
  forecastFinish: '2027-01-24',
  months: 24,
  today: 21,
  advance: 2_920_000,
  retentionRate: 0.05,
}

/** Ay numarasından (1 = Oca 25) kısa etiket */
export function monthName(m: number): string {
  const d = new Date(2025, m - 1, 1)
  return new Intl.DateTimeFormat('tr-TR', { month: 'short', year: '2-digit' }).format(d)
}

/** Kümülatif fiziksel ilerleme (%) — işverenle mutabık program ve sahadan gelen gerçekleşen */
export const plannedCum = [0.6, 1.5, 2.6, 4.0, 5.7, 7.9, 10.7, 14.1, 18.2, 23.0, 28.6, 35.0, 41.9, 49.1, 56.6, 63.8, 70.7, 77.1, 82.7, 87.5, 91.6, 95.0, 97.8, 100.0]
export const actualCum = [0.3, 0.3, 1.0, 1.9, 3.1, 4.7, 6.6, 9.1, 12.1, 15.8, 20.3, 25.5, 31.4, 38.0, 45.1, 52.5, 59.9, 67.0, 73.7, 79.7, 85.0]

/* ---------------- Bütçe ---------------- */

export interface CostLine {
  name: string
  /** Bütçe (BAC) — birim fiyat × metraj */
  budget: number
  /** Sözleşmesi / siparişi verilmiş tutar */
  committed: number
  /** Bugüne kadar gerçekleşen maliyet (AC) */
  actual: number
  /** Tamamlanınca öngörülen maliyet (EAC) */
  forecast: number
}

export const costLines: CostLine[] = [
  { name: 'Alt yüklenici', budget: 10_600_000, committed: 11_150_000, actual: 9_100_000, forecast: 11_400_000 },
  { name: 'Malzeme', budget: 7_400_000, committed: 7_100_000, actual: 6_800_000, forecast: 7_800_000 },
  { name: 'Kendi işçiliğimiz', budget: 3_100_000, committed: 3_100_000, actual: 3_000_000, forecast: 3_500_000 },
  { name: 'Şantiye genel gideri', budget: 2_400_000, committed: 2_400_000, actual: 2_250_000, forecast: 2_600_000 },
  { name: 'Makine-ekipman', budget: 2_200_000, committed: 2_200_000, actual: 2_070_000, forecast: 2_500_000 },
  { name: 'Tasarım ve danışmanlık', budget: 700_000, committed: 720_000, actual: 720_000, forecast: 740_000 },
]

/**
 * Kazanılmış değer göstergeleri — hepsi veriden hesaplanır.
 * EV = gerçekleşen ilerleme × bütçe, PV = planlanan ilerleme × bütçe, AC = harcanan maliyet.
 */
export function evm() {
  const bac = costLines.reduce((a, c) => a + c.budget, 0)
  const ac = costLines.reduce((a, c) => a + c.actual, 0)
  const actual = actualCum[prj.today - 1]
  const planned = plannedCum[prj.today - 1]
  const ev = (actual / 100) * bac
  const pv = (planned / 100) * bac
  return { bac, ac, ev, pv, spi: ev / pv, cpi: ev / ac, actual, planned }
}

/* ---------------- Hakedişler (IPC) ---------------- */

export interface Ipc {
  no: number
  month: number
  gross: number
  advanceRecovery: number
  retention: number
  net: number
  state: 'Ödendi' | 'Onaylandı' | 'İşveren incelemesinde'
  /** Ödeme gecikmesi (gün) — sözleşmedeki 60 günü aşan kısım */
  lateDays?: number
}

export const ipcs: Ipc[] = (() => {
  const list: Ipc[] = []
  let recovered = 0
  for (let m = 1; m <= 20; m++) {
    const gross = Math.round(((actualCum[m - 1] - (actualCum[m - 2] ?? 0)) * prj.contractValue) / 100)
    const advanceRecovery = Math.min(Math.round(gross * 0.12), prj.advance - recovered)
    recovered += advanceRecovery
    const retention = Math.round(gross * prj.retentionRate)
    list.push({
      no: m, month: m, gross, advanceRecovery, retention, net: gross - advanceRecovery - retention,
      state: m <= 18 ? 'Ödendi' : m === 19 ? 'Onaylandı' : 'İşveren incelemesinde',
      lateDays: m === 16 ? 12 : m === 18 ? 21 : undefined,
    })
  }
  return list
})()

/* ---------------- Alt yükleniciler ve kontrat karşılaştırması ---------------- */

export interface Subcontract {
  name: string
  scope: string
  value: number
  done: number
  paid: number
}

export const subcontracts: Subcontract[] = [
  { name: 'Kuzey Çelik Yapı', scope: 'Çelik konstrüksiyon imalat + montaj', value: 4_140_000, done: 3_400_000, paid: 3_050_000 },
  { name: 'Marmara Yapı', scope: 'Betonarme kaba inşaat', value: 2_200_000, done: 1_980_000, paid: 1_820_000 },
  { name: 'Panelsan', scope: 'Çatı ve cephe sandviç panel', value: 1_600_000, done: 1_050_000, paid: 900_000 },
  { name: 'Tesisat Grup', scope: 'Mekanik ve yangın tesisatı', value: 1_130_000, done: 620_000, paid: 540_000 },
  { name: 'Volt Elektrik', scope: 'Elektrik ve aydınlatma', value: 900_000, done: 410_000, paid: 360_000 },
  { name: 'Zemin Pro', scope: 'Epoksi saha ve depo zemini', value: 760_000, done: 290_000, paid: 250_000 },
  { name: 'Öz Duvar', scope: 'Tuğla bölme duvar ve sıva', value: 420_000, done: 360_000, paid: 330_000 },
]

/** Aynı kalemin işverenle anlaşılan ve taşerona verilen hâli — fark varsa otomatik uyarı üretir */
export interface ContractMatch {
  item: string
  unit: string
  mainQty: number
  mainPrice: number
  subQty: number
  subPrice: number
  sub: string
}

export const contractMatches: ContractMatch[] = [
  { item: 'Tuğla bölme duvar', unit: 'm²', mainQty: 2_500, mainPrice: 16, subQty: 2_750, subPrice: 19, sub: 'Öz Duvar' },
  { item: 'Çelik konstrüksiyon', unit: 'ton', mainQty: 1_850, mainPrice: 2_150, subQty: 1_850, subPrice: 2_240, sub: 'Kuzey Çelik Yapı' },
  { item: 'Sandviç panel cephe', unit: 'm²', mainQty: 22_400, mainPrice: 38, subQty: 23_100, subPrice: 38, sub: 'Panelsan' },
  { item: 'Epoksi depo zemini', unit: 'm²', mainQty: 18_000, mainPrice: 14, subQty: 18_000, subPrice: 13.2, sub: 'Zemin Pro' },
  { item: 'Yangın sprinkler sistemi', unit: 'Götürü', mainQty: 1, mainPrice: 640_000, subQty: 1, subPrice: 610_000, sub: 'Tesisat Grup' },
]

/* ---------------- İnsan-saat (inxsa) ---------------- */

export interface Productivity {
  item: string
  unit: string
  /** Planlanan birim insan-saat (inxsa / birim) */
  planRate: number
  /** Gerçekleşen birim insan-saat */
  actualRate: number
  /** Bugüne kadar yapılan miktar */
  done: number
  total: number
}

export const productivity: Productivity[] = [
  { item: 'Tuğla bölme duvar', unit: 'm²', planRate: 2.0, actualRate: 2.5, done: 2_200, total: 2_750 },
  { item: 'Çelik montaj', unit: 'ton', planRate: 22, actualRate: 25.3, done: 1_520, total: 1_850 },
  { item: 'Sandviç panel montajı', unit: 'm²', planRate: 0.9, actualRate: 1.05, done: 14_800, total: 23_100 },
  { item: 'Betonarme (kalıp + donatı + beton)', unit: 'm³', planRate: 9.5, actualRate: 10.2, done: 8_900, total: 9_600 },
  { item: 'Sıva ve boya', unit: 'm²', planRate: 0.6, actualRate: 0.62, done: 5_400, total: 9_800 },
  { item: 'Epoksi zemin', unit: 'm²', planRate: 0.35, actualRate: 0.33, done: 6_900, total: 18_000 },
]

/** Son 12 ayın aylık insan-saati (bin saat): plan ve gerçekleşen */
export const monthlyPhrs = [
  { m: 10, plan: 38, actual: 39 }, { m: 11, plan: 42, actual: 44 }, { m: 12, plan: 45, actual: 47 },
  { m: 13, plan: 47, actual: 51 }, { m: 14, plan: 48, actual: 53 }, { m: 15, plan: 48, actual: 55 },
  { m: 16, plan: 46, actual: 54 }, { m: 17, plan: 44, actual: 52 }, { m: 18, plan: 42, actual: 50 },
  { m: 19, plan: 40, actual: 47 }, { m: 20, plan: 37, actual: 44 }, { m: 21, plan: 34, actual: 41 },
]

/* ---------------- Personel ---------------- */

export const trades = [
  { trade: 'Teknik ofis ve mühendis', plan: 18, actual: 16 },
  { trade: 'Kalıpçı', plan: 40, actual: 34 },
  { trade: 'Demirci', plan: 30, actual: 28 },
  { trade: 'Duvarcı', plan: 24, actual: 31 },
  { trade: 'Çelik montajcı', plan: 36, actual: 30 },
  { trade: 'Elektrikçi', plan: 20, actual: 18 },
  { trade: 'Tesisatçı', plan: 22, actual: 19 },
  { trade: 'Düz işçi', plan: 60, actual: 66 },
]

/* ---------------- Makine-ekipman ---------------- */

export interface Machine {
  name: string
  count: number
  ownership: 'Kendi' | 'Kira'
  planHours: number
  actualHours: number
  /** Çalışmadan beklenen saat (arıza, iş yok, hava) */
  idleHours: number
  fuel: number
  maintenance: number
}

export const machines: Machine[] = [
  { name: 'Mobil vinç 100 t', count: 2, ownership: 'Kira', planHours: 3_100, actualHours: 3_480, idleHours: 410, fuel: 96_000, maintenance: 0 },
  { name: 'Kule vinç', count: 2, ownership: 'Kira', planHours: 5_600, actualHours: 5_350, idleHours: 620, fuel: 0, maintenance: 22_000 },
  { name: 'Ekskavatör (paletli)', count: 4, ownership: 'Kendi', planHours: 7_200, actualHours: 7_900, idleHours: 540, fuel: 188_000, maintenance: 41_000 },
  { name: 'Telehandler', count: 5, ownership: 'Kira', planHours: 8_000, actualHours: 7_400, idleHours: 1_150, fuel: 74_000, maintenance: 0 },
  { name: 'Beton pompası', count: 2, ownership: 'Kendi', planHours: 1_900, actualHours: 2_050, idleHours: 180, fuel: 38_000, maintenance: 17_000 },
  { name: 'Forklift', count: 3, ownership: 'Kendi', planHours: 4_300, actualHours: 3_900, idleHours: 700, fuel: 29_000, maintenance: 12_000 },
  { name: 'Jeneratör', count: 4, ownership: 'Kendi', planHours: 9_600, actualHours: 10_700, idleHours: 0, fuel: 142_000, maintenance: 19_000 },
]

/* ---------------- Aksaklıklar (disruptions) ---------------- */

export interface Disruption {
  id: string
  title: string
  cause: 'İşveren' | 'Tedarikçi' | 'Hava' | 'Yüklenici' | 'Kurum'
  /** Programa etkisi (gün); kritik yoldaysa bitişi öteler */
  days: number
  critical: boolean
  cost: number
  state: 'Açık' | 'Çözüldü' | 'Talebe dönüştü'
  action: string
}

export const disruptions: Disruption[] = [
  { id: 'D1', title: 'Parsel B kuzey yer tesliminin gecikmesi', cause: 'İşveren', days: 21, critical: true, cost: 310_000, state: 'Talebe dönüştü', action: 'CL-01 hak talebi açıldı' },
  { id: 'D2', title: 'Depo C çatı makası tasarım revizyonu', cause: 'İşveren', days: 18, critical: true, cost: 240_000, state: 'Talebe dönüştü', action: 'CL-02 hak talebi açıldı' },
  { id: 'D3', title: 'Elektrik bağlantı izninin gecikmesi', cause: 'Kurum', days: 12, critical: false, cost: 140_000, state: 'Açık', action: 'Geçici jeneratörle çalışılıyor; CL-03 hazırlanıyor' },
  { id: 'D4', title: 'Çelik profil tedarik gecikmesi', cause: 'Tedarikçi', days: 9, critical: true, cost: 85_000, state: 'Çözüldü', action: 'Gecikme cezası tedarikçiye yansıtıldı' },
  { id: 'D5', title: 'Duvar ekibinde %20 verim kaybı', cause: 'Yüklenici', days: 0, critical: false, cost: 95_000, state: 'Açık', action: 'Ekip başı değişti; haftalık inxsa takibi' },
  { id: 'D6', title: 'Mart ayı yoğun yağış', cause: 'Hava', days: 6, critical: false, cost: 60_000, state: 'Çözüldü', action: 'Kapalı alan işlerine kaydırıldı' },
]

/* ---------------- Değişiklik emirleri ve hak talepleri ---------------- */

/** Değişikliğin ya da talebin etkisi — birden çok olabilir */
export type Impact = 'Süre' | 'Dizayn' | 'Maliyet' | 'Personel'

export interface ChangeOrder {
  no: string
  title: string
  amount: number
  days: number
  state: 'Onaylandı' | 'İmalatta' | 'Tamamlandı' | 'İşveren onayında' | 'Reddedildi'
  requestedBy: string
  impact: Impact[]
  /** İşveren talebi: yazı no, tarih ve talep metni */
  request: { ref: string; date: string; text: string }
}

export const changeOrders: ChangeOrder[] = [
  { no: 'CO-01', title: 'Ofis bloğuna ek kat (idari ofisler)', amount: 520_000, days: 20, state: 'Tamamlandı', requestedBy: 'İşveren', impact: ['Dizayn', 'Maliyet', 'Süre', 'Personel'],
    request: { ref: 'İY-2025-044', date: '2025-03-12', text: 'İdari personel artışı nedeniyle ofis bloğuna bir kat ilavesi; mimari ve statik projeler işverence revize edilecek.' } },
  { no: 'CO-02', title: 'Rampa sayısının 12’den 16’ya çıkarılması', amount: 310_000, days: 8, state: 'İmalatta', requestedBy: 'İşveren', impact: ['Dizayn', 'Maliyet', 'Süre'],
    request: { ref: 'İY-2026-011', date: '2026-02-04', text: 'Kiracı lojistik firmasının talebiyle Depo B yükleme rampalarının 16 adede çıkarılması.' } },
  { no: 'CO-03', title: 'Sprinkler sisteminde ESFR başlık değişimi', amount: 180_000, days: 0, state: 'Onaylandı', requestedBy: 'İşveren', impact: ['Dizayn', 'Maliyet'],
    request: { ref: 'İY-2026-019', date: '2026-04-22', text: 'Sigorta şirketinin şartı: yüksek raflı depolama için ESFR tip sprinkler başlıkları.' } },
  { no: 'CO-04', title: 'Saha aydınlatmasında LED armatür yükseltmesi', amount: 130_000, days: 0, state: 'Tamamlandı', requestedBy: 'İşveren', impact: ['Maliyet'],
    request: { ref: 'İY-2025-102', date: '2025-11-05', text: 'Enerji verimliliği hedefi kapsamında saha aydınlatmasının LED armatürlerle yapılması.' } },
  { no: 'CO-05', title: 'Güvenlik kulübesi ve turnike sistemi', amount: 95_000, days: 5, state: 'İşveren onayında', requestedBy: 'İşveren', impact: ['Maliyet', 'Süre'],
    request: { ref: 'İY-2026-037', date: '2026-08-18', text: 'Ana girişe güvenlik kulübesi, araç bariyeri ve personel turnikesi eklenmesi.' } },
  { no: 'CO-06', title: 'Cephede ek güneş paneli taşıyıcıları', amount: 240_000, days: 12, state: 'İşveren onayında', requestedBy: 'Yüklenici önerisi', impact: ['Dizayn', 'Maliyet', 'Süre'],
    request: { ref: 'YT-2026-008', date: '2026-08-02', text: 'Yüklenici önerisi: güney cephesine GES taşıyıcı konstrüksiyonu; işveren enerji danışmanı inceliyor.' } },
  { no: 'CO-07', title: 'Depo A zemin kotunun yükseltilmesi', amount: 70_000, days: 0, state: 'Reddedildi', requestedBy: 'Yüklenici önerisi', impact: ['Dizayn', 'Maliyet'],
    request: { ref: 'YT-2026-003', date: '2026-03-15', text: 'Yüklenici önerisi: taşkın riskine karşı zemin kotunun 15 cm yükseltilmesi. İşveren mevcut drenajı yeterli buldu.' } },
]

export interface Claim {
  no: string
  title: string
  basis: string
  /** Talep edilen bedel ve süre */
  amount: number
  days: number
  /** Onaylananda işverenin kabul ettiği bedel ve süre */
  approvedAmount?: number
  approvedDays?: number
  /** Olay tarihi ve bildirim son günü (time-bar) */
  eventDate: string
  noticeDue: string
  noticed: boolean
  state: 'Onaylandı' | 'Reddedildi' | 'Devam ediyor'
  impact: Impact[]
}

export const claims: Claim[] = [
  { no: 'CL-01', title: 'Parsel B yer tesliminin gecikmesi', basis: 'Sözleşme md. 2.1 — saha erişimi', amount: 110_000, days: 12, approvedAmount: 106_500, approvedDays: 12, eventDate: '2026-03-02', noticeDue: '2026-03-30', noticed: true, state: 'Onaylandı', impact: ['Süre', 'Maliyet'] },
  { no: 'CL-02', title: 'Depo C çatı makası tasarım revizyonu', basis: 'Sözleşme md. 13.1 — değişiklik', amount: 96_400, days: 10, approvedAmount: 93_600, approvedDays: 9, eventDate: '2026-06-15', noticeDue: '2026-07-13', noticed: true, state: 'Onaylandı', impact: ['Dizayn', 'Süre', 'Maliyet'] },
  { no: 'CL-03', title: 'Elektrik bağlantı izninin gecikmesi', basis: 'Sözleşme md. 8.5 — kamu kurumu gecikmesi', amount: 44_250, days: 28, eventDate: '2026-09-08', noticeDue: '2026-10-06', noticed: false, state: 'Devam ediyor', impact: ['Süre', 'Maliyet'] },
  { no: 'CL-04', title: 'Zemin etüdü farkı nedeniyle temel derinleşmesi', basis: 'Sözleşme md. 4.12 — öngörülemeyen zemin', amount: 68_250, days: 8, approvedAmount: 66_100, approvedDays: 8, eventDate: '2025-03-20', noticeDue: '2025-04-17', noticed: true, state: 'Onaylandı', impact: ['Dizayn', 'Maliyet'] },
  { no: 'CL-05', title: 'İşveren kaynaklı uygulama projesi onay gecikmesi', basis: 'Sözleşme md. 1.9 — gecikmiş çizimler', amount: 61_513, days: 6, approvedAmount: 59_400, approvedDays: 6, eventDate: '2025-06-10', noticeDue: '2025-07-08', noticed: true, state: 'Onaylandı', impact: ['Süre'] },
  { no: 'CL-06', title: 'Ek kat için uzayan şantiye genel gideri', basis: 'Sözleşme md. 13.3 — değişiklik usulü', amount: 54_000, days: 5, approvedAmount: 52_300, approvedDays: 5, eventDate: '2025-05-02', noticeDue: '2025-05-30', noticed: true, state: 'Onaylandı', impact: ['Maliyet', 'Personel'] },
  { no: 'CL-07', title: 'İtfaiye ek talebi: ilave hidrant hattı', basis: 'Sözleşme md. 13.7 — mevzuat değişikliği', amount: 42_000, days: 3, approvedAmount: 40_569, approvedDays: 2, eventDate: '2026-05-14', noticeDue: '2026-06-11', noticed: true, state: 'Onaylandı', impact: ['Dizayn', 'Maliyet'] },
  { no: 'CL-08', title: 'Rampa değişikliğinde ekip bekleme süresi', basis: 'Sözleşme md. 8.4 — işveren kaynaklı gecikme', amount: 35_000, days: 2, approvedAmount: 33_900, approvedDays: 2, eventDate: '2026-02-20', noticeDue: '2026-03-20', noticed: true, state: 'Onaylandı', impact: ['Personel', 'Süre'] },
  { no: 'CL-09', title: 'Mart ayı yoğun yağış için süre uzatımı', basis: 'Sözleşme md. 8.4 — olağanüstü iklim', amount: 98_500, days: 21, eventDate: '2026-03-28', noticeDue: '2026-04-25', noticed: true, state: 'Reddedildi', impact: ['Süre'] },
  { no: 'CL-10', title: 'Çelik fiyat artışı farkı', basis: 'Sözleşme md. 13.8 — fiyat ayarlaması', amount: 72_589, days: 17, eventDate: '2025-11-03', noticeDue: '2025-12-01', noticed: true, state: 'Reddedildi', impact: ['Maliyet'] },
  { no: 'CL-11', title: 'Kule vinç arızası kaynaklı bekleme', basis: 'Sözleşme md. 8.4 — gecikme', amount: 40_000, days: 12, eventDate: '2026-01-15', noticeDue: '2026-02-12', noticed: true, state: 'Reddedildi', impact: ['Personel', 'Süre'] },
]

/* ---------------- Puantaj ve kadro yapısı ---------------- */

/** Son 7 günün puantajı: meslek grubu başına günlük kişi; ana firma / taşeron ve direkt / endirekt ayrımı */
export const timesheet = [
  { group: 'Teknik ofis ve mühendis', employer: 'Ana firma', kind: 'Endirekt', days: [16, 16, 16, 15, 16, 8, 0] },
  { group: 'Kalıpçı', employer: 'Taşeron', kind: 'Direkt', days: [34, 34, 33, 34, 32, 30, 0] },
  { group: 'Demirci', employer: 'Taşeron', kind: 'Direkt', days: [28, 28, 27, 28, 28, 24, 0] },
  { group: 'Duvarcı', employer: 'Taşeron', kind: 'Direkt', days: [31, 31, 30, 31, 31, 28, 0] },
  { group: 'Çelik montajcı', employer: 'Taşeron', kind: 'Direkt', days: [30, 30, 30, 29, 30, 30, 18] },
  { group: 'Elektrikçi', employer: 'Taşeron', kind: 'Direkt', days: [18, 18, 17, 18, 18, 12, 0] },
  { group: 'Tesisatçı', employer: 'Taşeron', kind: 'Direkt', days: [19, 19, 19, 18, 19, 14, 0] },
  { group: 'Düz işçi', employer: 'Ana firma', kind: 'Direkt', days: [66, 64, 66, 65, 66, 50, 12] },
  { group: 'İSG ve güvenlik', employer: 'Ana firma', kind: 'Endirekt', days: [12, 12, 12, 12, 12, 12, 12] },
  { group: 'İdari işler ve depo', employer: 'Ana firma', kind: 'Endirekt', days: [9, 9, 9, 9, 9, 5, 0] },
]
export const timesheetDays = ['21 Eyl Pzt', '22 Eyl Sal', '23 Eyl Çar', '24 Eyl Per', '25 Eyl Cum', '26 Eyl Cmt', '27 Eyl Paz']

/** Makine-ekipman: ana firma / taşeron ve direkt (imalatta) / endirekt (genel hizmet) ayrımı ve son 7 gün çalışma saati */
export const machineLog = [
  { name: 'Mobil vinç 100 t', employer: 'Taşeron', kind: 'Direkt', days: [18, 20, 16, 20, 18, 10, 0] },
  { name: 'Kule vinç', employer: 'Ana firma', kind: 'Direkt', days: [20, 20, 20, 19, 20, 16, 8] },
  { name: 'Ekskavatör (paletli)', employer: 'Ana firma', kind: 'Direkt', days: [32, 30, 32, 31, 32, 20, 0] },
  { name: 'Telehandler', employer: 'Taşeron', kind: 'Direkt', days: [36, 38, 35, 38, 36, 24, 0] },
  { name: 'Beton pompası', employer: 'Taşeron', kind: 'Direkt', days: [8, 0, 10, 0, 9, 0, 0] },
  { name: 'Forklift', employer: 'Ana firma', kind: 'Endirekt', days: [24, 24, 22, 24, 24, 12, 0] },
  { name: 'Jeneratör', employer: 'Ana firma', kind: 'Endirekt', days: [96, 96, 96, 96, 96, 96, 96] },
]

/** inxsa harcama logu: hangi gün hangi kaleme kaç kişi, kaç saat harcandı ve ne kadar imalat çıktı */
export const phrsLog = [
  { date: '2026-09-26', item: 'Tuğla bölme duvar', zone: 'Ofis bloğu 2. kat', crew: 'Öz Duvar · 8 kişi', hours: 64, qty: 24, unit: 'm²', planRate: 2.0, by: 'b.yildiz' },
  { date: '2026-09-26', item: 'Sandviç panel montajı', zone: 'Depo B batı cephe', crew: 'Panelsan · 12 kişi', hours: 96, qty: 92, unit: 'm²', planRate: 0.9, by: 'm.aydin' },
  { date: '2026-09-26', item: 'Çelik montaj', zone: 'Depo C aks 4–7', crew: 'Kuzey Çelik · 14 kişi', hours: 140, qty: 5.4, unit: 'ton', planRate: 22, by: 'm.aydin' },
  { date: '2026-09-25', item: 'Epoksi zemin', zone: 'Depo A kuzey', crew: 'Zemin Pro · 10 kişi', hours: 220, qty: 650, unit: 'm²', planRate: 0.35, by: 'o.kara' },
  { date: '2026-09-25', item: 'Tuğla bölme duvar', zone: 'Ofis bloğu 2. kat', crew: 'Öz Duvar · 8 kişi', hours: 64, qty: 26, unit: 'm²', planRate: 2.0, by: 'b.yildiz' },
  { date: '2026-09-25', item: 'Sıva ve boya', zone: 'Ofis bloğu 1. kat', crew: 'Ana firma · 6 kişi', hours: 48, qty: 78, unit: 'm²', planRate: 0.6, by: 'b.yildiz' },
  { date: '2026-09-24', item: 'Betonarme (kalıp + donatı + beton)', zone: 'Pompa dairesi', crew: 'Marmara Yapı · 16 kişi', hours: 128, qty: 12, unit: 'm³', planRate: 9.5, by: 'o.kara' },
  { date: '2026-09-24', item: 'Sandviç panel montajı', zone: 'Depo B batı cephe', crew: 'Panelsan · 12 kişi', hours: 96, qty: 88, unit: 'm²', planRate: 0.9, by: 'm.aydin' },
]

/* ---------------- Verimsizlik takibi (imalat, malzeme, makine, personel) ---------------- */

export const materialWaste = [
  { item: 'Hazır beton C30/37', unit: 'm³', plan: 9_200, used: 9_610, normal: 2, cost: 88_000, reason: 'Kalıp sızıntısı ve fazla döküm' },
  { item: 'İnşaat demiri', unit: 'ton', plan: 1_140, used: 1_186, normal: 3, cost: 24_500, reason: 'Kesim firesi — kesim planı yok' },
  { item: 'Tuğla (19 luk)', unit: 'ad', plan: 66_000, used: 71_300, normal: 5, cost: 6_200, reason: 'Taşımada kırılma' },
  { item: 'Sandviç panel', unit: 'm²', plan: 23_100, used: 23_480, normal: 1, cost: 13_300, reason: 'Ölçü hatası — 18 panel yeniden sipariş' },
  { item: 'Epoksi kaplama', unit: 'kg', plan: 21_600, used: 22_150, normal: 2, cost: 7_900, reason: 'Nemli zeminde ikinci kat' },
]

export const machineWaste = [
  { cause: 'Arıza ve bakım', hours: 1_240 },
  { cause: 'Malzeme bekleme', hours: 980 },
  { cause: 'Hava koşulları', hours: 610 },
  { cause: 'Operatör yok / vardiya', hours: 470 },
  { cause: 'İş cephesi hazır değil', hours: 300 },
]

export const staffWaste = [
  { cause: 'Ekip verimi düşük', hours: 5_400 },
  { cause: 'Malzeme / ekipman bekleme', hours: 3_900 },
  { cause: 'Revizyon ve söküm', hours: 2_800 },
  { cause: 'Hava koşulları', hours: 1_500 },
  { cause: 'İş cephesi çakışması', hours: 936 },
]

/* ---------------- Günlük rapor ---------------- */

export const dailyReport = {
  date: '2026-09-25',
  weather: 'Açık · 24 °C · rüzgâr 12 km/s',
  manpower: 242,
  machines: 19,
  items: [
    { item: 'Sandviç panel montajı (Depo B)', unit: 'm²', today: 420, cum: 14_800, total: 23_100, finish: '2026-11-10' },
    { item: 'Epoksi zemin (Depo A)', unit: 'm²', today: 650, cum: 6_900, total: 18_000, finish: '2026-11-28' },
    { item: 'Tuğla bölme duvar (ofis bloğu)', unit: 'm²', today: 38, cum: 2_200, total: 2_750, finish: '2026-10-18' },
    { item: 'Sprinkler boru montajı', unit: 'm', today: 310, cum: 7_450, total: 12_600, finish: '2026-11-20' },
    { item: 'Saha asfaltı', unit: 'm²', today: 0, cum: 0, total: 21_000, finish: '2026-12-05' },
  ],
}

/* ---------------- Doküman setleri ---------------- */

export const docSets = [
  { set: 'Set 1', title: 'İhale dokümanları', note: 'İhale modülünden aktarıldı ve kilitlendi', docs: 31, locked: true, date: '2024-11-20' },
  { set: 'Set 2', title: 'Proje dönemi dokümanları', note: 'Set 1 ile karşılaştırılıyor · 4 fark bulundu', docs: 58, locked: false, date: '2026-09-22' },
  { set: 'Set 3', title: 'Yeni anlaşma (ek protokol)', note: 'Set 2 işverenle kabul edilince açılır', docs: 0, locked: false, date: '' },
]

/* ---------------- Planlama özeti ---------------- */

export const criticalPath = [
  { name: 'Depo C çatı çelik montajı', finish: '2026-10-22', float: 0, state: 'Gecikmede · 18 gün' },
  { name: 'Depo C çatı paneli', finish: '2026-11-18', float: 0, state: 'Başlamadı' },
  { name: 'Yangın sistemi testleri', finish: '2026-12-02', float: 0, state: 'Başlamadı' },
  { name: 'Saha asfaltı ve çizgi', finish: '2026-12-12', float: 4, state: 'Başlamadı' },
  { name: 'Geçici kabul', finish: '2026-12-20', float: 0, state: 'Hedef' },
]

/* ---------------- Home: kapsam, kilometre taşları, riskler, haftanın konuları ---------------- */

/** Kapsam durumu — sözleşme kalemleri (BoQ pozları) bazında */
export const scopeStatus = { inScope: 118, atRisk: 14, outOfScope: 6 }

export interface Milestone {
  name: string
  date: string
  state: 'Tamamlandı' | 'Geride' | 'İptal' | 'Planlandı'
  note: string
}

export const milestones: Milestone[] = [
  { name: 'Mobilizasyon tamamlandı', date: '2025-02-15', state: 'Tamamlandı', note: 'Zamanında' },
  { name: 'Kaba yapı tamamlandı', date: '2025-12-20', state: 'Tamamlandı', note: 'Zamanında' },
  { name: 'Depo A-B çelik montajı', date: '2026-04-30', state: 'Tamamlandı', note: '9 gün gecikmeyle' },
  { name: 'Depo A erken teslim (kısmi kabul)', date: '2026-08-31', state: 'İptal', note: 'İşveren kısmi kabulden vazgeçti' },
  { name: 'Kalıcı enerji bağlantısı', date: '2026-09-15', state: 'Geride', note: 'İzin bekleniyor · CL-03' },
  { name: 'Depo C çatı kapanışı', date: '2026-10-22', state: 'Geride', note: '18 gün geride' },
  { name: 'Yangın sistemi itfaiye onayı', date: '2026-12-02', state: 'Planlandı', note: 'Kritik yolda' },
  { name: 'Geçici kabul', date: '2026-12-20', state: 'Planlandı', note: 'Öngörü 24 Oca 2027' },
]

export interface TopRisk {
  id: string
  title: string
  /** Olasılık ve etki 1–5 */
  p: number
  i: number
  owner: string
  action: string
  trend: 'up' | 'down' | 'flat'
}

export const topRisks: TopRisk[] = [
  { id: 'R-03', title: 'Depo C çatı montajı gecikmesi geçici kabulü öteler', p: 5, i: 5, owner: 'b.yildiz', action: 'Gece vardiyası + ikinci montaj ekibi', trend: 'up' },
  { id: 'R-07', title: 'Elektrik bağlantı izni gelmezse yangın testleri yapılamaz', p: 4, i: 5, owner: 'o.kara', action: 'CL-03 bildirimi; jeneratörle kısmi test', trend: 'up' },
  { id: 'R-11', title: 'Kasım rüzgârında çatı paneli montajı durur', p: 4, i: 3, owner: 'm.aydin', action: 'Aks bazında öne çekme', trend: 'flat' },
  { id: 'R-02', title: 'Taşeron kontrat farkları (tuğla, çelik) maliyeti artırır', p: 3, i: 4, owner: 'h.demir', action: 'Taşeron metrajı ana kontrata eşitlenecek', trend: 'down' },
  { id: 'R-09', title: 'Tek mobil vinç iki kritik aktivitede çakışıyor', p: 3, i: 3, owner: 'm.aydin', action: 'Ekim sonu ikinci vinç kiralaması', trend: 'flat' },
]

export interface WeekTodo {
  day: string
  text: string
  owner: string
  tone: 'crit' | 'warn' | 'neutral'
  go?: string
  done?: boolean
}

/** İçinde bulunulan hafta: 28 Eyl – 4 Eki 2026 */
export const weekTodos: WeekTodo[] = [
  { day: '2026-09-28', text: 'Haftalık koordinasyon toplantısı · CO-02 rampa sayısı', owner: 'h.demir', tone: 'neutral', go: 'communication' },
  { day: '2026-09-29', text: 'SAS-121 enerji kablosu onayı (acil)', owner: 'h.demir', tone: 'warn', go: 'sas' },
  { day: '2026-09-30', text: 'HEA 200 aşık profili sahaya geliyor · teslim tutanağı', owner: 'depo.ali', tone: 'neutral', go: 'stock', done: true },
  { day: '2026-10-01', text: 'Aks 8–12 makas montajı başlıyor', owner: 'b.yildiz', tone: 'warn', go: 'micro' },
  { day: '2026-10-02', text: 'Eylül aylık raporu müdür onayına', owner: 'k.aslan', tone: 'neutral', go: 'r_monthly' },
  { day: '2026-10-03', text: 'CL-03 bildirim yazısı (son gün 06 Eki)', owner: 'h.demir', tone: 'crit', go: 'claim' },
  { day: '2026-10-04', text: 'LA-40 lookahead programı hazırlanacak', owner: 'm.aydin', tone: 'neutral', go: 'lookahead' },
]
