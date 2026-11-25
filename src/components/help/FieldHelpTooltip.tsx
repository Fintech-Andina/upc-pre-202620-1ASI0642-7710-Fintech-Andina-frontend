import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { FIELD_HELP } from './helpContent';

interface FieldHelpTooltipProps {
  helpKey: string;
  align?: 'left' | 'right';
}

const supportsNativePopover =
  typeof HTMLElement !== 'undefined' && Object.hasOwn(HTMLElement.prototype, 'popover');

export function FieldHelpTooltip({ helpKey, align = 'left' }: FieldHelpTooltipProps) {
  const [open, setOpen] = useState(false);
  const [fallbackPos, setFallbackPos] = useState<{ top: number; left: number }>({
    top: -9999,
    left: -9999,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const popoverId = useId();
  const entry = FIELD_HELP[helpKey];

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const updatePosition = useCallback((): boolean => {
    const triggerEl = triggerRef.current;
    const popoverEl = popoverRef.current;
    if (!triggerEl || !popoverEl) return false;

    const triggerRect = triggerEl.getBoundingClientRect();
    if (
      triggerRect.bottom < 0 ||
      triggerRect.top > window.innerHeight ||
      triggerRect.right < 0 ||
      triggerRect.left > window.innerWidth
    ) {
      return false;
    }

    const popoverRect = popoverEl.getBoundingClientRect();
    const GAP = 8;
    const MARGIN = 12;
    const popWidth = Math.min(popoverRect.width || 288, window.innerWidth - MARGIN * 2);
    const popHeight = popoverRect.height || 210;

    const spaceAbove = triggerRect.top - MARGIN - GAP;
    const spaceBelow = window.innerHeight - triggerRect.bottom - MARGIN - GAP;

    let top: number;
    if (spaceAbove >= popHeight) {
      top = triggerRect.top - popHeight - GAP;
    } else if (spaceBelow >= popHeight || spaceBelow >= spaceAbove) {
      top = triggerRect.bottom + GAP;
    } else {
      top = triggerRect.top - popHeight - GAP;
    }
    top = Math.max(MARGIN, Math.min(top, window.innerHeight - popHeight - MARGIN));

    const idealLeft = align === 'right' ? triggerRect.right - popWidth : triggerRect.left;
    const left = Math.max(MARGIN, Math.min(idealLeft, window.innerWidth - popWidth - MARGIN));

    const roundedTop = Math.round(top);
    const roundedLeft = Math.round(left);

    if (supportsNativePopover) {
      popoverEl.style.top = `${roundedTop}px`;
      popoverEl.style.left = `${roundedLeft}px`;
    } else {
      setFallbackPos({ top: roundedTop, left: roundedLeft });
    }

    return true;
  }, [align]);

  const closePopover = useCallback(() => {
    clearCloseTimer();
    pinnedRef.current = false;
    if (supportsNativePopover) {
      const popoverEl = popoverRef.current;
      if (popoverEl && popoverEl.matches(':popover-open')) {
        popoverEl.hidePopover();
      }
      setOpen(false);
    } else {
      setOpen(false);
    }
  }, [clearCloseTimer]);

  const openPopover = useCallback(
    (pin = false) => {
      clearCloseTimer();
      if (pin) {
        pinnedRef.current = true;
      }
      if (supportsNativePopover) {
        const popoverEl = popoverRef.current;
        if (!popoverEl) return;
        if (!popoverEl.matches(':popover-open')) {
          popoverEl.showPopover();
        }
        updatePosition();
        setOpen(true);
      } else {
        setOpen(true);
      }
    },
    [clearCloseTimer, updatePosition]
  );

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    if (pinnedRef.current) return;
    closeTimerRef.current = window.setTimeout(() => {
      if (!pinnedRef.current) {
        closePopover();
      }
    }, 150);
  }, [clearCloseTimer, closePopover]);

  // Keep aria-expanded / open synchronized with native popover toggle event
  useEffect(() => {
    if (!supportsNativePopover) return;
    const popoverEl = popoverRef.current;
    if (!popoverEl) return;

    const handleToggle = (e: Event) => {
      const toggleEvt = e as ToggleEvent;
      const isOpen = toggleEvt.newState === 'open';
      setOpen(isOpen);
      if (isOpen) {
        updatePosition();
      } else {
        pinnedRef.current = false;
      }
    };

    popoverEl.addEventListener('toggle', handleToggle);
    return () => {
      popoverEl.removeEventListener('toggle', handleToggle);
    };
  }, [updatePosition]);

  // Fallback initial measurement for browsers without Popover API
  useLayoutEffect(() => {
    if (!supportsNativePopover && open) {
      updatePosition();
    }
  }, [open, updatePosition]);

  // Reposition on window resize or scrollable container scroll (capture phase)
  useEffect(() => {
    if (!open) return;

    const handleReposition = () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = window.requestAnimationFrame(() => {
        const visible = updatePosition();
        if (!visible) {
          closePopover();
        }
      });
    };

    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    if (!supportsNativePopover) {
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          closePopover();
        }
      };
      const onPointerDown = (e: PointerEvent) => {
        const target = e.target as Node;
        if (
          triggerRef.current &&
          !triggerRef.current.contains(target) &&
          popoverRef.current &&
          !popoverRef.current.contains(target)
        ) {
          closePopover();
        }
      };
      window.addEventListener('keydown', onKeyDown, true);
      document.addEventListener('pointerdown', onPointerDown);
      return () => {
        window.removeEventListener('resize', handleReposition);
        window.removeEventListener('scroll', handleReposition, true);
        window.removeEventListener('keydown', onKeyDown, true);
        document.removeEventListener('pointerdown', onPointerDown);
        if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
      };
    }

    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [open, updatePosition, closePopover]);

  useEffect(() => {
    return () => {
      clearCloseTimer();
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [clearCloseTimer]);

  if (!entry) return null;

  const popoverBody = (
    <div
      ref={popoverRef}
      id={popoverId}
      role="tooltip"
      {...(supportsNativePopover ? { popover: 'auto' as const } : {})}
      onMouseEnter={clearCloseTimer}
      onMouseLeave={scheduleClose}
      style={
        supportsNativePopover
          ? undefined
          : { position: 'fixed', top: `${fallbackPos.top}px`, left: `${fallbackPos.left}px` }
      }
      className="field-help-popover fixed z-[9999] w-72 max-w-[calc(100vw-1.5rem)] rounded-xl border border-[#e6ebf0] bg-white p-3.5 text-left shadow-xl ring-1 ring-black/5"
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <p className="text-xs font-bold text-[#0b3c5d]">{entry.title}</p>
        <button
          type="button"
          onClick={closePopover}
          aria-label="Cerrar ayuda"
          className="rounded p-0.5 text-[#64748b] hover:bg-slate-100 hover:text-slate-900"
        >
          <X className="size-3" />
        </button>
      </div>
      <div className="space-y-1.5 text-[11.5px] leading-relaxed text-[#3d4a43]">
        <p>
          <span className="font-semibold text-[#121d26]">Qué ingresar: </span>
          {entry.whatToEnter}
        </p>
        <p>
          <span className="font-semibold text-[#121d26]">Formato / rango: </span>
          {entry.formatRange}
        </p>
        <p className="rounded-lg bg-[#f4f7fa] p-2 text-[11px] text-[#0b3c5d]">
          <span className="font-semibold text-[#00694d]">Impacto financiero: </span>
          {entry.financialImpact}
        </p>
      </div>
    </div>
  );

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Ayuda sobre ${entry.title}`}
        aria-expanded={open}
        aria-controls={popoverId}
        onMouseEnter={() => {
          clearCloseTimer();
          if (!open) {
            openPopover(false);
          }
        }}
        onMouseLeave={scheduleClose}
        onClick={() => {
          if (open && pinnedRef.current) {
            closePopover();
          } else {
            openPopover(true);
          }
        }}
        className="inline-flex size-4 items-center justify-center rounded-full text-[#64748b] transition-colors hover:bg-[#e4effd] hover:text-[#00694d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f9d75]"
      >
        <HelpCircle className="size-3.5" aria-hidden="true" />
      </button>

      {supportsNativePopover ? popoverBody : open ? popoverBody : null}
    </div>
  );
}
