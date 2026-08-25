import React, { useState, useMemo } from 'react';
import { ActiveTable, KitchenOrder, PaymentReceipt, UserProfile } from '../types';
import { posAudio } from '../utils/audio';
import { NetworkSyncBadge } from './NetworkSyncBadge';
import {
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  Utensils,
  Users,
  Layers,
  Search,
  X,
  Clock,
  DollarSign,
} from 'lucide-react';

interface AdminViewerDashboardProps {
  tables: ActiveTable[];
  kitchenOrders: KitchenOrder[];
  receipts: PaymentReceipt[];
  waiterNames: Record<number, string>;
  currentUser?: UserProfile;
  onExitToGatekeeper: () => void;
  onOpenMesas: () => void;
  onOpenKitchen: () => void;
  onOpenSalesModal?: () => void;
  onOpenRoleSelector?: () => void;
}

export const AdminViewerDashboard: React.FC<AdminViewerDashboardProps> = ({
  tables,
  kitchenOrders,
  receipts,
  waiterNames,
  currentUser,
  onExitToGatekeeper,
}) => {
  const [activeTab, setActiveTab] = useState<'resumen' | 'mesas' | 'meseros' | 'productos'>('resumen');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTable, setSelectedTable] = useState<ActiveTable | null>(null);

  // Manual Refresh
  const handleManualRefresh = () => {
    posAudio.playClick();
  };

  // 1. Calculations
  const metrics = useMemo(() => {
    // Total Closed Sales
    const totalCobrado = receipts.reduce((sum, r) => sum + (r.total || 0), 0);
    const totalFacturas = receipts.length;
    const ticketPromedio = totalFacturas > 0 ? Math.round(totalCobrado / totalFacturas) : 0;

    // Active Tables
    const occupiedTables = tables.filter((t) => t.items && t.items.length > 0);
    const totalMesasOcupadas = occupiedTables.length;
    const totalMesasLibres = tables.length - totalMesasOcupadas;

    // Open amount in tables
    const totalEnMesas = occupiedTables.reduce((sum, t) => {
      return sum + t.items.reduce((acc, it) => acc + it.price * it.quantity, 0);
    }, 0);

    const proyeccionTotal = totalCobrado + totalEnMesas;

    // Payment methods summary
    const paymentMethods: Record<string, { total: number; count: number }> = {
      Efectivo: { total: 0, count: 0 },
      Nequi: { total: 0, count: 0 },
      Daviplata: { total: 0, count: 0 },
      Tarjeta: { total: 0, count: 0 },
      Transferencia: { total: 0, count: 0 },
    };

    receipts.forEach((r) => {
      const methodKey =
        r.paymentMethod === 'efectivo'
          ? 'Efectivo'
          : r.paymentMethod === 'nequi'
          ? 'Nequi'
          : r.paymentMethod === 'daviplata'
          ? 'Daviplata'
          : r.paymentMethod === 'tarjeta'
          ? 'Tarjeta'
          : 'Transferencia';

      if (!paymentMethods[methodKey]) {
        paymentMethods[methodKey] = { total: 0, count: 0 };
      }
      paymentMethods[methodKey].total += r.total || 0;
      paymentMethods[methodKey].count += 1;
    });

    // Kitchen status
    const pendingKitchen = kitchenOrders.filter((o) => o.status === 'pendiente').length;
    const preparingKitchen = kitchenOrders.filter((o) => o.status === 'preparando').length;
    const readyKitchen = kitchenOrders.filter((o) => o.status === 'listo').length;

    // Top selling items from receipts
    const itemsCount: Record<string, { name: string; quantity: number; revenue: number }> = {};
    receipts.forEach((r) => {
      r.items?.forEach((it) => {
        if (!itemsCount[it.name]) {
          itemsCount[it.name] = { name: it.name, quantity: 0, revenue: 0 };
        }
        itemsCount[it.name].quantity += it.quantity;
        itemsCount[it.name].revenue += it.price * it.quantity;
      });
    });

    const topItems = Object.values(itemsCount).sort((a, b) => b.quantity - a.quantity);

    return {
      totalCobrado,
      totalFacturas,
      ticketPromedio,
      totalMesasOcupadas,
      totalMesasLibres,
      totalEnMesas,
      proyeccionTotal,
      paymentMethods,
      pendingKitchen,
      preparingKitchen,
      readyKitchen,
      topItems,
    };
  }, [tables, receipts, kitchenOrders]);

  // Active Tables list sorted
  const occupiedTablesList = useMemo(() => {
    return tables
      .filter((t) => t.items && t.items.length > 0)
      .filter((t) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          t.label.toLowerCase().includes(q) ||
          (t.waiterName && t.waiterName.toLowerCase().includes(q)) ||
          (t.customerName && t.customerName.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        const totalA = a.items.reduce((s, it) => s + it.price * it.quantity, 0);
        const totalB = b.items.reduce((s, it) => s + it.price * it.quantity, 0);
        return totalB - totalA;
      });
  }, [tables, searchQuery]);

  // Waiter stats
  const waiterStats = useMemo(() => {
    const map: Record<
      string,
      { name: string; activeCount: number; activeTotal: number; closedCount: number; closedTotal: number }
    > = {};

    // Initialize with configured waiters
    for (let i = 1; i <= 20; i++) {
      const name = waiterNames[i] || `Mesero ${i}`;
      map[name] = { name, activeCount: 0, activeTotal: 0, closedCount: 0, closedTotal: 0 };
    }

    // Add active tables
    tables.forEach((t) => {
      if (t.items && t.items.length > 0) {
        const wName = t.waiterName || 'Mesero 1';
        if (!map[wName]) {
          map[wName] = { name: wName, activeCount: 0, activeTotal: 0, closedCount: 0, closedTotal: 0 };
        }
        const total = t.items.reduce((s, it) => s + it.price * it.quantity, 0);
        map[wName].activeCount += 1;
        map[wName].activeTotal += total;
      }
    });

    // Add closed receipts
    receipts.forEach((r) => {
      const wName = r.waiterName || 'Mesero 1';
      if (!map[wName]) {
        map[wName] = { name: wName, activeCount: 0, activeTotal: 0, closedCount: 0, closedTotal: 0 };
      }
      map[wName].closedCount += 1;
      map[wName].closedTotal += r.total || 0;
    });

    return Object.values(map)
      .filter((w) => w.activeCount > 0 || w.closedCount > 0)
      .sort((a, b) => b.activeTotal + b.closedTotal - (a.activeTotal + a.closedTotal));
  }, [tables, receipts, waiterNames]);

  const formatMoney = (amount: number) => {
    return '$' + Math.round(amount).toLocaleString('es-CO');
  };

  return (
    <div
      id="pantalla-visor-gerencial"
      className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none"
    >
      {/* 1. Header Simple y Plano */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              posAudio.playClick();
              onExitToGatekeeper();
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white border border-slate-700 flex items-center gap-1.5 text-xs font-semibold transition"
          >
            <ArrowLeft size={16} />
            <span>Salir</span>
          </button>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white leading-tight">
              Visor de Ventas y Mesas
            </h1>
            <p className="text-[11px] text-slate-400">Restaurante Pollos & Sabor</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NetworkSyncBadge currentUser={currentUser} compact />
          <button
            onClick={handleManualRefresh}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition"
            title="Refrescar datos"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </header>

      {/* 2. Métricas Clave (Tarjetas Planas en Grid 2x2 / 4x1) */}
      <div className="p-3 sm:p-4 max-w-5xl mx-auto w-full space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Cobrado */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <div className="text-[11px] font-semibold text-slate-400 uppercase">Cobrado Hoy</div>
            <div className="text-lg sm:text-xl font-bold text-emerald-400 mt-0.5">
              {formatMoney(metrics.totalCobrado)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {metrics.totalFacturas} {metrics.totalFacturas === 1 ? 'cuenta' : 'cuentas'}
            </div>
          </div>

          {/* En Mesas */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <div className="text-[11px] font-semibold text-slate-400 uppercase">En Mesas</div>
            <div className="text-lg sm:text-xl font-bold text-slate-100 mt-0.5">
              {formatMoney(metrics.totalEnMesas)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {metrics.totalMesasOcupadas} abiertas
            </div>
          </div>

          {/* Proyección Total */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <div className="text-[11px] font-semibold text-slate-400 uppercase">Total Estimado</div>
            <div className="text-lg sm:text-xl font-bold text-slate-100 mt-0.5">
              {formatMoney(metrics.proyeccionTotal)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Cobrado + Mesas
            </div>
          </div>

          {/* Ticket Promedio */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <div className="text-[11px] font-semibold text-slate-400 uppercase">Ticket Promedio</div>
            <div className="text-lg sm:text-xl font-bold text-slate-100 mt-0.5">
              {formatMoney(metrics.ticketPromedio)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Por mesa cerrada
            </div>
          </div>
        </div>

        {/* Resumen Operativo Rápido */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
            <span className="text-slate-400">Ocupación:</span>
            <span className="font-semibold text-slate-200">
              {metrics.totalMesasOcupadas} / 90 mesas ({Math.round((metrics.totalMesasOcupadas / 90) * 100)}%)
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
            <span className="text-slate-400">Cocina KDS:</span>
            <span className="font-semibold text-slate-200">
              {metrics.pendingKitchen} pend • {metrics.preparingKitchen} prep • {metrics.readyKitchen} listos
            </span>
          </div>
        </div>

        {/* 3. Pestañas Planas */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('resumen')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'resumen'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp size={14} />
            <span>Medios de Pago</span>
          </button>

          <button
            onClick={() => setActiveTab('mesas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'mesas'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Utensils size={14} />
            <span>Mesas Abiertas ({metrics.totalMesasOcupadas})</span>
          </button>

          <button
            onClick={() => setActiveTab('meseros')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'meseros'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users size={14} />
            <span>Por Mesero</span>
          </button>

          <button
            onClick={() => setActiveTab('productos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'productos'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers size={14} />
            <span>Productos Vendidos</span>
          </button>
        </div>

        {/* 4. Contenido de las Pestañas */}
        {/* TAB 1: RESUMEN DE MEDIOS DE PAGO */}
        {activeTab === 'resumen' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Desglose de Ingresos Cobrados
            </h3>
            <div className="divide-y divide-slate-800">
              {Object.entries(metrics.paymentMethods).map(([method, data]) => {
                const info = data as { total: number; count: number };
                return (
                  <div key={method} className="py-2.5 flex items-center justify-between text-sm first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-200">{method}</span>
                      <span className="text-xs text-slate-500">({info.count} pagos)</span>
                    </div>
                    <span className="font-bold text-slate-100 font-mono">{formatMoney(info.total)}</span>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm font-bold">
              <span className="text-slate-300">Total Facturado</span>
              <span className="text-emerald-400 font-mono text-base">{formatMoney(metrics.totalCobrado)}</span>
            </div>
          </div>
        )}

        {/* TAB 2: MESAS ABIERTAS */}
        {activeTab === 'mesas' && (
          <div className="space-y-2">
            {/* Buscador */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por mesa o mesero..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
              />
            </div>

            {occupiedTablesList.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs">
                No hay mesas abiertas en este momento.
              </div>
            ) : (
              occupiedTablesList.map((t) => {
                const total = t.items.reduce((s, it) => s + it.price * it.quantity, 0);
                const itemsCount = t.items.reduce((s, it) => s + it.quantity, 0);
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTable(t)}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between cursor-pointer transition"
                  >
                    <div>
                      <div className="font-bold text-sm text-white">{t.label}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {t.waiterName || 'Mesero'} • {itemsCount} {itemsCount === 1 ? 'plato' : 'platos'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-100 font-mono">{formatMoney(total)}</div>
                      <span className="text-[10px] text-slate-500">Tocar para ver</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: POR MESERO */}
        {activeTab === 'meseros' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Rendimiento por Mesero (Activo y Cobrado)
            </h3>
            {waiterStats.length === 0 ? (
              <div className="text-slate-500 text-xs py-4 text-center">
                No hay actividad registrada para meseros hoy.
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {waiterStats.map((w) => (
                  <div key={w.name} className="py-2.5 flex items-center justify-between text-xs sm:text-sm first:pt-0 last:pb-0">
                    <div>
                      <div className="font-bold text-slate-200">{w.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {w.activeCount} mesas activas • {w.closedCount} cobradas
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-100 font-mono">
                        {formatMoney(w.activeTotal + w.closedTotal)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        ({formatMoney(w.activeTotal)} en mesas)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PRODUCTOS */}
        {activeTab === 'productos' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Platos más vendidos hoy
            </h3>
            {metrics.topItems.length === 0 ? (
              <div className="text-slate-500 text-xs py-4 text-center">
                Aún no hay platos vendidos en las facturas cerradas.
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {metrics.topItems.map((it) => (
                  <div key={it.name} className="py-2 flex items-center justify-between text-xs sm:text-sm first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="w-6 text-center font-bold text-slate-400">{it.quantity}x</span>
                      <span className="text-slate-200">{it.name}</span>
                    </div>
                    <span className="font-bold text-slate-100 font-mono">{formatMoney(it.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DETALLE DE MESA ACTIVA */}
      {selectedTable && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
          onClick={() => setSelectedTable(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-base text-white">{selectedTable.label}</h3>
                <p className="text-xs text-slate-400">Atiende: {selectedTable.waiterName || 'Mesero'}</p>
              </div>
              <button
                onClick={() => setSelectedTable(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-800">
              {selectedTable.items.map((it, idx) => (
                <div key={idx} className="py-2 flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400">{it.quantity}x</span>
                    <span className="text-slate-200">{it.name}</span>
                  </div>
                  <span className="font-bold text-slate-100 font-mono">
                    {formatMoney(it.price * it.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm font-bold">
              <span className="text-slate-300">Total Mesa</span>
              <span className="text-emerald-400 font-mono text-base">
                {formatMoney(selectedTable.items.reduce((s, it) => s + it.price * it.quantity, 0))}
              </span>
            </div>

            <button
              onClick={() => setSelectedTable(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminViewerDashboard;
