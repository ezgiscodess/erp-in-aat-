/**
 * Görsel prototip verisi. Tamamı kurgudur; gerçek bir ihaleye ait değildir.
 * Amaç: ekranların gerçek bir ihale dosyasıyla nasıl görüneceğini göstermek.
 */
import type {
  BidRisk, BoqItem, Certificate, ClauseAnalysis, ContractSection, ContractVariable,
  CriticalTerm, Finding, GoNoGoCriterion, LibraryItem, ScheduleMilestone, ScheduleTask, ScopeSection,
  TenderDoc, TenderProject, Timeline, UnitPrice, WorkGroup,
} from './types'

export const project: TenderProject = {
  id: 'TND-2026-014',
  company: 'Anadolu İnşaat A.Ş.',
  code: 'TND-2026-014',
  name: 'Mersin Konteyner Limanı Genişleme — Faz 2 (Rıhtım ve Saha İşleri)',
  employer: 'Medport Liman İşletmeleri A.Ş.',
  country: 'Türkiye',
  location: 'Mersin / Akdeniz',
  contractType: 'FIDIC Red Book 1999 (Özel Şartlarla)',
  deliveryModel: 'Birim fiyat + götürü bedel karması',
  currency: 'EUR',
  estimatedValue: 82_000_000,
  durationDays: 720,
  bidDueAt: '2026-10-14',
  siteVisitAt: '2026-09-25',
  questionsDueAt: '2026-09-30',
  status: 'Hazırlanıyor',
  daysLeft: 24,
  progress: 46,
}

/* ---------------- 1. İhale dokümanı analizi ---------------- */

export const docs: TenderDoc[] = [
  { id: 'D1', name: 'Idari Sartname.pdf', kind: 'İdari Şartname', pages: 84, uploadedBy: 'e.yilmaz', uploadedAt: '2026-09-15 09:20', state: 'Analiz edildi', findings: 9 },
  { id: 'D2', name: 'Sozlesme Tasarisi (Ozel Sartlar).pdf', kind: 'Sözleşme Tasarısı', pages: 126, uploadedBy: 'e.yilmaz', uploadedAt: '2026-09-15 09:24', state: 'Analiz edildi', findings: 14 },
  { id: 'D3', name: 'Teknik Sartname - Deniz Yapilari.pdf', kind: 'Teknik Şartname', pages: 212, uploadedBy: 'm.demir', uploadedAt: '2026-09-15 11:02', state: 'Analiz edildi', findings: 7 },
  { id: 'D4', name: 'Birim Fiyat Teklif Cetveli.xlsx', kind: 'Teklif Cetveli', pages: 12, uploadedBy: 'm.demir', uploadedAt: '2026-09-15 11:05', state: 'Analiz edildi', findings: 3 },
  { id: 'D5', name: 'Zemin Etut Raporu.pdf', kind: 'Zemin Etüdü', pages: 58, uploadedBy: 's.kaya', uploadedAt: '2026-09-16 14:41', state: 'Analiz edildi', findings: 5, ocr: true },
  { id: 'D6', name: 'Avan Projeler (Rihtim-Saha).pdf', kind: 'Çizim Seti', pages: 46, uploadedBy: 's.kaya', uploadedAt: '2026-09-16 15:10', state: 'Analiz ediliyor', findings: 0 },
  { id: 'D7', name: 'Zeyilname-01.pdf', kind: 'Zeyilname', pages: 6, uploadedBy: 'e.yilmaz', uploadedAt: '2026-09-18 10:33', state: 'Analiz edildi', findings: 4 },
  { id: 'D8', name: 'Isveren Soru-Cevap Listesi.pdf', kind: 'Soru-Cevap', pages: 9, uploadedBy: 'e.yilmaz', uploadedAt: '2026-09-19 16:02', state: 'Sırada', findings: 0 },
]

export const findings: Finding[] = [
  {
    id: 'F1', kind: 'Risk', severity: 'Kritik',
    title: 'Fiyat farkı ödenmeyecek — 24 aylık işte enflasyon riski tamamen yüklenicide',
    explanation: 'Özel Şartlar 13.8 maddesi, FIDIC Genel Şartlar’daki fiyat ayarlama formülünü tamamen kaldırıyor. 720 günlük iş süresinde malzeme ve işçilik artışı teklif fiyatına gömülmek zorunda.',
    confidence: 0.94, docId: 'D2', docName: 'Sozlesme Tasarisi (Ozel Sartlar).pdf', page: 63, clause: '13.8',
    quote: 'Sub-Clause 13.8 [Adjustments for Changes in Cost] shall be deemed deleted and no adjustment shall be made to the Contract Price for rises or falls in cost.',
    verification: 'exact', status: 'Kabul',
  },
  {
    id: 'F2', kind: 'Çelişki', severity: 'Yüksek',
    title: 'Hakediş ödeme süresi iki dokümanda farklı: 60 gün / 90 gün',
    explanation: 'İdari Şartname 32.2 ödeme süresini 60 gün olarak veriyor; Sözleşme Özel Şartlar 14.7 ise 90 güne çıkarıyor. Teklif öncesi yazılı açıklama istenmeli; nakit akışı planı 90 güne göre kurulmalı.',
    confidence: 0.91, docId: 'D2', docName: 'Sozlesme Tasarisi (Ozel Sartlar).pdf', page: 71, clause: '14.7',
    quote: 'The Employer shall pay the amount certified within 90 days after the Engineer receives the Statement and supporting documents.',
    verification: 'exact', status: 'Kabul',
  },
  {
    id: 'F3', kind: 'Yükümlülük', severity: 'Kritik',
    title: 'Sözlü talimatlar 48 saat içinde yazılı teyit edilmezse hak kaybı',
    explanation: 'Acil durumlarda sözlü talimat verilebiliyor; ancak yüklenici 48 saat içinde yazılı teyit yayımlamazsa bu talimattan doğan süre ve maliyet talebi düşüyor. Sahada uygulanabilir bir teyit akışı kurulmalı.',
    confidence: 0.88, docId: 'D2', docName: 'Sozlesme Tasarisi (Ozel Sartlar).pdf', page: 22, clause: '3.3 (c)',
    quote: 'the Contractor shall issue a written acknowledgement within 48 hours of receiving such oral instruction, failing which the instruction shall be deemed not given.',
    verification: 'exact', status: 'Kabul',
  },
  {
    id: 'F4', kind: 'Yükümlülük', severity: 'Yüksek',
    title: 'Talep bildirimi 28 gün — kaçırılırsa talep hakkı düşüyor',
    explanation: 'Madde 20.1 standart 28 günlük bildirim süresini koruyor ve süreye uyulmazsa hak düşürücü sonuç doğuruyor. Olay kaydı ve bildirim takibi sistemde otomatik geri sayımla izlenmeli.',
    confidence: 0.93, docId: 'D2', docName: 'Sozlesme Tasarisi (Ozel Sartlar).pdf', page: 96, clause: '20.1',
    quote: 'If the Contractor fails to give notice of a claim within such period of 28 days, the Contractor shall not be entitled to additional payment and the Employer shall be discharged from all liability.',
    verification: 'exact', status: 'İncelemede',
  },
  {
    id: 'F5', kind: 'Risk', severity: 'Yüksek',
    title: 'Gecikme cezası tavanı yok denecek kadar yüksek: sözleşme bedelinin %15’i',
    explanation: 'Günlük ceza on binde 5 ve üst sınır %15. Piyasa pratiği %10. 60 günlük bir gecikme yaklaşık 2,5 milyon EUR ceza anlamına geliyor.',
    confidence: 0.9, docId: 'D1', docName: 'Idari Sartname.pdf', page: 41, clause: '31.4',
    quote: 'Gecikme cezası, gecikilen her takvim günü için sözleşme bedelinin on binde beşi oranında uygulanır; toplam ceza sözleşme bedelinin %15’ini geçemez.',
    verification: 'exact', status: 'Kabul',
  },
  {
    id: 'F6', kind: 'Eksik bilgi', severity: 'Yüksek',
    title: 'Zemin etüdü rıhtım hattında yetersiz — 180 m’lik bölümde sondaj yok',
    explanation: 'Etüt raporundaki sondaj lokasyonları rıhtımın doğu ucunda 180 metrelik bölümü kapsamıyor. Kazık boyu belirsizliği doğrudan maliyet riski. Teklif öncesi soru sorulmalı veya birim fiyatlı kazık kalemi talep edilmeli.',
    confidence: 0.79, docId: 'D5', docName: 'Zemin Etut Raporu.pdf', page: 23, clause: '—',
    quote: 'SK-11 ve SK-12 numaralı sondajlar arasındaki bölgede zemin profili enterpolasyon ile öngörülmüştür.',
    verification: 'fuzzy', status: 'Kabul',
  },
  {
    id: 'F7', kind: 'Risk', severity: 'Orta',
    title: 'Liman işletmesi devam ederken çalışma — günlük çalışma penceresi 10 saat',
    explanation: 'Teknik şartname, gemi operasyonları nedeniyle saha çalışmasını 07:00–17:00 ile sınırlıyor. Vardiya planı ve ekipman verimliliği bu kısıta göre kurulmalı.',
    confidence: 0.86, docId: 'D3', docName: 'Teknik Sartname - Deniz Yapilari.pdf', page: 34, clause: '2.7',
    quote: 'Saha çalışmaları, liman operasyonlarını aksatmamak üzere 07:00–17:00 saatleri arasında yürütülecektir.',
    verification: 'exact', status: 'İncelemede',
  },
  {
    id: 'F8', kind: 'Fırsat', severity: 'Orta',
    title: 'Dolgu malzemesi idare tarafından sahada temin ediliyor',
    explanation: 'Zeyilname-01, saha dolgusu için gerekli malzemenin işveren stok sahasından bedelsiz alınabileceğini söylüyor. Bu, birim fiyat teklifinde nakliye ve malzeme kaleminde belirgin avantaj sağlıyor.',
    confidence: 0.82, docId: 'D7', docName: 'Zeyilname-01.pdf', page: 3, clause: 'Madde 2',
    quote: 'Saha dolgusunda kullanılacak granüler malzeme, İdare’nin Karaduvar stok sahasından yükleniciye bedelsiz teslim edilecektir.',
    verification: 'exact', status: 'Kabul',
  },
  {
    id: 'F9', kind: 'Risk', severity: 'Orta',
    title: 'Avans yok, teminat oranları yüksek (geçici %3, kesin %6)',
    explanation: 'Avans ödemesi öngörülmemiş. Mobilizasyon ve ilk üç ayın finansmanı tamamen özkaynak/kredi ile karşılanacak. Teminat mektubu limitleri banka ile teyit edilmeli.',
    confidence: 0.95, docId: 'D1', docName: 'Idari Sartname.pdf', page: 28, clause: '25.1',
    quote: 'Bu ihalede avans verilmeyecektir. Kesin teminat, sözleşme bedelinin %6’sı oranındadır.',
    verification: 'exact', status: 'Kabul',
  },
  {
    id: 'F10', kind: 'Çelişki', severity: 'Orta',
    title: 'İş programı sunum süresi: 28 gün / 14 gün çelişkisi',
    explanation: 'Sözleşme 8.3 maddesi iş programını 28 gün içinde isterken, İdari Şartname 21. madde 14 gün diyor. Zeyilname ile netleştirilmesi istenmeli.',
    confidence: 0.84, docId: 'D1', docName: 'Idari Sartname.pdf', page: 33, clause: '21.1',
    quote: 'Yüklenici, sözleşmenin imzalanmasını izleyen 14 takvim günü içinde ayrıntılı iş programını İdare’ye sunar.',
    verification: 'exact', status: 'Yeni',
  },
  {
    id: 'F11', kind: 'Risk', severity: 'Düşük',
    title: 'Deniz çalışmalarında mevsim kısıtı (Kasım–Mart dalga penceresi)',
    explanation: 'Teknik şartname, belirli deniz işlerinin dalga yüksekliği 1,5 m üzerinde durdurulmasını şart koşuyor. Program, kış aylarında verimlilik kaybı içerecek şekilde kurulmalı.',
    confidence: 0.77, docId: 'D3', docName: 'Teknik Sartname - Deniz Yapilari.pdf', page: 88, clause: '5.4',
    quote: 'Anlamlı dalga yüksekliğinin 1,5 m’yi aşması hâlinde deniz üstü imalatlar durdurulur.',
    verification: 'exact', status: 'Yeni',
  },
]

