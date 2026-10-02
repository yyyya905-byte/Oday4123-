import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Tag,
  Sparkles,
  Percent,
  Gift,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  X,
  Calendar,
  Layers,
  ShoppingBag,
  TrendingDown,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { PromotionDeal, PromotionType } from '../../types';
import { soundEffects } from '../../services/audio';

interface PromotionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PromotionsModal: React.FC<PromotionsModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    promotions,
    addPromotion,
    deletePromotion,
    togglePromotionActive,
    categories,
    products,
    formatCurrency,
    language,
    notify
  } = useApp();

  const isRtl = language === 'ar';

  const [isCreating, setIsCreating] = useState(false);
  const [dealType, setDealType] = useState<PromotionType>('spend_threshold');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [badgeText, setBadgeText] = useState('عرض خاص');
  const [minOrderTotal, setMinOrderTotal] = useState<string>('100');
  const [discountPercent, setDiscountPercent] = useState<string>('10');
  const [discountAmount, setDiscountAmount] = useState<string>('0');
  const [buyQuantity, setBuyQuantity] = useState<string>('2');
  const [getQuantity, setGetQuantity] = useState<string>('1');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      notify('خطأ', 'يرجى إدخال اسم العرض الترويجي', 'error');
      return;
    }

    const now = new Date();
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 3);

    addPromotion({
      title,
      description: description || title,
      dealType,
      isActive: true,
      validFrom: now.toISOString(),
      validTo: futureDate.toISOString(),
      badgeText: badgeText || (language === 'ar' ? 'عرض مميز' : 'Special Offer'),
      minOrderTotal: dealType === 'spend_threshold' ? parseFloat(minOrderTotal) || 0 : undefined,
      discountPercent: parseFloat(discountPercent) || 0,
      discountAmount: parseFloat(discountAmount) || 0,
      buyQuantity: dealType === 'buy_x_get_y' ? parseInt(buyQuantity) || 2 : undefined,
      getQuantity: dealType === 'buy_x_get_y' ? parseInt(getQuantity) || 1 : undefined,
      targetCategoryIds: dealType === 'category_discount' && selectedCategory ? [selectedCategory] : undefined
    });

    soundEffects.playSuccess();
    notify('تم إنشاء العرض', `تم تفعيل عرض (${title}) بنجاح`, 'success');
    setIsCreating(false);
    setTitle('');
    setDescription('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 id="promo-modal-title" className="text-base sm:text-lg font-black tracking-tight">
                {language === 'ar' ? 'العروض الترويجية والخصومات الذكية' : 'Smart Promotions & Dynamic Deals'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'ar'
                  ? 'إنشاء عروض اشترِ واحصل على هدية، وخصومات سلة المشتريات التلقائية عند الدفع'
                  : 'Manage automated cart threshold discounts and bundle promotions'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Top Bar Action */}
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-500">
              {promotions.length} {language === 'ar' ? 'عرض ترويجي مسجل' : 'promotions configured'}
            </div>

            <button
              type="button"
              onClick={() => setIsCreating(!isCreating)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              {isCreating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{isCreating ? (language === 'ar' ? 'إلغاء' : 'Cancel') : (language === 'ar' ? 'إضافة عرض جديد' : 'New Promotion')}</span>
            </button>
          </div>

          {/* CREATE PROMOTION FORM */}
          {isCreating && (
            <form onSubmit={handleCreateSubmit} className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4 animate-in slide-in-from-top-2 duration-200">
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {language === 'ar' ? 'تفاصيل العرض الترويجي الجديد' : 'New Promotion Details'}
              </h3>

              {/* Deal Type Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDealType('spend_threshold')}
                  className={`p-3 rounded-2xl border text-start transition-all cursor-pointer ${
                    dealType === 'spend_threshold'
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-900 dark:text-amber-200 font-black'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <ShoppingBag className="w-4 h-4 text-amber-500" />
                    <span>{language === 'ar' ? 'خصم حد الفاتورة' : 'Spend Threshold'}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">خصم نسبة عند تجاوز مبلغ معين بالسلة</p>
                </button>

                <button
                  type="button"
                  onClick={() => setDealType('buy_x_get_y')}
                  className={`p-3 rounded-2xl border text-start transition-all cursor-pointer ${
                    dealType === 'buy_x_get_y'
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-900 dark:text-amber-200 font-black'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <Gift className="w-4 h-4 text-emerald-500" />
                    <span>{language === 'ar' ? 'اشترِ X واحصل على Y' : 'Buy X Get Y'}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">قطعة مجانية عند شراء عدد محدد</p>
                </button>

                <button
                  type="button"
                  onClick={() => setDealType('category_discount')}
                  className={`p-3 rounded-2xl border text-start transition-all cursor-pointer ${
                    dealType === 'category_discount'
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-900 dark:text-amber-200 font-black'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <Layers className="w-4 h-4 text-blue-500" />
                    <span>{language === 'ar' ? 'خصم قسم كامل' : 'Category Discount'}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">تخفيض عام على جميع أصناف قسم معين</p>
                </button>
              </div>

              {/* Title & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'ar' ? 'اسم العرض الترويجي:' : 'Promotion Title:'}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: خصم 10% للمشتريات فوق 100' : 'e.g. 10% off on orders above 100'}
                    required
                    className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'ar' ? 'شارة العرض (Badge):' : 'Badge Text:'}
                  </label>
                  <input
                    type="text"
                    value={badgeText}
                    onChange={e => setBadgeText(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: عرض حصري، توفير، موسم' : 'Special Offer'}
                    className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Conditional parameters */}
              {dealType === 'spend_threshold' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'ar' ? 'الحد الأدنى لقيمة السلة لتطبيق الخصم:' : 'Min Cart Total:'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={minOrderTotal}
                      onChange={e => setMinOrderTotal(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'ar' ? 'نسبة الخصم (%):' : 'Discount Percentage (%):'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={discountPercent}
                      onChange={e => setDiscountPercent(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-amber-600"
                    />
                  </div>
                </div>
              )}

              {dealType === 'buy_x_get_y' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'ar' ? 'عدد القطع المشتراة (Buy X):' : 'Buy Quantity:'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={buyQuantity}
                      onChange={e => setBuyQuantity(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'ar' ? 'عدد القطع المجانية (Get Y Free):' : 'Free Quantity:'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={getQuantity}
                      onChange={e => setGetQuantity(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-emerald-600"
                    />
                  </div>
                </div>
              )}

              {dealType === 'category_discount' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'ar' ? 'القسم المستهدف:' : 'Target Category:'}
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={e => setSelectedCategory(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                    >
                      <option value="">{language === 'ar' ? '-- اختر القسم --' : '-- Select Category --'}</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'ar' ? 'نسبة الخصم (%):' : 'Discount Percentage (%):'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={discountPercent}
                      onChange={e => setDiscountPercent(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-amber-600"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{language === 'ar' ? 'حفظ وتفعيل العرض' : 'Save & Activate'}</span>
                </button>
              </div>
            </form>
          )}

          {/* PROMOTIONS LIST */}
          <div className="space-y-3">
            {promotions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                {language === 'ar' ? 'لا توجد عروض ترويجية نشطة حالياً. اضغط "إضافة عرض جديد" للبدء.' : 'No active promotions configured.'}
              </div>
            ) : (
              promotions.map(promo => (
                <div
                  key={promo.id}
                  className={`p-4 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    promo.isActive
                      ? 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-850/60 border-slate-200/60 dark:border-slate-800/60 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                      {promo.dealType === 'buy_x_get_y' ? (
                        <Gift className="w-5 h-5 text-emerald-500" />
                      ) : promo.dealType === 'category_discount' ? (
                        <Layers className="w-5 h-5 text-blue-500" />
                      ) : (
                        <Percent className="w-5 h-5 text-amber-500" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white">
                          {promo.title}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                          {promo.badgeText}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {promo.description}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                        <span>مرات الاستخدام: {promo.usageCount || 0}</span>
                        {promo.minOrderTotal && <span>الحد الأدنى: {formatCurrency(promo.minOrderTotal)}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => togglePromotionActive(promo.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        promo.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {promo.isActive ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                      <span>{promo.isActive ? (language === 'ar' ? 'مفعل' : 'Active') : (language === 'ar' ? 'معطل' : 'Disabled')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        deletePromotion(promo.id);
                        notify('تم الحذف', 'تم حذف العرض الترويجي', 'info');
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="حذف العرض"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {language === 'ar' ? 'تُطبق العروض النشطة تلقائياً في السلة عند تحقيق الشروط' : 'Active promotions apply automatically in POS cart'}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
