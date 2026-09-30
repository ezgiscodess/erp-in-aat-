/**
 * Planning alt modülünün örnek verisi: iş programları, micro programlar, lookahead pencereleri,
 * kritik yol analizi, recovery (mitigation) önerileri ve program sağlık kontrolleri.
 * Planlama ekranlarında fiyat gösterilmez.
 */

export interface Activity {
  code: string
  name: string
  start: string
  finish: string
  /** Gerçekleşen ilerleme (%) */
  progress: number
  critical?: boolean
  /** Öncül aktivite kodu */
  pred?: string
  /** Kaynak ataması (kişi / makine) — firmanın iç programında dolu */
  resource?: string
  /** Metraj ağırlığı (%) — verilmezse süre × ekip büyüklüğünden hesaplanır */
  weight?: number
}

export interface Program {
  id: string
  title: string
  kind: 'İşveren programı' | 'Firma programı' | 'Micro program'
  rev: number
  updatedAt: string
  updatedBy: string
  activities: Activity[]
  /** Micro programlar için: ana programda bağlı olduğu önceki ve sonraki aktivite */
  between?: { from: string; to: string }
  /** Micro program ana programa dahil edildi mi */
  integrated?: boolean
}

const main: Activity[] = [
  { code: 'A-1010', name: 'Mobilizasyon ve şantiye kurulumu', start: '2025-01-06', finish: '2025-02-15', progress: 100, weight: 3 },
  { code: 'A-1110', name: 'Kazı ve temel', start: '2025-02-01', finish: '2025-06-15', progress: 100, weight: 11, critical: true, pred: 'A-1010' },
  { code: 'A-1210', name: 'Betonarme kaba yapı', start: '2025-04-15', finish: '2025-12-20', progress: 100, weight: 29, critical: true, pred: 'A-1110' },
  { code: 'A-2110', name: 'Depo A-B çelik montajı', start: '2025-09-01', finish: '2026-04-30', progress: 100, weight: 22, critical: true, pred: 'A-1210' },
  { code: 'A-2120', name: 'Depo C çelik çatı makası montajı', start: '2026-03-01', finish: '2026-10-22', progress: 72, weight: 8, critical: true, pred: 'A-2110' },
  { code: 'A-2140', name: 'Sandviç panel cephe', start: '2026-02-15', finish: '2026-11-10', progress: 64, weight: 7, pred: 'A-2110' },
  { code: 'A-2150', name: 'Çatı paneli montajı', start: '2026-06-01', finish: '2026-11-18', progress: 40, weight: 4, critical: true, pred: 'A-2120' },
  { code: 'A-3120', name: 'Tuğla bölme duvar', start: '2026-05-01', finish: '2026-10-18', progress: 80, weight: 3, pred: 'A-1210' },
  { code: 'A-3310', name: 'Epoksi zemin', start: '2026-07-15', finish: '2026-11-28', progress: 38, weight: 3, pred: 'A-2140' },
  { code: 'A-4210', name: 'Sprinkler ve yangın tesisatı', start: '2026-04-01', finish: '2026-11-20', progress: 59, weight: 4, pred: 'A-2110' },
  { code: 'A-4410', name: 'Elektrik ve aydınlatma', start: '2026-04-15', finish: '2026-11-25', progress: 45, weight: 3, pred: 'A-2110' },
  { code: 'A-4290', name: 'Yangın sistemi testleri', start: '2026-11-20', finish: '2026-12-02', progress: 0, weight: 1, critical: true, pred: 'A-4210' },
  { code: 'A-5110', name: 'Saha asfaltı ve çizgi', start: '2026-09-15', finish: '2026-12-12', progress: 5, weight: 2 },
  { code: 'A-9010', name: 'Geçici kabul', start: '2026-12-12', finish: '2026-12-20', progress: 0, weight: 0, critical: true, pred: 'A-4290' },
]

export const programs: Program[] = [
  { id: 'WS-1', title: 'İşveren onaylı program', kind: 'İşveren programı', rev: 3, updatedAt: '2026-06-30', updatedBy: 'm.aydin', activities: main },
  {
    id: 'WS-2', title: 'Firma iç programı (kaynak yüklü)', kind: 'Firma programı', rev: 7, updatedAt: '2026-09-22', updatedBy: 'm.aydin',
    activities: main.map((a) => ({
      ...a,
      finish: a.code === 'A-2120' ? '2026-10-14' : a.code === 'A-2150' ? '2026-11-08' : a.code === 'A-9010' ? '2026-12-10' : a.finish,
      resource: a.code.startsWith('A-2') ? '28 kişi · 2 mobil vinç' : a.code.startsWith('A-4') ? '19 kişi · 2 platform' : a.code.startsWith('A-3') ? '18 kişi' : undefined,
    })),
  },
]

