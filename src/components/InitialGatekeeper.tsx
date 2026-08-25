import React, { useState } from 'react';
import { posAudio } from '../utils/audio';
import { CAJA_DEFAULT_PIN } from '../utils/storage';
import { NetworkSyncBadge } from './NetworkSyncBadge';
import {
  Flame,
  Utensils,
  ChefHat,
  CreditCard,
  ArrowLeft,
  ArrowRight,
  Check,
  AlertCircle,
  Delete,
  Eye,
  Activity,
} from 'lucide-react';

interface InitialGatekeeperProps {
  onSelectWaiter: (waiterNumber: number) => void;
  onSelectKitchen: () => void;
  onSelectCashier: () => void;
  onSelectViewer?: () => void;
  waiterNames?: Record<number, string>;
  activeKitchenCount?: number;
  pendingPaymentCount?: number;
  occupiedTablesCount?: number;
  cajaPin?: string;
}

export const InitialGatekeeper: React.FC<InitialGatekeeperProps> = ({
  onSelectWaiter,
  onSelectKitchen,
  onSelectCashier,
  onSelectViewer,
  waiterNames,
  cajaPin = CAJA_DEFAULT_PIN,
}) => {
  // Sub-views: 'menu' (3 main cards) | 'meseros_grid' | 'caja_pin'
  const [subView, setSubView] = useState<'menu' | 'meseros_grid' | 'caja_pin'>('menu');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState(false);

  // Handle Waiter selection
  const handleWaiterClick = (num: number) => {
    posAudio.playClick();
    onSelectWaiter(num);
  };

  // Handle Kitchen selection
  const handleKitchenClick = () => {
    posAudio.playKitchenSend();
    onSelectKitchen();
  };

  // Handle PIN input for Cashier
  const handleDigit = (digit: string) => {
    if (pinSuccess) return;
    posAudio.playClick();

    if (pinInput.length < 4) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);
      setPinError(null);

      if (nextPin.length === 4) {
        if (nextPin === cajaPin) {
          posAudio.playSuccess();
          setPinSuccess(true);
          setTimeout(() => {
            onSelectCashier();
          }, 300);
        } else {
          posAudio.playError();
          setPinError('PIN incorrecto');
          setTimeout(() => {
            setPinInput('');
            setPinError(null);
          }, 1000);
        }
      }
    }
  };

  const handleDelete = () => {
    if (pinSuccess) return;
    posAudio.playClick();
    setPinInput((prev) => prev.slice(0, -1));
    setPinError(null);
  };

  const handleClear = () => {
    if (pinSuccess) return;
    posAudio.playClick();
    setPinInput('');
    setPinError(null);
  };

  return (
    <div
      id="pantalla-inicial-acceso"
      className="w-full h-screen bg-[#0f172a] text-slate-100 flex flex-col justify-between overflow-hidden font-sans select-none relative p-3 sm:p-5"
    >
      {/* Top Brand Header - Clean & Flat with Network Sync */}
      <header className="text-center shrink-0 z-10 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-4xl mx-auto w-full px-2">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-xl bg-[#1e293b] border border-slate-700">
          <div className="w-7 h-7 rounded-lg bg-orange-600 flex items-center justify-center text-white">
            <Flame size={18} />
          </div>
          <div className="text-left">
            <h1 className="text-base sm:text-lg font-black italic tracking-tight text-white uppercase leading-none">
              POLLOS & SABOR
            </h1>
            <span className="text-[9px] font-bold text-orange-400 tracking-wider uppercase">
              SISTEMA POS
            </span>
          </div>
        </div>

        <NetworkSyncBadge />
      </header>

      {/* Center Content */}
      <main className="flex-1 flex items-center justify-center z-10 w-full max-w-4xl mx-auto my-auto">
        
        {/* ======================================================== */}
        {/* 3 CLEAN FLAT TACTILE CARDS (SINGLE ROW ON DESKTOP)       */}
        {/* ======================================================== */}
        {subView === 'menu' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 w-full max-w-3xl">
            
            {/* TARJETA 1: MESEROS */}
            <button
              id="card-modo-meseros"
              onClick={() => {
                posAudio.playClick();
                setSubView('meseros_grid');
              }}
              className="group relative p-4 sm:p-6 rounded-2xl bg-[#1e293b] hover:bg-slate-800 border border-slate-700 hover:border-orange-500 transition cursor-pointer active:scale-98 flex flex-col items-center justify-center text-center gap-3 min-h-[140px] sm:min-h-[200px]"
            >
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-[#0f172a] group-hover:bg-orange-600 text-orange-400 group-hover:text-white flex items-center justify-center border border-slate-700 group-hover:border-orange-500 transition">
                <Utensils size={32} className="sm:hidden" />
                <Utensils size={38} className="hidden sm:block" />
              </div>

              <div>
                <h2 className="font-black text-lg sm:text-xl text-white tracking-wide uppercase group-hover:text-orange-400 transition-colors">
                  MESEROS
                </h2>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  Tomar pedidos (1 al 20)
                </p>
              </div>
            </button>

            {/* TARJETA 2: COCINA */}
            <button
              id="card-modo-cocina"
              onClick={handleKitchenClick}
              className="group relative p-4 sm:p-6 rounded-2xl bg-[#1e293b] hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 transition cursor-pointer active:scale-98 flex flex-col items-center justify-center text-center gap-3 min-h-[140px] sm:min-h-[200px]"
            >
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-[#0f172a] group-hover:bg-cyan-600 text-cyan-400 group-hover:text-white flex items-center justify-center border border-slate-700 group-hover:border-cyan-500 transition">
                <ChefHat size={32} className="sm:hidden" />
                <ChefHat size={38} className="hidden sm:block" />
              </div>

              <div>
                <h2 className="font-black text-lg sm:text-xl text-white tracking-wide uppercase group-hover:text-cyan-400 transition-colors">
                  COCINA
                </h2>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  Comandas KDS en vivo
                </p>
              </div>
            </button>

            {/* TARJETA 3: CAJA */}
            <button
              id="card-modo-caja"
              onClick={() => {
                posAudio.playClick();
                setPinInput('');
                setPinError(null);
                setPinSuccess(false);
                setSubView('caja_pin');
              }}
              className="group relative p-4 sm:p-6 rounded-2xl bg-[#1e293b] hover:bg-slate-800 border border-slate-700 hover:border-emerald-500 transition cursor-pointer active:scale-98 flex flex-col items-center justify-center text-center gap-3 min-h-[140px] sm:min-h-[200px]"
            >
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-[#0f172a] group-hover:bg-emerald-600 text-emerald-400 group-hover:text-white flex items-center justify-center border border-slate-700 group-hover:border-emerald-500 transition">
                <CreditCard size={32} className="sm:hidden" />
                <CreditCard size={38} className="hidden sm:block" />
              </div>

              <div>
                <h2 className="font-black text-lg sm:text-xl text-white tracking-wide uppercase group-hover:text-emerald-400 transition-colors">
                  CAJA
                </h2>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  Cobros y Cierre (PIN)
                </p>
              </div>
            </button>

            {/* MODO VISOR */}
            <button
              id="card-modo-visor"
              onClick={() => {
                posAudio.playClick();
                if (onSelectViewer) {
                  onSelectViewer();
                }
              }}
              className="group md:col-span-3 p-3.5 sm:p-4 rounded-2xl bg-[#1e293b] hover:bg-slate-800 border border-slate-700 hover:border-slate-500 transition cursor-pointer active:scale-98 flex items-center justify-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-[#0f172a] group-hover:bg-slate-700 text-slate-300 group-hover:text-white flex items-center justify-center border border-slate-700 shrink-0 transition">
                <Eye size={20} />
              </div>
              <span className="font-bold text-sm sm:text-base text-white tracking-wide uppercase group-hover:text-slate-200 transition-colors">
                MODO VISOR
              </span>
            </button>

          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: MESEROS 1 TO 20 SELECTION GRID                  */}
        {/* ======================================================== */}
        {subView === 'meseros_grid' && (
          <div className="w-full max-w-3xl bg-[#1e293b] border border-slate-700 p-5 sm:p-6 rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700">
              <button
                id="btn-volver-roles"
                onClick={() => {
                  posAudio.playClick();
                  setSubView('menu');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-slate-600"
              >
                <ArrowLeft size={15} className="text-orange-400" />
                <span>Volver</span>
              </button>
              
              <div className="text-center flex-1 pr-14 sm:pr-20">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                  SELECCIONA TU MESERO
                </h2>
              </div>
            </div>

            {/* 20 Waiter Flat Touch Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-2.5 max-h-[62vh] overflow-y-auto p-1">
              {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => {
                const customName = waiterNames?.[num];
                const hasCustomName = Boolean(customName && customName.trim() !== '' && customName.trim().toLowerCase() !== `mesero ${num}`.toLowerCase());
                const displayName = hasCustomName ? customName : `Mesero ${num}`;

                return (
                  <button
                    key={num}
                    id={`btn-select-mesero-${num}`}
                    onClick={() => handleWaiterClick(num)}
                    className={`group relative p-2.5 rounded-xl text-center transition cursor-pointer active:scale-95 flex flex-col items-center justify-center min-h-[76px] sm:min-h-[86px] ${
                      hasCustomName
                        ? 'bg-[#0f172a] border border-orange-500/80 hover:border-orange-400 hover:bg-orange-950/30'
                        : 'bg-[#0f172a] border border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                    }`}
                  >
                    {hasCustomName ? (
                      <>
                        <span className="absolute top-1.5 left-1.5 px-1 py-0.2 rounded bg-orange-950 border border-orange-800 text-[9px] font-black font-mono text-orange-400 leading-none">
                          #{num}
                        </span>
                        <span className="text-sm sm:text-base font-black text-white group-hover:text-orange-300 tracking-tight transition-colors truncate max-w-full px-1 mt-1">
                          {displayName}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs sm:text-sm font-bold text-slate-300 group-hover:text-white tracking-tight transition-colors">
                        {displayName}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 3: CAJA PIN KEYPAD                                 */}
        {/* ======================================================== */}
        {subView === 'caja_pin' && (
          <div className="w-full max-w-sm bg-[#1e293b] border border-slate-700 p-5 sm:p-6 rounded-2xl flex flex-col items-center">
            
            {/* Header */}
            <div className="w-11 h-11 rounded-xl bg-[#0f172a] text-emerald-400 border border-slate-700 flex items-center justify-center mb-2">
              <CreditCard size={22} />
            </div>

            <h2 className="text-base font-black uppercase text-white tracking-wide text-center">
              ACCESO A CAJA
            </h2>

            {/* PIN Indicator Dots */}
            <div className="flex items-center gap-3 my-3">
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = pinInput.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-3 h-3 rounded-full transition-all ${
                      isFilled
                        ? pinError
                          ? 'bg-red-500'
                          : 'bg-emerald-400'
                        : 'bg-[#0f172a] border border-slate-700'
                    }`}
                  />
                );
              })}
            </div>

            {/* Error or Success Message */}
            {pinError && (
              <div className="flex items-center gap-1.5 text-xs text-red-400 font-bold bg-red-950/60 px-3 py-1 rounded-lg border border-red-800 text-center mb-1">
                <AlertCircle size={13} className="shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            {pinSuccess && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-800 text-center mb-1">
                <Check size={13} className="shrink-0" />
                <span>¡Correcto! Accediendo...</span>
              </div>
            )}

            {/* 10-Key Flat Numeric Pad */}
            <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px] my-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                <button
                  key={d}
                  onClick={() => handleDigit(d)}
                  disabled={pinSuccess}
                  className="h-14 bg-[#0f172a] hover:bg-slate-800 active:bg-emerald-600 active:text-white border border-slate-700 rounded-xl text-xl font-black text-white flex items-center justify-center transition cursor-pointer active:scale-95 min-h-[52px]"
                >
                  {d}
                </button>
              ))}
              <button
                onClick={handleClear}
                disabled={pinSuccess}
                className="h-14 bg-[#0f172a] hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-black flex items-center justify-center transition cursor-pointer active:scale-95 min-h-[52px]"
              >
                C
              </button>
              <button
                onClick={() => handleDigit('0')}
                disabled={pinSuccess}
                className="h-14 bg-[#0f172a] hover:bg-slate-800 active:bg-emerald-600 active:text-white border border-slate-700 rounded-xl text-xl font-black text-white flex items-center justify-center transition cursor-pointer active:scale-95 min-h-[52px]"
              >
                0
              </button>
              <button
                onClick={handleDelete}
                disabled={pinSuccess}
                className="h-14 bg-[#0f172a] hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl flex items-center justify-center transition cursor-pointer active:scale-95 min-h-[52px]"
              >
                <Delete size={20} />
              </button>
            </div>

            {/* Return Button */}
            <button
              onClick={() => {
                posAudio.playClick();
                setSubView('menu');
              }}
              className="mt-3 text-xs sm:text-sm text-slate-300 hover:text-white flex items-center gap-1.5 font-black transition cursor-pointer min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700"
            >
              <ArrowLeft size={16} />
              <span>Volver a Menú</span>
            </button>
          </div>
        )}

      </main>

      {/* Minimal Footer */}
      <footer className="text-center text-xs text-slate-500 shrink-0 z-10">
        Pollos & Sabor POS
      </footer>
    </div>
  );
};
