/**
 * Progress alt modülünün örnek verisi — sahadan girilen kayıtlar, onay akışı, aksaklıklar ve fotoğraflar.
 * Admin Konsolu'ndaki özet sayılar gerçek sistemde bu kayıtlardan hesaplanır.
 */

/** Proje ekibi — roller arka planda tanımlıdır; ekranda yalnızca kimin ne yaptığı görünür */
export const team = {
  engineers: ['k.aslan', 't.celik'],
  sectionChiefs: { 'Kaba ve çelik': 'b.yildiz', 'Mekanik-elektrik': 'o.kara', 'İnce işler ve saha': 'b.yildiz' } as Record<string, string>,
  siteChief: 'h.demir',
}

/** 3'lü onay: veri mühendisi girer → kısım şefi onaylar → şantiye şefi onaylar → işlenir */
export type Stage = 'Onaylandı' | 'Reddedildi' | 'Şantiye şefi onayında' | 'Kısım şefi onayında'

export interface Approval { by: string; at: string; note?: string }

export interface SiteEntry {
  id: string
  date: string
  /** İş programındaki aktivite kodu */
  code: string
  /** Lokasyon kırılımı: bina / bölge / aks-kat */
  loc1: string
  loc2: string
  loc3: string
  /** Sorumlu firma (taşeron veya kendi ekibimiz) */
  company: string
  shift: 'Gündüz' | 'Gece'
  activity: string
  section: string
  poz: string
  area: string
  level?: string
  qty: number
  unit: string
  crew: string
  people: number
  hours: number
  machine?: string
  machineHours?: number
  weather: string
  waste?: number
  note?: string
  photos: number
  entered: Approval
  sectionChief?: Approval
  siteChief?: Approval
  rejected?: Approval
}

export function stageOf(e: SiteEntry): Stage {
  if (e.rejected) return 'Reddedildi'
  if (e.siteChief) return 'Onaylandı'
  if (e.sectionChief) return 'Şantiye şefi onayında'
  return 'Kısım şefi onayında'
}

