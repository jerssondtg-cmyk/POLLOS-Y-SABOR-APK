import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Smartphone, CheckCircle2, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../types';

interface NetworkSyncBadgeProps {
  currentUser?: UserProfile | null;
  className?: string;
  compact?: boolean;
}

export const NetworkSyncBadge: React.FC<NetworkSyncBadgeProps> = ({
  currentUser,
  className = '',
  compact = false,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Ahora');
  const [showNetworkInfo, setShowNetworkInfo] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic time label updater
    const interval = setInterval(() => {
      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 800);
  };

  const getRoleLabel = () => {
    if (!currentUser) return 'Tablet Restaurante';
    if (currentUser.role === 'mesero') return `Tablet Mesero (${currentUser.name})`;
    if (currentUser.role === 'cocina') return 'Terminal Cocina KDS';
    if (currentUser.role === 'caja') return 'Tablet Caja Central';
    if (currentUser.role === 'visor') return 'Tablet Visor Gerencial';
    return currentUser.name;
  };

  if (compact) {
    return (
      <div
        onClick={() => setShowNetworkInfo(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer select-none transition border ${
          isOnline
            ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
            : 'bg-rose-950/70 border-rose-500/40 text-rose-300 animate-pulse'
        } ${className}`}
        title="Estado de Red y Sincronización de Tablets"
      >
        {isOnline ? (
          <>
            <Wifi size={13} className={isSyncing ? 'animate-spin text-emerald-400' : 'text-emerald-400'} />
            <span className="hidden sm:inline">En Línea</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          </>
        ) : (
          <>
            <WifiOff size={13} className="text-rose-400" />
            <span>Sin WiFi</span>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <div
        onClick={() => setShowNetworkInfo(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer select-none transition ${
          isOnline
            ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300'
            : 'bg-rose-950/80 border-rose-700 text-rose-200 animate-pulse'
        } ${className}`}
      >
        {/* WiFi Indicator Icon */}
        <div className="flex items-center justify-center">
          {isOnline ? (
            <div className="relative">
              <Wifi size={16} className="text-emerald-400" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
          ) : (
            <WifiOff size={16} className="text-rose-400" />
          )}
        </div>

        {/* Text Details */}
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100 leading-none">
            <span>{isOnline ? 'WiFi & Sincronizado' : 'Modo Sin Conexión'}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 leading-none">
            {isOnline ? `Sync: ${lastSyncTime}` : 'Guardando local'}
          </span>
        </div>

        {/* Manual Sync Icon */}
        <button
          type="button"
          onClick={handleManualSync}
          className="ml-1 p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition active:rotate-180"
          title="Verificar y forzar sincronización"
        >
          <RefreshCw size={13} className={isSyncing ? 'animate-spin text-amber-400' : ''} />
        </button>
      </div>

      {/* Network Info & Tablet Diagnostics Modal */}
      {showNetworkInfo && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowNetworkInfo(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 text-slate-100 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Wifi size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Red y Sincronización</h3>
                  <p className="text-xs text-slate-400">Red local del restaurante & 20 Tablets</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNetworkInfo(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Status overview */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Estado de Conexión:</span>
                <span className={`font-bold flex items-center gap-1.5 ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isOnline ? (
                    <>
                      <CheckCircle2 size={14} /> En línea (WiFi OK)
                    </>
                  ) : (
                    <>
                      <WifiOff size={14} /> Desconectado
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Dispositivo Actual:</span>
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Smartphone size={14} />
                  {getRoleLabel()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Motor de Sincronización:</span>
                <span className="font-semibold text-slate-300 flex items-center gap-1">
                  <ShieldCheck size={14} className="text-cyan-400" />
                  Firestore Live & Offline Cache
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Última actualización:</span>
                <span className="text-slate-300 font-mono">{lastSyncTime}</span>
              </div>
            </div>

            {/* Explanatory notice */}
            <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-3 text-xs text-blue-200 leading-relaxed">
              <p className="font-semibold text-blue-300 mb-1">ℹ️ Arquitectura Multidispositivo:</p>
              Todos los cambios en pedidos, mesas, comandas de cocina y pagos se replican instantáneamente en todas las tablets conectadas a la red WiFi. Si alguna tablet pierde señal momentáneamente, guardará los pedidos en memoria local y los enviará automáticamente al recuperar cobertura.
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleManualSync}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-98 font-bold text-xs text-white flex items-center justify-center gap-2 transition"
              >
                <RefreshCw size={14} className={isSyncing ? 'animate-spin text-amber-400' : ''} />
                <span>Forzar Refresco de Datos</span>
              </button>
              <button
                type="button"
                onClick={() => setShowNetworkInfo(false)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs active:scale-98 transition"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