/* ---------------- 3. Go / No-Go ---------------- */

export const goNoGoCriteria: GoNoGoCriterion[] = [
  { id: 'G1', group: 'Stratejik uyum', label: 'İş kolu ve referans uyumu', weight: 10, score: 85, note: 'Son 5 yılda 2 liman projesi tamamlandı', source: 'Kurumsal referans listesi' },
  { id: 'G2', group: 'Stratejik uyum', label: 'Bölgesel varlık ve lojistik', weight: 6, score: 78, note: 'Mersin’de aktif şantiye ve depo mevcut', source: 'Şirket kayıtları' },
  { id: 'G3', group: 'Teknik yeterlilik', label: 'Deniz yapıları (kazık, rıhtım) tecrübesi', weight: 12, score: 72, note: 'Kazıklı rıhtım tecrübesi var, keson tecrübesi yok', source: 'İş deneyim belgeleri' },
  { id: 'G4', group: 'Teknik yeterlilik', label: 'Ekipman ve deniz filosu', weight: 10, score: 55, note: 'Deniz vinci ve şahmerdan kiralanacak', source: 'Ekipman envanteri' },
  { id: 'G5', group: 'Teknik yeterlilik', label: 'Anahtar personel uygunluğu', weight: 6, score: 80, note: 'Liman tecrübeli şantiye şefi mevcut', source: 'İK havuzu' },
  { id: 'G6', group: 'Ticari', label: 'Tahmini kâr marjı', weight: 14, score: 58, note: 'Baz senaryoda %7,4 — hedefin altında', source: 'Ön maliyet çalışması' },
  { id: 'G7', group: 'Ticari', label: 'Nakit akışı yükü (avans yok, 90 gün ödeme)', weight: 12, score: 38, note: 'İlk 6 ayda ~10 M EUR negatif nakit', source: 'Kritik şartlar analizi' },
  { id: 'G8', group: 'Ticari', label: 'Teminat ve kredi limiti uygunluğu', weight: 8, score: 62, note: 'Kesin teminat için ek limit gerekli', source: 'Finans birimi' },
  { id: 'G9', group: 'Sözleşmesel risk', label: 'Risk paylaşımı dengesi', weight: 12, score: 35, note: 'Fiyat farkı yok, ceza tavanı %15', source: 'Kontrat analizi' },
  { id: 'G10', group: 'Sözleşmesel risk', label: 'Bildirim ve süre sınırı yükü', weight: 4, score: 55, note: '48 saat / 28 gün kuralları disiplin gerektiriyor', source: 'Kontrat analizi' },
  { id: 'G11', group: 'Kaynak & kapasite', label: 'Ekip müsaitliği (2026 Q4 – 2028 Q4)', weight: 4, score: 70, note: 'Adana projesi Mart 2027’de bitiyor', source: 'Kaynak planı' },
  { id: 'G12', group: 'Rekabet', label: 'Beklenen rakip sayısı ve fiyat baskısı', weight: 2, score: 45, note: '5–7 teklif bekleniyor', source: 'Pazar istihbaratı' },
]

/* ---------------- 4. Kritik ihale şartları ---------------- */

/**
 * Her şart, geldiği dokümanın paragrafıyla birlikte tutulur:
 * `context` sağdaki önizlemede açılan sayfa metni, `quote` ise o metinde boyanan cümledir.
 */
export const criticalTerms: CriticalTerm[] = [
  {
    id: 'K1', topic: 'Geçici teminat', requirement: 'Teklif bedelinin %3’ü, süresiz banka teminat mektubu',
    clause: 'İdari Ş. 25.1', page: 28, severity: 'Yüksek', impact: '≈ 2,46 M EUR limit',
    action: 'Banka limiti teyit edildi, mektup hazırlanıyor', owner: 'Finans', state: 'İnceleniyor', docId: 'D1',
    context: 'Madde 25.1 — Teminatlar: İstekliler, teklif ettikleri bedelin %3’ünden az olmamak üzere kendi belirleyecekleri tutarda geçici teminat vereceklerdir. Geçici teminat olarak sunulan banka teminat mektuplarında süre sınırı bulunmayacaktır. Bu ihalede avans verilmeyecektir.',
    quote: 'teklif ettikleri bedelin %3’ünden az olmamak üzere',
  },
  {
    id: 'K2', topic: 'Kesin teminat', requirement: 'Sözleşme bedelinin %6’sı',
    clause: 'İdari Ş. 25.3', page: 29, severity: 'Yüksek', impact: '≈ 4,92 M EUR limit',
    action: 'Ek limit talebi bankaya iletildi', owner: 'Finans', state: 'Eksik', docId: 'D1',
    context: 'Madde 25.3 — Kesin teminat: Sözleşmenin imzalanmasından önce, sözleşme bedelinin %6’sı oranında kesin teminat alınır. Kesin teminat mektubu, kabul işlemleri tamamlanıp kesin hesabı çıkarılıncaya kadar İdare’de kalır.',
    quote: 'sözleşme bedelinin %6’sı oranında kesin teminat',
  },
  {
    id: 'K3', topic: 'Gecikme cezası', requirement: 'Günlük on binde 5, üst sınır %15',
    clause: 'İdari Ş. 31.4', page: 41, severity: 'Kritik', impact: '60 gün gecikme ≈ 2,46 M EUR',
    action: 'Zeyilname ile %10’a indirilmesi talep edilecek', owner: 'Teklif', state: 'Karşılanmıyor', docId: 'D1',
    context: 'Madde 31.4 — Gecikme cezası: Yüklenici, sözleşmede öngörülen süre içinde işi tamamlamadığı takdirde, gecikilen her takvim günü için sözleşme bedelinin on binde beşi oranında gecikme cezası öder. Toplam ceza tutarı sözleşme bedelinin %15’ini geçemez. Gecikme cezası, hakedişlerden veya kesin teminattan kesilir. Cezanın uygulanması, İdare’nin sözleşmeyi feshetme hakkını ortadan kaldırmaz.',
    quote: 'gecikilen her takvim günü için sözleşme bedelinin on binde beşi',
  },
  {
    id: 'K4', topic: 'Ödeme süresi', requirement: 'Hakediş onayından sonra 90 gün',
    clause: 'Özel Ş. 14.7', page: 71, severity: 'Kritik', impact: 'İlk 6 ayda ~10 M EUR nakit ihtiyacı',
    action: 'Nakit akışı 90 güne göre revize edildi', owner: 'Finans', state: 'İnceleniyor', docId: 'D2',
    context: 'Sub-Clause 14.7 [Payment] — The Employer shall pay the amount certified within 90 days after the Engineer receives the Statement and supporting documents. Payment shall be made in the currencies stated in the Appendix to Tender. No financing charges shall be payable by the Employer in respect of any delay in certification.',
    quote: 'within 90 days after the Engineer receives the Statement',
  },
  {
    id: 'K5', topic: 'Avans', requirement: 'Avans verilmeyecek',
    clause: 'İdari Ş. 25.1', page: 28, severity: 'Yüksek', impact: 'Mobilizasyon özkaynakla',
    action: 'Kredi ön onayı alındı', owner: 'Finans', state: 'Karşılanıyor', docId: 'D1',
    context: 'Madde 25.1 — Teminatlar ve ödemeler: Bu ihalede avans verilmeyecektir. Yüklenici, mobilizasyon ve ilk dönem finansmanını kendi kaynaklarından karşılar. Kesin teminat, sözleşme bedelinin %6’sı oranındadır.',
    quote: 'Bu ihalede avans verilmeyecektir.',
  },
  {
    id: 'K6', topic: 'İş deneyimi', requirement: 'Son 15 yılda teklif bedelinin %80’i oranında benzer iş',
    clause: 'İdari Ş. 7.5', page: 17, severity: 'Kritik', impact: '≈ 65,6 M EUR belge gerekli',
    action: 'Adana + Bandırma belgeleri birleştirilecek; iş ortaklığı değerlendiriliyor', owner: 'PMO', state: 'İnceleniyor', docId: 'D1',
    context: 'Madde 7.5 — İş deneyimini gösteren belgeler: İsteklinin, son on beş yıl içinde bedel içeren bir sözleşme kapsamında taahhüt edilen ve teklif edilen bedelin %80’i oranından az olmamak üzere benzer işlere ait iş deneyimini gösteren belgeleri sunması zorunludur. İş ortaklığında pilot ortağın bu oranın en az %51’ini tek başına karşılaması gerekir.',
    quote: 'teklif edilen bedelin %80’i oranından az olmamak üzere',
  },
  {
    id: 'K7', topic: 'Fiyat farkı', requirement: 'Fiyat farkı ödenmeyecek',
    clause: 'Özel Ş. 13.8', page: 63, severity: 'Kritik', impact: '24 ayda %18–25 maliyet artış riski',
    action: 'Teklife eskalasyon karşılığı eklendi (%6,5)', owner: 'Teklif', state: 'Karşılanmıyor', docId: 'D2',
    context: 'Sub-Clause 13.8 [Adjustments for Changes in Cost] shall be deemed deleted and no adjustment shall be made to the Contract Price for rises or falls in cost of labour, Goods and other inputs to the Works. The Contractor shall be deemed to have satisfied himself as to the sufficiency of the Accepted Contract Amount.',
    quote: 'no adjustment shall be made to the Contract Price for rises or falls in cost',
  },
  {
    id: 'K8', topic: 'İş programı', requirement: 'Sözleşmeden sonra 14 gün içinde sunum',
    clause: 'İdari Ş. 21.1', page: 33, severity: 'Orta', impact: 'Çelişki: Sözleşme 8.3 → 28 gün',
    action: 'Açıklama talebi soru listesine eklendi', owner: 'PMO', state: 'İnceleniyor', docId: 'D1',
    context: 'Madde 21.1 — İş programı: Yüklenici, sözleşmenin imzalanmasını izleyen 14 takvim günü içinde ayrıntılı iş programını İdare’ye sunar. Program, kaynak ve nakit akışı planlarıyla birlikte verilir; İdare tarafından onaylanmadan imalata başlanamaz.',
    quote: 'sözleşmenin imzalanmasını izleyen 14 takvim günü içinde',
  },
  {
    id: 'K9', topic: 'Sigorta', requirement: 'CAR + üçüncü şahıs 25 M EUR limit',
    clause: 'Özel Ş. 18.3', page: 84, severity: 'Orta', impact: 'Prim tahmini 780 bin EUR',
    action: 'Broker teklifi alındı', owner: 'Finans', state: 'Karşılanıyor', docId: 'D2',
    context: 'Sub-Clause 18.3 — The Contractor shall effect Contractor’s All Risks insurance together with third party liability cover with a limit of not less than EUR 25,000,000 per occurrence, the number of occurrences being unlimited, and shall maintain such cover until the Performance Certificate is issued.',
    quote: 'a limit of not less than EUR 25,000,000 per occurrence',
  },
  {
    id: 'K10', topic: 'Kusur sorumluluğu (DLP)', requirement: '730 gün',
    clause: 'Özel Ş. 11.1', page: 58, severity: 'Orta', impact: 'Teminat 2 yıl bloke',
    action: 'Maliyete yansıtıldı', owner: 'Teklif', state: 'Karşılanıyor', docId: 'D2',
    context: 'Sub-Clause 11.1 — The Defects Notification Period shall be 730 days from the date stated in the Taking-Over Certificate. The Performance Security shall remain valid until the Contractor has executed and completed the Works and remedied any defects.',
    quote: 'The Defects Notification Period shall be 730 days',
  },
  {
    id: 'K11', topic: 'Yerli katkı', requirement: 'Teklif bedelinin en az %51’i yerli üretim',
    clause: 'İdari Ş. 9.2', page: 21, severity: 'Orta', impact: 'İthal ekipman payı sınırlanıyor',
    action: 'Tedarik planı kontrol ediliyor', owner: 'Satınalma', state: 'İnceleniyor', docId: 'D1',
    context: 'Madde 9.2 — Yerli katkı oranı: Teklif bedelinin en az %51’ine karşılık gelen imalat ve malzemenin yerli üretim olması şarttır. İthal edilecek ekipman ve malzemenin payı, teklif ekinde liste hâlinde beyan edilir.',
    quote: 'Teklif bedelinin en az %51’ine karşılık gelen imalat ve malzemenin yerli üretim olması',
  },
  {
    id: 'K12', topic: 'İş ortaklığı', requirement: 'Pilot ortak payı en az %51',
    clause: 'İdari Ş. 8.1', page: 19, severity: 'Düşük', impact: 'Ortaklık kurgusunu belirliyor',
    action: 'Pilot ortak biz olacağız', owner: 'C-Suite', state: 'Karşılanıyor', docId: 'D1',
    context: 'Madde 8.1 — İş ortaklığı: İhaleye iş ortaklığı olarak teklif verilebilir. Pilot ortağın hissesi en az %51 olmak zorundadır; özel ortakların her birinin hissesi %10’un altında olamaz. Ortaklık beyannamesi teklifle birlikte sunulur.',
    quote: 'Pilot ortağın hissesi en az %51 olmak zorundadır',
  },
]

