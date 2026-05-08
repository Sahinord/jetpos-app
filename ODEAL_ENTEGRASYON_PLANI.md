# Ödeal & JetPos Entegrasyon Planı ve Teknik Talep Listesi

Bu döküman, JetPos Barkodlu Satış Sistemleri ile Ödeal A910S (ve diğer Android POS) cihazlarının entegrasyon sürecini yönetmek ve toplantıda sunulmak üzere hazırlanmıştır.

---

## 1. JetPos Genel Bakış
*   **Teknoloji Yığını:** Electron.js (Desktop), Next.js (Web), Supabase (Cloud DB).
*   **Kullanım Alanı:** Perakende, Hızlı Satış, Restoran ve Market otomasyonları.
*   **Hedef:** JetPos içinden tek tıkla Ödeal cihazına ödeme emri gönderilmesi ve mali fişin cihaz üzerinden otomatik yazdırılması.

---

## 2. Entegrasyon Mimarisi Beklentisi
JetPos modern bir masaüstü uygulaması olduğu için aşağıdaki bağlantı yöntemlerinden biri tercih edilecektir:
1.  **Cloud API (REST):** JetPos sunucusundan Ödeal bulutuna komut gönderimi (En çok tercih edilen).
2.  **Local WebSocket / TCP:** Yerel ağ üzerinden cihaz ile doğrudan iletişim.
3.  **Android Intent / App-to-App:** (Eğer mobil uygulama üzerinden konuşulacaksa).

---

## 3. Toplantıda Sorulacak Teknik Sorular
*   **Bağlantı Protokolü:** A910S cihazı için hangi entegrasyon yöntemini öneriyorsunuz? (Cloud API, GMP3, ECR-JSON vb.)
*   **SDK/Dökümantasyon:** Electron (Node.js) veya Web (Javascript) için hazır bir SDK veya güncel API dökümanınız mevcut mu?
*   **Mali Onay:** Cihaz GİB onaylı Yazarkasa (ÖKC) modunda mı çalışıyor? Satış komutu sonrası mali fiş otomatik basılabiliyor mu?
*   **E-Arşiv Desteği:** Cihaz içinde E-Arşiv/E-Fatura uygulaması var mı? JetPos'tan gönderilen verilerle dijital fatura kesilebiliyor mu?
*   **Departman Yönetimi:** KDV oranlarını (%1, %10, %20) API üzerinden nasıl eşleştiriyoruz?

---

## 4. Teknik Talep Listesi (Sandbox & Test)
Entegrasyonun başlaması için Ödeal teknik ekibinden şunlar talep edilmelidir:
- [ ] **API Dökümantasyonu:** Güncel entegrasyon rehberi (PDF veya Swagger).
- [ ] **Test Terminali:** Ofisimizde geliştirme yapabilmemiz için bir adet test cihazı (A910S).
- [ ] **Sandbox Hesap:** Test API Key, Merchant ID ve Terminal ID bilgileri.
- [ ] **Teknik Destek Hattı:** Entegrasyon sürecinde yazılımcıların iletişim kurabileceği bir kanal (Slack, WhatsApp veya Mail).

---

## 5. Uygulama Akış Planı (Workflow)
1.  **Satış:** JetPos'ta ürünler sepete eklenir -> "Ödeal ile Öde" seçilir.
2.  **Tetikleme:** JetPos API üzerinden Ödeal cihazına tutarı gönderir.
3.  **Ödeme:** Cihazda ödeme tamamlanır (Kart/Şifre).
4.  **Onay & Fiş:** Cihaz mali fişi basar -> JetPos'a "Başarılı" cevabı döner.
5.  **Kapanış:** JetPos'ta satış veri tabanına işlenir ve işlem tamamlanır.

---

## 6. İş Geliştirme (Business) Beklentileri
*   Komisyon oranları ve geri ödeme vadeleri.
*   Bayilik veya çözüm ortaklığı modelleri.
*   Cihaz tedarik süreçleri ve maliyetleri.

---
**Hazırlayan:** JetPos Geliştirme Ekibi
**Tarih:** 8 Mayıs 2026
