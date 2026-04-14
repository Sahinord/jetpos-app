import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Menu as MenuIcon, X, Briefcase, Info, Phone, Box, BarChart2, ShoppingCart, CreditCard, Tag } from 'lucide-react';

interface NavbarProps {
  onHomeClick: () => void;
  onProductClick: (id: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onHomeClick, onProductClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const products = [
    { id: 'jetpos', name: 'JetPOS', description: 'Masaüstü Satış Sistemi', icon: <ShoppingCart className="text-blue-500" /> },
    { id: 'jetreporting', name: 'JetReporting', description: 'Mobil Ciro & Stok Takip', icon: <BarChart2 className="text-red-500" /> },
    { id: 'jetmenu', name: 'JetMenu', description: 'Restoran QR Menü', icon: <Box className="text-blue-500" /> },
    { id: 'jetpay', name: 'JetPay', description: 'Tahsilat Çözümleri', icon: <CreditCard className="text-red-500" /> },
    { id: 'jetlabel', name: 'JetLabel', description: 'Etiket Tasarım & Baskı', icon: <Tag className="text-blue-500" /> },
  ];

  const handleProductClick = (id: string) => {
    if (id === 'jetpay') return; // Not implemented yet
    onProductClick(id);
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${isScrolled ? 'py-4 glass border-b' : 'py-6 bg-transparent'}`}>
      <div className="container mx-auto flex items-center justify-between px-6">
        <div
          onClick={onHomeClick}
          className="flex items-center gap-3 group cursor-pointer transition-all duration-300"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-xl transform rotate-3 group-hover:rotate-6 group-hover:scale-110 transition-all duration-300">
            <span className="text-white font-black text-2xl drop-shadow-md">J</span>
          </div>
          <div className="flex flex-col -gap-1">
            <span className="text-2xl font-black tracking-tighter text-white">JETSOFT</span>
            <span className="text-[9px] font-bold text-gray-500 tracking-[0.2em] uppercase">Bilgi Teknolojileri</span>
          </div>
        </div>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-10">
          <div className="relative group">
            <button
              className="flex items-center gap-1 text-gray-300 hover:text-white font-medium transition-colors"
              onMouseEnter={() => setActiveDropdown('corporate')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              Kurumsal <ChevronDown size={14} className={`transition-transform duration-300 ${activeDropdown === 'corporate' ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {activeDropdown === 'corporate' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-4 w-56 glass rounded-2xl p-4 shadow-2xl border border-white/10"
                  onMouseEnter={() => setActiveDropdown('corporate')}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <div className="space-y-4">
                    <a href="#" className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors">
                      <Info size={18} /> Biz Kimiz?
                    </a>
                    <a href="#" className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors">
                      <Briefcase size={18} /> Kariyer
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative group">
            <button
              className="flex items-center gap-1 text-gray-300 hover:text-white font-medium transition-colors"
              onMouseEnter={() => setActiveDropdown('products')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              Ürünlerimiz <ChevronDown size={14} className={`transition-transform duration-300 ${activeDropdown === 'products' ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {activeDropdown === 'products' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-4 w-80 glass rounded-2xl p-5 shadow-2xl border border-white/10"
                  onMouseEnter={() => setActiveDropdown('products')}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <div className="grid gap-6">
                    {products.map((product) => (
                      <button
                        key={product.name}
                        onClick={() => handleProductClick(product.id)}
                        className="flex items-start gap-4 group/item text-left w-full"
                      >
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center p-2 group-hover/item:bg-white/10 transition-colors">
                          {product.icon}
                        </div>
                        <div>
                          <p className="font-semibold text-white group-hover/item:text-blue-400 transition-colors">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <a href="#" className="text-gray-300 hover:text-white font-medium transition-colors flex items-center gap-2">
            <Phone size={18} className="text-red-500" /> İletişim
          </a>
        </div>

        <div className="hidden lg:block">
          <button className="btn-primary flex items-center gap-2 px-6 py-2.5">
            Bayi Başvurusu
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          className="lg:hidden p-2 text-white glass rounded-lg"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-[110] bg-[#020817] p-8 lg:hidden overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-12">
              <span onClick={() => { onHomeClick(); setIsMobileMenuOpen(false); }} className="text-2xl font-bold text-white cursor-pointer">JETSOFT</span>
              <button
                className="p-2 text-white glass rounded-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex flex-col gap-8 text-2xl font-light">
              <a href="#" className="text-white hover:text-blue-400 transition-colors">Biz Kimiz?</a>
              <div className="space-y-4">
                <p className="text-gray-500 text-sm font-semibold tracking-widest uppercase">Ürünlerimiz</p>
                {products.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => handleProductClick(p.id)}
                    className="flex items-center gap-4 text-white hover:text-blue-400 w-full text-left"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              <a href="#" className="text-white hover:text-blue-400 transition-colors">İletişim</a>
              <button className="btn-primary w-full py-4 text-xl mt-4">
                Bayi Başvurusu
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
