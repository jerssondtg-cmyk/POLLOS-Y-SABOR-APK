import React, { useState } from 'react';
import { ActiveTable, KitchenOrder, UserProfile } from '../types';
import { posAudio } from '../utils/audio';
import { NetworkSyncBadge } from './NetworkSyncBadge';
import {
  Flame,
  ChefHat,
  Receipt,
  Volume2,
  VolumeX,
  Search,
  User,
  ShieldCheck,
  ArrowLeft,
  Bell,
} from 'lucide-react';

interface MesasSelectorProps {
  tables: ActiveTable[];
  kitchenOrders: KitchenOrder[];
  currentUser?: UserProfile;
  waiterName?: string;
  onChangeWaiterName?: (name: string) => void;
  onOpenRoleSelector?: () => void;
  onExitToGatekeeper?: () => void;
  onSelectTable: (tableId: string) => void;
  onOpenKitchen: () => void;
  onOpenSalesHistory: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const MesasSelector: React.FC<MesasSelectorProps> = ({
  tables,
  kitchenOrders,
  currentUser,
  waiterName,
  onOpenRoleSelector,
  onExitToGatekeeper,
  onSelectTable,
  onOpenSalesHistory,
  soundEnabled,
  onToggleSound,
}) => {
  const [filter, setFilter] = useState<'todas' | 'ocupadas' | 'libres'>('todas');
  const [searchQuery, setSearchQuery] = useState('');

  const readyKitchenOrders = kitchenOrders.filter((o) => o.status === 'listo');
  const readyKitchenCount = readyKitchenOrders.length;

  const totalOcupadas = tables.filter((t) => t.items.length > 0).length;
  const totalLibres = tables.length - totalOcupadas;

  const filteredTables = tables.filter((table) => {
    const hasItems = table.items.length > 0;
    if (filter === 'ocupadas' && !hasItems) return false;
    if (filter === 'libres' && hasItems) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const numOnly = table.label.replace(/\D/g, '');
      if (
        !table.label.toLowerCase().includes(q) &&
        !numOnly.includes(q) &&
        !(table.waiterName && table.waiterName.toLowerCase().includes(q)) &&
        !(table.customerName && table.customerName.toLowerCase().includes(q))
      ) {
        return false;
      }
    }
    return true;
  });

  const handleTableClick = (tableId: string) => {
    posAudio.playClick();
    onSelectTable(tableId);
  };

  const isCashier = currentUser?.role === 'caja';
  const isKitchen = currentUser?.role === 'cocina';
  const displayName = currentUser?.name || waiterName || 'Mesero 1';

