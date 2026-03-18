-- ================================================================
-- Blog Posts Tablosu
-- ================================================================
create table if not exists public.blog_posts (
    id          uuid default gen_random_uuid() primary key,
    title       text not null,
    slug        text not null unique,
    excerpt     text,
    content     text,
    cover_image text,
    category    text default 'Genel',
    tags        text[] default '{}',
    author      text default 'JetPOS Ekibi',
    published   boolean default false,
    featured    boolean default false,
    read_time   int default 5,
    created_at  timestamptz default now(),
    updated_at  timestamptz default now()
);

-- RLS
alter table public.blog_posts enable row level security;
create policy "Blog public read" on public.blog_posts for select using (published = true);
create policy "Blog anon all" on public.blog_posts for all using (true); -- admin uses anon key

-- ================================================================
-- About Content Tablosu
-- ================================================================
create table if not exists public.about_content (
    id          uuid default gen_random_uuid() primary key,
    section     text not null unique,   -- 'hero', 'story', 'values', 'team', 'stats'
    content     jsonb not null default '{}',
    updated_at  timestamptz default now()
);

alter table public.about_content enable row level security;
create policy "About public read" on public.about_content for select using (true);
create policy "About anon all" on public.about_content for all using (true);

-- ================================================================
-- Seed: Varsayilan About içeriği
-- ================================================================
insert into public.about_content (section, content) values
('hero', '{
    "title": "Türk İşletmelerinin Dijital Dönüşüm Ortağı",
    "subtitle": "2022 yılında İstanbul''dan başlayan bir yolculuk. Küçük esnaftan büyük zincirlere kadar binlerce işletme JetPOS ile çalışıyor.",
    "founded": "2022",
    "location": "İstanbul, Türkiye"
}'),
('story', '{
    "title": "Hikayemiz",
    "paragraphs": [
        "JetPOS, küçük esnafın karmaşık ve pahalı yazılımlarla boğuştuğunu gören bir ekip tarafından kuruldu. Amacımız tek bir şeydi: Bakkaldan markete, kasaptan giyim mağazasına herkesin kullanabileceği, uygun fiyatlı ve güçlü bir satış sistemi.",
        "Bugün Türkiye''nin dört bir yanında 2.400+ işletme JetPOS ile çalışıyor. E-Fatura entegrasyonundan yapay zeka destekli stok analizlerine kadar en güncel teknolojileri müşterilerimize sunmaya devam ediyoruz."
    ]
}'),
('values', '{
    "items": [
        {"icon": "🎯", "title": "Sadelik", "desc": "Her özelliği herkes kullanabilmeli. Karmaşık menüler, gereksiz adımlar yok."},
        {"icon": "💡", "title": "Yenilik", "desc": "Yapay zeka, bulut ve entegrasyonlarla işletmenizi geleceğe hazırlıyoruz."},
        {"icon": "🤝", "title": "Güven", "desc": "Verileriniz bizim için emanet. Banka düzeyinde güvenlik, şeffaf fiyatlandırma."},
        {"icon": "⚡", "title": "Hız", "desc": "Kurulumdan ilk satışa 30 dakika. Destek taleplerine 2 saat içinde yanıt."}
    ]
}'),
('stats', '{
    "items": [
        {"value": "2.400+", "label": "Aktif İşletme"},
        {"value": "12M+", "label": "İşlenen İşlem"},
        {"value": "%98", "label": "Memnuniyet"},
        {"value": "2022", "label": "Kuruluş Yılı"}
    ]
}'),
('team', '{
    "title": "Ekibimiz",
    "subtitle": "JetPOS''u gerçek işletme sahipleri ve yazılım geliştiricilerden oluşan bir ekip inşa ediyor.",
    "members": [
        {"name": "Kurucu & CEO", "role": "Ürün Vizyonu", "initials": "JT"},
        {"name": "CTO", "role": "Teknoloji & Altyapı", "initials": "AT"},
        {"name": "Müşteri Başarı", "role": "Destek & Onboarding", "initials": "MS"}
    ]
}')
on conflict (section) do nothing;