/* ---------------- 10. Zaman çizelgesi (Özet ekranı) ---------------- */

export const timeline: Timeline[] = [
  { id: 'T1', label: 'İhale dokümanı temini', date: '2026-09-15', daysLeft: -5, owner: 'PMO', state: 'Tamamlandı' },
  { id: 'T2', label: 'Doküman analizi ve bulgu incelemesi', date: '2026-09-22', daysLeft: 2, owner: 'Teklif', state: 'Devam' },
  { id: 'T3', label: 'Saha ziyareti (zorunlu)', date: '2026-09-25', daysLeft: 5, owner: 'Teklif', state: 'Bekliyor' },
  { id: 'T4', label: 'İdareye soru gönderimi son gün', date: '2026-09-30', daysLeft: 10, owner: 'PMO', state: 'Bekliyor' },
  { id: 'T5', label: 'Go / No-Go yönetim kurulu kararı', date: '2026-10-02', daysLeft: 12, owner: 'C-Suite', state: 'Bekliyor' },
  { id: 'T6', label: 'Metraj ve birim fiyat çalışmasının kapanışı', date: '2026-10-07', daysLeft: 17, owner: 'Teknik', state: 'Devam' },
  { id: 'T7', label: 'Teminat mektubu ve belgelerin tamamlanması', date: '2026-10-10', daysLeft: 20, owner: 'Finans', state: 'Gecikti' },
  { id: 'T8', label: 'Teklif teslimi', date: '2026-10-14', daysLeft: 24, owner: 'Teklif', state: 'Bekliyor' },
]

/* ---------------- 5. BoQ / Take-off ---------------- */

/** Çip sırası da bu listedir: imalat akışına göre mobilizasyondan devreye almaya. */
export const workGroups: WorkGroup[] = [
  'Mobilizasyon', 'Kazı İşleri', 'Zemin İşleri', 'Betonarme İşleri', 'İnce İşler',
  'Mekanik İşleri', 'Elektrik İşleri', 'IT', 'Cephe & Çatı İşleri', 'Peyzaj', 'Test ve Devreye Alma',
]

export const boqItems: BoqItem[] = [
  { id: 'B1', no: '1000101', group: 'Mobilizasyon', description: 'Şantiye kurulumu, geçici tesisler ve mobilizasyon', unit: 'Götürü', qty: 1, poolMatch: 'Eşleşti', unitPrice: 2_450_000, source: 'İdare cetveli', confidence: 100 },
  { id: 'B2', no: '1000118', group: 'Mobilizasyon', description: 'Şantiye içi geçici yol ve saha çitlemesi', unit: 'm', qty: 3_400, poolMatch: 'Benzer poz', unitPrice: 62, source: 'Çizim P-101', confidence: 86 },
  { id: 'B3', no: '1000205', group: 'Kazı İşleri', description: 'Mevcut saha kaplamasının sökümü ve taşınması', unit: 'm²', qty: 48_500, poolMatch: 'Eşleşti', unitPrice: 9.4, source: 'Çizim P-102', confidence: 93 },
  { id: 'B4', no: '1000458', group: 'Kazı İşleri', description: 'Yumuşak zeminde makineli kazı ve nakli (bina temelleri)', unit: 'm³', qty: 34_000, poolMatch: 'Eşleşti', unitPrice: 4.85, source: 'Çizim P-105', confidence: 90 },
  { id: 'B5', no: '1000312', group: 'Kazı İşleri', description: 'Tarama (dredging), deniz tabanı düzeltme, −16,00 kotuna', unit: 'm³', qty: 386_000, poolMatch: 'Benzer poz', unitPrice: 11.8, source: 'Çizim D-201 + batimetri', confidence: 76, note: 'Batimetri 2024 tarihli; güncel ölçüm istenmeli' },
  { id: 'B6', no: '1000487', group: 'Zemin İşleri', description: 'Çelik boru kazık Ø1220 mm, t=20 mm, temin ve çakım', unit: 'ton', qty: 9_850, poolMatch: 'Eşleşti', unitPrice: 1_640, source: 'Çizim D-204', confidence: 71, note: 'Kazık boyu doğu uçta belirsiz (sondaj yok)' },
  { id: 'B7', no: '1000560', group: 'Zemin İşleri', description: 'Blok taş anroşman (1–3 ton)', unit: 'ton', qty: 74_000, poolMatch: 'Eşleşti', unitPrice: 27.5, source: 'Çizim D-215', confidence: 84 },
  { id: 'B8', no: '1000612', group: 'Zemin İşleri', description: 'Granüler dolgu (idare stok sahasından, nakliye dâhil)', unit: 'm³', qty: 268_000, poolMatch: 'Eşleşti', unitPrice: 6.9, source: 'Çizim P-110 + Zeyilname-01', confidence: 95, note: 'Malzeme bedelsiz — yalnız nakliye ve serme' },
  { id: 'B9', no: '1000625', group: 'Zemin İşleri', description: 'Alt temel ve temel (kırmataş) serilmesi, sıkıştırma', unit: 'm³', qty: 96_500, poolMatch: 'Eşleşti', unitPrice: 18.2, source: 'Çizim P-112', confidence: 92 },
  { id: 'B10', no: '1000640', group: 'Zemin İşleri', description: 'Ağır hizmet beton parke kaplama 100 mm', unit: 'm²', qty: 182_000, poolMatch: 'Eşleşti', unitPrice: 31.4, source: 'Çizim P-118', confidence: 94 },
  { id: 'B11', no: '1000655', group: 'Zemin İşleri', description: 'Asfalt kaplama (BSK) 2 tabaka', unit: 'ton', qty: 21_600, poolMatch: 'Eşleşti', unitPrice: 88, source: 'Çizim P-120', confidence: 89 },
  { id: 'B12', no: '1000520', group: 'Betonarme İşleri', description: 'Kazık başlığı betonu C35/45, donatı dâhil', unit: 'm³', qty: 12_400, poolMatch: 'Eşleşti', unitPrice: 268, source: 'Çizim D-206', confidence: 88 },
  { id: 'B13', no: '1000534', group: 'Betonarme İşleri', description: 'Rıhtım tabliyesi prekast kiriş üretimi ve montajı', unit: 'ad', qty: 268, poolMatch: 'Eşleşti', unitPrice: 14_900, source: 'Çizim D-211', confidence: 90 },
  { id: 'B14', no: '1000548', group: 'Betonarme İşleri', description: 'Operasyon ve bakım binası betonarme imalatı', unit: 'm³', qty: 1_850, poolMatch: 'Benzer poz', unitPrice: 268, source: 'Çizim Y-101', confidence: 86 },
  { id: 'B15', no: '1001110', group: 'İnce İşler', description: 'Operasyon binası iç imalatları (bölme, sıva, boya)', unit: 'm²', qty: 2_400, poolMatch: 'Eşleşti', unitPrice: 118, source: 'Çizim Y-110', confidence: 74, note: 'Mahal listesi şartnamede eksik' },
  { id: 'B16', no: '1001125', group: 'İnce İşler', description: 'Zemin ve duvar kaplamaları (seramik, epoksi)', unit: 'm²', qty: 1_650, poolMatch: 'Eşleşti', unitPrice: 96, source: 'Çizim Y-112', confidence: 79, note: 'Kaplama sınıfı belirtilmemiş' },
  { id: 'B17', no: '1000710', group: 'Mekanik İşleri', description: 'Yağmur suyu drenaj hattı Ø600–Ø1000 betonarme boru', unit: 'm', qty: 8_450, poolMatch: 'Eşleşti', unitPrice: 142, source: 'Çizim A-301', confidence: 87 },
  { id: 'B18', no: '1000722', group: 'Mekanik İşleri', description: 'Yangın hattı ve hidrant sistemi', unit: 'm', qty: 4_200, poolMatch: 'Eşleşti', unitPrice: 96, source: 'Çizim A-310', confidence: 81 },
  { id: 'B19', no: '1000735', group: 'Mekanik İşleri', description: 'Atık su terfi merkezi (komple)', unit: 'ad', qty: 2, poolMatch: 'Benzer poz', unitPrice: 385_000, source: 'Çizim A-320', confidence: 78, note: 'Ölçüm güveni %78 — elle kontrol edilmeli' },
  { id: 'B20', no: '1000910', group: 'Mekanik İşleri', description: 'Rıhtım babası 150 ton, montaj dâhil', unit: 'ad', qty: 36, poolMatch: 'Eşleşti', unitPrice: 12_800, source: 'Çizim D-220', confidence: 96 },
  { id: 'B21', no: '1000922', group: 'Mekanik İşleri', description: 'Usturmaça sistemi (cell fender), montaj dâhil', unit: 'ad', qty: 28, poolMatch: 'Eşleşti', unitPrice: 46_500, source: 'Çizim D-222', confidence: 93 },
  { id: 'B22', no: '1000935', group: 'Mekanik İşleri', description: 'Vinç rayı ve ankraj sistemi', unit: 'm', qty: 1_540, poolMatch: 'Eşleşti', unitPrice: 640, source: 'Çizim D-226', confidence: 88 },
  { id: 'B23', no: '1000810', group: 'Elektrik İşleri', description: 'OG kablolama ve ring besleme (34,5 kV)', unit: 'm', qty: 6_800, poolMatch: 'Eşleşti', unitPrice: 128, source: 'Çizim E-401', confidence: 85 },
  { id: 'B24', no: '1000822', group: 'Elektrik İşleri', description: 'Saha aydınlatma direği 30 m, projektörlü', unit: 'ad', qty: 42, poolMatch: 'Eşleşti', unitPrice: 24_600, source: 'Çizim E-406', confidence: 91 },
  { id: 'B25', no: '1000835', group: 'Elektrik İşleri', description: 'RTG besleme hattı ve makaralı kanal sistemi', unit: 'm', qty: 3_150, poolMatch: 'Eşleşmedi', source: 'Çizim E-412', confidence: 74, note: 'Ekipman markası netleşmedi' },
  { id: 'B26', no: '1001035', group: 'IT', description: 'Saha veri ağı, fiber omurga ve saha kabinetleri', unit: 'm', qty: 5_600, poolMatch: 'Eşleşti', unitPrice: 54, source: 'Çizim IT-201', confidence: 72, note: 'Liman işletme yazılımı kapsam dışı' },
  { id: 'B27', no: '1001022', group: 'IT', description: 'CCTV ve saha güvenlik altyapısı', unit: 'Götürü', qty: 1, poolMatch: 'Eşleşmedi', source: 'Teknik şartname 9.2', confidence: 69, note: 'Kapsam şartnamede net değil' },
  { id: 'B28', no: '1001210', group: 'Cephe & Çatı İşleri', description: 'Operasyon binası cephe kaplaması (kompozit panel)', unit: 'm²', qty: 1_280, poolMatch: 'Eşleşti', unitPrice: 168, source: 'Çizim Y-120', confidence: 80 },
  { id: 'B29', no: '1001222', group: 'Cephe & Çatı İşleri', description: 'Çatı su yalıtımı ve membran örtü', unit: 'm²', qty: 1_450, poolMatch: 'Eşleşti', unitPrice: 42, source: 'Çizim Y-122', confidence: 83 },
  { id: 'B30', no: '1001010', group: 'Peyzaj', description: 'Çevre güvenlik duvarı ve kapı sistemleri', unit: 'm', qty: 2_100, poolMatch: 'Eşleşti', unitPrice: 285, source: 'Çizim P-130', confidence: 90 },
  { id: 'B31', no: '1001310', group: 'Peyzaj', description: 'Peyzaj düzenlemesi, ağaçlandırma ve yeşil alan', unit: 'm²', qty: 6_800, poolMatch: 'Eşleşti', unitPrice: 24, source: 'Çizim P-135', confidence: 82 },
  { id: 'B32', no: '1001410', group: 'Test ve Devreye Alma', description: 'Kazık statik ve dinamik yükleme deneyleri', unit: 'ad', qty: 12, poolMatch: 'Benzer poz', unitPrice: 18_500, source: 'Teknik şartname 4.6', confidence: 77, note: 'Deney sayısı idare onayına bağlı' },
  { id: 'B33', no: '1001420', group: 'Test ve Devreye Alma', description: 'Sistemlerin testi, devreye alma ve işletme eğitimi', unit: 'Götürü', qty: 1, poolMatch: 'Benzer poz', unitPrice: 240_000, source: 'Teknik şartname 12', confidence: 68, note: 'Kapsam ve süre şartnamede net değil' },
]

