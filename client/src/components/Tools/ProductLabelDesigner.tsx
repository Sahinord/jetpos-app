"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
    Tag, Printer, Eye, Package, Building2,
    RotateCcw, Layers, Upload, Check, Search, Move,
    AlignLeft, AlignCenter, AlignRight, Bold, Italic, Palette, Square,
    Plus, X, Trash2
} from "lucide-react";
import JsBarcode from "jsbarcode";
import { useTenant } from "@/lib/tenant-context";
import { supabase } from "@/lib/supabase";

/* ── Types ── */
interface Product {
    id: string; name: string; barcode: string;
    sale_price: number; purchase_price: number; vat_rate: number;
}
const showToast = (msg: string, type: string = 'info') => {
    // JetKasa'da genelde window.dispatchEvent veya prop olarak gelir ama burada basit bir log/alert veya varsa UI sistemini kullanabiliriz
    console.log(`[Toast] ${type}: ${msg}`);
};
type TemplateId = 'raf' | 'market' | 'standard' | 'large' | 'rp80' | 'square-40' | 'vertical-30-50' | 'price-only' | string;
type ElemId = 'brand' | 'name' | 'price' | 'barcode' | 'logo' | 'frame';
interface Pos { xMm: number; yMm: number; }
interface LabelConfig {
    id: TemplateId; name: string;
    widthMm: number; heightMm: number;
    showLogo: boolean; showBrand: boolean; showName: boolean;
    showBarcode: boolean; showPrice: boolean; showVat: boolean;
    nameFontMm: number; priceFontMm: number; brandFontMm: number; barcodeHMm: number;
    defaultPos: Partial<Record<ElemId, Pos>>;
    defaultAligns?: Partial<Record<ElemId, Align>>;
    defaultWidths?: Partial<Record<ElemId, number>>;
    isRotated?: boolean;
    isStaticMarket?: boolean;
}

const PS = 3.5; // preview px per mm
const TS = 0.55; // thumbnail scale: 1mm → 0.55px

/* ── Template Thumbnail ── */
function TemplateThumbnail({ t }: { t: LabelConfig }) {
    const tw = t.widthMm * TS;
    const th = t.heightMm * TS;
    const ELEM_COLORS: Record<ElemId, string> = {
        brand: '#1565C0', name: '#222', price: '#c62828', barcode: '#555', logo: '#888'
    };
    const ELEM_HEIGHTS: Record<ElemId, number> = {
        brand: t.brandFontMm * TS * 1.4, name: t.nameFontMm * TS * 1.8, price: t.priceFontMm * TS * 1.4, barcode: t.barcodeHMm * TS, logo: 4
    };
    const ELEM_WIDTHS: Record<ElemId, number> = {
        brand: t.widthMm * TS * 0.35, name: t.widthMm * TS * 0.5, price: t.priceFontMm * TS * 1.8, barcode: t.widthMm * TS * 0.32, logo: 8
    };
    return (
        <div style={{ position: 'relative', width: tw, height: th, background: '#fff', border: '1px solid #ccc', flexShrink: 0, overflow: 'hidden', borderRadius: 2 }}>
            {(Object.entries(t.defaultPos) as [ElemId, Pos][]).map(([id, pos]) => (
                <div key={id} style={{
                    position: 'absolute',
                    left: pos.xMm * TS, top: pos.yMm * TS,
                    width: ELEM_WIDTHS[id], height: ELEM_HEIGHTS[id],
                    background: ELEM_COLORS[id],
                    borderRadius: 1, opacity: 0.75,
                }} />
            ))}
        </div>
    );
}

/* ── Templates ── */
const TEMPLATES: LabelConfig[] = [
    {
        id: 'raf', name: '🏬 Market Raf (72×40mm)',
        widthMm: 72, heightMm: 40,
        showLogo: true, showBrand: true, showName: true, showBarcode: true, showPrice: true, showVat: false,
        nameFontMm: 2.8, priceFontMm: 8, brandFontMm: 2.4, barcodeHMm: 3,
        defaultPos: {
            name: { xMm: 3, yMm: 2 },
            barcode: { xMm: 3, yMm: 11 },
            logo: { xMm: 3, yMm: 18 },
            price: { xMm: 3, yMm: 24 },
            brand: { xMm: 3, yMm: 34 },
            frame: { xMm: 0, yMm: 0 }
        },
        defaultAligns: { name: 'center', price: 'right', brand: 'center', logo: 'left', barcode: 'left' },
        defaultWidths: { name: 215, price: 215, brand: 215, frame: 0, logo: 120, barcode: 200 },
        defaultHeights: { frame: 0 }
    },
    {
        id: 'rp80', name: '💎 JetPOS Premium (80×40mm)',
        widthMm: 72, heightMm: 40,
        showLogo: false, showBrand: true, showName: true, showBarcode: true, showPrice: true, showVat: true,
        nameFontMm: 9, priceFontMm: 18, brandFontMm: 6, barcodeHMm: 10,
        defaultPos: {
            brand: { xMm: 4, yMm: 4 },
            barcode: { xMm: 36, yMm: 4 },
            name: { xMm: 4, yMm: 14 },
            price: { xMm: 4, yMm: 28 }
        },
        defaultAligns: { brand: 'left', name: 'left', price: 'left' },
        defaultWidths: { brand: 110, name: 238, price: 238, barcode: 120 }
    },
    {
        id: 'market', name: '🏪 Market Etiketi (58×40mm)',
        widthMm: 58, heightMm: 40,
        showLogo: false, showBrand: true, showName: true, showBarcode: true, showPrice: true, showVat: false,
        nameFontMm: 7, priceFontMm: 11, brandFontMm: 4.5, barcodeHMm: 10,
        defaultPos: { brand: { xMm: 2, yMm: 2 }, name: { xMm: 2, yMm: 7 }, barcode: { xMm: 3, yMm: 19 }, price: { xMm: 3, yMm: 31 } },
        defaultWidths: { name: 190, price: 180, barcode: 180 }
    },
    {
        id: 'standard', name: 'Standart (50×30mm)',
        widthMm: 50, heightMm: 30,
        showLogo: false, showBrand: false, showName: true, showBarcode: true, showPrice: true, showVat: false,
        nameFontMm: 6, priceFontMm: 10, brandFontMm: 4, barcodeHMm: 9,
        defaultPos: { name: { xMm: 2.5, yMm: 2 }, barcode: { xMm: 2.5, yMm: 10 }, price: { xMm: 2.5, yMm: 22 } },
        defaultWidths: { name: 160, price: 160, barcode: 160 }
    },
    {
        id: 'large', name: 'Büyük (80×50mm)',
        widthMm: 80, heightMm: 50,
        showLogo: true, showBrand: true, showName: true, showBarcode: true, showPrice: true, showVat: true,
        nameFontMm: 9, priceFontMm: 14, brandFontMm: 6, barcodeHMm: 14,
        defaultPos: { brand: { xMm: 2, yMm: 2 }, name: { xMm: 2, yMm: 9 }, logo: { xMm: 2, yMm: 40 }, barcode: { xMm: 40, yMm: 2 }, price: { xMm: 40, yMm: 22 } },
        defaultWidths: { name: 260, price: 130, barcode: 130 }
    },
    {
        id: 'square-40', name: '🔲 Kare (40×40mm)',
        widthMm: 40, heightMm: 40,
        showLogo: false, showBrand: true, showName: true, showBarcode: true, showPrice: true, showVat: true,
        nameFontMm: 4.8, priceFontMm: 10, brandFontMm: 3.5, barcodeHMm: 9,
        defaultPos: {
            name: { xMm: 3, yMm: 4 },
            barcode: { xMm: 3, yMm: 13 },
            price: { xMm: 3, yMm: 24 },
            brand: { xMm: 3, yMm: 33 }
        },
        defaultWidths: { name: 120, price: 120, barcode: 120 }
    },
];

