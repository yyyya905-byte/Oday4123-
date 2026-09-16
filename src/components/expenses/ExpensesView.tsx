import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExpenseCategory } from '../../types';
import {
  Wallet,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Tag,
  FileText,
  X,
  PieChart as PieIcon
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export const ExpensesView: React.FC = () => {
  const {
    expenses,
    addExpense,
    deleteExpense,
    formatCurrency,
    t,
    language,
    settings,
    notify
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(50000);
  const [category, setCategory] = useState<ExpenseCategory>('utilities');
  const [notes, setNotes] = useState('');

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) {
      notify('تنبيه', 'يرجى إدخال بند المصروف والمبلغ', 'warning');
      return;
    }

    addExpense({
      title,
      amount: Number(amount),
      category,
      notes,
    });

    notify('تم بنجاح', `تم تسجيل المصروف ${title}`, 'success');
    setTitle('');
    setAmount(50000);
    setNotes('');
    setIsAddModalOpen(false);
  };

  // Group by category for chart
  const categoriesMap: { [key: string]: { name: string; value: number; color: string } } = {
    rent: { name: 'الإيجار (Rent)', value: 0, color: '#3B82F6' },
    utilities: { name: 'كهرباء ومياه ومحروقات', value: 0, color: '#F59E0B' },
    salaries: { name: 'رواتب وأجور', value: 0, color: '#10B981' },
    supplies: { name: 'مستلزمات ومشتريات', value: 0, color: '#8B5CF6' },
    maintenance: { name: 'صيانة وإصلاحات', value: 0, color: '#EC4899' },
    marketing: { name: 'تسويق وإعلانات', value: 0, color: '#06B6D4' },
    other: { name: 'مصاريف أخرى', value: 0, color: '#64748B' },
  };

  expenses.forEach(e => {
    if (categoriesMap[e.category]) {
      categoriesMap[e.category].value += e.amount;
    }
  });

  const chartData = Object.values(categoriesMap).filter(c => c.value > 0);

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 bg-slate-50/50 dark:bg-slate-950">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>{t('expensesTitle')}</span>
            <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full">
              إدارة النفقات التشغيلية
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            تسجيل ومتابعة مصاريف المحل، الإيجار، الكهرباء، والرواتب لاحتساب صافي الأرباح بدقة
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addExpense')}</span>
        </button>
      </div>

      {/* KPI Cards & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Total Expense Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block">{t('totalExpenses')} (هذا الشهر)</span>
            <h3 className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
              {formatCurrency(totalExpenses)}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
              مسجلة عبر {expenses.length} بند مصروف
            </p>
          </div>

          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900/40 text-[11px] text-rose-800 dark:text-rose-300">
            يتم خصم هذه المبالغ تلقائياً من إجمالي الأرباح في شاشة التقارير ولوحة التحكم.
          </div>
        </div>

        {/* Right 2 cols: Category Breakdown Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center gap-6">
          <div className="w-full sm:w-1/2 h-48 flex items-center justify-center">
            {chartData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center">لا توجد مصاريف للرسم البياني</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), 'المبلغ']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="w-full sm:w-1/2 space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs">
            {chartData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4 text-start">بند المصروف</th>
                <th className="py-3 px-3 text-start">التصنيف</th>
                <th className="py-3 px-3 text-start">الملاحظات</th>
                <th className="py-3 px-3 text-start">المسؤول</th>
                <th className="py-3 px-3 text-end">المبلغ</th>
                <th className="py-3 px-3 text-end">التاريخ</th>
                <th className="py-3 px-4 text-end">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    لا توجد مصاريف مسجلة
                  </td>
                </tr>
              ) : (
                expenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {expense.title}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {categoriesMap[expense.category]?.name || expense.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                      {expense.notes || '-'}
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      {expense.createdByName}
                    </td>
                    <td className="py-3 px-3 text-end font-mono font-bold text-rose-600 dark:text-rose-400">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="py-3 px-3 text-end text-slate-400 font-mono">
                      {new Date(expense.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SY' : 'en-US')}
                    </td>
                    <td className="py-3 px-4 text-end">
                      <button
                        onClick={() => {
                          if (confirm(`حذف مصروف (${expense.title})؟`)) {
                            deleteExpense(expense.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {t('addExpense')} جديد
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  بند المصروف / الوصف *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="مثال: فاتورة كهرباء شهر آب"
                  className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  المبلغ ({settings.currency.symbol}) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full text-sm font-bold font-mono px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  التصنيف
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                >
                  <option value="utilities">كهرباء ومياه ومحروقات</option>
                  <option value="rent">إيجار المحل أو المخزن</option>
                  <option value="salaries">رواتب وأجور موظفين</option>
                  <option value="supplies">مستلزمات تشغيل وأكياس</option>
                  <option value="maintenance">صيانة دورية وإصلاحات</option>
                  <option value="marketing">تسويق ودعاية</option>
                  <option value="other">مصاريف نثرية أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات إضافية
                </label>
                <input
                  type="text"
                  placeholder="رقم الإيصال أو المستلم..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-500/20"
                >
                  حفظ المصروف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
