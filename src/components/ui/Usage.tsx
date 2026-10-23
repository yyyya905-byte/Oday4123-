"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ReceiptPrinter,
  ReceiptPrinterStage,
  ReceiptFeedMotion,
} from "./ReceiptPrinter";
import {
  Printer,
  Play,
  RotateCcw,
  Sparkles,
  QrCode,
  Check,
  Copy,
  Download,
  Volume2,
  VolumeX,
  Sliders,
  Layers,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { soundEffects } from "../../services/audio";
import { generateBarcodeSvg } from "../../utils/barcodeUtils";

export interface ReceiptPrinterUsageProps {
  orderNumber?: string;
  storeName?: string;
  storeNameEn?: string;
  onClose?: () => void;
  className?: string;
}

export function ReceiptPrinterUsage({
  orderNumber = "ORD-2048",
  storeName = "كيان كاشير & كافيه",
  storeNameEn = "KIAN CAFE & ROASTERY",
  onClose,
  className = "",
}: ReceiptPrinterUsageProps) {
  const [stage, setStage] = useState<ReceiptPrinterStage>("complete");
  const [feedMotion, setFeedMotion] = useState<ReceiptFeedMotion>("stepped");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isAutoPrinting, setIsAutoPrinting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const barcodeSvg = generateBarcodeSvg(orderNumber.replace(/[^A-Za-z0-9]/g, "") || "ORD2048", {
    width: 160,
    height: 42,
  });

  // Play realistic simulated thermal printer sequence
  const handleTriggerPrint = () => {
    setIsAutoPrinting(true);
    setStage("processing");
    if (soundEnabled) {
      soundEffects.playBeep();
    }

    // Advance to printing stage after 850ms
    setTimeout(() => {
      setStage("printing");
      if (soundEnabled) {
        soundEffects.playClick();
      }

      // Finish printing and show completion
      setTimeout(() => {
        setStage("complete");
        setIsAutoPrinting(false);
        if (soundEnabled) {
          soundEffects.playSuccess();
        }
      }, 2600);
    }, 850);
  };

  const handleCopyReceipt = () => {
    const text = `
================================
${storeNameEn}
${storeName}
================================
طلب رقم: ${orderNumber}
التاريخ: 13/10/2026 - 02:45 PM
الكاشير: كاشير 1 (وردية النهار)
--------------------------------
1x كولد برو مميز (Cold Brew)    18.00 SAR
2x كرواسون فستق (Pistachio)     29.00 SAR
1x فلات وايت دبل (Flat White)   16.00 SAR
--------------------------------
المجموع الفرعي:        63.00 SAR
ضريبة القيمة المضافة:   9.45 SAR
الإجمالي النهائي:       72.45 SAR
طريقة الدفع:           مدى / شبكة
================================
شكراً لزيارتكم! نتمنى لكم يوماً سعيداً
`.trim();

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={`flex flex-col items-center gap-6 p-4 sm:p-6 w-full max-w-xl mx-auto ${className}`}>
      {/* Title & Badge */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>محاكي طابعة الفواتير الحرارية التفاعلي</span>
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          Receipt Printer — {orderNumber}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          محاكاة حركية تفاعلية واقعية لتلقيم وقص الورق الحراري لنقاط البيع
        </p>
      </div>

      {/* Control Toolbar */}
      <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Stages selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 ml-1">الحالة:</span>
          {(["processing", "printing", "complete"] as const).map((s) => (
            <button
              key={s}
              type="button"
              disabled={isAutoPrinting}
              onClick={() => {
                setStage(s);
                if (soundEnabled) soundEffects.playClick();
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                stage === s
                  ? "bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {s === "processing" ? "معالجة" : s === "printing" ? "طباعة" : "مكتمل"}
            </button>
          ))}
        </div>

        {/* Feed motion toggle */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 ml-1">حركة الورق:</span>
          {(["stepped", "smooth"] as const).map((m) => (
            <button
              key={m}
              type="button"
              disabled={isAutoPrinting}
              onClick={() => setFeedMotion(m)}
              className={`px-2 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                feedMotion === m
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              {m === "stepped" ? "متدرج (خطوة خطوة)" : "انسيابي"}
            </button>
          ))}
        </div>

        {/* Action Buttons: Sound & Auto-print */}
        <div className="flex items-center gap-2 mr-auto">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded-xl border text-xs transition-colors cursor-pointer ${
              soundEnabled
                ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
            }`}
            title={soundEnabled ? "كتم الصوت" : "تشغيل المؤثرات الصوتية"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            type="button"
            disabled={isAutoPrinting}
            onClick={handleTriggerPrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer disabled:opacity-50"
          >
            {isAutoPrinting ? (
              <span className="inline-block animate-spin mr-1">⏳</span>
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>طباعة {orderNumber}</span>
          </button>
        </div>
      </div>

      {/* The Animated Receipt Printer Machine */}
      <div className="w-full flex justify-center py-2">
        <ReceiptPrinter.Root
          stage={stage}
          feedMotion={feedMotion}
          className="w-full max-w-sm"
        >
          <ReceiptPrinter.Machine className="w-full">
            <ReceiptPrinter.Header>
              <div className="flex items-center gap-2">
                <div className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Thermal POS 80mm
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 font-bold">
                {feedMotion === "stepped" ? "STEP-FEED" : "CONT-FEED"}
              </span>
            </ReceiptPrinter.Header>

            <ReceiptPrinter.Screen>
              <ReceiptPrinter.Status />
            </ReceiptPrinter.Screen>

            <ReceiptPrinter.Output>
              <ReceiptPrinter.Paper className="p-4 sm:p-5 text-slate-950 text-xs font-sans leading-relaxed">
                {/* Store Branding */}
                <div className="text-center pb-3 border-b border-dashed border-zinc-300">
                  <div className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
                    {storeNameEn}
                  </div>
                  <h3 className="text-base font-black tracking-tight text-zinc-950 mt-0.5">
                    {storeName}
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">
                    الرياض — طريق الملك فهد — هاتف: 0501234567
                  </p>
                  <div className="inline-block mt-1.5 px-2 py-0.5 rounded bg-zinc-100 text-[10px] font-mono font-bold text-zinc-700">
                    الرقم الضريبي: 300987654300003
                  </div>
                </div>

                {/* Order Meta Info */}
                <div className="py-2.5 border-b border-dashed border-zinc-300 text-[11px] space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 font-medium">رقم الفاتورة:</span>
                    <span className="font-mono font-black text-zinc-900 bg-amber-100 px-1.5 py-0.5 rounded">
                      #{orderNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-zinc-500">التاريخ والوقت:</span>
                    <span className="font-mono text-zinc-800">13/10/2026 — 02:45 PM</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-zinc-500">الكاشير / الموظف:</span>
                    <span className="font-bold text-zinc-800">كاشير #1 (وردية المساء)</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-zinc-500">نوع الطلب:</span>
                    <span className="font-bold text-amber-700">سفري — Takeaway</span>
                  </div>
                </div>

                {/* Items List */}
                <div className="py-2.5 border-b border-dashed border-zinc-300">
                  <div className="flex justify-between text-[10px] font-bold text-zinc-400 mb-1.5 pb-1 border-b border-zinc-200">
                    <span>الصنف (Item)</span>
                    <span>الكمية × السعر</span>
                    <span>المجموع</span>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-bold text-zinc-900">كولد برو مميز (Cold Brew)</div>
                        <div className="text-[9px] text-zinc-500">بن إثيوبي فاخر بارد</div>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-600 px-2">1 × 18.00</div>
                      <div className="font-mono font-bold text-zinc-900">18.00</div>
                    </div>

                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-bold text-zinc-900">كرواسون فستق مقرمش</div>
                        <div className="text-[9px] text-zinc-500">حشوة بيستاشيو طبيعية</div>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-600 px-2">2 × 14.50</div>
                      <div className="font-mono font-bold text-zinc-900">29.00</div>
                    </div>

                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-bold text-zinc-900">فلات وايت دبل شوت</div>
                        <div className="text-[9px] text-zinc-500">حليب شوفان عضوي</div>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-600 px-2">1 × 16.00</div>
                      <div className="font-mono font-bold text-zinc-900">16.00</div>
                    </div>
                  </div>
                </div>

                {/* Subtotals & Totals */}
                <div className="py-2.5 border-b border-dashed border-zinc-300 text-[11px] space-y-1">
                  <div className="flex justify-between text-zinc-600">
                    <span>المجموع الفرعي (Subtotal):</span>
                    <span className="font-mono">63.00 SAR</span>
                  </div>
                  <div className="flex justify-between text-zinc-600 text-[10px]">
                    <span>ضريبة القيمة المضافة (VAT 15%):</span>
                    <span className="font-mono">9.45 SAR</span>
                  </div>
                  <div className="flex justify-between text-zinc-600 text-[10px]">
                    <span>الخصم المطبق:</span>
                    <span className="font-mono text-emerald-600">0.00 SAR</span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 mt-1 border-t border-zinc-200 text-sm font-black text-zinc-950">
                    <span>الإجمالي الكلي (TOTAL):</span>
                    <span className="font-mono text-base text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      72.45 SAR
                    </span>
                  </div>
                </div>

                {/* Payment method */}
                <div className="py-2 border-b border-dashed border-zinc-300 text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">طريقة السداد:</span>
                    <span className="font-bold text-zinc-800">بطاقة مدى (Mada Debit)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">رقم البطاقة:</span>
                    <span className="font-mono text-zinc-700">************2048</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">رقم العملية (RRN):</span>
                    <span className="font-mono text-zinc-700">928374102847</span>
                  </div>
                </div>

                {/* Barcode & QR Code */}
                <div className="pt-3 pb-2 text-center space-y-2">
                  <div
                    className="flex justify-center items-center py-1 overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                  />
                  <div className="text-[9px] font-mono tracking-widest text-zinc-500">
                    *{orderNumber}*
                  </div>
                </div>

                {/* Footer Message */}
                <div className="text-center pt-1 pb-3 text-[10px] text-zinc-500 space-y-0.5">
                  <p className="font-bold text-zinc-800">شكراً لاختياركم كيان — نسعد بخدمتكم دائماً!</p>
                  <p>الاستبدال والاسترجاع خلال 3 أيام مع إبراز هذه الفاتورة</p>
                </div>
              </ReceiptPrinter.Paper>
            </ReceiptPrinter.Output>
          </ReceiptPrinter.Machine>
        </ReceiptPrinter.Root>
      </div>

      {/* Footer utility buttons */}
      <div className="flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={handleCopyReceipt}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "تم النسخ!" : "نسخ نص الفاتورة"}</span>
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>طباعة الفاتورة</span>
        </button>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer mr-auto"
          >
            <span>إغلاق</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default ReceiptPrinterUsage;