  return (
    <div
      id="pantalla-mesas"
      className="flex flex-col h-full bg-[#0f172a] text-white select-none overflow-hidden"
    >
      {/* Top Header Bar */}
      <header className="px-3 sm:px-4 py-2.5 sm:py-3 bg-[#0b1120] border-b border-slate-800 grid grid-cols-[auto_1fr_auto] sm:grid-cols-3 items-center shrink-0 gap-2">
        {/* 1. Left: Exit Button */}
        <div className="flex items-center justify-start gap-2">
          <button
            id="btn-salir-mesas"
            type="button"
            onClick={() => {
              posAudio.playClick();
              if (onExitToGatekeeper) {
                onExitToGatekeeper();
              } else if (onOpenRoleSelector) {
                onOpenRoleSelector();
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white border border-slate-700 flex items-center gap-2 text-xs sm:text-sm font-black transition cursor-pointer min-h-[42px]"
            title="Volver a la pantalla inicial de roles"
          >
            <ArrowLeft size={18} className="text-orange-400" />
            <span>Salir</span>
          </button>
        </div>

        {/* 2. Center: Brand Name & 90 Mesas Badge */}
        <div className="flex items-center justify-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white shrink-0">
            <Flame size={20} className="text-amber-200" />
          </div>
          <div className="text-left sm:text-center">
            <div className="text-sm sm:text-base font-black italic tracking-tighter text-orange-500 uppercase leading-none">
              POLLOS & SABOR
            </div>
            <div className="text-xs font-black text-slate-300 tracking-wider uppercase mt-0.5">
              90 MESAS ACTIVAS
            </div>
          </div>
        </div>

        {/* 3. Right: User Profile, Sound & Action Buttons */}
        <div className="flex items-center justify-end gap-2">
          {/* WiFi & Tablet Sync Status */}
          <NetworkSyncBadge currentUser={currentUser} className="hidden lg:flex" />

          {/* Ventas / Caja Button - Only visible if isCashier */}
          {isCashier && (
            <button
              id="btn-caja-arqueo"
              type="button"
              onClick={() => {
                posAudio.playClick();
                onOpenSalesHistory();
              }}
              className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm flex items-center gap-2 border border-emerald-600 transition cursor-pointer min-h-[42px] active:scale-95"
            >
              <Receipt size={16} />
              <span className="hidden sm:inline">Caja & Arqueo</span>
              {totalOcupadas > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-200 text-xs font-black">
                  {totalOcupadas}
                </span>
              ) : null}
            </button>
          )}

          {/* User Profile Badge */}
          <div
            className={`px-3 py-2 rounded-xl border flex items-center gap-2 text-xs sm:text-sm font-black transition min-h-[42px] ${
              isCashier
                ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                : isKitchen
                ? 'bg-amber-950 border-amber-700 text-amber-300'
                : 'bg-orange-950 border-orange-700 text-orange-300'
            }`}
          >
            {isCashier ? (
              <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
            ) : isKitchen ? (
              <ChefHat size={16} className="text-amber-400 shrink-0" />
            ) : (
              <User size={16} className="text-orange-400 shrink-0" />
            )}
            <span className="truncate max-w-[85px] sm:max-w-[140px]">{displayName}</span>
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            title="Activar/Desactivar Sonido"
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer active:scale-95"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          {/* Ready Kitchen Notification */}
          {readyKitchenCount > 0 && (
            <div
              id="alerta-cocina-lista"
              className="px-2.5 py-1.5 rounded-xl bg-emerald-950 border border-emerald-600 text-emerald-300 text-xs font-black hidden md:flex items-center gap-1.5 min-h-[42px]"
              title="Platos listos para servir"
            >
              <Bell size={15} className="text-emerald-400 shrink-0 animate-bounce" />
              <span>
                {readyKitchenOrders.slice(0, 2).map((o) => o.tableLabel).join(', ')} lista
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Tables Grid Container - 90 Fixed Numbered Tables (Mesa 1 to Mesa 90) */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 max-w-7xl mx-auto w-full flex flex-col items-center">
        {/* Filter Pills & Search Input Bar */}
        <div className="flex items-center justify-between gap-2.5 mb-3 w-full flex-wrap">
          <div className="flex gap-1.5 bg-[#1e293b] p-1.5 rounded-xl border border-slate-700 flex-wrap text-xs sm:text-sm">
            <button
              type="button"
              onClick={() => setFilter('todas')}
              className={`px-3.5 py-1.5 rounded-lg font-black transition cursor-pointer min-h-[38px] ${
                filter === 'todas'
                  ? 'bg-orange-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Todas ({tables.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('ocupadas')}
              className={`px-3.5 py-1.5 rounded-lg font-black transition flex items-center gap-2 cursor-pointer min-h-[38px] ${
                filter === 'ocupadas'
                  ? 'bg-orange-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block"></span>
              Ocupadas ({totalOcupadas})
            </button>
            <button
              type="button"
              onClick={() => setFilter('libres')}
              className={`px-3.5 py-1.5 rounded-lg font-black transition cursor-pointer min-h-[38px] ${
                filter === 'libres'
                  ? 'bg-orange-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Libres ({totalLibres})
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative flex-1 max-w-sm min-w-[160px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar mesa o mesero..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#1e293b] border border-slate-700 rounded-xl text-white text-xs sm:text-sm font-bold placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 min-h-[42px]"
            />
          </div>
        </div>

        {/* 90 Tables Grid: Clean, Compact Flat Layout */}
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-9 xl:grid-cols-10 gap-2 sm:gap-2.5 w-full pb-6">
          {filteredTables.map((table) => {
            const hasItems = table.items.length > 0;
            const tableNumber = table.label.replace(/\D/g, '') || table.id.replace(/\D/g, '') || table.label;

            const hasSent = table.items.some((it) => it.sentToKitchen);
            const hasUnsent = table.items.some((it) => !it.sentToKitchen);
            const isAdditionPending = hasSent && hasUnsent;

            // Elapsed time calculation
            const getElapsedMins = () => {
              if (!table.openedAt) return null;
              const mins = Math.floor((Date.now() - table.openedAt) / 60000);
              return mins > 0 ? `${mins}m` : '1m';
            };
            const elapsed = getElapsedMins();

            return (
              <button
                key={table.id}
                id={`btn-mesa-${tableNumber}`}
                type="button"
                onClick={() => handleTableClick(table.id)}
                className={`btn-mesa relative p-2 sm:p-2.5 rounded-2xl text-center transition active:scale-95 border cursor-pointer flex flex-col items-center justify-center min-h-[64px] sm:min-h-[72px] select-none ${
                  hasItems
                    ? 'bg-orange-950/85 hover:bg-orange-900 border-orange-500 text-orange-100'
                    : 'bg-[#1e293b] hover:bg-slate-800 border-slate-700 hover:border-slate-500 text-white'
                }`}
              >
                {/* Big Prominent Table Number */}
                <div
                  className={`font-black text-2xl sm:text-3xl leading-none tracking-tight ${
                    hasItems ? 'text-orange-200' : 'text-white'
                  }`}
                >
                  {tableNumber}
                </div>

                {/* Status indicator: Only when Occupied show Waiter & Time */}
                {hasItems && (
                  <div className="mt-1.5 flex flex-col items-center w-full px-0.5 leading-none">
                    <span className="text-xs font-bold text-slate-200 truncate max-w-[70px] text-center">
                      {table.waiterName || 'Mesero'}
                    </span>
                    {elapsed && (
                      <span className="text-[10px] font-black text-orange-300 bg-orange-950 px-1.5 py-0.5 rounded-full border border-orange-600 mt-1">
                        {elapsed}
                      </span>
                    )}
                  </div>
                )}

                {/* Badges */}
                {isAdditionPending ? (
                  <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-amber-400 border border-slate-900 flex items-center justify-center text-[9px] font-black text-slate-950">
                    Adic.
                  </span>
                ) : table.lastKitchenSendAt ? (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-orange-600 border border-slate-900 flex items-center justify-center text-xs font-black text-white">
                    <Flame size={12} />
                  </span>
                ) : null}

                {table.currentRound && table.currentRound > 1 && !isAdditionPending && (
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-[#0b1120] text-[9px] font-mono font-black text-slate-300 border border-slate-700">
                    R{table.currentRound}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </main>

      {/* Minimalist Footer Bar */}
      <footer className="bg-[#0b1120] border-t border-slate-800 px-4 py-2.5 text-xs text-slate-300 flex items-center justify-center shrink-0">
        <div className="flex items-center gap-6 text-xs font-black text-slate-300 flex-wrap justify-center">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#1e293b] border border-slate-600"></span>
            <span>Mesa Libre</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-600 border border-orange-400"></span>
            <span>Mesa Ocupada</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-300"></span>
            <span>Adición Pendiente</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
