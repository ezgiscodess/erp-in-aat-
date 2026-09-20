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
  { key: 'bilgi_paneli', label: 'İhale Bilgi Paneli', note: 'İhalenin künyesi: işveren, süre, teminat, tarihler, sayılar' },
  { key: 'go_nogo', label: 'Go / No-Go Analiz', note: 'Ağırlıklı kriterlerle teklife girme kararı' },
  { key: 'kritik_sartlar', label: 'Kritik İhale Şartları', note: 'Teklifi ve sözleşmeyi bağlayan kritik şartlar ve durumları' },
  { key: 'boq', label: "BoQ / Take Off's", addon: true, note: 'Poz listesi, metraj ve birim fiyatlar' },
  { key: 'teklif_riskleri', label: 'Teklif Riskleri', note: 'Risk matrisi, bedel ve süre etkisi, önlemler' },
  { key: 'kontrat_analiz', label: 'Kontrat Analiz', note: 'Madde bazlı analiz, çelişkiler ve süre sınırları' },
  { key: 'kontrat_hazirlama', label: 'Kontrat Hazırlama', addon: true, note: 'Şablondan sözleşme taslağı üretimi' },
  { key: 'sertifikalar', label: 'Sertifikalar', addon: true, note: 'İstenen belgeler, firmadaki durum ve geçerlilikler' },
  { key: 'ozet', label: 'Özet & Karar', note: 'Tüm sekmelerin tek sayfada toplandığı karar ekranı' },
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

export function roleLabel(key: RoleKey): string {
  return roles.find((r) => r.key === key)?.label ?? key
}
