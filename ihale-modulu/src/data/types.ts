/** İhale & Kontrat modülünün veri tipleri (görsel prototip — veriler data/mock.ts içinde). */

/* ---------------- Roller ve yetki ---------------- */

export type Period = 'ihale' | 'proje'

export type RoleKey =
  | 'c_suite' | 'pmo' | 'teklif'          // İhale dönemi
  | 'proje_muduru' | 'kisim_sefi' | 'teknik' // Proje dönemi

export interface Role {
  key: RoleKey
  label: string
  period: Period
  order: number
  note: string
}

/** R = görüntüleme, RW = görüntüleme + düzenleme */
export type Access = 'R' | 'RW'

export type TabKey =
  | 'dokuman_analiz'
  | 'bilgi_paneli'
  | 'go_nogo'
  | 'kritik_sartlar'
  | 'boq'
  | 'personel_ekipman'
  | 'birim_fiyat'
  | 'is_programi'
  | 'teklif_riskleri'
  | 'kontrat_analiz'
  | 'kontrat_hazirlama'
  | 'sertifikalar'
  | 'ozet'

export interface TabDef {
  key: TabKey
  label: string
  /** Ek pakette satılan sekmeler (gereksinim tablosunda sarı işaretli) */
  addon?: boolean
  note: string
}

/* ---------------- Yüklü işler (giriş sonrası ara sayfa) ---------------- */

/**
 * Ara sayfadaki kart: şirkete yüklenmiş bir ihale ya da yürüyen bir proje.
 * "Yükle" ile yeni bir ihale/proje dosyası eklenir; "Aç" ile modül o işin verisiyle açılır.
 */
export interface LibraryItem {
  id: string
  kind: Period
  code: string
  name: string
  employer: string
  location: string
  /** İhalede teklif tarihi, projede sözleşme bitiş tarihi */
  dueAt: string
  daysLeft: number
  value: number
  currency: string
  status: string
  /** Kusur sorumluluğu / garanti süresi (gün) */
  warrantyDays: number
  /** Yüklenen doküman sayısı ve analiz ilerlemesi */
  docCount: number
  progress: number
  updatedAt: string
  updatedBy: string
}

/* ---------------- Proje / ihale künyesi ---------------- */

export interface TenderProject {
  id: string
  company: string
  code: string
  name: string
  employer: string
  country: string
  location: string
  contractType: string
  deliveryModel: string
  currency: string
  estimatedValue: number
  durationDays: number
  bidDueAt: string
  siteVisitAt: string
  questionsDueAt: string
  status: 'Hazırlanıyor' | 'Teklif Verildi' | 'Kazanıldı' | 'Kaybedildi' | 'İptal'
  daysLeft: number
  progress: number
}

/* ---------------- 1. İhale dokümanı analizi ---------------- */

export type DocState = 'Analiz edildi' | 'Analiz edilmedi' | 'Sırada' | 'Analiz ediliyor' | 'Hata'

export interface TenderDoc {
  id: string
  name: string
  kind: string
  pages: number
  uploadedBy: string
  uploadedAt: string
  state: DocState
  findings: number
  /** OCR gerekti mi (taranmış belge) */
  ocr?: boolean
}

export type FindingKind = 'Risk' | 'Çelişki' | 'Yükümlülük' | 'Eksik bilgi' | 'Fırsat'
export type Severity = 'Kritik' | 'Yüksek' | 'Orta' | 'Düşük'

export interface Finding {
  id: string
  kind: FindingKind
  severity: Severity
  title: string
  explanation: string
  confidence: number
  docId: string
  docName: string
  page: number
  clause: string
  quote: string
  /** Alıntının kaynak metinde birebir doğrulanıp doğrulanmadığı */
  verification: 'exact' | 'fuzzy' | 'unverified'
  status: 'Yeni' | 'İncelemede' | 'Kabul' | 'Ret'
}

/* ---------------- 3. Go / No-Go ---------------- */

export interface GoNoGoCriterion {
  id: string
  group: string
  label: string
  weight: number
  /** 0–100 */
  score: number
  note: string
  source: string
}

/* ---------------- 4. Kritik ihale şartları ---------------- */

export type TermState = 'Kontrol Edildi' | 'Kontrol Ediliyor' | 'Devam Ediyor' | 'Etkisi Sıfırlandı'