/* ---------------- 6. Teklif riskleri ---------------- */

/**
 * Risklerin fiyata dönüşmesi bu modülün en zor kısmıdır. Üç sayı ayrı ayrı tutulur:
 *  • costImpact — risk gerçekleşirse oluşacak tutar (en kötü senaryo),
 *  • basis      — bu tutarın metraj × birim fiyat × oran biçimindeki açık hesabı,
 *  • provision  — teklif fiyatına gerçekten eklenen karşılık (yönetim kararı).
 * Beklenen değer (olasılık × bedel) yalnızca karşılığın makul aralığını gösterir, otomatik uygulanmaz.
 */
export const bidRisks: BidRisk[] = [
  {
    id: 'R1', category: 'Sözleşmesel', title: 'Fiyat farkı ödenmemesi',
    description: '24 aylık işte malzeme ve işçilik artışının tamamı yüklenicide. Özellikle çelik kazık ve çimento fiyatları kritik.',
    probability: 5, impact: 5, costImpact: 5_200_000, timeImpact: 0,
    basis: 'Maliyetin malzeme payı ≈ 44 M EUR × 24 ayda beklenen %12 birleşik artış',
    basisRef: 'Metraj toplamı · Poz 1000487, 1000520',
    mitigation: 'Teklife %6,5 eskalasyon karşılığı; çelik için erken tedarik ve fiyat kilidi',
    owner: 'Teklif', state: 'Açık', provision: 3_900_000, inBid: true,
  },
  {
    id: 'R2', category: 'Zemin', title: 'Doğu uçta kazık boyu belirsizliği',
    description: '180 m’lik bölümde sondaj yok. Kazık boyu %15 artarsa doğrudan maliyet artışı.',
    probability: 4, impact: 4, costImpact: 1_900_000, timeImpact: 35,
    basis: '9.850 ton × 1.640 EUR/ton = 16,2 M EUR · doğu uçtaki %12 boy artışı',
    basisRef: 'Poz 1000487 (Çelik boru kazık)',
    mitigation: 'İdareden ek sondaj talebi; kazık kalemi birim fiyatlı kalsın',
    owner: 'Teknik', state: 'Açık', provision: 1_400_000, inBid: true,
  },
  {
    id: 'R3', category: 'Finansal', title: '90 gün ödeme + avans yok',
    description: 'İlk 6 ayda yaklaşık 18 M EUR negatif nakit. Kredi maliyeti tekliften eksilir.',
    probability: 5, impact: 4, costImpact: 2_050_000, timeImpact: 0,
    basis: 'Ortalama 18 M EUR negatif nakit × %11 kredi maliyeti × 1,05 yıl',
    basisRef: 'Nakit akış modeli · Özel Ş. 14.7',
    mitigation: 'Kredi limiti ön onayı, hakediş kesme sıklığının artırılması talebi',
    owner: 'Finans', state: 'İzleniyor', provision: 1_650_000, inBid: true,
  },
  {
    id: 'R4', category: 'Program', title: 'Liman operasyonu nedeniyle 10 saatlik çalışma penceresi',
    description: 'Vardiya kısıtı üretkenliği düşürüyor; program sıkışırsa ceza riski.',
    probability: 4, impact: 3, costImpact: 1_100_000, timeImpact: 45,
    basis: 'Şantiye sabit gideri 1,4 M EUR/ay × %8 verimlilik kaybı × 10 ay',
    basisRef: 'İş programı · Teknik Şartname 2.7',
    mitigation: 'Gece çalışma izni talebi; kritik imalatlarda paralel ekip',
    owner: 'PMO', state: 'Açık', provision: 1_100_000, inBid: true,
  },
  {
    id: 'R5', category: 'Program', title: 'Kış döneminde dalga kaynaklı duraklamalar',
    description: 'Kasım–Mart arasında deniz imalatlarında tahmini %20 verimlilik kaybı.',
    probability: 4, impact: 3, costImpact: 740_000, timeImpact: 30,
    basis: 'Deniz ekipmanı kirası 370 bin EUR/ay × 2 kış döneminde 1 ay eşdeğer duraklama',
    basisRef: 'İş programı · Teknik Şartname 5.4',
    mitigation: 'Deniz işlerini yaz penceresine öne çeken program kurgusu',
    owner: 'PMO', state: 'İzleniyor', provision: 300_000, inBid: true,
  },
  {
    id: 'R6', category: 'Sözleşmesel', title: 'Gecikme cezası tavanının %15 olması',
    description: 'Ceza tavanı piyasa pratiğinin üzerinde; program riski doğrudan bilançoya yansıyor.',
    probability: 3, impact: 5, costImpact: 2_460_000, timeImpact: 0,
    basis: '82 M EUR × ‰0,5 × 60 gün gecikme senaryosu (tavan 12,3 M EUR)',
    basisRef: 'İdari Ş. 31.4',
    mitigation: 'Zeyilname ile %10 talebi; kabul edilmezse teklife risk primi',
    owner: 'C-Suite', state: 'Açık', provision: 250_000, inBid: true,
  },
  {
    id: 'R7', category: 'Tedarik', title: 'Çelik boru kazık temin süresi',
    description: 'Ø1220 mm boru için üretim + teslim süresi 5–7 ay. Gecikme kritik yolu doğrudan etkiler.',
    probability: 3, impact: 4, costImpact: 900_000, timeImpact: 60,
    basis: '2 ay gecikme × 450 bin EUR/ay ekipman ve şantiye sabit gideri',
    basisRef: 'Poz 1000487 · İş programı WBS 4',
    mitigation: 'Sözleşme öncesi tedarikçi ön anlaşması, iki alternatif üretici',
    owner: 'Satınalma', state: 'Açık', provision: 200_000, inBid: true,
  },
  {
    id: 'R8', category: 'Kur', title: 'EUR gelir – TL gider uyumsuzluğu',
    description: 'Gelir EUR, maliyetin %55’i TL. Kur gerilerse marj erir.',
    probability: 3, impact: 3, costImpact: 1_180_000, timeImpact: 0,
    basis: 'TL maliyet payı ≈ 40 M EUR karşılığı × %3 reel kur sapması',
    basisRef: 'Finans — kur senaryosu',
    mitigation: 'Doğal hedge oranının artırılması, forward değerlendirmesi',
    owner: 'Finans', state: 'İzleniyor', provision: 0, inBid: false,
  },
  {
    id: 'R9', category: 'Yeterlilik', title: 'İş deneyim belgesi yetersizliği',
    description: 'Tek başına %80 kriteri karşılanmıyor; iş ortaklığı gerekebilir.',
    probability: 3, impact: 5, costImpact: 0, timeImpact: 0,
    basis: 'Bedel etkisi yok — iş ortaklığı hâlinde kâr payı paylaşımı ayrı değerlendirilir',
    basisRef: 'İdari Ş. 7.5',
    mitigation: 'Pilot ortak olarak ortaklık kurgusu; belge birleştirme',
    owner: 'PMO', state: 'Açık', provision: 0, inBid: false,
  },
  {
    id: 'R10', category: 'Kapsam', title: 'CCTV / güvenlik sistemleri kapsamının belirsizliği',
    description: 'Teknik şartnamede kapsam net değil; götürü kalem risk taşıyor.',
    probability: 3, impact: 2, costImpact: 470_000, timeImpact: 0,
    basis: 'Götürü kalem tahmini 470 bin EUR — kapsam netleşmezse tamamı risk',
    basisRef: 'Poz 1001022 (havuzda fiyatı yok)',
    mitigation: 'Soru listesine eklendi; kapsam netleşmezse ihtirazi kayıt',
    owner: 'Teknik', state: 'Açık', provision: 100_000, inBid: true,
  },
  {
    id: 'R11', category: 'Çevre', title: 'Tarama malzemesinin bertaraf izni',
    description: 'Dip tarama malzemesinin döküm sahası izni idarede; gecikirse deniz işleri başlayamaz.',
    probability: 2, impact: 4, costImpact: 410_000, timeImpact: 40,
    basis: '40 gün duraklama × 370 bin EUR/ay deniz ekipmanı kirası',
    basisRef: 'Poz 1000312 · İş programı WBS 2',
    mitigation: 'İzin durumunun teklif öncesi yazılı teyidi',
    owner: 'PMO', state: 'İzleniyor', provision: 0, inBid: false,
  },
  {
    id: 'R12', category: 'Kaynak', title: 'Deniz ekipmanı (şahmerdan, vinç) kiralama maliyeti',
    description: 'Filo bizde yok; kira piyasası dar ve fiyat dalgalı.',
    probability: 3, impact: 3, costImpact: 990_000, timeImpact: 20,
    basis: '18 ay × 55 bin EUR/ay kira × %10 piyasa sapması',
    basisRef: 'Ekipman kira teklifleri',
    mitigation: 'İki tedarikçiden bağlayıcı teklif; uzun dönem kira opsiyonu',
    owner: 'Satınalma', state: 'Açık', provision: 0, inBid: false,
  },
]

