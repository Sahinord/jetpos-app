# JetPos Panel — PC masaüstü kabuğu

Patron / Mutfak (KDS) / Garson panellerini **Windows .exe** olarak kuran ince Electron
kabuğu. Kabuk sadece canlı rol adresini (`patron.jetpos.shop` gibi) açar — içerik
web'den geldiği için **otomatik güncellenir**, kabuğu tekrar dağıtmaya gerek yoktur.

> Telefon tarafı ayrı: telefonda bu adresler **PWA** olarak "Ana ekrana ekle" ile kurulur.
> Bu proje yalnızca **PC** içindir.

## Roller

| Komut | Uygulama | Açtığı adres | Not |
|---|---|---|---|
| `build:patron` | **JetPatron** | patron.jetpos.shop | pencere |
| `build:mutfak` | **JetMutfak** | mutfak.jetpos.shop | tam ekran/kiosk + ekran uyanık |
| `build:garson` | **JetGarson** | garson.jetpos.shop | ekran uyanık |

Roller tek yerde tanımlı: [`roles.js`](./roles.js). Yeni rol = oraya bir satır.

## Kurulum (geliştirme)

```bash
cd jetpos-panel
npm install
npm run dev:patron     # ya da dev:mutfak / dev:garson
```

## Installer (.exe) üretmek

```bash
npm run build:patron   # dist/patron/JetPatron-Setup-1.0.0.exe
npm run build:mutfak   # dist/mutfak/JetMutfak-Setup-1.0.0.exe
npm run build:garson   # dist/garson/JetGarson-Setup-1.0.0.exe
npm run build:all      # üçünü birden
```

Çıkan `.exe`'yi kullanıcıya ver → çift tıkla kurar, masaüstü + başlat menüsü kısayolu
oluşur, kendi ikonuyla native uygulama gibi açılır.

> **Not:** Windows installer üretimi Windows'ta (ya da Wine kurulu bir ortamda) yapılmalı.
> `electron-builder` NSIS hedefi için bu gerekir.

## İkonlar

`build/icon.png` şu an üç rolde de ortak. Role özel ikon istersen `roles.js`'e
`icon` alanı ekleyip `electron-builder.config.js`'te `win.icon`'u ona bağlayabilirsin
(ör. `build/icon-mutfak.png`). En az 256×256 PNG önerilir.

## Nasıl çalışır (özet)

1. `set-role.js <rol>` → `.role.json` yazar (aktif rol).
2. `main.js` `.role.json`'dan URL'i okuyup pencerede açar; origin dışına çıkışı engeller,
   dış linkleri varsayılan tarayıcıya yollar, offline'da "Tekrar Dene" ekranı gösterir.
3. `electron-builder.config.js` aynı rolü okuyup installer'ı `JetPatron/JetMutfak/JetGarson`
   ismi + appId'siyle üretir.