export const microPrograms: Program[] = [
  {
    id: 'MS-1', title: 'Depo C çatı çelik montajı — detay', kind: 'Micro program', rev: 2, updatedAt: '2026-09-20', updatedBy: 'b.yildiz',
    between: { from: 'A-2110', to: 'A-2150' }, integrated: false,
    activities: [
      { code: 'C-01', name: 'Revize makas imalatı (atölye)', start: '2026-06-20', finish: '2026-08-30', progress: 100 },
      { code: 'C-02', name: 'Makas sevkiyatı', start: '2026-08-15', finish: '2026-09-20', progress: 90 },
      { code: 'C-03', name: 'Aks 1–3 makas montajı', start: '2026-08-25', finish: '2026-09-15', progress: 100, critical: true },
      { code: 'C-04', name: 'Aks 4–7 makas montajı (gece vardiyası)', start: '2026-09-16', finish: '2026-10-08', progress: 45, critical: true },
      { code: 'C-05', name: 'Aks 8–12 makas montajı', start: '2026-10-01', finish: '2026-10-22', progress: 0, critical: true },
      { code: 'C-06', name: 'Aşık ve rüzgâr bağlantıları', start: '2026-09-20', finish: '2026-10-25', progress: 20 },
      { code: 'C-07', name: 'Çatı paneline teslim', start: '2026-10-22', finish: '2026-10-24', progress: 0, critical: true },
    ],
  },
  {
    id: 'MS-2', title: 'Yangın sistemi test ve devreye alma', kind: 'Micro program', rev: 1, updatedAt: '2026-09-18', updatedBy: 'o.kara',
    activities: [
      { code: 'T-01', name: 'Depo A hidrostatik test', start: '2026-10-20', finish: '2026-10-28', progress: 0 },
      { code: 'T-02', name: 'Depo B hidrostatik test', start: '2026-10-29', finish: '2026-11-06', progress: 0 },
      { code: 'T-03', name: 'Depo C hidrostatik test', start: '2026-11-07', finish: '2026-11-16', progress: 0, critical: true },
      { code: 'T-04', name: 'Pompa dairesi devreye alma', start: '2026-11-10', finish: '2026-11-22', progress: 0, critical: true },
      { code: 'T-05', name: 'İtfaiye onay testi', start: '2026-11-25', finish: '2026-12-02', progress: 0, critical: true },
    ],
  },
]

/* ---------------- Lookahead ---------------- */

export interface Lookahead {
  id: string
  title: string
  program: string
  from: string
  to: string
  createdAt: string
  /** Pencerenin alındığı andaki ilerleme (çakıştırma için) */
  snapshot: Record<string, number>
}

export const lookaheads: Lookahead[] = [
  {
    id: 'LA-39', title: '39. hafta — 2 haftalık', program: 'WS-1', from: '2026-09-21', to: '2026-10-04', createdAt: '2026-09-21',
    snapshot: Object.fromEntries(main.map((a) => [a.code, a.progress])),
  },
  {
    id: 'LA-38', title: '38. hafta — 2 haftalık', program: 'WS-1', from: '2026-09-14', to: '2026-09-27', createdAt: '2026-09-14',
    snapshot: { 'A-2120': 61, 'A-2140': 58, 'A-2150': 34, 'A-3120': 74, 'A-3310': 30, 'A-4210': 53, 'A-4410': 40, 'A-5110': 0 },
  },
]

/* ---------------- Kritik yol analizi ---------------- */

export const cpFindings = [
  { type: 'Risk', title: 'A-2120 çatı makası montajı 18 gün gecikmede', detail: 'Bolluk 0; gecikme doğrudan geçici kabulü öteler. Gece vardiyası ilerlemeyi %30 artırdı ama açığı kapatmıyor.', tone: 'crit' as const },
  { type: 'Engel', title: 'Elektrik bağlantı izni bekleniyor', detail: 'A-4290 yangın testleri kalıcı enerji ister; izin gelmezse testler jeneratörle sınırlı yapılır.', tone: 'crit' as const },
  { type: 'Kısıt', title: 'Kasım’da rüzgâr kaynaklı duruşlar', detail: 'Çatı paneli montajı 40 km/s üzeri rüzgârda durur; son 5 yılda Kasım’da ortalama 6 gün.', tone: 'warn' as const },
  { type: 'Kısıt', title: 'Tek kiralık mobil vinç', detail: 'A-2120 ve A-2150 Ekim’in son haftasında aynı vinci istiyor.', tone: 'warn' as const },
  { type: 'Risk', title: 'Test ekipmanı tedariki', detail: 'Hidrostatik test pompası 2 hafta önceden rezerve edilmeli (MS-2).', tone: 'warn' as const },
]