export const siteEntries: SiteEntry[] = [
  { id: 'SA-1042', date: '2026-09-25', code: 'A-2140', loc1: 'Depo B', loc2: 'Kuzey cephe', loc3: 'Aks 1–8', company: 'Panelsan', shift: 'Gündüz', activity: 'Sandviç panel montajı', section: 'Kaba ve çelik', poz: '1000612', area: 'Depo B · kuzey cephe', qty: 420, unit: 'm²', crew: 'Panelsan ekip 2', people: 12, hours: 10, machine: 'Mobil vinç 100 t', machineHours: 9, weather: 'Açık · 24 °C', photos: 4,
    entered: { by: 'k.aslan', at: '25.09 18:10' }, sectionChief: { by: 'b.yildiz', at: '25.09 19:02' }, siteChief: { by: 'h.demir', at: '26.09 07:40' } },
  { id: 'SA-1043', date: '2026-09-25', code: 'A-3310', loc1: 'Depo A', loc2: '1. bölge', loc3: 'Aks A–D', company: 'Zemin Pro', shift: 'Gündüz', activity: 'Epoksi zemin', section: 'İnce işler ve saha', poz: '1000655', area: 'Depo A · 1. bölge', qty: 650, unit: 'm²', crew: 'Zemin Pro', people: 8, hours: 10, weather: 'Açık · 24 °C', waste: 2.5, photos: 3,
    entered: { by: 't.celik', at: '25.09 18:25' }, sectionChief: { by: 'b.yildiz', at: '25.09 19:10' }, siteChief: { by: 'h.demir', at: '26.09 07:42' } },
  { id: 'SA-1044', date: '2026-09-25', code: 'A-3120', loc1: 'Ofis bloğu', loc2: '2. kat', loc3: 'Koridor aksı', company: 'Öz Duvar', shift: 'Gündüz', activity: 'Tuğla bölme duvar', section: 'İnce işler ve saha', poz: '1001110', area: 'Ofis bloğu · 2. kat', level: '+4,50', qty: 38, unit: 'm²', crew: 'Öz Duvar', people: 9, hours: 10, weather: 'Açık · 24 °C', waste: 3, note: 'Verim düşük: 90 saatte 38 m² (plan 2 inxsa/m²)', photos: 2,
    entered: { by: 't.celik', at: '25.09 18:40' }, sectionChief: { by: 'b.yildiz', at: '25.09 19:15' } },
  { id: 'SA-1045', date: '2026-09-25', code: 'A-4210', loc1: 'Depo B', loc2: 'Tavan', loc3: 'Aks 1–12', company: 'Tesisat Grup', shift: 'Gündüz', activity: 'Sprinkler boru montajı', section: 'Mekanik-elektrik', poz: '1000722', area: 'Depo B · tavan', qty: 310, unit: 'm', crew: 'Tesisat Grup', people: 10, hours: 10, machine: 'Makaslı platform', machineHours: 8, weather: 'Açık · 24 °C', photos: 2,
    entered: { by: 'k.aslan', at: '25.09 18:55' } },
  { id: 'SA-1046', date: '2026-09-25', code: 'A-2120', loc1: 'Depo C', loc2: 'Çatı', loc3: 'Aks 4–7', company: 'Kuzey Çelik Yapı', shift: 'Gece', activity: 'Çelik çatı makası montajı', section: 'Kaba ve çelik', poz: '1000487', area: 'Depo C · aks 4–7', qty: 18, unit: 'ton', crew: 'Kuzey Çelik ekip 1', people: 14, hours: 8, machine: 'Mobil vinç 100 t', machineHours: 7, weather: 'Açık · 17 °C', note: 'Revize makaslarla ilk gece montajı', photos: 5,
    entered: { by: 'k.aslan', at: '26.09 06:30' } },
  { id: 'SA-1041', date: '2026-09-25', code: 'A-5110', loc1: 'Saha', loc2: 'Kuzey otopark', loc3: 'P1–P3', company: 'ICCM Construction', shift: 'Gündüz', activity: 'Saha asfaltı alt temel', section: 'İnce işler ve saha', poz: '1000625', area: 'Kuzey otopark', qty: 1_200, unit: 'm²', crew: 'Kendi ekip', people: 6, hours: 10, machine: 'Greyder', machineHours: 8, weather: 'Açık · 24 °C', photos: 1,
    entered: { by: 't.celik', at: '25.09 17:50' }, rejected: { by: 'b.yildiz', at: '25.09 19:20', note: 'Miktar metraja göre fazla; aplikasyon ölçüsü eklensin' } },
  { id: 'SA-1038', date: '2026-09-24', code: 'A-2140', loc1: 'Depo B', loc2: 'Kuzey cephe', loc3: 'Aks 1–8', company: 'Panelsan', shift: 'Gündüz', activity: 'Sandviç panel montajı', section: 'Kaba ve çelik', poz: '1000612', area: 'Depo B · kuzey cephe', qty: 395, unit: 'm²', crew: 'Panelsan ekip 2', people: 12, hours: 10, machine: 'Mobil vinç 100 t', machineHours: 9, weather: 'Parçalı bulutlu · 22 °C', photos: 3,
    entered: { by: 'k.aslan', at: '24.09 18:05' }, sectionChief: { by: 'b.yildiz', at: '24.09 18:50' }, siteChief: { by: 'h.demir', at: '25.09 07:35' } },
  { id: 'SA-1039', date: '2026-09-24', code: 'A-3310', loc1: 'Depo A', loc2: '1. bölge', loc3: 'Aks A–D', company: 'Zemin Pro', shift: 'Gündüz', activity: 'Epoksi zemin', section: 'İnce işler ve saha', poz: '1000655', area: 'Depo A · 1. bölge', qty: 610, unit: 'm²', crew: 'Zemin Pro', people: 8, hours: 10, weather: 'Parçalı bulutlu · 22 °C', waste: 2, photos: 2,
    entered: { by: 't.celik', at: '24.09 18:20' }, sectionChief: { by: 'b.yildiz', at: '24.09 18:55' }, siteChief: { by: 'h.demir', at: '25.09 07:38' } },
  { id: 'SA-1040', date: '2026-09-24', code: 'A-4410', loc1: 'Depo A', loc2: 'Tavan', loc3: 'Aks 1–10', company: 'Volt Elektrik', shift: 'Gündüz', activity: 'Elektrik kablo tavası', section: 'Mekanik-elektrik', poz: '1000810', area: 'Depo A · tavan', qty: 240, unit: 'm', crew: 'Volt Elektrik', people: 7, hours: 10, weather: 'Parçalı bulutlu · 22 °C', photos: 2,
    entered: { by: 'k.aslan', at: '24.09 18:45' }, sectionChief: { by: 'o.kara', at: '24.09 19:30' }, siteChief: { by: 'h.demir', at: '25.09 07:45' } },
  { id: 'SA-1035', date: '2026-09-23', code: 'A-3120', loc1: 'Ofis bloğu', loc2: '2. kat', loc3: 'Koridor aksı', company: 'Öz Duvar', shift: 'Gündüz', activity: 'Tuğla bölme duvar', section: 'İnce işler ve saha', poz: '1001110', area: 'Ofis bloğu · 2. kat', level: '+4,50', qty: 41, unit: 'm²', crew: 'Öz Duvar', people: 9, hours: 10, weather: 'Açık · 25 °C', waste: 3, photos: 1,
    entered: { by: 't.celik', at: '23.09 18:30' }, sectionChief: { by: 'b.yildiz', at: '23.09 19:00' }, siteChief: { by: 'h.demir', at: '24.09 07:30' } },
  { id: 'SA-1036', date: '2026-09-23', code: 'A-4210', loc1: 'Depo B', loc2: 'Tavan', loc3: 'Aks 1–12', company: 'Tesisat Grup', shift: 'Gündüz', activity: 'Sprinkler boru montajı', section: 'Mekanik-elektrik', poz: '1000722', area: 'Depo B · tavan', qty: 285, unit: 'm', crew: 'Tesisat Grup', people: 10, hours: 10, weather: 'Açık · 25 °C', photos: 2,
    entered: { by: 'k.aslan', at: '23.09 18:40' }, sectionChief: { by: 'o.kara', at: '23.09 19:20' }, siteChief: { by: 'h.demir', at: '24.09 07:33' } },
]

