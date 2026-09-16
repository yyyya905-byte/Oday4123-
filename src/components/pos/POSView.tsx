import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, Category, DiningType } from '../../types';
import { soundEffects } from '../../services/audio';
import { haptics } from '../../services/haptics';
import {
  Search,
  ScanBarcode,
  QrCode,
  Star,
  Plus,
  Minus,
  Trash2,
  Tag,
  UserCheck,
  UserX,
  CreditCard,
  Banknote,
  Percent,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  AlertTriangle,
  Building2,
  Store,
  Layers,
  UtensilsCrossed,
  Printer,
  Users,
  MessageSquarePlus,
  SlidersHorizontal,
  Coffee,
  Check,
  ChevronDown,
  Package,
  Boxes,
  Zap,
  DollarSign,
  Calculator,
  Coins,
  CheckCircle2,
  X,
  RotateCcw,
  Folder,
  Edit3,
  Bluetooth
} from 'lucide-react';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { CustomerQRScannerModal } from './CustomerQRScannerModal';
import { PaymentModal } from './PaymentModal';
import { KitchenTicketModal } from './KitchenTicketModal';
import { POSTouchKeypadModal, KeypadMode } from './POSTouchKeypadModal';
import { BluetoothPrinterModal } from './BluetoothPrinterModal';
import { bluetoothPrinter, BluetoothPrinterStatus } from '../../services/bluetoothPrinter';
import { RestaurantPOSHeader } from './RestaurantPOSHeader';
import { WholesalePOSHeader } from './WholesalePOSHeader';
import { RetailPOSHeader } from './RetailPOSHeader';

