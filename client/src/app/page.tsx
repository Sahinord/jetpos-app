"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Common/Sidebar";
import TopBar from "@/components/Common/TopBar";
import SummaryCards from "@/components/Dashboard/SummaryCards";
import ProductTable from "@/components/Products/ProductTable";
import ProductModal from "@/components/Products/ProductModal";
import POS from "@/components/POS/POS";
import Expenses from "@/components/Expenses/Expenses";
import SalesChart from "@/components/Dashboard/SalesChart";
import QuickStockAlerts from "@/components/Dashboard/QuickStockAlerts";
import Toast, { ToastType } from "@/components/Common/Toast";
import { motion, AnimatePresence } from "framer-motion";

import CategoryManager from "@/components/Products/CategoryManager";
import ProfitCalculator from "@/components/Tools/ProfitCalculator";
import PriceSimulator from "@/components/Simulator/PriceSimulator";
import SmartReports from "@/components/Reports/SmartReports";
import AdminPortal from "@/components/Admin/AdminPortal";
import SalesHistory from "@/components/Dashboard/SalesHistory";
import AppSettings from "@/components/Settings/AppSettings";
import SuperAdmin from "@/components/Admin/SuperAdmin";
import PriceChangeHistory from "@/components/Products/PriceChangeHistory";
import ProductChangeLogs from "@/components/Products/ProductChangeLogs";
import TrendyolGOWidget from "@/components/Integrations/TrendyolGOWidget";
import IntegrationsDashboard from "@/components/Integrations/IntegrationsDashboard";
import LicenseGate from "@/components/Auth/LicenseGate";
import { useTenant } from "@/lib/tenant-context";
import { calculateStockMetrics, calculateStockPredictions } from "@/lib/calculations";
import { supabase } from "@/lib/supabase";
import { LayoutDashboard, ShoppingCart, Package, AlertTriangle, ArrowLeft, Sparkles, Clock } from "lucide-react";
import TenantProfile from "@/components/Tenant/TenantProfile";
import SupportTicketModal from "@/components/Support/SupportTicketModal";

import AISalesInsights from '@/components/AI/AISalesInsights';
import AIAssistantChat from '@/components/AI/AIAssistantChat';
import InvoicePanel from '@/components/Invoice/InvoicePanel';
import HomePage from '@/components/Home/HomePage';
import CariPage from '@/components/Cari/CariPage';
import KasaPage from '@/components/Kasa/KasaPage';
import BankaPage from '@/components/Banka/BankaPage';
import EmployeeManager from '@/components/Employee/EmployeeManager';
import ShiftManager from '@/components/Employee/ShiftManager';
import ProductLabelDesigner from '@/components/Tools/ProductLabelDesigner';
import FinancialCalendar from '@/components/Calendar/FinancialCalendar';
import InvoiceWaybillPage from '@/components/Waybill/InvoiceWaybillPage';
import { createTrendyolGoClient } from "@/lib/trendyol-go-client";