/* ---------------- 7. Kontrat analizi ---------------- */

export const clauses: ClauseAnalysis[] = [
  { id: 'C1', clause: '3.3 (c)', title: 'Sözlü talimatların yazılı teyidi', page: 22, category: 'Bildirim', position: 'Yüklenici aleyhine', severity: 'Kritik', summary: 'Sözlü talimat 48 saat içinde yazılı teyit edilmezse verilmemiş sayılıyor; bu talimattan doğan hak talebi düşüyor.', quote: 'the Contractor shall issue a written acknowledgement within 48 hours of receiving such oral instruction, failing which the instruction shall be deemed not given.', timeBarDays: 2 },
  { id: 'C2', clause: '20.1', title: 'Yüklenici talepleri — bildirim süresi', page: 96, category: 'Bildirim', position: 'Yüklenici aleyhine', severity: 'Kritik', summary: 'Olayı fark ettikten sonra 28 gün içinde bildirim yapılmazsa ek ödeme ve süre hakkı tamamen düşüyor.', quote: 'If the Contractor fails to give notice of a claim within such period of 28 days, the Contractor shall not be entitled to additional payment...', timeBarDays: 28 },
  { id: 'C3', clause: '13.8', title: 'Maliyet değişiminde fiyat ayarlaması', page: 63, category: 'Ödeme', position: 'Yüklenici aleyhine', severity: 'Kritik', summary: 'Fiyat farkı maddesi tamamen kaldırılmış. 24 aylık sürede enflasyon riski yüklenicide.', quote: 'Sub-Clause 13.8 shall be deemed deleted and no adjustment shall be made to the Contract Price for rises or falls in cost.' },
  { id: 'C4', clause: '14.7', title: 'Ödeme süresi', page: 71, category: 'Ödeme', position: 'Yüklenici aleyhine', severity: 'Kritik', summary: 'Standart 56 gün yerine 90 gün. İdari Şartname’deki 60 gün ifadesiyle çelişiyor.', quote: 'The Employer shall pay the amount certified within 90 days after the Engineer receives the Statement...', conflictWith: 'İdari Şartname 32.2 (60 gün)' },
  { id: 'C5', clause: '4.12', title: 'Öngörülemeyen fiziksel koşullar', page: 31, category: 'Risk paylaşımı', position: 'Dengeli', severity: 'Yüksek', summary: 'Madde korunmuş; öngörülemeyen zemin koşulları için süre ve maliyet talebi mümkün. Ancak 20.1 bildirim süresine tabi.', quote: 'If the Contractor encounters adverse physical conditions which he considers to have been Unforeseeable...', timeBarDays: 28 },
  { id: 'C6', clause: '8.4', title: 'Süre uzatımı', page: 44, category: 'Süre', position: 'Dengeli', severity: 'Orta', summary: 'Süre uzatım gerekçeleri standart. Ancak hava koşulları için "olağandışı" eşiği 10 yıllık ortalamaya bağlanmış.', quote: 'exceptionally adverse climatic conditions, assessed against the ten-year average recorded at the nearest meteorological station' },
  { id: 'C7', clause: '11.1', title: 'Kusur sorumluluğu süresi (DLP)', page: 58, category: 'Teminat', position: 'Yüklenici aleyhine', severity: 'Orta', summary: 'DLP 365 gün yerine 730 gün. Teminat 2 yıl daha bloke kalıyor.', quote: 'The Defects Notification Period shall be 730 days from the date of the Taking-Over Certificate.' },
  { id: 'C8', clause: '17.6', title: 'Sorumluluk sınırı', page: 88, category: 'Risk paylaşımı', position: 'Yüklenici aleyhine', severity: 'Yüksek', summary: 'Toplam sorumluluk sınırı sözleşme bedelinin %100’ü olarak bırakılmış; dolaylı zarar istisnası daraltılmış.', quote: 'The total liability of the Contractor to the Employer shall not exceed the Accepted Contract Amount.' },
  { id: 'C9', clause: '15.2', title: 'İşveren tarafından fesih', page: 78, category: 'Fesih', position: 'Yüklenici aleyhine', severity: 'Yüksek', summary: 'Fesih sebepleri arasına "İdare’nin uygun göreceği diğer hâller" gibi açık uçlu bir ifade eklenmiş.', quote: '...or in any other circumstances which the Employer, at its sole discretion, considers to justify termination.' },
  { id: 'C10', clause: '20.6', title: 'Uyuşmazlık çözümü', page: 101, category: 'Uyuşmazlık', position: 'Dengeli', severity: 'Orta', summary: 'DAB öngörülmüş, tahkim ICC kurallarına göre İstanbul’da. Dil Türkçe.', quote: 'Any dispute shall be finally settled under the Rules of Arbitration of the ICC, seat of arbitration being Istanbul.' },
  { id: 'C11', clause: '14.2', title: 'Avans ödemesi', page: 69, category: 'Ödeme', position: 'Yüklenici aleyhine', severity: 'Yüksek', summary: 'Avans maddesi iptal edilmiş; mobilizasyon finansmanı tamamen yüklenicide.', quote: 'Sub-Clause 14.2 [Advance Payment] shall be deemed deleted.' },
  { id: 'C12', clause: '8.3', title: 'İş programı', page: 42, category: 'Süre', position: 'Dengeli', severity: 'Orta', summary: 'Program sunum süresi 28 gün. İdari Şartname 21.1 ise 14 gün diyor — çelişki.', quote: 'The Contractor shall submit a detailed time programme within 28 days after receiving the notice to commence.', conflictWith: 'İdari Şartname 21.1 (14 gün)' },
]

/* ---------------- 8. Kontrat hazırlama ---------------- */

export const contractSections: ContractSection[] = [
  { id: 'S1', no: '1', title: 'Taraflar ve tanımlar', state: 'Taslak hazır', source: 'Şablon', filledBy: 'Otomatik', note: 'Künye bilgileri ihale dokümanından dolduruldu' },
  { id: 'S2', no: '2', title: 'Sözleşmenin konusu ve kapsamı', state: 'Taslak hazır', source: 'İhale dokümanı', filledBy: 'Otomatik', note: 'İdari Şartname 2. maddeden üretildi' },
  { id: 'S3', no: '3', title: 'Sözleşme bedeli ve ödeme koşulları', state: 'Düzenleniyor', source: 'İhale dokümanı', filledBy: 'a.koc', note: '90 gün ödeme süresi ve fiyat farkı maddesi kontrol ediliyor' },
  { id: 'S4', no: '4', title: 'İşin süresi ve iş programı', state: 'Taslak hazır', source: 'Şablon', filledBy: 'Otomatik', note: '720 gün; program sunum süresi çelişkisi not düşüldü' },
  { id: 'S5', no: '5', title: 'Teminatlar', state: 'Taslak hazır', source: 'İhale dokümanı', filledBy: 'Otomatik', note: 'Kesin teminat %6' },
  { id: 'S6', no: '6', title: 'Gecikme cezası ve tazminat', state: 'Düzenleniyor', source: 'İhale dokümanı', filledBy: 'a.koc', note: 'Tavan %15 → %10 revizyon talebi işlendi' },
  { id: 'S7', no: '7', title: 'Süre uzatımı ve mücbir sebep', state: 'Taslak hazır', source: 'Şablon', filledBy: 'Otomatik', note: 'FIDIC 8.4 ve 19 maddelerine atıflı' },
  { id: 'S8', no: '8', title: 'Değişiklik emirleri ve talepler', state: 'Taslak hazır', source: 'Şablon', filledBy: 'Otomatik', note: '48 saat / 28 gün bildirim süreleri vurgulandı' },
  { id: 'S9', no: '9', title: 'Sigorta ve sorumluluk', state: 'Boş', source: 'Şablon', note: 'Broker teklifi bekleniyor' },
  { id: 'S10', no: '10', title: 'Alt yüklenici ve iş ortaklığı', state: 'Düzenleniyor', source: 'Elle yazıldı', filledBy: 'm.aydin', note: 'Pilot ortak payı %51 olarak yazıldı' },
  { id: 'S11', no: '11', title: 'Kabul, kusur sorumluluğu ve teslim', state: 'Taslak hazır', source: 'İhale dokümanı', filledBy: 'Otomatik', note: 'DLP 730 gün' },
  { id: 'S12', no: '12', title: 'Uyuşmazlık çözümü ve yetkili merci', state: 'Onaylandı', source: 'Şablon', filledBy: 'Hukuk', note: 'ICC tahkim, İstanbul, Türkçe' },
]