/* ---------------- Mitigation / recovery ---------------- */

export interface RecoveryAction {
  id: string
  title: string
  activity: string
  gain: number
  resource: string
  include: boolean
}

export const recoveryActions: RecoveryAction[] = [
  { id: 'R-1', title: 'Gece vardiyasına ikinci montaj ekibi', activity: 'A-2120', gain: 9, resource: '+14 kişi · +1 mobil vinç', include: true },
  { id: 'R-2', title: 'Çatı panelini aks bazında makas montajıyla örtüştür (FS → SS)', activity: 'A-2150', gain: 10, resource: '+8 kişi', include: true },
  { id: 'R-3', title: 'Yangın testlerini depo bazında paralel yap', activity: 'A-4290', gain: 6, resource: '+1 test ekibi', include: true },
  { id: 'R-4', title: 'Kritik aktivitelerde cumartesi çalışması', activity: 'A-2120 · A-2150', gain: 5, resource: 'Mevcut ekip', include: true },
  { id: 'R-5', title: 'Kuzey otopark asfaltını öne çek', activity: 'A-5110', gain: 4, resource: 'Mevcut ekip', include: false },
]

/* ---------------- Program sağlık kontrolleri ve riskler ---------------- */

export const scheduleChecks = [
  { check: 'Negatif bolluk', result: '1 zincir · −35 gün', tone: 'crit' as const, hint: 'A-2120 → A-2150 → A-9010' },
  { check: 'Personel aşırı yüklenmesi', result: 'Ekim: 312 kişi / kapasite 260', tone: 'crit' as const, hint: 'Recovery planı ile 340’a çıkıyor' },
  { check: 'Bağlantısız aktivite', result: '2 aktivite', tone: 'warn' as const, hint: 'A-5110 öncülsüz, A-3310 ardılsız' },
  { check: 'Kaynak atanmamış aktivite', result: '4 aktivite', tone: 'warn' as const, hint: 'İşveren programında kaynak yok' },
  { check: 'Makine çakışması', result: 'Mobil vinç 100 t · 3 aktivite', tone: 'warn' as const, hint: '26 Eki – 8 Kas haftaları' },
  { check: '60 günden uzun aktivite', result: '3 aktivite', tone: 'neutral' as const, hint: 'Bölünmesi önerilir' },
  { check: 'Kısıt tarihli aktivite', result: '2 aktivite', tone: 'neutral' as const, hint: 'Sabit tarih mantığı bozuyor olabilir' },
  { check: 'Saha verisiyle uyum', result: '%94', tone: 'ok' as const, hint: 'Onaylanmış kayıtlarla eşleşen aktiviteler' },
]

export const riskTypes = [
  { label: 'Tasarım', value: 30 },
  { label: 'Kaynak', value: 25 },
  { label: 'Tedarik', value: 20 },
  { label: 'İşveren', value: 15 },
  { label: 'Hava', value: 10 },
]

export const finishForecast = [
  { label: 'Sözleşme bitişi', date: '2026-12-20', delay: 0 },
  { label: 'P50 öngörü', date: '2027-01-17', delay: 28 },
  { label: 'Mevcut hız (SPI)', date: '2027-01-24', delay: 35 },
  { label: 'P80 öngörü', date: '2027-01-30', delay: 41 },
  { label: 'Recovery planıyla', date: '2026-12-25', delay: 5 },
]

/** Önümüzdeki 6 ay: gereken personel ve kapasite */
export const manpowerLoad = [
  { label: 'Eyl 26', need: 248, cap: 260 }, { label: 'Eki 26', need: 312, cap: 260 }, { label: 'Kas 26', need: 286, cap: 260 },
  { label: 'Ara 26', need: 170, cap: 260 }, { label: 'Oca 27', need: 60, cap: 260 }, { label: 'Şub 27', need: 20, cap: 260 },
]
