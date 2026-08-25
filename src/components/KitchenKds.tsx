import React, { useState, useEffect } from 'react';
import { KitchenOrder, UserProfile } from '../types';
import { posAudio } from '../utils/audio';
import { NetworkSyncBadge } from './NetworkSyncBadge';
import {
  ChefHat,
  CheckCircle2,
  Clock,
  Flame,
  ArrowLeft,
  Trash2,
  User,
  UtensilsCrossed,
  AlertTriangle,
  Radio,
  Package,
} from 'lucide-react';

interface KitchenKdsProps {
  orders: KitchenOrder[];
  currentUser?: UserProfile;
  onBackToTables: () => void;
  onOpenRoleSelector?: () => void;
  onExitToGatekeeper?: () => void;
  onUpdateStatus: (orderId: string, status: 'pendiente' | 'preparando' | 'listo' | 'entregado') => void;
  onDeleteOrder: (orderId: string) => void;
}

const STATION_FILTERS = [
  { id: 'todos', label: 'Todos' },
  { id: 'pollos', label: 'Pollos' },
  { id: 'parrilla', label: 'Parrilla' },
  { id: 'rapidas', label: 'Comidas Rápidas' },
  { id: 'bebidas', label: 'Bebidas' },
];

const getCleanKitchenNote = (note?: string): string => {
  if (!note) return '';
  return note
    .replace(/\[PARA LLEVAR\]/gi, '')
    .replace(/^,\s*|,\s*$/g, '')
    .replace(/,\s*,/g, ',')
    .trim();
};