export const contractVariables: ContractVariable[] = [
  { key: 'isveren', label: 'İşveren', value: 'Medport Liman İşletmeleri A.Ş.', source: 'İdari Şartname s.3', filled: true },
  { key: 'yuklenici', label: 'Yüklenici', value: 'Anadolu İnşaat A.Ş. (Pilot ortak)', source: 'Şirket kaydı', filled: true },
  { key: 'is_adi', label: 'İşin adı', value: 'Mersin Konteyner Limanı Genişleme — Faz 2', source: 'İdari Şartname s.1', filled: true },
  { key: 'bedel', label: 'Sözleşme bedeli', value: '— (teklif sonrası)', source: 'Teklif cetveli', filled: false },
  { key: 'sure', label: 'İşin süresi', value: '720 takvim günü', source: 'İdari Şartname 19.1', filled: true },
  { key: 'odeme', label: 'Ödeme süresi', value: '90 gün (çelişki: İdari Ş. 60 gün)', source: 'Özel Şartlar 14.7', filled: true },
  { key: 'kesin_teminat', label: 'Kesin teminat', value: 'Sözleşme bedelinin %6’sı', source: 'İdari Şartname 25.3', filled: true },
  { key: 'ceza', label: 'Gecikme cezası', value: 'Günlük on binde 5 / tavan %15', source: 'İdari Şartname 31.4', filled: true },
  { key: 'dlp', label: 'Kusur sorumluluğu süresi', value: '730 gün', source: 'Özel Şartlar 11.1', filled: true },
  { key: 'tahkim', label: 'Uyuşmazlık', value: 'ICC tahkim — İstanbul', source: 'Özel Şartlar 20.6', filled: true },
  { key: 'sigorta', label: 'Sigorta limiti', value: '— (broker teklifi bekleniyor)', source: 'Özel Şartlar 18.3', filled: false },
]

/* ---------------- 9. Sertifikalar ---------------- */

export const certificates: Certificate[] = [
  { id: 'Z1', name: 'ISO 9001:2015 Kalite Yönetim Sistemi', authority: 'TÜRKAK akrediteli belgelendirme', required: true, owned: true, number: 'QMS-2024-1187', validUntil: '2027-04-18', daysLeft: 576, note: 'Geçerli' },
  { id: 'Z2', name: 'ISO 14001:2015 Çevre Yönetim Sistemi', authority: 'TÜRKAK akrediteli belgelendirme', required: true, owned: true, number: 'EMS-2024-0442', validUntil: '2027-04-18', daysLeft: 576, note: 'Geçerli' },
  { id: 'Z3', name: 'ISO 45001:2018 İSG Yönetim Sistemi', authority: 'TÜRKAK akrediteli belgelendirme', required: true, owned: true, number: 'OHS-2023-0913', validUntil: '2026-11-02', daysLeft: 43, note: 'Yenileme denetimi planlanmalı — teklif geçerlilik süresini kapsamıyor' },
  { id: 'Z4', name: 'Yapı Müteahhitliği Yetki Belgesi (A Sınıfı)', authority: 'Çevre, Şehircilik ve İklim Değişikliği Bakanlığı', required: true, owned: true, number: 'YMB-A-33-0271', validUntil: '2028-01-31', daysLeft: 1229, note: 'Geçerli' },
  { id: 'Z5', name: 'İş Deneyim Belgesi — Liman/Deniz Yapıları', authority: 'İdare onaylı', required: true, owned: true, number: 'İDB-2023-0067', validUntil: '—', note: 'Tutar teklif bedelinin %62’sini karşılıyor; %80 gerekiyor' },
  { id: 'Z6', name: 'ISO 3834-2 Kaynak Kalite Belgesi', authority: 'Belgelendirme kuruluşu', required: true, owned: false, note: 'Çelik kazık imalatı için isteniyor — alt yükleniciden temin edilecek' },
  { id: 'Z7', name: 'EN 1090-2 EXC3 Çelik Yapı Uygunluk Belgesi', authority: 'Onaylanmış kuruluş', required: true, owned: false, note: 'Prekast/çelik imalatçısının belgesi dosyaya eklenecek' },
  { id: 'Z8', name: 'Kaynakçı Sertifikaları (EN ISO 9606-1)', authority: 'Belgelendirme kuruluşu', required: true, owned: true, number: '18 personel', validUntil: '2027-06-30', daysLeft: 649, note: '6 kaynakçının belgesi 2026 Aralık’ta doluyor' },
  { id: 'Z9', name: 'Dalgıç Sertifikaları (ticari dalgıç)', authority: 'Yetkili eğitim kurumu', required: true, owned: false, note: 'Deniz altı kontrolleri için taşeron dalgıç ekibi sözleşmesi gerekiyor' },
  { id: 'Z10', name: 'İSG Uzmanı (A Sınıfı) görevlendirmesi', authority: 'Çalışma ve Sosyal Güvenlik Bakanlığı', required: true, owned: true, number: 'İSG-A-2291', validUntil: '2029-03-12', daysLeft: 2000, note: 'Geçerli' },
  { id: 'Z11', name: 'Vergi Borcu Yoktur Yazısı', authority: 'Gelir İdaresi Başkanlığı', required: true, owned: true, number: '—', validUntil: '2026-10-20', daysLeft: 30, note: 'Teklif tarihinde güncel olmalı — yeniden alınacak' },
  { id: 'Z12', name: 'SGK Borcu Yoktur Yazısı', authority: 'Sosyal Güvenlik Kurumu', required: true, owned: true, number: '—', validUntil: '2026-10-20', daysLeft: 30, note: 'Teklif tarihinde güncel olmalı — yeniden alınacak' },
  { id: 'Z13', name: 'Ticaret Sicil Gazetesi ve İmza Sirküleri', authority: 'Ticaret Sicil Müdürlüğü', required: true, owned: true, number: '—', validUntil: '—', note: 'Dosyada güncel' },
  { id: 'Z14', name: 'Banka Referans Mektubu', authority: 'Banka', required: true, owned: false, note: 'Teklif bedelinin %10’u kullanılmamış limit — banka yazısı bekleniyor' },
  { id: 'Z15', name: 'CAR (İnşaat All Risk) Poliçesi', authority: 'Sigorta şirketi', required: false, owned: false, note: 'Sözleşme sonrası; broker teklifi alındı' },
]

/* ---------------- Birim Fiyat Havuzu (firma geneli, projeden bağımsız) ---------------- */

export const unitPrices: UnitPrice[] = [
  { id: 'U1', no: '1000458', description: 'Yumuşak zeminlerde makineli kazı yapılması', unit: 'm³', price: 4.85, currency: 'EUR', source: 'Kendi analizimiz', updatedAt: '2026-08-12', updatedBy: 'a.koc', usedIn: 7 },
  { id: 'U2', no: '1000101', description: 'Şantiye kurulumu, geçici tesisler ve mobilizasyon', unit: 'Götürü', price: 2_450_000, currency: 'EUR', source: 'Kendi analizimiz', updatedAt: '2026-09-02', updatedBy: 'a.koc', usedIn: 3 },
  { id: 'U3', no: '1000205', description: 'Mevcut saha kaplamasının sökümü ve taşınması', unit: 'm²', price: 9.4, currency: 'EUR', source: 'Geçmiş proje', updatedAt: '2026-06-28', updatedBy: 'm.demir', usedIn: 5 },
  { id: 'U4', no: '1000312', description: 'Deniz tabanı tarama (dredging), yumuşak zemin', unit: 'm³', price: 11.8, currency: 'EUR', source: 'Piyasa teklifi', updatedAt: '2026-09-10', updatedBy: 's.kaya', usedIn: 2 },
  { id: 'U5', no: '1000487', description: 'Çelik boru kazık Ø1220 mm temin ve çakım', unit: 'ton', price: 1_640, currency: 'EUR', source: 'Piyasa teklifi', updatedAt: '2026-09-14', updatedBy: 's.kaya', usedIn: 2 },
  { id: 'U6', no: '1000520', description: 'Betonarme imalat C35/45, donatı dâhil', unit: 'm³', price: 268, currency: 'EUR', source: 'Kendi analizimiz', updatedAt: '2026-07-19', updatedBy: 'a.koc', usedIn: 11 },
  { id: 'U7', no: '1000534', description: 'Prekast kiriş üretimi ve montajı', unit: 'ad', price: 14_900, currency: 'EUR', source: 'Kendi analizimiz', updatedAt: '2026-05-30', updatedBy: 'm.demir', usedIn: 4 },
  { id: 'U8', no: '1000560', description: 'Blok taş anroşman (1–3 ton)', unit: 'ton', price: 27.5, currency: 'EUR', source: 'BCBS', updatedAt: '2026-04-11', updatedBy: 'sistem', usedIn: 6 },
  { id: 'U9', no: '1000612', description: 'Granüler dolgu serilmesi ve sıkıştırılması', unit: 'm³', price: 6.9, currency: 'EUR', source: 'BCBS', updatedAt: '2026-04-11', updatedBy: 'sistem', usedIn: 9 },
  { id: 'U10', no: '1000625', description: 'Alt temel ve temel (kırmataş) serilmesi', unit: 'm³', price: 18.2, currency: 'EUR', source: 'BCBS', updatedAt: '2026-04-11', updatedBy: 'sistem', usedIn: 8 },
  { id: 'U11', no: '1000640', description: 'Ağır hizmet beton parke kaplama 100 mm', unit: 'm²', price: 31.4, currency: 'EUR', source: 'Kendi analizimiz', updatedAt: '2026-08-01', updatedBy: 'a.koc', usedIn: 5 },
  { id: 'U12', no: '1000655', description: 'Bitümlü sıcak karışım (BSK) asfalt kaplama', unit: 'ton', price: 88, currency: 'EUR', source: 'BCBS', updatedAt: '2026-04-11', updatedBy: 'sistem', usedIn: 12 },
  { id: 'U13', no: '1000710', description: 'Betonarme boru döşenmesi Ø600–Ø1000', unit: 'm', price: 142, currency: 'EUR', source: 'Geçmiş proje', updatedAt: '2026-03-22', updatedBy: 'm.demir', usedIn: 7 },
  { id: 'U14', no: '1000722', description: 'Yangın hattı ve hidrant sistemi', unit: 'm', price: 96, currency: 'EUR', source: 'Kendi analizimiz', updatedAt: '2026-02-14', updatedBy: 'a.koc', usedIn: 3 },
  { id: 'U15', no: '1000810', description: 'OG kablolama ve ring besleme (34,5 kV)', unit: 'm', price: 128, currency: 'EUR', source: 'Piyasa teklifi', updatedAt: '2026-09-05', updatedBy: 's.kaya', usedIn: 2 },
  { id: 'U16', no: '1000822', description: 'Saha aydınlatma direği 30 m, projektörlü', unit: 'ad', price: 24_600, currency: 'EUR', source: 'Piyasa teklifi', updatedAt: '2026-08-22', updatedBy: 's.kaya', usedIn: 3 },
  { id: 'U17', no: '1000910', description: 'Rıhtım babası 150 ton, montaj dâhil', unit: 'ad', price: 12_800, currency: 'EUR', source: 'Geçmiş proje', updatedAt: '2026-01-30', updatedBy: 'm.demir', usedIn: 2 },
  { id: 'U18', no: '1000922', description: 'Usturmaça sistemi (cell fender), montaj dâhil', unit: 'ad', price: 46_500, currency: 'EUR', source: 'Piyasa teklifi', updatedAt: '2026-09-08', updatedBy: 's.kaya', usedIn: 2 },
  { id: 'U19', no: '1000935', description: 'Vinç rayı ve ankraj sistemi', unit: 'm', price: 640, currency: 'EUR', source: 'Kendi analizimiz', updatedAt: '2026-06-02', updatedBy: 'a.koc', usedIn: 1 },
  { id: 'U20', no: '1001010', description: 'Çevre güvenlik duvarı ve kapı sistemleri', unit: 'm', price: 285, currency: 'EUR', source: 'BCBS', updatedAt: '2026-04-11', updatedBy: 'sistem', usedIn: 4 },
  { id: 'U21', no: '1001110', description: 'İç bölme, sıva ve boya imalatları', unit: 'm²', price: 118, currency: 'EUR', source: 'Kendi analizimiz', updatedAt: '2026-07-05', updatedBy: 'a.koc', usedIn: 6 },
  { id: 'U22', no: '1001125', description: 'Zemin ve duvar kaplaması (seramik / epoksi)', unit: 'm²', price: 96, currency: 'EUR', source: 'BCBS', updatedAt: '2026-04-11', updatedBy: 'sistem', usedIn: 5 },
  { id: 'U23', no: '1001210', description: 'Kompozit panel cephe kaplaması', unit: 'm²', price: 168, currency: 'EUR', source: 'Piyasa teklifi', updatedAt: '2026-08-18', updatedBy: 's.kaya', usedIn: 3 },
  { id: 'U24', no: '1001222', description: 'Çatı su yalıtımı ve membran örtü', unit: 'm²', price: 42, currency: 'EUR', source: 'BCBS', updatedAt: '2026-04-11', updatedBy: 'sistem', usedIn: 7 },
  { id: 'U25', no: '1001310', description: 'Peyzaj düzenlemesi ve ağaçlandırma', unit: 'm²', price: 24, currency: 'EUR', source: 'Geçmiş proje', updatedAt: '2026-05-12', updatedBy: 'm.demir', usedIn: 4 },
  { id: 'U26', no: '1001035', description: 'Fiber omurga ve saha veri ağı', unit: 'm', price: 54, currency: 'EUR', source: 'Piyasa teklifi', updatedAt: '2026-09-03', updatedBy: 's.kaya', usedIn: 2 },
  { id: 'U27', no: '1000118', description: 'Şantiye geçici yolu ve saha çitlemesi', unit: 'm', price: 62, currency: 'EUR', source: 'Kendi analizimiz', updatedAt: '2026-06-20', updatedBy: 'a.koc', usedIn: 5 },
]

