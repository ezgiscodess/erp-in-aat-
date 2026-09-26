/**
 * Modül 2 menü ağacı — kullanıcının kurgu tablosuyla birebir.
 * Home her kullanıcıda ilk ekrandır; Admin Konsolu yalnızca yetkili yöneticilere açılır.
 * `ready` olmayan ekranlar kurgusu yazılı bir "hazırlanıyor" sayfası gösterir.
 */

export interface MenuItem { key: string; label: string; ready?: boolean; note?: string }
export interface MenuGroup { key: string; label: string; items: MenuItem[]; note?: string }

export const menu: MenuGroup[] = [
  {
    key: 'admin', label: 'Admin Konsolu',
    note: 'Üst yöneticinin projeye ait her veriyi ve tutarı kısıtlamasız, en özet ve en görsel hâliyle gördüğü konsol. Detaylar ilgili alt modüllerdedir.',
    items: [
      { key: 'budget', label: 'Budget', ready: true },
      { key: 'ipc', label: 'IPC', ready: true },
      { key: 'contract', label: 'Contract', ready: true },
      { key: 'a_planning', label: 'Planning', ready: true },
      { key: 'a_report', label: 'Report', ready: true },
      { key: 'phrs', label: 'Phrs (manhour)', ready: true },
      { key: 'personel', label: 'Personel', ready: true },
      { key: 'machinery', label: 'Machinery-Equipment', ready: true },
      { key: 'a_disruptions', label: 'Disruptions', ready: true },
      { key: 'change_order', label: 'Change Order', ready: true },
      { key: 'claim', label: 'Claim', ready: true },
    ],
  },
  {
    key: 'progress', label: 'Progress',
    items: [
      { key: 'p_dashboard', label: 'Dashboard', ready: true, note: 'Genel ilerlemeler ve KPI’lar; proje verileriyle oluşan karşılama ekranı.' },
      { key: 'site_activity', label: 'Site Activity', ready: true, note: 'Tanımlı kullanıcıların girdiği saha verisi iş akışı olarak, seçilen periyotta. Her kayıt 3’lü onaya tabidir (veri mühendisi → kısım şefi → şantiye şefi); şantiye şefi onayı olmadan işleme girmez. Kolonları proje özelinde aktif/pasif olan ortak veritabanı formatı.' },
      { key: 'p_disruptions', label: 'Disruptions', ready: true, note: 'Sahada oluşan aksaklıkların detaylı takibi.' },
      { key: 'site_photos', label: 'Site Photos', ready: true, note: 'Mobilden eklenen saha fotoğrafları; aktiviteye ve tarihe bağlı.' },
    ],
  },
  {
    key: 'planning', label: 'Planning',
    items: [
      { key: 'work_schedule', label: 'Work Schedule', note: 'İşverenle anlaşılan program ve firmanın kendi (resource’lu) ikinci programı; ikisi paralel, aynı panel ve grafik yapısıyla.' },
      { key: 'micro', label: 'Micro Schedules', note: 'Taşerona verilen büyük kalemler veya bölgeler için detaylı programlar; aç/düzenle/sil pop-up, her işlem kayıtlı, “karşılaştır” ile diğer programlarla uyum kontrolü.' },
      { key: 'lookahead', label: 'Lookahead Sch.', note: 'İşverenin istediği 2–4 haftalık ileriye bakış programları; düzenlenebilir ve belirli kesitlerde yeniden alınabilir.' },
      { key: 'critical_path', label: 'Critical Path', note: 'Projenin en önemli hattı; takip ve öneri tablolarıyla güçlendirilmiş bilgi sayfası.' },
      { key: 'mitigation', label: 'Mitigation Plan', note: 'Kritik yol riske girdiğinde programda öneri ve çözümler üreten kısım.' },
      { key: 'pl_risks', label: 'Risks', note: 'Mevcut verimle gidilirse bitişin nereye kayacağını projekte eden planlama riskleri.' },
    ],
  },
  {
    key: 'reports', label: 'Reports',
    note: 'En özenli ve en görsel kısım. Finansal tutar içermez; belirlenen periyotlarda mail listesine otomatik gönderilir.',
    items: [
      { key: 'r_daily', label: 'Daily Reports' },
      { key: 'r_weekly', label: 'Weekly Reports' },
      { key: 'r_monthly', label: 'Monthly Reports' },
      { key: 'r_employer', label: 'Employer Reports' },
      { key: 'r_hq', label: 'HQ Reports' },
      { key: 'r_presentations', label: 'Presentations' },
    ],
  },
  {
    key: 'procurement', label: 'Procurement',
    note: 'Satın alma siparişleri, durumları, kontratlarla karşılaştırma ve takip.',
    items: [
      { key: 'sas', label: 'SAS', note: 'Malzeme, satın alma ve hizmet talepleri; sipariş detayı, tekrarla, iptal (işleme alınmadıysa), stokta var mı bilgisi.' },
      { key: 'stock', label: 'Stock', note: 'Sahada, depoda, yolda stok; denetim ve stok değeri.' },
    ],
  },
  { key: 'finance', label: 'Finance', items: [{ key: 'fin_dashboard', label: 'Dashboard', note: 'Kurgusu üzerinde çalışılıyor.' }] },
  { key: 'accounting', label: 'Accounting', items: [{ key: 'acc_dashboard', label: 'Dashboard', note: 'Kurgusu üzerinde çalışılıyor.' }] },
  {
    key: 'risk', label: 'Risk',
    note: 'Modül 1 mantığında; kullanıcılar veri girdikçe ve iş ilerledikçe analiz oluşur.',
    items: [
      { key: 'management_risks', label: 'Management Risks' },
      { key: 'site_risks', label: 'Site Risks' },
      { key: 'contract_risks', label: 'Contract Risks' },
    ],
  },
  {
    key: 'disruptions', label: 'Disruptions',
    note: 'Verimsizliklerin sebep – etki – çözüm mantığıyla detaylı takibi.',
    items: [
      { key: 'site_activity_based', label: 'Site Activity Based' },
      { key: 'material_losses', label: 'Material Losses' },
      { key: 'actions', label: 'Actions' },
    ],
  },
  { key: 'sustainability', label: 'Sustainability', items: [], note: 'Kurgusu üzerinde çalışılıyor.' },
  { key: 'quality', label: 'Quality', items: [], note: 'Kurgusu üzerinde çalışılıyor.' },
  { key: 'communication', label: 'Communication', items: [], note: 'Uygulama içi sohbet, görev atama ve akıllı not defteri: kişiye özel notlar, başkasına görev ve soru, birebir ve grup sohbeti.' },
]

/** Giriş tipine göre görünen menü: Admin Konsolu yalnızca patrona açıktır. */
export function menuFor(persona: 'ihale' | 'patron' | 'proje'): MenuGroup[] {
  return persona === 'patron' ? menu : menu.filter((g) => g.key !== 'admin')
}

export function findItem(key: string): { group?: MenuGroup; item?: MenuItem } {
  for (const g of menu) {
    if (g.key === key) return { group: g }
    const item = g.items.find((i) => i.key === key)
    if (item) return { group: g, item }
  }
  return {}
}