/**
 * Bütün projelerde ortak veri formatının kolonları. Her proje kendi ihtiyacına göre kolonları
 * aktif/pasif yapar; pasif kolon formda görünmez ama format bozulmaz — know-how arka planda birikir.
 */
export interface EntryColumn { key: string; label: string; required?: boolean; active: boolean; hint?: string }

export const entryColumns: EntryColumn[] = [
  { key: 'date', label: 'Tarih', required: true, active: true },
  { key: 'shift', label: 'Vardiya', active: true },
  { key: 'activity', label: 'Aktivite (iş programı)', required: true, active: true, hint: 'İş programındaki aktiviteden seçilir' },
  { key: 'poz', label: 'Poz no', required: true, active: true, hint: 'Metraj kalemine bağlar' },
  { key: 'area', label: 'Bölge / aks', required: true, active: true },
  { key: 'level', label: 'Kat / kot', active: false },
  { key: 'qty', label: 'Miktar', required: true, active: true },
  { key: 'crew', label: 'Ekip / taşeron', required: true, active: true },
  { key: 'people', label: 'Kişi sayısı', required: true, active: true, hint: 'İnsan-saat için' },
  { key: 'hours', label: 'Çalışılan saat', required: true, active: true, hint: 'Kişi × saat = inxsa' },
  { key: 'machine', label: 'Makine', active: true },
  { key: 'machineHours', label: 'Makine saati', active: true },
  { key: 'weather', label: 'Hava durumu', active: true },
  { key: 'waste', label: 'Fire (%)', active: false },
  { key: 'material', label: 'Kullanılan malzeme', active: false },
  { key: 'note', label: 'Not', active: true },
  { key: 'photos', label: 'Saha fotoğrafı', active: true },
]