/* ---------------- Kapsam bilgisi (İhale Bilgi Paneli altında) ---------------- */

export const scopeSections: ScopeSection[] = [
  {
    id: 'K1', title: 'İşin tanımı',
    body: 'Mevcut konteyner limanının doğu yönünde 420 m uzunluğunda yeni rıhtım yapılması, rıhtım gerisinde 18,2 hektar konteyner sahasının teşkili ve bu sahanın altyapı, elektrik ve güvenlik sistemlerinin tamamlanması işidir. İş, liman operasyonu devam ederken yürütülecektir.',
    source: 'İdari Şartname md. 2 · Teknik Şartname bölüm 1',
  },
  {
    id: 'K2', title: 'Ana imalat kalemleri',
    body: '• Deniz tabanı taraması ve −16,00 kotuna düzeltme\n• Ø1220 mm çelik boru kazık çakımı ve kazık başlığı betonu\n• Prekast kiriş üretimi, montajı ve rıhtım tabliyesi\n• Blok taş anroşman ve şev koruma\n• Saha dolgusu, alt temel ve ağır hizmet beton parke kaplama\n• Drenaj, yangın hattı, atık su terfi merkezi\n• OG kablolama, saha aydınlatması, RTG besleme hattı\n• Rıhtım babası, usturmaça ve vinç rayı montajı',
    source: 'Teknik Şartname bölüm 3–9 · Birim Fiyat Teklif Cetveli',
  },
  {
    id: 'K3', title: 'İşveren tarafından sağlanacaklar',
    body: 'Saha dolgusunda kullanılacak granüler malzeme, İdare’nin Karaduvar stok sahasından yükleniciye bedelsiz teslim edilecektir. Tarama malzemesinin döküm sahası izni İdare tarafından alınacaktır. Elektrik ve su bağlantı noktaları saha sınırında İdare tarafından hazır edilecektir.',
    source: 'Zeyilname-01 md. 2 · Teknik Şartname 2.4',
  },
  {
    id: 'K4', title: 'Kapsam dışı',
    body: 'RTG vinçlerinin temini ve montajı, liman işletme yazılımı, gümrük binası ve idari bina yapımı bu ihalenin kapsamı dışındadır. Bu işler ayrı ihaleyle yapılacaktır.',
    source: 'İdari Şartname md. 2.3',
  },
  {
    id: 'K5', title: 'Çalışma koşulları ve kısıtlar',
    body: 'Saha çalışmaları liman operasyonunu aksatmayacak şekilde 07:00–17:00 arasında yürütülecektir. Anlamlı dalga yüksekliğinin 1,5 m’yi aşması hâlinde deniz üstü imalatlar durdurulur. Gemi yanaşma programı İdare tarafından haftalık olarak bildirilir.',
    source: 'Teknik Şartname 2.7 ve 5.4',
  },
  {
    id: 'K6', title: 'Belirsiz / netleştirilmesi gereken kapsam',
    body: 'CCTV ve saha güvenlik sistemlerinin kapsamı şartnamede net değildir (kamera sayısı, kayıt süresi, entegrasyon). RTG besleme hattında ekipman markası belirtilmemiştir. Her iki konu için idareye soru sorulacaktır.',
    source: 'Teknik Şartname 9.2 · AI kapsam taraması',
  },
]

/* ---------------- Önizleme paneli için örnek sayfa metinleri ---------------- */

export const previewBodies: Record<string, string> = {
  D1: 'Madde 31.4 — Gecikme cezası: Yüklenici, sözleşmede öngörülen süre içinde işi tamamlamadığı takdirde, gecikilen her takvim günü için sözleşme bedelinin on binde beşi oranında gecikme cezası öder. Toplam ceza tutarı sözleşme bedelinin %15’ini geçemez. Gecikme cezası, hakedişlerden veya kesin teminattan kesilir. Cezanın uygulanması, İdare’nin sözleşmeyi feshetme hakkını ortadan kaldırmaz.',
  D2: 'Sub-Clause 14.7 [Payment] — The Employer shall pay the amount certified within 90 days after the Engineer receives the Statement and supporting documents. Payment shall be made in the currencies stated in the Appendix to Tender. No financing charges shall be payable by the Employer in respect of any delay in certification attributable to insufficient supporting documents submitted by the Contractor.',
  D3: 'Madde 2.7 — Çalışma saatleri: Saha çalışmaları, liman operasyonlarını aksatmamak üzere 07:00–17:00 saatleri arasında yürütülecektir. Bu saatler dışında çalışma yapılabilmesi için İdare’den yazılı izin alınması zorunludur. Gece çalışması talepleri, gemi yanaşma programı dikkate alınarak değerlendirilir.',
  D5: 'Bölüm 4.3 — Zemin profili: SK-11 ve SK-12 numaralı sondajlar arasındaki bölgede zemin profili enterpolasyon ile öngörülmüştür. Bu bölgede yapılacak kazık imalatlarında, uygulama öncesi ilave sondaj yapılması tavsiye edilir. Kazık boyları, uygulama sırasında çakma direncine göre revize edilebilir.',
  D4: 'Birim Fiyat Teklif Cetveli — İdare, poz numarası, iş kalemi, birim ve miktar sütunlarını doldurmuş; birim fiyat ve tutar sütunları boş bırakılmıştır. İstekli, her satır için teklif ettiği birim fiyatı yazar. Cetvelde yer alan miktarlar yaklaşık olup, hakedişler yerinde ölçülen gerçek miktarlar üzerinden düzenlenir.',
  D6: 'Avan Proje — Çizim D-204 (Kazık planı): Rıhtım hattı boyunca Ø1220 mm çelik boru kazıklar 4,50 m aralıkla yerleştirilmiştir. Kazık boyları SK-01…SK-10 sondaj verilerine göre 38–44 m arasında öngörülmüştür. Doğu uçtaki 180 m’lik bölümde sondaj bulunmadığından kazık boyu uygulama sırasında belirlenecektir.',
  D8: 'İşveren Soru-Cevap Listesi — Soru 7: “Ödeme süresi İdari Şartname 32.2’de 60 gün, Sözleşme Tasarısı 14.7’de 90 gün olarak geçmektedir. Hangisi esas alınacaktır?” Cevap: “Sözleşme Tasarısı hükümleri esastır.” · Soru 11: “Rıhtımın doğu ucunda ilave sondaj yapılacak mıdır?” Cevap: “İlave sondaj yapılmayacaktır; kazık boyu uygulamada tespit edilecektir.” · Soru 14: “CCTV kapsamına kamera sayısı dâhil midir?” Cevap: “Kamera sayısı ve kayıt süresi zeyilname ile bildirilecektir.”',
  D7: 'Madde 2 — Saha dolgusunda kullanılacak granüler malzeme, İdare’nin Karaduvar stok sahasından yükleniciye bedelsiz teslim edilecektir. Malzemenin yüklenmesi, nakliyesi, serilmesi ve sıkıştırılması yükleniciye aittir. Stok sahasından çekilecek günlük azami miktar 4.000 m³ ile sınırlıdır.',
}

/* ---------------- Yüklü işler (giriş sonrası ara sayfa) ---------------- */

/**
 * Şirkete yüklenmiş ihale ve projeler. Modül bu listeden seçilen işle açılır;
 * her işin verisi kendi alanında durur, diğer işlerden yalıtılmıştır.
 */
