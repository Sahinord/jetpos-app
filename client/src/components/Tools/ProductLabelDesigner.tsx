"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
    Tag, Printer, Eye, Package, Building2,
    RotateCcw, Layers, Upload, Check, Search, Move,
    AlignLeft, AlignCenter, AlignRight, Bold, Italic, Palette
} from "lucide-react";
import JsBarcode from "jsbarcode";
import { useTenant } from "@/lib/tenant-context";

/* ── Types ── */
interface Product {
    id: string; name: string; barcode: string;
    sale_price: number; purchase_price: number; vat_rate: number;
}
const showToast = (msg: string, type: string = 'info') => {
    // JetKasa'da genelde window.dispatchEvent veya prop olarak gelir ama burada basit bir log/alert veya varsa UI sistemini kullanabiliriz
    console.log(`[Toast] ${type}: ${msg}`);
};
type TemplateId = 'raf' | 'fiyat' | 'yanyan' | 'market' | 'standard' | 'mini' | 'large' | 'rp80' | 'square-40' | 'vertical-30-50' | 'price-only';
type ElemId = 'brand' | 'name' | 'price' | 'barcode' | 'logo';
interface Pos { xMm: number; yMm: number; }
interface LabelConfig {
    id: TemplateId; name: string;
    widthMm: number; heightMm: number;
    showLogo: boolean; showBrand: boolean; showName: boolean;
    showBarcode: boolean; showPrice: boolean; showVat: boolean;
    nameFontMm: number; priceFontMm: number; brandFontMm: number; barcodeHMm: number;
    defaultPos: Partial<Record<ElemId, Pos>>;
    isRotated?: boolean;
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
        id: 'raf', name: '🏷️ Raf Etiketi (100×38mm)',
        widthMm: 100, heightMm: 38,
        showLogo: true, showBrand: true, showName: true, showBarcode: true, showPrice: true, showVat: true,
        nameFontMm: 8, priceFontMm: 14, brandFontMm: 4.5, barcodeHMm: 10,
        defaultPos: { brand: { xMm: 2, yMm: 2 }, name: { xMm: 2, yMm: 7 }, logo: { xMm: 2, yMm: 27 }, price: { xMm: 60, yMm: 5 }, barcode: { xMm: 57, yMm: 19 } },
    },
    {
        id: 'fiyat', name: '💰 Fiyat Etiketi (90×30mm)',
        widthMm: 90, heightMm: 30,
        showLogo: false, showBrand: true, showName: true, showBarcode: true, showPrice: true, showVat: true,
        nameFontMm: 6.5, priceFontMm: 13, brandFontMm: 4, barcodeHMm: 14,
        defaultPos: { name: { xMm: 2, yMm: 2 }, price: { xMm: 2, yMm: 12 }, brand: { xMm: 53, yMm: 21 }, barcode: { xMm: 51, yMm: 3 } },
    },
    {
        id: 'yanyan', name: '🎟️ Yanlamasına Etiket (90×38mm)',
        widthMm: 90, heightMm: 38,
        showLogo: true, showBrand: true, showName: true, showBarcode: true, showPrice: true, showVat: true,
        nameFontMm: 9.5, priceFontMm: 15, brandFontMm: 4.5, barcodeHMm: 13,
        defaultPos: { brand: { xMm: 2, yMm: 1.5 }, name: { xMm: 2, yMm: 6 }, price: { xMm: 2, yMm: 24 }, barcode: { xMm: 56, yMm: 2 }, logo: { xMm: 56, yMm: 30 } },
    },
    {
        id: 'market', name: '🏪 Market Etiketi (58×40mm)',
        widthMm: 58, heightMm: 40,
        showLogo: false, showBrand: true, showName: true, showBarcode: true, showPrice: true, showVat: false,
        nameFontMm: 7, priceFontMm: 11, brandFontMm: 4.5, barcodeHMm: 10,
        defaultPos: { brand: { xMm: 2, yMm: 2 }, name: { xMm: 2, yMm: 7 }, barcode: { xMm: 3, yMm: 19 }, price: { xMm: 3, yMm: 31 } },
    },
    {
        id: 'standard', name: 'Standart (50×30mm)',
        widthMm: 50, heightMm: 30,
        showLogo: false, showBrand: false, showName: true, showBarcode: true, showPrice: true, showVat: false,
        nameFontMm: 6.5, priceFontMm: 10, brandFontMm: 4, barcodeHMm: 9,
        defaultPos: { name: { xMm: 2.5, yMm: 2 }, barcode: { xMm: 2.5, yMm: 10 }, price: { xMm: 2.5, yMm: 22 } },
    },
    {
        id: 'mini', name: 'Mini – Barkod (40×20mm)',
        widthMm: 40, heightMm: 20,
        showLogo: false, showBrand: false, showName: false, showBarcode: true, showPrice: true, showVat: false,
        nameFontMm: 5, priceFontMm: 7, brandFontMm: 4, barcodeHMm: 8,
        defaultPos: { barcode: { xMm: 2, yMm: 1 }, price: { xMm: 2, yMm: 13 } },
    },
    {
        id: 'large', name: 'Büyük (80×50mm)',
        widthMm: 80, heightMm: 50,
        showLogo: true, showBrand: true, showName: true, showBarcode: true, showPrice: true, showVat: true,
        nameFontMm: 9, priceFontMm: 14, brandFontMm: 6, barcodeHMm: 14,
        defaultPos: { brand: { xMm: 2, yMm: 2 }, name: { xMm: 2, yMm: 9 }, logo: { xMm: 2, yMm: 40 }, barcode: { xMm: 40, yMm: 2 }, price: { xMm: 40, yMm: 22 } },
    },
    {
        id: 'rp80', name: '🖨️ Rongta RP80 (80×30mm/40mm)',
        widthMm: 80, heightMm: 40,
        showLogo: false, showBrand: true, showName: true, showBarcode: true, showPrice: true, showVat: true,
        nameFontMm: 7, priceFontMm: 13, brandFontMm: 4.5, barcodeHMm: 10,
        defaultPos: {
            name: { xMm: 4, yMm: 4 },
            barcode: { xMm: 4, yMm: 15 },
            price: { xMm: 4, yMm: 28 },
            brand: { xMm: 45, yMm: 28 }
        },
    },
    {
        id: 'square-40', name: '🔲 Kare (40×40mm)',
        widthMm: 40, heightMm: 40,
        showLogo: false, showBrand: true, showName: true, showBarcode: true, showPrice: true, showVat: false,
        nameFontMm: 7, priceFontMm: 10, brandFontMm: 4, barcodeHMm: 10,
        defaultPos: { name: { xMm: 2, yMm: 2 }, barcode: { xMm: 2, yMm: 15 }, price: { xMm: 2, yMm: 28 }, brand: { xMm: 2, yMm: 35 } },
    },
    {
        id: 'vertical-30-50', name: '📐 Dikey (30×50mm)',
        widthMm: 30, heightMm: 50,
        showLogo: false, showBrand: true, showName: true, showBarcode: true, showPrice: true, showVat: false,
        nameFontMm: 6, priceFontMm: 9, brandFontMm: 4, barcodeHMm: 8,
        defaultPos: { name: { xMm: 2, yMm: 2 }, barcode: { xMm: 2, yMm: 15 }, price: { xMm: 2, yMm: 30 }, brand: { xMm: 2, yMm: 42 } },
    },
    {
        id: 'price-only', name: 'Sadece Fiyat (30×20mm)',
        widthMm: 30, heightMm: 20,
        showLogo: false, showBrand: false, showName: true, showBarcode: false, showPrice: true, showVat: false,
        nameFontMm: 5.5, priceFontMm: 11, brandFontMm: 4, barcodeHMm: 0,
        defaultPos: { name: { xMm: 2, yMm: 2 }, price: { xMm: 2, yMm: 9 } },
    },
];

