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
export const plannedCum = [1, 2, 4, 6, 9, 12, 16, 20, 25, 30, 35, 40, 45, 50, 55, 60, 64.5, 68.5, 72, 75, 78, 85, 93, 100]
export const actualCum = [0.5, 1.5, 3, 5, 7.5, 10.5, 14, 18, 22.5, 27, 31.5, 36, 40.5, 45, 49.5, 54, 58, 62, 65.5, 69, 72]

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
  { name: 'Alt yüklenici', budget: 10_600_000, committed: 11_150_000, actual: 7_900_000, forecast: 11_400_000 },
  { name: 'Malzeme', budget: 7_400_000, committed: 7_100_000, actual: 5_900_000, forecast: 7_800_000 },
  { name: 'Kendi işçiliğimiz', budget: 3_100_000, committed: 3_100_000, actual: 2_600_000, forecast: 3_500_000 },
  { name: 'Şantiye genel gideri', budget: 2_400_000, committed: 2_400_000, actual: 1_950_000, forecast: 2_600_000 },
  { name: 'Makine-ekipman', budget: 2_200_000, committed: 2_000_000, actual: 1_800_000, forecast: 2_500_000 },
  { name: 'Tasarım ve danışmanlık', budget: 700_000, committed: 700_000, actual: 650_000, forecast: 720_000 },
]

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

export interface ChangeOrder {
  no: string
  title: string
  amount: number
  days: number
  state: 'Onaylandı' | 'İmalatta' | 'Tamamlandı' | 'İşveren onayında' | 'Reddedildi'
  requestedBy: string
}

export const changeOrders: ChangeOrder[] = [
  { no: 'CO-01', title: 'Ofis bloğuna ek kat (idari ofisler)', amount: 520_000, days: 20, state: 'Tamamlandı', requestedBy: 'İşveren' },
  { no: 'CO-02', title: 'Rampa sayısının 12’den 16’ya çıkarılması', amount: 310_000, days: 8, state: 'İmalatta', requestedBy: 'İşveren' },
  { no: 'CO-03', title: 'Sprinkler sisteminde ESFR başlık değişimi', amount: 180_000, days: 0, state: 'Onaylandı', requestedBy: 'İşveren' },
  { no: 'CO-04', title: 'Saha aydınlatmasında LED armatür yükseltmesi', amount: 130_000, days: 0, state: 'Tamamlandı', requestedBy: 'İşveren' },
  { no: 'CO-05', title: 'Güvenlik kulübesi ve turnike sistemi', amount: 95_000, days: 5, state: 'İşveren onayında', requestedBy: 'İşveren' },
  { no: 'CO-06', title: 'Cephede ek güneş paneli taşıyıcıları', amount: 240_000, days: 12, state: 'İşveren onayında', requestedBy: 'Yüklenici önerisi' },
  { no: 'CO-07', title: 'Depo A zemin kotunun yükseltilmesi', amount: 70_000, days: 0, state: 'Reddedildi', requestedBy: 'Yüklenici önerisi' },
]

export interface Claim {
  no: string
  title: string
  basis: string
  amount: number
  days: number
  /** Olay tarihi ve bildirim son günü (time-bar) */
  eventDate: string
  noticeDue: string
  noticed: boolean
  state: 'Bildirim bekliyor' | 'Bildirildi' | 'Değerlendirmede' | 'Kısmen kabul'
}

export const claims: Claim[] = [
  { no: 'CL-01', title: 'Parsel B yer tesliminin 21 gün gecikmesi', basis: 'Sözleşme md. 2.1 — saha erişimi', amount: 310_000, days: 21, eventDate: '2026-03-02', noticeDue: '2026-03-30', noticed: true, state: 'Kısmen kabul' },
  { no: 'CL-02', title: 'Depo C çatı makası tasarım revizyonu', basis: 'Sözleşme md. 13.1 — değişiklik', amount: 240_000, days: 18, eventDate: '2026-06-15', noticeDue: '2026-07-13', noticed: true, state: 'Değerlendirmede' },
  { no: 'CL-03', title: 'Elektrik bağlantı izninin gecikmesi', basis: 'Sözleşme md. 8.5 — kamu kurumu gecikmesi', amount: 140_000, days: 12, eventDate: '2026-09-08', noticeDue: '2026-10-06', noticed: false, state: 'Bildirim bekliyor' },
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
