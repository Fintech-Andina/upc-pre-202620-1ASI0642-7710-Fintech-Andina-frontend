import { useEffect, useId, useRef, useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { FIELD_HELP } from './helpContent';

interface FieldHelpTooltipProps {
  helpKey: string;
  align?: 'left' | 'right';
}

export function FieldHelpTooltip({ helpKey, align = 'left' }: FieldHelpTooltipProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();
  const entry = FIELD_HELP[helpKey];

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  if (!entry) return null;

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={`Ayuda sobre ${entry.title}`}
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex size-4 items-center justify-center rounded-full text-[#64748b] transition-colors hover:bg-[#e4effd] hover:text-[#00694d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f9d75]"
      >
        <HelpCircle className="size-3.5" aria-hidden="true" />
      </button>

      {open && (
        <div
          id={popoverId}
          role="tooltip"
          className={`absolute bottom-full z-50 mb-2 w-72 rounded-xl border border-[#e6ebf0] bg-white p-3.5 text-left shadow-xl ring-1 ring-black/5 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="mb-1.5 flex items-start justify-between gap-2">
            <p className="text-xs font-bold text-[#0b3c5d]">{entry.title}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
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
      )}
    </div>
  );
}
