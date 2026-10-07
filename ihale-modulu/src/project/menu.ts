/**
 * Modül 2 menü ağacı — kullanıcının kurgu tablosuyla birebir.
 * Home her kullanıcıda ilk ekrandır; Admin Konsolu yalnızca yetkili yöneticilere açılır.
 * `ready` olmayan ekranlar kurgusu yazılı bir "hazırlanıyor" sayfası gösterir.
 */

export interface MenuItem { key: string; label: string; ready?: boolean; note?: string }
export interface MenuGroup { key: string; label: string; items: MenuItem[]; note?: string; ready?: boolean }

export const menu: MenuGroup[] = [
  {
    key: 'admin', label: 'Admin Konsolu',
    note: 'Üst yöneticinin projeye ait her veriyi ve tutarı kısıtlamasız, en özet ve en görsel hâliyle gördüğü konsol. Detaylar ilgili alt modüllerdedir.',
    items: [
      { key: 'a_finance', label: 'Finance', ready: true },
      { key: 'a_accounting', label: 'Accounting', ready: true },
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
      { key: 'daily_manpower', label: 'Daily Manpower', ready: true, note: 'Saha veri mühendisinin günlük personel girişi.' },
      { key: 'daily_equipment', label: 'Daily Equipment', ready: true, note: 'Saha veri mühendisinin günlük makine-ekipman girişi.' },
      { key: 'site_photos', label: 'Site Photos', ready: true, note: 'Mobilden eklenen saha fotoğrafları; aktiviteye ve tarihe bağlı.' },
    ],
  },
  {
    key: 'budget_group', label: 'Budget',
    note: 'Maliyet, verimlilik ve imalat / malzeme oranları. Fiyat içeren analizler planlama ve raporlama yerine burada durur.',
    items: [{ key: 'budget_detail', label: 'Budget', ready: true }],
  },
  {
    key: 'contracts', label: 'Contracts',
    note: 'İşverenle ana kontrat ve alt yüklenici kontratları; aynı kalemde fark varsa otomatik uyarı.',
    items: [
      { key: 'contracts_dashboard', label: 'Dashboard', ready: true, note: 'Ana ve alt yüklenici kontratlarının özeti, taşere oranı, uyuşmayan kalemler.' },
      { key: 'main_contract', label: 'Main Contract', ready: true, note: 'İşverenle sözleşme künyesi, hakedişler, değişiklik emirleri, bildirim süreleri.' },
      { key: 'sub_contracts', label: 'Sub-Contracts', ready: true, note: 'Alt yüklenici sözleşmeleri ve ana kontratla karşılaştırma.' },
    ],
  },
  {
    key: 'planning', label: 'Planning',
    items: [
      { key: 'work_schedule', ready: true, label: 'Work Schedule', note: 'İşverenle anlaşılan program ve firmanın kendi (resource’lu) ikinci programı; ikisi paralel, aynı panel ve grafik yapısıyla.' },
      { key: 'micro', ready: true, label: 'Micro Schedules', note: 'Taşerona verilen büyük kalemler veya bölgeler için detaylı programlar; aç/düzenle/sil pop-up, her işlem kayıtlı, “karşılaştır” ile diğer programlarla uyum kontrolü.' },
      { key: 'lookahead', ready: true, label: 'Lookahead Sch.', note: 'İşverenin istediği 2–4 haftalık ileriye bakış programları; düzenlenebilir ve belirli kesitlerde yeniden alınabilir.' },
      { key: 'critical_path', ready: true, label: 'Critical Path', note: 'Projenin en önemli hattı; takip ve öneri tablolarıyla güçlendirilmiş bilgi sayfası.' },
      { key: 'mitigation', ready: true, label: 'Mitigation Plan', note: 'Kritik yol riske girdiğinde programda öneri ve çözümler üreten kısım.' },
      { key: 'pl_risks', ready: true, label: 'Risks', note: 'Mevcut verimle gidilirse bitişin nereye kayacağını projekte eden planlama riskleri.' },
    ],
  },
  {
    key: 'reports', label: 'Reports',
    note: 'En özenli ve en görsel kısım. Finansal tutar içermez; belirlenen periyotlarda mail listesine otomatik gönderilir.',
    items: [
      { key: 'r_daily', ready: true, label: 'Daily Reports' },
      { key: 'r_weekly', ready: true, label: 'Weekly Reports' },
      { key: 'r_monthly', ready: true, label: 'Monthly Reports' },
      { key: 'r_employer', ready: true, label: 'Employer Reports' },
      { key: 'r_hq', ready: true, label: 'HQ Reports' },
      { key: 'r_presentations', ready: true, label: 'Presentations' },
    ],
  },
  {
    key: 'procurement', label: 'Procurement',
    note: 'Satın alma siparişleri, durumları, kontratlarla karşılaştırma ve takip.',
    items: [
      { key: 'sas', ready: true, label: 'SAS', note: 'Malzeme, satın alma ve hizmet talepleri; sipariş detayı, tekrarla, iptal (işleme alınmadıysa), stokta var mı bilgisi.' },
      { key: 'stock', ready: true, label: 'Stock', note: 'Sahada, depoda, yolda stok; denetim ve stok değeri.' },
    ],
  },
  { key: 'finance', label: 'Finance', items: [{ key: 'fin_dashboard', label: 'Dashboard', ready: true, note: 'Finansal sağlık: alacak-borç, kârlılık, nakit yakımı, işletme sermayesi.' }] },
  { key: 'accounting', label: 'Accounting', items: [{ key: 'acc_dashboard', label: 'Dashboard', ready: true, note: 'Faturalar, borç-alacak, gelir-gider takvimi.' }] },
  {
    key: 'risk', label: 'Risk',
    note: 'Saha ve yönetim riskleri tek Dashboard’da; kontrat riskleri ihaleden aktarılır ya da kontrattan analiz edilir.',
    items: [
      { key: 'risk_dashboard', label: 'Dashboard', ready: true, note: 'Olasılık × etki matrisi, risk etki haritası (maliyet, inxsa, program), şiddet × sıklık ve tiplere göre ayrım.' },
      { key: 'contract_risks', label: 'Contract Risks', ready: true, note: 'Proje ihaleden geldiyse ihale aşamasındaki Kontrat Analiz’den, doğrudan başladıysa kontrattan analiz edilen riskler.' },
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
  { key: 'communication', label: 'Communication', items: [], ready: true, note: 'Uygulama içi sohbet, görev atama ve akıllı not defteri: kişiye özel notlar, başkasına görev ve soru, birebir ve grup sohbeti.' },
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
