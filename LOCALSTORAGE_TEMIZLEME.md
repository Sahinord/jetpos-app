# 🔧 JetPos - LocalStorage Temizleme

## SORUN:
Uygulamayı açtığında otomatik giriş yapıyor, lisans sormuyor.

## ÇÖZÜM:

### **ADIM 1: Browser Console Aç**
```
F12 veya Ctrl+Shift+I
```

### **ADIM 2: Console'a Yapıştır**
```javascript
localStorage.clear();
location.reload();
```

### **ADIM 3: Enter**
✅ Sayfa yenilenir, LicenseGate gösterir!

---

## VEYA:

### **Tarayıcı Ayarlarından:**
1. Ayarlar > Gizlilik
2. "Site verilerini temizle"
3. localhost:3000 seç
4. Temizle
5. Sayfayı yenile

---

## ŞİMDİ DÜZELDİ:

✅ Lisans olmadan giriş yapılamaz
✅ Geçersiz lisans = Hata
✅ Sadece geçerli lisanslarla giriş

---

**Console'da `localStorage.clear()` çalıştır!** 🚀
