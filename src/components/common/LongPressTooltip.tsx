import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { HelpCircle, Sparkles, X, Info } from 'lucide-react';

interface TooltipData {
  title: string;
  description: string;
  icon?: string;
  x?: number;
  y?: number;
}

interface LongPressContextType {
  showTooltip: (title: string, description: string, x?: number, y?: number) => void;
  hideTooltip: () => void;
}

const LongPressContext = createContext<LongPressContextType | null>(null);

export const useLongPressTooltip = () => {
  const context = useContext(LongPressContext);
  if (!context) {
    return {
      showTooltip: () => {},
      hideTooltip: () => {},
    };
  }
  return context;
};

export const LongPressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTooltip, setActiveTooltip] = useState<TooltipData | null>(null);
  const timerRef = useRef<number | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isTriggeredRef = useRef(false);

  const showTooltip = useCallback((title: string, description: string, x?: number, y?: number) => {
    // Subtle haptic vibration on mobile
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(35);
      } catch {
        // Ignored
      }
    }
    setActiveTooltip({ title, description, x, y });
  }, []);

  const hideTooltip = useCallback(() => {
    setActiveTooltip(null);
    isTriggeredRef.current = false;
  }, []);

  // Global listener for elements with data-longpress-desc
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const target = (e.target as HTMLElement)?.closest('[data-longpress-desc]') as HTMLElement | null;
      if (!target) return;

      const title = target.getAttribute('data-longpress-title') || target.getAttribute('aria-label') || target.getAttribute('title') || 'معلومات الخيار';
      const description = target.getAttribute('data-longpress-desc');
      if (!description) return;

      const touch = e.touches[0];
      touchStartPos.current = { x: touch.clientX, y: touch.clientY };
      isTriggeredRef.current = false;

      timerRef.current = window.setTimeout(() => {
        isTriggeredRef.current = true;
        showTooltip(title, description, touch.clientX, touch.clientY);
      }, 450);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartPos.current || !timerRef.current) return;
      const touch = e.touches[0];
      const moveDist = Math.hypot(touch.clientX - touchStartPos.current.x, touch.clientY - touchStartPos.current.y);
      // Cancel if user is scrolling/swiping (> 12px move)
      if (moveDist > 12) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }
    };

    const handleTouchEnd = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      touchStartPos.current = null;
      // Auto-hide when user lifts finger if triggered
      if (isTriggeredRef.current) {
        // Leave it visible for a moment or hide on tap outside
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [showTooltip]);

  return (
    <LongPressContext.Provider value={{ showTooltip, hideTooltip }}>
      {children}

      {/* Floating Long-Press Explanation Overlay / Card */}
      {activeTooltip && (
        <div
          onClick={hideTooltip}
          className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150 select-none cursor-pointer"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-slate-900/95 text-white p-5 rounded-3xl border border-amber-500/40 shadow-2xl max-w-sm w-full animate-in slide-in-from-bottom-3 duration-200"
          >
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    شرح الخيار (لمس مطول)
                  </span>
                  <h4 className="text-sm font-black text-white">
                    {activeTooltip.title}
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={hideTooltip}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                aria-label="إغلاق الشرح"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 mt-2 font-medium">
              {activeTooltip.description}
            </p>

            <div className="flex items-center justify-between mt-3 text-[10px] text-slate-400 pt-2 border-t border-slate-800">
              <span className="flex items-center gap-1">
                <Info className="w-3 h-3 text-amber-400" />
                <span>انقر أي مكان للمتابعة</span>
              </span>
              <button
                type="button"
                onClick={hideTooltip}
                className="px-3 py-1 bg-amber-500 text-slate-950 font-black rounded-lg text-[10px] hover:bg-amber-400 transition-colors"
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        </div>
      )}
    </LongPressContext.Provider>
  );
};

export interface LongPressTooltipProps {
  title: string;
  description: string;
  children: React.ReactElement<Record<string, any>>;
  className?: string;
}

export const LongPressTooltip: React.FC<LongPressTooltipProps> = ({
  title,
  description,
  children,
  className
}) => {
  const { showTooltip } = useLongPressTooltip();
  const timerRef = useRef<number | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const startPress = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    touchStartPos.current = { x: clientX, y: clientY };

    timerRef.current = window.setTimeout(() => {
      showTooltip(title, description, clientX, clientY);
    }, 450);
  };

  const cancelPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current || !timerRef.current) return;
    const touch = e.touches[0];
    const dist = Math.hypot(touch.clientX - touchStartPos.current.x, touch.clientY - touchStartPos.current.y);
    if (dist > 12) {
      cancelPress();
    }
  };

  return React.cloneElement(children, {
    'data-longpress-title': title,
    'data-longpress-desc': description,
    onTouchStart: (e: React.TouchEvent) => {
      startPress(e);
      children.props.onTouchStart?.(e);
    },
    onTouchMove: (e: React.TouchEvent) => {
      handleTouchMove(e);
      children.props.onTouchMove?.(e);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      cancelPress();
      children.props.onTouchEnd?.(e);
    },
    onTouchCancel: (e: React.TouchEvent) => {
      cancelPress();
      children.props.onTouchCancel?.(e);
    },
    onMouseDown: (e: React.MouseEvent) => {
      startPress(e);
      children.props.onMouseDown?.(e);
    },
    onMouseUp: (e: React.MouseEvent) => {
      cancelPress();
      children.props.onMouseUp?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      cancelPress();
      children.props.onMouseLeave?.(e);
    },
  } as any);
};
