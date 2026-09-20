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

## Ekranlar (10 sekme)

| # | Sekme | Ne gösteriyor |
|---|---|---|
| 1 | İhale Dokümanı Analiz | Yüklenen dosyalar, AI bulguları, her bulgunun doküman + sayfa + alıntı kanıtı |
| 2 | İhale Bilgi Paneli | İhalenin künyesi, kritik sayılar, takvim, dosya hazırlık durumu |
| 3 | Go / No-Go Analiz | Ağırlıklı kriter puanlaması, skor, şartlı GO koşulları |
| 4 | Kritik İhale Şartları | Bağlayıcı şartlar, sorumlu, durum, teklife etkisi |
| 5 | BoQ / Take Off's *(ek paket)* | Poz listesi, metraj kaynağı (çizim), AI ölçüm güveni |
| 6 | Teklif Riskleri | 5×5 risk matrisi, bedel/süre etkisi, teklife eklenen karşılıklar |
| 7 | Kontrat Analiz | Madde madde analiz, çelişkiler, süre sınırları (time-bar) |
| 8 | Kontrat Hazırlama *(ek paket)* | Şablon + ihale verisinden sözleşme taslağı ve değişkenler |
| 9 | Sertifikalar *(ek paket)* | İstenen belgeler, firmadaki durum, geçerlilik ve eksikler |
| 10 | Özet & Karar | Dokuz sekmenin tek sayfalık özeti, yapılacaklar, karar notu |

## Üst bardaki anahtarlar

- **Proje seçici:** Her proje ayrı veri alanıdır; projeler birbirinin verisini görmez.
- **İhale Dönemi / Proje Dönemi:** Rol listesini değiştirir.
- **Rol:** C-Suite, PMO, Teklif (ihale dönemi) · Proje Müdürü, Kısım Şefleri, Teknik Kullanıcı (proje dönemi).
  Yetki matrisi `src/lib/roles.ts` içindedir: şu an Teklif ve Teknik Kullanıcı **R-W**, diğerleri **R**.
  Salt okunur rollerde düzenleme butonları kapanır ve uyarı şeridi çıkar.
- **Ek paket:** BoQ, Kontrat Hazırlama ve Sertifikalar ek pakettedir. Kapatıldığında bu sekmeler kilit ekranı gösterir.

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
