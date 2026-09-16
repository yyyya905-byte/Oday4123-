import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';
import {
  UserCog,
  Plus,
  Shield,
  KeyRound,
  Trash2,
  Edit2,
  FileSpreadsheet,
  History,
  X,
  Lock,
  Sparkles,
  CheckCircle2,
  LogOut,
  LogIn,
  RefreshCw
} from 'lucide-react';
import { GoogleIcon } from '../common/GoogleIcon';
import { AUTHORIZED_PURCHASE_GENERATOR_EMAILS } from '../../utils/licenseUtils';

export const StaffView: React.FC = () => {
  const {
    users,
    auditLogs,
    addUser,
    updateUser,
    deleteUser,
    currentUser,
    googleUser,
    isGoogleSignedIn,
    isGoogleAuthLoading,
    signInWithGoogle,
    signOutGoogle,
    t,
    language,
    notify
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [pinCode, setPinCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isGoogleAccount, setIsGoogleAccount] = useState(false);

  const openAddModal = () => {
    setEditingUser(null);
    setName('');
    setRole('cashier');
    setPinCode('1234');
    setEmail('');
    setPhone('');
    setIsGoogleAccount(false);
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setName(u.name);
    setRole(u.role);
    setPinCode(u.pinCode);
    setEmail(u.email || '');
    setPhone(u.phone || '');
    setIsGoogleAccount(Boolean(u.isGoogleAccount));
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !pinCode.trim()) {
      notify('تنبيه', 'يرجى إدخال اسم الموظف ورمز الدخول PIN', 'warning');
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, {
        name,
        role,
        pinCode,
        email,
        phone,
        isGoogleAccount,
        googleEmail: isGoogleAccount ? (email || editingUser.googleEmail) : undefined
      });
      notify('تم بنجاح', `تم تحديث بيانات ${name}`, 'success');
    } else {
      addUser({
        name,
        role,
        pinCode,
        email,
        phone,
        active: true,
        isGoogleAccount,
        googleEmail: isGoogleAccount ? email : undefined
      });
      notify('تم بنجاح', `تم إضافة الموظف الجديد ${name}`, 'success');
    }

    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 bg-slate-50/50 dark:bg-slate-950">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>{t('staffManagementTitle')}</span>
            <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full">
              الصلاحيات والأمان
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            إدارة الكاشيرات والمدراء، تعيين رموز PIN للدخول السريع، ومراقبة سجل العمليات الحساسة
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addStaff')}</span>
        </button>
      </div>

      {/* Google Authentication & Single Sign-On Banner */}
      <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-amber-500/10 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-amber-950/20 p-4 sm:p-5 rounded-3xl border border-blue-200/80 dark:border-blue-900/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
            <GoogleIcon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                تسجيل الدخول وربط الحسابات عبر Google
              </h3>
              {isGoogleSignedIn ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  حساب Google متصل
                </span>
              ) : (
                <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded-full">
                  صلاحيات الإدارة والمالك
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
              {isGoogleSignedIn && googleUser ? (
                <span>
                  مسجل الدخول حالياً بحساب مالك النظام المعتمد: <strong className="font-bold text-slate-900 dark:text-white">{googleUser.name}</strong>. يتيح لك هذا الحساب التحكم الكامل ومزامنة البيانات مع Google Drive.
                </span>
              ) : (
                <span>
                  يتيح لك تسجيل الدخول بحساب Google الوصول المباشر بصلاحية مالك النظام دون الحاجة لحفظ رمز PIN، مع إمكانية ربط النسخ الاحتياطي السحابي.
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
          {isGoogleSignedIn && googleUser ? (
            <>
              <button
                onClick={() => signInWithGoogle()}
                disabled={isGoogleAuthLoading}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGoogleAuthLoading ? 'animate-spin' : ''}`} />
                <span>تبديل الحساب</span>
              </button>
              <button
                onClick={signOutGoogle}
                className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>تسجيل الخروج</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => signInWithGoogle()}
                disabled={isGoogleAuthLoading}
                className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white text-xs font-black flex items-center gap-2 shadow-xs cursor-pointer transition-all active:scale-95"
              >
                {isGoogleAuthLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <GoogleIcon className="w-4 h-4" />
                )}
                <span>تسجيل الدخول بـ Google</span>
              </button>
              {AUTHORIZED_PURCHASE_GENERATOR_EMAILS.map((email, idx) => (
                <button
                  key={email}
                  onClick={() => signInWithGoogle({ hintEmail: email })}
                  disabled={isGoogleAuthLoading}
                  className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  title="دخول فوري بحساب المطور المعتمد"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>دخول المطور ({idx + 1})</span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(u => {
          const isMe = u.id === currentUser.id;
          return (
            <div
              key={u.id}
              className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border shadow-xs transition-all relative ${
                isMe ? 'border-amber-500/50 ring-2 ring-amber-500/20' : 'border-slate-200/90 dark:border-slate-800'
              }`}
            >
              {isMe && (
                <span className="absolute top-4 end-4 text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                  حسابك الحالي
                </span>
              )}

              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center font-black text-base shadow-xs shrink-0 overflow-hidden">
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    u.name.charAt(0)
                  )}
                  {u.isGoogleAccount && (
                    <span className="absolute -bottom-1 -end-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-xs">
                      <GoogleIcon className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{u.name}</h3>
                    {u.isGoogleAccount && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-black bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-1.5 py-0.2 rounded-full">
                        <GoogleIcon className="w-2.5 h-2.5" />
                        Google
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                    <Shield className="w-3 h-3" />
                    {u.role === 'admin' ? 'مدير النظام (Admin)' : u.role === 'manager' ? 'مدير فرع (Manager)' : u.role === 'cashier' ? 'كاشير (Cashier)' : u.role}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 py-2 border-t border-b border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>رمز الدخول (PIN):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">•••• ({u.pinCode})</span>
                </div>
                {u.phone && (
                  <div className="flex justify-between">
                    <span>الهاتف:</span>
                    <span className="font-mono">{u.phone}</span>
                  </div>
                )}
                {u.email && (
                  <div className="flex justify-between">
                    <span>البريد:</span>
                    <span className="font-mono text-slate-600 dark:text-slate-400">
                      {AUTHORIZED_PURCHASE_GENERATOR_EMAILS.includes(u.email.toLowerCase())
                        ? '•••••••• (حساب محمي ومخفي)'
                        : u.email}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-1 flex justify-end gap-1.5">
                <button
                  onClick={() => openEditModal(u)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  تعديل
                </button>
                {!isMe && (
                  <button
                    onClick={() => {
                      if (confirm(`حذف الموظف (${u.name})؟`)) {
                        deleteUser(u.id);
                      }
                    }}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Audit Log */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <History className="w-4 h-4 text-amber-500" />
          <span>سجل الرقابة والأمان (Audit Log)</span>
        </h3>
        <p className="text-xs text-slate-400">
          تسجيل العمليات الحساسة (المرتجعات، تعديل الأسعار، تغيير المخزون، حذف السجلات) مع اسم المستخدم والطابع الزمني
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                <th className="pb-2 text-start">المستخدم</th>
                <th className="pb-2 text-start">نوع الإجراء</th>
                <th className="pb-2 text-start">التفاصيل</th>
                <th className="pb-2 text-end">التاريخ والوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {auditLogs.slice(0, 10).map(log => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 font-bold text-slate-900 dark:text-white">
                    {log.userName}
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 text-slate-600 dark:text-slate-400">
                    {log.details}
                  </td>
                  <td className="py-3 text-end font-mono text-slate-400">
                    {new Date(log.timestamp).toLocaleString(language === 'ar' ? 'ar-SY' : 'en-US')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingUser ? 'تعديل حساب موظف' : 'إضافة موظف جديد'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم الموظف *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="مثال: يزن الحمد"
                  className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الدور والصلاحية
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                >
                  <option value="cashier">كاشير (POS Sales Only)</option>
                  <option value="manager">مدير فرع (Manager)</option>
                  <option value="admin">مدير النظام بكامل الصلاحيات (Admin)</option>
                  <option value="inventory">أمين مستودع (Inventory)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رمز الدخول السريع (PIN 4 أرقام) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={pinCode}
                  onChange={e => setPinCode(e.target.value)}
                  placeholder="1234"
                  className="w-full text-center text-lg font-mono font-bold px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="09..."
                  className="w-full text-xs font-mono px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  البريد الإلكتروني (Google Account)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com أو gmail.com"
                  className="w-full text-xs font-mono px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl border border-blue-200/60 dark:border-blue-800/60">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isGoogleAccount}
                    onChange={e => setIsGoogleAccount(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-1.5">
                    <GoogleIcon className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      تمكين تسجيل الدخول المباشر عبر Google لهذا الحساب
                    </span>
                  </div>
                </label>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 ps-6">
                  عند التفعيل، يمكن للموظف الدخول فوراً عبر زر Google ببريده الإلكتروني.
                </p>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-500/20"
                >
                  حفظ الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
