# Interactive Onboarding Tour (POS & Inventory Spotlight Walkthrough)

An end-to-end interactive onboarding tour that guides new and returning cashiers and store managers through the POS selling interface and Inventory Management system using the existing high-visibility spotlight architecture, with automated seamless view transitions and instant replay.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following specifications were confirmed through the clarification interview and govern the tour design:

- **Unified Continuous Tour**: The tour will automatically navigate from the POS view to the Inventory view and back without forcing the user to manually switch tabs.
- **Inventory Spotlight Highlights**: Focus on stock tracking, proactive low stock alerts center, and quick inventory adjustments (+/-).
- **Auto-Trigger & Manual Replay**: Automatically triggers once on first launch for new users (persisted in `localStorage`), with a dedicated replay button in the header toolbar (`HelpCircle` icon / "الجولة التعريفية").

---

## 1. Overview & Core Concept

- **What It Does**: Renders a high-contrast spotlight overlay that clips an illuminated viewport around key interactive elements, accompanied by an Apple-glass style directional popover card with step counters, badges, contextual descriptions, tactile sound effects, and forward/backward/skip controls.
- **Target Audience**: Store cashiers, supermarket operators, depot supervisors, and restaurant staff onboarding onto the Kian Cashier system.
- **Key Value**: Drastically reduces initial cognitive load, prevents checkout errors, and familiarizes users with both front-of-house sales (POS) and back-of-house stock replenishment (Inventory).

---

## 2. User Experience & Visual Design

### Step Sequence & Navigation Flow

1. **POS Section (Front-of-House)**:
   - **Step 1 — Operating Mode (`data-tour="operating-mode"`)**: Switching between Retail, Wholesale, and Restaurant modes.
   - **Step 2 — Smart Search & Barcode (`data-tour="pos-search"`)**: Barcode laser/camera scanning, search field, and quick category pills.
   - **Step 3 — Product Catalog (`data-tour="pos-products"`)**: One-tap product cards with instant stock counters.
   - **Step 4 — Sales Cart (`data-tour="pos-cart"`)**: Quantity steppers, discount adjustments, and holding tickets.
   - **Step 5 — Checkout & Fast Pay (`data-tour="pos-actions"`)**: Cash balance calculator, card payment, debt recording, and thermal printing.
   - **Step 6 — Layout Customizer (`data-tour="customize-layout"`)**: Right/left hand cart repositioning and floating toolbar reordering.

2. **Automated Transition to Inventory**:
   - The spotlight system dispatches `setActiveTab('inventory')` with a 200ms view transition lock to let the inventory DOM layout stabilize.

3. **Inventory Section (Back-of-House)**:
   - **Step 7 — Valuation & Stock Metrics (`data-tour="inventory-valuation"`)**: Total inventory valuation at cost & retail, healthy stock vs. low stock indicators.
   - **Step 8 — Proactive Low Stock Alerts Center (`data-tour="inventory-low-stock-tab"`)**: Real-time notifications for items below minimum thresholds with supplier reorder triggers.
   - **Step 9 — Stock Levels & Quick Adjustments (`data-tour="inventory-stock-table"`)**: Live product stock table, searching, and quick +/- stock adjustments modal.
   - **Step 10 — Header Tools & Manual Replay (`data-tour="header-tools"`)**: Global tools hub, exchange bulletin, cloud backup, and the manual walkthrough replay button.

### Visual Styling & Glassmorphic Card
- **Spotlight Mask**: SVG radial-gradient overlay with dynamic box-shadow (`box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.78)`), gold perimeter glow (`ring-4 ring-amber-500/80`), and smooth coordinate transitions.
- **Tooltip Card**: Apple glass card with backdrop blur, rounded-3xl corners, amber badge, progress step dots (`● ○ ○`), and tactile button feedback (`active:scale-95`).

---

## 3. Key Technical Decisions & Trade-Offs

- **Automated View Switching (`targetView`)**:
  - *Chosen Approach*: Add `targetView: 'pos' | 'inventory'` and optional `onEnterStep?: () => void` to each `TutorialStep`. If `activeTab !== step.targetView`, the tour automatically calls `setActiveTab(step.targetView)`, waits for the DOM node to mount, and computes the `DOMRect`.
  - *Why*: Seamless single-flow onboarding without requiring user manual intervention.
- **DOM Selector Anchoring**:
  - *Chosen Approach*: Use explicit `data-tour="..."` attributes on key containers in `POSView.tsx` and `InventoryView.tsx`.
  - *Why*: Immune to Tailwind class refactoring or dynamic element ID changes.

---

## 4. Technical Architecture & System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       AppContext                            │
│  - isTutorialOpen / setIsTutorialOpen                       │
│  - startInteractiveTutorial()                               │
│  - activeTab / setActiveTab('pos' | 'inventory')            │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│         Header.tsx           │ │InteractiveSpotlightTutorial│
│ - btn-header-tutorial        │ │ - Target DOMRect tracker   │
│ - Triggers start tutorial    │ │ - View switcher hook       │
│ - data-tour="header-tools"   │ │ - SVG cut-out spotlight    │
└──────────────────────────────┘ └─────────────┬──────────────┘
                                               │
               ┌───────────────────────────────┴──────────────────────────────┐
               ▼                                                              ▼
┌──────────────────────────────┐                               ┌──────────────────────────────┐
│          POSView             │                               │        InventoryView         │
│ - [data-tour="pos-search"]   │                               │ - [data-tour="inventory-     │
│ - [data-tour="pos-products"] │                               │     valuation"]              │
│ - [data-tour="pos-cart"]     │                               │ - [data-tour="inventory-     │
│ - [data-tour="pos-actions"]  │                               │     low-stock-tab"]          │
│ - [data-tour="customize-     │                               │ - [data-tour="inventory-     │
│     layout"]                 │                               │     stock-table"]            │
└──────────────────────────────┘                               └──────────────────────────────┘
```

---

## 5. Verification Plan

1. **Compilation Check**: Run `lint_applet` (`tsc --noEmit`) and `compile_applet`.
2. **First-Time Trigger**: Clear `localStorage.getItem('kian_pos_tutorial_completed_v1')` to verify automated launch on clean profile.
3. **Transition Flow**: Step through 1 to 6 on POS, verify automatic tab switch to Inventory for steps 7 to 9, and verify return to header for step 10.
4. **Manual Replay**: Click the "الجولة التعريفية" button in the header toolbar and verify restarting from Step 1.