-- ================================================================
-- Seed: Örnek blog yazıları
-- ================================================================
insert into public.blog_posts (title, slug, excerpt, content, category, tags, author, published, featured, read_time) values
(
    'E-Fatura Nedir? İşletmeniz İçin Geçiş Rehberi',
    'e-fatura-nedir-gecis-rehberi',
    'E-Fatura zorunluluğu kapsamı genişliyor. Hangi işletmeler geçmek zorunda, süreç nasıl işliyor? Detaylı rehberimizle öğrenin.',
    '## E-Fatura Nedir?

E-Fatura, kağıt fatura yerine elektronik ortamda düzenlenen ve yasal geçerliliği olan dijital faturadır. Gelir İdaresi Başkanlığı (GİB) altyapısı üzerinden iletilir.

## Kimler E-Fatura Kullanmak Zorunda?

- Cirosu 3 milyon TL ve üzeri olan mükellefler
- E-ticaret platformlarında satış yapan işletmeler
- Özel entegratör veya doğrudan entegrasyon yöntemiyle kayıtlı olanlar

## JetPOS ile E-Fatura Geçişi

JetPOS ve QNB eFinans entegrasyonu sayesinde:
1. Belgelerinizi tek tıkla GİB''e iletebilirsiniz
2. E-Arşiv faturalarınızı otomatik saklayabilirsiniz
3. 48 saat içinde sisteme dahil olabilirsiniz

Daha fazla bilgi için demo talebinde bulunun.',
    'E-Ticaret & Fatura',
    ARRAY['e-fatura', 'vergi', 'gib', 'muhasebe'],
    'JetPOS Ekibi',
    true,
    true,
    6
),
(
    'POS Sistemi Nasıl Seçilir? 5 Kritik Kriter',
    'pos-sistemi-nasil-secilir',
    'Doğru POS sistemi işletmenizin verimliliğini doğrudan etkiler. Hangi kriterlere dikkat etmelisiniz?',
    '## POS Sistemi Seçerken Nelere Bakmalısınız?

### 1. Kullanım Kolaylığı
Kasa personelinin hızla öğrenebileceği, sezgisel bir arayüz şarttır.

### 2. Entegrasyon Kapasitesi
Trendyol, İkas, e-fatura, muhasebe yazılımları ile entegrasyon var mı?

### 3. Mobil Destek
Akıllı telefondan barkod okuma ve satış yapabilmek büyük avantaj sağlar.

### 4. Maliyet Yapısı
Aylık abonelik mi, lisans mı? Gizli ücretler var mı?

### 5. Teknik Destek
7/24 destek, kurulum ve geçiş yardımı sunuluyor mu?

JetPOS bu kriterlerin tamamını karşılar. 14 gün ücretsiz deneyin.',
    'Rehber',
    ARRAY['pos', 'sistem seçimi', 'kasa', 'işletme'],
    'JetPOS Ekibi',
    true,
    false,
    4
),
(
    'Stok Yönetimi: Küçük İşletmeler İçin İpuçları',
    'stok-yonetimi-ipuclari',
    'Stok açıkları ve fazla stok işletmeleri zarara uğratan en büyük sorunlardan. Yapay zeka destekli stok yönetimiyle bu sorunları nasıl çözersiniz?',
    '## Stok Yönetimi Neden Kritik?

Fazla stok: Nakit akışını kilitler, depolama maliyeti yaratır.
Stok açığı: Müşteri kaybı, satış fırsatı kaçırma.

## Yapay Zeka ile Stok Tahmini

JetPOS''un AI motoru satış geçmişinizi analiz ederek:
- Hangi ürünün ne zaman biteceğini tahmin eder
- Sezonsal dalgalanmaları önceden fark eder
- Sipariş önerileri sunar

## Pratik İpuçları

1. ABC analizi yapın: En çok satan %20 ürüne odaklanın
2. Minimum stok seviyesi belirleyin
3. Barkodlu satış ile anlık stok takibi yapın
4. Aylık sayım yerine sürekli takip tercih edin',
    'Stok & Depo',
    ARRAY['stok', 'depo', 'yapay zeka', 'verimlilik'],
    'JetPOS Ekibi',
    true,
    false,
    5
)
on conflict (slug) do nothing;