/* ── Price renderer helpers ── */
function PriceDisplay({ cfg, product, scale }: { cfg: LabelConfig; product: Product; scale: number }) {
    const [int, dec] = product.sale_price.toFixed(2).split('.');
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 2 * scale }}>
            <span style={{ fontSize: cfg.priceFontMm * scale, fontWeight: 900, color: '#111', letterSpacing: -1, lineHeight: 1 }}>{int}</span>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: scale * 0.5 }}>
                <span style={{ fontSize: cfg.priceFontMm * 0.55 * scale, fontWeight: 900, color: '#111', lineHeight: 1 }}>,{dec}</span>
                <span style={{ fontSize: cfg.brandFontMm * 0.9 * scale, fontWeight: 700, color: '#111' }}>TL</span>
                {cfg.showVat && (
                    <span style={{ fontSize: cfg.brandFontMm * 0.6 * scale, color: '#666', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
                        KDV Dahil
                    </span>
                )}
            </div>
        </div>
    );
}

function priceHtmlMm(cfg: LabelConfig, product: Product, pos: Pos): string {
    const [int, dec] = product.sale_price.toFixed(2).split('.');
    return `<div style="position:absolute;left:${pos.xMm}mm;top:${pos.yMm}mm;display:flex;align-items:flex-start;gap:1mm;">
  <span style="font-size:${cfg.priceFontMm}mm;font-weight:900;color:#111;letter-spacing:-1px;line-height:1;">${int}</span>
  <div style="display:flex;flex-direction:column;margin-top:0.5mm;">
    <span style="font-size:${cfg.priceFontMm * 0.55}mm;font-weight:900;color:#111;line-height:1;">,${dec}</span>
    <span style="font-size:${cfg.brandFontMm * 0.9}mm;font-weight:700;color:#111;">TL</span>
    ${cfg.showVat ? `<span style="font-size:${cfg.brandFontMm * 0.6}mm;color:#666;font-style:italic;">KDV Dahil</span>` : ''}
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
            return (localStorage.getItem('last_label_template') as TemplateId) || 'raf';
        }
        return 'raf';
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
    const [fontStyles, setFontStyles] = useState<Partial<Record<ElemId, { b: boolean; i: boolean }>>>({});
    const [barcodeNarrow, setBarcodeNarrow] = useState(2);
    const [showGuides, setShowGuides] = useState<{ x: boolean; y: boolean }>({ x: false, y: false });

    const resizeDragRef = useRef<{ id: ElemId; handle: string; startX: number; startY: number; origW: number; origS: number } | null>(null);

    /* ─ persistence (auto-save) ─ */
    useEffect(() => {
        const saved = localStorage.getItem(`label_design_${templateId}`);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.positions) setPositions(data.positions);
                if (data.alignments) setAlignments(data.alignments);
                if (data.fontScales) setFontScales(data.fontScales);
                if (data.elemWidths) setElemWidths(data.elemWidths);
                if (data.colors) setColors(data.colors);
                if (data.fontStyles) setFontStyles(data.fontStyles);
            } catch (e) { console.error("Load error", e); }
        } else {
            // No save found, reset to defaults
            setPositions({});
            setCfgOverrides({});
            setAlignments({});
            setCustomTexts({});
            setFontScales({});
            setElemWidths({});
            setColors({});
            setFontStyles({});
        }
        setSelectedElem(null);
        setEditingElem(null);
    }, [templateId]);

    useEffect(() => {
        const data = { positions, alignments, fontScales, elemWidths, colors, fontStyles };
        localStorage.setItem(`label_design_${templateId}`, JSON.stringify(data));
    }, [templateId, positions, alignments, fontScales, elemWidths, colors, fontStyles]);

    const getAlign = (id: ElemId): Align => alignments[id] ?? 'left';
    const setAlign = (align: Align) => {
        if (!selectedElem) return;
        setAlignments(prev => ({ ...prev, [selectedElem]: align }));
    };

    const cfg: LabelConfig = { ...TEMPLATES.find(t => t.id === templateId)!, ...cfgOverrides };
    const brandName = customBrandName || currentTenant?.company_name || 'JetPOS';
    const logoUrl = customLogo || currentTenant?.logo_url || '';

    const getPos = useCallback((id: ElemId): Pos => {
        return positions[id] ?? cfg.defaultPos[id] ?? { xMm: 2, yMm: 2 };
    }, [positions, cfg]);


    /* ─ barcode drawing ─ */
    const drawBarcode = useCallback((canvasId: string, barcode: string, heightMm: number) => {
        try {
            const el = document.getElementById(canvasId) as HTMLCanvasElement | null;
            if (!el || !barcode) return;
            JsBarcode(el, barcode, { format: 'CODE128', width: 1.2, height: Math.round(heightMm * PS), displayValue: true, fontSize: 8, margin: 2, textMargin: 1 });
        } catch { /* */ }
    }, []);

    const previewProduct = selectedProducts.map(id => products.find(p => p.id === id)).filter(Boolean)[0] as Product | undefined;

    useEffect(() => {
        if (!showPreview || !previewProduct?.barcode) return;
        const id = `bc-prev-${previewProduct.id}`;
        setTimeout(() => drawBarcode(id, previewProduct.barcode, cfg.barcodeHMm), 50);
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

    /* ─ print ─ */
    const handlePrint = async () => {
        showToast('Etiketler hazırlanıyor...');

        // 1. Barkodları Data URL (Base64) olarak önceden üret
        const generateBarcodeDataUrl = (barcode: string) => {
            const canvas = document.createElement('canvas');
            const isEAN13 = /^\d{13}$/.test(barcode);
            try {
                JsBarcode(canvas, barcode, {
                    format: isEAN13 ? 'EAN13' : 'CODE128',
                    width: isEAN13 ? 1.5 : 2, // EAN13 needs slightly more precision
                    height: 60,
                    displayValue: true,
                    fontSize: 14,
                    margin: 5,
                    textMargin: 2,
                    lineColor: '#000000',
                    background: '#ffffff'
                });
                return canvas.toDataURL('image/png');
            } catch (e) {
                console.error("Barcode generation error:", e);
                return '';
            }
        };

        const toLabel = (p: Product, idx: number, barcodeImg: string) => {
            const imgH = cfg.heightMm * 0.15;
            const aln = (id: ElemId) => alignments[id] ?? 'left';
            const fsMm = (id: ElemId, base: number) => base * (fontScales[id] ?? 1);
            const wMm = (id: ElemId, def: number) => (elemWidths[id] ?? (def * PS)) / PS;
            const clr = (id: ElemId, def: string) => colors[id] ?? def;
            const sty = (id: ElemId) => fontStyles[id] || { b: false, i: false };

            const parts: string[] = [];
            if (cfg.showBrand && brandName) {
                const s = sty('brand');
                parts.push(`<div style="position:absolute;left:${getPos('brand').xMm}mm;top:${getPos('brand').yMm}mm;font-size:${fsMm('brand', cfg.brandFontMm)}mm;font-weight:900;font-style:${s.i ? 'italic' : 'normal'};color:${clr('brand', '#000')}!important;text-transform:uppercase;text-align:${aln('brand')};max-width:${wMm('brand', cfg.widthMm * 0.45)}mm;word-wrap:break-word;line-height:1.2;">${getTxt('brand', brandName)}</div>`);
            }
            if (cfg.showName) {
                const s = sty('name');
                parts.push(`<div style="position:absolute;left:${getPos('name').xMm}mm;top:${getPos('name').yMm}mm;font-size:${fsMm('name', cfg.nameFontMm)}mm;font-weight:900;font-style:${s.i ? 'italic' : 'normal'};color:#000!important;text-align:${aln('name')};max-width:${wMm('name', cfg.widthMm * 0.58)}mm;word-wrap:break-word;line-height:1.2;">${getTxt('name', p.name)}</div>`);
            }
            if (cfg.showPrice) {
                const s = sty('price');
                const [int, dec] = p.sale_price.toFixed(2).split('.');
                parts.push(`<div style="position:absolute;left:${getPos('price').xMm}mm;top:${getPos('price').yMm}mm;color:#000!important;font-weight:900;font-style:${s.i ? 'italic' : 'normal'};display:flex;align-items:flex-start;gap:1.5mm;zoom:${fontScales['price'] ?? 1};transform-origin:top left;">
                    <span style="font-size:${cfg.priceFontMm}mm;font-weight:900;line-height:1;color:#000!important;">${int}</span>
                    <div style="display:flex;flex-direction:column;margin-top:0.5mm;">
                        <span style="font-size:${cfg.priceFontMm * 0.55}mm;font-weight:900;line-height:1;color:#000!important;">,${dec}</span>
                        <span style="font-size:${cfg.brandFontMm * 0.9}mm;font-weight:900;color:#000!important;">TL</span>
                        ${cfg.showVat ? `<span style="font-size:${cfg.brandFontMm * 0.6}mm;color:#000!important;font-style:italic;white-space:nowrap;">KDV Dahil</span>` : ''}
                    </div>
                </div>`);
            }
            if (cfg.showBarcode && barcodeImg) {
                parts.push(`<div style="position:absolute;left:${getPos('barcode').xMm}mm;top:${getPos('barcode').yMm}mm;"><img src="${barcodeImg}" style="height:${cfg.barcodeHMm}mm;width:auto;max-width:${cfg.widthMm - 5}mm;" /></div>`);
            }
            if (cfg.showLogo && logoUrl) {
                parts.push(`<div style="position:absolute;left:${getPos('logo').xMm}mm;top:${getPos('logo').yMm}mm;"><img src="${logoUrl}" style="height:${imgH}mm;object-fit:contain;" /></div>`);
            }

            const rotStyle = isRotated
                ? `transform: rotate(90deg) translateY(-${cfg.heightMm}mm); transform-origin: top left; width: ${cfg.heightMm}mm; height: ${cfg.widthMm}mm;`
                : `width: ${cfg.widthMm}mm; height: ${cfg.heightMm}mm;`;

            return `<div class="label-box" style="position:relative; overflow:hidden; ${rotStyle}">${parts.join('')}</div>`;
        };

        const labelsHtml = selectedProducts.flatMap(pid => {
            const pr = products.find(p => p.id === pid);
            if (!pr) return [];
            const barcodeImg = pr.barcode ? generateBarcodeDataUrl(pr.barcode) : '';
            return Array.from({ length: labelCount[pid] || 1 }, (_, i) => toLabel(pr, i, barcodeImg));
        }).join('');

        const finalWidth = isRotated ? cfg.heightMm : cfg.widthMm;
        const finalHeight = isRotated ? cfg.widthMm : cfg.heightMm;

        const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
    @page { margin: 0; size: ${finalWidth}mm ${finalHeight}mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { 
        margin: 0; 
        background: #fff !important; 
        color: #000 !important; 
        font-family: Arial, sans-serif; 
        width: ${finalWidth}mm;
        height: ${finalHeight}mm;
        overflow: hidden;
    }
    .label-box { 
        width: ${finalWidth}mm; 
        height: ${finalHeight}mm; 
        overflow: hidden; 
        background: #fff !important;
        page-break-after: always;
        position: relative;
    }
    div, span, p { color: #000 !important; }
    img { display: block; max-width: 100%; }
</style></head><body>${labelsHtml}</body></html>`;

        // Sessiz Yazdırma (Electron ise)
        if (window.require) {
            try {
                const { ipcRenderer } = window.require('electron');

                // Eğer RP80 şablonu seçiliyse veya etiket yazıcısıysa RAW (TSPL) moduna geç
                const isLabelMode = templateId === 'rp80' || (printerName || "").toLowerCase().includes('label');

                if (isLabelMode) {
                    // TSPL çoklu baskı için döngüde gönderiyoruz (veya tek seferde toplu TSPL oluşturulabilir)
                    // Burada basitleştirilmiş haliyle her ürün için ayrı gönderiyoruz
                    selectedProducts.forEach(pid => {
                        const pr = products.find(p => p.id === pid);
                        if (!pr) return;
                        const count = labelCount[pid] || 1;
                        for (let i = 0; i < count; i++) {
                            ipcRenderer.send('print-label-tspl', {
                                printerName: printerName || "",
                                product: pr,
                                width: finalWidth,
                                height: finalHeight
                            });
                        }
                    });
                } else {
                    ipcRenderer.send('silent-print', {
                        html: fullHtml,
                        printerName: printerName || "",
                        width: finalWidth,
                        height: finalHeight,
                        delay: 500
                    });
                }
                showToast('Yazdırma işlemi başlatıldı');
                // Yazdırma işlemi tamamlandığında kuyruğu can sıkmadan ufaktan temizleyelim mi?
                // Veya kullanıcıya bir buton sunalım. Şimdilik kalsın ama bir seçenek olsun.
                return;
            } catch (e) {
                console.error('Sessiz yazdırma hatası:', e);
            }
        }

        // iframe ile yazdır (Fallback)
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;opacity:0;';
        document.body.appendChild(iframe);
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
            doc.open();
            doc.write(fullHtml);
            doc.close();
            setTimeout(() => {
                iframe.contentWindow?.print();
                setTimeout(() => { try { document.body.removeChild(iframe); } catch { } }, 1000);
            }, 500);
        }
    };


    /* ─ utils ─ */
    const filtered = products.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const toggleProduct = (id: string) => setSelectedProducts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const updateCount = (id: string, d: number) => setLabelCount(prev => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) + d) }));
    const resetEditor = () => { setPositions({}); setCfgOverrides({}); };

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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* ── SOL: Ayarlar ── */}
                <div className="space-y-4">
                    {/* Şablon */}
                    <div className="glass-card">
                        <h3 className="font-black uppercase text-sm mb-3 flex items-center gap-2">
                            <Layers size={16} className="text-primary" /> Şablon
                        </h3>
                        <div className="space-y-2">
                            {TEMPLATES.map(t => {
                                const displayName = customNames[t.id] || t.name;
                                const isActive = templateId === t.id;
                                const isEditing = editingNameId === t.id;
                                return (
                                    <div
                                        key={t.id}
                                        onClick={() => setTemplateId(t.id)}
                                        onDoubleClick={() => { setEditingNameId(t.id); setEditingNameVal(displayName); }}
                                        className={`w-full p-2 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${isActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'}`}
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
                                                <span className="font-bold text-xs leading-tight block" title="Çift tıkla → İsim değiştir">{displayName}</span>
                                            )}
                                            <span className="text-[10px] text-secondary/60">{t.widthMm}×{t.heightMm}mm</span>
                                        </div>
                                        {isActive && !isEditing && <Check size={14} className="text-primary flex-shrink-0" />}
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
                            <button onClick={() => setPositions({})} className="text-xs text-secondary/60 hover:text-rose-400 flex items-center gap-1 transition-colors">
                                <RotateCcw size={11} /> Sıfırla
                            </button>
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

                                {/* Bold / Italic */}
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
                                        background: '#fff',
                                        border: '1.5px solid #999',
                                        overflow: 'hidden',
                                        flexShrink: 0,
                                        userSelect: 'none',
                                        cursor: dragRef.current ? 'grabbing' : 'default',
                                    }}
                                    onMouseMove={onMouseMove}
                                    onMouseUp={stopDrag}
                                    onMouseLeave={stopDrag}
                                >
                                    {/* Guides */}
                                    {showGuides.x && <div style={{ position: 'absolute', left: (cfg.widthMm / 2) * PS, top: 0, bottom: 0, width: 1, background: '#6366f1', zIndex: 0, opacity: 0.5 }} />}
                                    {showGuides.y && <div style={{ position: 'absolute', top: (cfg.heightMm / 2) * PS, left: 0, right: 0, height: 1, background: '#6366f1', zIndex: 0, opacity: 0.5 }} />}
                                    {/* Brand */}
                                    {cfg.showBrand && brandName && (() => {
                                        const id: ElemId = 'brand';
                                        const isSel = selectedElem === id;
                                        const isEdit = editingElem === id;
                                        const fS = fontScales[id] ?? 1;
                                        const wPx = getEW(id, cfg.widthMm * PS * 0.45);
                                        const txt = getTxt(id, brandName);
                                        const clr = colors[id] || '#1565C0';
                                        const sty = fontStyles[id] || { b: false, i: false };
                                        return (
                                            <div style={{ position: 'absolute', left: getPos(id).xMm * PS, top: getPos(id).yMm * PS, width: wPx, cursor: isEdit ? 'text' : 'grab', outline: isSel ? '2px solid #6366f1' : 'none', outlineOffset: 4, borderRadius: 2, zIndex: isSel || isEdit ? 50 : 10, overflow: 'visible' }}
                                                onMouseDown={e => { if (isEdit) return; startDrag(e, id); setSelectedElem(id); }}
                                                onDoubleClick={() => setEditingElem(id)}
                                            >
                                                {isEdit ? (
                                                    <textarea autoFocus rows={2} defaultValue={txt} style={{ fontSize: getFS(id, cfg.brandFontMm), fontWeight: sty.b ? 900 : 'bold', fontStyle: sty.i ? 'italic' : 'normal', color: clr, textTransform: 'uppercase', textAlign: getAlign(id), lineHeight: 1.2, background: 'rgba(255,255,255,0.95)', border: 'none', outline: '1px dashed #6366f1', width: '100%', resize: 'none', fontFamily: 'Arial', padding: 1 }}
                                                        onBlur={e => { setCustomTexts(p => ({ ...p, [id]: e.target.value })); setEditingElem(null); }}
                                                        onKeyDown={e => { if (e.key === 'Escape') { setCustomTexts(p => ({ ...p, [id]: e.currentTarget.value })); setEditingElem(null); } }}
                                                        onClick={e => e.stopPropagation()} />
                                                ) : (
                                                    <div style={{ fontSize: getFS(id, cfg.brandFontMm), fontWeight: sty.b ? 900 : 'bold', fontStyle: sty.i ? 'italic' : 'normal', color: clr, textTransform: 'uppercase', lineHeight: 1.2, textAlign: getAlign(id), wordBreak: 'break-word' }}>{txt}</div>
                                                )}
                                                {isSel && !isEdit && <>{mkH(id, 'mr', wPx, fS)}{mkH(id, 'bc', wPx, fS)}{mkH(id, 'br', wPx, fS)}</>}
                                            </div>
                                        );
                                    })()}

                                    {/* Name */}
                                    {cfg.showName && (() => {
                                        const id: ElemId = 'name';
                                        const isSel = selectedElem === id;
                                        const isEdit = editingElem === id;
                                        const fS = fontScales[id] ?? 1;
                                        const wPx = getEW(id, cfg.widthMm * PS * 0.6);
                                        const txt = getTxt(id, previewProduct.name);
                                        const clr = colors[id] || '#111';
                                        const sty = fontStyles[id] || { b: false, i: false };
                                        return (
                                            <div style={{ position: 'absolute', left: getPos(id).xMm * PS, top: getPos(id).yMm * PS, width: wPx, cursor: isEdit ? 'text' : 'grab', outline: isSel ? '2px solid #6366f1' : 'none', outlineOffset: 4, borderRadius: 2, zIndex: isSel || isEdit ? 50 : 10, overflow: 'visible' }}
                                                onMouseDown={e => { if (isEdit) return; startDrag(e, id); setSelectedElem(id); }}
                                                onDoubleClick={() => setEditingElem(id)}
                                            >
                                                {isEdit ? (
                                                    <textarea autoFocus rows={3} defaultValue={txt} style={{ fontSize: getFS(id, cfg.nameFontMm), fontWeight: sty.b ? 900 : 800, fontStyle: sty.i ? 'italic' : 'normal', color: clr, textAlign: getAlign(id), lineHeight: 1.2, background: 'rgba(255,255,255,0.95)', border: 'none', outline: '1px dashed #6366f1', width: '100%', resize: 'none', fontFamily: 'Arial', padding: 1 }}
                                                        onBlur={e => { setCustomTexts(p => ({ ...p, [id]: e.target.value })); setEditingElem(null); }}
                                                        onKeyDown={e => { if (e.key === 'Escape') { setCustomTexts(p => ({ ...p, [id]: e.currentTarget.value })); setEditingElem(null); } }}
                                                        onClick={e => e.stopPropagation()} />
                                                ) : (
                                                    <div style={{ fontSize: getFS(id, cfg.nameFontMm), fontWeight: sty.b ? 900 : 800, fontStyle: sty.i ? 'italic' : 'normal', color: clr, lineHeight: 1.2, textAlign: getAlign(id), wordBreak: 'break-word' }}>{txt}</div>
                                                )}
                                                {isSel && !isEdit && <>{mkH(id, 'mr', wPx, fS)}{mkH(id, 'bc', wPx, fS)}{mkH(id, 'br', wPx, fS)}</>}
                                            </div>
                                        );
                                    })()}

                                    {/* Price */}
                                    {cfg.showPrice && (() => {
                                        const id: ElemId = 'price';
                                        const isSel = selectedElem === id;
                                        const fS = fontScales[id] ?? 1;
                                        const wPx = getEW(id, cfg.widthMm * PS * 0.4);
                                        const clr = colors[id] || '#111';
                                        const sty = fontStyles[id] || { b: false, i: false };
                                        return (
                                            <div style={{ position: 'absolute', left: getPos(id).xMm * PS, top: getPos(id).yMm * PS, cursor: 'grab', outline: isSel ? '2px solid #6366f1' : 'none', outlineOffset: 4, borderRadius: 2, zIndex: isSel ? 50 : 10, transform: `scale(${fS})`, transformOrigin: 'top left', color: clr, fontWeight: sty.b ? 900 : 'normal', fontStyle: sty.i ? 'italic' : 'normal' }}
                                                onMouseDown={e => { startDrag(e, id); setSelectedElem(id); }}
                                            >
                                                <PriceDisplay cfg={cfg} product={previewProduct} scale={PS} />
                                                {isSel && <>{mkH(id, 'bc', wPx, fS)}</>}
                                            </div>
                                        );
                                    })()}

                                    {/* Barcode */}
                                    {cfg.showBarcode && previewProduct.barcode && (() => {
                                        const id: ElemId = 'barcode';
                                        const isSel = selectedElem === id;
                                        const fS = fontScales[id] ?? 1;
                                        const wPx = getEW(id, cfg.widthMm * PS * 0.45);
                                        return (
                                            <div style={{ position: 'absolute', left: getPos(id).xMm * PS, top: getPos(id).yMm * PS, cursor: 'grab', outline: isSel ? '2px solid #6366f1' : 'none', outlineOffset: 4, borderRadius: 2, zIndex: isSel ? 50 : 10, width: wPx, background: '#fff', overflow: 'visible' }}
                                                onMouseDown={e => { startDrag(e, id); setSelectedElem(id); }}
                                            >
                                                <canvas id={`bc-prev-${previewProduct.id}`} style={{ width: '100%', height: cfg.barcodeHMm * PS, display: 'block' }} />
                                            </div>
                                        );
                                    })()}

                                    {/* Logo */}
                                    {cfg.showLogo && logoUrl && (() => {
                                        const id: ElemId = 'logo';
                                        const isSel = selectedElem === id;
                                        const fS = fontScales[id] ?? 1;
                                        const wPx = getEW(id, cfg.widthMm * PS * 0.15);
                                        return (
                                            <div style={{ position: 'absolute', left: getPos(id).xMm * PS, top: getPos(id).yMm * PS, cursor: 'grab', outline: isSel ? '2px solid #6366f1' : 'none', outlineOffset: 4, borderRadius: 2, zIndex: isSel ? 50 : 10 }}
                                                onMouseDown={e => { startDrag(e, id); setSelectedElem(id); }}
                                            >
                                                <img src={logoUrl} style={{ height: (cfg.heightMm * PS * 0.15) * fS, objectFit: 'contain', display: 'block' }} alt="logo" />
                                                {isSel && <>{mkH(id, 'br', wPx, fS)}</>}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            <div className="text-xs text-secondary text-center space-y-0.5">
                                <p>Ürün: <strong className="text-white">{previewProduct.name}</strong></p>
                                <p>Şablon: <strong className="text-primary">{cfg.widthMm}×{cfg.heightMm}mm</strong></p>
                                <p>Toplam: <strong className="text-emerald-400">{selectedProducts.reduce((s, id) => s + (labelCount[id] || 1), 0)} etiket</strong></p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