export const KitchenKds: React.FC<KitchenKdsProps> = ({
  orders,
  currentUser,
  onBackToTables,
  onOpenRoleSelector,
  onExitToGatekeeper,
  onUpdateStatus,
  onDeleteOrder,
}) => {
  const [filterArea, setFilterArea] = useState<string>('todos');
  const [now, setNow] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      const current = new Date();
      setNow(current);
      setCurrentTime(current.getTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeOrders = orders.filter((o) => o.status !== 'entregado');

  const getElapsedMinutes = (timestamp: number) => {
    return Math.max(1, Math.floor((currentTime - timestamp) / 60000));
  };

  const matchStation = (item: any, station: string) => {
    if (station === 'todos') return true;
    const name = (item.name || '').toLowerCase();
    const cat = (item.cat || '').toLowerCase();
    const area = (item.area || '').toLowerCase();

    if (station === 'pollos') {
      return cat.includes('pollo') || name.includes('pollo') || area === 'freidora';
    }
    if (station === 'parrilla') {
      return cat.includes('parrilla') || area === 'parrilla' || cat.includes('pescado') || cat.includes('bandeja');
    }
    if (station === 'rapidas') {
      return (
        cat.includes('hamb') ||
        cat.includes('perro') ||
        cat.includes('infantil') ||
        cat.includes('otro') ||
        name.includes('hamb') ||
        name.includes('perro') ||
        name.includes('salchipapa') ||
        name.includes('nugget')
      );
    }
    if (station === 'bebidas') {
      return (
        cat.includes('bebida') ||
        area === 'bebidas' ||
        item.isJuice ||
        item.isSoda ||
        Boolean(item.drinkFlavor)
      );
    }
    return true;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white select-none overflow-hidden font-sans">
      {/* Header ultra limpio */}
      <header className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0 gap-3 flex-wrap">
        {/* Izquierda: Botón [ ← Salir / Cambiar Rol ] */}
        <div className="flex items-center gap-2">
          <button
            id="btn-kds-salir-rol"
            onClick={() => {
              posAudio.playClick();
              if (onExitToGatekeeper) {
                onExitToGatekeeper();
              } else if (onOpenRoleSelector) {
                onOpenRoleSelector();
              }
            }}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white rounded-xl text-xs font-black flex items-center gap-2 border border-slate-700 transition cursor-pointer shadow-xs"
            title="Cambiar Rol o Salir"
          >
            <ArrowLeft size={15} className="text-orange-400" />
            <span>Salir / Cambiar Rol</span>
          </button>
        </div>

        {/* Centro: Filtros de estación compactos */}
        <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          {STATION_FILTERS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFilterArea(id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                filterArea === id
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Derecha: Reloj en vivo / Indicador de conexión & Sincronización */}
        <div className="flex items-center gap-2">
          <NetworkSyncBadge currentUser={currentUser} className="hidden sm:flex" />
          <div className="flex items-center gap-2 text-xs font-mono font-bold bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-white">
              {now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </span>
          </div>
        </div>
      </header>

      {/* Orders Grid */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-950">
        {activeOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 py-16">
            <CheckCircle2 size={56} className="text-emerald-500/40 mb-3" />
            <h2 className="text-xl font-black text-slate-200">¡Cocina al Día!</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-sm text-center font-medium">
              No hay comandas pendientes en cola. Las nuevas órdenes enviadas por los meseros aparecerán en tiempo real.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {activeOrders.map((order) => {
              const elapsed = getElapsedMinutes(order.createdAt);
              const isUrgent = elapsed >= 15;
              const isWarning = elapsed >= 8 && !isUrgent;

              const displayItems = order.items.filter((it) => matchStation(it, filterArea));
              if (displayItems.length === 0) return null;

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl border overflow-hidden flex flex-col transition ${
                    order.status === 'listo'
                      ? 'bg-emerald-950/40 border-emerald-500'
                      : isUrgent
                      ? 'bg-red-950/40 border-red-500'
                      : isWarning
                      ? 'bg-amber-950/30 border-amber-500'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  {/* Card Header: Mesa | Mesero | Tiempo */}
                  <div
                    className={`p-3 flex items-center justify-between border-b ${
                      order.status === 'listo'
                        ? 'bg-emerald-950 border-emerald-800'
                        : order.isAddition
                        ? 'bg-amber-950 border-amber-800'
                        : isUrgent
                        ? 'bg-red-950 border-red-800'
                        : isWarning
                        ? 'bg-amber-950 border-amber-800'
                        : 'bg-slate-800 border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-base sm:text-lg font-black tracking-tight text-white">
                          {order.tableLabel}
                        </span>
                        <span className="text-[11px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded-md text-slate-300">
                          #{order.orderNumber}
                        </span>
                        {order.isAddition && (
                          <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                            + Adición {order.additionRound ? `#${order.additionRound}` : ''}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-300 font-bold flex items-center gap-1 mt-0.5">
                        <User size={11} className="text-orange-400" />
                        <span>{order.waiterName || 'Mesero'}</span>
                      </div>
                    </div>

                    {/* Elapsed Time */}
                    <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-xl text-xs font-mono font-bold shrink-0 border border-white/10">
                      <Clock size={12} className={isUrgent ? 'text-red-400' : 'text-slate-300'} />
                      <span className={isUrgent ? 'text-red-300 font-black' : 'text-slate-200'}>
                        {elapsed} min
                      </span>
                    </div>
                  </div>

                  {/* Voided All Banner if applicable */}
                  {displayItems.every((it) => it.isVoided) && (
                    <div className="bg-red-900 border-b border-red-500 px-3 py-1.5 text-xs font-black text-white flex items-center gap-2">
                      <AlertTriangle size={15} className="text-yellow-300 shrink-0" />
                      <span>ANULADA POR CAJA</span>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="p-3 space-y-2 flex-1 overflow-y-auto max-h-64 divide-y divide-slate-800">
                    {displayItems.map((item, idx) => (
                      <div
                        key={idx}
                        className={`pt-2 first:pt-0 rounded-xl transition ${
                          item.isVoided
                            ? 'bg-red-950/70 p-2 border border-red-600'
                            : item.isModified
                            ? 'bg-amber-950/30 p-2 border border-amber-600'
                            : ''
                        }`}
                      >
                        {item.isVoided ? (
                          /* VOIDED ITEM */
                          <div className="space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="bg-red-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                                <Trash2 size={10} /> ANULADO - NO PREPARAR
                              </span>
                              <span className="text-xs font-mono font-bold text-red-300 line-through">
                                {item.quantity}x
                              </span>
                            </div>
                            <div className="text-xs font-black text-slate-400 line-through">
                              {item.name}
                            </div>
                            {item.voidReason && (
                              <div className="text-[10px] font-bold text-red-300">
                                Motivo: <span className="text-white">{item.voidReason}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* ACTIVE ITEM */
                          <>
                            <div className="flex items-start justify-between font-bold text-sm text-slate-100">
                              <div className="flex items-start gap-1.5 flex-1">
                                <span className="text-orange-400 font-black text-base w-7 shrink-0">
                                  {item.quantity}x
                                </span>
                                <span className="text-slate-100 font-black text-sm leading-snug">
                                  {item.name}
                                </span>
                              </div>

                              {item.isModified && (
                                <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded uppercase shrink-0">
                                  MODIFICADO
                                </span>
                              )}
                            </div>

                            {(item.isTakeaway || item.note?.toUpperCase().includes('PARA LLEVAR')) && (
                              <div className="text-xs bg-amber-500 text-slate-950 px-2.5 py-1 rounded-lg ml-7 font-black mt-1 flex items-center gap-1.5 border border-amber-400">
                                <Package size={14} className="shrink-0 text-slate-950 stroke-[2.5]" />
                                <span className="tracking-wide">EMPACAR PARA LLEVAR</span>
                              </div>
                            )}

                            {item.term && (
                              <div className="text-xs text-amber-400 font-bold ml-7 mt-0.5">
                                Término: {item.term}
                              </div>
                            )}

                            {item.isCombo && (
                              <div className="text-xs text-blue-300 font-bold ml-7 mt-0.5">
                                {item.comboNote ? `Combo: ${item.comboNote}` : 'Combo (Papas + Bebida)'}
                              </div>
                            )}

                            {Boolean(getCleanKitchenNote(item.note)) && (
                              <div className="text-xs bg-red-950/80 border border-red-800 text-red-200 px-2 py-1 rounded-lg ml-7 font-bold mt-1">
                                NOTA: {getCleanKitchenNote(item.note)}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Quick Bottom Action Button */}
                  <div className="p-2.5 bg-slate-900 border-t border-slate-800 flex gap-2">
                    {order.status === 'pendiente' && (
                      <button
                        onClick={() => {
                          posAudio.playClick();
                          onUpdateStatus(order.id, 'preparando');
                        }}
                        className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
                      >
                        <Flame size={16} /> Iniciar Preparación
                      </button>
                    )}

                    {order.status === 'preparando' && (
                      <button
                        onClick={() => {
                          posAudio.playKitchenSend();
                          onUpdateStatus(order.id, 'listo');
                        }}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer min-h-[44px]"
                      >
                        <CheckCircle2 size={18} /> Listo para Servir
                      </button>
                    )}

                    {order.status === 'listo' && (
                      <button
                        onClick={() => {
                          posAudio.playClick();
                          onUpdateStatus(order.id, 'entregado');
                        }}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
                      >
                        <UtensilsCrossed size={16} /> Entregado a la Mesa
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteOrder(order.id)}
                      className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition cursor-pointer shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Eliminar comanda"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
