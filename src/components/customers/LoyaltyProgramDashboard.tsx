import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Star,
  Users,
  Search,
  Plus,
  Minus,
  Award,
  Crown,
  ShoppingBag,
  TrendingUp,
  Receipt,
  Calendar,
  Phone,
  X,
  CheckCircle2,
  Sliders,
  DollarSign,
  ArrowRight,
  Printer,
  Edit2,
  ExternalLink,
  Layers,
  FileText,
  Percent,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Customer, Sale } from '../../types';
import { soundEffects } from '../../services/audio';

// Tier calculation helper
export const getLoyaltyTier = (points: number): {
  id: 'bronze' | 'silver' | 'gold' | 'vip';
  nameAr: string;
  badgeColor: string;
  textColor: string;
  icon: string;
  minPoints: number;
  discountBonusPercent: number;
} => {
  if (points >= 1000) {
    return {
      id: 'vip',
      nameAr: 'عضوية بلاتينية VIP 💎',
      badgeColor: 'bg-purple-100 dark:bg-purple-950/70 border-purple-300 dark:border-purple-800',
      textColor: 'text-purple-700 dark:text-purple-300',
      icon: '💎',
      minPoints: 1000,
      discountBonusPercent: 15,
    };
  }
  if (points >= 500) {
    return {
      id: 'gold',
      nameAr: 'عضوية ذهبية 🥇',
      badgeColor: 'bg-amber-100 dark:bg-amber-950/70 border-amber-300 dark:border-amber-800',
      textColor: 'text-amber-800 dark:text-amber-300',
      icon: '🥇',
      minPoints: 500,
      discountBonusPercent: 10,
    };
  }
  if (points >= 100) {
    return {
      id: 'silver',
      nameAr: 'عضوية فضية 🥈',
      badgeColor: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700',
      textColor: 'text-slate-700 dark:text-slate-300',
      icon: '🥈',
      minPoints: 100,
      discountBonusPercent: 5,
    };
  }
  return {
    id: 'bronze',
    nameAr: 'عضوية برونزية 🥉',
    badgeColor: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900',
    textColor: 'text-orange-700 dark:text-orange-400',
    icon: '🥉',
    minPoints: 0,
    discountBonusPercent: 0,
  };
};

interface LoyaltyProgramDashboardProps {
  onBackToCustomers?: () => void;
}