export const library: LibraryItem[] = [
  {
    id: 'TND-2026-014', kind: 'ihale', code: 'TND-2026-014',
    name: 'Mersin Konteyner Limanı Genişleme — Faz 2 (Rıhtım ve Saha İşleri)',
    employer: 'Medport Liman İşletmeleri A.Ş.', location: 'Mersin / Akdeniz',
    dueAt: '2026-10-14', daysLeft: 24, value: 82_000_000, currency: 'EUR',
    status: 'Hazırlanıyor', docCount: 8, progress: 46, updatedAt: '2026-09-19 16:02', updatedBy: 'e.yilmaz',
  },
  {
    id: 'TND-2026-016', kind: 'ihale', code: 'TND-2026-016',
    name: 'İzmir Aliağa Tersane Kuru Havuz Yenileme',
    employer: 'Ege Tersane A.Ş.', location: 'İzmir / Aliağa',
    dueAt: '2026-11-05', daysLeft: 45, value: 38_400_000, currency: 'EUR',
    status: 'Analiz ediliyor', docCount: 4, progress: 18, updatedAt: '2026-09-20 11:35', updatedBy: 's.kaya',
  },
  {
    id: 'TND-2026-011', kind: 'ihale', code: 'TND-2026-011',
    name: 'Bandırma OSB Altyapı ve Yol İşleri',
    employer: 'Bandırma OSB Müdürlüğü', location: 'Balıkesir / Bandırma',
    dueAt: '2026-09-04', daysLeft: -17, value: 24_500_000, currency: 'EUR',
    status: 'Teklif Verildi', docCount: 6, progress: 100, updatedAt: '2026-09-04 17:40', updatedBy: 'm.demir',
  },
  {
    id: 'TND-2026-009', kind: 'ihale', code: 'TND-2026-009',
    name: 'Adana Şehir Hastanesi Ek Blok',
    employer: 'Sağlık Yatırım A.Ş.', location: 'Adana / Yüreğir',
    dueAt: '2026-07-22', daysLeft: -61, value: 64_000_000, currency: 'EUR',
    status: 'Kazanıldı', docCount: 9, progress: 100, updatedAt: '2026-08-02 09:15', updatedBy: 'e.yilmaz',
  },
  {
    id: 'TND-2026-006', kind: 'ihale', code: 'TND-2026-006',
    name: 'Kuzey Marmara Otoyolu K5 Viyadük',
    employer: 'Karayolları Genel Müdürlüğü', location: 'Kocaeli / Gebze',
    dueAt: '2026-05-14', daysLeft: -130, value: 91_000_000, currency: 'EUR',
    status: 'Kaybedildi', docCount: 11, progress: 100, updatedAt: '2026-05-28 14:20', updatedBy: 'm.demir',
  },
  {
    id: 'PRJ-2026-003', kind: 'proje', code: 'PRJ-2026-003',
    name: 'Adana Şehir Hastanesi Ek Blok — Yapım',
    employer: 'Sağlık Yatırım A.Ş.', location: 'Adana / Yüreğir',
    dueAt: '2028-03-30', daysLeft: 555, value: 64_000_000, currency: 'EUR',
    status: 'Yapım sürüyor', docCount: 23, progress: 12, updatedAt: '2026-09-21 08:40', updatedBy: 'a.koc',
  },
  {
    id: 'PRJ-2024-008', kind: 'proje', code: 'PRJ-2024-008',
    name: 'Gebze Lojistik Merkezi Depo Yapıları',
    employer: 'Anadolu Lojistik A.Ş.', location: 'Kocaeli / Gebze',
    dueAt: '2026-12-20', daysLeft: 90, value: 29_200_000, currency: 'EUR',
    status: 'Yapım sürüyor', docCount: 31, progress: 72, updatedAt: '2026-09-18 18:05', updatedBy: 'a.koc',
  },
  {
    id: 'PRJ-2024-002', kind: 'proje', code: 'PRJ-2024-002',
    name: 'Samsun Tahıl Terminali ve Silo Tesisi',
    employer: 'Karadeniz Tahıl A.Ş.', location: 'Samsun / Tekkeköy',
    dueAt: '2026-10-30', daysLeft: 39, value: 17_800_000, currency: 'EUR',
    status: 'Kabul aşaması', docCount: 28, progress: 96, updatedAt: '2026-09-15 12:10', updatedBy: 'm.aydin',
  },
]

/* ---------------- İş programı ---------------- */

/**
 * Teklif aşamasında hazırlanan iş programı. Süreler metrajdan türetilir:
 * miktar ÷ günlük kapasite. Kritik yol, bitiş tarihini doğrudan belirleyen zincirdir.
 */
export const scheduleTasks: ScheduleTask[] = [
  { id: 'W1', wbs: '1', name: 'Mobilizasyon ve saha hazırlığı', group: 'Mobilizasyon', startMonth: 0, months: 2, critical: true, assumption: 'Şantiye kurulumu 8 hafta · yer teslimi sözleşme + 15 gün', boqRef: '1000101', progress: 0 },
  { id: 'W2', wbs: '2', name: 'Deniz tabanı taraması (dredging)', group: 'Kazı İşleri', startMonth: 1, months: 5, critical: true, dependsOn: '1', assumption: '386.000 m³ ÷ 2.800 m³/gün (1 tarak gemisi) ≈ 138 gün', boqRef: '1000312', progress: 0 },
  { id: 'W3', wbs: '3', name: 'Saha sökümü ve kazı işleri', group: 'Kazı İşleri', startMonth: 1, months: 3, critical: false, dependsOn: '1', assumption: '48.500 m² söküm + 34.000 m³ kazı · 2 ekip', boqRef: '1000205', progress: 0 },
  { id: 'W4', wbs: '4', name: 'Çelik boru kazık temini', group: 'Zemin İşleri', startMonth: 0, months: 6, critical: true, assumption: 'Üretim + teslim 5–7 ay — R7 riski kritik yolda', boqRef: '1000487', progress: 0 },
  { id: 'W5', wbs: '5', name: 'Kazık çakımı', group: 'Zemin İşleri', startMonth: 5, months: 7, critical: true, dependsOn: '4', assumption: '9.850 ton ÷ 48 ton/gün (2 şahmerdan, 10 saatlik pencere)', boqRef: '1000487', progress: 0 },
  { id: 'W6', wbs: '6', name: 'Kazık başlığı ve tabliye betonu', group: 'Betonarme İşleri', startMonth: 8, months: 6, critical: true, dependsOn: '5', assumption: '12.400 m³ ÷ 95 m³/gün', boqRef: '1000520', progress: 0 },
  { id: 'W7', wbs: '7', name: 'Prekast kiriş üretimi ve montajı', group: 'Betonarme İşleri', startMonth: 9, months: 6, critical: false, dependsOn: '5', assumption: '268 ad ÷ 2 ad/gün montaj', boqRef: '1000534', progress: 0 },
  { id: 'W8', wbs: '8', name: 'Anroşman ve şev koruma', group: 'Zemin İşleri', startMonth: 7, months: 4, critical: false, dependsOn: '2', assumption: '74.000 ton ÷ 950 ton/gün', boqRef: '1000560', progress: 0 },
  { id: 'W9', wbs: '9', name: 'Saha dolgusu ve alt temel', group: 'Zemin İşleri', startMonth: 10, months: 5, critical: false, dependsOn: '3', assumption: '268.000 m³ ÷ 2.400 m³/gün · malzeme idare stokundan', boqRef: '1000612', progress: 0 },
  { id: 'W10', wbs: '10', name: 'Saha kaplamaları (parke + asfalt)', group: 'Zemin İşleri', startMonth: 14, months: 5, critical: false, dependsOn: '9', assumption: '182.000 m² ÷ 1.800 m²/gün', boqRef: '1000640', progress: 0 },
  { id: 'W11', wbs: '11', name: 'Operasyon binası kaba yapı', group: 'Betonarme İşleri', startMonth: 12, months: 3, critical: false, dependsOn: '3', assumption: '1.850 m³ betonarme imalat', boqRef: '1000548', progress: 0 },
  { id: 'W12', wbs: '12', name: 'Bina ince işleri', group: 'İnce İşler', startMonth: 15, months: 4, critical: false, dependsOn: '11', assumption: '2.400 m² iç imalat · mahal listesi netleşmeli', boqRef: '1001110', progress: 0 },
  { id: 'W13', wbs: '13', name: 'Cephe ve çatı imalatları', group: 'Cephe & Çatı İşleri', startMonth: 15, months: 3, critical: false, dependsOn: '11', assumption: '1.280 m² panel + 1.450 m² membran', boqRef: '1001210', progress: 0 },
  { id: 'W14', wbs: '14', name: 'Altyapı ve mekanik hatlar', group: 'Mekanik İşleri', startMonth: 11, months: 6, critical: false, dependsOn: '9', assumption: '8.450 m drenaj + 4.200 m yangın hattı', boqRef: '1000710', progress: 0 },
  { id: 'W15', wbs: '15', name: 'Rıhtım donanımı montajı', group: 'Mekanik İşleri', startMonth: 17, months: 4, critical: true, dependsOn: '6', assumption: '36 baba + 28 usturmaça + 1.540 m vinç rayı', boqRef: '1000910', progress: 0 },
  { id: 'W16', wbs: '16', name: 'Elektrik işleri (OG, aydınlatma, RTG)', group: 'Elektrik İşleri', startMonth: 14, months: 6, critical: false, dependsOn: '9', assumption: '6.800 m OG kablolama + 42 aydınlatma direği', boqRef: '1000810', progress: 0 },
  { id: 'W17', wbs: '17', name: 'IT ve güvenlik sistemleri', group: 'IT', startMonth: 18, months: 4, critical: false, dependsOn: '16', assumption: '5.600 m fiber omurga + CCTV · kapsam netleşmeli', boqRef: '1001035', progress: 0 },
  { id: 'W18', wbs: '18', name: 'Peyzaj ve çevre düzenlemesi', group: 'Peyzaj', startMonth: 19, months: 3, critical: false, dependsOn: '10', assumption: '2.100 m çevre duvarı + 6.800 m² peyzaj', boqRef: '1001010', progress: 0 },
  { id: 'W19', wbs: '19', name: 'Test, devreye alma ve geçici kabul', group: 'Test ve Devreye Alma', startMonth: 21, months: 3, critical: true, dependsOn: '15', assumption: 'Yükleme deneyleri + sistem testleri + işletme eğitimi', boqRef: '1001420', progress: 0 },
]

/** Sözleşmeden gelen ve programda sabit duran tarihler. */
export const scheduleMilestones: ScheduleMilestone[] = [
  { id: 'M1', label: 'İşe başlama (yer teslimi)', month: 0, source: 'Sözleşme md. 8.1', kind: 'Sözleşme' },
  { id: 'M2', label: 'İş programının İdare’ye sunumu', month: 0.5, source: 'İdari Ş. 21.1 (14 gün) / Sözleşme 8.3 (28 gün) — çelişki', kind: 'Sözleşme' },
  { id: 'M3', label: 'Taramanın tamamlanması (döküm izni şartı)', month: 6, source: 'Teknik Şartname 4.2', kind: 'İdare' },
  { id: 'M4', label: 'Rıhtım tabliyesinin tamamlanması', month: 15, source: 'Özel Şartlar 8.2 — ara teslim', kind: 'Sözleşme' },
  { id: 'M5', label: 'Saha kaplamalarının bitişi', month: 19, source: 'İç hedef — kaplama ekibinin çıkışı', kind: 'İç hedef' },
  { id: 'M6', label: 'Geçici kabul', month: 24, source: 'Sözleşme md. 10.1 · 720 takvim günü', kind: 'Sözleşme' },
]
