import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import {
  Smartphone,
  Search,
  Plus,
  Minus,
  ShoppingBag,
  Send,
  ArrowRight,
  UtensilsCrossed,
  CheckCircle2,
  Table,
  Sparkles,
  Layers,
  X
} from 'lucide-react';
import { soundEffects } from '../../services/audio';

export const MobileWaiterView: React.FC<{ onBackToMain?: () => void }> = ({ onBackToMain }) => {
  const { 
    products, 
    categories, 
    formatCurrency, 
    addKitchenOrder, 
    notify,
    language,
    settings 
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tableNumber, setTableNumber] = useState('طاولة 1');
  const [diningType, setDiningType] = useState<'dine_in' | 'takeaway' | 'delivery'>('dine_in');
  const [orderNotes, setOrderNotes] = useState('');
  const [cartItems, setCartItems] = useState<{ product: Product; quantity: number; notes?: string }[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isSentSuccess, setIsSentSuccess] = useState(false);

  const tables = ['طاولة 1', 'طاولة 2', 'طاولة 3', 'طاولة 4', 'طاولة 5', 'طاولة 6', 'طاولة 7', 'VIP 1', 'VIP 2', 'الصالون الخارجي'];

  const filteredProducts = products.filter(p => {
    if (p.status !== 'active') return false;
    if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.nameAr.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q) || p.barcode.includes(q);
    }
    return true;
  });

  const handleAddToCart = (product: Product) => {
    setCartItems(prev => {
      const idx = prev.findIndex(it => it.product.id === product.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx].quantity += 1;
        return next;
      }
      return [...prev, { product, quantity: 1 }];
    });
    soundEffects.buttonClick();
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems(prev => {
      return prev.map(it => {
        if (it.product.id === productId) {
          const nextQty = it.quantity + delta;
          return nextQty > 0 ? { ...it, quantity: nextQty } : null;
        }
        return it;
      }).filter(Boolean) as { product: Product; quantity: number; notes?: string }[];
    });
  };

  const totalCartCount = cartItems.reduce((acc, it) => acc + it.quantity, 0);
  const totalCartAmount = cartItems.reduce((acc, it) => acc + (it.product.price * it.quantity), 0);

  const handleSendOrder = () => {
    if (cartItems.length === 0) return;

    const orderNumber = `ORD-${Math.floor(100 + Math.random() * 900)}`;
    addKitchenOrder({
      orderNumber,
      sourceDevice: `هاتف النادل (${tableNumber})`,
      diningType,
      tableName: tableNumber,
      guestCount: 2,
      notes: orderNotes,
      status: 'pending',
      estimatedMinutes: 10,
      items: cartItems.map((it, idx) => ({
        id: `m-it-${Date.now()}-${idx}`,
        productId: it.product.id,
        nameAr: it.product.nameAr,
        nameEn: it.product.nameEn,
        quantity: it.quantity,
        unitPrice: it.product.price,
        notes: it.notes,
        status: 'pending',
      }))
    });

    setIsSentSuccess(true);
    soundEffects.saleSuccess();
    setCartItems([]);
    setOrderNotes('');
    setIsCartDrawerOpen(false);

    setTimeout(() => {
      setIsSentSuccess(false);
    }, 3000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans select-none">
      {/* Mobile Top Header */}
      <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3.5 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-2.5">
          {onBackToMain && (
            <button
              onClick={onBackToMain}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          )}
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
              {language === 'ar' ? 'هاتف النادل والطلبات' : 'Mobile Waiter Pad'}
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {tableNumber} • {diningType === 'dine_in' ? 'محلي' : 'سفري'}
            </p>
          </div>
        </div>

        {/* Table Selector */}
        <select
          value={tableNumber}
          onChange={e => setTableNumber(e.target.value)}
          className="text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 py-1.5 px-2.5 rounded-xl text-amber-600 dark:text-amber-400"
        >
          {tables.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Success Notification Banner */}
      {isSentSuccess && (
        <div className="bg-emerald-500 text-white py-2 px-4 text-xs font-black flex items-center justify-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{language === 'ar' ? 'تم إرسال الطلب فورياً إلى المطبخ والكاشير المركزي! 🎉' : 'Order sent to Kitchen & Master POS!'}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-3 bg-white dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={language === 'ar' ? 'ابحث عن وجبة، مشروب، باركود...' : 'Search food or beverage...'}
            className="w-full ps-9 pe-4 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="p-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex gap-1.5 overflow-x-auto">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          {language === 'ar' ? 'الكل' : 'All'}
        </button>
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === c.id
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {language === 'ar' ? c.nameAr : c.nameEn}
          </button>
        ))}
      </div>

      {/* Product Cards Grid */}
      <div className="flex-1 p-3 overflow-y-auto pb-24">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {filteredProducts.map(product => {
            const inCart = cartItems.find(it => it.product.id === product.id);

            return (
              <div
                key={product.id}
                onClick={() => handleAddToCart(product)}
                className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-2xs active:scale-98 transition-transform cursor-pointer"
              >
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                    {language === 'ar' ? product.nameAr : product.nameEn}
                  </h3>
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400 mt-1 block">
                    {formatCurrency(product.price)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  {inCart ? (
                    <div 
                      className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/50 p-1 rounded-xl w-full justify-between"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleUpdateQuantity(product.id, -1)}
                        className="w-6 h-6 rounded-lg bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-white flex items-center justify-center font-bold text-xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-black text-amber-600 dark:text-amber-400">{inCart.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(product.id, 1)}
                        className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="w-full py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'إضافة' : 'Add'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Bottom Cart Bar */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl z-40 flex items-center justify-between gap-3">
          <div 
            onClick={() => setIsCartDrawerOpen(true)}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                {totalCartCount}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">{tableNumber}</p>
              <p className="text-xs font-black text-amber-600 dark:text-amber-400">{formatCurrency(totalCartAmount)}</p>
            </div>
          </div>

          <button
            onClick={handleSendOrder}
            className="flex-1 max-w-xs py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 active:scale-95 text-white font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-transform"
          >
            <Send className="w-4 h-4 rtl:rotate-180" />
            <span>{language === 'ar' ? 'إرسال للمطبخ والكاشير' : 'Send to Kitchen'}</span>
          </button>
        </div>
      )}

      {/* Cart Drawer Modal */}
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl p-4 max-h-[85vh] flex flex-col border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-500" />
                <span>{language === 'ar' ? 'تفاصيل طلب الطاولة' : 'Order Details'} ({tableNumber})</span>
              </h3>
              <button
                onClick={() => setIsCartDrawerOpen(false)}
                className="p-1 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 my-3 pe-1">
              {cartItems.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {language === 'ar' ? item.product.nameAr : item.product.nameEn}
                    </p>
                    <span className="text-[11px] text-slate-400">
                      {formatCurrency(item.product.price)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateQuantity(item.product.id, -1)}
                      className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(item.product.id, 1)}
                      className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Kitchen Notes */}
            <div className="mb-3">
              <input
                type="text"
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                placeholder={language === 'ar' ? 'ملاحظات المطبخ (مثال: بدون بصل، تجهيز سريع)...' : 'Kitchen notes...'}
                className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendOrder}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-transform"
            >
              <Send className="w-4 h-4 rtl:rotate-180" />
              <span>{language === 'ar' ? 'تأكيد وإرسال الطلب' : 'Confirm Order'} ({formatCurrency(totalCartAmount)})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
