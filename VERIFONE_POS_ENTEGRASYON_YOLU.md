# 🏦 JetPOS × Verifone ECR Entegrasyon Yol Haritası

> **Durum:** Planlama Aşaması  
> **Tarih:** 12.03.2026  
> **Uygulama Tipi:** Electron (.exe) — Masaüstü Uygulaması

---

## 📐 Mimari (Electron ile)

```
┌───────────────────────────────────────────────────────┐
│                    İşletme Bilgisayarı (.exe)         │
│                                                        │
│   ┌─────────────────┐        ┌──────────────────────┐ │
│   │  JetPOS React   │  IPC   │  Electron Main       │ │
│   │  (Renderer)     │ ──────▶│  Process (Node.js)   │ │
│   │                 │        │                      │ │
│   │  [KART Butonu]  │        │  net.Socket (TCP)    │ │
│   └─────────────────┘        └──────────┬───────────┘ │
│                                         │ TCP/IP       │
└─────────────────────────────────────────┼─────────────┘
                                          ▼
                              ┌───────────────────────┐
                              │   Verifone POS Cihazı │
                              │   (TCP Port: ???)     │
                              └───────────────────────┘
```

**Electron avantajı:** Renderer (React) → IPC → Main Process → Net.Socket. Ekstra servis yok, tek .exe yeterli!

---

## 📞 1. AŞAMA: Verifone ile Görüşme