/** İş gruplarına göre fiziksel ilerleme (%) — planlanan ve onaylanmış kayıtlardan gerçekleşen */
export const groupProgress = [
  { group: 'Kaba inşaat', plan: 100, actual: 99 },
  { group: 'Çelik konstrüksiyon', plan: 90, actual: 82 },
  { group: 'Çatı ve cephe', plan: 75, actual: 64 },
  { group: 'İnce işler', plan: 58, actual: 55 },
  { group: 'Mekanik tesisat', plan: 60, actual: 49 },
  { group: 'Elektrik', plan: 55, actual: 45 },
  { group: 'Saha ve zemin', plan: 45, actual: 38 },
]

/** Son 8 haftanın ilerlemesi — onaylanmış kayıtlardan fiziksel ilerleme puanı (%), fiyat içermez */
export const weeklyOutput = [
  { w: '32. hf', plan: 1.25, actual: 1.15 }, { w: '33. hf', plan: 1.25, actual: 1.05 }, { w: '34. hf', plan: 1.2, actual: 1.15 },
  { w: '35. hf', plan: 1.2, actual: 1.0 }, { w: '36. hf', plan: 1.15, actual: 1.1 }, { w: '37. hf', plan: 1.15, actual: 0.95 },
  { w: '38. hf', plan: 1.1, actual: 1.05 }, { w: '39. hf', plan: 1.1, actual: 0.9 },
]

/** Projenin toplam insan-saati: işin tamamı için planlanan ve bugüne kadar gerçekleşen */
export const phrsTotals = { plan: 1_100_000, planToDate: 915_000, actual: 860_000 }

/* ---------------- Aksaklıklar (sebep – etki – çözüm) ---------------- */

export interface SiteDisruption {
  id: string
  date: string
  title: string
  activity: string
  category: 'İşveren' | 'Tasarım' | 'Tedarik' | 'Hava' | 'Ekip / verim' | 'Kamu kurumu'
  cause: string
  effectDays: number
  lostHours: number
  cost: number
  critical: boolean
  solution: string
  owner: string
  state: 'Açık' | 'Çözümde' | 'Kapandı' | 'Hak talebine dönüştü'
  photos: number
  claim?: string
}

