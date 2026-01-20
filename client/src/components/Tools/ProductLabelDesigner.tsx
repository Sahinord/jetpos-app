"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
    Tag, Printer, Eye, Settings,
    Move, Palette, Package,
    Building2, RotateCcw, Layers, Upload
} from "lucide-react";
import JsBarcode from "jsbarcode";
import { useTenant } from "@/lib/tenant-context";

interface Product {
    id: string;
    name: string;
    barcode: string;
    sale_price: number;
    purchase_price: number;
    vat_rate: number;
}

interface ElementPosition {
    x: number;
    y: number;
}

interface LabelTemplate {
    id: string;
    name: string;
    width: number;
    height: number;
    showBarcode: boolean;
    showPrice: boolean;
    showName: boolean;
    showVat: boolean;
    showCompanyName: boolean;
    showLogo: boolean;
    fontSize: number;
    priceFontSize: number;
    barcodeHeight: number;
    padding: number;
    logoPosition?: ElementPosition;
    companyPosition?: ElementPosition;
    namePosition?: ElementPosition;
    barcodePosition?: ElementPosition;
    pricePosition?: ElementPosition;
}

const templates: LabelTemplate[] = [
    {
        id: 'standard',
        name: 'Standart (50x30mm)',
        width: 50,
        height: 30,
        showBarcode: true,
        showPrice: true,
        showName: true,
        showVat: false,
        showCompanyName: false,
        showLogo: false,
        fontSize: 6,
        priceFontSize: 10,
        barcodeHeight: 15,
        padding: 1.5,
        namePosition: { x: 50, y: 12 },
        barcodePosition: { x: 50, y: 50 },
        pricePosition: { x: 50, y: 85 }
    },
    {
        id: 'mini',
        name: 'Mini (40x20mm)',
        width: 40,
        height: 20,
        showBarcode: true,
        showPrice: true,
        showName: false,
        showVat: false,
        showCompanyName: false,
        showLogo: false,
        fontSize: 5,
        priceFontSize: 8,
        barcodeHeight: 10,
        padding: 1,
        barcodePosition: { x: 50, y: 35 },
        pricePosition: { x: 50, y: 80 }
    },
    {
        id: 'large',
        name: 'Büyük (80x50mm)',
        width: 80,
        height: 50,
        showBarcode: true,
        showPrice: true,
        showName: true,
        showVat: true,
        showCompanyName: true,
        showLogo: true,
        fontSize: 8,
        priceFontSize: 14,
        barcodeHeight: 25,
        padding: 2,
        logoPosition: { x: 15, y: 10 },
        companyPosition: { x: 60, y: 12 },
        namePosition: { x: 50, y: 30 },
        barcodePosition: { x: 50, y: 55 },
        pricePosition: { x: 50, y: 88 }
    },
    {
        id: 'premium',
        name: 'Premium (70x40mm)',
        width: 70,
        height: 40,
        showBarcode: true,
        showPrice: true,
        showName: true,
        showVat: false,
        showCompanyName: true,
        showLogo: true,
        fontSize: 7,
        priceFontSize: 12,
        barcodeHeight: 18,
        padding: 1.5,
        logoPosition: { x: 15, y: 12 },
        companyPosition: { x: 65, y: 15 },
        namePosition: { x: 50, y: 35 },
        barcodePosition: { x: 50, y: 60 },
        pricePosition: { x: 50, y: 88 }
    },
    {
        id: 'price-only',
        name: 'Sadece Fiyat (30x20mm)',
        width: 30,
        height: 20,
        showBarcode: false,
        showPrice: true,
        showName: false,
        showVat: false,
        showCompanyName: false,
        showLogo: false,
        fontSize: 6,
        priceFontSize: 12,
        barcodeHeight: 0,
        padding: 1,
        pricePosition: { x: 50, y: 50 }
    }
];

