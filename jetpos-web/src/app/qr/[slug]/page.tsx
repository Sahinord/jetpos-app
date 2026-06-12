import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Image from "next/image";

export const revalidate = 60; // 60 saniyede bir önbelleği yenile

export default async function QRMenuPage({ params }: { params: { slug: string } }) {
  // Await the params object in Next.js 15+ (if applicable, but safe to do anyway or just use directly in older versions)
  const slug = params.slug;

  // 1. Slug üzerinden ayarları ve tenant_id'yi bul
  const { data: qrSettings, error: settingsError } = await supabase
    .from('qr_menu_settings')
    .select('*')
    .eq('slug', slug)
    .single();

  if (settingsError || !qrSettings) {
    console.error("QR Menu Settings Error", settingsError);
    notFound();
  }

  if (!qrSettings.is_active) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-50">
        <h1 className="text-2xl font-bold mb-2">Menü Şu Anda Kapalı</h1>
        <p className="text-gray-500">Bu işletmenin QR menüsü geçici olarak devre dışı bırakılmıştır.</p>
      </div>
    );
  }

  const tenantId = qrSettings.tenant_id;

  // 2. Kategori ve Ürünleri Çek
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('order_index', { ascending: true });

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true);

  // Kategorilere göre ürünleri grupla
  const categorizedProducts = categories?.map(cat => ({
    ...cat,
    products: products?.filter(p => p.category_id === cat.id) || []
  })).filter(cat => cat.products.length > 0) || [];

  // Dinamik Temalandırma
  const primaryColor = qrSettings.primary_color || '#3b82f6';
  const secondaryColor = qrSettings.secondary_color || '#1e293b';
  const isDark = qrSettings.dark_mode_enabled;

  return (
    <div style={{ 
      backgroundColor: isDark ? '#1f2937' : '#f8fafc', 
      color: isDark ? '#f1f5f9' : '#1f2937', 
      minHeight: '100vh', 
      paddingBottom: '4rem' 
    }}>
      
      {/* Üst Kısım / Banner */}
      <div 
        style={{ 
          backgroundColor: qrSettings.header_bg_color || primaryColor, 
          color: qrSettings.header_text_color || '#ffffff' 
        }} 
        className="w-full relative pb-6 shadow-md"
      >
        {qrSettings.banner_url && (
          <div className="w-full h-48 relative overflow-hidden">
            <Image 
              src={qrSettings.banner_url} 
              alt="Banner" 
              fill 
              style={{ objectFit: 'cover' }} 
              priority
            />
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
        )}
        <div className={`px-4 pt-6 flex flex-col items-center ${qrSettings.banner_url ? '-mt-12 relative z-10' : ''}`}>
           {qrSettings.logo_url && (
              <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-white shadow-lg mb-3 relative flex-shrink-0">
                 <Image 
                   src={qrSettings.logo_url} 
                   alt="Logo" 
                   fill 
                   style={{ objectFit: 'cover' }} 
                 />
              </div>
           )}
           <h1 className="text-2xl font-black text-center">{qrSettings.welcome_text || 'Hoş Geldiniz'}</h1>
           {qrSettings.about_text && (
             <p className="text-sm mt-2 opacity-90 text-center max-w-md">{qrSettings.about_text}</p>
           )}
        </div>
      </div>

      {/* Kayan Yazı (Marquee) */}
      {qrSettings.marquee_text && (
        <div 
          style={{ 
            backgroundColor: qrSettings.marquee_bg_color || '#ef4444', 
            color: qrSettings.marquee_text_color || '#ffffff' 
          }} 
          className="w-full overflow-hidden py-2 whitespace-nowrap shadow-sm"
        >
          {/* Basit bir CSS animasyonu gerektirir, tailwind config'de yoksa inline eklenebilir veya standart kayan yazı kullanılabilir */}
          <div dangerouslySetInnerHTML={{ __html: `<marquee scrollamount="5" class="font-medium text-sm block">${qrSettings.marquee_text}</marquee>` }} />
        </div>
      )}

      {/* Menü İçeriği */}
      <div className="max-w-3xl mx-auto p-4 space-y-8 mt-4">
        {categorizedProducts.length === 0 ? (
          <div className="text-center opacity-50 py-10">
            <p>Menü hazırlanıyor...</p>
          </div>
        ) : (
          categorizedProducts.map((category: any) => (
            <div key={category.id} className="scroll-mt-6" id={`category-${category.id}`}>
              <h2 
                style={{ color: primaryColor, borderBottomColor: primaryColor }} 
                className="text-xl font-bold mb-4 border-b pb-2 opacity-90"
              >
                {category.name}
              </h2>
              
              <div className={`grid gap-4 ${qrSettings.layout_type === 'grid' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1'}`}>
                {category.products.map((product: any) => (
                  <div 
                    key={product.id} 
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col transition-transform hover:scale-[1.02]"
                    style={{ 
                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#f1f5f9'
                    }}
                  >
                    {product.image_url && (
                      <div className="w-full aspect-video relative bg-gray-100 dark:bg-slate-900">
                         <Image 
                           src={product.image_url} 
                           alt={product.name} 
                           fill 
                           style={{ objectFit: 'cover' }} 
                         />
                      </div>
                    )}
                    <div className="p-4 flex flex-col flex-grow">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h3 className={`font-bold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {product.name}
                        </h3>
                        <span style={{ color: primaryColor }} className="font-black whitespace-nowrap">
                          {product.price} ₺
                        </span>
                      </div>
                      {product.description && (
                        <p className={`text-xs mt-1 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