export interface CriticalTerm {
  id: string
  topic: string
  requirement: string
  clause: string
  page: number
  severity: Severity
  impact: string
  action: string
  owner: string
  /**
   * Kontrol Edildi: şart karşılanıyor, dosyada kapandı.
   * Kontrol Ediliyor: sorumlusu inceliyor.
   * Devam Ediyor: aksiyon alındı, sonucu bekleniyor (banka, zeyilname talebi…).
   * Etkisi Sıfırlandı: şart değişmedi ama etkisi fiyata ya da kurguya yansıtılarak nötrlendi.
   */
  state: TermState
  /** Şartın çıkarıldığı doküman (docs listesindeki id) */
  docId: string
  /** Doküman sayfasındaki asıl paragraf — sağdaki önizlemede gösterilir */
  context: string
  /** Paragraf içinde boyanacak cümle — şartın bahsi geçen kısmı */
  quote: string
}

/* ---------------- 5. BoQ / Take-off ---------------- */

/**
 * Metraj kalemlerinin iş grupları — imalat sırasına göre, her projede aynı.
 * Liste sabittir; kalemi olmayan grup da çipte görünür ve boş olduğu anlaşılır.
 */
export type WorkGroup =
  | 'Mobilizasyon'
  | 'Kazı İşleri'
  | 'Zemin İşleri'
  | 'Betonarme İşleri'
  | 'İnce İşler'
  | 'Mekanik İşleri'
  | 'Elektrik İşleri'
  | 'IT'
  | 'Cephe & Çatı İşleri'
  | 'Peyzaj'
  | 'Test ve Devreye Alma'

export interface BoqItem {
  id: string
  no: string
  group: WorkGroup
  description: string
  unit: string
  qty: number
  /**
   * İhale dokümanında birim fiyat bulunmaz; bu alan Birim Fiyat Havuzu'ndan eşleşirse dolar.
   * Eşleşme yoksa teklif ekibi fiyatı havuza girene kadar boş kalır.
   */
  unitPrice?: number
  poolMatch: 'Eşleşti' | 'Benzer poz' | 'Eşleşmedi'
  /** Metrajın kaynağı: çizim veya idare cetveli */
  source: string
  /** AI metraj güveni (%) — düşükse elle kontrol gerekir */
  confidence: number
  note?: string
}

/** Firmanın kendi birim fiyat havuzu — projeye değil firmaya ait, arka planda çalışır. */
export interface UnitPrice {
  id: string
  no: string
  description: string
  unit: string
  price: number
  currency: string
  source: 'Kendi analizimiz' | 'BCBS' | 'Piyasa teklifi' | 'Geçmiş proje'
  updatedAt: string
  updatedBy: string
  /** Kaç projede kullanıldı */
  usedIn: number
}

/** İhale Bilgi Paneli altındaki kapsam bilgisi bölümleri */
export interface ScopeSection {
  id: string
  title: string
  body: string
  source: string
}

/* ---------------- 6. Teklif riskleri ---------------- */

export interface BidRisk {
  id: string
  category: string
  title: string
  description: string
  probability: 1 | 2 | 3 | 4 | 5
  impact: 1 | 2 | 3 | 4 | 5
  costImpact: number
  timeImpact: number
  mitigation: string
  owner: string
  state: 'Açık' | 'İzleniyor' | 'Kapandı'
  /**
   * Bedel etkisinin nereden çıktığı — metraj × birim fiyat × oran biçiminde açık hesap.
   * Fiyatlandırmanın en zor kısmı bu sayının savunulabilir olmasıdır; kaynağı görünür tutulur.
   */
  basis: string
  /** Hesabın dayandığı poz veya kalem (Metraj / Birim Fiyat Havuzu bağlantısı) */
  basisRef?: string
  /**
   * Teklife eklenecek karşılık. Beklenen değerden farklı olabilir:
   * bazı riskler için sözleşmeye şerh düşülür, bazıları için tam karşılık ayrılır.
   */
  provision: number
  /** Karşılık teklif fiyatına dâhil edilsin mi */
  inBid: boolean
  /** Kontrat riskleri: dayandığı sözleşme maddesi (clauses listesindeki id) */
  clauseId?: string
  /** Kontrat riskleri: kaçırılırsa hakkın düştüğü bildirim süresi */
  timeBar?: string
}

/* ---------------- 7. Kontrat analizi ---------------- */