export const siteDisruptions: SiteDisruption[] = [
  { id: 'DS-01', date: '2026-03-02', title: 'Parsel B kuzey yer tesliminin gecikmesi', activity: 'Depo B temel kazısı', category: 'İşveren', cause: 'Kamulaştırması bitmeyen 1.800 m²’lik alan teslim edilmedi', effectDays: 21, lostHours: 3_400, cost: 310_000, critical: true, solution: 'Ekip Depo A’ya kaydırıldı; yer teslim tutanağı ve günlük fotoğraflarla hak talebi açıldı', owner: 'h.demir', state: 'Hak talebine dönüştü', photos: 14, claim: 'CL-01' },
  { id: 'DS-02', date: '2026-06-15', title: 'Depo C çatı makası revizyonu', activity: 'Çelik çatı makası montajı', category: 'Tasarım', cause: 'İşveren raf sistemini değiştirdi; makas açıklığı ve yükleri revize edildi', effectDays: 18, lostHours: 2_100, cost: 240_000, critical: true, solution: 'Revize imalat resimleri 12 günde onaylatıldı; montaj gece vardiyasıyla hızlandırılıyor', owner: 'b.yildiz', state: 'Hak talebine dönüştü', photos: 9, claim: 'CL-02' },
  { id: 'DS-03', date: '2026-09-08', title: 'Elektrik bağlantı izninin gecikmesi', activity: 'Trafo ve OG bağlantı', category: 'Kamu kurumu', cause: 'Dağıtım şirketi proje onayını 12 gündür bekletiyor', effectDays: 12, lostHours: 600, cost: 140_000, critical: false, solution: 'Geçici jeneratörle devam; bildirim yazısı hazırlanıyor (son gün 06 Eki)', owner: 'o.kara', state: 'Çözümde', photos: 3 },
  { id: 'DS-04', date: '2026-08-19', title: 'Tuğla duvar ekibinde verim kaybı', activity: 'Tuğla bölme duvar', category: 'Ekip / verim', cause: 'Deneyimsiz ekip başı; malzeme kat içine geç taşınıyor', effectDays: 0, lostHours: 1_100, cost: 95_000, critical: false, solution: 'Ekip başı değişti, malzeme akşamdan kata çıkarılıyor; haftalık inxsa takibi', owner: 'b.yildiz', state: 'Çözümde', photos: 2 },
  { id: 'DS-05', date: '2026-05-06', title: 'Çelik profil tedarik gecikmesi', activity: 'Çelik konstrüksiyon imalatı', category: 'Tedarik', cause: 'Haddehane arızası nedeniyle HEA 400 profil 9 gün geç geldi', effectDays: 9, lostHours: 900, cost: 85_000, critical: true, solution: 'Gecikme cezası tedarikçiye kesildi; kritik profiller için ikinci tedarikçi', owner: 'h.demir', state: 'Kapandı', photos: 4 },
  { id: 'DS-06', date: '2026-03-18', title: 'Yoğun yağış', activity: 'Saha betonu', category: 'Hava', cause: '6 gün boyunca 40 mm üzeri yağış', effectDays: 6, lostHours: 700, cost: 60_000, critical: false, solution: 'Kapalı alan işlerine kaydırıldı; beton dökümleri ertelendi', owner: 'h.demir', state: 'Kapandı', photos: 6 },
]

/* ---------------- Saha fotoğrafları ---------------- */

export interface SitePhoto {
  id: string
  date: string
  activity: string
  area: string
  by: string
  caption: string
  entry?: string
  disruption?: string
  /** Prototipte gerçek fotoğraf yerine renk tonu */
  hue: number
}

export const sitePhotos: SitePhoto[] = [
  { id: 'P-311', date: '2026-09-26', activity: 'Çelik çatı makası montajı', area: 'Depo C · aks 4–7', by: 'k.aslan', caption: 'Revize makasın gece montajı', entry: 'SA-1046', hue: 215 },
  { id: 'P-310', date: '2026-09-25', activity: 'Sandviç panel montajı', area: 'Depo B · kuzey cephe', by: 'k.aslan', caption: 'Kuzey cephe panelleri, 3. sıra', entry: 'SA-1042', hue: 200 },
  { id: 'P-309', date: '2026-09-25', activity: 'Epoksi zemin', area: 'Depo A · 1. bölge', by: 't.celik', caption: 'Astar sonrası 1. kat epoksi', entry: 'SA-1043', hue: 35 },
  { id: 'P-308', date: '2026-09-25', activity: 'Tuğla bölme duvar', area: 'Ofis bloğu · 2. kat', by: 't.celik', caption: 'Bölme duvar, koridor aksı', entry: 'SA-1044', hue: 12 },
  { id: 'P-307', date: '2026-09-25', activity: 'Sprinkler boru montajı', area: 'Depo B · tavan', by: 'k.aslan', caption: 'Ana hat askı detayları', entry: 'SA-1045', hue: 0 },
  { id: 'P-306', date: '2026-09-24', activity: 'Elektrik kablo tavası', area: 'Depo A · tavan', by: 'k.aslan', caption: 'Kablo tavası güzergâhı', entry: 'SA-1040', hue: 48 },
  { id: 'P-305', date: '2026-09-24', activity: 'Sandviç panel montajı', area: 'Depo B · kuzey cephe', by: 'k.aslan', caption: 'Panel birleşim ve fitil', entry: 'SA-1038', hue: 205 },
  { id: 'P-304', date: '2026-09-15', activity: 'Trafo ve OG bağlantı', area: 'Trafo binası', by: 'o.kara', caption: 'Bağlantı bekleyen trafo hücresi', disruption: 'DS-03', hue: 280 },
  { id: 'P-303', date: '2026-08-21', activity: 'Tuğla bölme duvar', area: 'Ofis bloğu · 1. kat', by: 't.celik', caption: 'Kat içinde bekleyen malzeme', disruption: 'DS-04', hue: 18 },
  { id: 'P-302', date: '2026-06-16', activity: 'Çelik çatı makası montajı', area: 'Depo C', by: 'b.yildiz', caption: 'Durdurulan makas montajı', disruption: 'DS-02', hue: 225 },
  { id: 'P-301', date: '2026-03-04', activity: 'Depo B temel kazısı', area: 'Parsel B kuzey', by: 'h.demir', caption: 'Teslim edilmeyen alan, çit hattı', disruption: 'DS-01', hue: 95 },
  { id: 'P-300', date: '2026-03-19', activity: 'Saha betonu', area: 'Kuzey otopark', by: 't.celik', caption: 'Yağış sonrası su birikintisi', disruption: 'DS-06', hue: 190 },
]