export const POSView: React.FC = () => {
  const {
    products,
    categories,
    cart,
    addToCart,
    updateCartItemQuantity,
    updateCartItemDiscount,
    updateCartItemPrice,
    updateProduct,
    removeFromCart,
    clearCart,
    selectedCustomer,
    setSelectedCustomer,
    orderDiscount,
    setOrderDiscount,
    pointsToRedeem,
    setPointsToRedeem,
    formatCurrency,
    settings,
    t,
    language,
    setActiveTab,
    posTradeMode,
    setPosTradeMode,
    businessMode,
    setIsModeModalOpen,
    restaurantDiningType,
    setRestaurantDiningType,
    selectedTable,
    setSelectedTable,
    guestCount,
    setGuestCount,
    updateCartItemKitchenNotes,
    toggleCartItemTradeMode,
    processSale,
    notify,
    sales,
    navigateToReturnWithInvoice,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('cat_all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [lastScannedBanner, setLastScannedBanner] = useState<{
    product: Product;
    code: string;
    count: number;
  } | null>(null);

  // Modals & Popups
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [isCustomerQRModalOpen, setIsCustomerQRModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isKitchenTicketModalOpen, setIsKitchenTicketModalOpen] = useState(false);
  const [isBluetoothModalOpen, setIsBluetoothModalOpen] = useState(false);
  const [btPrinterStatus, setBtPrinterStatus] = useState<BluetoothPrinterStatus>(bluetoothPrinter.getStatus());

  useEffect(() => {
    const unsub = bluetoothPrinter.subscribe(status => {
      setBtPrinterStatus(status);
    });
    return unsub;
  }, []);
  // Touch Keypad Modal State (Supports Quantity, Price, and Discount)
  const [touchKeypadConfig, setTouchKeypadConfig] = useState<{
    isOpen: boolean;
    mode: KeypadMode;
    product?: Product | null;
    currentQuantity?: number;
    unit?: string;
    maxStock?: number;
    unitPrice?: number;
    currentPrice?: number;
    costPrice?: number;
    isCartItem?: boolean;
    cartQuantity?: number;
    currentDiscountValue?: number;
    currentDiscountType?: 'percentage' | 'fixed';
    subtotal?: number;
  }>({
    isOpen: false,
    mode: 'quantity',
  });

  const handleOpenQuantityKeypad = (item: typeof cart[0]) => {
    setTouchKeypadConfig({
      isOpen: true,
      mode: 'quantity',
      product: item.product,
      currentQuantity: item.quantity,
      unit: item.wholesaleUnit || item.product.unit || 'قطعة',
      maxStock: item.product.stock,
      unitPrice: item.unitPrice,
    });
  };

  const handleOpenProductPriceEdit = (product: Product) => {
    setTouchKeypadConfig({
      isOpen: true,
      mode: 'price',
      product,
      currentPrice: product.price,
      costPrice: product.costPrice,
      isCartItem: false,
    });
  };

  const handleOpenCartItemPriceEdit = (item: typeof cart[0]) => {
    setTouchKeypadConfig({
      isOpen: true,
      mode: 'price',
      product: item.product,
      currentPrice: item.unitPrice,
      costPrice: item.product.costPrice,
      isCartItem: true,
      cartQuantity: item.quantity,
    });
  };

  const handleOpenDiscountKeypad = () => {
    setTouchKeypadConfig({
      isOpen: true,
      mode: 'discount',
      currentDiscountValue: orderDiscount.value,
      currentDiscountType: orderDiscount.type,
      subtotal,
    });
  };

  const handleConfirmQuantityKeypad = (newQuantity: number) => {
    if (!touchKeypadConfig.product) return;
    if (newQuantity <= 0) {
      removeFromCart(touchKeypadConfig.product.id);
      notify('تم تحديث السلة', `تم حذف ${touchKeypadConfig.product.nameAr} من السلة`, 'info');
    } else {
      updateCartItemQuantity(touchKeypadConfig.product.id, newQuantity);
      notify('تم تعديل الكمية', `الكمية الجديدة لـ ${touchKeypadConfig.product.nameAr}: ${newQuantity} ${touchKeypadConfig.unit || ''}`, 'success');
    }
  };

  const handleConfirmPriceKeypad = (newPrice: number, alsoUpdateCatalog: boolean, alsoAddToCart?: boolean) => {
    if (!touchKeypadConfig.product) return;
    const { product, isCartItem } = touchKeypadConfig;

    if (isCartItem) {
      updateCartItemPrice(product.id, newPrice);
      if (alsoUpdateCatalog) {
        updateProduct(product.id, { price: newPrice });
        notify('تم تحديث السعر', `تم تعديل سعر ${product.nameAr} في السلة والمخزون إلى ${formatCurrency(newPrice)}`, 'success');
      } else {
        notify('تم تعديل السعر في السلة', `سعر الصنف الجديد: ${formatCurrency(newPrice)}`, 'success');
      }
    } else {
      if (alsoUpdateCatalog) {
        updateProduct(product.id, { price: newPrice });
        const inCart = cart.find(it => it.productId === product.id);
        if (inCart) {
          updateCartItemPrice(product.id, newPrice);
        }
        notify('تم تحديث سعر المنتج', `تم تعديل سعر ${product.nameAr} بالمخزون إلى ${formatCurrency(newPrice)}`, 'success');
      }

      if (alsoAddToCart) {
        const updatedProduct = { ...product, price: newPrice };
        addToCart(updatedProduct);
        setTimeout(() => {
          updateCartItemPrice(product.id, newPrice);
        }, 50);
      }
    }
  };

  const handleConfirmDiscountKeypad = (val: number, type: 'percentage' | 'fixed') => {
    setOrderDiscount({ value: val, type });
    notify('تم تطبيق الخصم', `تم تحديد خصم الفاتورة: ${val}${type === 'percentage' ? '%' : ' ' + settings.currency.symbol}`, 'success');
  };

  // Interactive Cashier Change Calculator State
  const [posCashPaidInput, setPosCashPaidInput] = useState<string>('');
  const [isCashCalcOpen, setIsCashCalcOpen] = useState<boolean>(true);

  // Auto-focus search input immediately upon opening Cashier page
  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Global hardware barcode scanner reader (USB / Bluetooth / Wireless gun)
  useEffect(() => {
    let scanBuffer = '';
    let lastKeyTime = 0;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when modal windows are open or in textarea
      const target = e.target as HTMLElement | null;
      const isEditingTextarea = target && target.tagName === 'TEXTAREA';
      const isModalOpen = isBarcodeModalOpen || isCustomerQRModalOpen || isPaymentModalOpen || isKitchenTicketModalOpen;
      if (isModalOpen || isEditingTextarea) return;

      const currentTime = Date.now();
      const isFast = (currentTime - lastKeyTime) < 80;
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        const candidate = (scanBuffer.trim() || searchQuery.trim());
        if (candidate.length >= 2) {
          const clean = candidate.toLowerCase();

          // 1. Check if scanned barcode is an invoice barcode or QR payload
          let targetInv = clean;
          if (clean.startsWith('{') && clean.endsWith('}')) {
            try {
              const parsed = JSON.parse(candidate);
              if (parsed.inv || parsed.invoiceNumber) {
                targetInv = String(parsed.inv || parsed.invoiceNumber).toLowerCase();
              }
            } catch {}
          }

          const matchedSale = sales.find(s =>
            s.invoiceNumber.toLowerCase() === targetInv ||
            s.id.toLowerCase() === targetInv ||
            s.invoiceNumber.toLowerCase() === clean
          );

          if (matchedSale) {
            e.preventDefault();
            soundEffects.playSuccess();
            scanBuffer = '';
            setSearchQuery('');
            navigateToReturnWithInvoice(matchedSale);
            notify('تم رصد باركود فاتورة!', `تم استرجاع الفاتورة #${matchedSale.invoiceNumber} لاختيار الأصناف المرتجعة`, 'success');
            return;
          }

          // 2. Check product barcode / SKU
          const found = products.find(p =>
            p.barcode.toLowerCase() === clean ||
            p.sku.toLowerCase() === clean ||
            p.identificationCodes?.some(c => c.toLowerCase() === clean)
          );

          if (found) {
            e.preventDefault();
            addToCart(found);
            soundEffects.playBeep();
            setLastScannedBanner(prev => ({
              product: found,
              code: candidate,
              count: prev?.product.id === found.id ? prev.count + 1 : 1
            }));
            setSearchQuery('');
            scanBuffer = '';
            // keep focus on search
            searchInputRef.current?.focus();
            return;
          }
        }
        scanBuffer = '';
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (isFast || scanBuffer.length > 0) {
          scanBuffer += e.key;
        } else {
          scanBuffer = e.key;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [products, searchQuery, isBarcodeModalOpen, isCustomerQRModalOpen, isPaymentModalOpen, isKitchenTicketModalOpen]);

  // Auto-dismiss scanned alert banner
  useEffect(() => {
    if (lastScannedBanner) {
      const timer = setTimeout(() => {
        setLastScannedBanner(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [lastScannedBanner]);

  // Item Note Inline Editing
  const [editingNoteItemKey, setEditingNoteItemKey] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState<string>('');

  // Table options for restaurant mode
  const tablesList = [
    'طاولة 1', 'طاولة 2', 'طاولة 3', 'طاولة 4', 'طاولة 5', 
    'طاولة 6', 'طاولة 7', 'طاولة 8', 'VIP 1', 'VIP 2', 'شرفة خارجية'
  ];

  // Quick preset kitchen notes
  const quickChefNotes = language === 'ar'
    ? ['بدون بصل', 'شطة زيادة', 'سكر خفيف', 'مستوي جيداً', 'صوص خارجي', 'بدون ثوم', 'سفري معلب']
    : ['No Onions', 'Extra Spicy', 'Less Sugar', 'Well Done', 'Sauce on Side', 'No Garlic', 'Packed To-Go'];

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (p.status === 'inactive') return false;
      if (showFavoritesOnly && !p.isFavorite) return false;
      if (selectedCategory !== 'cat_all' && p.categoryId !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.nameAr.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q);
        const matchBarcode = p.barcode.includes(q);
        const matchSku = p.sku.toLowerCase().includes(q);
        const matchIdentification = p.identificationCodes?.some(c => c.toLowerCase().includes(q));
        return matchName || matchBarcode || matchSku || matchIdentification;
      }
      return true;
    });
  }, [products, selectedCategory, showFavoritesOnly, searchQuery]);

  // Handle direct Enter on search input (e.g. from physical barcode scanner)
  const handleSearchInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = searchQuery.trim().toLowerCase();
      if (!q) return;

      // 1. Check if user scanned or typed an invoice number
      let targetInv = q;
      if (q.startsWith('{') && q.endsWith('}')) {
        try {
          const parsed = JSON.parse(searchQuery.trim());
          if (parsed.inv || parsed.invoiceNumber) {
            targetInv = String(parsed.inv || parsed.invoiceNumber).toLowerCase();
          }
        } catch {}
      }
      const matchedSale = sales.find(s =>
        s.invoiceNumber.toLowerCase() === targetInv ||
        s.id.toLowerCase() === targetInv ||
        s.invoiceNumber.toLowerCase() === q
      );
      if (matchedSale) {
        soundEffects.playSuccess();
        setSearchQuery('');
        navigateToReturnWithInvoice(matchedSale);
        notify('تم رصد باركود فاتورة!', `تم استرجاع الفاتورة #${matchedSale.invoiceNumber} لاختيار الأصناف المرتجعة`, 'success');
        return;
      }

      // 2. Check exact product match
      const exactMatch = products.find(
        p =>
          p.barcode.toLowerCase() === q ||
          p.sku.toLowerCase() === q ||
          p.identificationCodes?.some(c => c.toLowerCase() === q)
      );
      if (exactMatch) {
        addToCart(exactMatch);
        soundEffects.playBeep();
        setLastScannedBanner(prev => ({
          product: exactMatch,
          code: searchQuery.trim(),
          count: prev?.product.id === exactMatch.id ? prev.count + 1 : 1
        }));
        setSearchQuery('');
        return;
      }
      if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
        soundEffects.playBeep();
        setLastScannedBanner(prev => ({
          product: filteredProducts[0],
          code: searchQuery.trim(),
          count: prev?.product.id === filteredProducts[0].id ? prev.count + 1 : 1
        }));
        setSearchQuery('');
      }
    }
  };

  // Cart Calculations
  const subtotal = cart.reduce((sum, it) => sum + (it.unitPrice * it.quantity), 0);
  const itemDiscountsTotal = cart.reduce((sum, it) => sum + ((it.unitPrice * it.quantity) - it.total), 0);

  // Estimated Wholesale savings
  const wholesaleSavings = cart.reduce((sum, it) => {
    if (it.isWholesale || posTradeMode === 'wholesale') {
      const retailPrice = it.product.price;
      const savingPerUnit = Math.max(0, retailPrice - it.unitPrice);
      return sum + (savingPerUnit * it.quantity);
    }
    return sum;
  }, 0);

  let orderDiscountAmount = 0;
  if (orderDiscount.value > 0) {
    orderDiscountAmount = orderDiscount.type === 'percentage'
      ? ((subtotal - itemDiscountsTotal) * orderDiscount.value) / 100
      : orderDiscount.value;
  }

  // Loyalty points discount calculation (e.g. 1 point = 100 SYP)
  const pointsDiscountAmount = selectedCustomer && pointsToRedeem > 0
    ? pointsToRedeem * (settings.pointsRedeemRatio || 100)
    : 0;

  const totalDiscount = itemDiscountsTotal + orderDiscountAmount + pointsDiscountAmount;
  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  const taxAmount = settings.enableTax ? (taxableAmount * (settings.defaultTaxRate || 0)) / 100 : 0;
  const grandTotal = Math.round(taxableAmount + taxAmount);

  // Total items in cart
  const cartItemsCount = cart.reduce((sum, it) => sum + it.quantity, 0);

  const startEditingNote = (productId: string, currentNote?: string) => {
    setEditingNoteItemKey(productId);
    setTempNoteText(currentNote || '');
  };

  const saveItemNote = (productId: string) => {
    updateCartItemKitchenNotes(productId, tempNoteText.trim());
    setEditingNoteItemKey(null);
  };

  // Haptic-wrapped helpers for ergonomic tactile feedback
  const handleAddToCartWithHaptics = (product: Product, quantity = 1, isWholesale = false) => {
    if (product.stock <= 0) {
      haptics.warning();
      soundEffects.playWarning();
    } else {
      haptics.tap();
      soundEffects.playClick();
    }
    addToCart(product, quantity, isWholesale);
  };

  const handleUpdateQuantityWithHaptics = (productId: string, newQty: number) => {
    haptics.tap();
    updateCartItemQuantity(productId, newQty);
  };

  const handleRemoveFromCartWithHaptics = (productId: string) => {
    haptics.delete();
    removeFromCart(productId);
  };

  const handleClearCartWithHaptics = () => {
    haptics.warning();
    clearCart();
  };

  // Quick add full carton/pack helper for wholesale
  const handleAddCarton = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.buttonPress();
    soundEffects.playClick();
    const multiplier = product.wholesaleUnitMultiplier || 6;
    addToCart(product, multiplier, true);
  };

  // Quick add multiple packs
  const handleAddMultiplePacks = (product: Product, packsCount: number, e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.buttonPress();
    soundEffects.playClick();
    const multiplier = product.wholesaleUnitMultiplier || 6;
    addToCart(product, packsCount * multiplier, true);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-slate-100/70 dark:bg-slate-950 max-w-full w-full">
      {/* LEFT / CENTER: Products Catalog & Categories */}
      <div className="flex-1 flex flex-col h-full overflow-hidden p-2.5 sm:p-3 md:p-4 space-y-2.5 sm:space-y-3 min-w-0 max-w-full">
        
        {/* MODE-SPECIALIZED HEADER BANNER */}
        {businessMode === 'restaurant' && (
          <RestaurantPOSHeader 
            onOpenKitchenTicket={() => {
              haptics.buttonPress();
              setIsKitchenTicketModalOpen(true);
            }}
            onOpenGuestKeypad={() => {
              haptics.buttonPress();
              setTouchKeypadConfig({
                isOpen: true,
                mode: 'quantity',
                currentQuantity: guestCount,
                unit: 'ضيوف'
              });
            }}
          />
        )}
        {businessMode === 'wholesale' && (
          <WholesalePOSHeader />
        )}
        {businessMode === 'retail' && (
          <RetailPOSHeader
            onScanBarcode={() => {
              haptics.buttonPress();
              setIsBarcodeModalOpen(true);
            }}
            onScanCustomerQR={() => {
              haptics.buttonPress();
              setIsCustomerQRModalOpen(true);
            }}
          />
        )}

        {/* Live Barcode Scanned Floating Alert */}
        {lastScannedBanner && (
          <div className="flex items-center justify-between p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl animate-in slide-in-from-top-2 duration-200 max-w-full overflow-hidden">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-3 w-3 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div className="min-w-0">
                <p className="text-xs font-black text-emerald-800 dark:text-emerald-200">
                  ⚡ تم مسح الباركود بنجاح وإضافته للسلة
                </p>
                <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 truncate">
                  {language === 'ar' ? lastScannedBanner.product.nameAr : lastScannedBanner.product.nameEn} ({formatCurrency(lastScannedBanner.product.price)}) - الكود: {lastScannedBanner.code}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-black bg-emerald-600 text-white px-2.5 py-1 rounded-xl shadow-xs font-mono">
                +{lastScannedBanner.count} بالسلة
              </span>
              <button
                onClick={() => {
                  haptics.tap();
                  setLastScannedBanner(null);
                }}
                className="w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 rounded-lg hover:bg-emerald-200/50 cursor-pointer transition-colors"
                aria-label="إغلاق التنبيه"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ORGANIZED POS WORKSTATION COMMAND BAR: Search + Unified Action Cluster */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 max-w-full">
          {/* 1. Spacious High-Contrast Search Input with Auto-Focus & Barcode Readiness */}
          <div className="relative flex-1 min-w-0">
            <input
              ref={searchInputRef}
              id="pos-search-input"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchInputKeyDown}
              placeholder={businessMode === 'restaurant' 
                ? (language === 'ar' ? 'بحث عن وجبة أو مسح باركود...' : 'Search meal or scan barcode...')
                : businessMode === 'wholesale'
                ? (language === 'ar' ? 'بحث عن بضاعة، كود أو باركود...' : 'Search item, SKU or barcode...')
                : (language === 'ar' ? 'امسح الباركود أو ابحث عن منتج...' : 'Scan barcode or search...')
              }
              className="w-full ps-10 pe-20 py-2.5 bg-white dark:bg-slate-900 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all min-h-[46px]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-3.5 pointer-events-none" />
            
            {/* Search actions: count badge, shortcut, or clear */}
            <div className="absolute end-2 top-2 flex items-center gap-1.5">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    haptics.tap();
                    setSearchQuery('');
                  }}
                  className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  aria-label="مسح البحث"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <span className="hidden sm:inline-flex items-center text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700/60 select-none">
                  /
                </span>
              )}
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 font-mono hidden sm:inline-block">
                {filteredProducts.length}
              </span>
            </div>
          </div>

          {/* Wholesale Mode Toggle (Wholesale Only) */}
          {businessMode === 'wholesale' && (
            <div className="flex items-center bg-white dark:bg-slate-900 rounded-2xl p-1 border border-slate-200 dark:border-slate-800 shadow-xs shrink-0">
              <button
                type="button"
                onClick={() => {
                  haptics.selection();
                  setPosTradeMode('wholesale');
                }}
                className={`flex items-center gap-1 px-3 py-1.5 min-h-[38px] rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  posTradeMode === 'wholesale'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'سعر الجملة' : 'Wholesale'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  haptics.selection();
                  setPosTradeMode('retail');
                }}
                className={`flex items-center gap-1 px-3 py-1.5 min-h-[38px] rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  posTradeMode === 'retail'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'سعر المفرق' : 'Retail'}</span>
              </button>
            </div>
          )}

          {/* 2. Unified Cashier Command Cluster (محطة أدوات الكاشير المنظمة) */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs shrink-0 overflow-x-auto no-scrollbar">
            {/* Touch Numpad Quick Keypad Button */}
            <button
              id="btn-pos-touch-keypad"
              type="button"
              onClick={() => {
                haptics.buttonPress();
                if (cart.length > 0) {
                  handleOpenQuantityKeypad(cart[cart.length - 1]);
                } else if (filteredProducts.length > 0) {
                  handleOpenProductPriceEdit(filteredProducts[0]);
                } else {
                  setTouchKeypadConfig({
                    isOpen: true,
                    mode: 'quantity',
                    currentQuantity: 1,
                    unit: 'قطعة'
                  });
                }
              }}
              data-longpress-title={language === 'ar' ? 'لوحة المفاتيح الرقمية اللمسية' : 'Touch Numeric Keypad'}
              data-longpress-desc={language === 'ar' ? 'إدخال سريع للكميات والأسعار والخصومات بأزرار لمسية كبيرة مريحة للعين والأصابع.' : 'Fast numeric entry for quantities and prices with large touch buttons.'}
              className="flex items-center justify-center gap-1 px-3 min-h-[40px] bg-blue-50/90 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-xl border border-blue-200 dark:border-blue-800/60 shadow-2xs active:scale-95 transition-all shrink-0 cursor-pointer"
              title={language === 'ar' ? 'لوحة مفاتيح رقمية لمسية للكميات والأسعار' : 'Touch Numeric Keypad'}
            >
              <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">{language === 'ar' ? 'أرقام' : 'Numpad'}</span>
            </button>

            {/* Barcode Scanner Button (Camera / Modal) */}
            <button
              id="btn-scan-barcode-modal"
              type="button"
              onClick={() => {
                haptics.buttonPress();
                setIsBarcodeModalOpen(true);
              }}
              data-longpress-title={language === 'ar' ? 'قارئ الباركود' : 'Barcode Scanner'}
              data-longpress-desc={language === 'ar' ? 'مسح الباركود باستخدام كاميرا الهاتف أو أجهزة الليزر USB لإضافة الأصناف للسلة فوراً.' : 'Scan barcodes with camera or USB scanner to add items to cart.'}
              className="flex items-center justify-center gap-1 px-3 min-h-[40px] bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs active:scale-95 transition-all shrink-0 cursor-pointer"
              title={language === 'ar' ? 'قارئ الباركود والكاميرا' : 'Barcode & Camera Scanner'}
            >
              <ScanBarcode className="w-4 h-4 text-amber-500" />
              <span className="hidden md:inline">{t('scanBarcode')}</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="القارئ نشط تلقائياً" />
            </button>

            {/* Customer QR Scanner Button */}
            <button
              id="btn-scan-customer-qr-modal"
              type="button"
              onClick={() => {
                haptics.buttonPress();
                setIsCustomerQRModalOpen(true);
              }}
              data-longpress-title={language === 'ar' ? 'مسح كود العميل وبطاقة الولاء' : 'Customer Loyalty Card'}
              data-longpress-desc={language === 'ar' ? 'التعرف على العميل، كسب نقاط المكافآت، واحتساب رصيد المشتريات.' : 'Identify member customer, award loyalty points, and track balance.'}
              className={`flex items-center justify-center gap-1 px-3 min-h-[40px] text-xs font-bold rounded-xl border shadow-2xs active:scale-95 transition-all shrink-0 cursor-pointer ${
                selectedCustomer
                  ? 'bg-amber-500 text-white border-amber-500 shadow-amber-500/20'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
              title={t('scanCustomerQR')}
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden md:inline">
                {selectedCustomer ? selectedCustomer.name.slice(0, 10) : t('customer')}
              </span>
            </button>

            {/* Bluetooth ESC/POS Thermal Printer Button */}
            <button
              id="btn-pos-bluetooth-printer"
              type="button"
              onClick={() => {
                haptics.buttonPress();
                setIsBluetoothModalOpen(true);
              }}
              data-longpress-title="طابعة إيصالات البلوتوث (ESC/POS)"
              data-longpress-desc="ربط وإدارة طابعة الفواتير الحرارية اللاسلكية، فحص الاتصال، وطباعة إيصالات مباشرة."
              className={`flex items-center justify-center gap-1 px-3 min-h-[40px] text-xs font-bold rounded-xl border shadow-2xs active:scale-95 transition-all shrink-0 cursor-pointer ${
                btPrinterStatus.isConnected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
              title="طابعة إيصالات حرارية عبر البلوتوث"
            >
              <Bluetooth className={`w-4 h-4 ${btPrinterStatus.isConnected ? 'text-white' : 'text-blue-500'}`} />
              <span className="hidden xl:inline">
                {btPrinterStatus.isConnected
                  ? (btPrinterStatus.deviceName?.slice(0, 10) || 'طابعة متصلة')
                  : 'طابعة'}
              </span>
              {btPrinterStatus.isConnected && (
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            {/* Mobile Cart Toggle Button */}
            <button
              id="btn-mobile-cart-top"
              type="button"
              onClick={() => {
                haptics.buttonPress();
                setIsMobileCartOpen(true);
              }}
              data-longpress-title={language === 'ar' ? 'سلة الفاتورة الحالية' : 'Current Cart'}
              data-longpress-desc={language === 'ar' ? 'فتح درج السلة لمشاهدة الأصناف وتعديل الكميات وإتمام عملية البيع.' : 'Open mobile cart drawer to review items and complete payment.'}
              className={`lg:hidden flex items-center justify-center gap-1.5 px-3.5 min-h-[40px] text-white font-bold text-xs rounded-xl shadow-md shrink-0 active:scale-95 transition-all cursor-pointer ${
                businessMode === 'restaurant'
                  ? 'bg-emerald-600 shadow-emerald-600/20'
                  : businessMode === 'wholesale'
                  ? 'bg-amber-600 shadow-amber-600/20'
                  : 'bg-blue-600 shadow-blue-600/20'
              }`}
              aria-label="عرض سلة التسوق"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="font-mono">{cartItemsCount}</span>
            </button>
          </div>
        </div>

        {/* Categories Horizontal Scrolling Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-0.5 no-scrollbar shrink-0 max-w-full">
          <button
            onClick={() => {
              setSelectedCategory('cat_all');
              setShowFavoritesOnly(false);
            }}
            data-longpress-title={language === 'ar' ? 'جميع التصنيفات' : 'All Categories'}
            data-longpress-desc={language === 'ar' ? 'عرض جميع المنتجات المتاحة بنظام الكاشير دون أي تصفية تصنيف.' : 'Show all products without category filtering.'}
            className={`flex items-center gap-1.5 px-4 py-2 min-h-[42px] rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 cursor-pointer ${
              selectedCategory === 'cat_all' && !showFavoritesOnly
                ? businessMode === 'restaurant'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : businessMode === 'wholesale'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t('allCategories')}</span>
          </button>

          {/* Favorites Filter */}
          <button
            onClick={() => {
              setShowFavoritesOnly(!showFavoritesOnly);
              setSelectedCategory('cat_all');
            }}
            data-longpress-title={businessMode === 'restaurant' ? (language === 'ar' ? 'الأكثر طلباً بالمطعم' : 'Popular Dishes') : (language === 'ar' ? 'الأصناف المميزة بنجمة' : 'Favorite Products')}
            data-longpress-desc={language === 'ar' ? 'تصفية سريعة لعرض المنتجات الأكثر مبيعاً أو المحددة كمفضلة للوصول الفوري.' : 'Filter to quickly access most popular or starred items.'}
            className={`flex items-center gap-1.5 px-4 py-2 min-h-[42px] rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 cursor-pointer ${
              showFavoritesOnly
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-white' : 'text-amber-500'}`} />
            <span>{businessMode === 'restaurant' ? (language === 'ar' ? 'الأكثر طلباً' : 'Popular Dishes') : t('favorites')}</span>
          </button>

          {categories.filter(c => c.id !== 'cat_all').map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setShowFavoritesOnly(false);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 min-h-[42px] rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 cursor-pointer ${
                selectedCategory === cat.id && !showFavoritesOnly
                  ? businessMode === 'restaurant'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : businessMode === 'wholesale'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <Folder className="w-3.5 h-3.5 opacity-60" />
              <span>{language === 'ar' ? cat.nameAr : cat.nameEn}</span>
            </button>
          ))}
        </div>

        {/* Products Display Area - Mode Tailored */}
        <div className="flex-1 overflow-y-auto pr-1 pb-28 lg:pb-4 max-w-full">
          {filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400">
              <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{t('noProductsFound')}</p>
              <button
                onClick={() => setActiveTab('products')}
                className="mt-3 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 min-h-[36px] px-3 py-1.5 rounded-xl border border-amber-300/60 dark:border-amber-700/60"
              >
                <Plus className="w-4 h-4" />
                <span>{t('addProduct')}</span>
              </button>
            </div>
          ) : businessMode === 'restaurant' ? (
            /* 1. RESTAURANT & CAFE MODE: Visual Food Photo Cards Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5 pb-6">
              {filteredProducts.map(product => {
                const inCart = cart.find(it => it.productId === product.id);
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock <= product.minStock && !isOutOfStock;

                return (
                  <div
                    key={product.id}
                    id={`pos-product-card-${product.id}`}
                    onClick={() => addToCart(product)}
                    className={`group relative bg-white dark:bg-slate-900 rounded-2xl p-2.5 sm:p-3 border transition-all cursor-pointer flex flex-col justify-between select-none shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.98] border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 ${
                      inCart
                        ? 'ring-2 ring-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/20'
                        : ''
                    }`}
                  >
                    {/* Top Image & Badges */}
                    <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-2">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.nameAr}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-2xl bg-emerald-50 dark:bg-emerald-950/30">
                          {product.nameAr.charAt(0)}
                        </div>
                      )}

                      {/* Stock Badge */}
                      <span
                        className={`absolute top-1.5 start-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-md backdrop-blur-xs ${
                          isOutOfStock
                            ? 'bg-rose-500/90 text-white'
                            : isLowStock
                            ? 'bg-amber-500/90 text-white'
                            : 'bg-black/60 text-white'
                        }`}
                      >
                        {isOutOfStock ? t('outOfStock') : `${product.stock} ${product.unit}`}
                      </span>

                      {/* Restaurant Freshness Tag */}
                      <span className="absolute top-1.5 end-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-700/90 text-white shadow-xs flex items-center gap-0.5">
                        <span>👨‍🍳</span>
                        <span>{language === 'ar' ? 'طازج' : 'Fresh'}</span>
                      </span>

                      {/* In Cart Indicator Badge */}
                      {inCart && (
                        <span className="absolute bottom-1.5 end-1.5 w-6 h-6 text-white text-xs font-black rounded-full flex items-center justify-center shadow-md animate-in zoom-in bg-emerald-600 font-mono">
                          {inCart.quantity}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="space-y-1">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                        {language === 'ar' ? product.nameAr : product.nameEn}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {product.sku}
                      </p>
                    </div>

                    {/* Restaurant Card Bottom */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenProductPriceEdit(product);
                          }}
                          className="group/price inline-flex items-center gap-1 px-1.5 py-0.5 -ms-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-transparent hover:border-amber-300 dark:hover:border-amber-700 transition-all cursor-pointer text-start"
                          title="انقر لتعديل سعر المنتج مباشرة"
                        >
                          <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 group-hover/price:text-amber-600 dark:group-hover/price:text-amber-400 block font-mono">
                            {formatCurrency(product.price)}
                          </span>
                          <Edit3 className="w-3 h-3 text-slate-400 group-hover/price:text-amber-500 opacity-0 group-hover/price:opacity-100 transition-opacity shrink-0" />
                        </button>
                        <span className="text-[9px] text-slate-400 block">
                          {product.unit || 'وجبة / طلب'}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="w-10 h-10 sm:w-9 sm:h-9 min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-600 group-hover:text-white text-slate-700 dark:text-slate-300 flex items-center justify-center transition-colors shadow-xs active:scale-90 cursor-pointer"
                        aria-label="إضافة للطلب"
                      >
                        <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : businessMode === 'wholesale' ? (
            /* 2. WHOLESALE & DISTRIBUTION MODE: High-Density Trade Order Sheet (No Images) */
            <div className="space-y-2 pb-6">
              {/* Wholesale Table Header */}
              <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300">
                <div className="col-span-4">{language === 'ar' ? 'الصنف والباركود / SKU' : 'Item & Barcode'}</div>
                <div className="col-span-2 text-center">{language === 'ar' ? 'المخزون والكراتين' : 'Stock & Cartons'}</div>
                <div className="col-span-2 text-center">{language === 'ar' ? 'سعر الجملة للكرتونة' : 'Wholesale / Pack'}</div>
                <div className="col-span-3 text-center">{language === 'ar' ? 'إضافة سريعة للطلبية' : 'Quick Add Bulk'}</div>
                <div className="col-span-1 text-end">{language === 'ar' ? 'بالسلة' : 'In Cart'}</div>
              </div>

              {filteredProducts.map(product => {
                const inCart = cart.find(it => it.productId === product.id);
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock <= product.minStock && !isOutOfStock;
                const multiplier = product.wholesaleUnitMultiplier || 6;
                const wholesalePrice = product.wholesalePrice || Math.round(product.price * 0.8);
                const wholesalePackPrice = wholesalePrice * multiplier;
                const retailPackPrice = product.price * multiplier;
                const packSaving = Math.max(0, retailPackPrice - wholesalePackPrice);
                const cartonsAvailable = Math.floor(product.stock / multiplier);

                return (
                  <div
                    key={product.id}
                    id={`pos-wholesale-row-${product.id}`}
                    className={`bg-white dark:bg-slate-900 rounded-2xl p-3 sm:px-4 sm:py-2.5 border transition-all shadow-2xs hover:shadow-xs hover:border-amber-400 ${
                      inCart
                        ? 'border-amber-400 dark:border-amber-600 bg-amber-50/25 dark:bg-amber-950/20'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:items-center">
                      {/* Item Details (Col 4) */}
                      <div className="sm:col-span-4 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs">
                          <Package className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {language === 'ar' ? product.nameAr : product.nameEn}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                            <span>{product.sku}</span>
                            {product.barcode && <span>• {product.barcode}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Stock & Cartons Available (Col 2) */}
                      <div className="sm:col-span-2 flex items-center justify-between sm:justify-center gap-2">
                        <div className="text-center sm:text-center">
                          <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-md ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {product.stock} {product.unit}
                          </span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            ({cartonsAvailable} {product.wholesaleUnit || 'كرتونة'})
                          </span>
                        </div>
                      </div>

                      {/* Wholesale Price Info (Col 2) */}
                      <div className="sm:col-span-2 text-start sm:text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenProductPriceEdit(product);
                          }}
                          className="group/price w-full flex sm:flex-col items-baseline sm:items-center justify-between sm:justify-center gap-1 p-1 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-transparent hover:border-amber-300 dark:hover:border-amber-700 transition-all cursor-pointer"
                          title="انقر لتعديل سعر المنتج مباشرة"
                        >
                          <div className="flex items-center gap-1">
                            <span className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 font-mono">
                              {formatCurrency(wholesalePackPrice)}
                            </span>
                            <Edit3 className="w-3 h-3 text-slate-400 group-hover/price:text-amber-500 opacity-0 group-hover/price:opacity-100 transition-opacity shrink-0" />
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {formatCurrency(wholesalePrice)} / قطعة
                          </span>
                          {packSaving > 0 && (
                            <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1 rounded">
                              وفر {formatCurrency(packSaving)}
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Quick Bulk Add Actions (Col 3) */}
                      <div className="sm:col-span-3 flex items-center justify-end sm:justify-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product, 1, false);
                          }}
                          className="px-2.5 py-2 min-h-[38px] rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                          title="إضافة قطعة واحدة"
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>+1 {product.unit || 'قطعة'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleAddCarton(product, e)}
                          className="px-3 py-2 min-h-[38px] rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all active:scale-95 shadow-xs flex items-center gap-1 cursor-pointer"
                          title={`إضافة كرتونة (${multiplier} قطع)`}
                        >
                          <Boxes className="w-3.5 h-3.5" />
                          <span>+1 {product.wholesaleUnit || 'كرتونة'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleAddMultiplePacks(product, 5, e)}
                          className="px-3 py-2 min-h-[38px] rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 text-xs font-black transition-all active:scale-95 font-mono cursor-pointer flex items-center gap-0.5"
                          title="إضافة 5 كراتين"
                        >
                          <Plus className="w-3 h-3" />
                          <span>5</span>
                        </button>
                      </div>

                      {/* In Cart Indicator (Col 1) */}
                      <div className="sm:col-span-1 flex items-center justify-end">
                        {inCart ? (
                          <div className="flex items-center gap-1 bg-amber-500 text-white px-2.5 py-1 rounded-xl text-xs font-black font-mono shadow-xs">
                            <span>{inCart.quantity}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300 dark:text-slate-700 hidden sm:inline">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* 3. RETAIL & SUPERMARKET MODE: Ultra-Fast Scanner List (No Images) */
            <div className="space-y-1.5 pb-6">
              {/* Retail Table Header */}
              <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300">
                <div className="col-span-5">{language === 'ar' ? 'الصنف وكود الباركود' : 'Product & Barcode'}</div>
                <div className="col-span-2 text-center">{language === 'ar' ? 'المخزون الحالي' : 'Stock'}</div>
                <div className="col-span-2 text-center">{language === 'ar' ? 'السعر الفردي' : 'Unit Price'}</div>
                <div className="col-span-2 text-center">{language === 'ar' ? 'إضافة للسلة' : 'Add'}</div>
                <div className="col-span-1 text-end">{language === 'ar' ? 'بالسلة' : 'In Cart'}</div>
              </div>

              {filteredProducts.map(product => {
                const inCart = cart.find(it => it.productId === product.id);
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock <= product.minStock && !isOutOfStock;

                return (
                  <div
                    key={product.id}
                    id={`pos-retail-row-${product.id}`}
                    onClick={() => addToCart(product)}
                    className={`bg-white dark:bg-slate-900 rounded-2xl p-2.5 sm:px-4 sm:py-2 border transition-all cursor-pointer select-none shadow-2xs hover:shadow-xs hover:border-blue-400 flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:items-center ${
                      inCart
                        ? 'border-blue-400 dark:border-blue-600 bg-blue-50/20 dark:bg-blue-950/20'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {/* Item Name & Barcode (Col 5) */}
                    <div className="sm:col-span-5 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0 text-xs">
                        <Tag className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {language === 'ar' ? product.nameAr : product.nameEn}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                          <span>{product.barcode || product.sku}</span>
                          <span className="text-slate-300">•</span>
                          <span>{product.sku}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stock Status (Col 2) */}
                    <div className="sm:col-span-2 flex items-center justify-between sm:justify-center">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                        isOutOfStock
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : isLowStock
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {isOutOfStock ? t('outOfStock') : `${product.stock} ${product.unit}`}
                      </span>
                    </div>

                    {/* Price (Col 2) */}
                    <div className="sm:col-span-2 text-start sm:text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenProductPriceEdit(product);
                        }}
                        className="group/price inline-flex items-center gap-1 px-2.5 py-1 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-transparent hover:border-amber-300 dark:hover:border-amber-700 transition-all cursor-pointer"
                        title="انقر لتعديل سعر المنتج مباشرة"
                      >
                        <span className="text-xs sm:text-sm font-black text-blue-600 dark:text-blue-400 group-hover/price:text-amber-600 dark:group-hover/price:text-amber-400 font-mono">
                          {formatCurrency(product.price)}
                        </span>
                        <Edit3 className="w-3 h-3 text-slate-400 group-hover/price:text-amber-500 opacity-0 group-hover/price:opacity-100 transition-opacity shrink-0" />
                      </button>
                    </div>

                    {/* Add Button (Col 2) */}
                    <div className="sm:col-span-2 flex items-center justify-end sm:justify-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer min-h-[40px]"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{language === 'ar' ? 'إضافة' : 'Add'}</span>
                      </button>
                    </div>

                    {/* In Cart (Col 1) */}
                    <div className="sm:col-span-1 flex items-center justify-end">
                      {inCart ? (
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shadow-xs">
                          {inCart.quantity}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 dark:text-slate-700 hidden sm:inline">-</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: POS Register Cart & Checkout Panel */}
      <div
        className={`w-full lg:w-96 xl:w-[420px] bg-white dark:bg-slate-900 border-s border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-lg z-30 transition-transform ${
          isMobileCartOpen ? 'fixed inset-0 z-50' : 'hidden lg:flex'
        }`}
      >
        {/* Cart Header with Mode Badge */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className={`w-5 h-5 ${
              businessMode === 'restaurant' ? 'text-emerald-600' : businessMode === 'wholesale' ? 'text-amber-500' : 'text-blue-600'
            }`} />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {businessMode === 'restaurant' ? (language === 'ar' ? 'طلب الطاولة والتجهيز' : 'Table Order') : businessMode === 'wholesale' ? (language === 'ar' ? 'فاتورة إرسالية الجملة' : 'Wholesale Invoice') : t('currentOrder')}
            </h3>
            {cartItemsCount > 0 && (
              <span className={`text-[10px] text-white font-bold px-2 py-0.5 rounded-full ${
                businessMode === 'restaurant' ? 'bg-emerald-600' : businessMode === 'wholesale' ? 'bg-amber-500 text-slate-950' : 'bg-blue-600'
              }`}>
                {cartItemsCount} {t('itemsCount')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('ai')}
              data-longpress-title={language === 'ar' ? 'المستشار الذكي (Gemini AI)' : 'AI Smart Advisor'}
              data-longpress-desc={language === 'ar' ? 'اقتراحات ذكية للبيع المتبادل بناءً على محتويات السلة الحالية.' : 'Smart cross-selling suggestions based on cart items.'}
              className="p-2 min-h-[36px] rounded-xl bg-gradient-to-r from-amber-500/10 to-indigo-500/10 hover:from-amber-500/20 hover:to-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 transition-all flex items-center gap-1 text-xs font-bold cursor-pointer active:scale-95"
              title={language === 'ar' ? 'المستشار الذكي (Gemini AI)' : 'AI Smart Advisor'}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden xl:inline">{language === 'ar' ? 'اقتراحات AI' : 'AI Advisor'}</span>
            </button>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => handleOpenQuantityKeypad(cart[cart.length - 1])}
                data-longpress-title={language === 'ar' ? 'لوحة الأرقام اللمسية' : 'Touch Keypad'}
                data-longpress-desc={language === 'ar' ? 'تعديل كمية أو سعر آخر صنف في السلة بلوحة أرقام لمسية كبيرة.' : 'Edit quantity or price with large touch keypad.'}
                className="p-2 min-h-[36px] rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 transition-all flex items-center gap-1 text-xs font-bold cursor-pointer active:scale-95"
                title={language === 'ar' ? 'لوحة أرقام لمسية' : 'Touch Keypad'}
              >
                <Calculator className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="hidden xl:inline">{language === 'ar' ? 'لوحة لمسية' : 'Keypad'}</span>
              </button>
            )}

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                data-longpress-title={language === 'ar' ? 'تفريغ السلة' : 'Clear Cart'}
                data-longpress-desc={language === 'ar' ? 'حذف جميع الأصناف الموجودة في السلة والبدء بفاتورة فارغة جديدة.' : 'Remove all items from current cart.'}
                className="text-xs text-rose-500 hover:text-rose-700 font-bold px-2.5 py-1.5 min-h-[36px] rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
                title={t('clearCart')}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('clearCart')}</span>
              </button>
            )}
            {/* Close for mobile drawer */}
            <button
              id="btn-close-mobile-cart"
              type="button"
              onClick={() => setIsMobileCartOpen(false)}
              className="lg:hidden flex items-center gap-1 px-3 py-2 min-h-[38px] rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 active:scale-95 text-xs font-bold transition-all cursor-pointer"
              aria-label="إغلاق السلة والعودة للأصناف"
            >
              <X className="w-4 h-4" />
              <span>{language === 'ar' ? 'إغلاق' : 'Close'}</span>
            </button>
          </div>
        </div>

        {/* RESTAURANT MODE: Dining Type & Table Bar */}
        {businessMode === 'restaurant' && (
          <div className="p-2.5 bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-800 dark:text-emerald-300">
                {restaurantDiningType === 'dine_in' ? `🍽️ ${selectedTable} (${guestCount} ضيوف)` : restaurantDiningType === 'takeaway' ? '🥡 طلب سفري' : '🛵 توصيل دليفري'}
              </span>
            </div>
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={() => setIsKitchenTicketModalOpen(true)}
              className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 hover:bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 flex items-center gap-1 transition-all"
            >
              <Printer className="w-3 h-3" />
              <span>{language === 'ar' ? 'معاينة بون المطبخ' : 'Preview KOT'}</span>
            </button>
          </div>
        )}

        {/* WHOLESALE MODE: Active Merchant / Debt Profile Card */}
        {businessMode === 'wholesale' && selectedCustomer && (
          <div className="p-2.5 bg-amber-50/80 dark:bg-amber-950/40 border-b border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-amber-900 dark:text-amber-200 truncate max-w-[190px]">
                {selectedCustomer.companyName || selectedCustomer.name}
              </div>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold font-mono">
                {language === 'ar' ? 'الذمة الحالية:' : 'Debt:'} {formatCurrency(selectedCustomer.currentDebt || 0)}
              </span>
            </div>
            <span className="text-[10px] bg-amber-200/90 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold px-2 py-0.5 rounded-md">
              {language === 'ar' ? 'سعر جملة تجار' : 'Wholesale Tier'}
            </span>
          </div>
        )}

        {/* RETAIL MODE: Customer Loyalty Banner */}
        {businessMode === 'retail' && selectedCustomer && (
          <div className="p-2.5 bg-blue-50/80 dark:bg-blue-950/40 border-b border-blue-200/80 dark:border-blue-800/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              {settings.enableLoyaltyPoints !== false ? (
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 text-blue-500" />
              )}
              <span className="font-bold text-blue-900 dark:text-blue-200">{selectedCustomer.name}</span>
            </div>
            {settings.enableLoyaltyPoints !== false ? (
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                {selectedCustomer.points} نقطة
              </span>
            ) : (
              <span className={`text-[10px] font-bold font-mono ${
                (selectedCustomer.currentDebt || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {(selectedCustomer.currentDebt || 0) > 0 ? `ذمة: ${formatCurrency(selectedCustomer.currentDebt || 0)}` : 'مبرأ الذمة'}
              </span>
            )}
          </div>
        )}

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <ShoppingBag className="w-14 h-14 text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{t('emptyCart')}</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">{t('emptyCartSubtitle')}</p>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.productId}
                className={`p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border flex flex-col gap-2 shadow-2xs ${
                  item.isWholesale ? 'border-amber-300/80 dark:border-amber-800/80' : 'border-slate-200/80 dark:border-slate-700/80'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {language === 'ar' ? item.product.nameAr : item.product.nameEn}
                      </h4>
                      {item.wholesaleUnit && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 shrink-0">
                          {item.wholesaleUnit}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      <button
                        type="button"
                        onClick={() => handleOpenCartItemPriceEdit(item)}
                        className="group/cprice inline-flex items-center gap-1 px-1.5 py-0.5 -ms-1 rounded-lg bg-amber-50/70 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-200/80 hover:border-amber-400 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 transition-all cursor-pointer"
                        title="انقر لتعديل سعر هذا الصنف في السلة مباشرة"
                      >
                        <span className="font-bold">{formatCurrency(item.unitPrice)}</span>
                        <Edit3 className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        {item.unitPrice !== item.product.price && (
                          <span className="text-[9px] px-1 rounded bg-amber-500 text-slate-950 font-black">
                            معدّل
                          </span>
                        )}
                      </button>
                      {item.discount > 0 && (
                        <span className="text-[10px] text-emerald-600 font-bold">
                          (خصم {formatCurrency(item.discount)})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Controls - Mobile-friendly touch targets */}
                  <div className="flex items-center gap-1 sm:gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateCartItemQuantity(item.productId, item.quantity - 1)}
                      className="w-9 h-9 sm:w-7 sm:h-7 min-w-[34px] min-h-[34px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                      aria-label="تقليل الكمية"
                    >
                      <Minus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenQuantityKeypad(item)}
                      className="min-w-[36px] px-1.5 py-1 min-h-[32px] text-center text-xs font-black font-mono text-slate-900 dark:text-white bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg border border-transparent hover:border-blue-400 transition-all cursor-pointer active:scale-95 shadow-2xs flex items-center justify-center gap-0.5 group/qty"
                      title="انقر لتعديل الكمية باللوحة الرقمية اللمسية"
                    >
                      <span>{item.quantity}</span>
                      <Edit3 className="w-2.5 h-2.5 text-slate-400 group-hover/qty:text-blue-500 opacity-60 group-hover/qty:opacity-100 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => updateCartItemQuantity(item.productId, item.quantity + 1)}
                      className={`w-9 h-9 sm:w-7 sm:h-7 min-w-[34px] min-h-[34px] rounded-xl text-white flex items-center justify-center active:scale-90 transition-transform cursor-pointer ${
                        businessMode === 'restaurant'
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : businessMode === 'wholesale'
                          ? 'bg-amber-500 hover:bg-amber-600'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                      aria-label="زيادة الكمية"
                    >
                      <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>

                  {/* Item Total & Trash */}
                  <div className="text-end shrink-0 min-w-[65px] flex flex-col items-end">
                    <span className="text-xs font-black text-slate-900 dark:text-white font-mono block">
                      {formatCurrency(item.total)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId)}
                      className="w-9 h-9 min-w-[36px] min-h-[36px] p-2 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 transition-colors mt-0.5 cursor-pointer active:scale-90"
                      title="حذف الصنف"
                      aria-label="حذف الصنف"
                    >
                      <Trash2 className="w-4 h-4 text-rose-500" />
                    </button>
                  </div>
                </div>

                {/* Wholesale Mode: Rapid Carton Multiplier & Trade Mode Switch */}
                {businessMode === 'wholesale' && (
                  <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                    <button
                      type="button"
                      onClick={() => toggleCartItemTradeMode(item.productId)}
                      className={`px-2.5 py-1 min-h-[32px] rounded-lg font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1 ${
                        item.isWholesale
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.isWholesale ? '📦 تسعير طرد / جملة' : '🏷️ تسعير مفرق'}
                    </button>

                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">إضافة سريعة:</span>
                      {[5, 10].map(cnt => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => updateCartItemQuantity(item.productId, item.quantity + cnt)}
                          className="px-2 py-1 min-h-[30px] rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-amber-100 text-slate-800 dark:text-slate-200 font-mono font-bold active:scale-95 cursor-pointer"
                        >
                          +{cnt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Restaurant Mode: Item Kitchen Notes */}
                {businessMode === 'restaurant' && (
                  <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                    {editingNoteItemKey === item.productId ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={tempNoteText}
                            onChange={e => setTempNoteText(e.target.value)}
                            placeholder={language === 'ar' ? 'ملاحظة المطبخ (مثلاً: بدون بصل)...' : 'Kitchen note...'}
                            className="flex-1 px-2.5 py-1.5 min-h-[36px] text-xs rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-slate-900 dark:text-white focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => saveItemNote(item.productId)}
                            className="px-2.5 py-1.5 min-h-[36px] bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 active:scale-95 cursor-pointer flex items-center justify-center"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Quick tags */}
                        <div className="flex flex-wrap gap-1">
                          {quickChefNotes.map(n => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setTempNoteText(n)}
                              className="text-[10px] font-semibold px-2 py-1 min-h-[30px] rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-950 hover:text-emerald-800 active:scale-95 cursor-pointer"
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs">
                        {item.kitchenNotes ? (
                          <div 
                            onClick={() => startEditingNote(item.productId, item.kitchenNotes)}
                            className="text-emerald-700 dark:text-emerald-400 font-semibold cursor-pointer hover:underline flex items-center gap-1 min-h-[32px]"
                          >
                            <span>📝</span>
                            <span className="truncate max-w-[220px]">{item.kitchenNotes}</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditingNote(item.productId)}
                            className="text-slate-400 hover:text-emerald-600 text-xs font-semibold flex items-center gap-1.5 min-h-[34px] px-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors active:scale-95 cursor-pointer"
                          >
                            <MessageSquarePlus className="w-3.5 h-3.5" />
                            <span>+ {language === 'ar' ? 'ملاحظة للشيف' : 'Chef Note'}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Cart Bottom Summary & Checkout */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
          {/* Order Discount Option */}
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1 font-bold">
              <Tag className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('orderDiscount')}:</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleOpenDiscountKeypad}
                className="px-2.5 py-1 min-h-[34px] bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-400 text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer shadow-2xs group transition-colors"
                title="فتح لوحة مفاتيح الخصم باللمس"
              >
                <span>{orderDiscount.value || 0}</span>
                <Calculator className="w-3 h-3 text-slate-400 group-hover:text-amber-500" />
              </button>
              <button
                onClick={() => setOrderDiscount({ ...orderDiscount, type: orderDiscount.type === 'percentage' ? 'fixed' : 'percentage' })}
                className="px-2.5 py-1.5 min-h-[34px] text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 active:scale-95 cursor-pointer font-mono"
              >
                {orderDiscount.type === 'percentage' ? '%' : settings.currency.symbol}
              </button>
            </div>
          </div>

          {/* Subtotal & Totals breakdown */}
          <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/80 dark:border-slate-700/80">
            <div className="flex justify-between">
              <span>{t('subtotal')}</span>
              <span className="font-mono">{formatCurrency(subtotal)}</span>
            </div>

            {/* Wholesale Savings Callout */}
            {wholesaleSavings > 0 && (
              <div className="flex justify-between text-amber-600 dark:text-amber-400 font-bold">
                <span>{language === 'ar' ? 'توفير أسعار الجملة:' : 'Wholesale Savings:'}</span>
                <span className="font-mono">-{formatCurrency(wholesaleSavings)}</span>
              </div>
            )}

            {totalDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                <span>{t('totalDiscounts')}</span>
                <span className="font-mono">-{formatCurrency(totalDiscount)}</span>
              </div>
            )}

            {settings.enableTax && (
              <div className="flex justify-between">
                <span>{t('tax')} ({settings.defaultTaxRate}%)</span>
                <span className="font-mono">+{formatCurrency(taxAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-black text-slate-950 dark:text-white pt-1.5 border-t border-slate-200 dark:border-slate-700">
              <span>{t('grandTotal')}</span>
              <span className={`font-mono text-lg ${
                businessMode === 'restaurant'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : businessMode === 'wholesale'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-blue-600 dark:text-blue-400'
              }`}>
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>

          {/* Restaurant Quick KOT Kitchen Print Button + Main Pay Button */}
          <div className="flex items-center gap-2 pt-1">
            {businessMode === 'restaurant' && (
              <button
                type="button"
                id="btn-print-kot-kitchen"
                disabled={cart.length === 0}
                onClick={() => setIsKitchenTicketModalOpen(true)}
                data-longpress-title={language === 'ar' ? 'إرسال للمطبخ (KOT)' : 'Send to Kitchen'}
                data-longpress-desc={language === 'ar' ? 'طباعة أو إرسال تذكرة الطلب والملاحظات الخاصة بطاهي المطبخ فوراً.' : 'Print or dispatch kitchen order ticket to preparation line.'}
                className={`py-3 px-3.5 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 border transition-all active:scale-95 cursor-pointer ${
                  cart.length === 0
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 shadow-xs'
                }`}
                title="إرسال وطباعة بون تحضير المطبخ KOT"
              >
                <Printer className="w-4 h-4 text-emerald-600" />
                <span className="whitespace-nowrap">{t('sendToKitchen')}</span>
              </button>
            )}

            {/* Pay Now Button */}
            <button
              type="button"
              id="btn-pos-pay-now"
              disabled={cart.length === 0}
              onClick={() => setIsPaymentModalOpen(true)}
              data-longpress-title={language === 'ar' ? 'محاسبة ودفع الفاتورة' : 'Pay & Complete'}
              data-longpress-desc={language === 'ar' ? 'فتح نافذة الدفع، اختيار الدفع كاش أو شبكة أو آجل، وطباعة الفاتورة.' : 'Proceed to payment dialog, calculate change and issue invoice.'}
              className={`flex-1 py-3.5 min-h-[48px] rounded-2xl text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer ${
                cart.length === 0
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed shadow-none'
                  : businessMode === 'restaurant'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-emerald-600/30'
                  : businessMode === 'wholesale'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-amber-600/30'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-blue-600/30'
              }`}
            >
              <Banknote className="w-5 h-5" />
              <span>{t('payNow')} ({formatCurrency(grandTotal)})</span>
            </button>
          </div>

          {/* Mobile Drawer Quick Dismiss Footer */}
          {isMobileCartOpen && (
            <button
              type="button"
              onClick={() => setIsMobileCartOpen(false)}
              className="lg:hidden w-full py-2.5 text-center text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 active:scale-95 transition-all mt-1"
            >
              {language === 'ar' ? '← العودة ومتابعة إضافة الأصناف' : '← Back to keep adding items'}
            </button>
          )}
        </div>
      </div>

      {/* MOBILE FLOATING ACTION DOCK (Ergonomic thumb-accessible bottom bar for POS) */}
      {!isMobileCartOpen && (
        <aside
          aria-label="لوحة كاشير الجوال السريعة"
          className="lg:hidden fixed bottom-16 inset-x-0 z-30 p-2.5 pointer-events-none"
        >
          <div className="max-w-md mx-auto pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-2 shadow-2xl border border-slate-200/90 dark:border-slate-800/90 flex items-center justify-between gap-2 animate-in slide-in-from-bottom-3 duration-200">
            {/* 1. Barcode Camera Button */}
            <button
              type="button"
              id="mobile-dock-barcode-btn"
              onClick={() => setIsBarcodeModalOpen(true)}
              data-longpress-title={language === 'ar' ? 'مسح باركود بالكاميرا' : 'Barcode Camera'}
              data-longpress-desc={language === 'ar' ? 'تشغيل كاميرا الهاتف لمسح باركود المنتج وإضافته مباشرة إلى الفاتورة.' : 'Open camera to scan barcodes directly.'}
              className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 active:scale-90 transition-all shadow-xs cursor-pointer"
              title={language === 'ar' ? 'مسح باركود بالكاميرا' : 'Camera Barcode Scanner'}
              aria-label="مسح باركود بالكاميرا"
            >
              <ScanBarcode className="w-5 h-5 text-amber-500" />
            </button>

            {/* Quick Invoice Return Shortcut on Mobile Dock */}
            <button
              type="button"
              onClick={() => setActiveTab('returns')}
              data-longpress-title={language === 'ar' ? 'إرجاع واسترجاع فاتورة' : 'Sales Return'}
              data-longpress-desc={language === 'ar' ? 'فتح شاشة إرجاع الفواتير بمسح الباركود أو إدخال رقم الفاتورة.' : 'Jump to return items and refund money.'}
              className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0 active:scale-90 transition-all shadow-xs cursor-pointer border border-rose-200/60 dark:border-rose-800/40"
              title="إرجاع بضاعة بمسح الباركود"
              aria-label="إرجاع بضاعة بمسح الباركود"
            >
              <RotateCcw className="w-5 h-5 text-rose-500" />
            </button>

            {/* 2. Cart Summary Button */}
            <button
              type="button"
              id="mobile-dock-cart-btn"
              onClick={() => setIsMobileCartOpen(true)}
              data-longpress-title={language === 'ar' ? 'درج سلة المشتريات' : 'Cart Drawer'}
              data-longpress-desc={language === 'ar' ? 'فتح درج السلة لمراجعة الأصناف وحذفها أو تعديل كمياتها وأسعارها.' : 'Open cart drawer to modify quantities and details.'}
              className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all text-start min-w-0 cursor-pointer"
              aria-label="عرض سلة التسوق"
            >
              <div className="relative shrink-0">
                <ShoppingBag className={`w-5 h-5 ${
                  businessMode === 'restaurant' ? 'text-emerald-600' : businessMode === 'wholesale' ? 'text-amber-500' : 'text-blue-600'
                }`} />
                {cartItemsCount > 0 && (
                  <span className={`absolute -top-1.5 -end-2 text-[9px] font-black text-white px-1.5 py-0.2 rounded-full ${
                    businessMode === 'restaurant' ? 'bg-emerald-600' : businessMode === 'wholesale' ? 'bg-amber-500 text-slate-950' : 'bg-blue-600'
                  }`}>
                    {cartItemsCount}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <span className="text-[10px] text-slate-400 font-bold block truncate">
                  {cartItemsCount > 0 ? `${cartItemsCount} ${t('itemsCount')}` : (language === 'ar' ? 'السلة فارغة' : 'Cart Empty')}
                </span>
                <span className="text-xs font-black font-mono text-slate-900 dark:text-white truncate block">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </button>

            {/* 3. Direct Instant Pay Button (Single Tap Checkout) */}
            <button
              type="button"
              id="mobile-dock-pay-btn"
              disabled={cart.length === 0}
              onClick={() => setIsPaymentModalOpen(true)}
              data-longpress-title={language === 'ar' ? 'محاسبة ودفع سريع' : 'Instant Checkout'}
              data-longpress-desc={language === 'ar' ? 'فتح شاشة الدفع واختيار طريقة المحاسبة نقد أو آجل وحساب الباقي.' : 'Open checkout modal to choose payment method and finish sale.'}
              className={`h-11 px-4 rounded-xl font-extrabold text-xs sm:text-sm text-white flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0 cursor-pointer ${
                cart.length === 0
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed shadow-none'
                  : businessMode === 'restaurant'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 shadow-emerald-600/30'
                  : businessMode === 'wholesale'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 shadow-amber-600/30'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-700 shadow-blue-600/30'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>{t('payNow')}</span>
            </button>
          </div>
        </aside>
      )}

      {/* Modals */}
      <BarcodeScannerModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        onProductNotFound={(barcode) => {
          setActiveTab('products');
        }}
      />

      <CustomerQRScannerModal
        isOpen={isCustomerQRModalOpen}
        onClose={() => setIsCustomerQRModalOpen(false)}
        onSelectCustomer={(cust) => {
          setSelectedCustomer(cust);
        }}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalAmount={grandTotal}
      />

      {businessMode === 'restaurant' && (
        <KitchenTicketModal
          isOpen={isKitchenTicketModalOpen}
          onClose={() => setIsKitchenTicketModalOpen(false)}
        />
      )}

      <POSTouchKeypadModal
        isOpen={touchKeypadConfig.isOpen}
        onClose={() => setTouchKeypadConfig(prev => ({ ...prev, isOpen: false }))}
        mode={touchKeypadConfig.mode}
        product={touchKeypadConfig.product || null}
        currentQuantity={touchKeypadConfig.currentQuantity}
        unit={touchKeypadConfig.unit}
        maxStock={touchKeypadConfig.maxStock}
        unitPrice={touchKeypadConfig.unitPrice}
        onConfirmQuantity={handleConfirmQuantityKeypad}
        currentPrice={touchKeypadConfig.currentPrice}
        costPrice={touchKeypadConfig.costPrice}
        isCartItem={touchKeypadConfig.isCartItem}
        cartQuantity={touchKeypadConfig.cartQuantity}
        onConfirmPrice={handleConfirmPriceKeypad}
        currentDiscountValue={touchKeypadConfig.currentDiscountValue}
        currentDiscountType={touchKeypadConfig.currentDiscountType}
        subtotal={touchKeypadConfig.subtotal}
        onConfirmDiscount={handleConfirmDiscountKeypad}
      />

      <BluetoothPrinterModal
        isOpen={isBluetoothModalOpen}
        onClose={() => setIsBluetoothModalOpen(false)}
      />
    </div>
  );
};
