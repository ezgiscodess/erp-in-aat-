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
  | 'birim_fiyat'
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

export type DocState = 'Analiz edildi' | 'Sırada' | 'Analiz ediliyor' | 'Hata'

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
  state: 'Karşılanıyor' | 'Eksik' | 'İnceleniyor' | 'Karşılanmıyor'
}

/* ---------------- 5. BoQ / Take-off ---------------- */

export interface BoqItem {
  id: string
  no: string
  group: string
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

/* ---------------- 10. Özet ---------------- */

export interface Timeline {
  id: string
  label: string
  date: string
  daysLeft: number
  owner: string
  state: 'Tamamlandı' | 'Devam' | 'Bekliyor' | 'Gecikti'
}
