import React from 'react';
import { Monitor, BarChart2, Smartphone, Tag, Shield, Zap, ChevronRight, Layout, Database, Clock, Globe, Smartphone as MobileIcon, CreditCard } from 'lucide-react';

export interface ProductDetailData {
  id: string;
  name: string;
  tagline: string;
  description: string;
  longDescription: string;
  icon: React.ReactNode;
  color: string;
  features: {
    title: string;
    description: string;
    icon: React.ReactNode;
  }[];
  benefits: string[];
  specs: { [key: string]: string };
}

export const productsData: Record<string, ProductDetailData> = {
  jetpos: {
    id: "jetpos",
    name: "JetPOS",
    tagline: "İşletmenizin Modern Komuta Merkezi",
    description: "Masaüstü Barkodlu Satış ve Otomasyon Sistemi. İşletmenizin kalbi.",
    longDescription: "JetPOS, perakende ve hizmet sektöründeki işletmeler için tasarlanmış, uçtan uca bir satış ve operasyon yönetim sistemidir. Hızlı satış ekranı, detaylı stok takibi ve gelişmiş cari yönetim özellikleri ile işletmenizin verimliliğini en üst seviyeye çıkarır.",
    icon: <Monitor size={48} />,
    color: "#3b82f6", // primary blue
    features: [
      {
        title: "Işık Hızında Satış",
        description: "Karmaşık menülerle vakit kaybetmeyin. Barkod okuyucu ve dokunmatik ekran optimizasyonu ile saniyeler içinde işlem yapın.",
        icon: <Zap size={24} />
      },
      {
        title: "Akıllı Stok Yönetimi",
        description: "Ürünlerinizin giriş-çıkış hareketlerini anlık takip edin, kritik stok seviyeleri için otomatik uyarılar alın.",
        icon: <Database size={24} />
      },
      {
        title: "Kapsamlı Cari Takip",
        description: "Müşteri ve tedarikçi borç-alacak hesaplarını tek bir yerden, hatasız bir şekilde yönetin.",
        icon: <Shield size={24} />
      }
    ],
    benefits: [
      "Kullanıcı dostu arayüz ile eğitim süresini minimize edin.",
      "Tüm donanımlarla (Terazi, Yazıcı, Barkod Okuyucu) %100 uyum.",
      "İnternet olmasa da çalışmaya devam eden çevrimdışı mod."
    ],
    specs: {
      "Platform": "Windows / MacOS / Linux",
      "Donanım Desteği": "Epson, Star, Bixolon, Hugin",
      "Veritabanı": "SQLite local / Cloud Sync",
      "Dil Desteği": "Türkçe, İngilizce"
    }
  },
  jetreporting: {
    id: "jetreporting",
    name: "JetReporting",
    tagline: "Verileriniz Cebinizde, Kararlarınız Güvende",
    description: "Patronun cebindeki anlık ciro ve stok raporlama uygulaması.",
    longDescription: "JetReporting, işletme sahiplerinin ve yöneticilerin her an, her yerden işletmelerinin durumunu takip edebilmelerini sağlayan mobil bir analiz platformudur. JetPOS ile tam entegre çalışarak anlık verileri görsel raporlara dönüştürür.",
    icon: <BarChart2 size={48} />,
    color: "#6366f1", // secondary indigo
    features: [
      {
        title: "Anlık Ciro Takibi",
        description: "Türkiye'nin veya dünyanın neresinde olursanız olun, kasanızdaki nakit ve kredi kartı durumunu canlı izleyin.",
        icon: <Clock size={24} />
      },
      {
        title: "Karlılık Analizleri",
        description: "Hangi ürünün daha çok kazandırdığını, hangi personelin daha yüksek performans sergilediğini detaylı grafiklerle görün.",
        icon: <Layout size={24} />
      },
      {
        title: "Kritik Stok Uyarıları",
        description: "Deponuzdaki ürünler azaldığında telefonunuza gelen bildirimlerle satış kaybını önleyin.",
        icon: <Tag size={24} />
      }
    ],
    benefits: [
      "Karar verme süreçlerini veriyle güçlendirin.",
      "Gizli kayıpları ve personel hatalarını hızlıca tespit edin.",
      "Çoklu şube desteği ile tüm noktaları tek ekrardan yönetin."
    ],
    specs: {
      "iOS / Android": "Native performans",
      "Güncelleme": "Gerçek zamanlı (Push notification)",
      "Güvenlik": "SSL / 2FA Desteği",
      "Arayüz": "Karanlık Mod Opsiyonlu"
    }
  },
  jetmenu: {
    id: "jetmenu",
    name: "JetMenu",
    tagline: "Yeni Nesil Restoran Deneyimi",
    description: "Restoranlar için QR Menü ve Dijital Sipariş Sistemi. Temassız hız.",
    longDescription: "JetMenu, klasik kağıt menüleri modern bir dijital deneyime dönüştürür. Müşterileriniz kendi telefonlarından QR kodu okutarak menüyü inceleyebilir, sipariş verebilir ve hatta ödeme yapabilirler.",
    icon: <Smartphone size={48} />,
    color: "#3b82f6",
    features: [
      {
        title: "Dinamik QR Menü",
        description: "Fiyatları ve ürünleri saniyeler içinde güncelleyin. Bitmiş ürünleri anında gizleyin.",
        icon: <Globe size={24} />
      },
      {
        title: "Mutfak Entegrasyonu",
        description: "Müşterinin verdiği sipariş anında mutfak ekranına veya yazıcısına düşer, süreci hızlandırır.",
        icon: <Zap size={24} />
      },
      {
        title: "Görsel Odaklı Tasarım",
        description: "Ürünlerinizi en iştah açıcı fotoğraflarıyla sergileyin, ortalama sepet tutarını artırın.",
        icon: <Layout size={24} />
      }
    ],
    benefits: [
      "Baskı maliyetlerini sıfıra indirin.",
      "Garsonların iş yükünü azaltın, servis kalitesini artırın.",
      "Birden fazla dil desteği ile yabancı turistlere kolaylık sağlayın."
    ],
    specs: {
      "Erişim": "Uygulama indirme gerektirmez (PWA)",
      "Tarayıcı": "Safari, Chrome, Firefox uyumlu",
      "Ödeme": "Kredi kartı / Apple Pay / Google Pay",
      "Yönetim": "Merkezi bulut panel"
    }
  },
  jetlabel: {
    id: "jetlabel",
    name: "JetLabel",
    tagline: "Hayalinizdeki Etiketleri Tasarlayın ve Basın",
    description: "En gelişmiş etiket tasarım ve baskı modülü. Her modele uyumlu.",
    longDescription: "JetLabel, işletmelerin ihtiyaç duyduğu her türlü raf etiketi, ürün etiketi ve barkod basımını çocuk oyuncağına dönüştüren bir tasarım yazılımıdır. Sürükle-bırak editörü ile profesyonel tasarımlar yapmanızı sağlar.",
    icon: <Tag size={48} />,
    color: "#6366f1",
    features: [
      {
        title: "Sürükle-Bırak Editör",
        description: "Herhangi bir grafik tasarım bilgisine ihtiyaç duymadan, görsel olarak etiketlerinizi tasarlayın.",
        icon: <Layout size={24} />
      },
      {
        title: "Zengin Veri Bağlantısı",
        description: "JetPOS veritabanından fiyatları, isimleri ve barkodları otomatik çekerek binlerce etiketi bir tıkla hazırlayın.",
        icon: <Database size={24} />
      },
      {
        title: "Sınırsız Şablon Artık Elinizde",
        description: "İndirim etiketleri, kampanya duyuruları veya standart raf etiketleri için hazır şablonları kullanın.",
        icon: <Smartphone size={24} />
      }
    ],
    benefits: [
      "Tüm termal ve standart yazıcılarla tam uyumlu.",
      "Dinamik QR kod ve EAN-13 barkod oluşturma.",
      "Ölçüleri milimetrik olarak ayarlayabilme imkanı."
    ],
    specs: {
      "Destek": "ZPL, EPL, TSPL, Windows Driver",
      "Format": "PDF, PNG, Direct Print",
      "Entegrasyon": "Excel / CSV / SQL Import",
      "Donanım": "Zebra, Honeywell, Xprinter, Godex"
    }
  },
  jetpay: {
    id: "jetpay",
    name: "JetPay",
    tagline: "Güvenli ve Hızlı Tahsilat Yönetimi",
    description: "İşletmeniz için modern ödeme ve tahsilat çözümleri.",
    longDescription: "JetPay, nakit ve dijital ödeme süreçlerini tek bir merkezden yönetmenizi sağlayan, güvenli ve kullanıcı dostu bir tahsilat platformudur. Banka entegrasyonları ve temassız ödeme desteği ile finansal süreçlerinizi hızlandırır.",
    icon: <CreditCard size={48} />,
    color: "#ef4444",
    features: [
      {
        title: "Temassız Ödeme",
        description: "En son NFC ve QR ödeme teknolojilerini destekler, müşterilerinize modern ödeme seçenekleri sunar.",
        icon: <Zap size={24} />
      },
      {
        title: "Banka Entegrasyonları",
        description: "Türkiye'deki tüm bankalarla tam uyumlu çalışarak işlemlerinizi anlık olarak muhasebeleştirir.",
        icon: <Shield size={24} />
      },
      {
        title: "Detaylı Finansal Raporlar",
        description: "Gün sonu raporları, vadesi gelen ödemeler ve nakit akışınızı tek bir tuşla görüntüleyin.",
        icon: <BarChart2 size={24} />
      }
    ],
    benefits: [
      "Tahsilat riskini minimize edin.",
      "Muhasebe süreçlerindeki hataları sıfıra indirin.",
      "Hızlı ve güvenli işlem onayı ile müşteri memnuniyetini artırın."
    ],
    specs: {
      "Sertifika": "PCI-DSS Level 1",
      "Entegrasyon": "API Tabanlı / SDK Mevcut",
      "Güvenlik": "Encryption Everywhere",
      "Destek": "7/24 Teknik Danışmanlık"
    }
  }
};
