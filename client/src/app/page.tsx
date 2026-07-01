"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Common/Sidebar";
import TopBar from "@/components/Common/TopBar";
import SummaryCards from "@/components/Dashboard/SummaryCards";
import ProductTable from "@/components/Products/ProductTable";
import ProductModal from "@/components/Products/ProductModal";
import POS from "@/components/POS/POS";
import Adisyon from "@/components/Adisyon/Adisyon";
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
import StoreSelectionOverlay from "@/components/Auth/StoreSelectionOverlay";
import { useTenant } from "@/lib/tenant-context";
import { calculateStockMetrics, calculateStockPredictions } from "@/lib/calculations";
import { supabase, auditLog } from "@/lib/supabase";
import { LayoutDashboard, ShoppingCart, Package, AlertTriangle, ArrowLeft, Sparkles, Clock, ShieldAlert, Trash2, X, Archive } from "lucide-react";
import TenantProfile from "@/components/Tenant/TenantProfile";
import SupportTicketModal from "@/components/Support/SupportTicketModal";

import AISalesInsights from '@/components/AI/AISalesInsights';
import AIAssistantChat from '@/components/AI/AIAssistantChat';
import InvoicePanel from '@/components/Invoice/InvoicePanel';
import HomePage from '@/components/Home/HomePage';
import ProfitPilot from "@/components/AI/ProfitPilot";
import SmartBasket from "@/components/AI/SmartBasket";
import StockBuster from "@/components/AI/StockBuster";
import CariPage from '@/components/Cari/CariPage';
import KasaPage from '@/components/Kasa/KasaPage';
import BankaPage from '@/components/Banka/BankaPage';
import EmployeeManager from '@/components/Employee/EmployeeManager';
import ShiftManager from '@/components/Employee/ShiftManager';
import ProductLabelDesigner from '@/components/Tools/ProductLabelDesigner';
import UniversalConverter from '@/components/Tools/UniversalConverter';
import CurrencyConverter from '@/components/Tools/CurrencyConverter';
import QRCodeGenerator from '@/components/Tools/QRCodeGenerator';
import ReceiptDesigner from '@/components/Tools/ReceiptDesigner';
import FinancialCalendar from '@/components/Calendar/FinancialCalendar';
import InvoiceWaybillPage from '@/components/Waybill/InvoiceWaybillPage';
import WarehousePage from '@/components/Warehouse/WarehousePage';
import QRMenuManager from '@/components/Admin/QRMenuManager';
import ShowcaseManager from '@/components/Admin/ShowcaseManager';
import CFDManager from '@/components/Admin/CFDManager';
import CRMPage from '@/components/CRM/CRMPage';
import JetKDS from "@/components/KDS/JetKDS";
import AuditLogs from "@/components/Admin/AuditLogs";
import { createTrendyolGoClient } from "@/lib/trendyol-go-client";
import EmployeePinLogin from "@/components/Auth/EmployeePinLogin";
import { offlineDB } from "@/lib/offline-db";
import { SyncService } from "@/lib/sync-service";
import SetupWizard from "@/components/Setup/SetupWizard";
import { apiFetch } from "@/lib/api";