export interface ClauseAnalysis {
  id: string
  clause: string
  title: string
  page: number
  category: 'Ödeme' | 'Süre' | 'Risk paylaşımı' | 'Bildirim' | 'Teminat' | 'Fesih' | 'Uyuşmazlık'
  position: 'Yüklenici aleyhine' | 'Dengeli' | 'Yüklenici lehine'
  severity: Severity
  summary: string
  quote: string
  /** Bildirim süresi olan maddeler için gün cinsinden süre sınırı */
  timeBarDays?: number
  conflictWith?: string
}

/* ---------------- 8. Kontrat hazırlama ---------------- */

export interface ContractSection {
  id: string
  no: string
  title: string
  state: 'Taslak hazır' | 'Düzenleniyor' | 'Boş' | 'Onaylandı'
  source: 'Şablon' | 'İhale dokümanı' | 'Elle yazıldı'
  filledBy?: string
  note: string
}

export interface ContractVariable {
  key: string
  label: string
  value: string
  source: string
  filled: boolean
}

/* ---------------- 9. Sertifikalar ---------------- */

export interface Certificate {
  id: string
  name: string
  authority: string
  required: boolean
  owned: boolean
  number?: string
  validUntil?: string
  /** Kalan gün; negatifse süresi dolmuş */
  daysLeft?: number
  note: string
}

/* ---------------- İş programı ---------------- */

/**
 * Teklifle birlikte verilen iş programının satırı.
 * Süreler metrajdan (miktar ÷ günlük kapasite) türetilir; başlangıç işe başlama gününe göre ay cinsindendir.
 */
export interface ScheduleTask {
  id: string
  wbs: string
  name: string
  group: WorkGroup | 'Genel'
  /** İşe başlamadan itibaren kaçıncı ayda başlıyor (0 = ilk ay) */
  startMonth: number
  /** Kaç ay sürüyor */
  months: number
  /** Kritik yolda mı — gecikmesi bitiş tarihini doğrudan öteler */
  critical: boolean
  /** Bağlı olduğu iş (WBS no) */
  dependsOn?: string
  /**
   * Aktiviteler arası ilişki tipi:
   * FS (bitince başlar), SS (birlikte başlar), FF (birlikte biter), SF (başlayınca biter).
   * Planlamada en yaygını FS'tir; SS ve FF örtüşen işlerde kullanılır.
   */
  relation?: 'FS' | 'SS' | 'FF' | 'SF'
  /** Süreyi belirleyen kaynak veya kapasite varsayımı */
  assumption: string
  /** Programı besleyen metraj kalemi */
  boqRef?: string
  progress: number
}

/**
 * Sözleşmeden gelen sabit tarihler (key stage).
 * Sözleşmelerde genelde "işe başlama (CD) + X gün" biçiminde verilir ve
 * çoğunun kendine ait bir gecikme cezası vardır.
 */
export interface ScheduleMilestone {
  id: string
  no: string
  label: string
  /** İşe başlama (commencement date) + kaç gün */
  dueDays: number
  /** Takvim karşılığı */
  dueDate: string
  /** Programdaki ay karşılığı — şeritte konumlandırmak için */
  month: number
  /** Kendine ait gecikme cezası varsa tutarı */
  penalty?: number
  penaltyNote?: string
  source: string
  kind: 'Sözleşme' | 'İdare' | 'İç hedef'
}

/* ---------------- Personel ve ekipman ---------------- */

/** Teklif aşamasında planlanan kadro. Aylar, kişinin işte olduğu program aylarıdır. */
export interface StaffItem {
  id: string
  title: string
  duty: string
  count: number
  /** Kişi başı aylık maliyet (maaş + yan gider) */
  monthlyCost: number
  /** İhtiyaç duyulan program ayları (0 tabanlı) */
  months: number[]
  note?: string
}

/** Şantiyede kullanılacak makine ve ekipman. */
export interface EquipmentItem {
  id: string
  name: string
  group: string
  count: number
  /** Adet başı aylık maliyet (kira veya amortisman) */
  monthlyCost: number
  months: number[]
  ownership: 'Kendi' | 'Kira'
  note?: string
}

/* ---------------- 10. Özet ---------------- */

export interface Timeline {
  id: string
  label: string
  date: string
  daysLeft: number
  owner: string
  state: 'Tamamlandı' | 'Devam' | 'Bekliyor' | 'Gecikti'
}
