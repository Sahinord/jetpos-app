# Findings — JetPos Altyapı Analizi

## İlk gözlem
- Depo yaklaşık 11 GB; bunun 6.8 GB'ı `client`, 1.5 GB'ı `jetpos-web`, 624 MB'ı `jetpos-mobile`.
- AGENTS.md dört proje söylüyor fakat dosya taramasında ayrıca `jetpos-panel` ve `jetpos-shop` görünüyor; kapsam/envanter sapması incelenecek.
- İki migration dizini ve kökte tekil SQL yamaları mevcut; toplam migration/script yüzeyi oldukça geniş.
- Kökteki mevcut `task_plan.md`, `findings.md`, `progress.md` Ödeal entegrasyonuna ait; bu analiz ayrı `.planning/` dizininde tutuluyor.

## Proje envanteri
- Kök scriptleri fiilen `client`, `jetpos-web`, `jetpos-mobile` ve `jetpos-shop` projelerini kurup derliyor; AGENTS.md içindeki “dört proje” tablosu güncel değil çünkü `jetpos-shop` ve `jetpos-panel` da mevcut, `jetsoft-web` ise kök build zincirinde yok.
- En az altı bağımsız dağıtım yüzeyi var: ana Electron/Next uygulaması, mobil PWA, iki web sitesi/mağaza, Vite tabanlı Jetsoft sitesi ve üç role göre paketlenen Electron panel.
- Sürüm matrisi parçalı: ana/mobil Next 15.1.9 + React 19.0; web/shop Next 16.1.4 + React 19.2.3; Jetsoft Vite 8 + TypeScript 6. Bu durum bakım ve ortak kod paylaşımı maliyetini yükseltiyor.
- Kök `package.json` kendi başına Next 16.2.2 bağımlılığı taşıyor ama uygulama kodu/root Next scripti görünmüyor; gereksiz veya tarihsel bağımlılık olabilir.
- `client` hâlâ `next lint` scripti kullanıyor; Next 15/ESLint 9 kombinasyonunda bu komutun durumu doğrulanmalı.

## Ana uygulama ölçeği ve sınırlar
- `client/src` altında yaklaşık 75.996 satır TypeScript/TSX ve 46 API route var. `SuperAdmin.tsx` 3.488, ana `page.tsx` 2.505, `POS.tsx` 2.238 satır; yüksek bağlaşım ve test edilebilirlik riski taşıyan “mega component”ler oluşmuş.
- Domain klasörlemesi güçlü ve ürün kapsamı geniş: POS, cari, kasa, banka, depo, fatura, irsaliye, KDS, CRM, entegrasyonlar, admin vb.
- Tenant oturumu Supabase Auth yerine `localStorage` içindeki tenant UUID + lisans anahtarı ve custom header/RPC ile kuruluyor. Çalışır bir model olsa da XSS veya renderer compromise halinde uzun ömürlü lisans kimliği alınabilir.
- `changePassword()` tenant şifresini doğrudan okuyup düz metin karşılaştırıyor ve düz metin güncelliyor. Bu kritik bir kimlik bilgisi saklama kusuru.
- Electron API HMAC anahtarı hem `client/src/lib/api.ts` hem middleware içinde sabit (`jetpos_secure_v1_2_8_gatekeeper`). Renderer bundle'ına giren ortak sır, saldırgana imza üretme imkânı verir; güvenlik sınırı değildir.
- Middleware tenant header'larının yalnızca varlığını kontrol ediyor; gerçek doğrulamanın her route içinde yapılması gerekiyor. 46 route'un 35'inde `verifyTenantAccess` var; kalanların webhook/başka auth olup olmadığı tek tek kontrol edilmeli.
- `supabase.ts` anon key'i sabit fallback olarak içeriyor. Anon key gizli değildir fakat proje URL/key rotasyonu ve ortam ayrımı açısından yapılandırma kokusudur.
- Kaynakta hem `.ts` hem derlenmiş `.js` QNB dosyaları bulunuyor; yanlış import/stale code riski var.

