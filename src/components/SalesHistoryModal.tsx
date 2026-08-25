import React, { useState, useMemo, useEffect } from 'react';
import { ActiveTable, PaymentReceipt } from '../types';
import { formatCOP } from '../data/menu';
import { CajaModal } from './CajaModal';
import { posAudio } from '../utils/audio';
import { DEFAULT_WAITER_NAMES } from '../utils/storage';
import {
  X,
  Receipt,
  DollarSign,
  Download,
  Trash2,
  Calendar,
  FileText,
  CreditCard,
  Printer,
  Sparkles,
  ArrowRight,
  Search,
  Layers,
  Users,
  Award,
  TrendingUp,
  UserCog,
  Save,
  RotateCcw,
  Check,
  Edit3,
} from 'lucide-react';

interface SalesHistoryModalProps {
  receipts: PaymentReceipt[];
  tables?: ActiveTable[];
  waiterNames?: Record<number, string>;
  onUpdateWaiterNames?: (names: Record<number, string>) => void;
  onResetWaiterNames?: () => void;
  onClose: () => void;
  onClearReceipts: () => void;
  onCompletePayment?: (receipt: PaymentReceipt) => void;
  onSelectTable?: (tableId: string) => void;
  onExitToGatekeeper?: () => void;
}

export const SalesHistoryModal: React.FC<SalesHistoryModalProps> = ({
  receipts,
  tables = [],
  waiterNames = DEFAULT_WAITER_NAMES,
  onUpdateWaiterNames,
  onResetWaiterNames,
  onClose,
  onClearReceipts,
  onCompletePayment,
  onSelectTable,
  onExitToGatekeeper,
}) => {
  const [activeTab, setActiveTab] = useState<'cobro' | 'meseros' | 'cierre' | 'ajustes'>('cobro');
  const [tableToPay, setTableToPay] = useState<ActiveTable | null>(null);
  const [searchTable, setSearchTable] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Local state for editing 20 waiter names
  const [localNames, setLocalNames] = useState<Record<number, string>>(() => ({
    ...DEFAULT_WAITER_NAMES,
    ...waiterNames,
  }));

  useEffect(() => {
    setLocalNames((prev) => ({
      ...DEFAULT_WAITER_NAMES,
      ...waiterNames,
      ...prev,
    }));
  }, [waiterNames]);

  const activeTablesToPay = tables.filter((t) => t.items.length > 0);
  const tablesInCuenta = activeTablesToPay.filter((t) => t.status === 'cuenta');

  const filteredTablesToPay = activeTablesToPay.filter((t) => {
    if (!searchTable) return true;
    return (
      t.label.toLowerCase().includes(searchTable.toLowerCase()) ||
      (t.customerName && t.customerName.toLowerCase().includes(searchTable.toLowerCase()))
    );
  });

  const totalSales = receipts.reduce((sum, r) => sum + r.total, 0);
  const totalTips = receipts.reduce((sum, r) => sum + r.tip, 0);
  const totalDiscounts = receipts.reduce((sum, r) => sum + r.discount, 0);

  // Group by payment method
  const salesByMethod = receipts.reduce((acc, r) => {
    acc[r.paymentMethod] = (acc[r.paymentMethod] || 0) + r.total;
    return acc;
  }, {} as Record<string, number>);

  // Sales per Waiter (Mesero 1 to 20 with real custom names)
  const waiterSalesStats = useMemo(() => {
    const statsMap: Record<number, { slot: number; waiterName: string; count: number; total: number; tips: number }> = {};
    
    // Seed for all 20 waiters
    for (let i = 1; i <= 20; i++) {
      const realName = waiterNames[i] || `Mesero ${i}`;
      statsMap[i] = { slot: i, waiterName: realName, count: 0, total: 0, tips: 0 };
    }

    receipts.forEach((r) => {
      const w = r.waiterName || 'Mesero 1';
      // Match slot by comparing realName or default string "Mesero X"
      let matchedSlot: number | null = null;
      for (let i = 1; i <= 20; i++) {
        const slotRealName = waiterNames[i] || `Mesero ${i}`;
        if (w === slotRealName || w === `Mesero ${i}` || w === `#${i}`) {
          matchedSlot = i;
          break;
        }
      }

      if (matchedSlot && statsMap[matchedSlot]) {
        statsMap[matchedSlot].count += 1;
        statsMap[matchedSlot].total += r.total;
        statsMap[matchedSlot].tips += r.tip;
      } else {
        const fallbackKey = 999;
        if (!statsMap[fallbackKey]) {
          statsMap[fallbackKey] = { slot: fallbackKey, waiterName: w, count: 0, total: 0, tips: 0 };
        }
        statsMap[fallbackKey].count += 1;
        statsMap[fallbackKey].total += r.total;
        statsMap[fallbackKey].tips += r.tip;
      }
    });

    return Object.values(statsMap);
  }, [receipts, waiterNames]);

  const activeWaitersWithSales = waiterSalesStats.filter((w) => w.count > 0);

  // Single Slot Name Change
  const handleSlotNameChange = (slot: number, value: string) => {
    setLocalNames((prev) => ({
      ...prev,
      [slot]: value,
    }));
  };

  // Save All Waiter Names
  const handleSaveAllNames = () => {
    posAudio.playSuccess();
    const cleanedNames: Record<number, string> = {};
    for (let i = 1; i <= 20; i++) {
      cleanedNames[i] = (localNames[i] || '').trim() || `Mesero ${i}`;
    }
    setLocalNames(cleanedNames);
    if (onUpdateWaiterNames) {
      onUpdateWaiterNames(cleanedNames);
    }
    setSaveSuccessMsg('¡Nombres de meseros guardados correctamente!');
    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 3000);
  };

  // Reset to Defaults
  const handleResetToDefaults = () => {
    if (window.confirm('¿Desea restablecer los nombres de los 20 meseros a los valores por defecto?')) {
      posAudio.playClick();
      setLocalNames(DEFAULT_WAITER_NAMES);
      if (onResetWaiterNames) {
        onResetWaiterNames();
      } else if (onUpdateWaiterNames) {
        onUpdateWaiterNames(DEFAULT_WAITER_NAMES);
      }
      setSaveSuccessMsg('Nombres restablecidos a valores por defecto.');
      setTimeout(() => {
        setSaveSuccessMsg(null);
      }, 3000);
    }
  };

  const exportCSV = () => {
    const headers = 'ID,Orden,Mesa,Mesero,Metodo,Subtotal,Descuento,Propina,Total,Fecha\n';
    const rows = receipts
      .map((r) =>
        [
          r.id,
          r.orderNumber,
          `"${r.tableLabel}"`,
          `"${r.waiterName}"`,
          r.paymentMethod,
          r.subtotal,
          r.discount,
          r.tip,
          r.total,
          `"${new Date(r.closedAt).toLocaleString('es-CO')}"`,
        ].join(',')
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Ventas_Pollos_y_Sabor_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-3 select-none">
      <div className="bg-[#1e293b] text-white rounded-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh] border border-slate-700">
        {/* Header */}
        <div className="bg-[#0b1120] p-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
              <CreditCard size={18} />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight">
                MÓDULO DE CAJA & ARQUEO
              </h2>
              <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.2 rounded-full text-[10px] font-black">
                ADMIN
              </span>
            </div>
          </div>

          <button
            id="btn-caja-close-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
            title="Cerrar modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Compact 4-Grid Tab Bar [ 💵 Cobros ] [ 👥 Meseros ] [ 📊 Cierre ] [ ⚙️ Ajustes ] */}
        <div className="grid grid-cols-4 gap-1.5 p-2 bg-[#0b1120] border-b border-slate-800 shrink-0">
          <button
            id="tab-caja-cobro"
            type="button"
            onClick={() => {
              posAudio.playClick();
              setActiveTab('cobro');
            }}
            className={`py-2.5 px-1.5 rounded-xl font-black text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-1.5 border min-h-[44px] active:scale-95 ${
              activeTab === 'cobro'
                ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                : 'bg-[#1e293b] border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <DollarSign size={16} className="shrink-0 text-emerald-400" />
            <span className="truncate">Cobros</span>
            {activeTablesToPay.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-800 text-white">
                {activeTablesToPay.length}
              </span>
            )}
          </button>

          <button
            id="tab-caja-meseros"
            type="button"
            onClick={() => {
              posAudio.playClick();
              setActiveTab('meseros');
            }}
            className={`py-2.5 px-1.5 rounded-xl font-black text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-1.5 border min-h-[44px] active:scale-95 ${
              activeTab === 'meseros'
                ? 'bg-orange-950 border-orange-500 text-orange-300'
                : 'bg-[#1e293b] border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users size={16} className="shrink-0 text-orange-400" />
            <span className="truncate">Meseros</span>
            {activeWaitersWithSales.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-orange-900 text-orange-200">
                {activeWaitersWithSales.length}
              </span>
            )}
          </button>

          <button
            id="tab-caja-cierre"
            type="button"
            onClick={() => {
              posAudio.playClick();
              setActiveTab('cierre');
            }}
            className={`py-2.5 px-1.5 rounded-xl font-black text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-1.5 border min-h-[44px] active:scale-95 ${
              activeTab === 'cierre'
                ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                : 'bg-[#1e293b] border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Receipt size={16} className="shrink-0 text-cyan-400" />
            <span className="truncate">Cierre</span>
            {receipts.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-cyan-900 text-cyan-200">
                {receipts.length}
              </span>
            )}
          </button>

          <button
            id="tab-caja-ajustes"
            type="button"
            onClick={() => {
              posAudio.playClick();
              setActiveTab('ajustes');
            }}
            className={`py-2.5 px-1.5 rounded-xl font-black text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-1.5 border min-h-[44px] active:scale-95 ${
              activeTab === 'ajustes'
                ? 'bg-amber-950 border-amber-500 text-amber-300'
                : 'bg-[#1e293b] border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <UserCog size={16} className="shrink-0 text-amber-400" />
            <span className="truncate">Ajustes</span>
          </button>
        </div>

        {/* Content Container (Independent internal scroll) */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-4 text-xs bg-[#0f172a]">
          {/* TAB 1: COBRO DE MESAS EN CAJA */}
          {activeTab === 'cobro' && (
            <div className="space-y-3">
              {/* Search & Info Banner */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar mesa o cliente con ticket..."
                    value={searchTable}
                    onChange={(e) => setSearchTable(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-[#1e293b] border border-slate-700 text-white rounded-xl text-xs focus:outline-hidden focus:border-emerald-500 font-bold"
                  />
                </div>

                <div className="text-xs text-slate-300 font-bold">
                  {tablesInCuenta.length > 0 && (
                    <span className="text-cyan-300 font-black bg-cyan-950 px-2 py-1 rounded-lg border border-cyan-700 mr-2 inline-flex items-center gap-1">
                      <Receipt size={12} className="inline mr-1" />
                      {tablesInCuenta.length} con ticket en caja
                    </span>
                  )}
                  Pendientes:{' '}
                  <span className="text-emerald-400 font-black text-sm">
                    {formatCOP(
                      activeTablesToPay.reduce(
                        (sum, t) =>
                          sum + t.items.reduce((s, it) => s + it.price * it.quantity, 0),
                        0
                      )
                    )}
                  </span>
                </div>
              </div>

              {/* Grid of Tables to Pay */}
              {filteredTablesToPay.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-[#1e293b] rounded-2xl border border-slate-700">
                  <DollarSign size={36} className="mx-auto mb-2 opacity-30 text-emerald-400" />
                  <p className="font-bold text-sm text-slate-200">No hay cuentas pendientes por cobrar</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Las mesas con pedidos activos o pre-cuentas impresas aparecerán aquí.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredTablesToPay.map((tbl) => {
                    const tableTotal = tbl.items.reduce((s, it) => s + it.price * it.quantity, 0);
                    const isInCuenta = tbl.status === 'cuenta';

                    return (
                      <div
                        key={tbl.id}
                        className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 shadow-md ${
                          isInCuenta
                            ? 'bg-cyan-950/40 border-cyan-500 ring-2 ring-cyan-500/20'
                            : 'bg-[#1e293b] border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-sm text-white">{tbl.label}</span>
                              {tbl.orderNumber && (
                                <span className="text-[10px] font-mono font-bold bg-[#0b1120] px-1.5 py-0.5 rounded text-slate-300 border border-slate-700">
                                  #{tbl.orderNumber}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-300 font-bold mt-0.5">
                              Mesero: <span className="text-orange-400 font-black">{tbl.waiterName || 'Mesero 1'}</span>
                              {tbl.customerName && (
                                <span className="block text-slate-300 truncate">Cliente: {tbl.customerName}</span>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-black text-sm text-emerald-400">
                              {formatCOP(tableTotal)}
                            </div>
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                isInCuenta
                                  ? 'bg-cyan-500 text-slate-950'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {isInCuenta ? 'Ticket Entregado' : 'Consumiendo'}
                            </span>
                          </div>
                        </div>

                        {/* Summary of items */}
                        <div className="space-y-1 bg-[#0b1120] p-2 rounded-xl text-[11px] max-h-24 overflow-y-auto">
                          {tbl.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-slate-300 font-medium">
                              <span className="truncate pr-2">
                                {it.quantity}x {it.name}
                              </span>
                              <span className="font-mono text-slate-400">
                                {formatCOP(it.price * it.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => onSelectTable?.(tbl.id)}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs transition cursor-pointer min-h-[38px]"
                          >
                            Ver Mesa
                          </button>
                          <button
                            type="button"
                            onClick={() => setTableToPay(tbl)}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer active:scale-98 min-h-[38px]"
                          >
                            <CreditCard size={14} />
                            Cobrar en Caja
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VENTAS POR MESERO */}
          {activeTab === 'meseros' && (
            <div className="space-y-3">
              <div className="bg-[#1e293b] p-3.5 rounded-2xl border border-slate-700 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center border border-orange-500/30 shrink-0">
                    <Award size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-xs sm:text-sm text-white uppercase tracking-tight">
                      DESGLOSE DE VENTAS POR MESERO
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Facturación acumulada y propinas por cada mesero asignado.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Total Acumulado
                    </span>
                    <span className="text-base sm:text-lg font-black text-emerald-400">
                      {formatCOP(totalSales)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid of Waiter Performance Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {waiterSalesStats.map((w) => {
                  const hasSales = w.count > 0;
                  return (
                    <div
                      key={w.slot}
                      className={`p-2.5 rounded-2xl border transition flex flex-col justify-between ${
                        hasSales
                          ? 'bg-[#1e293b] border-orange-500/60 ring-1 ring-orange-500/30'
                          : 'bg-[#1e293b]/60 border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                            hasSales ? 'bg-orange-600 text-white shadow-xs' : 'bg-slate-800 text-slate-400'
                          }`}>
                            #{w.slot}
                          </div>
                          <span className="font-extrabold text-xs text-white truncate" title={w.waiterName}>
                            {w.waiterName}
                          </span>
                        </div>

                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ml-1 ${
                          hasSales
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-slate-800 text-slate-500'
                        }`}>
                          {w.count} {w.count === 1 ? 'ord.' : 'ords.'}
                        </span>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-1">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[10px] text-slate-400 font-bold">Facturado:</span>
                          <span className="font-black text-xs sm:text-sm text-emerald-400">
                            {formatCOP(w.total)}
                          </span>
                        </div>
                        {w.tips > 0 && (
                          <div className="flex justify-between items-baseline">
                            <span className="text-[10px] text-blue-400 font-bold">Propinas:</span>
                            <span className="font-bold text-xs text-blue-400">
                              {formatCOP(w.tips)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CIERRE & ARQUEO DIARIO */}
          {activeTab === 'cierre' && (
            <div className="space-y-3">
              {/* Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="bg-[#1e293b] p-3 rounded-2xl border border-slate-700">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    Ventas Totales Recaudadas
                  </div>
                  <div className="text-xl font-black text-emerald-400 mt-0.5">
                    {formatCOP(totalSales)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {receipts.length} cuentas cobradas
                  </div>
                </div>

                <div className="bg-[#1e293b] p-3 rounded-2xl border border-slate-700">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    Propinas Recaudadas
                  </div>
                  <div className="text-xl font-black text-blue-400 mt-0.5">
                    {formatCOP(totalTips)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Personal de servicio</div>
                </div>

                <div className="bg-[#1e293b] p-3 rounded-2xl border border-slate-700">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    Descuentos Aplicados
                  </div>
                  <div className="text-xl font-black text-red-400 mt-0.5">
                    {formatCOP(totalDiscounts)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Promociones del día</div>
                </div>
              </div>

              {/* Breakdown by Payment Method */}
              <div className="bg-[#1e293b] p-3 rounded-2xl border border-slate-700">
                <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-2">
                  Desglose de Arqueo por Método de Pago
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { key: 'efectivo', label: 'Efectivo' },
                    { key: 'nequi', label: 'Nequi' },
                    { key: 'daviplata', label: 'Daviplata' },
                    { key: 'tarjeta', label: 'Datáfono' },
                    { key: 'transferencia', label: 'Transferencia' },
                  ].map(({ key, label }) => (
                    <div key={key} className="bg-[#0b1120] p-2 rounded-xl border border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                        {label}
                      </div>
                      <div className="font-black text-xs sm:text-sm text-slate-100 mt-0.5">
                        {formatCOP(salesByMethod[key] || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Receipts Table */}
              <div>
                <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                  <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                    Historial de Recibos ({receipts.length})
                  </span>
                  <div className="flex items-center gap-2">
                    {receipts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          posAudio.playClick();
                          setShowResetConfirm(true);
                        }}
                        className="px-2.5 py-1 bg-red-950 hover:bg-red-900 text-red-300 rounded-lg font-bold text-[11px] flex items-center gap-1 border border-red-800 cursor-pointer active:scale-95 transition"
                      >
                        <Trash2 size={13} /> Reiniciar Caja
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={exportCSV}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-[11px] flex items-center gap-1 border border-slate-700 cursor-pointer"
                    >
                      <Download size={13} /> Exportar CSV
                    </button>
                  </div>
                </div>

                {receipts.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 bg-[#1e293b] rounded-2xl border border-slate-700">
                    No hay ventas registradas aún el día de hoy.
                  </div>
                ) : (
                  <div className="bg-[#1e293b] rounded-2xl border border-slate-700 overflow-hidden divide-y divide-slate-800 max-h-48 overflow-y-auto">
                    {receipts.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-2 flex items-center justify-between hover:bg-slate-800 transition"
                      >
                        <div>
                          <div className="font-bold text-slate-100 flex items-center gap-2">
                            <span>{rec.tableLabel}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              (#{rec.orderNumber})
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[9px] uppercase font-bold text-slate-300">
                              {rec.paymentMethod}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {new Date(rec.closedAt).toLocaleTimeString('es-CO')} •{' '}
                            {rec.items.reduce((s, it) => s + it.quantity, 0)} items •{' '}
                            <span className="text-orange-400 font-bold">{rec.waiterName}</span>
                          </div>
                        </div>

                        <div className="text-right font-black text-xs sm:text-sm text-emerald-400">
                          {formatCOP(rec.total)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: AJUSTES / NOMBRES DE MESEROS */}
          {activeTab === 'ajustes' && (
            <div className="space-y-4">
              {/* Waiter Names Configuration */}
              <div className="bg-[#1e293b] p-3.5 rounded-2xl border border-slate-700 space-y-3">
                <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-800 flex-wrap">
                  <div>
                    <h3 className="font-black text-sm text-white tracking-tight flex items-center gap-1.5">
                      <span>👥 Nombres de Meseros (1 al 20)</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Asigna nombres reales al personal de servicio (Mesero 1 a 20).
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {saveSuccessMsg && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950 px-2 py-1 rounded-md border border-emerald-800">
                        <Check size={13} className="text-emerald-400" />
                        {saveSuccessMsg}
                      </span>
                    )}

                    <button
                      id="btn-restablecer-meseros"
                      type="button"
                      onClick={handleResetToDefaults}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs flex items-center gap-1 border border-slate-700 transition cursor-pointer"
                      title="Restablecer nombres por defecto"
                    >
                      <RotateCcw size={13} />
                      <span>Restablecer</span>
                    </button>

                    <button
                      id="btn-guardar-ajustes"
                      type="button"
                      onClick={handleSaveAllNames}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
                    >
                      <Save size={14} />
                      <span>Guardar Nombres</span>
                    </button>
                  </div>
                </div>

                {/* 2-Column Compact Grid of 20 Waiters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[58vh] overflow-y-auto pr-1">
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => {
                    const currentVal = localNames[num] || '';

                    return (
                      <div
                        key={num}
                        id={`slot-mesero-row-${num}`}
                        className="flex items-center gap-2 bg-[#0b1120] border border-slate-800 rounded-xl p-1.5"
                      >
                        <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-black font-mono text-xs text-amber-400 shrink-0">
                          #{num}
                        </div>

                        <input
                          id={`input-mesero-name-${num}`}
                          type="text"
                          value={currentVal}
                          placeholder={`Mesero ${num}`}
                          onChange={(e) => handleSlotNameChange(num, e.target.value)}
                          className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white font-bold text-xs rounded-lg focus:outline-hidden transition placeholder:text-slate-600"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmación para Reiniciar Caja */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 p-4 select-none">
          <div className="bg-[#1e293b] border border-red-500/80 rounded-3xl p-5 sm:p-6 max-w-sm w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-950 text-red-400 border border-red-800 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                ¿REINICIAR CAJA DEL DÍA?
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Esta acción restablecerá a cero el historial de recibos, ventas ({receipts.length} órdenes) y el arqueo actual para una nueva jornada.
              </p>
            </div>

            <div className="bg-[#0b1120] p-2.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total acumulado:</span>
              <span className="text-base font-black text-emerald-400">
                {formatCOP(receipts.reduce((sum, r) => sum + r.total, 0))}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  posAudio.playClick();
                  onClearReceipts();
                  setShowResetConfirm(false);
                }}
                className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer border border-red-500"
              >
                Sí, Reiniciar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded CajaModal when charging a table from the Caja Hub */}
      {tableToPay && (
        <CajaModal
          table={tableToPay}
          onClose={() => setTableToPay(null)}
          onCompletePayment={(receipt) => {
            setTableToPay(null);
            onCompletePayment?.(receipt);
          }}
        />
      )}
    </div>
  );
};