/* ── Price renderer helpers ── */
function PriceDisplay({ cfg, product, scale }: { cfg: LabelConfig; product: Product; scale: number }) {
    const price = Number(product.sale_price) || 0;
    const [int, dec] = price.toFixed(2).split('.');
    const formattedInt = Number(int).toLocaleString('tr-TR');
    const isRaf = cfg.id === 'raf';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '100%', overflow: 'hidden', paddingRight: 4 * scale, boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0.1 * scale, maxWidth: '100%', boxSizing: 'border-box' }}>
                <span style={{ fontSize: (isRaf ? cfg.priceFontMm * 0.9 : cfg.priceFontMm) * scale, fontWeight: 900, color: '#000', letterSpacing: isRaf ? -0.2 : -2, lineHeight: 0.9 }}>{formattedInt}</span>
                <div style={{ display: 'flex', flexDirection: 'column', marginTop: scale * (isRaf ? 0.2 : 1.5), boxSizing: 'border-box' }}>
                    <span style={{ fontSize: cfg.priceFontMm * 0.4 * scale, fontWeight: 900, color: '#111', lineHeight: 1 }}>
                        <span style={{ verticalAlign: 'top' }}>.{dec}</span>
                        <span style={{ marginLeft: scale * 0.1, fontSize: isRaf ? '0.7em' : '1.1em' }}>{isRaf ? '₺' : 'TL'}</span>
                    </span>
                    {cfg.showVat && !isRaf && (
                        <span style={{ fontSize: cfg.brandFontMm * 0.7 * scale, color: '#000', fontStyle: 'normal', whiteSpace: 'nowrap', marginTop: scale * 0.5, letterSpacing: -0.5, fontWeight: 900 }}>
                            KDV Dahil
                        </span>
                    )}
                </div>
            </div>
            {isRaf && <div style={{ fontSize: 6, fontWeight: 900, opacity: 0.8, marginTop: 2 }}>Ürt. Yeri:</div>}
        </div>
    );
}

function priceHtmlMm(cfg: LabelConfig, product: Product, pos: Pos): string {
    const price = Number(product.sale_price) || 0;
    const [int, dec] = price.toFixed(2).split('.');
    const formattedInt = Number(int).toLocaleString('tr-TR');
    return `<div style="position:absolute;left:${pos.xMm}mm;top:${pos.yMm}mm;display:flex;align-items:flex-start;gap:0.5mm;">
  <span style="font-size:${cfg.priceFontMm}mm;font-weight:900;color:#111;letter-spacing:-2px;line-height:0.9;">${formattedInt}</span>
  <div style="display:flex;flex-direction:column;margin-top:1.5mm;">
    <span style="font-size:${cfg.priceFontMm * 0.45}mm;font-weight:900;color:#111;line-height:1;letter-spacing:-0.5px;">
        <span style="vertical-align:top;">.${dec}</span><span style="margin-left:1mm;">TL</span>
    </span>
    ${cfg.showVat ? `<span style="font-size:${cfg.brandFontMm * 0.8}mm;color:#333;font-style:italic;margin-top:1mm;letter-spacing:-0.5px;">KDV Dahil</span>` : ''}
  </div>
</div>`;
}