## Satış/offline/Electron kritik bulguları
- Online POS satışı üç ayrı istemci çağrısıyla yazılıyor (`sales`, `sale_items`, ardından opsiyonel cari hareket); transaction/RPC yok. Kalem insert'i başarısız olursa başlık kalıyor, cari hareket başarısız olursa yalnız loglanıyor. Finansal tutarlılık için atomik değil.
- Offline senkron da aynı parçalı modeli kullanıyor. `sales` yazılıp `sale_items` hata verirse kayıt `error` durumuna geçiyor; senkron sorgusu yalnız `pending` kayıtları çektiği için otomatik olarak bir daha denenmiyor. Ayrıca UUID sayesinde başlık idempotent olsa da yarım kalmış satışın resume/upsert mantığı yok.
- `pullProducts(tenantId, warehouseId)` parametre olarak depo alıyor fakat sorguda `warehouseId` kullanılmıyor ve tüm local ürün cache'i temizleniyor; depo bazlı stokla uyuşmazlık riski var.
- İade akışında ürün stokları tek tek read-derived değerle güncelleniyor, sonra negatif satış ekleniyor; transaction yok ve eşzamanlı stok değişikliklerini ezebilir.
- Ödeal ödeme başarılı olduktan sonra satış kaydı yine client'taki `handleCheckout` ile yapılıyor. Webhook ödeme gerçeği ile satış/stok kaydı atomik değil; uygulama kapanırsa ödeme alınmış ama satış oluşmamış olabilir.
- Electron ana penceresinde `nodeIntegration:false` ve `contextIsolation:true` olumlu; fakat `webSecurity:false` ve `sandbox:false` ciddi savunma katmanlarını kapatıyor. Uzak `https://app.jetpos.shop` içeriği native IPC yetkileriyle aynı pencerede çalışıyor.
- Yazdırma komutunda `printerName` shell komutuna string interpolation ile giriyor; preload allowlist'i erişimi daraltsa da renderer ele geçirilirse komut enjeksiyonu yüzeyi doğuyor. `execFile`/arg dizisi tercih edilmeli.
- Eski `AdminPortal` istemci tarafında `NEXT_PUBLIC_ADMIN_PASSWORD` ile auth yapıp `licenses` tablosunu doğrudan yönetiyor ve ana sayfada import ediliyor. Bu şifre bundle'da görünür; RLS migration'larında `licenses FOR ALL USING(true)` geçmişi de bulunduğundan yüksek riskli legacy yüzey.

## Veritabanı evrimi
- 130 yeni + 27 eski migration ve kök SQL yamaları var; otomatik uygulanmış migration ledger/config yok. Şemanın gerçek durumu dosyalardan deterministik üretilemiyor.
- Tarihsel migration'larda `USING(true) WITH CHECK(true)`, public manage ve eksik tenant check örnekleri var; daha yeni düzeltmeler bunları kapatmaya çalışıyor. Güvenlik, migration sırasına ve manuel olarak hangilerinin çalıştırıldığına aşırı bağımlı.
- `SECURITY DEFINER` fonksiyon sayısı fazla ve farklı dönemlerde aynı RPC'lerin drop/recreate varyantları bulunuyor; `search_path`, EXECUTE grant ve tenant doğrulaması fonksiyon bazında audit edilmeli.

## API erişim kontrolü
- `/api/invoices/status/[id]` service-role ile faturayı yalnız URL'deki id üzerinden okuyor/güncelliyor, `verifyTenantAccess` çağırmıyor ve tenant eşleştirmesi yapmıyor. Middleware'de keyfi dolu tenant header'ları route'a geçebildiği için invoice UUID bilindiğinde çapraz tenant okuma/işlem tetikleme (IDOR) riski var.
- `/api/qnb/test-connection` tenant doğrulaması olmadan sunucudaki global QNB kimlik bilgileriyle login deniyor ve session id döndürüyor. HMAC anahtarı da istemcide sabit olduğu için middleware koruması yeterli kabul edilemez.
- `/api/yemeksepeti/webhook` kendi secret doğrulamasına sahip fakat middleware public allowlist'inde yok; dış sağlayıcı JetPos tenant/HMAC header'ı göndermeyeceğinden production'da webhook 401 alma olasılığı yüksek.

## Kalite ve teslim sinyalleri
- Otomatik test dosyası/runner'ı yok. Finansal akışlar, RLS ve entegrasyonlar için regresyon ağı bulunmuyor.
- `client` lint başarısız ve çıktı 2.000+ satıra ulaşıyor; TypeScript kontrolü 8 hata verdi (özellikle Supabase internal/protected API'ye erişim ve dashboard/cari tipleri).
- `jetpos-web` lint: 123 hata. `jetsoft-web` lint: 8 hata; TypeScript build de başarısız.
- `jetpos-mobile` TypeScript kontrolü geçiyor fakat lint config modül çözümleme hatasıyla hiç başlayamıyor (`eslint-config-next/core-web-vitals`).
- `jetpos-shop` lint ve TypeScript kontrolü geçiyor; incelenen projeler içinde kalite kapısı çalışan tek temiz uygulama.
- `jetpos-web` ve `jetpos-shop` TypeScript kontrolü geçti.
- Build çalıştırılmadı; client TypeScript hataları nedeniyle temiz build varsayımı yapılamaz.
- Git'te 933 takipli dosya yaklaşık 102 MB. Debug loglar ve QNB'nin derlenmiş `.js` kopyaları takipli; repo kökü ise node_modules nedeniyle 11 GB.

## Genel değerlendirme
- Ürün kapsamı ve entegrasyon çeşitliliği güçlü; ekip gerçek operasyon problemlerine hızlı çözümler üretmiş.
- Temel sorun ölçek değil, sınırların gevşekliği: domain mantığı mega componentlerde, finansal transaction client'ta, auth iki katmanda dağınık, schema state manuel ve kalite kapıları kırık.
- Öncelik sırası: (1) acil güvenlik kapatma, (2) atomik satış/offline outbox, (3) deterministik migration/RLS audit, (4) çalışan CI kalite kapıları, (5) modülerleştirme ve sürüm konsolidasyonu.