export const LoyaltyProgramDashboard: React.FC<LoyaltyProgramDashboardProps> = ({
  onBackToCustomers,
}) => {
  const {
    customers,
    sales,
    settings,
    updateSettings,
    adjustCustomerPoints,
    formatCurrency,
    notify,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('all');
  const [selectedMemberForSummary, setSelectedMemberForSummary] = useState<Customer | null>(null);

  // Points Adjustment Modal State
  const [isAdjustPointsModalOpen, setIsAdjustPointsModalOpen] = useState(false);
  const [adjustTargetCustomer, setAdjustTargetCustomer] = useState<Customer | null>(null);
  const [pointsDeltaType, setPointsDeltaType] = useState<'add' | 'subtract'>('add');
  const [pointsAmount, setPointsAmount] = useState<number>(50);
  const [pointsReason, setPointsReason] = useState<string>('مكافأة ولاء وتشجيع');

  // Rule editing in settings
  const [isEditingRules, setIsEditingRules] = useState(false);
  const [spendRatioInput, setSpendRatioInput] = useState<number>(
    settings.pointsSpendRatio || 1000
  );
  const [redeemRatioInput, setRedeemRatioInput] = useState<number>(
    settings.pointsRedeemRatio || 100
  );

  // Loyalty Program Stats
  const loyaltyStats = useMemo(() => {
    let totalPoints = 0;
    let activeMembersCount = 0;
    let bronzeCount = 0;
    let silverCount = 0;
    let goldCount = 0;
    let vipCount = 0;

    customers.forEach(c => {
      const pts = c.points || 0;
      totalPoints += pts;
      if (pts > 0) activeMembersCount++;

      const tier = getLoyaltyTier(pts);
      if (tier.id === 'vip') vipCount++;
      else if (tier.id === 'gold') goldCount++;
      else if (tier.id === 'silver') silverCount++;
      else bronzeCount++;
    });

    const redeemValPerPoint = settings.pointsRedeemRatio || 100;
    const totalCashValue = totalPoints * redeemValPerPoint;

    // Total points redeemed across sales
    const totalRedeemedLifetime = sales.reduce(
      (sum, s) => sum + (s.pointsRedeemed || 0),
      0
    );

    return {
      totalPoints,
      activeMembersCount,
      totalCustomers: customers.length,
      totalCashValue,
      totalRedeemedLifetime,
      bronzeCount,
      silverCount,
      goldCount,
      vipCount,
    };
  }, [customers, sales, settings.pointsRedeemRatio]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return customers.filter(c => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.customerCode.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const tier = getLoyaltyTier(c.points || 0);
      if (selectedTierFilter !== 'all' && tier.id !== selectedTierFilter) {
        return false;
      }

      return true;
    });
  }, [customers, searchQuery, selectedTierFilter]);

  // Purchase History Summary for a selected member
  const memberPurchaseHistory = useMemo(() => {
    if (!selectedMemberForSummary) return null;

    const memberSales = sales.filter(
      s =>
        (s.customerId && s.customerId === selectedMemberForSummary.id) ||
        (s.customerCode && s.customerCode === selectedMemberForSummary.customerCode) ||
        (s.customerPhone && s.customerPhone === selectedMemberForSummary.phone)
    );

    const validSales = memberSales.filter(s => s.status !== 'voided');
    const totalSpent = validSales.reduce((acc, s) => acc + (s.total || 0), 0);
    const totalInvoices = validSales.length;
    const avgOrderValue = totalInvoices > 0 ? totalSpent / totalInvoices : 0;

    const totalPointsEarned = memberSales.reduce(
      (acc, s) => acc + (s.pointsEarned || 0),
      0
    );
    const totalPointsRedeemed = memberSales.reduce(
      (acc, s) => acc + (s.pointsRedeemed || 0),
      0
    );

    // Aggregate Favorite Items
    const productFrequency: {
      [id: string]: {
        nameAr: string;
        count: number;
        totalSpent: number;
      };
    } = {};

    validSales.forEach(s => {
      if (Array.isArray(s.items)) {
        s.items.forEach(it => {
          const pId = it.productId || it.productNameAr;
          if (!productFrequency[pId]) {
            productFrequency[pId] = {
              nameAr: it.productNameAr || it.productName || 'صنف',
              count: 0,
              totalSpent: 0,
            };
          }
          productFrequency[pId].count += it.quantity || 1;
          productFrequency[pId].totalSpent += it.total || 0;
        });
      }
    });

    const topProducts = Object.values(productFrequency)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      memberSales,
      validSales,
      totalSpent,
      totalInvoices,
      avgOrderValue,
      totalPointsEarned,
      totalPointsRedeemed,
      topProducts,
    };
  }, [selectedMemberForSummary, sales]);

  // Toggle Loyalty Program On/Off
  const handleToggleLoyaltyProgram = () => {
    const nextVal = !settings.enableLoyaltyPoints;
    updateSettings({ enableLoyaltyPoints: nextVal });
    soundEffects.playClick();
    notify(
      'نظام الولاء والمكافآت',
      nextVal ? 'تم تفعيل نظام نقاط المكافآت بنجاح' : 'تم إيقاف نظام نقاط المكافآت مؤقتاً',
      'info'
    );
  };

  // Save Rule ratios
  const handleSaveRules = () => {
    updateSettings({
      pointsSpendRatio: Number(spendRatioInput) || 1000,
      pointsRedeemRatio: Number(redeemRatioInput) || 100,
    });
    setIsEditingRules(false);
    soundEffects.playSuccess();
    notify('تم حفظ الإعدادات', 'تم تحديث قواعد احتساب واستبدال نقاط الولاء بنجاح', 'success');
  };

  // Open Points Adjustment Modal
  const handleOpenAdjustModal = (customer: Customer, type: 'add' | 'subtract' = 'add') => {
    setAdjustTargetCustomer(customer);
    setPointsDeltaType(type);
    setPointsAmount(50);
    setPointsReason(type === 'add' ? 'مكافأة ولاء وتشجيع' : 'استبدال مكافأة أو خصم مشتريات');
    setIsAdjustPointsModalOpen(true);
  };

  // Execute Points Adjustment
  const handleExecutePointsAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTargetCustomer) return;

    const delta = pointsDeltaType === 'add' ? Math.abs(pointsAmount) : -Math.abs(pointsAmount);
    adjustCustomerPoints(
      adjustTargetCustomer.id,
      delta,
      pointsDeltaType === 'add' ? 'earn' : 'redeem',
      pointsReason
    );

    soundEffects.playSuccess();
    notify(
      'تم تعديل النقاط بنجاح',
      `تم ${pointsDeltaType === 'add' ? 'إضافة' : 'خصم'} ${Math.abs(pointsAmount)} نقطة للعميل (${adjustTargetCustomer.name})`,
      'success'
    );
    setIsAdjustPointsModalOpen(false);

    // Refresh selected member summary if currently open
    if (selectedMemberForSummary?.id === adjustTargetCustomer.id) {
      const refreshed = customers.find(c => c.id === adjustTargetCustomer.id);
      if (refreshed) {
        setSelectedMemberForSummary({
          ...refreshed,
          points: Math.max(0, refreshed.points + delta),
        });
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in select-none">
      {/* 1. Header with Program Status & Rule Quick Editor */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  لوحة إدارة برنامج نقاط الولاء والمكافآت (Loyalty Program)
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                  settings.enableLoyaltyPoints !== false
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {settings.enableLoyaltyPoints !== false ? 'مُفعّل بالمتجر' : 'متوقف حالياً'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                إدارة مكافآت الأعضاء، تتبع الفئات والمستويات (VIP، ذهبي، فضي)، وعرض سجل المشتريات التراكمي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onBackToCustomers && (
              <button
                type="button"
                onClick={onBackToCustomers}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ArrowRight className="w-4 h-4" />
                <span>العودة للديون والعملاء</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleLoyaltyProgram}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs border ${
                settings.enableLoyaltyPoints !== false
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
              }`}
            >
              {settings.enableLoyaltyPoints !== false ? 'تعطيل النظام مؤقتاً' : 'تفعيل نظام الولاء'}
            </button>
          </div>
        </div>

        {/* Loyalty Program Rules Bar */}
        <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-amber-600" />
              <span>قواعد احتساب النقاط:</span>
            </span>

            {!isEditingRules ? (
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                <span>
                  كل <strong className="font-mono text-slate-900 dark:text-white font-black">{formatCurrency(settings.pointsSpendRatio || 1000)}</strong> شراء = <strong className="text-amber-600 dark:text-amber-400 font-black font-mono">1 نقطة</strong>
                </span>
                <span className="opacity-40">·</span>
                <span>
                  كل <strong className="text-amber-600 dark:text-amber-400 font-black font-mono">1 نقطة</strong> مستبدلة = خصم <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-black">{formatCurrency(settings.pointsRedeemRatio || 100)}</strong>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500">كل مشتريات بقيمة:</span>
                  <input
                    type="number"
                    value={spendRatioInput}
                    onChange={e => setSpendRatioInput(Number(e.target.value) || 0)}
                    className="w-24 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                  />
                  <span className="text-[11px] font-bold text-slate-500">= 1 نقطة</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500">قيمة النقطة عند الخصم:</span>
                  <input
                    type="number"
                    value={redeemRatioInput}
                    onChange={e => setRedeemRatioInput(Number(e.target.value) || 0)}
                    className="w-20 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveRules}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  حفظ القواعد
                </button>
              </div>
            )}
          </div>

          {!isEditingRules && (
            <button
              type="button"
              onClick={() => setIsEditingRules(true)}
              className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" />
              <span>تعديل معدلات الاحتساب</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Key Metrics & Tiers Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Points in Circulation */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500">إجمالي النقاط الفعالة</span>
            <h4 className="text-xl font-black font-mono text-amber-500 mt-0.5 flex items-center gap-1.5">
              <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
              <span>{loyaltyStats.totalPoints.toLocaleString()}</span>
              <span className="text-xs font-bold text-slate-400">نقطة</span>
            </h4>
            <span className="text-[10px] text-slate-400 mt-1 block">
              لدى {loyaltyStats.activeMembersCount} عضو نشط
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Estimated Financial Liability (Redemption Value) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500">القيمة النقدية المقابلة للنقاط</span>
            <h4 className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              {formatCurrency(loyaltyStats.totalCashValue)}
            </h4>
            <span className="text-[10px] text-slate-400 mt-1 block">
              التزام المكافآت المحتمل على المتجر
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Active Members Ratio */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500">الأعضاء النشطون بالبرنامج</span>
            <h4 className="text-xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
              {loyaltyStats.activeMembersCount} / {loyaltyStats.totalCustomers}
            </h4>
            <span className="text-[10px] text-slate-400 mt-1 block font-bold">
              {loyaltyStats.totalCustomers > 0
                ? `${Math.round((loyaltyStats.activeMembersCount / loyaltyStats.totalCustomers) * 100)}% من قاعدة العملاء`
                : 'لا يوجد عملاء'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* VIP & Top Tier Members */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200/80 dark:border-purple-900/40 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
              أعضاء VIP والمستوى الذهبي
            </span>
            <h4 className="text-xl font-black font-mono text-purple-700 dark:text-purple-300 mt-0.5">
              {loyaltyStats.vipCount + loyaltyStats.goldCount}{' '}
              <span className="text-xs font-bold text-slate-400">عضو كبار زوار</span>
            </h4>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {loyaltyStats.vipCount} بلاتيني · {loyaltyStats.goldCount} ذهبي
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-lg">
            💎
          </div>
        </div>
      </div>

      {/* 3. Loyalty Members Table & Management */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        {/* Search & Tier Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="بحث باسم العضو، رقم الجوال، أو رقم البطاقة..."
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl ps-9 pe-3 py-2 text-xs font-semibold focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tier Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: `كافة الأعضاء (${customers.length})` },
              { id: 'vip', label: `💎 VIP (${loyaltyStats.vipCount})` },
              { id: 'gold', label: `🥇 ذهبي (${loyaltyStats.goldCount})` },
              { id: 'silver', label: `🥈 فضي (${loyaltyStats.silverCount})` },
              { id: 'bronze', label: `🥉 برونزي (${loyaltyStats.bronzeCount})` },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedTierFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedTierFilter === tab.id
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Members Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <table className="w-full text-start text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3 text-start">بيانات العضو</th>
                <th className="py-3 px-3 text-center">المستوى والترقية</th>
                <th className="py-3 px-3 text-center">رصيد النقاط الحالي</th>
                <th className="py-3 px-3 text-center">القيمة النقدية المقابلة</th>
                <th className="py-3 px-3 text-center">إجمالي المشتريات التراكمي</th>
                <th className="py-3 px-3 text-center">آخر حركة شراء</th>
                <th className="py-3 px-3 text-center">إجراءات المكافآت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    لا يوجد أعضاء مطابقون لمعايير البحث
                  </td>
                </tr>
              ) : (
                filteredMembers.map(member => {
                  const pts = member.points || 0;
                  const tier = getLoyaltyTier(pts);
                  const cashEquivalent = pts * (settings.pointsRedeemRatio || 100);

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Member Info */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 font-black flex items-center justify-center font-mono text-xs shrink-0">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-black text-slate-900 dark:text-white block">
                              {member.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              كود: {member.customerCode} {member.phone ? `· ${member.phone}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Tier Badge */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black border ${tier.badgeColor} ${tier.textColor}`}
                        >
                          <span>{tier.icon}</span>
                          <span>{tier.nameAr}</span>
                        </span>
                      </td>

                      {/* Points Balance */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1 font-mono font-black text-sm text-amber-600 dark:text-amber-400">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>{pts.toLocaleString()}</span>
                        </div>
                      </td>

                      {/* Cash Equivalent */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(cashEquivalent)}
                      </td>

                      {/* Total Lifetime Spent */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                        {formatCurrency(member.totalSpent || 0)}
                      </td>

                      {/* Last Purchase Date */}
                      <td className="py-3 px-3 text-center text-[11px] text-slate-500">
                        {member.lastPurchaseDate
                          ? new Date(member.lastPurchaseDate).toLocaleDateString('ar-SY')
                          : 'لا توجد حركات'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Add Points */}
                          <button
                            type="button"
                            onClick={() => handleOpenAdjustModal(member, 'add')}
                            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                            title="إضافة نقاط مكافأة"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          {/* Subtract Points */}
                          <button
                            type="button"
                            onClick={() => handleOpenAdjustModal(member, 'subtract')}
                            className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 hover:bg-orange-100 border border-orange-200 dark:border-orange-800 transition-colors cursor-pointer"
                            title="خصم / استبدال نقاط"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          {/* View Purchase History Summary */}
                          <button
                            type="button"
                            onClick={() => setSelectedMemberForSummary(member)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                            title="عرض ملخص المشتريات والنشاط"
                          >
                            <Receipt className="w-3.5 h-3.5 text-amber-500" />
                            <span>سجل المشتريات</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL: INDIVIDUAL MEMBER PURCHASE HISTORY SUMMARY */}
      {selectedMemberForSummary && memberPurchaseHistory && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-150"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-white">
            {/* Header with Virtual Member Card */}
            <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white flex items-center justify-between shrink-0 border-b border-amber-500/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black flex items-center justify-center shadow-lg">
                  <Star className="w-6 h-6 fill-slate-950" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black">
                      ملخص مششتريات ونقاط العضو: {selectedMemberForSummary.name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                        getLoyaltyTier(selectedMemberForSummary.points || 0).badgeColor
                      } ${getLoyaltyTier(selectedMemberForSummary.points || 0).textColor}`}
                    >
                      {getLoyaltyTier(selectedMemberForSummary.points || 0).nameAr}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">
                    رقم العضوية: {selectedMemberForSummary.customerCode} · هاتف: {selectedMemberForSummary.phone || 'غير مسجل'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMemberForSummary(null)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Member Performance Metrics (4 Cards) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] font-bold text-slate-500 block">إجمالي مشتريات العضو</span>
                  <span className="text-base font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
                    {formatCurrency(memberPurchaseHistory.totalSpent)}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] font-bold text-slate-500 block">عدد الفواتير المنفذة</span>
                  <span className="text-base font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
                    {memberPurchaseHistory.totalInvoices} فاتورة
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] font-bold text-slate-500 block">متوسط قيمة السلة (AOV)</span>
                  <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                    {formatCurrency(memberPurchaseHistory.avgOrderValue)}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 block">رصيد النقاط الحالي</span>
                  <span className="text-base font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5 block">
                    {(selectedMemberForSummary.points || 0).toLocaleString()} نقطة
                  </span>
                </div>
              </div>

              {/* Favorite / Most Purchased Items */}
              {memberPurchaseHistory.topProducts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                    <span>الأصناف الأكثر شراءً وتفضيلاً من قبل العضو</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {memberPurchaseHistory.topProducts.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs"
                      >
                        <span className="font-extrabold text-slate-900 dark:text-white truncate block">
                          {p.nameAr}
                        </span>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                          <span>{p.count} قطعة</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(p.totalSpent)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoices Purchase History Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-amber-500" />
                    <span>سجل فواتير العضو ({memberPurchaseHistory.memberSales.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    مكتسب: +{memberPurchaseHistory.totalPointsEarned} نقطة · مستبدل: -{memberPurchaseHistory.totalPointsRedeemed} نقطة
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-start text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3 text-start">رقم الفاتورة</th>
                        <th className="py-2.5 px-3 text-start">التاريخ والوقت</th>
                        <th className="py-2.5 px-3 text-center">الأصناف</th>
                        <th className="py-2.5 px-3 text-center">طريقة الدفع</th>
                        <th className="py-2.5 px-3 text-center">النقاط المكتسبة</th>
                        <th className="py-2.5 px-3 text-end">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {memberPurchaseHistory.memberSales.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400">
                            لا توجد فواتير مسجلة لهذا العضو
                          </td>
                        </tr>
                      ) : (
                        memberPurchaseHistory.memberSales.map(sale => (
                          <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                              {sale.invoiceNumber}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                              {new Date(sale.createdAt).toLocaleString('ar-SY', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-300">
                              {sale.items?.length || 0} صنف
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                                {sale.paymentMethod === 'cash'
                                  ? 'نقدي'
                                  : sale.paymentMethod === 'card'
                                  ? 'بطاقة'
                                  : sale.paymentMethod === 'credit'
                                  ? 'آجل / ذمة'
                                  : sale.paymentMethod === 'points'
                                  ? 'نقاط ولاء'
                                  : sale.paymentMethod}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {sale.pointsEarned ? (
                                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                                  +{sale.pointsEarned}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-end font-mono font-black text-slate-900 dark:text-white">
                              {formatCurrency(sale.total)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenAdjustModal(selectedMemberForSummary, 'add')}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة نقاط مكافأة</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAdjustModal(selectedMemberForSummary, 'subtract')}
                  className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>خصم / استبدال نقاط</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMemberForSummary(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: ADJUST CUSTOMER POINTS (+/-) */}
      {isAdjustPointsModalOpen && adjustTargetCustomer && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col text-slate-900 dark:text-white">
            <div className="p-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-slate-950" />
                <h3 className="text-sm font-black">
                  إدارة نقاط المكافآت للعميل: {adjustTargetCustomer.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustPointsModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-black/10 hover:bg-black/20 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecutePointsAdjustment} className="p-5 space-y-4">
              {/* Type Switcher: Add or Subtract */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setPointsDeltaType('add')}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    pointsDeltaType === 'add'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة نقاط مكافأة (+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPointsDeltaType('subtract')}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    pointsDeltaType === 'subtract'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>خصم / استبدال نقاط (-)</span>
                </button>
              </div>

              {/* Current Points Info */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500">الرصيد الحالي للعضو:</span>
                <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm">
                  {(adjustTargetCustomer.points || 0).toLocaleString()} نقطة
                </span>
              </div>

              {/* Points Amount Input */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  عدد النقاط المراد {pointsDeltaType === 'add' ? 'إضافتها' : 'خصمها'}
                </label>
                <input
                  type="number"
                  min={1}
                  value={pointsAmount}
                  onChange={e => setPointsAmount(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-base font-black font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  required
                />

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  {[25, 50, 100, 250, 500].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPointsAmount(val)}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 transition-colors cursor-pointer"
                    >
                      {pointsDeltaType === 'add' ? `+${val}` : `-${val}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason Input & Quick Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  السبب أو البيان
                </label>
                <input
                  type="text"
                  value={pointsReason}
                  onChange={e => setPointsReason(e.target.value)}
                  placeholder="بيان سبب تعديل النقاط..."
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />

                <div className="flex items-center gap-1 flex-wrap mt-1.5">
                  {[
                    'مكافأة عيد ميلاد 🎂',
                    'تشجيع ولاء العميل ⭐',
                    'تعويض عن تأخير أو خطأ 🤝',
                    'استبدال هدية أو كوبون 🎁',
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPointsReason(preset)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustPointsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-xs font-black text-white cursor-pointer shadow-md ${
                    pointsDeltaType === 'add'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      : 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/20'
                  }`}
                >
                  تأكيد التعديل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
