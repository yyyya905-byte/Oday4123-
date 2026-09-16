import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, GripHorizontal, RotateCcw } from 'lucide-react';

export interface DraggableModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string; // e.g. 'max-w-lg', 'max-w-xl', 'max-w-2xl'
  className?: string;
  headerActions?: React.ReactNode;
  headerExtra?: React.ReactNode;
  draggable?: boolean;
  closeOnBackdrop?: boolean;
  containerClassName?: string;
  ariaLabel?: string;
}

export const DraggableModalWrapper: React.FC<DraggableModalWrapperProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidth = 'max-w-lg',
  className = '',
  headerActions,
  headerExtra,
  draggable = true,
  closeOnBackdrop = true,
  containerClassName = '',
  ariaLabel
}) => {
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialOffsetX: number; initialOffsetY: number } | null>(null);
  const modalBoxRef = useRef<HTMLDivElement>(null);

  // Reset offset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setOffset({ x: 0, y: 0 });
    }
  }, [isOpen]);

  // Handle pointer down on drag handle or header
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!draggable) return;
    // Don't drag if user clicked an interactive control like button, input, select, etc.
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('textarea') || target.closest('a')) {
      return;
    }

    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialOffsetX: offset.x,
      initialOffsetY: offset.y
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!dragStartRef.current) return;
      const dx = moveEvent.clientX - dragStartRef.current.startX;
      const dy = moveEvent.clientY - dragStartRef.current.startY;

      // Viewport safety boundary clamping
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const modalWidth = modalBoxRef.current?.offsetWidth || 400;
      const modalHeight = modalBoxRef.current?.offsetHeight || 500;

      // Allow dragging but prevent modal from disappearing off screen
      const maxDragX = Math.max(30, (viewportWidth - 100) / 2);
      const maxDragY = Math.max(40, (viewportHeight - 120) / 2);

      const nextX = Math.min(Math.max(dragStartRef.current.initialOffsetX + dx, -maxDragX), maxDragX);
      const nextY = Math.min(Math.max(dragStartRef.current.initialOffsetY + dy, -maxDragY), maxDragY);

      setOffset({ x: nextX, y: nextY });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const handleResetPosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOffset({ x: 0, y: 0 });
  };

  // Keyboard Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isMoved = offset.x !== 0 || offset.y !== 0;

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto overflow-x-hidden animate-in fade-in duration-200 ${containerClassName}`}
      onClick={e => {
        if (closeOnBackdrop && e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : ariaLabel || 'نافذة منبثقة'}
    >
      <div
        ref={modalBoxRef}
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
          transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
        className={`bg-white dark:bg-slate-900 rounded-3xl w-full ${maxWidth} shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col transition-shadow ${
          isDragging ? 'shadow-amber-500/20 ring-2 ring-amber-500/40 select-none' : ''
        } ${className}`}
      >
        {/* Draggable Header Bar */}
        <div
          onPointerDown={handlePointerDown}
          className={`p-3.5 sm:p-4 bg-slate-50/95 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0 select-none ${
            draggable ? 'cursor-grab active:cursor-grabbing touch-none' : ''
          }`}
          title={draggable ? 'انقر واسحب لتحريك النافذة في أي مكان على الشاشة' : undefined}
        >
          {/* Title & Icon & Drag Grip Handle */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {draggable && (
              <div
                className="p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-amber-500 transition-colors shrink-0 cursor-grab"
                title="مقبض تحريك النافذة (اسحب من هنا)"
              >
                <GripHorizontal className="w-4 h-4" />
              </div>
            )}
            {icon && (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                {title}
              </h3>
              {subtitle && (
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Action buttons (Reset position, custom actions, close) */}
          <div className="flex items-center gap-1 shrink-0">
            {isMoved && (
              <button
                type="button"
                onClick={handleResetPosition}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-200/70 dark:bg-slate-700/70 hover:bg-slate-300 transition-colors cursor-pointer"
                title="إعادة النافذة إلى المركز الأصلي"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">إعادة للمنتصف</span>
              </button>
            )}
            {headerActions || headerExtra}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors active:scale-90 cursor-pointer"
              aria-label="إغلاق النافذة"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
};