export default function ProductLabelDesigner({ products, showToast }: { products: Product[], showToast: any }) {
    const { currentTenant } = useTenant();
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<LabelTemplate>(templates[0]);
    const [customTemplate, setCustomTemplate] = useState<LabelTemplate | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [labelCount, setLabelCount] = useState<Record<string, number>>({});
    const [customBrandName, setCustomBrandName] = useState("");
    const [customLogo, setCustomLogo] = useState("");
    const [draggingElement, setDraggingElement] = useState<string | null>(null);
    const printAreaRef = useRef<HTMLDivElement>(null);
    const labelPreviewRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeTemplate = customTemplate || selectedTemplate;
    const brandName = customBrandName || currentTenant?.company_name || "JetPos";
    const logoUrl = customLogo || currentTenant?.logo_url || "";

    const filteredProducts = useMemo(() =>
        products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.barcode.toLowerCase().includes(searchTerm.toLowerCase())
        ), [products, searchTerm]
    );

    const selectedProductsData = useMemo(() =>
        selectedProducts
            .map(id => products.find(p => p.id === id))
            .filter(Boolean) as Product[]
        , [selectedProducts, products]);

    const previewProduct = useMemo(() => selectedProductsData[0], [selectedProductsData]);

    const generateBarcode = useCallback((barcode: string, elementId: string) => {
        try {
            const canvas = document.getElementById(elementId) as HTMLCanvasElement;
            if (canvas && barcode) {
                JsBarcode(canvas, barcode, {
                    format: "CODE128",
                    width: 1.5,
                    height: activeTemplate.barcodeHeight,
                    displayValue: true,
                    fontSize: activeTemplate.fontSize - 2,
                    margin: 0,
                    textMargin: 1
                });
            }
        } catch (error) {
            console.error("Barcode generation error:", error);
        }
    }, [activeTemplate.barcodeHeight, activeTemplate.fontSize]);

    useEffect(() => {
        if (previewMode && previewProduct?.barcode && activeTemplate.showBarcode) {
            const timer = setTimeout(() => {
                generateBarcode(previewProduct.barcode, 'preview-barcode');
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [previewMode, previewProduct, activeTemplate.showBarcode, generateBarcode]);

    const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast("Lütfen bir resim dosyası seçin", "error");
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            showToast("Dosya boyutu 2MB'dan küçük olmalı", "error");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            setCustomLogo(result);
            showToast("Logo yüklendi", "success");
        };
        reader.onerror = () => {
            showToast("Logo yüklenirken hata oluştu", "error");
        };
        reader.readAsDataURL(file);
    }, [showToast]);

    const handleProductSelect = useCallback((productId: string) => {
        setSelectedProducts(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );

        setLabelCount(prev => ({
            ...prev,
            [productId]: prev[productId] || 1
        }));
    }, []);

    const handleSelectAll = useCallback(() => {
        const filtered = filteredProducts.map(p => p.id);
        if (selectedProducts.length === filtered.length) {
            setSelectedProducts([]);
            setLabelCount({});
        } else {
            setSelectedProducts(filtered);
            const newCounts: Record<string, number> = {};
            filtered.forEach(id => newCounts[id] = 1);
            setLabelCount(newCounts);
        }
    }, [filteredProducts, selectedProducts.length]);

    const updateLabelCount = useCallback((productId: string, delta: number) => {
        setLabelCount(prev => ({
            ...prev,
            [productId]: Math.max(1, Math.min(100, (prev[productId] || 1) + delta))
        }));
    }, []);

    const handleDragStart = useCallback((e: React.MouseEvent, element: string) => {
        if (!editMode) return;
        e.preventDefault();
        setDraggingElement(element);
    }, [editMode]);

    const handleDragMove = useCallback((e: React.MouseEvent) => {
        if (!draggingElement || !labelPreviewRef.current) return;

        const rect = labelPreviewRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setCustomTemplate(prev => ({
            ...(prev || selectedTemplate),
            [`${draggingElement}Position`]: { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
        }));
    }, [draggingElement, selectedTemplate]);

    const handleDragEnd = useCallback(() => {
        setDraggingElement(null);
    }, []);

    const resetPositions = useCallback(() => {
        setCustomTemplate(null);
        showToast("Pozisyonlar sıfırlandı", "success");
    }, [showToast]);

    const handlePrint = () => {
        if (selectedProducts.length === 0) {
            showToast("Lütfen en az bir ürün seçin", "warning");
            return;
        }

        const printWindow = window.open('', '', 'width=800,height=600');
        if (!printWindow) {
            showToast("Pop-up engelleyicinizi devre dışı bırakın", "error");
            return;
        }

        const labels = selectedProductsData.flatMap(product => {
            const count = labelCount[product.id] || 1;
            return Array.from({ length: count }).map((_, index) => ({
                product,
                index
            }));
        });

        const getPosition = (key: string) => activeTemplate[`${key}Position` as keyof LabelTemplate] as ElementPosition || { x: 50, y: 50 };

        printWindow.document.write(`
            <html>
                <head>
                    <title>${brandName} - Ürün Etiketleri</title>
                    <style>
                        @media print {
                            @page { margin: 5mm; size: auto; }
                            body { margin: 0; padding: 0; }
                            .no-break { page-break-inside: avoid; }
                        }
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { font-family: 'Arial', sans-serif; background: white; padding: 5mm; }
                        .label-grid { display: flex; flex-wrap: wrap; gap: 3mm; }
                        .label {
                            width: ${activeTemplate.width}mm;
                            height: ${activeTemplate.height}mm;
                            border: 1px solid #ddd;
                            padding: ${activeTemplate.padding}mm;
                            position: relative;
                            background: white;
                            overflow: hidden;
                        }
                        .element { position: absolute; transform: translate(-50%, -50%); }
                        .label-logo { width: ${activeTemplate.fontSize * 2}px; height: ${activeTemplate.fontSize * 2}px; object-fit: contain; }
                        .label-company { font-size: ${activeTemplate.fontSize - 1}px; font-weight: bold; color: #333; text-transform: uppercase; }
                        .label-name { 
                            font-size: ${activeTemplate.fontSize}px; 
                            font-weight: 600; 
                            color: #222;
                            text-align: center;
                            max-width: 90%;
                        }
                        .label-price { 
                            font-size: ${activeTemplate.priceFontSize}px; 
                            font-weight: 900; 
                            color: #000;
                            text-align: center;
                        }
                        .label-currency {
                            font-size: ${activeTemplate.priceFontSize - 4}px;
                            font-weight: 700;
                        }
                        canvas { max-width: 90%; height: auto; }
                    </style>
                </head>
                <body>
                    <div class="label-grid">
                        ${labels.map(({ product, index }) => {
            const logoPos = getPosition('logo');
            const companyPos = getPosition('company');
            const namePos = getPosition('name');
            const barcodePos = getPosition('barcode');
            const pricePos = getPosition('price');

            return `
                            <div class="label no-break">
                                ${activeTemplate.showLogo && logoUrl ? `
                                    <div class="element" style="left: ${logoPos.x}%; top: ${logoPos.y}%;">
                                        <img src="${logoUrl}" class="label-logo" alt="Logo" />
                                    </div>
                                ` : ''}
                                
                                ${activeTemplate.showCompanyName ? `
                                    <div class="element" style="left: ${companyPos.x}%; top: ${companyPos.y}%;">
                                        <div class="label-company">${brandName}</div>
                                    </div>
                                ` : ''}
                                
                                ${activeTemplate.showName ? `
                                    <div class="element" style="left: ${namePos.x}%; top: ${namePos.y}%;">
                                        <div class="label-name">${product.name}</div>
                                    </div>
                                ` : ''}
                                
                                ${activeTemplate.showBarcode && product.barcode ? `
                                    <div class="element" style="left: ${barcodePos.x}%; top: ${barcodePos.y}%;">
                                        <canvas id="print-barcode-${product.id}-${index}"></canvas>
                                    </div>
                                ` : ''}
                                
                                ${activeTemplate.showPrice ? `
                                    <div class="element" style="left: ${pricePos.x}%; top: ${pricePos.y}%;">
                                        <div class="label-price">${product.sale_price.toFixed(2)}<span class="label-currency">₺</span></div>
                                    </div>
                                ` : ''}
                            </div>
                        `}).join('')}
                    </div>
                    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
                    <script>
                        window.onload = function() {
                            ${labels.map(({ product, index }) =>
                activeTemplate.showBarcode && product.barcode ? `
                                    try {
                                        JsBarcode("#print-barcode-${product.id}-${index}", "${product.barcode}", {
                                            format: "CODE128",
                                            width: 1.5,
                                            height: ${activeTemplate.barcodeHeight},
                                            displayValue: true,
                                            fontSize: ${activeTemplate.fontSize - 2},
                                            margin: 0
                                        });
                                    } catch(e) { console.error(e); }
                                ` : ''
            ).join('\n')}
                            
                            setTimeout(() => {
                                window.print();
                                window.onafterprint = () => window.close();
                            }, 500);
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const getElementPosition = (key: string): ElementPosition => {
        return (activeTemplate[`${key}Position` as keyof LabelTemplate] as ElementPosition) || { x: 50, y: 50 };
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-widest uppercase flex items-center gap-3">
                        <Tag className="text-primary" />
                        ÜRÜN ETİKET TASARIMI
                    </h1>
                    <p className="text-secondary font-bold text-sm uppercase tracking-wider mt-1">
                        Sürükle-bırak ile özelleştir, yazdır
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setEditMode(!editMode)}
                        className={`px-6 py-3 rounded-xl font-black uppercase tracking-wider transition-all flex items-center gap-2 ${editMode
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-white/5 text-secondary hover:bg-white/10'
                            }`}
                    >
                        <Move size={20} />
                        {editMode ? 'Düzenleme Aktif' : 'Düzenle'}
                    </button>
                    <button
                        onClick={() => setPreviewMode(!previewMode)}
                        className={`px-6 py-3 rounded-xl font-black uppercase tracking-wider transition-all flex items-center gap-2 ${previewMode
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-white/5 text-secondary hover:bg-white/10'
                            }`}
                    >
                        <Eye size={20} />
                        Önizleme
                    </button>
                    <button
                        onClick={handlePrint}
                        disabled={selectedProducts.length === 0}
                        className="px-6 py-3 bg-primary hover:bg-primary/80 rounded-xl font-black uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Printer size={20} />
                        Yazdır ({selectedProducts.length})
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel: Settings */}
                <div className="space-y-4">
                    {/* Template Selection */}
                    <div className="glass-card">
                        <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
                            <Palette className="text-primary" />
                            <h3 className="font-black uppercase">Şablon</h3>
                        </div>
                        <div className="space-y-2">
                            {templates.map(template => (
                                <button
                                    key={template.id}
                                    onClick={() => {
                                        setSelectedTemplate(template);
                                        setCustomTemplate(null);
                                    }}
                                    className={`w-full p-3 rounded-xl border-2 transition-all text-left ${selectedTemplate.id === template.id && !customTemplate
                                        ? 'border-primary bg-primary/10'
                                        : 'border-border hover:border-border/50'
                                        }`}
                                >
                                    <p className="font-bold text-white text-sm">{template.name}</p>
                                    <p className="text-xs text-secondary mt-1">{template.width}x{template.height}mm</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Brand Customization */}
                    <div className="glass-card">
                        <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
                            <Building2 className="text-primary" />
                            <h3 className="font-black uppercase">Marka</h3>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-secondary uppercase mb-2">Marka Adı</label>
                                <input
                                    type="text"
                                    value={customBrandName}
                                    onChange={(e) => setCustomBrandName(e.target.value)}
                                    placeholder={currentTenant?.company_name || "Marka adı"}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-white placeholder-secondary/50 focus:outline-none focus:border-primary transition-all text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-secondary uppercase mb-2">Logo</label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full px-4 py-3 bg-primary/10 hover:bg-primary/20 border-2 border-primary/30 rounded-xl text-primary font-bold uppercase text-xs transition-all flex items-center justify-center gap-2"
                                >
                                    <Upload size={16} />
                                    PC'den Logo Yükle
                                </button>
                                {logoUrl && (
                                    <div className="mt-2 p-2 bg-white/5 rounded-lg flex items-center gap-2">
                                        <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                                        <span className="text-xs text-secondary flex-1 truncate">Logo yüklendi</span>
                                        <button
                                            onClick={() => setCustomLogo("")}
                                            className="text-rose-400 hover:text-rose-300 text-xs font-bold"
                                        >
                                            Kaldır
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Custom Settings */}
                    <div className="glass-card">
                        <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                            <div className="flex items-center gap-2">
                                <Settings className="text-primary" />
                                <h3 className="font-black uppercase">Özelleştir</h3>
                            </div>
                            {customTemplate && (
                                <button
                                    onClick={resetPositions}
                                    className="p-2 bg-white/5 hover:bg-rose-500/20 rounded-lg text-rose-400 transition-all"
                                    title="Sıfırla"
                                >
                                    <RotateCcw size={14} />
                                </button>
                            )}
                        </div>
                        <div className="space-y-3">
                            {[
                                { key: 'showBarcode', label: 'Barkod' },
                                { key: 'showPrice', label: 'Fiyat' },
                                { key: 'showName', label: 'Ürün Adı' },
                                { key: 'showVat', label: 'KDV' },
                                { key: 'showCompanyName', label: 'Firma' },
                                { key: 'showLogo', label: 'Logo' },
                            ].map(({ key, label }) => (
                                <div key={key} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                                    <span className="text-xs font-bold text-secondary uppercase">{label}</span>
                                    <button
                                        onClick={() => setCustomTemplate({
                                            ...(customTemplate || selectedTemplate),
                                            [key]: !activeTemplate[key as keyof LabelTemplate]
                                        })}
                                        className={`w-12 h-6 rounded-full relative transition-all ${activeTemplate[key as keyof LabelTemplate] ? 'bg-primary' : 'bg-white/10'
                                            }`}
                                    >
                                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${activeTemplate[key as keyof LabelTemplate] ? 'left-6' : 'left-0.5'
                                            }`} />
                                    </button>
                                </div>
                            ))}

                            <div>
                                <label className="block text-xs font-bold text-secondary uppercase mb-2">
                                    Yazı: {activeTemplate.fontSize}px
                                </label>
                                <input
                                    type="range"
                                    min="4"
                                    max="12"
                                    value={activeTemplate.fontSize}
                                    onChange={(e) => setCustomTemplate({
                                        ...(customTemplate || selectedTemplate),
                                        fontSize: parseInt(e.target.value)
                                    })}
                                    className="w-full accent-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-secondary uppercase mb-2">
                                    Fiyat: {activeTemplate.priceFontSize}px
                                </label>
                                <input
                                    type="range"
                                    min="6"
                                    max="18"
                                    value={activeTemplate.priceFontSize}
                                    onChange={(e) => setCustomTemplate({
                                        ...(customTemplate || selectedTemplate),
                                        priceFontSize: parseInt(e.target.value)
                                    })}
                                    className="w-full accent-primary"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Middle Panel: Product Selection */}
                <div className="glass-card">
                    <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                        <h3 className="font-black uppercase flex items-center gap-2">
                            <Package className="text-primary" />
                            Ürünler
                        </h3>
                        <button
                            onClick={handleSelectAll}
                            className="text-xs font-bold text-primary hover:underline uppercase"
                        >
                            {selectedProducts.length === filteredProducts.length ? 'Hiçbiri' : 'Tümü'}
                        </button>
                    </div>

                    <input
                        type="text"
                        placeholder="Ürün ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 bg-background border border-border rounded-xl text-white placeholder-secondary focus:outline-none focus:border-primary transition-all mb-4"
                    />

                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                        {filteredProducts.slice(0, 50).map(product => {
                            const isSelected = selectedProducts.includes(product.id);
                            const count = labelCount[product.id] || 1;

                            return (
                                <div
                                    key={product.id}
                                    className={`p-3 rounded-xl border-2 transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-border/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleProductSelect(product.id)}
                                            className="w-5 h-5 accent-primary cursor-pointer"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white text-sm truncate">{product.name}</p>
                                            <p className="text-xs text-secondary font-mono">{product.barcode}</p>
                                        </div>
                                        <p className="font-black text-primary text-sm">₺{product.sale_price.toFixed(2)}</p>
                                    </div>

                                    {isSelected && (
                                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                                            <span className="text-xs text-secondary font-bold uppercase">Adet:</span>
                                            <button
                                                onClick={() => updateLabelCount(product.id, -1)}
                                                className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-sm font-bold"
                                            >
                                                -
                                            </button>
                                            <span className="px-4 py-1 bg-primary/20 rounded font-bold text-sm">{count}</span>
                                            <button
                                                onClick={() => updateLabelCount(product.id, 1)}
                                                className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-sm font-bold"
                                            >
                                                +
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {filteredProducts.length > 50 && (
                            <p className="text-xs text-secondary text-center py-2">
                                +{filteredProducts.length - 50} ürün daha
                            </p>
                        )}
                    </div>
                </div>

                {/* Right Panel: Interactive Preview */}
                <div className="glass-card">
                    <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
                        <Layers className="text-primary" />
                        <h3 className="font-black uppercase">Önizleme & Editör</h3>
                    </div>

                    {!previewMode || !previewProduct ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Tag className="w-16 h-16 text-secondary/30 mb-4" />
                            <p className="text-secondary font-bold">Ürün seçin ve önizleme yapın</p>
                            <p className="text-xs text-secondary/60 mt-2">
                                {editMode ? 'Elementleri sürükleyin' : 'Düzenle butonu ile editör açılır'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {editMode && (
                                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-400">
                                    <Move className="w-4 h-4 inline mr-2" />
                                    <strong>Sürükle:</strong> Elementleri tıklayıp sürükleyin
                                </div>
                            )}

                            <div className="flex justify-center">
                                <div
                                    ref={labelPreviewRef}
                                    onMouseMove={handleDragMove}
                                    onMouseUp={handleDragEnd}
                                    onMouseLeave={handleDragEnd}
                                    style={{
                                        width: `${activeTemplate.width * 3}px`,
                                        height: `${activeTemplate.height * 3}px`,
                                        border: '2px solid #444',
                                        padding: `${activeTemplate.padding * 3}px`,
                                        position: 'relative',
                                        background: 'white',
                                        cursor: editMode ? 'crosshair' : 'default',
                                        userSelect: 'none'
                                    }}
                                >
                                    {activeTemplate.showLogo && logoUrl && (
                                        <div
                                            onMouseDown={(e) => handleDragStart(e, 'logo')}
                                            style={{
                                                position: 'absolute',
                                                left: `${getElementPosition('logo').x}%`,
                                                top: `${getElementPosition('logo').y}%`,
                                                transform: 'translate(-50%, -50%)',
                                                cursor: editMode ? 'move' : 'default',
                                                padding: '4px',
                                                border: editMode ? '2px dashed #667eea' : 'none',
                                                borderRadius: '4px'
                                            }}
                                        >
                                            <img src={logoUrl} alt="Logo" style={{ width: `${activeTemplate.fontSize * 6}px`, height: `${activeTemplate.fontSize * 6}px`, objectFit: 'contain' }} />
                                        </div>
                                    )}

                                    {activeTemplate.showCompanyName && (
                                        <div
                                            onMouseDown={(e) => handleDragStart(e, 'company')}
                                            style={{
                                                position: 'absolute',
                                                left: `${getElementPosition('company').x}%`,
                                                top: `${getElementPosition('company').y}%`,
                                                transform: 'translate(-50%, -50%)',
                                                fontSize: `${activeTemplate.fontSize * 2.5}px`,
                                                fontWeight: 'bold',
                                                color: '#333',
                                                cursor: editMode ? 'move' : 'default',
                                                padding: '4px',
                                                border: editMode ? '2px dashed #667eea' : 'none',
                                                borderRadius: '4px',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {brandName}
                                        </div>
                                    )}

                                    {activeTemplate.showName && (
                                        <div
                                            onMouseDown={(e) => handleDragStart(e, 'name')}
                                            style={{
                                                position: 'absolute',
                                                left: `${getElementPosition('name').x}%`,
                                                top: `${getElementPosition('name').y}%`,
                                                transform: 'translate(-50%, -50%)',
                                                fontSize: `${activeTemplate.fontSize * 2.5}px`,
                                                fontWeight: '600',
                                                color: '#222',
                                                textAlign: 'center',
                                                cursor: editMode ? 'move' : 'default',
                                                padding: '4px',
                                                border: editMode ? '2px dashed #667eea' : 'none',
                                                borderRadius: '4px',
                                                maxWidth: '90%'
                                            }}
                                        >
                                            {previewProduct.name}
                                        </div>
                                    )}

                                    {activeTemplate.showBarcode && previewProduct.barcode && (
                                        <div
                                            onMouseDown={(e) => handleDragStart(e, 'barcode')}
                                            style={{
                                                position: 'absolute',
                                                left: `${getElementPosition('barcode').x}%`,
                                                top: `${getElementPosition('barcode').y}%`,
                                                transform: 'translate(-50%, -50%)',
                                                cursor: editMode ? 'move' : 'default',
                                                padding: '4px',
                                                border: editMode ? '2px dashed #667eea' : 'none',
                                                borderRadius: '4px'
                                            }}
                                        >
                                            <canvas id="preview-barcode" />
                                        </div>
                                    )}

                                    {activeTemplate.showPrice && (
                                        <div
                                            onMouseDown={(e) => handleDragStart(e, 'price')}
                                            style={{
                                                position: 'absolute',
                                                left: `${getElementPosition('price').x}%`,
                                                top: `${getElementPosition('price').y}%`,
                                                transform: 'translate(-50%, -50%)',
                                                cursor: editMode ? 'move' : 'default',
                                                padding: '4px',
                                                border: editMode ? '2px dashed #667eea' : 'none',
                                                borderRadius: '4px',
                                                fontSize: `${activeTemplate.priceFontSize * 2.5}px`,
                                                fontWeight: '900',
                                                color: '#000'
                                            }}
                                        >
                                            {previewProduct.sale_price.toFixed(2)}<span style={{ fontSize: `${(activeTemplate.priceFontSize - 4) * 2.5}px`, fontWeight: '700' }}>₺</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="text-xs text-secondary text-center space-y-1">
                                <p>Ürün: <strong className="text-white">{previewProduct.name}</strong></p>
                                <p>Seçili: <strong className="text-primary">{selectedProducts.length} ürün</strong></p>
                                <p>Toplam: <strong className="text-emerald-400">
                                    {selectedProducts.reduce((sum, id) => sum + (labelCount[id] || 1), 0)} etiket
                                </strong></p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
