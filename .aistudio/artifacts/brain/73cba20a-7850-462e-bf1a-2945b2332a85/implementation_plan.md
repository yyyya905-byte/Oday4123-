# POS Product Details & Interactive Variant Selector

Enhance the POS product grid with a dedicated "View Details" action on every product card, opening an Apple Glass product details modal where cashiers can interactively pick attributes (Color, Size), view live updated pricing, and add configured items to the cart.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following key decisions have been confirmed through user feedback and will govern the implementation:

- **Confirmed Decision 1 (Card Placement)**: A visible, dedicated "عرض التفاصيل" (View Details) button will be placed at the bottom of product cards in the POS grid across all operating modes (Restaurant, Retail, and Wholesale).
- **Confirmed Decision 2 (Attribute Selection UX)**: The popup will feature tactile, interactive attribute chips for each dimension (e.g. Size, Color) with instant real-time price updates, active attribute highlights, and automatic matching to specific variant SKUs and stock levels.
- **Confirmed Decision 3 (Direct Card Click Flow)**: Clicking the card body directly preserves the high-speed cashier workflow: items with variants automatically open the details popup, while single items without variants are added straight to the cart (+1).

---

### 1. Overview & Core Concept

- **What It Does**: Cashiers can now tap a dedicated "عرض التفاصيل" button on any product card in the POS screen to inspect full item details (image, barcode, SKU, category, stock, description). For items with multiple options (e.g. Size and Color), cashiers can tap interactive chips to configure the item, see the updated price and stock in real time, adjust quantity, and add the configured item to the cart.
- **Target Audience**: Retail cashiers, cafe and restaurant servers, and wholesale order desks who handle products with multiple attributes (t-shirts in sizes/colors, coffees in sizes/milks, packaged goods in varying weights).
- **Key Value**: Eliminates cashier guesswork, prevents incorrect SKU additions, provides instant visual clarity on prices and available stock for every combination, and retains high-speed checkout ergonomics.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. *Browse POS Grid*: Cashier sees product cards with a clear "عرض التفاصيل" button at the bottom alongside quick +/- buttons. Items with options display a subtle options indicator.
  2. *Open Details Modal*: Cashier clicks "عرض التفاصيل" (or clicks the card of an item with variants). The modal opens smoothly with an Apple Glass dark/light surface.
  3. *Attribute Configuration*: Cashier taps attribute chips (e.g. Size: "كبير", Color: "كحلي"). The active variant matches instantly, updating the live unit price, SKU, barcode, and stock availability badge.
  4. *Quantity & Add to Cart*: Cashier adjusts quantity with a touch stepper and taps the prominent "إضافة للسلة" button, which clearly displays the final total price.
  5. *Audio & Haptic Response*: Crisp glass tap sound and tactile vibration confirm the item addition.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Refined Apple Glass POS with dark slate / soft daylight theme, zero-pill discipline, clean hairline dividers, and emerald/amber accents matching Kian POS.
  - *Color Palette*:
    - Canvas: Deep obsidian slate (`dark:bg-slate-900`) / Crisp pure white (`bg-white`).
    - Attribute Chips: Unselected (`bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300`), Selected (`bg-emerald-600 text-white font-black shadow-sm shadow-emerald-600/30 ring-2 ring-emerald-400`).
    - Live Price Display: Emerald high-contrast bold typography (`text-emerald-600 dark:text-emerald-400 font-mono text-2xl`).
  - *Typography*: High-contrast Arabic typography with tabular numbers (`font-mono tabular-nums`) for prices, barcodes, and stock levels.
  - *Component Styling*: Single-elevation modal dialog, touch targets $\ge 44\text{px}$, subtle micro-interactions with $\le 150\text{ms}$ transitions.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Interactive Matrix Chips vs. Flat Combination List**:
  - *Chosen Approach*: Multi-dimensional attribute chips (Size row + Color row) that resolve to the specific variant, with a fallback list view if needed.
  - *Why*: Intuitive mental model for cashiers and customers (matching how people select apparel or drinks: pick size first, then color/flavor) rather than reading through 20 combined text strings.
- **Decision 2: Universal Modal for Single & Multi-Variant Items**:
  - *Chosen Approach*: The details modal handles both products with variants and single-item products. For single items, it displays full specs, high-res photo, stock, and quick add.
  - *Why*: Allows cashiers to inspect details and price breakdowns for any product on demand, maintaining consistent interaction.
- **Decision 3: Direct Card Click vs. Details Button Separation**:
  - *Chosen Approach*: Direct card click adds single items immediately to keep checkout velocity high; clicking "عرض التفاصيل" opens the modal for any product. For products with variants, both trigger the modal to prevent ambiguous additions.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                      POS Screen View                        │
│                                                             │
│  ┌─────────────────────────┐   ┌─────────────────────────┐  │
│  │ Single Product Card     │   │ Multi-Variant Card      │  │
│  │ ├─ Tap Card: Add (+1)   │   │ ├─ Tap Card: Open Modal │  │
│  │ └─ Tap "عرض التفاصيل"   │   │ └─ Tap "عرض التفاصيل"   │  │
│  └───────────┬─────────────┘   └────────────┬────────────┘  │
│              │                              │               │
└──────────────┼──────────────────────────────┼───────────────┘
               │                              │
               ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│          Product Details & Variant Selector Modal           │
│                                                             │
│  ┌───────────────────────┐   ┌───────────────────────────┐  │
│  │ Product Overview      │   │ Interactive Attribute     │  │
│  │ (Image, Name, SKU,    │   │ Chips (Size, Color, etc.) │  │
│  │ Category, Stock)      │   │ └─ Selected Matrix State  │  │
│  └───────────────────────┘   └─────────────┬─────────────┘  │
│                                            │                │
│                                            ▼                │
│                              ┌───────────────────────────┐  │
│                              │ Matched Variant Resolver  │  │
│                              │ ├─ Live Price & Total     │  │
│                              │ ├─ Matched SKU & Barcode  │  │
│                              │ └─ Exact Variant Stock    │  │
│                              └─────────────┬─────────────┘  │
│                                            │                │
│                                            ▼                │
│                              ┌───────────────────────────┐  │
│                              │ Quantity Stepper & Add    │  │
│                              │ to Cart Action Button     │  │
│                              └─────────────┬─────────────┘  │
└────────────────────────────────────────────┼────────────────┘
                                             │
                                             ▼
                               ┌───────────────────────────┐
                               │     Cart & Store State    │
                               │ (composite line item ID)  │
                               └───────────────────────────┘
```

- **State Management**:
  - `selectedAttributes: Record<string, string>` tracks selected options for each dimension (e.g. `{ 'الحجم': 'كبير', 'اللون': 'أسود' }`).
  - Active variant resolution: derived in real time by finding the `ProductVariant` whose attributes match all selected keys.
  - Quantity state: local counter with instant total recalculation (`unitPrice * quantity`).
  - Action dispatch: calls `addToCart(product, quantity, isWholesale, resolvedVariant)` to produce composite line items.
- **Verification Strategy**:
  - Run `lint_applet` to verify TypeScript strict types.
  - Run `compile_applet` to confirm Vite production bundle builds cleanly.
  - Validate interactive clicks, price recalculation, and stock limits.
