import React, { useState } from 'react';
import { UserProfile } from '../types';
import { CAJA_DEFAULT_PIN } from '../utils/storage';
import { posAudio } from '../utils/audio';
import {
  Users,
  ChefHat,
  ShieldCheck,
  Lock,
  X,
  Check,
  Delete,
  Flame,
  ArrowLeft,
  KeyRound,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Eye,
} from 'lucide-react';

interface RoleSelectorModalProps {
  currentProfile?: UserProfile | null;
  currentUser?: UserProfile | null;
  isOpen?: boolean;
  onClose?: () => void;
  onSelectProfile?: (profile: UserProfile) => void;
  onSelectRole?: (profile: UserProfile) => void;
  waiterNames?: Record<number, string>;
  cajaPin?: string;
}

export const RoleSelectorModal: React.FC<RoleSelectorModalProps> = ({
  currentProfile,
  currentUser,
  isOpen = true,
  onClose,
  onSelectProfile,
  onSelectRole,
  waiterNames,
  cajaPin = CAJA_DEFAULT_PIN,
}) => {
  const activeProfile = currentUser || currentProfile;
  const handleProfileSelect = onSelectProfile || onSelectRole || (() => {});

  // Navigation view inside modal: 'menu' (3 options) | 'mesero_pin' | 'caja_pin' | 'info'
  const [view, setView] = useState<'menu' | 'mesero_pin' | 'caja_pin'>('menu');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showHelperList, setShowHelperList] = useState(false);

  if (isOpen === false) return null;

  // Handle Mesero login by password (2001 - 2020)
  const verifyWaiterPin = (pin: string) => {
    const num = parseInt(pin, 10);
    if (!isNaN(num) && num >= 2001 && num <= 2020) {
      const waiterNumber = num - 2000;
      const waiterName = waiterNames?.[waiterNumber] || `Mesero ${waiterNumber}`;
      posAudio.playSuccess();
      setSuccessMessage(`¡Bienvenido ${waiterName}!`);
      setPinError(null);

      setTimeout(() => {
        handleProfileSelect({
          role: 'mesero',
          name: waiterName,
          waiterId: waiterNumber,
        });
        if (onClose) onClose();
      }, 400);
      return true;
    } else {
      posAudio.playError();
      setPinError('Contraseña inválida. Debe ser del 2001 al 2020 (Meseros 1-20).');
      setTimeout(() => {
        setPinInput('');
        setPinError(null);
      }, 1200);
      return false;
    }
  };

  // Handle Caja login by password (1234)
  const verifyCajaPin = (pin: string) => {
    if (pin === cajaPin) {
      posAudio.playSuccess();
      setSuccessMessage('¡Acceso concedido a Caja Principal!');
      setPinError(null);

      setTimeout(() => {
        handleProfileSelect({
          role: 'caja',
          name: 'Caja Principal / Admin',
        });
        if (onClose) onClose();
      }, 400);
      return true;
    } else {
      posAudio.playError();
      setPinError('PIN de Caja incorrecto.');
      setTimeout(() => {
        setPinInput('');
        setPinError(null);
      }, 1200);
      return false;
    }
  };

  // Tactile Keypad Digit Entry
  const handleDigit = (digit: string) => {
    if (successMessage) return;
    posAudio.playClick();

    if (pinInput.length < 4) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);
      setPinError(null);

      if (nextPin.length === 4) {
        if (view === 'mesero_pin') {
          verifyWaiterPin(nextPin);
        } else if (view === 'caja_pin') {
          verifyCajaPin(nextPin);
        }
      }
    }
  };

  const handleDelete = () => {
    if (successMessage) return;
    posAudio.playClick();
    setPinInput((prev) => prev.slice(0, -1));
    setPinError(null);
  };

  const handleClear = () => {
    if (successMessage) return;
    posAudio.playClick();
    setPinInput('');
    setPinError(null);
  };

  const handleSelectCocina = () => {
    posAudio.playKitchenSend();
    handleProfileSelect({
      role: 'cocina',
      name: 'Cocina KDS',
    });
    if (onClose) onClose();
  };

  const handleSelectVisor = () => {
    posAudio.playClick();
    handleProfileSelect({
      role: 'visor',
      name: 'Visor / Administrador en Vivo',
    });
    if (onClose) onClose();
  };

  const handleQuickWaiterSelect = (waiterNum: number) => {
    const defaultPassword = (2000 + waiterNum).toString();
    setPinInput(defaultPassword);
    verifyWaiterPin(defaultPassword);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-3 select-none font-sans">
      <div className="bg-[#1e293b] border border-slate-700 text-white rounded-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="bg-[#0b1120] px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shrink-0">
              <Flame size={22} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-wide text-white uppercase flex items-center gap-2">
                POLLOS & SABOR
                <span className="text-xs bg-orange-950 border border-orange-700 text-orange-400 font-black px-2 py-0.5 rounded-full">
                  POS
                </span>
              </h2>
              <p className="text-xs text-slate-300 font-bold">
                {view === 'menu'
                  ? 'Seleccione su perfil para ingresar al sistema'
                  : view === 'mesero_pin'
                  ? 'Autenticación de Mesero'
                  : 'Autenticación de Caja Principal'}
              </p>
            </div>
          </div>

          {/* Close button (only available if there's already an active profile) */}
          {onClose && activeProfile && (
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer border border-slate-700"
              title="Cerrar y mantener usuario actual"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Modal Main Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-[#0f172a]">
          
          {/* ======================================================== */}
          {/* VIEW 1: ONLY 3 MAIN OPTIONS (MESEROS, COCINA, CAJA)     */}
          {/* ======================================================== */}
          {view === 'menu' && (
            <div className="space-y-4">
              <div className="text-center space-y-1 mb-2">
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-300">
                  SELECCIONAR ROL DE ACCESO
                </span>
                <p className="text-xs sm:text-sm text-slate-400 font-medium">
                  Elija una de las 3 opciones para iniciar sesión en el punto de venta
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                {/* 1. MESEROS OPTION */}
                <button
                  id="btn-login-meseros"
                  onClick={() => {
                    posAudio.playClick();
                    setPinInput('');
                    setPinError(null);
                    setSuccessMessage(null);
                    setView('mesero_pin');
                  }}
                  className="group relative p-5 rounded-2xl bg-[#1e293b] border border-slate-700 hover:border-orange-500 text-left transition duration-200 cursor-pointer active:scale-95 flex flex-col justify-between min-h-[180px]"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 text-orange-400 group-hover:bg-orange-600 group-hover:text-white flex items-center justify-center border border-slate-700 transition duration-200">
                      <Users size={24} />
                    </div>
                    <span className="text-xs font-black uppercase px-2.5 py-1 rounded-full bg-orange-950 text-orange-300 border border-orange-700 flex items-center gap-1">
                      <Lock size={12} /> Con Clave
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-base sm:text-lg text-white group-hover:text-orange-400 transition">
                      MESEROS
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-snug font-medium">
                      Toma de pedidos, comandas y pre-cuentas (Meseros 1 al 20).
                    </p>
                  </div>

                  <div className="text-xs font-black text-orange-400 flex items-center gap-1">
                    <span>Ingresar con PIN (2001-2020)</span>
                    <span className="group-hover:translate-x-1 transition">→</span>
                  </div>
                </button>

                {/* 2. COCINA OPTION */}
                <button
                  id="btn-login-cocina"
                  onClick={handleSelectCocina}
                  className="group relative p-5 rounded-2xl bg-[#1e293b] border border-slate-700 hover:border-cyan-500 text-left transition duration-200 cursor-pointer active:scale-95 flex flex-col justify-between min-h-[180px]"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 text-cyan-400 group-hover:bg-cyan-600 group-hover:text-white flex items-center justify-center border border-slate-700 transition duration-200">
                      <ChefHat size={24} />
                    </div>
                    <span className="text-xs font-black uppercase px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700">
                      KDS Pantalla
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-base sm:text-lg text-white group-hover:text-cyan-400 transition">
                      COCINA
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-snug font-medium">
                      Pantalla KDS en vivo para despacho de pedidos y tiempos.
                    </p>
                  </div>

                  <div className="text-xs font-black text-cyan-400 flex items-center gap-1">
                    <span>Abrir Monitor KDS</span>
                    <span className="group-hover:translate-x-1 transition">→</span>
                  </div>
                </button>

                {/* 3. CAJA OPTION */}
                <button
                  id="btn-login-caja"
                  onClick={() => {
                    posAudio.playClick();
                    setPinInput('');
                    setPinError(null);
                    setSuccessMessage(null);
                    setView('caja_pin');
                  }}
                  className="group relative p-5 rounded-2xl bg-[#1e293b] border border-slate-700 hover:border-emerald-500 text-left transition duration-200 cursor-pointer active:scale-95 flex flex-col justify-between min-h-[180px]"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center border border-slate-700 transition duration-200">
                      <ShieldCheck size={24} />
                    </div>
                    <span className="text-xs font-black uppercase px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1">
                      <KeyRound size={12} /> PIN
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-base sm:text-lg text-white group-hover:text-emerald-400 transition">
                      CAJA
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-snug font-medium">
                      Cobro de cuentas, arqueo, ventas y administración general.
                    </p>
                  </div>

                  <div className="text-xs font-black text-emerald-400 flex items-center gap-1">
                    <span>Ingresar con PIN</span>
                    <span className="group-hover:translate-x-1 transition">→</span>
                  </div>
                </button>
              </div>

              {/* 4. MODO VISOR / ESPECTADOR */}
              <button
                id="btn-login-visor"
                onClick={handleSelectVisor}
                className="w-full p-3.5 rounded-2xl bg-[#1e293b] border border-indigo-700/60 hover:border-indigo-400 text-left transition duration-200 cursor-pointer active:scale-95 flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-slate-800 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center border border-slate-700 transition shrink-0">
                    <Eye size={22} />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm text-white group-hover:text-indigo-300 uppercase">
                        MODO VISOR / ESPECTADOR (EN VIVO)
                      </h4>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700 shrink-0">
                        Auditoría
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      Supervisión de 90 mesas, ventas en tiempo real, ranking de platos y meseros.
                    </p>
                  </div>
                </div>

                <div className="text-xs font-black text-indigo-400 flex items-center gap-1 shrink-0 pr-1">
                  <span>Ver Resumen</span>
                  <span className="group-hover:translate-x-1 transition">→</span>
                </div>
              </button>

              {activeProfile && (
                <div className="text-center pt-2">
                  <span className="text-xs text-slate-300 font-bold">
                    Sesión activa actualmente:{' '}
                    <span className="text-white font-black">{activeProfile.name}</span> (
                    {activeProfile.role.toUpperCase()})
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 2: MESERO PASSWORD KEYPAD (2001 to 2020)            */}
          {/* ======================================================== */}
          {view === 'mesero_pin' && (
            <div className="flex flex-col items-center space-y-4 max-w-sm mx-auto">
              {/* Header inside keypad */}
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-xl bg-orange-950 text-orange-400 border border-orange-600 flex items-center justify-center mx-auto">
                  <Users size={24} />
                </div>
                <h3 className="font-black text-base uppercase text-white tracking-wide">
                  CONTRASEÑA DE MESERO
                </h3>
                <p className="text-xs text-slate-300 font-medium">
                  Digite su clave de 4 dígitos asignada:
                </p>
                <div className="inline-block bg-[#1e293b] px-3.5 py-1.5 rounded-full text-xs text-orange-300 font-black border border-slate-700">
                  Mesero 1 = 2001 • Mesero 2 = 2002 ... Mesero 20 = 2020
                </div>
              </div>

              {/* PIN Circles Display */}
              <div className="flex items-center gap-3 py-1">
                {[0, 1, 2, 3].map((idx) => {
                  const isFilled = pinInput.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-5 h-5 rounded-full transition-all duration-200 ${
                        isFilled
                          ? pinError
                            ? 'bg-red-500 scale-110'
                            : successMessage
                            ? 'bg-emerald-400 scale-110'
                            : 'bg-orange-400 scale-110'
                          : 'bg-slate-800 border border-slate-700'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Error or Success feedback message */}
              {pinError && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-red-300 font-black bg-red-950/60 px-3.5 py-2 rounded-xl border border-red-700 text-center">
                  <AlertCircle size={16} className="shrink-0 text-red-400" />
                  <span>{pinError}</span>
                </div>
              )}

              {successMessage && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-300 font-black bg-emerald-950/60 px-3.5 py-2 rounded-xl border border-emerald-700 text-center">
                  <Check size={16} className="shrink-0 text-emerald-400" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Numeric Keypad */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-[270px]">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                  <button
                    key={d}
                    onClick={() => handleDigit(d)}
                    disabled={!!successMessage}
                    className="h-14 bg-[#1e293b] hover:bg-slate-700 active:bg-orange-600 active:text-white border border-slate-700 rounded-2xl text-xl font-black text-white flex items-center justify-center transition cursor-pointer active:scale-95 min-h-[56px]"
                  >
                    {d}
                  </button>
                ))}
                <button
                  onClick={handleClear}
                  disabled={!!successMessage}
                  className="h-14 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-2xl text-sm font-black flex items-center justify-center transition cursor-pointer active:scale-95 min-h-[56px]"
                >
                  C
                </button>
                <button
                  onClick={() => handleDigit('0')}
                  disabled={!!successMessage}
                  className="h-14 bg-[#1e293b] hover:bg-slate-700 active:bg-orange-600 active:text-white border border-slate-700 rounded-2xl text-xl font-black text-white flex items-center justify-center transition cursor-pointer active:scale-95 min-h-[56px]"
                >
                  0
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!!successMessage}
                  className="h-14 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-2xl flex items-center justify-center transition cursor-pointer active:scale-95 min-h-[56px]"
                >
                  <Delete size={22} />
                </button>
              </div>

              {/* Quick Helper Toggle for selecting waiter directly */}
              <div className="w-full flex items-center justify-between pt-1">
                <button
                  onClick={() => setView('menu')}
                  className="text-xs sm:text-sm text-slate-300 hover:text-white flex items-center gap-1.5 font-bold transition cursor-pointer min-h-[36px]"
                >
                  <ArrowLeft size={16} />
                  <span>Volver a roles</span>
                </button>

                <button
                  onClick={() => setShowHelperList(!showHelperList)}
                  className="text-xs sm:text-sm text-orange-400 hover:text-orange-300 font-black transition cursor-pointer flex items-center gap-1.5 min-h-[36px]"
                >
                  <HelpCircle size={16} />
                  <span>{showHelperList ? 'Ocultar lista' : 'Ver lista 1-20'}</span>
                </button>
              </div>

              {/* Expandable Fast Waiter List */}
              {showHelperList && (
                <div className="w-full bg-[#1e293b] p-3.5 rounded-2xl border border-slate-700 space-y-2.5">
                  <div className="text-xs font-black text-slate-300 text-center">
                    Toque su número para ingresar automáticamente:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1">
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => {
                      const customName = waiterNames?.[n];
                      const hasCustom = Boolean(customName && customName.trim() !== '' && customName.trim().toLowerCase() !== `mesero ${n}`.toLowerCase());
                      const displayName = hasCustom ? customName : `Mesero ${n}`;
                      return (
                        <button
                          key={n}
                          onClick={() => handleQuickWaiterSelect(n)}
                          className={`py-2.5 px-2 rounded-xl text-center transition cursor-pointer text-xs font-black min-h-[44px] active:scale-95 ${
                            hasCustom
                              ? 'bg-orange-950 border border-orange-600 hover:bg-orange-600 hover:text-white text-orange-200'
                              : 'bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          <div className="truncate font-black">{hasCustom ? `${displayName} (#${n})` : displayName}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 3: CAJA PIN KEYPAD (1234)                           */}
          {/* ======================================================== */}
          {view === 'caja_pin' && (
            <div className="flex flex-col items-center space-y-4 max-w-sm mx-auto">
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-600 flex items-center justify-center mx-auto">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="font-black text-base uppercase text-white tracking-wide">
                  ACCESO A CAJA
                </h3>
              </div>

              {/* PIN Circles Display */}
              <div className="flex items-center gap-3 py-1">
                {[0, 1, 2, 3].map((idx) => {
                  const isFilled = pinInput.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-5 h-5 rounded-full transition-all duration-200 ${
                        isFilled
                          ? pinError
                            ? 'bg-red-500 scale-110'
                            : 'bg-emerald-400 scale-110'
                          : 'bg-slate-800 border border-slate-700'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Error or Success feedback message */}
              {pinError && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-red-300 font-black bg-red-950/60 px-3.5 py-2 rounded-xl border border-red-700 text-center">
                  <AlertCircle size={16} className="shrink-0 text-red-400" />
                  <span>{pinError}</span>
                </div>
              )}

              {successMessage && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-300 font-black bg-emerald-950/60 px-3.5 py-2 rounded-xl border border-emerald-700 text-center">
                  <Check size={16} className="shrink-0 text-emerald-400" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Numeric Keypad */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-[270px]">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                  <button
                    key={d}
                    onClick={() => handleDigit(d)}
                    disabled={!!successMessage}
                    className="h-14 bg-[#1e293b] hover:bg-slate-700 active:bg-emerald-600 active:text-white border border-slate-700 rounded-2xl text-xl font-black text-white flex items-center justify-center transition cursor-pointer active:scale-95 min-h-[56px]"
                  >
                    {d}
                  </button>
                ))}
                <button
                  onClick={handleClear}
                  disabled={!!successMessage}
                  className="h-14 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-2xl text-sm font-black flex items-center justify-center transition cursor-pointer active:scale-95 min-h-[56px]"
                >
                  C
                </button>
                <button
                  onClick={() => handleDigit('0')}
                  disabled={!!successMessage}
                  className="h-14 bg-[#1e293b] hover:bg-slate-700 active:bg-emerald-600 active:text-white border border-slate-700 rounded-2xl text-xl font-black text-white flex items-center justify-center transition cursor-pointer active:scale-95 min-h-[56px]"
                >
                  0
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!!successMessage}
                  className="h-14 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-2xl flex items-center justify-center transition cursor-pointer active:scale-95 min-h-[56px]"
                >
                  <Delete size={22} />
                </button>
              </div>

              <div className="w-full flex items-center justify-center pt-1">
                <button
                  onClick={() => setView('menu')}
                  className="text-xs sm:text-sm text-slate-300 hover:text-white flex items-center gap-1.5 font-bold transition cursor-pointer min-h-[36px]"
                >
                  <ArrowLeft size={16} />
                  <span>Volver a roles</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#0b1120] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
            <span className="text-xs font-bold text-slate-300">Sistema Pollos & Sabor v1.2</span>
          </div>

          {onClose && activeProfile && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl transition cursor-pointer text-xs sm:text-sm border border-slate-700 min-h-[40px]"
            >
              Cancelar
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
