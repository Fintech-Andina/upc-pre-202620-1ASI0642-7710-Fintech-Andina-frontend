import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Download,
  Edit,
  Package,
  Plus,
  Power,
  Search,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { toast } from 'sonner';
import { productosApi } from '@/api/endpoints';
import { extractApiErrorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import type { Producto } from '@/types/api';
import { Badge, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, PageLoader } from '@/components/ui/EmptyState';
import { formatMoney } from '@/utils/formatters';
import { ProductoModal } from './ProductoModal';

function ProductThumbnail({ src, alt }: { src?: string | null; alt: string }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#edf4ff] text-[#0b3c5d]">
        <Tag className="size-5" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setHasError(true)}
      className="size-12 shrink-0 rounded-xl border border-[#e6ebf0] bg-white object-cover"
    />
  );
}

export function ProductosPage() {
  const { tienda } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);

  const { data: productos = [], isLoading } = useQuery({
    queryKey: ['productos'],
    queryFn: productosApi.listar,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      productosApi.cambiarEstado(id, activo),
    onSuccess: (updated) => {
      toast.success(
        `Producto "${updated.nombre}" ${updated.activo ? 'activado' : 'desactivado'}`
      );
      void queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
    onError: (err) => toast.error(extractApiErrorMessage(err)),
  });

  if (isLoading) {
    return <PageLoader label="Cargando catálogo de productos..." />;
  }

  const moneda = tienda?.monedaDefecto ?? 'PEN';
  const q = search.trim().toLowerCase();
  const filtered = productos.filter((p) => {
    const isActive = p.activo !== false;
    if (statusFilter === 'ACTIVE' && !isActive) return false;
    if (statusFilter === 'INACTIVE' && isActive) return false;
    if (!q) return true;
    return (
      p.nombre.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.marca ?? '').toLowerCase().includes(q) ||
      (p.proveedor ?? '').toLowerCase().includes(q)
    );
  });

  const handleExportCsv = () => {
    const header = ['SKU', 'Nombre', 'Marca', 'Proveedor', 'Unidad', 'Pc', 'PL', 'PagoUnico', 'Cuotas', 'Activo'];
    const rows = filtered.map((p) => [
      p.sku,
      `"${p.nombre.replace(/"/g, '""')}"`,
      p.marca ?? '',
      p.proveedor ?? '',
      p.unidadMedida ?? '',
      p.precioContado,
      p.precioLista,
      p.permitePagoUnico !== false ? 'SI' : 'NO',
      p.permiteCuotas ? 'SI' : 'NO',
      p.activo !== false ? 'ACTIVO' : 'INACTIVO',
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'catalogo-productos-defiabook.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#00694d]">
            Catálogo Comercial · Bienes y Servicios
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[#121d26]">
            Productos y servicios financiables
          </h1>
          <p className="mt-0.5 text-sm text-[#64748b]">
            Gestiona bienes y servicios habilitados para crédito con Precio al Contado (Pc), Precio
            de Lista (PL) y modalidades permitidas (sin control de stock).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleExportCsv}>
            <Download className="size-4" />
            Exportar catálogo
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus className="size-4" />
            Nuevo producto
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#64748b]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, SKU, marca o proveedor..."
              className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-2.5 pl-10 pr-4 text-sm focus:border-[#0f9d75] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { key: 'ALL', label: `Todos (${productos.length})` },
                { key: 'ACTIVE', label: 'Activos' },
                { key: 'INACTIVE', label: 'Inactivos' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setStatusFilter(opt.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === opt.key
                    ? 'bg-[#0b3c5d] text-white'
                    : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="size-6" />}
          title="No hay productos en esta vista"
          description="Registra un nuevo producto o servicio para habilitarlo en el Wizard de Nuevo Crédito."
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="size-4" />
              Registrar producto
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((prod) => {
            const isActive = prod.activo !== false;
            return (
              <Card key={prod.id} className="p-5 flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <ProductThumbnail src={prod.imagenUrl} alt={prod.nombre} />
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-[#64748b] truncate">
                          SKU: {prod.sku}
                          {prod.unidadMedida ? ` · ${prod.unidadMedida}` : ''}
                        </p>
                        <h2 className="font-bold text-[#121d26] leading-snug">{prod.nombre}</h2>
                      </div>
                    </div>
                    <Badge variant={isActive ? 'emerald' : 'slate'}>
                      {isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>

                  {(prod.marca || prod.proveedor) && (
                    <p className="text-xs text-[#64748b]">
                      {prod.marca && (
                        <span>
                          Marca: <strong className="text-[#121d26]">{prod.marca}</strong>
                        </span>
                      )}
                      {prod.marca && prod.proveedor && ' · '}
                      {prod.proveedor && (
                        <span>
                          Proveedor: <strong className="text-[#121d26]">{prod.proveedor}</strong>
                        </span>
                      )}
                    </p>
                  )}

                  {/* Pricing box (Pc & PL, NO stock) */}
                  <div className="rounded-xl bg-[#edf4ff]/80 p-3.5 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[11px] font-medium text-[#64748b]">Precio al Contado (Pc)</p>
                      <p className="text-lg font-bold text-[#121d26] tabular-nums">
                        {formatMoney(prod.precioContado, moneda)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-[#64748b]">Precio de Lista (PL)</p>
                      <p className="text-lg font-bold text-[#00694d] tabular-nums">
                        {formatMoney(prod.precioLista, moneda)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {prod.permitePagoUnico !== false && (
                      <Badge variant="navy">Pago Único a fin de mes</Badge>
                    )}
                    {prod.permiteCuotas && <Badge variant="emerald">Cuotas mensuales</Badge>}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#e6ebf0]">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setEditing(prod);
                      setModalOpen(true);
                    }}
                  >
                    <Edit className="size-3.5" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    loading={toggleMutation.isPending}
                    onClick={() => toggleMutation.mutate({ id: prod.id, activo: !isActive })}
                    title={isActive ? 'Desactivar' : 'Activar'}
                  >
                    <Power className="size-3.5" />
                    {isActive ? 'Pausar' : 'Activar'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Transparency Banner (Domain Adjustment #1) */}
      <Card className="p-4 bg-[#f0f6fa] border-[#dbe8f2]">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#0b3c5d]">
            <ShieldCheck className="size-5 text-[#00694d]" />
          </div>
          <div className="text-xs text-[#3d4a43]">
            <p className="font-bold text-[#0b3c5d]">Transparencia en Precios y Financiamiento</p>
            <p className="mt-0.5 leading-relaxed">
              Basado en buenas prácticas financieras y estándares de transparencia (referencia
              metodológica BCRP / SBS y Ley N.° 31143). Todos los bienes muestran Precio al Contado
              (Pc) y Precio de Lista (PL) para cálculo exacto de TCEA y TREA en el servidor.
            </p>
          </div>
        </div>
      </Card>

      <ProductoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
      />
    </div>
  );
}
