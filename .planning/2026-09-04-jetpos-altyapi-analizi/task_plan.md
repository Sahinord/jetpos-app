# Task Plan — JetPos Altyapı Analizi

## Hedef
JetPos deposunun uygulama sınırlarını, ana mimarisini, veri/güvenlik akışlarını, kalite durumunu ve başlıca teknik risklerini yalnızca okuyarak değerlendirmek.

## Fazlar
- [x] Faz 1 — Mevcut planlama durumu ve depo sınırlarını doğrula
- [x] Faz 2 — Proje/bağımlılık/build envanterini çıkar
- [x] Faz 3 — Client mimarisi, auth/tenant, offline ve ödeme-satış akışlarını incele
- [x] Faz 4 — Supabase şema/migration/RLS ve diğer uygulamaları örnekleyerek değerlendir
- [x] Faz 5 — Lint/build/test sinyallerini ve repo hijyenini kontrol et
- [x] Faz 6 — Bulguları etki/öncelik sırasıyla raporla

## Kısıtlar
- Kod veya yapılandırma değiştirilmeyecek.
- Mevcut Ödeal plan dosyalarına dokunulmayacak.
- Değerlendirme somut dosya ve komut kanıtlarına dayanacak.

## Hatalar
| Hata | Çözüm |
|---|---|
| `references/codex-tools.md` yanlış dizinden arandı | Dosya `using-superpowers/references/` altında bulundu ve okundu |