export default function Home() {
  const { currentTenant, loading: tenantLoading, activeWarehouse, activeEmployee } = useTenant();
  const [isLicenseValid, setIsLicenseValid] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [products, setProducts] = useState<any[]>([]);
  const [trashProducts, setTrashProducts] = useState<any[]>([]);
  const [archiveProducts, setArchiveProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isPOSAuthorized, setIsPOSAuthorized] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saleItems, setSaleItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [campaignRate, setCampaignRate] = useState(1.15); // Default %15
  const [theme, setTheme] = useState<'modern' | 'light' | 'wood' | 'glass' | 'mavi'>('modern');
  const [isBeepEnabled, setIsBeepEnabled] = useState(true);
  const [showHelpIcons, setShowHelpIcons] = useState(false);
  const [isEmployeeModuleEnabled, setIsEmployeeModuleEnabled] = useState(true);
  const [isPriceSyncEnabled, setIsPriceSyncEnabled] = useState(false);
  const [isStockSyncEnabled, setIsStockSyncEnabled] = useState(false);
  const [isWarehouseStockDeductionEnabled, setIsWarehouseStockDeductionEnabled] = useState(true);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [clearAllConfirmationText, setClearAllConfirmationText] = useState("");
  const [isCashDrawerEnabled, setIsCashDrawerEnabled] = useState(false);
  const [cashDrawerPrinterName, setCashDrawerPrinterName] = useState("");
  const [receiptPrinterName, setReceiptPrinterName] = useState("");
  const [adisyonCart, setAdisyonCart] = useState<any[]>([]);
  const [isAdisyonStoreSpecificEnabled, setIsAdisyonStoreSpecificEnabled] = useState(true);
  const [isAdisyonAutoOpenReservationEnabled, setIsAdisyonAutoOpenReservationEnabled] = useState(true);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [labelPrinterName, setLabelPrinterName] = useState("");

  // Fiş Özelleştirme Ayarları
  const [receiptSettings, setReceiptSettings] = useState({
    storeName: 'JETPOS MARKET',
    subtitle1: 'MODERN PERAKENDE SİSTEMLERİ',
    subtitle2: 'GÜVENLİ VE HIZLI SATIŞ SİSTEMİ',
    footerMessage: 'BİZİ TERCİH ETTİĞİNİZ İÇİN TEŞEKKÜRLER',
    footerNote1: 'MALİ DEĞERİ YOKTUR',
    footerNote2: 'BİLGİ FİŞİDİR',
    showLogo: false,
    phone: '',
    address: '',
    taxOffice: '',
    taxNumber: '',
  });

  // Müşteri Ekranı Ayarları
  const [cfdSettings, setCfdSettings] = useState({
    welcomeTitle: 'HOŞGELDİNİZ',
    welcomeSubtitle: 'KEYİFLİ ALIŞVERİŞLER',
    showImages: true,
  });

  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" as ToastType });

  const stats = calculateStockMetrics(
    products,
    activeWarehouse?.id,
    activeWarehouse?.platform ? false : isStockSyncEnabled,
    isPriceSyncEnabled
  );

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ isVisible: true, message, type });
  };

  // Reset POS auth when leaving POS
  useEffect(() => {
    if (activeTab !== 'pos') {
      setIsPOSAuthorized(false);
    }
  }, [activeTab]);

  // Staff auto-redirect based on role
  useEffect(() => {
    if (activeEmployee) {
      const role = activeEmployee.role?.toLowerCase() || '';
      const position = activeEmployee.position?.toLowerCase() || '';

      if (role === 'kitchen' || role === 'mutfak' || position === 'mutfak') {
        setActiveTab("kds");
      } else if (role === 'waiter' || role === 'garson' || position === 'garson') {
        setActiveTab("adisyon");
      } else if (role === 'owner' || role === 'manager' || role === 'admin') {
        setActiveTab("home");
      }
    }
  }, [activeEmployee]);

  // Platform mağazası seçildiğinde otomatik entegrasyon paneline yönlendir
  useEffect(() => {
    if (activeWarehouse?.platform === 'trendyol_go') {
      setActiveTab('trendyol_go_integration');
    } else if (activeWarehouse?.platform === 'trendyol') {
      setActiveTab('trendyol_integration');
    } else if (activeWarehouse?.platform === 'hepsiburada') {
      setActiveTab('hepsiburada_integration');
    }
  }, [activeWarehouse]);

  // Initialize Sync Service
  useEffect(() => {
    SyncService.initAutoSync();
  }, []);

  // Background Trendyol Order Sync on Tenant Load
  useEffect(() => {
    if (tenantLoading || !currentTenant?.id) return;

    const syncTrendyolOrders = async () => {
      try {
        // 1. Check if integration is configured and active
        const { data: integration } = await supabase
          .from('integration_settings')
          .select('is_active')
          .eq('tenant_id', currentTenant.id)
          .or('type.eq.trendyol_go,platform.eq.trendyol')
          .maybeSingle();

        if (integration?.is_active) {
          // console.log('[Trendyol Auto-Sync] Active integration found. Starting background sync...');
          const res = await apiFetch(`/api/trendyol/sync-orders?tenantId=${currentTenant.id}&days=30`, {
            method: 'POST'
          });
          // console.log('[Trendyol Auto-Sync] Completed:', res);
          
          // 2. If sync succeeded and added orders, refresh page data so dashboard updates immediately
          if (res?.success && res?.count > 0) {
            // console.log('[Trendyol Auto-Sync] New orders synced. Refreshing data...');
            fetchData();
          }
        }
      } catch (err) {
        console.warn('[Trendyol Auto-Sync] Background sync failed or skipped:', err);
      }
    };

    // Run sync asynchronously to not block initial page rendering
    syncTrendyolOrders();
  }, [tenantLoading, currentTenant?.id]);

  useEffect(() => {
    if (!tenantLoading && currentTenant) {
      fetchData();

      // REALTIME: Listen for product and stock changes across all devices
      const productsChannel = supabase
        .channel(`dashboard_products_${currentTenant.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `tenant_id=eq.${currentTenant.id}`
        }, () => {
          // Update products in state or re-fetch
          fetchData();
        })
        .subscribe();

      // REALTIME: Listen for new sales for live analytics
      const salesChannel = supabase
        .channel(`dashboard_sales_${currentTenant.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'sales',
          filter: `tenant_id=eq.${currentTenant.id}`
        }, () => {
          fetchData();
        })
        .subscribe();

      // Eğer localStorage'da receiptSettings yoksa, tenant adını default olarak ata
      const saved = localStorage.getItem('receiptSettings');
      if (!saved) {
        setReceiptSettings((prev: any) => ({
          ...prev,
          storeName: currentTenant.company_name?.toUpperCase() || prev.storeName,
        }));
      }

      return () => {
        supabase.removeChannel(productsChannel);
        supabase.removeChannel(salesChannel);
      };
    }
  }, [tenantLoading, currentTenant, activeWarehouse]);

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

    const savedPriceSync = localStorage.getItem('isPriceSyncEnabled');
    if (savedPriceSync !== null) setIsPriceSyncEnabled(savedPriceSync === 'true');

    const savedStockSync = localStorage.getItem('isStockSyncEnabled');
    if (savedStockSync !== null) setIsStockSyncEnabled(savedStockSync === 'true');

    const savedStockDeduction = localStorage.getItem('isWarehouseStockDeductionEnabled');
    if (savedStockDeduction !== null) setIsWarehouseStockDeductionEnabled(savedStockDeduction === 'true');

    const savedCashDrawer = localStorage.getItem('isCashDrawerEnabled');
    if (savedCashDrawer !== null) setIsCashDrawerEnabled(savedCashDrawer === 'true');

    const savedPrinterName = localStorage.getItem('cashDrawerPrinterName');
    if (savedPrinterName) setCashDrawerPrinterName(savedPrinterName);

    const savedReceiptPrinterName = localStorage.getItem('receiptPrinterName');
    if (savedReceiptPrinterName) setReceiptPrinterName(savedReceiptPrinterName);

    const savedAdisyonStoreSpecific = localStorage.getItem('isAdisyonStoreSpecificEnabled');
    if (savedAdisyonStoreSpecific !== null) setIsAdisyonStoreSpecificEnabled(savedAdisyonStoreSpecific === 'true');

    const savedAdisyonAutoOpen = localStorage.getItem('isAdisyonAutoOpenReservationEnabled');
    if (savedAdisyonAutoOpen !== null) setIsAdisyonAutoOpenReservationEnabled(savedAdisyonAutoOpen === 'true');

    const savedLowStockThreshold = localStorage.getItem('lowStockThreshold');
    if (savedLowStockThreshold !== null) setLowStockThreshold(parseInt(savedLowStockThreshold));

    const savedReceiptSettings = localStorage.getItem('receiptSettings');
    if (savedReceiptSettings) {
      try { setReceiptSettings(JSON.parse(savedReceiptSettings)); } catch (e) { }
    }

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
    localStorage.setItem('isPriceSyncEnabled', isPriceSyncEnabled.toString());
    localStorage.setItem('isStockSyncEnabled', isStockSyncEnabled.toString());
    localStorage.setItem('isWarehouseStockDeductionEnabled', isWarehouseStockDeductionEnabled.toString());
    localStorage.setItem('isCashDrawerEnabled', isCashDrawerEnabled.toString());
    localStorage.setItem('cashDrawerPrinterName', cashDrawerPrinterName);
    localStorage.setItem('receiptPrinterName', receiptPrinterName);
    localStorage.setItem('labelPrinterName', labelPrinterName);
    localStorage.setItem('isAdisyonStoreSpecificEnabled', isAdisyonStoreSpecificEnabled.toString());
    localStorage.setItem('isAdisyonAutoOpenReservationEnabled', isAdisyonAutoOpenReservationEnabled.toString());
    localStorage.setItem('lowStockThreshold', lowStockThreshold.toString());
    localStorage.setItem('receiptSettings', JSON.stringify(receiptSettings));
  }, [theme, isBeepEnabled, showHelpIcons, isEmployeeModuleEnabled, isPriceSyncEnabled, isStockSyncEnabled, isWarehouseStockDeductionEnabled, isCashDrawerEnabled, cashDrawerPrinterName, receiptPrinterName, labelPrinterName, isAdisyonStoreSpecificEnabled, isAdisyonAutoOpenReservationEnabled, lowStockThreshold, receiptSettings]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      if (!currentTenant) return;

      // Check online status
      const isOnline = SyncService.isOnline();

      if (!isOnline) {
        console.log('📡 Offline mode: Loading data from local DB...');
        const localProducts = await offlineDB.products.toArray();
        setProducts(localProducts);
        setLoading(false);
        return;
      }

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
      let hasArchivedAt = true;

      while (hasMore) {
        let query = supabase
          .from('products')
          .select('*, categories(name), warehouse_stock(*)')
          .eq('tenant_id', currentTenant.id)
          .is('deleted_at', null);

        if (hasArchivedAt) {
          query = query.is('archived_at', null);
        }

        const { data, error } = await query
          .order('id', { ascending: true })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (error) {
          if (
            hasArchivedAt &&
            (error.message?.includes('archived_at') ||
              error.details?.includes('archived_at') ||
              error.code === '42703' ||
              error.message?.includes('does not exist'))
          ) {
            hasArchivedAt = false;
            page = 0;
            allProducts = [];
            continue;
          }
          console.error("Çekim Hatası:", error);
          throw error;
        }

        if (data && data.length > 0) {
          allProducts = [...allProducts, ...data];
          if (data.length < PAGE_SIZE) hasMore = false;
        } else {
          hasMore = false;
        }
        page++;
      }
      setProducts(allProducts);

      // Sync to local DB
      if (allProducts.length > 0) {
        await offlineDB.products.clear();
        await offlineDB.products.bulkPut(allProducts.map(p => ({
          ...p,
          warehouse_id: activeWarehouse?.id || ''
        })));
      }

    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
      fetchTrashProducts();
      fetchArchiveProducts();
    }
  };

  const fetchTrashProducts = async () => {
    if (!currentTenant) return;
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id (id, name),
          warehouse_stock (*)
        `)
        .eq('tenant_id', currentTenant.id)
        .not('deleted_at', 'is', null)
        .gte('deleted_at', sevenDaysAgo.toISOString())
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      setTrashProducts(data || []);
    } catch (error: any) {
      console.error("Fetch Trash Error:", error);
    }
  };

  const fetchArchiveProducts = async () => {
    if (!currentTenant) return;
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id (id, name),
          warehouse_stock (*)
        `)
        .eq('tenant_id', currentTenant.id)
        .not('archived_at', 'is', null)
        .is('deleted_at', null)
        .order('archived_at', { ascending: false });

      if (error) {
        if (
          error.message?.includes('archived_at') ||
          error.details?.includes('archived_at') ||
          error.code === '42703' ||
          error.message?.includes('does not exist')
        ) {
          setArchiveProducts([]);
          return;
        }
        throw error;
      }
      setArchiveProducts(data || []);
    } catch (error: any) {
      console.error("Fetch Archive Error:", error);
    }
  };

  const handleArchiveProduct = async (id: string) => {
    if (!currentTenant) return;
    if (!confirm("Ürünü arşivlemek istediğinize emin misiniz? (Arşivden geri çıkarabilirsiniz)")) return;

    try {
      setLoading(true);
      const { error } = await supabase.from('products')
        .update({
          status: 'archived',
          archived_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', currentTenant.id);

      if (error) throw error;

      showToast("Ürün arşive taşındı", "info");
      await fetchData();
    } catch (error: any) {
      showToast("Arşivleme hatası: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkArchive = async (ids: string[]) => {
    if (!currentTenant || ids.length === 0) return;
    if (!confirm(`${ids.length} ürünü arşivlemek istediğinize emin misiniz?`)) return;

    try {
      setLoading(true);
      const BATCH_SIZE = 50;
      let successCount = 0;

      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batchIds = ids.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('products')
          .update({
            status: 'archived',
            archived_at: new Date().toISOString()
          })
          .in('id', batchIds)
          .eq('tenant_id', currentTenant.id);

        if (error) throw error;
        successCount += batchIds.length;
        await new Promise(r => setTimeout(r, 100));
      }

      showToast(`${successCount} ürün arşive taşındı`, "success");
      await fetchData();
    } catch (error: any) {
      showToast("Toplu arşivleme hatası: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchiveProduct = async (id: string) => {
    if (!currentTenant) return;
    try {
      setLoading(true);
      const { error } = await supabase.from('products')
        .update({
          status: 'active',
          archived_at: null
        })
        .eq('id', id)
        .eq('tenant_id', currentTenant.id);

      if (error) throw error;

      showToast("Ürün arşivden çıkarıldı", "success");
      await fetchData();
    } catch (error: any) {
      showToast("Arşivden çıkarma hatası: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkArchiveByBarcode = async (barcodes: string[]) => {
    if (!currentTenant || barcodes.length === 0) return;

    try {
      setLoading(true);
      // Barkodlara eşleşen ürünleri bul
      const matchingProducts = products.filter(p =>
        barcodes.some(b => b.trim() === p.barcode?.trim())
      );

      if (matchingProducts.length === 0) {
        showToast("Barkodlarla eşleşen ürün bulunamadı!", "error");
        return;
      }

      const matchingIds = matchingProducts.map(p => p.id);
      const BATCH_SIZE = 50;
      let successCount = 0;

      for (let i = 0; i < matchingIds.length; i += BATCH_SIZE) {
        const batchIds = matchingIds.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('products')
          .update({
            status: 'archived',
            archived_at: new Date().toISOString()
          })
          .in('id', batchIds)
          .eq('tenant_id', currentTenant.id);

        if (error) throw error;
        successCount += batchIds.length;
        await new Promise(r => setTimeout(r, 100));
      }

      showToast(`${successCount} ürün arşive taşındı (${barcodes.length} barkoddan ${matchingProducts.length} eşleşti)`, "success");
      await fetchData();
    } catch (error: any) {
      showToast("Toplu arşivleme hatası: " + error.message, "error");
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

      // UUID Debug & Validation Checks
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const catId = !formData.category_id || formData.category_id === "undefined" ? null : formData.category_id;

      if (catId !== null && !uuidRegex.test(catId)) {
        throw new Error(`category_id geçersiz UUID: ${catId}`);
      }
      if (!currentTenant.id || !uuidRegex.test(currentTenant.id)) {
        throw new Error(`tenant_id geçersiz UUID: ${currentTenant.id}`);
      }
      if (editingProduct && (!(editingProduct as any).id || !uuidRegex.test((editingProduct as any).id))) {
        throw new Error(`editingProduct.id geçersiz UUID: ${(editingProduct as any).id}`);
      }

      const productId = editingProduct ? (editingProduct as any).id : null;
      let needsLabel = false;
      if (!editingProduct) {
        needsLabel = true; // new product always needs label
      } else {
        // Check master price change
        if (Number(formData.sale_price) !== Number((editingProduct as any).sale_price)) {
          needsLabel = true;
        }
        // Check warehouse-specific price change
        if (!needsLabel && activeWarehouse && !isPriceSyncEnabled) {
          const oldWs = (editingProduct as any).warehouse_stock?.find((ws: any) => ws.warehouse_id === activeWarehouse.id);
          const oldWsPrice = oldWs?.sale_price;
          if (oldWsPrice !== undefined && oldWsPrice !== null) {
            if (Number(formData.sale_price) !== Number(oldWsPrice)) {
              needsLabel = true;
            }
          } else {
            // No previous warehouse price exists, new price is being set
            needsLabel = true;
          }
        }
      }

      const productPayload: any = {
        name: formData.name,
        barcode: formData.barcode,
        vat_rate: formData.vat_rate,
        category_id: catId,
        unit: formData.unit,
        status: formData.status,
        is_campaign: formData.is_campaign,
        image_url: formData.image_url,
        tenant_id: currentTenant.id
      };

      const effectivePriceSync = activeWarehouse?.platform ? false : isPriceSyncEnabled;
      const effectiveStockSync = activeWarehouse?.platform ? false : isStockSyncEnabled;

      // Only update master prices if sync is enabled OR no warehouse is selected
      if (effectivePriceSync || !activeWarehouse) {
        productPayload.sale_price = formData.sale_price;
        productPayload.purchase_price = formData.purchase_price;
      }

      // Handle master stock quantity
      if (effectiveStockSync || !activeWarehouse) {
        productPayload.stock_quantity = formData.stock_quantity;
      }

      let savedProductId = productId;

      if (editingProduct) {
        const { error: pError } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', productId)
          .eq('tenant_id', currentTenant.id);

        if (pError) throw pError;
      } else {
        const { data: pData, error: pError } = await supabase
          .from('products')
          .insert([productPayload])
          .select()
          .single();

        if (pError) throw pError;
        savedProductId = pData.id;
      }

      // 3. Handle Warehouse Local Prices & Stock
      if (activeWarehouse) {
        const wsPayload: any = {
          tenant_id: currentTenant.id,
          warehouse_id: activeWarehouse.id,
          product_id: savedProductId
        };

        // Save local stock if sync is disabled
        if (!effectiveStockSync) {
          wsPayload.quantity = formData.stock_quantity;
        }

        // Save local prices if sync is disabled
        if (!effectivePriceSync) {
          wsPayload.sale_price = formData.sale_price;
          wsPayload.purchase_price = formData.purchase_price;
        }

        if (wsPayload.quantity !== undefined || wsPayload.sale_price !== undefined || wsPayload.purchase_price !== undefined) {
          const { error: wsError } = await supabase
            .from('warehouse_stock')
            .upsert(wsPayload, { onConflict: 'warehouse_id,product_id' });

          if (wsError) throw wsError;
        }
      }

      if (needsLabel && savedProductId) {
        try {
          const q = JSON.parse(localStorage.getItem('jetpos_label_queue') || '[]');
          if (!q.includes(savedProductId)) {
            q.push(savedProductId);
            localStorage.setItem('jetpos_label_queue', JSON.stringify(q));
          }
        } catch (e) { }
      }

      const oldStock = editingProduct ? (Number((editingProduct as any).stock_quantity) || 0) : 0;
      const newStock = Number(formData.stock_quantity) || 0;

      if (!editingProduct || oldStock !== newStock) {
        auditLog(
          currentTenant.id,
          editingProduct ? 'STOCK_CHANGE' : 'PRODUCT_CREATE',
          editingProduct
            ? `"${formData.name}" ürününün stoku güncellendi: ${oldStock} -> ${newStock}`
            : `Yeni ürün eklendi: "${formData.name}" (Başlangıç Stoku: ${newStock})`,
          {
            product_id: savedProductId,
            product_name: formData.name,
            old_stock: oldStock,
            new_stock: newStock,
            operator: activeEmployee ? `${activeEmployee.first_name} ${activeEmployee.last_name}` : 'Yönetici',
            warehouse_id: activeWarehouse?.id || null,
            warehouse_name: activeWarehouse?.name || 'Genel'
          }
        );
      }

      showToast(editingProduct ? "Ürün güncellendi" : "Yeni ürün eklendi");
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
    if (!confirm("Ürünü silmek istediğinize emin misiniz? (7 gün boyunca çöp kutusundan geri alınabilir)")) return;

    try {
      setLoading(true);
      const { error } = await supabase.from('products')
        .update({
          status: 'passive',
          deleted_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', currentTenant.id);

      if (error) throw error;

      showToast("Ürün çöp kutusuna taşındı", "info");
      await fetchData();
    } catch (error: any) {
      showToast("Silme hatası: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreProduct = async (id: string) => {
    if (!currentTenant) return;
    try {
      setLoading(true);
      const { error } = await supabase.from('products')
        .update({
          status: 'active',
          deleted_at: null
        })
        .eq('id', id)
        .eq('tenant_id', currentTenant.id);

      if (error) throw error;

      showToast("Ürün başarıyla geri yüklendi", "success");
      await fetchData();
    } catch (error: any) {
      showToast("Geri yükleme hatası: " + error.message, "error");
    } finally {
      setLoading(false);
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
        .eq('tenant_id', currentTenant.id)
        .is('deleted_at', null);

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

    // If modal is not open, open it
    if (!isClearAllModalOpen) {
      setIsClearAllModalOpen(true);
      setClearAllConfirmationText("");
      return;
    }

    // If modal is open, verify text
    if (clearAllConfirmationText !== "ONAYLIYORUM") {
      showToast("Lütfen 'ONAYLIYORUM' yazarak doğrula", "error");
      return;
    }

    try {
      setLoading(true);
      setIsClearAllModalOpen(false);

      // 1. Delete Warehouse Stock (references products and warehouses)
      const { error: wsError } = await supabase.from('warehouse_stock').delete().eq('tenant_id', currentTenant.id);
      if (wsError) console.warn("Warehouse stock delete error:", wsError.message);

      // 2. Delete Warehouse Transfers & Items (items CASCADE from transfers)
      const { error: wtError } = await supabase.from('warehouse_transfers').delete().eq('tenant_id', currentTenant.id);
      if (wtError) console.warn("Warehouse transfers delete error:", wtError.message);

      // 3. Delete Inventory Counts & Items (items CASCADE from counts)
      const { error: icError } = await supabase.from('inventory_counts').delete().eq('tenant_id', currentTenant.id);
      if (icError) console.warn("Inventory counts delete error:", icError.message);

      // 4. Delete Logs
      await supabase.from('price_change_logs').delete().eq('tenant_id', currentTenant.id);
      await supabase.from('product_change_logs').delete().eq('tenant_id', currentTenant.id);

      // 5. Delete Sale Items and Sales
      const { error: siError } = await supabase.from('sale_items').delete().eq('tenant_id', currentTenant.id);
      if (siError) console.warn("Sale items delete error:", siError.message);

      const { error: sError } = await supabase.from('sales').delete().eq('tenant_id', currentTenant.id);
      if (sError) console.warn("Sales delete error:", sError.message);

      // 6. Delete External Mappings
      const { error: emError } = await supabase.from('external_mappings').delete().eq('tenant_id', currentTenant.id);
      if (emError) console.warn("External mappings delete error:", emError.message);

      // 7. Finally delete products
      const { error: productsError } = await supabase.from('products')
        .delete()
        .eq('tenant_id', currentTenant.id);

      if (productsError) throw productsError;

      // Log critical action
      auditLog(currentTenant.id, 'DATABASE_RESET', 'Tüm ürünler ve satış verileri sıfırlandı');

      showToast("Tüm veri tabanı başarıyla sıfırlandı", "info");
      await fetchData();
    } catch (error: any) {
      console.error("Clear all products error:", error);
      showToast("Sıfırlama başarısız: " + error.message, "error");
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
          const normPatterns = patterns.map(p => p.toLowerCase().replace(/[^a-zçğıöşü0-9]/g, ''));
          for (const key of keys) {
            const normKey = key.toLowerCase().replace(/[^a-zçğıöşü0-9]/g, '');
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

        let barcode = String(findValue(item, ["Barkod", "Stok_Kodu", "Stok Kodu", "Barkod No", "Barcode", "SKU"]) || "");
        if (!barcode || barcode.trim() === "") barcode = `AUTO-${Date.now()}-${Math.floor(Math.random() * 10000000)}`;

        let name = findValue(item, ["Adi_1", "Adi1", "Ürün Adı", "Ürün", "Adı", "Name", "Açıklama", "Product"]);
        if (!name) name = item["ADI"] || item["CISIM_ADI"] || (barcode !== "" ? `Ürün ${barcode}` : "İsimsiz Ürün");

        const purchase_price = parseNum(findValue(item, ["Alis_Fiyati", "Alış_Fiyatı", "Maliyet", "Cost", "Alış"]));
        let external_price = parseNum(findValue(item, ["Trendyol_Satış_Fiyatı", "Trendyol Satış Fiyatı", "Trendyol_Fiyatı", "Trendyol Satış", "Trendyol Fiyat", "Pazar Yeri Fiyatı", "Online Fiyat", "External Price"]));
        let sale_price = parseNum(findValue(item, ["Piyasa_Satış_Fiyatı", "Piyasa Satış Fiyatı", "Fiyati", "Satış Fiyatı", "Fiyat", "Price", "Etiket"]));

        // Eğer dükkan fiyatı 0 ve Trendyol fiyatı varsa, dükkan fiyatına da onu yaz (User preference)
        if (sale_price <= 0 && external_price > 0) {
          sale_price = external_price;
        }

        const stock_quantity = parseNum(findValue(item, ["Stok", "Stok Adedi", "Stok Miktarı", "Miktar", "Adet", "Mevcut", "Quantity", "Qty", "Bakiye"]));
        const vat_rate = Math.round(parseNum(findValue(item, ["KDV", "Kdv Oranı", "VAT", "Tax"]) || 0));

        return {
          barcode: String(barcode).trim(),
          name: String(name).trim(),
          purchase_price,
          sale_price,
          external_price: external_price || 0,
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

  const handleCheckout = async (cartItems: any[], paymentMethod: string, customerId?: string) => {
    if (!currentTenant) return;

    const totalAmount = cartItems.reduce((sum, item) => sum + (item.sale_price * item.quantity), 0);
    const totalCost = cartItems.reduce((sum, item) => sum + (item.purchase_price * item.quantity), 0);
    const saleId = Math.random().toString(36).substr(2, 9).toUpperCase();

    // Check if online
    if (!SyncService.isOnline()) {
      showToast("İnternet yok! Satış yerel hafızaya kaydedildi.", "warning");
      await offlineDB.pending_sales.add({
        uuid: crypto.randomUUID(),
        tenant_id: currentTenant.id,
        warehouse_id: activeWarehouse?.id || '',
        employee_id: activeEmployee?.id || '',
        customer_id: customerId,
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.sale_price,
          total_price: item.sale_price * item.quantity
        })),
        total_amount: totalAmount,
        discount_amount: 0,
        payment_type: paymentMethod,
        created_at: new Date().toISOString(),
        sync_status: 'pending'
      });
      return;
    }

    try {
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([{
          total_amount: totalAmount,
          total_profit: totalAmount - totalCost,
          payment_method: paymentMethod,
          tenant_id: currentTenant!.id,
          customer_id: customerId || null
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

      // --- CRM ENTEGRASYONU (VERESİYE) ---
      if (paymentMethod === "VERESİYE" && customerId) {
        const { error: cariError } = await supabase
          .from('cari_hareketler')
          .insert([{
            tenant_id: currentTenant!.id,
            cari_id: customerId,
            hareket_tipi: 'SATIS',
            tarih: new Date().toISOString(),
            belge_no: `POS-${sale.id}`,
            aciklama: `${cartItems.length} kalem ürün satışı (Veresiye)`,
            borc: totalAmount,
            alacak: 0,
            para_birimi: 'TRY'
          }]);

        if (cariError) console.error("Cari hareket kaydı hatası:", cariError);
      }
      // -----------------------------------

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
        // Prepare RPC parameters
        const rpcParams: any = {
          p_product_id: item.id,
          p_qty: item.quantity
        };

        // If warehouse stock deduction is enabled and a warehouse is active, pass the warehouse ID
        // BUT ONLY IF stock sync is disabled.
        if (isWarehouseStockDeductionEnabled && activeWarehouse && !isStockSyncEnabled) {
          rpcParams.p_warehouse_id = activeWarehouse.id;
        }

        const { error: rpcError } = await sb.rpc('decrement_stock', rpcParams);

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
                // Fiyatı Trendyol'dan Çekerek Güncelle (Fiyat Farklılığı Koruması)
                trendyolClient.getProductByBarcode(mapping.external_sku)
                  .then((extProduct: any) => {
                    // Eğer ürün bulunduysa, Trendyol'daki kendi fiyatını gönder
                    const syncPrice = extProduct ? extProduct.sellingPrice : item.sale_price;
                    return trendyolClient.updateStock(mapping.external_sku, newQty, syncPrice);
                  })
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
                // Log removed for security
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

      // Log successful sale - fire and forget, hata fırlatmasın
      auditLog(currentTenant.id, 'SALE_COMPLETED', `${totalAmount} TL tutarında ${paymentMethod} satışı tamamlandı`, {
        sale_id: sale.id,
        item_count: cartItems.length,
        payment_method: paymentMethod
      });
    } catch (error: any) {
      showToast(error.message, "error");
    }
  };

  // Normal App Rendering Logic (Wrapped to maintain Hook order)
  const isEmployeeLoginEnabled = currentTenant?.features?.employee_login === true && currentTenant?.features?.kds !== true;
  const isAdmin = currentTenant?.license_key === 'ADM257SA67';

  if (!currentTenant && !tenantLoading) {
    return <LicenseGate onSuccess={() => window.location.reload()} />;
  }

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

  // If setup is not completed, block everything and show wizard
  if (currentTenant && currentTenant.setup_completed === false) {
    return <SetupWizard />;
  }

  if (isEmployeeLoginEnabled && !activeEmployee) {
    return <EmployeePinLogin />;
  }

  const isKitchenStaff = activeEmployee?.role === 'Kitchen' || activeEmployee?.role === 'Mutfak' || activeEmployee?.position === 'Mutfak';

  return (
    <div className={`flex min-h-screen bg-background text-foreground theme-${theme}`}>
      <StoreSelectionOverlay />
      {!isKitchenStaff && (
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setIsMobileSidebarOpen(false); // Sekme seçince menüyü kapat
          }}
          showHelpIcons={showHelpIcons}
          showToast={showToast}
          isMobileOpen={isMobileSidebarOpen}
        />
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <main className="flex-1 overflow-y-auto max-h-screen relative flex flex-col min-w-0">
        <TopBar activeTab={activeTab} onMenuClick={() => !isKitchenStaff && setIsMobileSidebarOpen(!isMobileSidebarOpen)} />

        <div className="responsive-container pt-3 pb-12 flex-1 flex flex-col min-h-0">
          {activeTab === "home" && (
            <HomePage 
              onNavigate={setActiveTab} 
              dailyTransactions={saleItems.filter(item => {
                const today = new Date();
                const itemDate = new Date(item.created_at);
                return itemDate.getDate() === today.getDate() && itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear();
              }).length}
              todaySalesTotal={saleItems.filter(item => {
                const today = new Date();
                const itemDate = new Date(item.created_at);
                return itemDate.getDate() === today.getDate() && itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear();
              }).reduce((sum, item) => sum + ((Number(item.quantity) * Number(item.unit_price)) || 0), 0)}
              criticalStockCount={products.filter((p: any) => Number(p.stock_quantity) <= lowStockThreshold).length}
              activeUsersCount={activeEmployee ? 1 : 1}
              saleItems={saleItems}
              products={products}
            />
          )}

          {activeTab === "dashboard" && (
            <div className="space-y-10 max-w-[1500px] mx-auto w-full">

              <SummaryCards
                totalItems={stats.totalItems}
                totalStock={stats.totalStock}
                totalStockKg={stats.totalStockKg}
                totalStockValue={stats.totalCost}
                totalStockValueSale={stats.totalValue}
                potentialProfit={stats.potentialProfit}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2">
                  <SalesChart sales={saleItems.map(item => ({
                    created_at: item.created_at,
                    total_amount: item.quantity * item.unit_price
                  }))} />
                </div>
                <div>
                  <QuickStockAlerts products={products} saleItems={saleItems} onViewAll={() => setActiveTab('alerts')} lowStockThreshold={lowStockThreshold} />
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
                  onEdit={(p: any) => {
                    const wsData = p.warehouse_stock?.find((ws: any) => ws.warehouse_id === activeWarehouse?.id);
                    const contextProduct = {
                      ...p,
                      sale_price: (!isPriceSyncEnabled && wsData?.sale_price !== null && wsData?.sale_price !== undefined) ? wsData.sale_price : p.sale_price,
                      purchase_price: (!isPriceSyncEnabled && wsData?.purchase_price !== null && wsData?.purchase_price !== undefined) ? wsData.purchase_price : p.purchase_price,
                      stock_quantity: activeWarehouse ? (wsData?.quantity || 0) : (p.stock_quantity || 0)
                    };
                    setEditingProduct(contextProduct);
                    setIsModalOpen(true);
                  }}
                  onDelete={handleDelete}
                  onAdd={(data?: any) => { setEditingProduct(data && !data.nativeEvent ? data : null); setIsModalOpen(true); }}
                  onManageCategories={() => setIsCatModalOpen(true)}
                  onBulkImport={handleBulkImport}
                  onClearAll={handleClearAllProducts}
                  onToggleAllCampaign={handleToggleAllCampaign}
                  campaignRate={campaignRate}
                  onRefresh={fetchData}
                  showToast={showToast}
                  isPriceSyncEnabled={activeWarehouse?.platform ? false : isPriceSyncEnabled}
                  isStockSyncEnabled={activeWarehouse?.platform ? false : isStockSyncEnabled}
                  lowStockThreshold={lowStockThreshold}
                />
              </section>
            </div>
          )}

          {activeTab === "pos" && (
            <div className="max-w-[1500px] mx-auto w-full flex-1 flex flex-col min-h-0 relative">
              {(isEmployeeLoginEnabled && !isPOSAuthorized) ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <EmployeePinLogin
                    isModal
                    onSuccess={() => setIsPOSAuthorized(true)}
                    onCancel={() => setActiveTab('home')}
                  />
                </div>
              ) : (
                <POS
                  products={products.filter((p: any) => p.status === 'active' || (p.is_active !== false && p.status !== 'passive'))}
                  categories={categories}
                  onCheckout={handleCheckout}
                  showToast={showToast}
                  campaignRate={campaignRate}
                  theme={theme}
                  setTheme={setTheme}
                  isBeepEnabled={isBeepEnabled}
                  isPriceSyncEnabled={isPriceSyncEnabled}
                  isStockSyncEnabled={isStockSyncEnabled}
                  isCashDrawerEnabled={isCashDrawerEnabled}
                  cashDrawerPrinterName={cashDrawerPrinterName}
                  receiptPrinterName={receiptPrinterName}
                  labelPrinterName={labelPrinterName}
                  setActiveTab={setActiveTab}
                  initialCart={adisyonCart}
                  onCartCleared={() => setAdisyonCart([])}
                  onRefresh={fetchData}
                  receiptSettings={receiptSettings}
                />
              )}
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
                isPriceSyncEnabled={isPriceSyncEnabled}
                setIsPriceSyncEnabled={setIsPriceSyncEnabled}
                isStockSyncEnabled={isStockSyncEnabled}
                setIsStockSyncEnabled={setIsStockSyncEnabled}
                isWarehouseStockDeductionEnabled={isWarehouseStockDeductionEnabled}
                setIsWarehouseStockDeductionEnabled={setIsWarehouseStockDeductionEnabled}
                isCashDrawerEnabled={isCashDrawerEnabled}
                setIsCashDrawerEnabled={setIsCashDrawerEnabled}
                cashDrawerPrinterName={cashDrawerPrinterName}
                setCashDrawerPrinterName={setCashDrawerPrinterName}
                receiptPrinterName={receiptPrinterName}
                setReceiptPrinterName={setReceiptPrinterName}
                labelPrinterName={labelPrinterName}
                setLabelPrinterName={setLabelPrinterName}
                isAdisyonStoreSpecificEnabled={isAdisyonStoreSpecificEnabled}
                setIsAdisyonStoreSpecificEnabled={setIsAdisyonStoreSpecificEnabled}
                isAdisyonAutoOpenReservationEnabled={isAdisyonAutoOpenReservationEnabled}
                setIsAdisyonAutoOpenReservationEnabled={setIsAdisyonAutoOpenReservationEnabled}
                currentTenant={currentTenant}
                showToast={showToast}
                lowStockThreshold={lowStockThreshold}
                setLowStockThreshold={setLowStockThreshold}
                receiptSettings={receiptSettings}
                setReceiptSettings={setReceiptSettings}
                cfdSettings={cfdSettings}
                setCfdSettings={setCfdSettings}
              />
            </div>
          )}

          {activeTab === "products" && (
            <div className="max-w-[1500px] mx-auto w-full">
              <ProductTable
                products={products}
                categories={categories}
                onEdit={(p: any) => {
                  const wsData = p.warehouse_stock?.find((ws: any) => ws.warehouse_id === activeWarehouse?.id);
                  const contextProduct = {
                    ...p,
                    sale_price: (!isPriceSyncEnabled && wsData?.sale_price !== null && wsData?.sale_price !== undefined) ? wsData.sale_price : p.sale_price,
                    purchase_price: (!isPriceSyncEnabled && wsData?.purchase_price !== null && wsData?.purchase_price !== undefined) ? wsData.purchase_price : p.purchase_price,
                    stock_quantity: activeWarehouse ? (wsData?.quantity || 0) : (p.stock_quantity || 0)
                  };
                  setEditingProduct(contextProduct);
                  setIsModalOpen(true);
                }}
                onDelete={handleDelete}
                onAdd={(data?: any) => { setEditingProduct(data && !data.nativeEvent ? data : null); setIsModalOpen(true); }}
                onManageCategories={() => setIsCatModalOpen(true)}
                onBulkImport={handleBulkImport}
                onClearAll={handleClearAllProducts}
                onToggleAllCampaign={handleToggleAllCampaign}
                campaignRate={campaignRate}
                onRefresh={fetchData}
                showToast={showToast}
                isPriceSyncEnabled={isPriceSyncEnabled}
                isStockSyncEnabled={isStockSyncEnabled}
                lowStockThreshold={lowStockThreshold}
                onViewChangeLogs={() => setActiveTab("product-logs")}
                onArchive={handleArchiveProduct}
                onBulkArchive={handleBulkArchive}
                onBulkArchiveByBarcode={handleBulkArchiveByBarcode}
                allProducts={products}
              />
            </div>
          )}

          {activeTab === "expenses" && (
            <div className="max-w-[1500px] mx-auto w-full">
              <Expenses />
            </div>
          )}
          {activeTab === "qrmenu" && (
            <div className="max-w-[1500px] mx-auto w-full">
              <QRMenuManager
                products={products}
                categories={categories}
                showToast={showToast}
                onRefresh={fetchData}
              />
            </div>
          )}
          {activeTab === "showcase" && (
            <div className="max-w-[1500px] mx-auto w-full">
              <ShowcaseManager
                products={products}
                categories={categories}
                showToast={showToast}
                onRefresh={fetchData}
              />
            </div>
          )}
          {activeTab === "adisyon" && (
            <div className="max-w-[1500px] mx-auto w-full flex-1 flex flex-col min-h-0">
              <Adisyon
                products={products}
                categories={categories}
                showToast={showToast}
                onCheckout={handleCheckout}
                isCashDrawerEnabled={isCashDrawerEnabled}
                cashDrawerPrinterName={cashDrawerPrinterName}
              />
            </div>
          )}
          {activeTab === "kds" && (
            <div className="max-w-[1500px] mx-auto w-full flex-1 flex flex-col min-h-0">
              <JetKDS showToast={showToast} />
            </div>
          )}
          {activeTab === "calculator" && (
            <div className="max-w-[1500px] mx-auto w-full">
              <ProfitCalculator
                products={products}
                onRefresh={fetchData}
                showToast={showToast}
              />
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
          {activeTab === "trash" && (
            <div className="max-w-[1500px] mx-auto w-full space-y-6">
              <div className="flex items-center space-x-4 mb-2">
                <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Çöp Kutusu</h2>
                  <p className="text-sm text-secondary">Silinen ürünler 7 gün boyunca burada saklanır ve geri yüklenebilir.</p>
                </div>
              </div>

              <ProductTable
                products={trashProducts}
                isTrashMode={true}
                onRestore={handleRestoreProduct}
                onDelete={async (id: string) => {
                  if (confirm("BU ÜRÜNÜ KALICI OLARAK SİLMEK İSTEDİĞİNİZDEN EMİN MİSİNİZ? Bu işlem geri alınamaz.")) {
                    const { error } = await supabase.from('products').delete().eq('id', id).eq('tenant_id', currentTenant?.id);
                    if (!error) {
                      showToast("Ürün kalıcı olarak silindi", "info");
                      fetchTrashProducts();
                    }
                  }
                }}
                onRefresh={fetchTrashProducts}
                showToast={showToast}
              />
            </div>
          )}
          {activeTab === "archive" && (
            <div className="max-w-[1500px] mx-auto w-full space-y-6">
              <div className="flex items-center space-x-4 mb-2">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
                  <Archive className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Arşiv</h2>
                  <p className="text-sm text-secondary">Arşivlenen ürünler burada süresiz saklanır. İstediğiniz zaman geri çıkarabilirsiniz.</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl">
                    {archiveProducts.length} ÜRÜN
                  </span>
                </div>
              </div>

              <ProductTable
                products={archiveProducts}
                categories={categories}
                isArchiveMode={true}
                onUnarchive={handleUnarchiveProduct}
                onArchive={handleArchiveProduct}
                onBulkArchive={handleBulkArchive}
                onBulkArchiveByBarcode={handleBulkArchiveByBarcode}
                onEdit={(p: any) => {
                  setEditingProduct(p);
                  setIsModalOpen(true);
                }}
                onDelete={handleDelete}
                onAdd={() => { }}
                onManageCategories={() => setIsCatModalOpen(true)}
                onBulkImport={handleBulkImport}
                onToggleAllCampaign={handleToggleAllCampaign}
                campaignRate={campaignRate}
                onRefresh={fetchData}
                showToast={showToast}
                allProducts={products}
                hideFilters={false}
              />
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
          {activeTab === "profit_pilot" && (
            <div className="max-w-[1500px] mx-auto w-full">
              <ProfitPilot />
            </div>
          )}
          {activeTab === "basket_offers" && (
            <div className="max-w-[1500px] mx-auto w-full">
              <SmartBasket />
            </div>
          )}
          {activeTab === "dead_stock" && (
            <div className="max-w-[1500px] mx-auto w-full">
              <StockBuster />
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
          {activeTab === "warehouse" && (
            <div className="max-w-[1500px] mx-auto w-full">
              <WarehousePage />
            </div>
          )}
          {activeTab === "audit_logs" && (
            <div className="max-w-[1500px] mx-auto w-full">
              <AuditLogs />
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

          {/* CRM & Sadakat Sayfaları */}
          {activeTab.startsWith("crm_") && (
            <div className="max-w-[1500px] mx-auto w-full">
              <CRMPage pageId={activeTab} onTabChange={setActiveTab} showToast={showToast} />
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
              <ProductLabelDesigner products={products} showToast={showToast} printerName={labelPrinterName || receiptPrinterName} isPriceSyncEnabled={isPriceSyncEnabled} />
            </div>
          )}

          {/* Universal Converter - Akıllı Dönüştürücü (Görsel, PDF, Word) */}
          {activeTab === "universal_converter" && (
            <div className="max-w-[1500px] mx-auto w-full">
              <UniversalConverter />
            </div>
          )}

          {/* QR Code Generator - QR Kod Oluşturucu */}
          {activeTab === "qr_generator" && (
            <div className="max-w-[1500px] mx-auto w-full">
              <QRCodeGenerator />
            </div>
          )}

          {/* Currency Converter - Döviz Çevirici */}
          {activeTab === "currency_converter" && (
            <div className="max-w-[1500px] mx-auto w-full">
              <CurrencyConverter />
            </div>
          )}

          {/* Fiş Düzenleyicisi */}
          {activeTab === "receipt_designer" && (
            <div className="max-w-[1500px] mx-auto w-full">
              <ReceiptDesigner
                receiptSettings={receiptSettings}
                setReceiptSettings={setReceiptSettings}
                showToast={showToast}
              />
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
                        onAdd={(data?: any) => { setEditingProduct(data && !data.nativeEvent ? data : null); setIsModalOpen(true); }}
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


          {activeTab === "cfd" && (
            <div className="max-w-[1500px] mx-auto w-full">
              <CFDManager
                settings={cfdSettings}
                onUpdate={setCfdSettings}
                showToast={showToast}
                currentTenant={currentTenant}
              />
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

      {/* Danger Zone: Clear All Products Modal */}
      <AnimatePresence>
        {isClearAllModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card max-w-lg w-full !p-0 overflow-hidden border-rose-500/30 shadow-[0_0_50px_rgba(244,63,94,0.2)]"
            >
              {/* Header */}
              <div className="bg-rose-500/10 p-6 border-b border-rose-500/20 flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                  <ShieldAlert className="text-white w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-widest uppercase">TEHLİKELİ ALAN</h2>
                  <p className="text-[10px] font-bold text-rose-500 tracking-[0.2em] uppercase">Tüm Veritabanını Sıfırla</p>
                </div>
                <button
                  onClick={() => setIsClearAllModalOpen(false)}
                  className="ml-auto p-2 text-secondary hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10">
                    <p className="text-sm font-bold text-rose-200/80 leading-relaxed">
                      Bu işlem sonucunda aşağıdaki tüm veriler <span className="text-rose-500 font-black underline">KALICI OLARAK SİLİNECEKTİR</span>:
                    </p>
                    <ul className="mt-4 space-y-2">
                      {[
                        "Tüm Ürün Kartları ve Barkodlar",
                        "Tüm Depo Stokları ve Fiyatlar",
                        "Tüm Satış Geçmişi ve Raporlar",
                        "Tüm Stok Transferleri ve Sayımlar",
                        "Fiyat ve Ürün Değişiklik Günlükleri"
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-xs font-bold text-secondary">
                          <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-secondary tracking-widest uppercase">
                      Devam etmek için aşağıdaki kutuya <span className="text-rose-500">ONAYLIYORUM</span> yazın:
                    </label>
                    <input
                      autoFocus
                      type="text"
                      value={clearAllConfirmationText || ""}
                      onChange={(e) => setClearAllConfirmationText(e.target.value.toUpperCase())}
                      placeholder="ONAYLIYORUM"
                      className="w-full bg-black/40 border-2 border-rose-500/20 focus:border-rose-500/50 rounded-2xl p-4 text-center font-black tracking-[4px] text-rose-500 outline-none transition-all placeholder:opacity-20"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setIsClearAllModalOpen(false)}
                    className="py-4 bg-white/5 hover:bg-white/10 text-secondary font-black rounded-2xl transition-all uppercase tracking-widest text-xs"
                  >
                    Vazgeç
                  </button>
                  <button
                    disabled={clearAllConfirmationText !== "ONAYLIYORUM" || loading}
                    onClick={handleClearAllProducts}
                    className={`py-4 flex items-center justify-center gap-2 rounded-2xl font-black transition-all uppercase tracking-widest text-xs shadow-lg ${clearAllConfirmationText === "ONAYLIYORUM"
                      ? 'bg-rose-500 text-white shadow-rose-500/20 active:scale-95'
                      : 'bg-rose-500/10 text-rose-500/30 cursor-not-allowed border border-rose-500/10'
                      }`}
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Trash2 size={16} />
                        Verileri Yok Et
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
