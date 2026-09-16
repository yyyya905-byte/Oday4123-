import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  ShieldCheck,
  Smartphone,
  Laptop,
  CheckCircle2,
  Instagram,
  User,
  HeartHandshake,
  Layers,
  Zap,
  Globe
} from 'lucide-react';

export const AboutView: React.FC = () => {
  const { t, language } = useApp();

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 bg-slate-50/50 dark:bg-slate-950 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden text-center p-6 sm:p-8 space-y-6">
        {/* Brand Icon & Heading */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center font-black text-4xl shadow-xl shadow-amber-500/25 mb-4">
            K
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            KIAN CASHIER — كيان كاشير
          </h2>
          <span className="text-xs font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full mt-2">
            الإصدار الاحترافي v2.5 Pro
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md">
            نظام نقاط بيع (POS) متكامل وسحابي مصمم للمحلات التجارية، المطاعم، ونقاط التجزئة بأحدث معايير السرعة والأمان
          </p>
        </div>

        {/* System Capabilities List */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-start">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 space-y-1">
            <Smartphone className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">يعمل على كل الأجهزة</h4>
            <p className="text-[10px] text-slate-400">كمبيوتر، تابلت، وهواتف ذكية</p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 space-y-1">
            <Zap className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">بدون إنترنت (Offline)</h4>
            <p className="text-[10px] text-slate-400">استمرارية البيع دون انقطاع</p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 space-y-1">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">نقاط ولاء بالـ QR</h4>
            <p className="text-[10px] text-slate-400">بطاقات عضوية ومكافآت</p>
          </div>
        </div>

        {/* Developer Credit & Contact Card */}
        <div className="p-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-100/50 dark:from-amber-950/40 dark:to-slate-800/40 rounded-2xl border border-amber-500/30 text-start space-y-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              معلومات المطور والتواصل
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-amber-500/20">
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white">
                تطوير وبرمجة: <span className="text-amber-600 dark:text-amber-400">عدي الزعبي</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                Software & POS Solutions Engineer
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://instagram.com/o-xtr8"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 text-white font-bold text-xs shadow-xs hover:opacity-95 transition-opacity"
              >
                <Instagram className="w-4 h-4" />
                <span className="font-mono">o-xtr8</span>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright notice */}
        <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          جميع الحقوق محفوظة © {new Date().getFullYear()} KIAN CASHIER POS.
        </div>
      </div>
    </div>
  );
};
