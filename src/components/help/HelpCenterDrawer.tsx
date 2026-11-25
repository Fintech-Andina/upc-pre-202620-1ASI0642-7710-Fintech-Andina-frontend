import { useEffect, useState } from 'react';
import { BookOpen, Calculator, HelpCircle, Scale, Search, X } from 'lucide-react';
import { FINANCIAL_GLOSSARY, FIXED_CONVENTIONS, MODULE_GUIDES } from './helpContent';

interface HelpCenterDrawerProps {
  open: boolean;
  onClose: () => void;
}

type HelpTab = 'modules' | 'glossary' | 'conventions';

export function HelpCenterDrawer({ open, onClose }: HelpCenterDrawerProps) {
  const [tab, setTab] = useState<HelpTab>('modules');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  const q = query.trim().toLowerCase();
  const filteredModules = MODULE_GUIDES.filter(
    (m) => !q || m.module.toLowerCase().includes(q) || m.summary.toLowerCase().includes(q)
  );
  const filteredGlossary = FINANCIAL_GLOSSARY.filter(
    (g) => !q || g.term.toLowerCase().includes(q) || g.description.toLowerCase().includes(q)
  );
  const filteredConventions = FIXED_CONVENTIONS.filter(
    (c) => !q || c.label.toLowerCase().includes(q) || c.value.toLowerCase().includes(q)
  );

  return (
    <div className="no-print fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        aria-label="Centro de Ayuda y Asistencia Técnica"
        className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#e6ebf0] bg-gradient-to-r from-[#0b3c5d] to-[#00694d] px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-white/15">
              <HelpCircle className="size-5 text-[#65dbaf]" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Centro de Ayuda y Asistencia</h2>
              <p className="text-xs text-white/80">
                Guía operativa, glosario financiero y convenciones de Defia Book
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar centro de ayuda"
            className="rounded-lg bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Search & Tabs */}
        <div className="border-b border-[#e6ebf0] bg-[#f4f7fa] px-6 py-3.5 space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748b]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar término, fórmula o módulo..."
              className="w-full rounded-xl border border-[#e6ebf0] bg-white py-2 pl-9 pr-3 text-sm text-[#121d26] placeholder:text-[#64748b] focus:border-[#0f9d75] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-white p-1 border border-[#e6ebf0]">
            <button
              type="button"
              onClick={() => setTab('modules')}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors ${
                tab === 'modules' ? 'bg-[#00694d] text-white' : 'text-[#64748b] hover:text-[#121d26]'
              }`}
            >
              <BookOpen className="size-3.5" />
              Módulos
            </button>
            <button
              type="button"
              onClick={() => setTab('glossary')}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors ${
                tab === 'glossary' ? 'bg-[#00694d] text-white' : 'text-[#64748b] hover:text-[#121d26]'
              }`}
            >
              <Calculator className="size-3.5" />
              Glosario
            </button>
            <button
              type="button"
              onClick={() => setTab('conventions')}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors ${
                tab === 'conventions'
                  ? 'bg-[#00694d] text-white'
                  : 'text-[#64748b] hover:text-[#121d26]'
              }`}
            >
              <Scale className="size-3.5" />
              Convenciones
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {tab === 'modules' && (
            <>
              <div className="rounded-xl border border-[#a7f3d0] bg-[#ecfdf5] p-3.5 text-xs text-[#00694d]">
                <p className="font-semibold">Tip de Ayuda Contextual en Cada Campo</p>
                <p className="mt-1 text-[#3d4a43]">
                  En todos los formularios y modales verás el ícono <strong>?</strong> junto a cada etiqueta.
                  Pasa el cursor o haz clic para conocer el formato válido y su impacto exacto en el motor financiero.
                </p>
              </div>
              {filteredModules.map((item) => (
                <div
                  key={item.module}
                  className="rounded-xl border border-[#e6ebf0] bg-white p-4 shadow-xs"
                >
                  <h3 className="text-sm font-bold text-[#0b3c5d]">{item.module}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#3d4a43]">{item.summary}</p>
                </div>
              ))}
            </>
          )}

          {tab === 'glossary' &&
            filteredGlossary.map((item) => (
              <div
                key={item.term}
                className="rounded-xl border border-[#e6ebf0] bg-white p-4 shadow-xs"
              >
                <h3 className="text-sm font-bold text-[#0b3c5d]">{item.term}</h3>
                {item.formula && (
                  <p className="mt-1.5 rounded-lg bg-[#edf4ff] px-3 py-1.5 font-mono text-[11.5px] font-semibold text-[#00694d]">
                    {item.formula}
                  </p>
                )}
                <p className="mt-2 text-xs leading-relaxed text-[#3d4a43]">{item.description}</p>
              </div>
            ))}

          {tab === 'conventions' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#e6ebf0] bg-white overflow-hidden">
                <div className="border-b border-[#e6ebf0] bg-[#f4f7fa] px-4 py-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                    Parámetros Fijos del Motor Financiero
                  </h3>
                </div>
                <dl className="divide-y divide-[#e6ebf0]">
                  {filteredConventions.map((conv) => (
                    <div key={conv.label} className="flex items-center justify-between gap-3 px-4 py-3 text-xs">
                      <dt className="font-medium text-[#3d4a43]">{conv.label}</dt>
                      <dd className="font-bold text-[#0b3c5d] text-right">{conv.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="rounded-xl border border-[#e6ebf0] bg-[#edf4ff] p-4 text-xs text-[#3d4a43]">
                <p className="font-bold text-[#0b3c5d]">Marco Metodológico y Transparencia</p>
                <p className="mt-1 leading-relaxed">
                  Basado en buenas prácticas financieras y estándares de transparencia (referencia
                  metodológica BCRP / SBS y Ley N.° 31143). Todos los cálculos financieros son ejecutados
                  exclusivamente en el servidor de Fintech Andina S.A.C.
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
