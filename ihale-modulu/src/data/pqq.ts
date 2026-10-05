/**
 * PQQ (Pre-Qualification Questionnaire / ön yeterlilik) belgeleri.
 * Firmaya aittir: bir kez hazırlanan bilgi bütün ihalelerde kullanılır; her ihale yalnızca istenenleri çeker.
 * Görsel prototip verisi.
 */
export type PqqSection = 'firma' | 'mali' | 'deneyim' | 'personel' | 'isg' | 'sertifikalar'

export interface PqqRow {
  id: string
  section: PqqSection
  item: string
  value: string
  /** Belgenin dayanağı / sürümü */
  ref: string
  state: 'Hazır' | 'Güncellenmeli' | 'Eksik'
  updatedAt: string
}

export const pqqSections: { key: PqqSection; label: string; note: string }[] = [
  { key: 'sertifikalar', label: 'Sertifikalar', note: 'İstenen belgeler, firmadaki durum ve geçerlilikler' },
  { key: 'firma', label: 'Firma Bilgileri', note: 'Ticari unvan, sicil, ortaklık yapısı ve iletişim' },
  { key: 'mali', label: 'Mali Yeterlilik', note: 'Ciro, bilanço oranları, banka referansları ve sigortalar' },
  { key: 'deneyim', label: 'İş Deneyimi', note: 'Benzer iş bitirmeler ve referans projeler' },
  { key: 'personel', label: 'Kilit Personel', note: 'Önerilen kilit kadro ve özgeçmişler' },
  { key: 'isg', label: 'İSG & Çevre', note: 'İş güvenliği istatistikleri, politikalar ve çevre yönetimi' },
]

export const pqqRows: PqqRow[] = [
  { id: 'F1', section: 'firma', item: 'Ticari unvan ve sicil', value: 'ICCM Construction LTD · Sicil 482113', ref: 'Ticaret sicil gazetesi 2025', state: 'Hazır', updatedAt: '2026-03-14' },
  { id: 'F2', section: 'firma', item: 'Ortaklık yapısı', value: '%100 yerli sermaye · 3 ortak', ref: 'Pay defteri', state: 'Hazır', updatedAt: '2026-03-14' },
  { id: 'F3', section: 'firma', item: 'İmza sirküleri', value: 'Genel müdür + mali işler direktörü', ref: 'Noter 2024/18812', state: 'Güncellenmeli', updatedAt: '2024-11-02' },
  { id: 'F4', section: 'firma', item: 'Kuruluş yılı ve faaliyet alanı', value: '1998 · liman, altyapı, endüstriyel tesis', ref: 'Firma profili', state: 'Hazır', updatedAt: '2026-01-08' },
  { id: 'M1', section: 'mali', item: 'Son 3 yıl ortalama ciro', value: '214 M EUR', ref: 'Bağımsız denetim 2023–2025', state: 'Hazır', updatedAt: '2026-04-30' },
  { id: 'M2', section: 'mali', item: 'Cari oran / özkaynak oranı', value: '1,42 / 0,31', ref: 'Bilanço 2025', state: 'Hazır', updatedAt: '2026-04-30' },
  { id: 'M3', section: 'mali', item: 'Banka referans mektubu', value: '2 banka · kullanılabilir limit 46 M EUR', ref: 'Banka yazıları', state: 'Güncellenmeli', updatedAt: '2026-02-11' },
  { id: 'M4', section: 'mali', item: 'Mesleki sorumluluk sigortası', value: '10 M EUR teminat', ref: 'Poliçe 2026', state: 'Hazır', updatedAt: '2026-01-20' },
  { id: 'D1', section: 'deneyim', item: 'İskenderun Limanı rıhtım uzatma', value: '64 M EUR · 2022 · kazıklı rıhtım', ref: 'İş bitirme belgesi', state: 'Hazır', updatedAt: '2025-12-04' },
  { id: 'D2', section: 'deneyim', item: 'Aliağa konteyner sahası', value: '38 M EUR · 2021 · saha kaplama + altyapı', ref: 'İş bitirme belgesi', state: 'Hazır', updatedAt: '2025-12-04' },
  { id: 'D3', section: 'deneyim', item: 'Filyos limanı dalgakıran (ortak girişim %40)', value: '112 M EUR · 2024', ref: 'İş durum belgesi', state: 'Güncellenmeli', updatedAt: '2025-06-18' },
  { id: 'D4', section: 'deneyim', item: 'Tarama (dredging) referansı', value: '—', ref: 'Alt yükleniciden', state: 'Eksik', updatedAt: '2026-09-01' },
  { id: 'P1', section: 'personel', item: 'Proje müdürü', value: 'İnş. Müh. · 22 yıl · 3 liman projesi', ref: 'Özgeçmiş', state: 'Hazır', updatedAt: '2026-05-02' },
  { id: 'P2', section: 'personel', item: 'Deniz yapıları şefi', value: 'İnş. Müh. · 15 yıl', ref: 'Özgeçmiş', state: 'Hazır', updatedAt: '2026-05-02' },
  { id: 'P3', section: 'personel', item: 'Kalite kontrol müdürü', value: 'Atanmadı', ref: '—', state: 'Eksik', updatedAt: '2026-09-01' },
  { id: 'P4', section: 'personel', item: 'İSG uzmanı (A sınıfı)', value: 'Müh. · 11 yıl', ref: 'Sertifika + özgeçmiş', state: 'Hazır', updatedAt: '2026-03-22' },
  { id: 'I1', section: 'isg', item: 'Kaza sıklık oranı (LTIFR) — son 3 yıl', value: '0,82 / 0,74 / 0,61', ref: 'İSG istatistikleri', state: 'Hazır', updatedAt: '2026-02-01' },
  { id: 'I2', section: 'isg', item: 'İSG politikası ve el kitabı', value: 'Rev. 7', ref: 'Kalite el kitabı', state: 'Hazır', updatedAt: '2025-10-15' },
  { id: 'I3', section: 'isg', item: 'Çevre yönetim planı (deniz işleri)', value: 'Taslak', ref: '—', state: 'Güncellenmeli', updatedAt: '2025-07-09' },
]
