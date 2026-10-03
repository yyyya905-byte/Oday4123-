import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error in POS System:', error, errorInfo);
    this.setState({ errorInfo });

    // Self-heal if caused by stale Vite pre-bundled React chunks in Service Worker cache
    if (error?.message?.includes('useState') || error?.message?.includes('Invalid hook call')) {
      try {
        const alreadyRetried = sessionStorage.getItem('kian_chunk_recovery_retry');
        if (!alreadyRetried) {
          sessionStorage.setItem('kian_chunk_recovery_retry', '1');
          this.clearCachesAndReload();
        }
      } catch {}
    }
  }

  private clearCachesAndReload = async () => {
    try {
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(name => caches.delete(name)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(reg => reg.unregister()));
      }
    } catch {}
    window.location.reload();
  };

  private handleReload = () => {
    try {
      sessionStorage.removeItem('kian_chunk_recovery_retry');
    } catch {}
    this.clearCachesAndReload();
  };

  private handleResetState = () => {
    try {
      localStorage.removeItem('kian_active_tab');
    } catch {
      // ignore
    }
    window.location.href = window.location.pathname;
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-slate-950 text-white flex items-center justify-center p-4 font-sans select-none">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center shadow-lg shadow-rose-500/10">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-black text-white">حدث خطأ غير متوقع أثناء العرض</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                تم حماية بياناتك ومبيعاتك تلقائياً في الذاكرة المحلية. يمكنك إعادة تحميل الصفحة للعودة فوراً لمتابعة العمل.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50 text-start text-[11px] font-mono text-rose-300 overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة تحميل النظام</span>
              </button>
              <button
                onClick={this.handleResetState}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>الرئيسية</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