export default function Home() {
  const { currentTenant, loading: tenantLoading } = useTenant();
  const [isLicenseValid, setIsLicenseValid] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saleItems, setSaleItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [campaignRate, setCampaignRate] = useState(1.15); // Default %15
  const [theme, setTheme] = useState<'modern' | 'light' | 'wood' | 'glass'>('modern');
  const [isBeepEnabled, setIsBeepEnabled] = useState(true);
  const [showHelpIcons, setShowHelpIcons] = useState(false);
  const [isEmployeeModuleEnabled, setIsEmployeeModuleEnabled] = useState(true);

  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" as ToastType });

  const stats = calculateStockMetrics(products);

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ isVisible: true, message, type });
  };

  useEffect(() => {
    if (!tenantLoading && currentTenant) {
      fetchData();
    }
  }, [tenantLoading, currentTenant]);

  useEffect(() => {
    const savedRate = localStorage.getItem('campaignRate');
    if (savedRate) setCampaignRate(parseFloat(savedRate));

    const savedTheme = localStorage.getItem('theme') as any;
    if (savedTheme) setTheme(savedTheme);

    const savedBeep = localStorage.getItem('isBeepEnabled');
    if (savedBeep !== null) setIsBeepEnabled(savedBeep === 'true');

    const savedHelpIcons = localStorage.getItem('showHelpIcons');
    if (savedHelpIcons !== null) setShowHelpIcons(savedHelpIcons === 'true');

    const savedEmployeeModule = localStorage.getItem('isEmployeeModuleEnabled');
    if (savedEmployeeModule !== null) setIsEmployeeModuleEnabled(savedEmployeeModule === 'true');

    // Hash control for profile tab
    const handleHashChange = () => {
      if (window.location.hash === '#profile') {
        setActiveTab('profile');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Check on mount

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    localStorage.setItem('isBeepEnabled', isBeepEnabled.toString());
    localStorage.setItem('showHelpIcons', showHelpIcons.toString());
    localStorage.setItem('isEmployeeModuleEnabled', isEmployeeModuleEnabled.toString());
  }, [theme, isBeepEnabled, showHelpIcons, isEmployeeModuleEnabled]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      if (!currentTenant) return;

      // 1. Fetch Categories and Sales with Explicit Tenant Filter
      const [cd, si] = await Promise.all([
        supabase.from('categories')
          .select('*')
          .eq('tenant_id', currentTenant.id)
          .order('name'),
        supabase.from('sale_items')
          .select('*')
          .eq('tenant_id', currentTenant.id)
          .gte('created_at', sevenDaysAgo.toISOString())
          .limit(20000)
      ]);

      if (cd.error) throw cd.error;
      if (si.error) throw si.error;

      setCategories(cd.data || []);
      setSaleItems(si.data || []);

      // 2. Fetch ALL Products using Pagination with Explicit Tenant Filter
      let allProducts: any[] = [];
      let page = 0;
      const PAGE_SIZE = 1000;
      let hasMore = true;

      while (hasMore) {
        console.log(`Zırhlı Çekim: Sayfa ${page} (Dükkan: ${currentTenant.license_key})`);

        const { data, error } = await supabase
          .from('products')
          .select('*, categories(name)')
          .eq('tenant_id', currentTenant.id)
          .order('id', { ascending: true })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (error) {
          console.error("Çekim Hatası:", error);
          throw error;
        }

        if (data && data.length > 0) {
          allProducts = [...allProducts, ...data];
          setProducts([...allProducts]); // Update state progressively

          if (data.length < PAGE_SIZE) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
        page++;
      }

      console.log(`Final Success! Total: ${allProducts.length}`);
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: any) => {
    if (!currentTenant) return;
    setIsSaving(true);
    try {
      // Duplicate Barcode Check
      if (formData.barcode && formData.barcode.trim() !== "") {
        const barcodeExists = products.some(p =>
          p.barcode === formData.barcode &&
          (!editingProduct || (editingProduct as any).id !== p.id)
        );

        if (barcodeExists) {
          throw new Error("Bu barkod numarası başka bir üründe kullanılıyor!");
        }
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update({
            name: formData.name,
            barcode: formData.barcode,
            purchase_price: formData.purchase_price,
            sale_price: formData.sale_price,
            vat_rate: formData.vat_rate,
            stock_quantity: formData.stock_quantity,
            category_id: formData.category_id || null,
            unit: formData.unit,
            status: formData.status,
            is_campaign: formData.is_campaign,
            image_url: formData.image_url,
            tenant_id: currentTenant.id
          })
          .eq('id', (editingProduct as any).id)
          .eq('tenant_id', currentTenant.id);

        if (error) throw error;
        showToast("Ürün güncellendi");
      } else {
        const { error } = await supabase
          .from('products')
          .insert([{
            name: formData.name,
            barcode: formData.barcode,
            purchase_price: formData.purchase_price,
            sale_price: formData.sale_price,
            vat_rate: formData.vat_rate,
            stock_quantity: formData.stock_quantity,
            category_id: formData.category_id || null,
            unit: formData.unit,
            status: formData.status,
            is_campaign: formData.is_campaign,
            image_url: formData.image_url,
            tenant_id: currentTenant.id
          }]);

        if (error) throw error;
        showToast("Yeni ürün eklendi");
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentTenant) return;
    if (!confirm("Silmek istediğinize emin misiniz?")) return;

    try {
      // First delete related sale items to allow product deletion and update charts
      const { error: itemsError } = await supabase.from('sale_items').delete().eq('product_id', id);
      if (itemsError) throw itemsError;

      const { error } = await supabase.from('products')
        .delete()
        .eq('id', id)
        .eq('tenant_id', currentTenant.id);
      if (error) throw error;

      showToast("Ürün ve geçmiş verileri silindi", "info");
      fetchData();
    } catch (error: any) {
      showToast(error.message, "error");
    }
  };

  const handleToggleAllCampaign = async (status: boolean, rate?: number) => {
    if (!currentTenant) return;
    try {
      setLoading(true);

      if (status && rate) {
        setCampaignRate(1 + (rate / 100));
        localStorage.setItem('campaignRate', (1 + (rate / 100)).toString());
      }

      const { error } = await supabase
        .from('products')
        .update({ is_campaign: status })
        .eq('tenant_id', currentTenant.id);

      if (error) throw error;
      showToast(status ? `Tüm ürünlere %${rate} kampanya uygulandı` : "Tüm ürünlerden kampanya kaldırıldı");
      await fetchData();
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllProducts = async () => {
    if (!currentTenant) return;
    if (!confirm("TÜM ÜRÜNLERİ SİLMEK İSTEDİĞİNİZE EMİN MİSİNİZ? Bu işlem geri alınamaz ve tüm satış geçmişi ile ilişkili veriler silinecektir!")) return;
    if (!confirm("SON UYARI: Gerçekten tüm veritabanını sıfırlamak istiyor musunuz?")) return;

    try {
      setLoading(true);
      // Delete sale items first due to foreign key constraints
      const { error: itemsError } = await supabase.from('sale_items').delete().eq('tenant_id', currentTenant.id);
      if (itemsError) throw itemsError;

      const { error: salesError } = await supabase.from('sales').delete().eq('tenant_id', currentTenant.id);
      if (salesError) throw salesError;

      const { error: productsError } = await supabase.from('products')
        .delete()
        .eq('tenant_id', currentTenant.id);
      if (productsError) throw productsError;

      showToast("Tüm ürünler temizlendi", "info");
      await fetchData();
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkImport = async (data: any[]) => {
    if (!currentTenant) return;
    try {
      setLoading(true);

      const productsToImport = data.map((item: any) => {
        // Helper to find value
        const findValue = (obj: any, patterns: string[]) => {
          const keys = Object.keys(obj);
          const normPatterns = patterns.map(p => p.toLowerCase().replace(/[^a-z0-9]/g, ''));
          for (const key of keys) {
            const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (normPatterns.includes(normKey)) return obj[key];
          }
          return undefined;
        };

        const parseNum = (val: any) => {
          if (val === undefined || val === null || val === "") return 0;
          if (typeof val === 'number') return val;
          const clean = String(val).replace(',', '.').replace(/[^\d.-]/g, '');
          const res = parseFloat(clean);
          return isNaN(res) ? 0 : res;
        };

        let barcode = String(findValue(item, ["Barkod", "Stok_Kodu", "Stok Kodu", "Barkod No", "Barcode"]) || "");
        if (!barcode || barcode.trim() === "") barcode = `AUTO-${Date.now()}-${Math.floor(Math.random() * 10000000)}`;

        let name = findValue(item, ["Adi_1", "Adi1", "Ürün Adı", "Ürün", "Adı", "Name", "Açıklama"]);
        if (!name) name = item["ADI"] || item["CISIM_ADI"] || (barcode !== "" ? `Ürün ${barcode}` : "İsimsiz Ürün");

        // Fiyatlarda KDV dahil/hariç mantığı eklenebilir ama şu an düz alıyoruz
        const purchase_price = parseNum(findValue(item, ["Alis_Fiyati", "Alış_Fiyatı", "Maliyet", "Cost"]));
        const sale_price = parseNum(findValue(item, ["Fiyati", "Fiyatı", "Satış Fiyatı", "Fiyat", "Price"]));
        const stock_quantity = parseNum(findValue(item, ["Bakiye", "Stok", "Stok Adedi", "Stok Miktarı", "Miktar", "Adet"]));
        const vat_rate = Math.round(parseNum(findValue(item, ["KDV", "Kdv Oranı", "VAT"]) || 1));

        return {
          barcode: String(barcode).trim(),
          name: String(name).trim(),
          purchase_price,
          sale_price,
          stock_quantity,
          unit: findValue(item, ["Birim", "Unit"]) || "Adet",
          vat_rate,
          status: item.status || "active",
          is_campaign: item.is_campaign || false,
          image_url: findValue(item, ["Gorsel", "Resim", "Image"]) || ""
        };
      });

      // CHUNKED UPLOAD LOGIC (Time-out Prevention)
      const BATCH_SIZE = 200; // Smaller batches to avoid timeout
      let totalSuccess = 0;
      let totalFailed = 0;
      let allErrors = "";

      for (let i = 0; i < productsToImport.length; i += BATCH_SIZE) {
        const batch = productsToImport.slice(i, i + BATCH_SIZE);
        showToast(`Yükleniyor... ${Math.min(i + BATCH_SIZE, productsToImport.length)} / ${productsToImport.length}`, "info");

        // RPC Call per Batch
        const { data: result, error } = await supabase.rpc('bulk_import_products', {
          products_json: batch,
          target_tenant_id: currentTenant?.id
        });

        if (error) {
          console.error("Batch Error:", error);
          totalFailed += batch.length;
          allErrors += error.message + "; ";
        } else {
          totalSuccess += result.processed;
          totalFailed += result.failed;
          if (result.errors && result.errors !== 'No Error') allErrors += result.errors;
        }

        // UI'ın donmasını engellemek için kısa bir mola (Throttle)
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const finalMsg = `İşlem Bitti! ${totalSuccess} yüklendi, ${totalFailed} hatalı.`;
      showToast(finalMsg, totalFailed > 0 ? "warning" : "success");

      if (totalFailed > 0 || (allErrors && allErrors.replace(/No Error/g, '').trim().length > 0)) {
        console.error("Yükleme Detayları:", allErrors);
      }

      await fetchData();

    } catch (error: any) {
      console.error("Critical Import Error:", error);
      showToast("Kritik Hata: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (name: string) => {
    if (!currentTenant) return;
    try {
      const { error } = await supabase.from('categories').insert([{ name, tenant_id: currentTenant.id }]);
      if (error) throw error;
      showToast("Kategori eklendi");
      fetchData();
    } catch (error: any) {
      showToast(error.message, "error");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!currentTenant) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id).eq('tenant_id', currentTenant.id);
      if (error) throw error;
      showToast("Kategori silindi", "info");
      fetchData();
    } catch (error: any) {
      showToast(error.message, "error");
    }
  };

  const handleCheckout = async (cartItems: any[], paymentMethod: string) => {
    if (!currentTenant) return;
    try {
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.sale_price * item.quantity), 0);
      const totalCost = cartItems.reduce((sum, item) => sum + (item.purchase_price * item.quantity), 0);

      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([{
          total_amount: totalAmount,
          total_profit: totalAmount - totalCost,
          payment_method: paymentMethod,
          tenant_id: currentTenant!.id
        }])
        .select()
        .single();

      if (saleError) throw saleError;

      const saleItems = cartItems.map(item => ({
        sale_id: sale.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.sale_price,
        tenant_id: currentTenant!.id
      }));

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
      if (itemsError) throw itemsError;

      // --- TRENDYOL ENTEGRASYONU ---
      let trendyolClient: any = null;
      let mappings: any[] = [];
      let isLive = false;

      // Entegrasyon ayarlarını ve senkronizasyonun açık olup olmadığını kontrol et
      const { data: settings } = await supabase
        .from('integration_settings')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .or('platform.eq.trendyol,type.eq.trendyol_go')
        .maybeSingle();

      const canSync = settings?.is_active && (settings?.api_config?.auto_stock_sync || settings?.settings?.auto_stock_sync);

      if (canSync) {
        isLive = settings.mode === 'live';
        trendyolClient = createTrendyolGoClient({ trendyolGo: settings.api_config || settings.settings });
        // Sadece senkronizasyonu açık olan eşleşmeleri çek
        const { data: mappingData } = await supabase
          .from('external_mappings')
          .select('*')
          .eq('tenant_id', currentTenant.id)
          .eq('platform', 'trendyol')
          .eq('sync_enabled', true);
        mappings = mappingData || [];
      }
      // -----------------------------

      // Update Stock and check for depleted items
      const depletedProducts: string[] = [];
      const { supabase: sb, setCurrentTenant: setTenant } = await import("@/lib/supabase");
      const savedTenantId = localStorage.getItem('currentTenantId');
      if (savedTenantId) await setTenant(savedTenantId);

      for (const item of cartItems) {
        const { error: rpcError } = await sb.rpc('decrement_stock', {
          p_product_id: item.id,
          p_qty: item.quantity
        });

        if (rpcError) {
          console.error("Stok düşme hatası:", rpcError);
        } else {
          const productInState = products.find((p: any) => p.id === item.id);
          const oldStock = productInState?.stock_quantity || 0;
          const newQty = Math.max(0, oldStock - item.quantity);

          // Trendyol Sync - Arka planda çalıştır (Bekletme yapmaz)
          if (canSync && trendyolClient) {
            const mapping = mappings.find(m => m.product_id === item.id);
            if (mapping) {
              if (isLive) {
                trendyolClient.updateStock(mapping.external_sku, newQty, item.sale_price)
                  .catch((err: any) => {
                    console.error("Trendyol sync failed:", err);
                    // Hata durumunda mapping tablosuna işle
                    supabase.from('external_mappings').update({
                      last_sync_status: 'failed',
                      last_sync_error: err.message,
                      last_sync_at: new Date().toISOString()
                    }).eq('id', mapping.id).then();
                  });
              } else {
                console.log(`[TEST MODU] Trendyol stok güncelleme atlandı: ${item.name} -> ${newQty}`);
              }
            }
          }

          if (productInState && newQty <= 0) {
            depletedProducts.push(productInState.name);
            await sb.from('products').update({ status: 'passive' }).eq('id', item.id);
          }
        }
      }

      showToast("Satış başarıyla tamamlandı!", "success");

      if (depletedProducts.length > 0) {
        depletedProducts.forEach(name => {
          showToast(`${name} tükendi ve otomatik pasife alındı.`, "info");
        });
      }

      fetchData();
    } catch (error: any) {
      showToast(error.message, "error");
    }
  };

  // Show license gate if no valid tenant
  if (!currentTenant && !tenantLoading) {
    return <LicenseGate onSuccess={() => window.location.reload()} />;
  }

  // Show loading while checking tenant
  if (tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white font-bold">JetPos Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Admin Panel (Sadece lisans yönetimi)
  const isAdmin = currentTenant?.license_key === 'ADM257SA67';

  if (isAdmin) {
    return (
      <div className="min-h-screen text-white">
        <div className="flex items-center justify-between p-6 border-b border-border bg-card/30 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">🔐</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">JetPos Admin</h1>
              <p className="text-xs text-secondary">Super Admin Panel</p>
            </div>
          </div>

          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-400 font-bold transition-all"
          >
            Çıkış Yap
          </button>
        </div>

        <div className="p-8 max-w-7xl mx-auto">
          <SuperAdmin />
        </div>
      </div>
    );
  }

  // Normal App (Kullanıcılar için)
  return (
    <div className={`flex min-h-screen bg-background text-foreground theme-${theme}`}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} showHelpIcons={showHelpIcons} />

      <main className="flex-1 overflow-y-auto max-h-screen relative flex flex-col">
        <TopBar activeTab={activeTab} />

        <div className="p-2 lg:p-3 w-full flex-1 flex flex-col min-h-0">
          {activeTab === "home" && (
            <HomePage onNavigate={setActiveTab} />
          )}

          {activeTab === "dashboard" && (
            <div className="space-y-10 max-w-[1500px] mx-auto w-full">

              <SummaryCards
                totalItems={stats.totalItems}
                totalStock={stats.totalStock}
                totalStockValue={stats.totalCost}
                potentialProfit={stats.potentialProfit}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <SalesChart sales={saleItems.map(item => ({
                    created_at: item.created_at,
                    total_amount: item.quantity * item.unit_price
                  }))} />
                </div>
                <div>
                  <QuickStockAlerts products={products} saleItems={saleItems} onViewAll={() => setActiveTab('alerts')} />
                </div>

              </div>

              {/* Trendyol GO Integration */}
              <TrendyolGOWidget />

              <section className="space-y-4 pt-10 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Son Ürünler</h2>
                  <button
                    onClick={() => setActiveTab('products')}
                    className="text-sm text-primary hover:underline font-semibold"
                  >
                    Tümünü Gör →
                  </button>
                </div>
                <ProductTable
                  products={products}
                  hideFilters={true}
                  limit={5}
                  onEdit={(p: any) => { setEditingProduct(p); setIsModalOpen(true); }}
                  onDelete={handleDelete}
                  onAdd={() => { setEditingProduct(null); setIsModalOpen(true); }}
                  onManageCategories={() => setIsCatModalOpen(true)}
                  onBulkImport={handleBulkImport}
                  onClearAll={handleClearAllProducts}
                  onToggleAllCampaign={handleToggleAllCampaign}
                  campaignRate={campaignRate}
                  onRefresh={fetchData}
                  showToast={showToast}
                />
              </section>
            </div>
          )}

          {activeTab === "pos" && (
            <div className="max-w-[1500px] mx-auto w-full flex-1 flex flex-col min-h-0">
              <POS
                products={products.filter((p: any) => p.status === 'active' || (p.is_active !== false && p.status !== 'passive'))}
                categories={categories}
                onCheckout={handleCheckout}
                showToast={showToast}
                campaignRate={campaignRate}
                theme={theme}
                setTheme={setTheme}
                isBeepEnabled={isBeepEnabled}
                setActiveTab={setActiveTab}
              />
            </div>
          )}

          {activeTab === "settings" && (
            <div className="max-w-[1500px] mx-auto w-full">
              <AppSettings
                theme={theme}
                setTheme={setTheme}
                isBeepEnabled={isBeepEnabled}
                setIsBeepEnabled={setIsBeepEnabled}
                showHelpIcons={showHelpIcons}
                setShowHelpIcons={setShowHelpIcons}
                isEmployeeModuleEnabled={isEmployeeModuleEnabled}
                setIsEmployeeModuleEnabled={setIsEmployeeModuleEnabled}
                showToast={showToast}
              />
            </div>
          )}

          {activeTab === "products" && (
            <div className="max-w-[1500px] mx-auto w-full">
              <ProductTable
                products={products}
                onEdit={(p: any) => { setEditingProduct(p); setIsModalOpen(true); }}
                onDelete={handleDelete}
                onAdd={(data?: any) => { setEditingProduct(data || null); setIsModalOpen(true); }}
                onManageCategories={() => setIsCatModalOpen(true)}
                onBulkImport={handleBulkImport}
                onClearAll={handleClearAllProducts}
                onToggleAllCampaign={handleToggleAllCampaign}
                campaignRate={campaignRate}
                onRefresh={fetchData}
                showToast={showToast}
                onViewChangeLogs={() => setActiveTab("product-logs")}
              />
            </div>
          )}

          {activeTab === "expenses" && (
            <div className="max-w-[1500px] mx-auto w-full">
              <Expenses />
            </div>
          )}
          {activeTab === "calculator" && (
            <div className="max-w-[1500px] mx-auto w-full">
              <ProfitCalculator />
            </div>
          )}
          {activeTab === "simulation" && (
            <div className="max-w-[1500px] mx-auto w-full">
              <PriceSimulator
                products={products}
                onApplyChanges={() => fetchData()}
                showToast={showToast}
              />
            </div>
          )}
          {activeTab === "reports" && (
            <div className="max-w-[1500px] mx-auto w-full">
              <SmartReports products={products} />
            </div>
          )}
          {activeTab === "mali_takvim" && (
            <div className="max-w-[1500px] mx-auto w-full">
              <FinancialCalendar />
            </div>
          )}

          {activeTab === "ai_insights" && (
            <div className="max-w-[1500px] mx-auto w-full">
              <AISalesInsights />
            </div>
          )}
          {activeTab === "ai_assistant" && (
            <div className="max-w-[1500px] mx-auto w-full">
              <AIAssistantChat />
            </div>
          )}
          {activeTab === "invoice" && (
            <div className="max-w-[1500px] mx-auto w-full">
              <InvoicePanel />
            </div>
          )}
          {activeTab === "profile" && (
            <div className="max-w-[1500px] mx-auto w-full">
              <TenantProfile />
            </div>
          )}

          {/* Cari Hesap Sayfaları */}
          {activeTab.startsWith("cari_") && (
            <div className="max-w-[1500px] mx-auto w-full">
              <CariPage pageId={activeTab} />
            </div>
          )}

          {/* Kasa İşlemleri Sayfaları */}
          {activeTab.startsWith("cash_") && (
            <div className="max-w-[1500px] mx-auto w-full">
              <KasaPage pageId={activeTab} showToast={showToast} />
            </div>
          )}

          {/* Banka İşlemleri Sayfaları */}
          {activeTab.startsWith("bank_") && (
            <div className="max-w-[1500px] mx-auto w-full">
              <BankaPage pageId={activeTab} showToast={showToast} />
            </div>
          )}

          {/* Employee Management - Çalışan Yönetimi */}
          {activeTab === "employee_manager" && isEmployeeModuleEnabled && (
            <div className="max-w-[1500px] mx-auto w-full">
              <EmployeeManager showToast={showToast} />
            </div>
          )}

          {/* Shift Management - Vardiya Takibi */}
          {activeTab === "shift_manager" && isEmployeeModuleEnabled && (
            <div className="max-w-[1500px] mx-auto w-full">
              <ShiftManager showToast={showToast} />
            </div>
          )}

          {/* Product Label Designer - Ürün Etiket Tasarımı */}
          {activeTab === "label_designer" && (
            <div className="max-w-[1500px] mx-auto w-full">
              <ProductLabelDesigner products={products} showToast={showToast} />
            </div>
          )}

          {/* İrsaliye Yönetimi (Oda 1) */}
          {activeTab.startsWith("iw_irsaliye") || [
            'alis_irsaliyesi', 'satis_irsaliyesi', 'satis_iade_irsaliyesi', 'alis_iade_irsaliyesi', 'sevk_irsaliyesi'
          ].includes(activeTab) && (
              <div className="max-w-[1800px] mx-auto w-full">
                <InvoiceWaybillPage category="irsaliye" initialView={activeTab as any} />
              </div>
            )}

          {/* Fatura İşlemleri (Oda 2) */}
          {activeTab.startsWith("iw_fatura") || [
            'alis_faturasi', 'satis_faturasi', 'perakende_satis_faturasi', 'iade_faturasi', 'iade_fiyat_farki', 'emsaliyet_fisleri'
          ].includes(activeTab) && (
              <div className="max-w-[1800px] mx-auto w-full">
                <InvoiceWaybillPage category="fatura" initialView={activeTab as any} />
              </div>
            )}

          {/* Hizmet İşlemleri (Oda 3) */}
          {activeTab.startsWith("iw_hizmet") || [
            'alinan_hizmet_faturasi', 'yapilan_hizmet_faturasi', 'yapilan_hizmet_iadesi', 'alinan_hizmet_iadesi'
          ].includes(activeTab) && (
              <div className="max-w-[1800px] mx-auto w-full">
                <InvoiceWaybillPage category="hizmet" initialView={activeTab as any} />
              </div>
            )}

          {/* Fatura Raporları (Oda 4) */}
          {activeTab.startsWith("iw_rapor") || [
            'fatura_listesi', 'fatura_kdv_listesi', 'kdv_analiz_raporu'
          ].includes(activeTab) && (
              <div className="max-w-[1800px] mx-auto w-full">
                <InvoiceWaybillPage category="raporlar" initialView={activeTab as any} />
              </div>
            )}

          {activeTab === "alerts" && (
            <div className="max-w-[1500px] mx-auto w-full space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6 text-secondary hover:text-white" />
                  </button>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-black text-white uppercase tracking-tight">Akıllı Stok Analizi</h1>
                      <p className="text-xs text-secondary/40 font-bold uppercase tracking-widest mt-1">AI Destekli Tahminleme ve Tedarik Planlama</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Smart Metrics */}
              {(() => {
                const smartAlerts = calculateStockPredictions(products, saleItems);
                const highRisk = smartAlerts.filter(a => a.riskLevel === 'high');
                const mediumRisk = smartAlerts.filter(a => a.riskLevel === 'medium');
                const estimatedCost = smartAlerts.reduce((acc, p) => acc + ((p.min_stock || 10) - p.stock_quantity) * p.purchase_price, 0);

                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 border-rose-500/10 bg-rose-500/[0.02] relative overflow-hidden group">
                        <AlertTriangle className="absolute -right-4 -top-4 w-24 h-24 text-rose-500 opacity-[0.03] group-hover:rotate-12 transition-transform" />
                        <p className="text-[10px] font-black text-rose-500/60 uppercase tracking-[0.2em] mb-4">KRİTİK RİSK (0-3 GÜN)</p>
                        <p className="text-4xl font-black text-white tracking-tighter">{highRisk.length} <span className="text-sm font-bold text-secondary uppercase">ÜRÜN</span></p>
                        <div className="w-full bg-rose-500/10 h-1.5 rounded-full mt-6 overflow-hidden">
                          <div className="h-full bg-rose-500" style={{ width: `${(highRisk.length / (smartAlerts.length || 1)) * 100}%` }} />
                        </div>
                      </motion.div>

                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 border-amber-500/10 bg-amber-500/[0.02] relative overflow-hidden group">
                        <Clock className="absolute -right-4 -top-4 w-24 h-24 text-amber-500 opacity-[0.03] group-hover:rotate-12 transition-transform" />
                        <p className="text-[10px] font-black text-amber-500/60 uppercase tracking-[0.2em] mb-4">ORTA RİSK (3-7 GÜN)</p>
                        <p className="text-4xl font-black text-white tracking-tighter">{mediumRisk.length} <span className="text-sm font-bold text-secondary uppercase">ÜRÜN</span></p>
                        <div className="w-full bg-amber-500/10 h-1.5 rounded-full mt-6 overflow-hidden">
                          <div className="h-full bg-amber-500" style={{ width: `${(mediumRisk.length / (smartAlerts.length || 1)) * 100}%` }} />
                        </div>
                      </motion.div>

                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 border-emerald-500/10 bg-emerald-500/[0.02] relative overflow-hidden group">
                        <ShoppingCart className="absolute -right-4 -top-4 w-24 h-24 text-emerald-500 opacity-[0.03] group-hover:rotate-12 transition-transform" />
                        <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.2em] mb-4">TAHMİNİ TEDARİK MALİYETİ</p>
                        <p className="text-4xl font-black text-white tracking-tighter">₺{estimatedCost.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}</p>
                        <p className="text-[10px] font-bold text-secondary/40 mt-4 uppercase tracking-widest italic">Güvenli stok seviyesi için gereken bütçe</p>
                      </motion.div>
                    </div>

                    <div className="glass-card border-white/5 overflow-hidden shadow-2xl">
                      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                        <h2 className="text-sm font-black text-white uppercase tracking-widest">Analiz Edilen Ürün Listesi</h2>
                        <span className="text-[10px] font-bold text-secondary/40 uppercase">Sıralama: En Yüksek Risk Önce</span>
                      </div>
                      <ProductTable
                        products={smartAlerts}
                        onEdit={(p: any) => { setEditingProduct(p); setIsModalOpen(true); }}
                        onDelete={handleDelete}
                        onAdd={() => { setEditingProduct(null); setIsModalOpen(true); }}
                        onManageCategories={() => setIsCatModalOpen(true)}
                        onBulkImport={handleBulkImport}
                        onClearAll={handleClearAllProducts}
                        onToggleAllCampaign={handleToggleAllCampaign}
                        campaignRate={campaignRate}
                        hideFilters={true}
                        onRefresh={fetchData}
                        showToast={showToast}
                      />
                    </div>
                  </>
                );
              })()}
            </div>
          )}


          {activeTab.endsWith('_integration') && (
            <div className="max-w-[1500px] mx-auto w-full">
              <IntegrationsDashboard integrationType={activeTab} />
            </div>
          )}

          {activeTab === "history" && (
            <div className="max-w-[1500px] mx-auto w-full">
              <SalesHistory />
            </div>
          )}

          {activeTab === "price-history" && (
            <div className="max-w-[1500px] mx-auto w-full">
              <PriceChangeHistory onBack={() => setActiveTab("products")} />
            </div>
          )}

          {activeTab === "product-logs" && (
            <div className="max-w-[1500px] mx-auto w-full">
              <ProductChangeLogs onBack={() => setActiveTab("products")} />
            </div>
          )}
        </div>
      </main>

      {/* Support Modal - Sidebar'dan kontrol ediliyor */}
      <SupportTicketModal
        isOpen={activeTab === "support"}
        onClose={() => setActiveTab("home")}
      />

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        product={editingProduct}
        categories={categories}
        isSaving={isSaving}
      />

      {
        isCatModalOpen && (
          <CategoryManager
            categories={categories}
            onAdd={handleAddCategory}
            onDelete={handleDeleteCategory}
            onClose={() => setIsCatModalOpen(false)}
          />
        )
      }

      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div >
  );
}