/* ── Main Component ── */
export default function ProductLabelDesigner({ products, showToast, printerName }: { products: Product[]; showToast: any; printerName?: string }) {
    const { currentTenant } = useTenant();

    /* ─ selection ─ */
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [labelCount, setLabelCount] = useState<Record<string, number>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [priceQueue, setPriceQueue] = useState<string[]>([]);

    useEffect(() => {
        try {
            const q = JSON.parse(localStorage.getItem('jetpos_label_queue') || '[]');
            setPriceQueue(q);
        } catch (e) { }
    }, []);

    const selectPriceChanges = () => {
        const changed = products.filter(p => priceQueue.includes(p.id)).map(p => p.id);
        setSelectedProducts(prev => Array.from(new Set([...prev, ...changed])));
        if (changed.length > 0) showToast(`${changed.length} yeni ürün seçildi`);
    };

    const clearQueue = () => {
        localStorage.removeItem('jetpos_label_queue');
        setPriceQueue([]);
        showToast("Liste temizlendi");
    };

    /* ─ template ─ */
    const [templateId, setTemplateId] = useState<TemplateId>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('last_label_template') as TemplateId) || 'rp80';
        }
        return 'rp80';
    });

    useEffect(() => {
        localStorage.setItem('last_label_template', templateId);
    }, [templateId]);
    const [customNames, setCustomNames] = useState<Record<string, string>>({});
    const [editingNameId, setEditingNameId] = useState<string | null>(null);
    const [editingNameVal, setEditingNameVal] = useState('');

    /* ─ brand / logo ─ */
    const [customBrandName, setCustomBrandName] = useState('');
    const [customLogo, setCustomLogo] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    /* ─ element config overrides ─ */
    const [cfgOverrides, setCfgOverrides] = useState<Partial<LabelConfig>>({});
    const [isRotated, setIsRotated] = useState(false);

    /* ─ canva positions ─ */
    const [positions, setPositions] = useState<Partial<Record<ElemId, Pos>>>({});
    const dragRef = useRef<{ id: ElemId; startX: number; startY: number; origX: number; origY: number } | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    /* ─ preview ─ */
    const [showPreview, setShowPreview] = useState(false);
    const [activePrintProduct, setActivePrintProduct] = useState<Product | null>(null);
    const [isPrintingProgress, setIsPrintingProgress] = useState(false);

    /* ─ text alignment (per text element) ─ */
    type Align = 'left' | 'center' | 'right';
    const [alignments, setAlignments] = useState<Partial<Record<ElemId, Align>>>({});
    const [selectedElem, setSelectedElem] = useState<ElemId | null>(null);

    /* ─ element editing & resize ─ */
    const [editingElem, setEditingElem] = useState<ElemId | null>(null);
    const [customTexts, setCustomTexts] = useState<Partial<Record<ElemId, string>>>({});
    const [fontScales, setFontScales] = useState<Partial<Record<ElemId, number>>>({});
    const [elemWidths, setElemWidths] = useState<Partial<Record<ElemId, number>>>({});
    const [colors, setColors] = useState<Partial<Record<ElemId, string>>>({});
    const [fontStyles, setFontStyles] = useState<Partial<Record<ElemId, { b: boolean; i: boolean; box?: boolean }>>>({});
    const [barcodeNarrow, setBarcodeNarrow] = useState(2);
    const [barcodeWidth, setBarcodeWidth] = useState(2); // Bar thickness (1-4)
    const [barcodeScale, setBarcodeScale] = useState(1); // Overall scale factor (0.5 - 1.5)
    const [globalBorder, setGlobalBorder] = useState(false);
    const [showGuides, setShowGuides] = useState<{ x: boolean; y: boolean }>({ x: false, y: false });
    const [printOffsets, setPrintOffsets] = useState({ x: 0, y: 0, scale: 100 }); // mm calibration / scale

    const resizeDragRef = useRef<{ id: ElemId; handle: string; startX: number; startY: number; origW: number; origS: number } | null>(null);

    /* ─ custom dynamic templates ─ */
    const [customTemplates, setCustomTemplates] = useState<LabelConfig[]>([]);
    const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
    const [newTemp, setNewTemp] = useState({ name: '', w: 50, h: 30 });

    useEffect(() => {
        if (currentTenant?.settings?.custom_label_templates_v1) {
            setCustomTemplates(currentTenant.settings.custom_label_templates_v1);
        }
    }, [currentTenant]);

    const allTemplates = [...TEMPLATES, ...customTemplates];

    useEffect(() => {
        const tenantKey = `label_design_${templateId}`;
        const savedStr = localStorage.getItem(tenantKey);
        const tenantSaved = currentTenant?.settings?.[tenantKey];

        let data = null;
        if (tenantSaved && Object.keys(tenantSaved).length > 0) {
            data = tenantSaved;
        } else if (savedStr) {
            try { data = JSON.parse(savedStr); } catch (e) { }
        }

        const target = allTemplates.find(t => t.id === templateId);

        if (data) {
            try {
                setPositions(data.positions || target?.defaultPos || {});
                setAlignments(data.alignments || target?.defaultAligns || {});
                setFontScales(data.fontScales || {});
                setElemWidths(data.elemWidths || target?.defaultWidths || {});
                setColors(data.colors || {});
                setFontStyles(data.fontStyles || {});
                setPrintOffsets(data.printOffsets || { x: 0, y: 0, scale: 100 });
                setCustomTexts(data.customTexts || {});
                setGlobalBorder(data.globalBorder !== undefined ? data.globalBorder : false);
                setCfgOverrides(data.cfgOverrides || {});
                if (data.barcodeWidth) setBarcodeWidth(data.barcodeWidth);
                setBarcodeScale(data.barcodeScale || (templateId === 'raf' ? 0.75 : 1));
            } catch (e) { console.error("Load error", e); }
        } else if (target) {
            // No save found, reset to defaults from template
            setPositions(target.defaultPos || {});
            setAlignments(target.defaultAligns || {});
            setElemWidths(target.defaultWidths || {});
            setFontScales({});
            setColors({});

            // Raf özel kutulu stil
            if (templateId === 'raf') {
                setFontStyles({
                    name: { b: true, i: false, box: true },
                    brand: { b: true, i: false, box: true },
                    logo: { b: true, i: false, box: true }
                });
                setCustomTexts({
                    brand: brandName + "\nET&TAVUK DÜNYASI",
                    logo: "BİRİM FİYAT\n181.00 TL/KG"
                });
                setBarcodeScale(0.5);
                setBarcodeWidth(1.2);
            } else {
                setFontStyles({});
                setCustomTexts({});
                setBarcodeScale(1);
                setBarcodeWidth(2);
            }

            setPrintOffsets({ x: 0, y: 0, scale: 100 });
            setGlobalBorder(false);
            setCfgOverrides({});
        }
        setSelectedElem(null);
        setEditingElem(null);
    }, [templateId]);

    useEffect(() => {
        const data = { positions, alignments, fontScales, elemWidths, colors, fontStyles, printOffsets, customTexts, globalBorder, barcodeWidth, barcodeScale };
        localStorage.setItem(`label_design_${templateId}`, JSON.stringify(data));
    }, [templateId, positions, alignments, fontScales, elemWidths, colors, fontStyles, printOffsets, customTexts, globalBorder, barcodeWidth, barcodeScale]);

    const getAlign = (id: ElemId): Align => alignments[id] ?? 'left';
    const setAlign = (align: Align) => {
        if (!selectedElem) return;
        setAlignments(prev => ({ ...prev, [selectedElem]: align }));
    };

    const cfg: LabelConfig = { ...allTemplates.find(t => t.id === templateId)!, ...cfgOverrides };
    const brandName = customBrandName || currentTenant?.company_name || 'JetPOS';
    const logoUrl = customLogo || currentTenant?.logo_url || '';

    const getPos = useCallback((id: ElemId): Pos => {
        return positions[id] ?? cfg.defaultPos[id] ?? { xMm: 2, yMm: 2 };
    }, [positions, cfg]);


    /* ─ barcode drawing ─ */
    const drawBarcode = useCallback((canvasId: string, product: Product, heightMm: number) => {
        try {
            const el = document.getElementById(canvasId) as HTMLCanvasElement | null;
            if (!el || !product.barcode) return;

            // Ana Barkod (Full Width, İri Rakamlı)
            // Barkod tipini basitçe belirle (EAN13 genelde 13 hane ve rakamdır)
            const isEan13 = product.barcode.length === 13 && /^\d+$/.test(product.barcode);

            JsBarcode(el, product.barcode, {
                format: isEan13 ? 'EAN13' : 'CODE128',
                width: barcodeWidth || 2,
                height: Math.round((heightMm || 10) * PS),
                displayValue: true,
                fontSize: 14,
                fontOptions: "bold",
                margin: 0,
                textMargin: 1
            });

            // Küçük Barkod (Süpermarket şablonu için)
            if (cfg.isStaticMarket) {
                const smallEl = document.getElementById(`bc-small-${product.id}`) as HTMLCanvasElement;
                if (smallEl) {
                    JsBarcode(smallEl, product.barcode, {
                        format: 'CODE128',
                        width: 1.5,
                        height: Math.round(10 * PS),
                        displayValue: false, // Rakam yok
                        margin: 0
                    });
                }
            }
        } catch { /* */ }
    }, [cfg]);

    const previewProduct = activePrintProduct || (selectedProducts.map(id => products.find(p => p.id === id)).filter(Boolean)[0] as Product | undefined);

    useEffect(() => {
        if (!showPreview || !previewProduct?.barcode) return;
        const id = `bc-prev-${previewProduct.id}`;
        setTimeout(() => drawBarcode(id, previewProduct, cfg.barcodeHMm), 50);
    }, [showPreview, previewProduct, cfg, drawBarcode, positions]);

    /* ─ drag handlers ─ */
    const startDrag = (e: React.MouseEvent, id: ElemId) => {
        e.preventDefault();
        e.stopPropagation();
        const p = getPos(id);
        dragRef.current = { id, startX: e.clientX, startY: e.clientY, origX: p.xMm, origY: p.yMm };
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (resizeDragRef.current) {
            const { id, handle, startX, startY, origW, origS } = resizeDragRef.current;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (id === 'barcode') {
                // Resize disabled for barcode
            } else {
                if (handle === 'mr' || handle === 'br') setElemWidths(p => ({ ...p, [id]: Math.max(20, origW + dx) }));
                if (handle === 'bc' || handle === 'br') setFontScales(p => ({ ...p, [id]: Math.max(0.3, Math.min(5, origS + dy * 0.015)) }));
            }
            return;
        }
        if (!dragRef.current) return;
        const { id, startX, startY, origX, origY } = dragRef.current;
        const dx = (e.clientX - startX) / PS;
        const dy = (e.clientY - startY) / PS;

        let newX = origX + dx;
        let newY = origY + dy;

        // Snapping Logic (Center Guides)
        const centerX = cfg.widthMm / 2;
        const centerY = cfg.heightMm / 2;
        const snapDist = 2; // mm

        const guides = { x: false, y: false };
        if (Math.abs(newX - centerX) < snapDist) { newX = centerX; guides.x = true; }
        if (Math.abs(newY - centerY) < snapDist) { newY = centerY; guides.y = true; }

        setShowGuides(guides);

        const boundedX = Math.max(0, Math.min(cfg.widthMm - 3, newX));
        const boundedY = Math.max(0, Math.min(cfg.heightMm - 2, newY));
        setPositions(prev => ({ ...prev, [id]: { xMm: boundedX, yMm: boundedY } }));
    };
    const stopDrag = () => { dragRef.current = null; resizeDragRef.current = null; setShowGuides({ x: false, y: false }); };

    /* ─ element helpers ─ */
    const getFS = (id: ElemId, baseMm: number) => baseMm * (fontScales[id] ?? 1) * PS;
    const getEW = (id: ElemId, defPx: number) => elemWidths[id] ?? defPx;
    const getTxt = (id: ElemId, fallback: string) => customTexts[id] ?? fallback;

    // Resize handle maker (Canva style: White circles)
    const mkH = (id: ElemId, h: 'mr' | 'bc' | 'br', wPx: number, fS: number) => {
        const pos: Record<string, React.CSSProperties> = {
            mr: { top: '50%', right: -6, cursor: 'ew-resize', transform: 'translateY(-50%)' },
            bc: { bottom: -6, left: '50%', cursor: 'ns-resize', transform: 'translateX(-50%)' },
            br: { bottom: -6, right: -6, cursor: 'nwse-resize' },
        };
        return <div key={h} style={{ position: 'absolute', width: 12, height: 12, background: '#fff', border: '2px solid #6366f1', borderRadius: '50%', zIndex: 40, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', ...pos[h] }}
            onMouseDown={e => { e.preventDefault(); e.stopPropagation(); resizeDragRef.current = { id, handle: h, startX: e.clientX, startY: e.clientY, origW: wPx, origS: fS }; }} />;
    };

    /* ─ print (Raster Image – Tüm ürünler için sırayla) ─ */
    const handlePrint = async () => {
        if (selectedProducts.length === 0) {
            showToast('Lütfen en az bir ürün seçin', 'error');
            return;
        }

        const electron = (window as any).electron;
        if (!electron?.isElectron) {
            showToast('Yazdırma yalnızca masaüstü uygulamada çalışır.', 'error');
            return;
        }

        const sourceDiv = canvasRef.current;
        if (!sourceDiv) {
            showToast('Editörü açıp ürün seçin (Canva div gereklidir)', 'error');
            return;
        }

        const targetPrinter = printerName || 'RONGTA 80mm Series Printer';
        const html2canvas = (await import('html2canvas')).default;

        setIsPrintingProgress(true);
        showToast(`Toplam ${selectedProducts.length} ürün hazırlanıyor...`, 'info');

        try {
            for (const productId of selectedProducts) {
                const product = products.find(p => p.id === productId);
                if (!product) continue;

                // 1. Ürünü preview'a yerleştir ve DOM'un güncellenmesini bekle
                setActivePrintProduct(product);
                await new Promise(res => setTimeout(res, 300)); // Render + Barcode drawing wait

                // 2. html2canvas ile yakala
                const previewW = cfg.widthMm * PS;
                const previewH = cfg.heightMm * PS;

                const rawCanvas = await html2canvas(sourceDiv, {
                    scale: 2.5,
                    backgroundColor: '#ffffff',
                    useCORS: true,
                    logging: false,
                    width: previewW,
                    height: previewH,
                    onclone: (doc: Document) => {
                        doc.querySelectorAll('div').forEach(d => {
                            const el = d as HTMLElement;
                            if (el.style.outline?.includes('6366f1')) el.style.outline = 'none';
                            const isUi = el.style.background === 'rgb(99, 102, 241)' || el.style.background === '#6366f1' || (el.style.borderRadius === '50%' && el.style.borderColor);
                            if (isUi) el.style.display = 'none';
                        });
                    }
                });

                // 3. Rasterlaştırma
                const scaleFactor = (printOffsets.scale || 100) / 100;
                // Yazıcı kafasına göre dot genişliği (Standart 203 DPI = 8 dots/mm)
                const PRINT_WIDTH_BASE = Math.round(cfg.widthMm * 8);
                const PRINT_WIDTH = Math.round(PRINT_WIDTH_BASE * scaleFactor);
                const PRINT_HEIGHT = Math.round((PRINT_WIDTH / previewW) * previewH);

                const printCanvas = document.createElement('canvas');
                printCanvas.width = PRINT_WIDTH;
                printCanvas.height = PRINT_HEIGHT;
                const ctx = printCanvas.getContext('2d')!;
                ctx.imageSmoothingEnabled = true; // Daha temiz barkod için soft scale
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, PRINT_WIDTH, PRINT_HEIGHT);
                ctx.drawImage(rawCanvas, 0, 0, PRINT_WIDTH, PRINT_HEIGHT);

                const imgData = ctx.getImageData(0, 0, PRINT_WIDTH, PRINT_HEIGHT);
                const px = imgData.data;
                const widthBytes = Math.ceil(PRINT_WIDTH / 8);

                // Horizontal Offset (X) - 1mm = 8 dots (approx)
                const offsetXBytes = Math.floor((printOffsets.x * 8) / 8);
                const finalWidthBytes = widthBytes + offsetXBytes;
                const bitmap: number[] = [];

                for (let y = 0; y < PRINT_HEIGHT; y++) {
                    // Padding Left (X Offset)
                    for (let ox = 0; ox < offsetXBytes; ox++) bitmap.push(0);

                    for (let xB = 0; xB < widthBytes; xB++) {
                        let byte = 0;
                        for (let bit = 0; bit < 8; bit++) {
                            const x = xB * 8 + bit;
                            if (x < PRINT_WIDTH - 4) { // Right side safety margin (4 dots)
                                const i = (y * PRINT_WIDTH + x) * 4;
                                let gray = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
                                // Contrast Boost (Dinamik eşikleme ile daha keskin baskı)
                                if (gray <= 180) byte |= (0x80 >> bit);
                            }
                        }
                        bitmap.push(byte);
                    }
                }

                // 4. Yazıcıya Gönder (Adet kadar)
                const count = labelCount[productId] || 1;

                // Vertical Offset (Y) & Padding
                const paddingLines = Math.max(30, Math.round(printOffsets.y * 8));
                for (let p = 0; p < paddingLines * finalWidthBytes; p++) {
                    bitmap.push(0);
                }
                const TOTAL_HEIGHT = PRINT_HEIGHT + paddingLines;

                for (let i = 0; i < count; i++) {
                    electron.send('print-label-image', {
                        printerName: targetPrinter,
                        bitmap,
                        widthBytes: finalWidthBytes,
                        heightDots: TOTAL_HEIGHT,
                    });
                }
            }

            showToast('Tüm etiketler başarıyla gönderildi ✅', 'success');
        } catch (err) {
            console.error('[Print Loop] HATA:', err);
            showToast(`Yazdırma hatası: ${(err as Error).message}`, 'error');
        } finally {
            setActivePrintProduct(null);
            setIsPrintingProgress(false);
        }
    };


    /* ─ utils ─ */
    const filtered = products.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const toggleProduct = (id: string) => setSelectedProducts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const updateCount = (id: string, d: number) => setLabelCount(prev => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) + d) }));

    const resetEditor = () => {
        const target = allTemplates.find(t => t.id === templateId);
        setPositions(target?.defaultPos || {});
        setAlignments(target?.defaultAligns || {});
        setElemWidths(target?.defaultWidths || {});
        setFontScales({});
        setColors({});
        setFontStyles({});
        setPrintOffsets({ x: 0, y: 0, scale: 100 });
        setCustomTexts({});
        setGlobalBorder(false);
        setCfgOverrides({});
        showToast('Tasarım varsayılana sıfırlandı');
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]; if (!f) return;
        const r = new FileReader();
        r.onload = ev => setCustomLogo(ev.target?.result as string);
        r.readAsDataURL(f);
    };

    const toggleShow = (key: keyof LabelConfig) => setCfgOverrides(p => ({ ...p, [key]: !cfg[key] }));

    /* ─ render ─ */
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-black tracking-widest uppercase flex items-center gap-3">
                        <Tag className="text-primary" /> ÜRÜN ETİKET TASARIMI
                    </h1>
                    <p className="text-secondary text-sm mt-1">Şablon seç → Elemanları sürükle → Yazdır</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <button
                        onClick={() => setShowPreview(v => !v)}
                        disabled={!previewProduct}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-bold text-sm transition-all disabled:opacity-40 ${showPreview ? 'bg-primary border-primary text-white' : 'border-border hover:border-primary'}`}
                    >
                        <Eye size={16} /> {showPreview ? 'Editörü Kapat' : 'Editörü Aç'}
                    </button>
                    <button
                        onClick={handlePrint}
                        disabled={selectedProducts.length === 0}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-sm disabled:opacity-40 hover:bg-primary/90 transition-all"
                    >
                        <Printer size={16} /> Yazdır ({selectedProducts.reduce((s, id) => s + (labelCount[id] || 1), 0)} etiket)
                    </button>
                </div>
            </div>

            {/* ── YENİ ŞABLON MODALI ── */}
            {showAddTemplateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-primary/30 rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-primary/10">
                            <h3 className="font-bold text-white flex items-center gap-2"><Plus size={18} className="text-primary" /> Yeni Özel Şablon</h3>
                            <button onClick={() => setShowAddTemplateModal(false)} className="text-white/50 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-secondary mb-1 block">Şablon Adı</label>
                                <input autoFocus type="text" value={newTemp.name} onChange={e => setNewTemp(p => ({ ...p, name: e.target.value }))} placeholder="Örn: Kasap Etiketi" className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary" />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-secondary mb-1 block">Genişlik (mm)</label>
                                    <input type="number" min="10" max="120" value={newTemp.w} onChange={e => setNewTemp(p => ({ ...p, w: Number(e.target.value) }))} className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-secondary mb-1 block">Yükseklik (mm)</label>
                                    <input type="number" min="10" max="120" value={newTemp.h} onChange={e => setNewTemp(p => ({ ...p, h: Number(e.target.value) }))} className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary" />
                                </div>
                            </div>
                            <button
                                onClick={async () => {
                                    if (!newTemp.name.trim()) return showToast('Lütfen şablon ismi girin', 'error');
                                    const newId = 'custom_' + Date.now();
                                    const newConfig: LabelConfig = {
                                        id: newId, name: '✏️ ' + newTemp.name, widthMm: newTemp.w || 50, heightMm: newTemp.h || 30,
                                        showLogo: false, showBrand: true, showName: true, showBarcode: true, showPrice: true, showVat: false,
                                        nameFontMm: 7, priceFontMm: 12, brandFontMm: 4, barcodeHMm: 10, defaultPos: {}
                                    };
                                    const updated = [...customTemplates, newConfig];
                                    setCustomTemplates(updated);
                                    setTemplateId(newId);
                                    setShowAddTemplateModal(false);
                                    setNewTemp({ name: '', w: 50, h: 30 });
                                    if (currentTenant) {
                                        await supabase.from('tenants').update({ settings: { ...currentTenant.settings, custom_label_templates_v1: updated } }).eq('id', currentTenant.id);
                                        showToast('Yeni şablon buluta ( Tenant ) eklendi', 'success');
                                    }
                                }}
                                className="w-full py-3 mt-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                            >
                                <Plus size={18} /> Şablonu Oluştur
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* ── SOL: Ayarlar ── */}
                <div className="space-y-4">
                    {/* Şablon */}
                    <div className="glass-card flex flex-col relative">
                        <h3 className="font-black uppercase text-sm mb-3 flex items-center justify-between">
                            <span className="flex items-center gap-2"><Layers size={16} className="text-primary" /> Şablon</span>
                            <button onClick={() => setShowAddTemplateModal(true)} className="w-6 h-6 rounded-md bg-primary/20 text-primary flex items-center justify-center hover:bg-primary/40 transition-colors hover:scale-110" title="Yeni Özel Şablon Ekle">
                                <Plus size={14} />
                            </button>
                        </h3>
                        <div className="space-y-2">
                            {allTemplates.map(t => {
                                const displayName = customNames[t.id] || t.name;
                                const isActive = templateId === t.id;
                                const isEditing = editingNameId === t.id;
                                const isCustom = t.id.startsWith('custom_');
                                return (
                                    <div
                                        key={t.id}
                                        onClick={() => setTemplateId(t.id)}
                                        onDoubleClick={() => { setEditingNameId(t.id); setEditingNameVal(displayName); }}
                                        className={`w-full p-2 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 relative group ${isActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'}`}
                                    >
                                        {/* Thumbnail */}
                                        <div className="flex-shrink-0 opacity-90">
                                            <TemplateThumbnail t={t} />
                                        </div>
                                        {/* Name */}
                                        <div className="flex-1 min-w-0">
                                            {isEditing ? (
                                                <input
                                                    autoFocus
                                                    value={editingNameVal}
                                                    onChange={e => setEditingNameVal(e.target.value)}
                                                    onBlur={() => { if (editingNameVal.trim()) setCustomNames(p => ({ ...p, [t.id]: editingNameVal.trim() })); setEditingNameId(null); }}
                                                    onKeyDown={e => { if (e.key === 'Enter') { if (editingNameVal.trim()) setCustomNames(p => ({ ...p, [t.id]: editingNameVal.trim() })); setEditingNameId(null); } if (e.key === 'Escape') setEditingNameId(null); }}
                                                    onClick={e => e.stopPropagation()}
                                                    className="w-full bg-transparent text-xs font-bold text-primary outline-none border-b border-primary"
                                                />
                                            ) : (
                                                <span className="font-bold text-xs leading-tight block truncate pr-5" title="Çift tıkla → İsim değiştir">{displayName}</span>
                                            )}
                                            <span className="text-[10px] text-secondary/60">{t.widthMm}×{t.heightMm}mm</span>
                                        </div>
                                        {isActive && !isEditing && <Check size={14} className="text-primary flex-shrink-0" />}
                                        {isCustom && (
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm('Bu özel şablonu silmek istediğinize emin misiniz?')) {
                                                        const updated = customTemplates.filter(ct => ct.id !== t.id);
                                                        setCustomTemplates(updated);
                                                        if (isActive) setTemplateId(TEMPLATES[0].id);
                                                        if (currentTenant) {
                                                            await supabase.from('tenants').update({ settings: { ...currentTenant.settings, custom_label_templates_v1: updated } }).eq('id', currentTenant.id);
                                                        }
                                                    }
                                                }}
                                                className="absolute right-2 top-2 w-6 h-6 rounded-md bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                                                title="Şablonu Sil"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-[10px] text-secondary/40 mt-2 text-center">💡 Çift tıkla → İsim değiştir</p>
                    </div>

                    {/* Marka */}
                    <div className="glass-card">
                        <h3 className="font-black uppercase text-sm mb-3 flex items-center gap-2">
                            <Building2 size={16} className="text-primary" /> Marka
                        </h3>
                        <div className="space-y-2">
                            <input
                                type="text" value={customBrandName}
                                onChange={e => setCustomBrandName(e.target.value)}
                                placeholder={currentTenant?.company_name || 'Marka adı'}
                                className="w-full px-3 py-2 bg-white/5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary"
                            />
                            <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                            <button onClick={() => fileRef.current?.click()} className="w-full py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-xl text-primary font-bold text-xs uppercase flex items-center justify-center gap-2">
                                <Upload size={14} /> Logo Yükle
                            </button>
                            {logoUrl && (
                                <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                                    <img src={logoUrl} alt="" className="w-7 h-7 object-contain" />
                                    <span className="flex-1 text-xs text-secondary truncate">Logo yüklendi</span>
                                    <button onClick={() => setCustomLogo('')} className="text-rose-400 text-xs font-bold">Kaldır</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* İçerik */}
                    <div className="glass-card">
                        <h3 className="font-black uppercase text-sm mb-3 flex items-center justify-between">
                            <span>İçerik</span>
                            <button onClick={resetEditor} className="text-rose-400 hover:text-rose-300 flex items-center gap-1 text-xs">
                                <RotateCcw size={12} /> Sıfırla
                            </button>
                        </h3>
                        <div className="space-y-2">
                            {([
                                { key: 'showBrand', label: 'Marka Adı' },
                                { key: 'showName', label: 'Ürün Adı' },
                                { key: 'showBarcode', label: 'Barkod' },
                                { key: 'showPrice', label: 'Fiyat' },
                                { key: 'showVat', label: 'KDV Notu' },
                                { key: 'showLogo', label: 'Logo' },
                            ] as { key: keyof LabelConfig; label: string }[]).map(({ key, label }) => (
                                <div key={key} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                                    <span className="text-xs font-bold text-secondary uppercase">{label}</span>
                                    <button
                                        onClick={() => toggleShow(key)}
                                        className={`w-10 h-5 rounded-full relative transition-all ${cfg[key] ? 'bg-primary' : 'bg-white/10'}`}
                                    >
                                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${cfg[key] ? 'left-5' : 'left-0.5'}`} />
                                    </button>
                                </div>
                            ))}

                            <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-primary/20">
                                <span className="text-xs font-black text-primary uppercase">Dikey Yazdır (90° Döndür)</span>
                                <button
                                    onClick={() => setIsRotated(!isRotated)}
                                    className={`w-10 h-5 rounded-full relative transition-all ${isRotated ? 'bg-amber-500' : 'bg-white/10'}`}
                                >
                                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${isRotated ? 'left-5' : 'left-0.5'}`} />
                                </button>
                            </div>
                        </div>
                        <div className="mt-3 space-y-2">
                            <label className="block text-xs font-bold text-secondary uppercase">Ürün adı: {cfg.nameFontMm}mm</label>
                            <input type="range" min={4} max={16} value={cfg.nameFontMm}
                                onChange={e => setCfgOverrides(p => ({ ...p, nameFontMm: +e.target.value }))}
                                className="w-full accent-primary" />
                            <label className="block text-xs font-bold text-secondary uppercase">Fiyat: {cfg.priceFontMm}mm</label>
                            <input type="range" min={6} max={22} value={cfg.priceFontMm}
                                onChange={e => setCfgOverrides(p => ({ ...p, priceFontMm: +e.target.value }))}
                                className="w-full accent-primary" />
                            <label className="block text-xs font-bold text-secondary uppercase">Barkod Boyu: {cfg.barcodeHMm}mm</label>
                            <input type="range" min={5} max={35} value={cfg.barcodeHMm}
                                onChange={e => setCfgOverrides(p => ({ ...p, barcodeHMm: +e.target.value }))}
                                className="w-full accent-primary" />
                            <label className="block text-xs font-bold text-secondary uppercase">Barkod Kalınlığı: {barcodeWidth}</label>
                            <input type="range" min={1} max={4} step={0.5} value={barcodeWidth}
                                onChange={e => setBarcodeWidth(+e.target.value)}
                                className="w-full accent-primary" />
                            <label className="block text-xs font-bold text-secondary uppercase">Barkod Ölçeği (Boyut): %{Math.round(barcodeScale * 100)}</label>
                            <input type="range" min={0.3} max={1.5} step={0.05} value={barcodeScale}
                                onChange={e => setBarcodeScale(+e.target.value)}
                                className="w-full accent-primary" />
                        </div>

                        {/* Calibration */}
                        <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                            <h4 className="text-[10px] font-black text-amber-500 uppercase flex items-center gap-2">
                                <RotateCcw size={12} /> Yazıcı Kalibrasyonu (Baskı Kayması)
                            </h4>
                            <div className="space-y-4">
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[9px] text-amber-400 font-black uppercase">Baskı Ölçeği (Scale): %{printOffsets.scale || 100}</label>
                                        <button onClick={() => setPrintOffsets(p => ({ ...p, scale: 100 }))} className="text-[9px] text-secondary hover:text-white underline">Sıfırla</button>
                                    </div>
                                    <input type="range" min={50} max={120} value={printOffsets.scale || 100}
                                        onChange={e => setPrintOffsets(p => ({ ...p, scale: +e.target.value }))}
                                        className="w-full accent-amber-500" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-[9px] text-primary font-black uppercase">Yatay Ofset (X): {printOffsets.x}mm</label>
                                        </div>
                                        <input type="range" min={-20} max={20} step={0.5} value={printOffsets.x || 0}
                                            onChange={e => setPrintOffsets(p => ({ ...p, x: +e.target.value }))}
                                            className="w-full accent-primary" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-[9px] text-primary font-black uppercase">Dikey Ofset (Y): {printOffsets.y}mm</label>
                                        </div>
                                        <input type="range" min={-40} max={40} step={0.5} value={printOffsets.y || 0}
                                            onChange={e => setPrintOffsets(p => ({ ...p, y: +e.target.value }))}
                                            className="w-full accent-primary" />
                                    </div>
                                </div>
                                <p className="text-[8px] text-secondary/50 text-center uppercase tracking-tighter italic">Etiket kağıda tam oturmuyorsa (kaymışsa) buradan ince ayar yapın</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── ORTA: Ürün ── */}
                <div className="glass-card flex flex-col">
                    <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                        <div className="flex items-center gap-3">
                            <h3 className="font-black uppercase text-sm flex items-center gap-2">
                                <Package size={16} className="text-primary" /> Ürünler
                            </h3>
                            {priceQueue.length > 0 && (
                                <span className="bg-amber-500 text-black text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                                    {priceQueue.length} YENİ
                                </span>
                            )}
                        </div>
                        <div className="flex gap-3">
                            {priceQueue.length > 0 && (
                                <button
                                    onClick={selectPriceChanges}
                                    title="Fiyatı Değişenleri Otomatik Seç"
                                    className="text-[10px] font-black text-amber-500 hover:text-amber-400 uppercase flex items-center gap-1 border border-amber-500/30 px-2 py-1 rounded-lg transition-all"
                                >
                                    FİYATI DEĞİŞENLER ({priceQueue.length})
                                </button>
                            )}
                            <button onClick={() => setSelectedProducts(selectedProducts.length === filtered.length ? [] : filtered.map(p => p.id))} className="text-[10px] font-bold text-primary hover:underline uppercase">
                                {selectedProducts.length === filtered.length ? 'Hiçbiri' : 'Tümü'}
                            </button>
                        </div>
                    </div>
                    {priceQueue.length > 0 && (
                        <div className="mb-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
                            <span className="text-[10px] text-amber-200 uppercase font-bold flex items-center gap-1">
                                <RotateCcw size={10} className="animate-spin-slow" /> Henüz etiketi basılmamış fiyat değişimleri!
                            </span>
                            <button onClick={clearQueue} className="text-[10px] text-rose-400 hover:text-rose-300 font-bold uppercase underline">Listeyi Temizle</button>
                        </div>
                    )}
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary w-4 h-4" />
                        <input type="text" placeholder="Ürün ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary" />
                    </div>
                    <div className="space-y-1.5 overflow-y-auto flex-1 custom-scrollbar pr-1" style={{ maxHeight: 520 }}>
                        {filtered.slice(0, 80).map(product => {
                            const isSelected = selectedProducts.includes(product.id);
                            const count = labelCount[product.id] || 1;
                            return (
                                <div key={product.id} className={`rounded-xl border-2 transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                                    <div className="flex items-center gap-3 p-2.5 cursor-pointer" onClick={() => toggleProduct(product.id)}>
                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'bg-primary border-primary' : 'border-border'}`}>
                                            {isSelected && <Check size={10} className="text-white" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-sm truncate">{product.name}</p>
                                                {priceQueue.includes(product.id) && (
                                                    <span className="bg-amber-500 text-black text-[8px] px-1 rounded font-black leading-tight">YENİ</span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-secondary font-mono">{product.barcode}</p>
                                        </div>
                                        <p className="font-black text-primary text-sm flex-shrink-0">₺{product.sale_price?.toFixed(2)}</p>
                                    </div>
                                    {isSelected && (
                                        <div className="flex items-center gap-2 px-3 pb-2 border-t border-border/50 pt-2">
                                            <span className="text-[10px] text-secondary font-bold uppercase flex-1">Adet:</span>
                                            <button onClick={() => updateCount(product.id, -1)} className="w-6 h-6 bg-white/10 hover:bg-white/20 rounded text-sm font-bold flex items-center justify-center">−</button>
                                            <span className="w-8 text-center font-bold text-sm">{count}</span>
                                            <button onClick={() => updateCount(product.id, 1)} className="w-6 h-6 bg-white/10 hover:bg-white/20 rounded text-sm font-bold flex items-center justify-center">+</button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {filtered.length === 0 && <p className="text-center text-secondary text-sm py-8">Ürün bulunamadı</p>}
                        {filtered.length > 80 && <p className="text-center text-secondary text-xs py-2">+{filtered.length - 80} ürün daha</p>}
                    </div>
                </div>

                {/* ── SAĞ: Canva Editör ── */}
                <div className="glass-card">
                    <h3 className="font-black uppercase text-sm flex items-center justify-between border-b border-border pb-3 mb-4">
                        <span className="flex items-center gap-2"><Eye size={16} className="text-primary" /> Canva Editör</span>
                        {showPreview && (
                            <div className="flex items-center gap-4">
                                <button onClick={async () => {
                                    const designPayload = { positions, alignments, fontScales, elemWidths, colors, fontStyles, printOffsets, customTexts, globalBorder, cfgOverrides, barcodeWidth, barcodeScale };
                                    localStorage.setItem(`label_design_${templateId}`, JSON.stringify(designPayload));

                                    if (currentTenant) {
                                        const updatedSettings = {
                                            ...(currentTenant.settings || {}),
                                            [`label_design_${templateId}`]: designPayload
                                        };
                                        const { error } = await supabase
                                            .from('tenants')
                                            .update({ settings: updatedSettings })
                                            .eq('id', currentTenant.id);

                                        if (error) {
                                            showToast('Buluta (Tenant) kaydedilemedi!', 'error');
                                        } else {
                                            showToast('Şablon tasarımı tüm cihazlar için buluta kaydedildi!', 'success');
                                            // currentTenant local state'i hemen yenilenmediği için LS'den okumasına devam eder, sorun yok.
                                        }
                                    } else {
                                        showToast('Sadece bu cihaza kaydedildi (Tenant yok)', 'success');
                                    }
                                }} className="text-xs text-primary font-bold hover:underline flex items-center gap-1 transition-colors">
                                    <Check size={12} /> Kaydet
                                </button>
                                <button onClick={() => { setPositions({}); setCustomTexts({}); setGlobalBorder(false); setFontStyles({}); setColors({}); setAlignments({}); }} className="text-xs text-secondary/60 hover:text-rose-400 flex items-center gap-1 transition-colors">
                                    <RotateCcw size={11} /> Sıfırla
                                </button>
                            </div>
                        )}
                    </h3>

                    {!previewProduct || !showPreview ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Tag className="w-14 h-14 text-secondary/20 mb-4" />
                            <p className="text-secondary font-bold text-sm">Ürün seç ve Editörü Aç'a tıkla</p>
                            <p className="text-xs text-secondary/50 mt-1">{selectedProducts.length} ürün seçili</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* ── Hizalama & Stil Toolbar (Canva/PPT tarzı) ── */}
                            <div className="flex items-center gap-1.5 p-2 bg-white/5 rounded-xl border border-border flex-wrap">
                                <div className="flex-1 min-w-0 mr-2">
                                    <span className="text-[10px] text-primary uppercase font-black truncate block">
                                        {selectedElem ? {
                                            brand: 'Marka', name: 'Ürün Adı', price: 'Fiyat', barcode: 'Barkod', logo: 'Logo'
                                        }[selectedElem] : 'Eleman seç'}
                                    </span>
                                </div>

                                {/* B/I/Box */}
                                <div className="flex bg-white/5 rounded-lg border border-white/10 p-0.5">
                                    <button onClick={() => { if (!selectedElem) return; const s = fontStyles[selectedElem] || { b: false, i: false }; setFontStyles(p => ({ ...p, [selectedElem]: { ...s, b: !s.b } })); }}
                                        disabled={!selectedElem || selectedElem === 'barcode' || selectedElem === 'logo'}
                                        className={`p-1.5 rounded-md transition-all ${selectedElem && fontStyles[selectedElem]?.b ? 'bg-primary text-white' : 'text-secondary hover:text-white'}`}>
                                        <Bold size={14} />
                                    </button>
                                    <button onClick={() => { if (!selectedElem) return; const s = fontStyles[selectedElem] || { b: false, i: false }; setFontStyles(p => ({ ...p, [selectedElem]: { ...s, i: !s.i } })); }}
                                        disabled={!selectedElem || selectedElem === 'barcode' || selectedElem === 'logo'}
                                        className={`p-1.5 rounded-md transition-all ${selectedElem && fontStyles[selectedElem]?.i ? 'bg-primary text-white' : 'text-secondary hover:text-white'}`}>
                                        <Italic size={14} />
                                    </button>
                                    <button onClick={() => { if (!selectedElem) return; const s = fontStyles[selectedElem] || { b: false, i: false }; setFontStyles(p => ({ ...p, [selectedElem]: { ...s, box: !s.box } })); }}
                                        disabled={!selectedElem || selectedElem === 'barcode' || selectedElem === 'logo'}
                                        className={`p-1.5 rounded-md transition-all ${selectedElem && fontStyles[selectedElem]?.box ? 'bg-primary text-white' : 'text-secondary hover:text-white'}`}
                                        title="Kutu / Çerçeve Ekle">
                                        <Square size={14} />
                                    </button>
                                </div>

                                {/* Alignments */}
                                <div className="flex bg-white/5 rounded-lg border border-white/10 p-0.5">
                                    {(['left', 'center', 'right'] as const).map((a, i) => {
                                        const Icon = [AlignLeft, AlignCenter, AlignRight][i];
                                        const isActive = selectedElem && getAlign(selectedElem) === a;
                                        return (
                                            <button key={a} onClick={() => setAlign(a)}
                                                disabled={!selectedElem || selectedElem === 'barcode' || selectedElem === 'logo'}
                                                className={`p-1.5 rounded-md transition-all ${isActive ? 'bg-primary text-white' : 'text-secondary hover:text-white'}`}>
                                                <Icon size={14} />
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Color Picker */}
                                <div className="flex items-center gap-2 bg-white/5 rounded-lg border border-white/10 p-0.5 px-2">
                                    <Palette size={14} className="text-secondary" />
                                    <input type="color" value={selectedElem ? (colors[selectedElem] || (selectedElem === 'brand' ? '#1565C0' : '#111111')) : '#111111'}
                                        disabled={!selectedElem || selectedElem === 'barcode' || selectedElem === 'logo'}
                                        onChange={e => { if (selectedElem) setColors(p => ({ ...p, [selectedElem]: e.target.value })); }}
                                        className="w-5 h-5 bg-transparent border-none cursor-pointer" />
                                </div>
                                <div className="flex ml-auto bg-white/5 rounded-lg border border-white/10 p-0.5">
                                    <button onClick={() => setGlobalBorder(p => !p)}
                                        className={`px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-black rounded-md transition-all ${globalBorder ? 'bg-amber-500 text-black' : 'text-amber-500 hover:bg-amber-500/10'}`}>
                                        <Square size={12} /> ANA ÇERÇEVE
                                    </button>
                                </div>
                            </div>

                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 flex items-center gap-2">
                                <Move size={14} className="text-amber-400 flex-shrink-0" />
                                <span className="text-xs text-amber-300">Tıkla seç • Sürükle taşı • Hizala</span>
                            </div>

                            {/* ── Canvas ── */}
                            <div className="flex justify-center items-start overflow-auto bg-white/5 rounded-xl p-4">
                                <div
                                    ref={canvasRef}
                                    style={{
                                        position: 'relative',
                                        width: cfg.widthMm * PS,
                                        height: cfg.heightMm * PS,
                                        boxSizing: 'border-box',
                                        padding: '0',
                                        background: '#fff',
                                        overflow: 'hidden',
                                        flexShrink: 0,
                                        userSelect: 'none',
                                        cursor: dragRef.current ? 'grabbing' : 'default',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                                        border: '1px solid #ddd',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    onMouseMove={onMouseMove}
                                    onMouseUp={stopDrag}
                                    onMouseLeave={stopDrag}
                                >
                                    {templateId === 'raf' ? (
                                        <div style={{ width: '420px', background: '#fff', color: '#000', padding: '5px 40px 0 0', margin: '0 auto', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif' }}>
                                            <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', border: '2px solid #000', color: '#000' }}>
                                                <tbody>
                                                    {/* Row 1: Name (No-Clip Update) */}
                                                    <tr>
                                                        <td colSpan={2} style={{ borderBottom: '2px solid #000', padding: '2px 5px 10px 5px', textAlign: 'center', color: '#000', verticalAlign: 'top' }}>
                                                            <b style={{
                                                                fontSize: previewProduct.name.length > 30 ? '12px' : '15px',
                                                                color: '#000',
                                                                lineHeight: '1.0',
                                                                fontWeight: '900',
                                                                display: 'block',
                                                                fontFamily: 'Arial Narrow, Arial, sans-serif'
                                                            }}>
                                                                {getTxt('name', previewProduct.name)}
                                                            </b>
                                                        </td>
                                                    </tr>

                                                    {/* Row 2: Middle Split 40/60 */}
                                                    <tr>
                                                        <td style={{ width: '40%', padding: '3px', borderRight: '2px solid #000', verticalAlign: 'top', color: '#000' }}>
                                                            <div style={{ textAlign: 'left', color: '#000' }}>
                                                                <canvas id={`bc-prev-${previewProduct.id}`} style={{ width: '100%', maxWidth: '110px', display: 'block', margin: '0 auto', filter: 'brightness(0)' }} />
                                                                <div style={{ fontSize: '8px', color: '#000', marginTop: '2px', fontWeight: 'bold' }}>
                                                                    Değ. Tarihi: {new Date().toLocaleDateString('tr-TR')}<br />
                                                                    Üretim Yeri: TÜRKİYE
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td style={{ width: '60%', padding: '5px', textAlign: 'right', verticalAlign: 'middle', color: '#000' }}>
                                                            <div style={{ fontSize: '36px', fontWeight: '900', color: '#000', letterSpacing: '-1px', lineHeight: '0.8' }}>
                                                                {Math.floor(Number(previewProduct.sale_price))}
                                                                <span style={{ fontSize: '14px', verticalAlign: 'top', color: '#000', marginLeft: '1px' }}>
                                                                    ,{(Number(previewProduct.sale_price) % 1).toFixed(2).substring(2)}₺
                                                                </span>
                                                            </div>
                                                            <div style={{ fontSize: '7.5px', fontWeight: 'bold', color: '#000', marginTop: '4px' }}>KDV Dahildir</div>
                                                        </td>
                                                    </tr>

                                                    {/* Row 3: Footer Branding */}
                                                    <tr>
                                                        <td colSpan={2} style={{ borderTop: '2px solid #000', padding: '3px', color: '#000' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 3px', color: '#000' }}>
                                                                <div style={{ fontSize: '8px', fontWeight: '900', color: '#000', textAlign: 'left', whiteSpace: 'pre-line', lineHeight: '1' }}>
                                                                    {getTxt('brand', brandName + "\nET&TAVUK DÜNYASI")}
                                                                </div>
                                                                <img
                                                                    src="https://ticaret.gov.tr/data/5ba20d5913b87610d0a032ca/buyuk/fff9b941b1322366ed66dc5e2188453c.jpg"
                                                                    width="60"
                                                                    alt="Yerli Üretim"
                                                                    style={{ filter: 'grayscale(1) contrast(2)' }}
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Frame Renderer */}
                                            {(globalBorder || templateId === 'raf' || templateId === 'rp80') && (() => {
                                                const id: ElemId = 'frame';
                                                const isSel = selectedElem === id;
                                                const fS = fontScales[id] ?? 1;
                                                const wPx = getEW(id, cfg.widthMm * PS - 10);
                                                const hPx = fontScales[id] ? (cfg.heightMm * PS * fS) : (cfg.defaultHeights?.[id] || (cfg.heightMm * PS - 40));

                                                return (
                                                    <div style={{
                                                        position: 'absolute',
                                                        left: getPos(id).xMm * PS,
                                                        top: getPos(id).yMm * PS,
                                                        width: wPx,
                                                        height: hPx,
                                                        border: '3px solid #000',
                                                        boxSizing: 'border-box',
                                                        cursor: 'grab',
                                                        outline: isSel ? '2px solid #6366f1' : 'none',
                                                        outlineOffset: 4,
                                                        zIndex: isSel ? 999 : 5,
                                                        pointerEvents: 'auto'
                                                    }}
                                                        onMouseDown={e => { startDrag(e, id); setSelectedElem(id); }}
                                                    >
                                                        {isSel && <>{mkH(id, 'mr', wPx, fS)}{mkH(id, 'bc', wPx, fS)}{mkH(id, 'br', wPx, fS)}</>}
                                                    </div>
                                                );
                                            })()}

                                            {/* Guides */}
                                            {/* Guides */}
                                            {showGuides.x && <div style={{ position: 'absolute', left: (cfg.widthMm / 2) * PS, top: 0, bottom: 0, width: 1, background: '#6366f1', zIndex: 0, opacity: 0.5 }} />}
                                            {showGuides.y && <div style={{ position: 'absolute', top: (cfg.heightMm / 2) * PS, left: 0, right: 0, height: 1, background: '#6366f1', zIndex: 0, opacity: 0.5 }} />}

                                            {/* Logo / Birim Fiyat Kutusu */}
                                            {cfg.showLogo && (() => {
                                                const id: ElemId = 'logo';
                                                const isSel = selectedElem === id;
                                                const isRaf = templateId === 'raf';
                                                if (isRaf) {
                                                    const txt = getTxt(id, "BİRİM FİYAT\n181.00 TL/KG");
                                                    return (
                                                        <div style={{ position: 'absolute', left: getPos(id).xMm * PS, top: getPos(id).yMm * PS, width: getEW(id, 120), cursor: (isRaf ? 'default' : 'grab'), outline: isSel ? '2px solid #6366f1' : 'none', outlineOffset: 4, zIndex: isSel ? 50 : 10, boxSizing: 'border-box' }}
                                                            onMouseDown={e => { if (isRaf) return; startDrag(e, id); setSelectedElem(id); }}
                                                        >
                                                            <div style={{ fontSize: 8, fontWeight: 900, color: '#000', textAlign: 'left', lineHeight: 1.0, border: '1px solid #000', padding: '1px 4px', boxSizing: 'border-box' }}>
                                                                {txt.split('\n').map((line, i) => <div key={i} style={{ fontSize: i === 0 ? 6.5 : 7, letterSpacing: -0.2 }}>{line}</div>)}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div style={{ position: 'absolute', left: getPos(id).xMm * PS, top: getPos(id).yMm * PS, width: 28 * PS, height: 16 * PS, cursor: 'grab', outline: isSel ? '2px solid #6366f1' : 'none', outlineOffset: 4, zIndex: isSel ? 50 : 10 }}
                                                        onMouseDown={e => { startDrag(e, id); setSelectedElem(id); }}
                                                    >
                                                        <img src={customLogo || "/logo.png"} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                        {isSel && <>{mkH(id, 'mr', 28 * PS, 1)}</>}
                                                    </div>
                                                );
                                            })()}

                                            {/* Brand (Raf şablonunda Mağaza Adı Box olarak kullanacağız) */}
                                            {cfg.showBrand && (() => {
                                                const id: ElemId = 'brand';
                                                const isSel = selectedElem === id;
                                                const isEdit = editingElem === id;
                                                const isRaf = templateId === 'raf';
                                                const txt = getTxt(id, isRaf ? brandName + "\nET&TAVUK DÜNYASI" : brandName);
                                                const clr = colors[id] || '#000';
                                                const sty = fontStyles[id] || { b: false, i: false };
                                                return (
                                                    <div style={{ position: 'absolute', left: getPos(id).xMm * PS, top: getPos(id).yMm * PS, width: getEW(id, isRaf ? 232 : 140), cursor: isEdit ? 'text' : 'grab', outline: isSel ? '2px solid #6366f1' : 'none', outlineOffset: 4, zIndex: isSel || isEdit ? 50 : 10 }}
                                                        onMouseDown={e => { if (isEdit) return; startDrag(e, id); setSelectedElem(id); }}
                                                        onDoubleClick={() => setEditingElem(id)}
                                                    >
                                                        <div style={{
                                                            fontSize: getFS(id, cfg.brandFontMm),
                                                            fontWeight: 900,
                                                            color: clr,
                                                            whiteSpace: 'pre-line',
                                                            lineHeight: 1.1,
                                                            textAlign: 'center',
                                                            fontFamily: 'Arial, sans-serif',
                                                            border: isRaf || sty.box ? `1.5px solid ${clr}` : 'none',
                                                            padding: '2px'
                                                        }}>{txt}</div>
                                                    </div>
                                                );
                                            })()}

                                            {/* Name */}
                                            {cfg.showName && (() => {
                                                const id: ElemId = 'name';
                                                const isSel = selectedElem === id;
                                                const isEdit = editingElem === id;
                                                const isRaf = templateId === 'raf';
                                                const fS = fontScales[id] ?? 1;
                                                const wPx = getEW(id, cfg.widthMm * PS * 0.8);
                                                const txt = getTxt(id, previewProduct.name);
                                                const clr = colors[id] || '#111';
                                                const sty = fontStyles[id] || { b: false, i: false };

                                                let baseFS = getFS(id, cfg.nameFontMm);
                                                if (txt.length > 50) { baseFS *= 0.75; }
                                                else if (txt.length > 30) { baseFS *= 0.88; }

                                                return (
                                                    <div style={{ position: 'absolute', left: getPos(id).xMm * PS, top: getPos(id).yMm * PS, width: wPx, cursor: isEdit ? 'text' : 'grab', outline: isSel ? '2px solid #6366f1' : 'none', outlineOffset: 4, borderRadius: 2, zIndex: isSel || isEdit ? 50 : 10, overflow: 'hidden' }}
                                                        onMouseDown={e => { if (isEdit) return; startDrag(e, id); setSelectedElem(id); }}
                                                        onDoubleClick={() => setEditingElem(id)}
                                                    >
                                                        {isEdit ? (
                                                            <textarea autoFocus rows={3} defaultValue={txt} style={{ fontSize: baseFS, fontWeight: 900, color: clr, textAlign: getAlign(id), lineHeight: 1.2, background: 'rgba(255,255,255,0.95)', border: 'none', width: '100%', resize: 'none', fontFamily: 'Arial, sans-serif', padding: 2 }}
                                                                onBlur={e => { setCustomTexts(p => ({ ...p, [id]: e.target.value })); setEditingElem(null); }}
                                                                onKeyDown={e => { if (e.key === 'Escape') { setCustomTexts(p => ({ ...p, [id]: e.currentTarget.value })); setEditingElem(null); } }}
                                                                onClick={e => e.stopPropagation()} />
                                                        ) : (
                                                            <div style={{ fontSize: baseFS, fontWeight: 900, color: clr, lineHeight: 1.1, textAlign: getAlign(id), wordBreak: 'break-word', border: isRaf || sty.box ? `1.5px solid ${clr}` : 'none', padding: 2, fontFamily: 'Arial, sans-serif', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{txt}</div>
                                                        )}
                                                        {isSel && !isEdit && <>{mkH(id, 'mr', wPx, fS)}</>}
                                                    </div>
                                                );
                                            })()}

                                            {/* Price */}
                                            {cfg.showPrice && (() => {
                                                const id: ElemId = 'price';
                                                const isSel = selectedElem === id;
                                                const isRaf = templateId === 'raf';
                                                const fS = fontScales[id] ?? 1;
                                                const wPx = getEW(id, isRaf ? 75 : 120);
                                                return (
                                                    <div style={{ position: 'absolute', left: getPos(id).xMm * PS, top: getPos(id).yMm * PS, width: wPx, cursor: 'grab', outline: isSel ? '2px solid #6366f1' : 'none', outlineOffset: 4, zIndex: isSel ? 50 : 10, transform: `scale(${fS})`, transformOrigin: 'top left', overflow: 'hidden' }}
                                                        onMouseDown={e => { startDrag(e, id); setSelectedElem(id); }}
                                                    >
                                                        <PriceDisplay cfg={cfg} product={previewProduct} scale={PS} />
                                                        {isSel && <>{mkH(id, 'mr', wPx, fS)}</>}
                                                    </div>
                                                );
                                            })()}

                                            {/* Barcode */}
                                            {cfg.showBarcode && previewProduct.barcode && (() => {
                                                const id: ElemId = 'barcode';
                                                const isSel = selectedElem === id;
                                                return (
                                                    <div style={{ position: 'absolute', left: getPos(id).xMm * PS, top: getPos(id).yMm * PS, width: getEW(id, 85), cursor: 'grab', outline: isSel ? '2px solid #6366f1' : 'none', outlineOffset: 4, zIndex: isSel ? 50 : 10, transform: `scale(${barcodeScale})`, transformOrigin: 'top left', background: '#fff', overflow: 'hidden' }}
                                                        onMouseDown={e => { startDrag(e, id); setSelectedElem(id); }}
                                                    >
                                                        <canvas id={`bc-prev-${previewProduct.id}`} style={{ height: 'auto', display: 'block', maxWidth: '100%' }} />
                                                        {templateId === 'raf' && <div style={{ fontSize: 7, fontWeight: 900, marginTop: -4, textAlign: 'left' }}>Değ. Tarihi: {new Date().toLocaleDateString('tr-TR')}</div>}
                                                        {isSel && <>{mkH(id, 'mr', getEW(id, 85), 10)}</>}
                                                    </div>
                                                );
                                            })()}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="text-xs text-secondary text-center space-y-0.5">
                                <p>Ürün: <strong className="text-white">{previewProduct.name}</strong></p>
                                <p>Şablon: <strong className="text-primary">{cfg.widthMm}×{cfg.heightMm}mm</strong></p>
                                <p>Toplam: <strong className="text-emerald-400">{selectedProducts.reduce((s, id) => s + (labelCount[id] || 1), 0)} etiket</strong></p>
                            </div>

                            {/* ── Printing Overlay ── */}
                            {isPrintingProgress && (
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-6 text-center rounded-xl">
                                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                                    <h4 className="text-xl font-black text-white uppercase tracking-widest animate-pulse">
                                        Yazdırılıyor...
                                    </h4>
                                    <p className="text-secondary text-sm mt-2">
                                        {activePrintProduct?.name} hazırlanıyor.<br />
                                        Lütfen tarayıcıyı/pencereyi kapatmayın.
                                    </p>
                                    <div className="mt-6 w-full max-w-[200px] h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary animate-progress" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
