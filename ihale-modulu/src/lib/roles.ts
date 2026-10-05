import type { Access, Role, RoleKey, TabDef, TabKey } from '../data/types'

/**
 * Roller ve yetki matrisi — gereksinim tablosundaki kurguyla birebir:
 * İhale dönemi (C-Suite, PMO, Teklif) ve Proje dönemi (Proje Müdürü, Kısım Şefleri, Teknik Kullanıcı).
 * Şu an tüm sekmelerde Teklif ve Teknik Kullanıcı R-W, diğerleri R.
 * Matris tek yerde durur; ileride rol eklemek yalnızca bu dosyayı değiştirir.
 */
export const roles: Role[] = [
  { key: 'c_suite', label: 'C-Suite', period: 'ihale', order: 1, note: 'Üst yönetim — karar ve onay' },
  { key: 'pmo', label: 'PMO', period: 'ihale', order: 2, note: 'İhale süreci yönetimi ve takip' },
  { key: 'teklif', label: 'Teklif', period: 'ihale', order: 3, note: 'Teklif hazırlayan ekip — veri girişi' },
  { key: 'proje_muduru', label: 'Proje Müdürü', period: 'proje', order: 1, note: 'Proje yürütme sorumlusu' },
  { key: 'kisim_sefi', label: 'Kısım Şefleri', period: 'proje', order: 2, note: 'Saha kısım sorumluları' },
  { key: 'teknik', label: 'Teknik Kullanıcı', period: 'proje', order: 3, note: 'Teknik ofis — veri girişi' },
]

export const tabs: TabDef[] = [
  { key: 'dokuman_analiz', label: 'İhale Dokümanı Analiz', note: 'Yüklenen ihale dokümanlarının AI ile taranması ve kanıtlı bulgular' },
  { key: 'bilgi_paneli', label: 'İhale Bilgi Paneli', note: 'İhalenin künyesi: işveren, süre, teminat, para birimi, garanti süresi, tarihler' },
  { key: 'kritik_sartlar', label: 'Kritik İhale Şartları', note: 'Teklifi ve sözleşmeyi bağlayan kritik şartlar ve durumları' },
  { key: 'teklif_riskleri', label: 'Teklif Riskleri', note: 'Risk kayıtları, bedelin açık hesabı ve teklife eklenen karşılık' },
  { key: 'kontrat_analiz', label: 'Kontrat Analiz', note: 'Madde bazlı analiz, çelişkiler ve süre sınırları' },
  { key: 'go_nogo', label: 'Go / No-Go Analiz', note: 'Ağırlıklı kriterlerle teklife girme kararı' },
  { key: 'takeoff', label: 'Take-Offs', addon: true, note: 'Çizim ve dokümanlardan AI ile çıkarılan metrajlar; Pool’da seçilen standardın kod kırılımıyla gelir.' },
  { key: 'boq', label: 'BOQ', addon: true, note: 'Take-Offs’taki metrajların birim fiyatlarla birleştiği keşif cetveli. Fiyatlar Pool’dan eşleşir.' },
  { key: 'birim_fiyat', label: 'Pool', addon: true, note: 'Firmanın birim fiyat havuzu ve ölçüm standardı: RICS, CESMM4, Master Method, In-House veya firmanın kendi metodu (Import).' },
  { key: 'personel_ekipman', label: 'Personel & Ekipman', addon: true, note: 'İş süresince ihtiyaç duyulacak kadro ve makine parkı; aylık maliyet ve hangi aylarda sahada olacağı.' },
  { key: 'is_programi', label: 'İş Programı', addon: true, note: 'Metrajdan türetilen iş programı: imalat süreleri, aktivite ilişkileri, kritik yol ve key stage tarihleri.' },
  { key: 'sertifikalar', label: 'PQQ', addon: true, note: 'Ön yeterlilik dosyası: sertifikalar, firma bilgileri, mali yeterlilik, iş deneyimi, kilit personel, İSG' },
  { key: 'ozet', label: 'Özet & Karar', note: 'Tüm sekmelerin tek sayfada toplandığı karar ekranı' },
  { key: 'kontrat_hazirlama', label: 'Kontrat Hazırlama', addon: true, note: 'İhale kazanıldıktan sonra şablondan sözleşme taslağı üretimi' },
  { key: 'alternatif_teklif', label: 'Alternatif Teklif', addon: true, note: 'Doküman şartlarına göre hazırlanan ana teklifin yanında AI’nın önerdiği alternatif yöntem, malzeme, program ve ticari seçenekler' },
]

/** Yetki matrisi: [sekme][rol] → R | RW */
export const accessMatrix: Record<TabKey, Record<RoleKey, Access>> = Object.fromEntries(
  tabs.map((t) => [
    t.key,
    {
      c_suite: 'R',
      pmo: 'R',
      teklif: 'RW',
      proje_muduru: 'R',
      kisim_sefi: 'R',
      teknik: 'RW',
    } satisfies Record<RoleKey, Access>,
  ]),
) as Record<TabKey, Record<RoleKey, Access>>

export function accessFor(tab: TabKey, role: RoleKey): Access {
  return accessMatrix[tab][role]
}

export function canWrite(tab: TabKey, role: RoleKey): boolean {
  return accessFor(tab, role) === 'RW'
}

/**
 * Girişte seçilen kullanıcı tipi. Her tip yalnızca kendi ekranlarını görür:
 *  • İhale ekibi — ihaleler ve ihale modülü (veri girişi)
 *  • Patron — bütün ihale ve projeler, projelerde Admin Konsolu; ihale ekranlarında yalnızca görüntüleme
 *  • Proje ekibi — projeler (Home, Progress, Planning…), Admin Konsolu hariç
 * İnce yetkiler (PMO, kısım şefi, şantiye şefi…) yine arka planda tanımlanır.
 */
export type Persona = 'ihale' | 'patron' | 'proje'

export const personas: { key: Persona; label: string; note: string; role: RoleKey }[] = [
  { key: 'ihale', label: 'İhale ekibi', note: 'İhale dosyaları, analiz, teklif hazırlığı', role: 'teklif' },
  { key: 'patron', label: 'Patron / Yönetim', note: 'Bütün ihale ve projeler, Admin Konsolu', role: 'c_suite' },
  { key: 'proje', label: 'Proje ekibi', note: 'Yürüyen projeler, saha ve planlama', role: 'teknik' },
]

export function personaOf(key: Persona) {
  return personas.find((p) => p.key === key)!
}

export function roleLabel(key: RoleKey): string {
  return roles.find((r) => r.key === key)?.label ?? key
}