/** İş programında tanımlı aktiviteler — veri girişinde açıklama yazılırken önerilir */
export const scheduleActivities = [
  { code: 'A-2120', name: 'Çelik çatı makası montajı', unit: 'ton', company: 'Kuzey Çelik Yapı' },
  { code: 'A-2140', name: 'Sandviç panel montajı', unit: 'm²', company: 'Panelsan' },
  { code: 'A-2150', name: 'Çatı paneli montajı', unit: 'm²', company: 'Panelsan' },
  { code: 'A-3120', name: 'Tuğla bölme duvar', unit: 'm²', company: 'Öz Duvar' },
  { code: 'A-3140', name: 'Sıva ve boya', unit: 'm²', company: 'Öz Duvar' },
  { code: 'A-3310', name: 'Epoksi zemin', unit: 'm²', company: 'Zemin Pro' },
  { code: 'A-4210', name: 'Sprinkler boru montajı', unit: 'm', company: 'Tesisat Grup' },
  { code: 'A-4230', name: 'Yangın dolabı montajı', unit: 'ad', company: 'Tesisat Grup' },
  { code: 'A-4410', name: 'Elektrik kablo tavası', unit: 'm', company: 'Volt Elektrik' },
  { code: 'A-4430', name: 'Aydınlatma armatürü montajı', unit: 'ad', company: 'Volt Elektrik' },
  { code: 'A-5110', name: 'Saha asfaltı alt temel', unit: 'm²', company: 'ICCM Construction' },
  { code: 'A-5120', name: 'Saha asfaltı binder', unit: 'm²', company: 'ICCM Construction' },
]

/* ---------------- Günlük personel ve makine-ekipman girişi ---------------- */

export interface ManpowerRow {
  id: string
  date: string
  company: string
  trade: string
  people: number
  hours: number
  loc1: string
  note?: string
  by: string
}

