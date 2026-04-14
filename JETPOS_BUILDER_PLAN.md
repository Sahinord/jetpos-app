# JetPOS Visual Showcase Builder: Technical Roadmap & Architecture

This document outlines the strategic and technical path to upgrading the JetPOS admin panel into a premium, visual-driven "Store Builder" inspired by elite platforms like Ikas and Shopify.

## 1. Vision & Core Philosophy

The goal is to move from a "Settings Form" approach to a "Visual Studio" approach.
*   **WYSWYG (What You See Is What You Get)**: Every change in the sidebar is instantly visible in a live mobile frame.
*   **Block-Based**: The website is not a fixed template but a collection of reordered, customized blocks.
*   **Developer Friendly**: Architecture that allows adding a new "Block Type" in minutes.

---

## 2. Phase 1: The Studio Layout (UI Hub)

Transform the `ShowcaseManager.tsx` UI to a full-screen "Editor Mode."

### Key Changes:
*   **Three-Column Layout**:
    *   **Left (Nav)**: Primary navigation (Sections, Theme Settings, Pages).
    *   **Center (Canvas)**: A high-fidelity "iPhone 16 Pro" frame rendering the live showcase.
    *   **Right (Properties)**: Detailed settings for the currently selected block or global theme.
*   **Glassmorphic Design**: Use the current dark/premium aesthetic for the editor itself to make it feel like professional software.

---

## 3. Phase 2: Modular Section Architecture

Instead of hardcoded fields like `hero_title`, we transition to a `content_blocks` JSON structure.

### Proposed Block Schema:
```json
[
  { 
    "id": "uuid-1", 
    "type": "hero", 
    "settings": { 
      "title": "Hoş Geldiniz", 
      "subtitle": "En lezzetli ürünler burada.",
      "image": "https://..." 
    } 
  },
  { 
    "id": "uuid-2", 
    "type": "marquee", 
    "settings": { 
      "text": "Açılışa Özel %20 İndirim!", 
      "speed": 20,
      "bgColor": "#ff0000"
    } 
  }
]
```

---

## 4. Phase 3: Live Sync Engine (Real-Time Feedback)

To prevent the preview from flickering or reloading on every keystroke, we implement a syncing bridge.

### Mechanisms:
*   **Shared State**: Use a `BuilderContext` to share settings between the editor sidebar and the preview.
*   **Optimistic UI**: Reflect changes locally before saving to Supabase.
*   **PostMessage API**: Use an `iframe` for the preview. This ensures that the showcase CSS doesn't leak into the admin panel (and vice-versa).

---

## 5. Phase 4: Reordering & Interaction

Adding dragging and sophisticated interactions.

### Features:
*   **Drag & Drop**: Use `@dnd-kit/core` to reorder sections in the sidebar.
*   **Inline Clicking**: Clicking an element in the preview scrolls the sidebar to its settings.
*   **Device Toggle**: Switch between Desktop, Tablet, and Mobile preview modes.

---

## 6. Phase 5: Deployment & Rendering

Ensuring the end-user sees exactly what was built.

### Logic:
*   `PublicShowcaseClient.tsx` will be updated to dynamic component loading.
*   **Lighthouse Optimization**: Only load block components that are actually present in the merchant's layout.

---

## Open Questions

1.  **Hangi Blok Daha Kritik?**: Hero ve Ürün Listesi dışında satıcıların en çok istediği blok hangisi? (Örn: Video, Müşteri Yorumları, Instagram Akışı?)
2.  **Iframe mi Yerel React mi?**: Önizleme için izole bir `iframe` mi kullanalım (daha güvenli), yoksa doğrudan React bileşeni mi (daha hızlı geliştirilir)?
3.  **Çoklu Sayfa Desteği?**: Sadece tek bir "Lading Page" mi tasarlanacak, yoksa Hakkımızda, İletişim gibi ek sayfalar da bu editörle mi yapılacak?
