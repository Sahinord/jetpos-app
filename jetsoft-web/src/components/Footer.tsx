import React from 'react';
import { Mail, Phone, MapPin, Instagram, Facebook, Twitter, ShieldCheck } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="pt-32 pb-16 bg-black/80 relative border-t border-white/5">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-red-600 rounded-xl flex items-center justify-center font-black text-white">J</div>
              <span className="text-2xl font-black text-white tracking-widest uppercase">JETSOFT</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Yazılımla şekillenen gelecekte, işletmenizi en modern teknolojilerle dijitalleştiriyoruz. JetSoft Bilgi Teknolojileri bir JetPOS markasıdır.
            </p>
            <div className="flex gap-4">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 glass rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold text-white mb-8 tracking-wide">Hızlı Menü</h4>
            <ul className="space-y-4">
              {['Hakkımızda', 'Ürünlerimiz', 'Bayi Başvurusu', 'Müşteri Paneli', 'Teknik Destek'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-400 hover:text-blue-500 transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold text-white mb-8 tracking-wide">Yasal</h4>
            <ul className="space-y-4">
              {['Gizlilik Politikası', 'KVKK Aydınlatma Metni', 'Mesafeli Satış Sözleşmesi', 'İade ve İptal Koşulları'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-400 hover:text-blue-500 transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold text-white mb-8 tracking-wide">İletişim</h4>
            <ul className="space-y-6">
              <li className="flex items-start gap-4 text-gray-400">
                <MapPin className="text-red-500 shrink-0" size={20} />
                <span>Teknopark İstanbul, 34906 <br />Pendik / İstanbul</span>
              </li>
              <li className="flex items-center gap-4 text-gray-400">
                <Phone className="text-blue-500 shrink-0" size={20} />
                <span>0(850) 840 00 00</span>
              </li>
              <li className="flex items-center gap-4 text-gray-400">
                <Mail className="text-red-500 shrink-0" size={20} />
                <span>destek@jetsoft.com.tr</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-16 border-t border-white/5 gap-8">
          <p className="text-gray-500 text-sm">
            © 2026 JetSoft Bilgi Teknolojileri. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-3 text-gray-500 text-xs">
            <ShieldCheck size={16} /> Secure Payment Gateway Powered by JetPay
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
