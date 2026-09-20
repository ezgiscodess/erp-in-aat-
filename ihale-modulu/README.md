# İhale & Kontrat Modülü — Görsel Prototip

İnşaat ERP'sinin ilk modülü: ihale döneminde dokümanların analizi, karar desteği ve sözleşme hazırlığı.
Bu klasör **yalnızca arayüz prototipidir**: veri tabanı, giriş ekranı ve gerçek AI çağrısı yoktur;
tüm veriler `src/data/mock.ts` içinde kurgu örneklerdir.

## Çalıştırma

```bash
npm install
npm run dev     # http://localhost:5175
```

Diğer komutlar: `npm run build` (derleme), `npm run preview` (derlenmiş sürümü çalıştır).

## Ekranlar (11 sekme)

| # | Sekme | Ne gösteriyor |
|---|---|---|
| 1 | İhale Dokümanı Analiz | Yüklenen dosyalar, analiz durumu ve sağda doküman önizlemesi |
| 2 | İhale Bilgi Paneli | Künye (düzenlenebilir), **kapsam bilgisi**, takvim, teminat/ödeme özeti |
| 3 | Go / No-Go Analiz | Ağırlıklı kriter puanlaması, skor, şartlı GO koşulları |
| 4 | Kritik İhale Şartları | Bağlayıcı şartlar, çoklu seçim, kaynak önizlemesi, **AI soru-cevap** |
| 5 | Metraj (BoQ / Take-off) *(ek paket)* | Poz listesi ve metrajlar, metraj kaynağı, havuz fiyatı eşleşmesi |
| 6 | **Birim Fiyat Havuzu** | Firmanın kendi poz + birim fiyat havuzu; BCBS Excel içe aktarma |
| 7 | Teklif Riskleri | 5×5 risk matrisi, bedel/süre etkisi, dayanak önizlemesi |
| 8 | Kontrat Analiz | Madde madde analiz, çelişkiler, süre sınırları; madde metni önizlemede |
| 9 | Kontrat Hazırlama *(ek paket)* | Sözleşme taslağı, **elle düzeltme + düzeltme logu** |
| 10 | Sertifikalar *(ek paket)* | İstenen belgeler, firmadaki durum, geçerlilik ve eksikler |
| 11 | Özet & Karar | Diğer sekmelerin tek sayfalık özeti, yapılacaklar, karar notu |

### Metraj ile birim fiyatın ayrılması

İhale dokümanlarında genellikle birim fiyat bulunmaz: idare poz numarası, iş kalemi, birim ve miktarı verir;
fiyatı teklif ekibi koyar. Bu yüzden **Metraj** sekmesi fiyat tutmaz, **Birim Fiyat Havuzu** tutar.
Havuz projeye değil firmaya aittir; metraj kalemleri poz numarası ile havuzdan fiyatlanır
(birebir eşleşme, benzer poz önerisi veya "havuzda yok").

## Düzen

- **Sol yan panel:** proje seçici, dönem, rol, ek paket anahtarı ve sekmeler.
- **Sabit üst bar:** proje künyesi ve kalan süre; sayfa kaydırılınca yerinde kalır.
- **Başlıklardaki “?”:** üzerine gelince veya tıklayınca o ekranın/kutunun açıklamasını gösterir.
- **Sağdaki önizleme panelleri:** seçilen kaydın kaynağı (doküman sayfası, çizim, sözleşme maddesi) burada açılır;
  kontrat hazırlamada metin elle düzeltilebilir ve değişiklik “Manuel düzeltme” olarak loga düşer.

## Anahtarlar

- **Proje seçici:** Her proje ayrı veri alanıdır; projeler birbirinin verisini görmez.
- **İhale Dönemi / Proje Dönemi:** Rol listesini değiştirir.
- **Rol:** C-Suite, PMO, Teklif (ihale dönemi) · Proje Müdürü, Kısım Şefleri, Teknik Kullanıcı (proje dönemi).
  Yetki matrisi `src/lib/roles.ts` içindedir: şu an Teklif ve Teknik Kullanıcı **R-W**, diğerleri **R**.
  Salt okunur rollerde düzenleme butonları kapanır ve uyarı şeridi çıkar.
- **Ek paket:** Metraj, Kontrat Hazırlama ve Sertifikalar ek pakettedir. Kapatıldığında bu sekmeler kilit ekranı gösterir.

## Dosya düzeni

```
src/
  App.tsx            # üst bar, sekmeler, rol/dönem/ek paket anahtarları
  screens/           # 10 ekran, her biri tek dosya
  components/ui.tsx  # ortak bileşenler (kart, tablo, rozet, KPI, kanıt kartı…)
  data/types.ts      # veri tipleri — ileride API sözleşmesinin taslağı
  data/mock.ts       # örnek ihale verisi (kurgu)
  lib/roles.ts       # roller ve yetki matrisi
  lib/format.ts      # para, sayı, tarih biçimlendirme
  index.css          # tasarım tokenları (renk, çizgi, tipografi)
```

## Tasarım dili

Referans alınan ERP projesiyle aynı: beyaz yüzeyler, ince gri çizgiler, 13 px yoğun tablolar,
mavi vurgu (`--accent`), durum renkleri (yeşil/turuncu/kırmızı) ve sarı "ek paket" vurgusu.
Renkler `index.css` içindeki CSS değişkenlerinden gelir; tek yerden değiştirilir.

## Sonraki adımlar (prototipten ürüne)

1. Ekranlar üzerinde gereksinimlerin netleşmesi — hangi alan kim tarafından, ne zaman girilecek.
2. `data/types.ts` üzerinden API sözleşmesinin çıkarılması.
3. Proje bazlı veri yalıtımı ve rol yetkilerinin sunucu tarafında zorlanması.
4. Doküman yükleme, metin çıkarma ve kanıtlı AI analizinin gerçek servise bağlanması.
5. Paylaşılacak BCBS kırılımı ve diğer Excel çalışmalarının birim fiyat havuzuna aktarılması.