export const manpowerRows: ManpowerRow[] = [
  { id: 'MP-01', date: '2026-09-26', company: 'ICCM Construction', trade: 'Teknik ofis ve mühendis', people: 16, hours: 10, loc1: 'Şantiye ofisi', by: 'k.aslan' },
  { id: 'MP-02', date: '2026-09-26', company: 'ICCM Construction', trade: 'Düz işçi', people: 38, hours: 10, loc1: 'Genel saha', by: 'k.aslan' },
  { id: 'MP-03', date: '2026-09-26', company: 'Kuzey Çelik Yapı', trade: 'Çelik montajcı', people: 28, hours: 10, loc1: 'Depo C', by: 'k.aslan' },
  { id: 'MP-04', date: '2026-09-26', company: 'Panelsan', trade: 'Panel montajcı', people: 24, hours: 10, loc1: 'Depo B', by: 'k.aslan' },
  { id: 'MP-05', date: '2026-09-26', company: 'Öz Duvar', trade: 'Duvarcı', people: 18, hours: 10, loc1: 'Ofis bloğu', note: 'Ekip başı değişti', by: 't.celik' },
  { id: 'MP-06', date: '2026-09-26', company: 'Zemin Pro', trade: 'Zemin ustası', people: 12, hours: 10, loc1: 'Depo A', by: 't.celik' },
  { id: 'MP-07', date: '2026-09-26', company: 'Tesisat Grup', trade: 'Tesisatçı', people: 19, hours: 10, loc1: 'Depo B', by: 't.celik' },
  { id: 'MP-08', date: '2026-09-26', company: 'Volt Elektrik', trade: 'Elektrikçi', people: 17, hours: 10, loc1: 'Depo A', by: 't.celik' },
  { id: 'MP-09', date: '2026-09-25', company: 'ICCM Construction', trade: 'Düz işçi', people: 41, hours: 10, loc1: 'Genel saha', by: 'k.aslan' },
  { id: 'MP-10', date: '2026-09-25', company: 'Kuzey Çelik Yapı', trade: 'Çelik montajcı', people: 26, hours: 10, loc1: 'Depo C', by: 'k.aslan' },
]

export interface EquipmentRow {
  id: string
  date: string
  machine: string
  plate: string
  ownership: 'Kendi' | 'Kira'
  operator: string
  workHours: number
  idleHours: number
  fuel: number
  loc1: string
  state: 'Çalıştı' | 'Beklemede' | 'Arızalı'
  by: string
}

export const equipmentRows: EquipmentRow[] = [
  { id: 'EQ-01', date: '2026-09-26', machine: 'Mobil vinç 100 t', plate: '34 VNC 118', ownership: 'Kira', operator: 'M. Kaya', workHours: 9, idleHours: 1, fuel: 180, loc1: 'Depo B', state: 'Çalıştı', by: 'k.aslan' },
  { id: 'EQ-02', date: '2026-09-26', machine: 'Mobil vinç 100 t', plate: '34 VNC 241', ownership: 'Kira', operator: 'A. Şen', workHours: 7, idleHours: 3, fuel: 140, loc1: 'Depo C', state: 'Çalıştı', by: 'k.aslan' },
  { id: 'EQ-03', date: '2026-09-26', machine: 'Kule vinç', plate: 'KV-02', ownership: 'Kira', operator: 'H. Aydın', workHours: 10, idleHours: 0, fuel: 0, loc1: 'Ofis bloğu', state: 'Çalıştı', by: 'k.aslan' },
  { id: 'EQ-04', date: '2026-09-26', machine: 'Telehandler', plate: 'TH-04', ownership: 'Kira', operator: 'S. Er', workHours: 6, idleHours: 4, fuel: 55, loc1: 'Depo A', state: 'Çalıştı', by: 't.celik' },
  { id: 'EQ-05', date: '2026-09-26', machine: 'Ekskavatör (paletli)', plate: 'EX-03', ownership: 'Kendi', operator: 'R. Koç', workHours: 0, idleHours: 10, fuel: 0, loc1: 'Kuzey otopark', state: 'Arızalı', by: 't.celik' },
  { id: 'EQ-06', date: '2026-09-26', machine: 'Greyder', plate: 'GR-01', ownership: 'Kendi', operator: 'B. Tan', workHours: 8, idleHours: 2, fuel: 120, loc1: 'Kuzey otopark', state: 'Çalıştı', by: 't.celik' },
  { id: 'EQ-07', date: '2026-09-26', machine: 'Jeneratör 500 kVA', plate: 'JN-02', ownership: 'Kendi', operator: '—', workHours: 24, idleHours: 0, fuel: 410, loc1: 'Trafo binası', state: 'Çalıştı', by: 'k.aslan' },
  { id: 'EQ-08', date: '2026-09-26', machine: 'Forklift', plate: 'FL-01', ownership: 'Kendi', operator: 'C. Aksoy', workHours: 0, idleHours: 10, fuel: 0, loc1: 'Depo', state: 'Beklemede', by: 't.celik' },
]