### Aranacak Yer
- **Verifone Türkiye Teknik Destek**
- Web: [verifone.com/tr](https://www.verifone.com)
- Tel: Türkiye Satış/Destek hattı

### ❓ Sorulacak Sorular (Tam Liste)

#### A) Entegrasyon Tipi
- [ ] "ECR (Electronic Cash Register) entegrasyonu yapabilir miyiz?"
- [ ] "Yazarkasa yazılımı için SDK veya doküman var mı?"
- [ ] "Entegrasyon için lisans/sertifikasyon gerekiyor mu?"

#### B) Teknik Bağlantı
- [ ] "Cihaz ile haberleşme TCP/IP üzerinden mi, COM port üzerinden mi?"
- [ ] "TCP/IP ise varsayılan port numarası nedir?"
- [ ] "Cihaz server mı, client mı? (Yani kim bağlantıyı başlatıyor?)"
- [ ] "Aynı LAN üzerinde olmak yeterli mi?"

#### C) Protokol ve Mesaj Formatı
- [ ] "Kullandığınız ECR protokolü OPI mi, başka bir standart mı?"
- [ ] "Mesajlar XML formatında mı, TLV (binary) mı, başka bir format mı?"
- [ ] "Timeout süresi nedir? (Müşteri kartı takarken bekleme süresi)"
- [ ] "İptal (void) ve iade (refund) komutları var mı?"

#### D) Test ve Simülatör
- [ ] "Gerçek cihaz olmadan test edebileceğimiz bir simülatör var mı?"
- [ ] "Test modu veya sandbox ortamı mevcut mu?"
- [ ] "Entegrasyon test sürecini kimle yürüteceğiz?"

#### E) Cihaz Modeli
- [ ] "Desteklenen modeller hangileri? (V400m, P400, Engage serisi)"
- [ ] "Her modelin ayrı protokolü var mı yoksa standart mı?"

---

## 🗓️ 2. AŞAMA: Yol Haritası

### Faz 1 — Araştırma ve Hazırlık (1-2 Hafta)
```
[ ] Verifone teknik destek ile görüşme yapılacak
[ ] ECR protokol dokümanı temin edilecek  
[ ] Test cihazı veya simülatör temin edilecek
[ ] Electron mimarisine geçiş planlanacak (eğer henüz değilse)
```

### Faz 2 — Electron IPC Altyapısı (3-5 Gün)
```
[ ] Electron main process'e TCP soket modülü eklenecek
[ ] Renderer → Main IPC kanalı açılacak (ipcMain / ipcRenderer)
[ ] POS bağlantı durumu UI'da gösterilecek (bağlı/bağlı değil)
[ ] Bağlantı ayarları (IP, Port) Settings sayfasına eklenecek
```

### Faz 3 — ECR Protokol Implementasyonu (1 Hafta)
```
[ ] Satış komutu (SALE) yazılacak
[ ] İptal komutu (VOID/CANCEL) yazılacak  
[ ] İade komutu (REFUND) yazılacak
[ ] Gün sonu (END OF DAY) komutu yazılacak
[ ] Hata yönetimi ve timeout senaryoları
```

### Faz 4 — POS.tsx Entegrasyonu (3-5 Gün)
```
[ ] KART butonuna POS akışı bağlanacak
[ ] "POS İşlemi Bekleniyor..." loading ekranı eklenecek
[ ] Onay/ret sonucuna göre işlem akışı
[ ] Slip/dekont bilgilerinin fişe işlenmesi
[ ] Hata durumunda kullanıcıya bildirim
```

### Faz 5 — Test ve Canlıya Alış (1 Hafta)
```
[ ] Simülatör ile birim testler
[ ] Gerçek cihaz ile entegrasyon testleri
[ ] Stres testi (10+ ardışık işlem)
[ ] Müşteri kabul testleri
[ ] Canlıya alış
```

---

## 🔌 3. Teknik Plan (Protokol Geldikten Sonra)

### Electron Main Process — POS Modülü
```typescript
// main/pos-service.ts (Electron Main)
import net from 'net';

class VerifoneService {
  private socket: net.Socket | null = null;
  private host: string;
  private port: number;

  constructor(host: string, port: number) {
    this.host = host; // örn: "192.168.1.100"
    this.port = port; // örn: 4242
  }

  // Bağlantı kur
  connect(): Promise<void> { ... }

  // Satış gönder
  sale(amount: number, currency = 'TRY'): Promise<SaleResult> { ... }

  // İptal
  cancel(transactionId: string): Promise<void> { ... }

  // Bağlantıyı kapat
  disconnect(): void { ... }
}
```

### IPC Kanalları
```typescript
// main → renderer iletişimi
ipcMain.handle('pos:sale', async (_, amount) => {
  return await verifoneService.sale(amount);
});

ipcMain.handle('pos:cancel', async (_, txId) => {
  return await verifoneService.cancel(txId);
});

ipcMain.handle('pos:status', async () => {
  return verifoneService.isConnected();
});
```

### POS.tsx — KART Butonu Değişikliği
```typescript
// Şu an:
onClick={() => handleCheckout("KART")}

// Olacak:
onClick={() => handleCardPayment(total)}

const handleCardPayment = async (amount: number) => {
  setPosStatus('waiting'); // "POS Bekleniyor..." ekranı
  try {
    const result = await window.electronAPI.posSale(amount);
    if (result.approved) {
      handleCheckout("KART", result.authCode);
    } else {
      showToast(`POS Reddetti: ${result.responseText}`, "error");
    }
  } catch (err) {
    showToast("POS bağlantı hatası!", "error");
  } finally {
    setPosStatus('idle');
  }
};
```

---

## ⚠️ 4. Bilinmesi Gerekenler

| Konu | Açıklama |
|------|----------|
| **Sertifikasyon** | Bazı bankalar ECR entegrasyonu için sertifikasyon istiyor — Verifone'a sor |
| **Timeout** | Müşteri kartı takarken ~90-120 saniye beklenmeli, UI bloklanmamalı |
| **Bağlantı Kopması** | Ortada bağlantı koparsa ne olacak? Transaction rollback planı gerekli |
| **Çoklu Kasa** | Birden fazla kasa olursa her kasa kendi POS'una bağlanır |
| **Gün Sonu** | Verifone'da gün sonu kapama işlemi var, bunu da entegre etmek şart |
| **Electron** | Mevcut proje Next.js, Electron'a geçiş gerekiyor veya Electron shell oluşturmak lazım |

---

## 📌 Acil Aksiyon Listesi

- [ ] **BUGÜN:** Verifone Türkiye'yi ara, yukarıdaki soruları sor
- [ ] **BUGÜN:** Kullandıkları Verifone modelini öğren (işletmeden)
- [ ] **BU HAFTA:** ECR dokümanını temin et
- [ ] **BU HAFTA:** Electron mimarisini planla
- [ ] **SONRA:** Protokol gelince kodlamaya başla

---

*Bu doküman güncellenecektir. Sorular yanıtlandıkça teknik detaylar eklenecek.*
