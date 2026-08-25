import React, { useState } from 'react';
import { OrderItem } from '../types';
import { posAudio } from '../utils/audio';
import {
  Trash2,
  AlertOctagon,
  X,
  Check,
  ChefHat,
  Ban,
  UtensilsCrossed,
  AlertTriangle,
} from 'lucide-react';

interface AdminItemVoidModalProps {
  item: OrderItem;
  tableLabel: string;
  onClose: () => void;
  onConfirmVoid: (itemId: string, reason: string) => void;
}

const VOID_REASONS = [
  'Error de digitación del mesero',
  'Cliente canceló el plato',
  'Cambio de plato a petición del cliente',
  'Demora excesiva en cocina',
  'Plato / insumo agotado',
  'Plato duplicado por error',
];

export const AdminItemVoidModal: React.FC<AdminItemVoidModalProps> = ({
  item,
  tableLabel,
  onClose,
  onConfirmVoid,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(VOID_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');

  const totalDeducted = item.price * item.quantity;

  const handleConfirm = () => {
    posAudio.playVoidAlert();
    const finalReason = customReason.trim() || selectedReason;
    onConfirmVoid(item.id, finalReason);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-2 sm:p-3 select-none font-sans">
      <div className="bg-[#1e293b] border border-slate-700 rounded-2xl w-full max-w-lg text-white overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 bg-[#0b1120] border-b border-red-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-950 border border-red-700 flex items-center justify-center text-red-400 shrink-0">
              <AlertOctagon size={20} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase text-white tracking-wide flex items-center gap-1.5">
                Anular Ítem
              </h2>
              <p className="text-xs sm:text-sm text-red-300 font-bold">
                {tableLabel}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer border border-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 bg-[#0f172a]">
          {/* Target Item Card */}
          <div className="p-3.5 rounded-xl bg-[#1e293b] border border-slate-700 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="bg-red-600 text-white font-black text-xs sm:text-sm px-2.5 py-0.5 rounded-md">
                  {item.quantity}x
                </span>
                <strong className="text-sm sm:text-base font-black text-white">{item.name}</strong>
              </div>
              {item.isCombo && (
                <span className="text-xs text-cyan-400 font-bold flex items-center gap-1 mt-1">
                  <UtensilsCrossed size={13} className="inline" />
                  <span>Combo Especial</span>
                </span>
              )}
              {item.note && (
                <span className="text-xs text-slate-300 block mt-1 font-medium">Nota: {item.note}</span>
              )}
            </div>

            <div className="text-right shrink-0">
              <span className="text-base sm:text-lg font-black text-red-400 block">
                -${totalDeducted.toLocaleString('es-CO')}
              </span>
              <span className="text-xs text-slate-400 font-bold">Deducción</span>
            </div>
          </div>

          {/* Kitchen sync warning */}
          {item.sentToKitchen && (
            <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-600 text-amber-200 text-xs sm:text-sm flex items-start gap-2.5">
              <ChefHat size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-black text-amber-300 flex items-center gap-1.5 mb-0.5">
                  <AlertTriangle size={14} className="text-amber-400" />
                  <span>Plato en Cocina</span>
                </strong>
                Se notificará inmediatamente a cocina sobre la anulación para detener la preparación.
              </div>
            </div>
          )}

          {/* Motivo de Anulación */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-black uppercase text-slate-300 tracking-wider flex items-center gap-2">
              <Ban size={16} className="text-red-400" />
              Motivo de Anulación
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {VOID_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    posAudio.playClick();
                    setSelectedReason(r);
                  }}
                  className={`p-3 rounded-xl text-xs sm:text-sm font-black text-left border transition cursor-pointer flex items-center justify-between min-h-[44px] ${
                    selectedReason === r
                      ? 'bg-red-950 border-red-500 text-red-200'
                      : 'bg-[#1e293b] hover:bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <span className="line-clamp-2">{r}</span>
                  {selectedReason === r && <Check size={18} className="text-red-400 shrink-0 ml-1" />}
                </button>
              ))}
            </div>

            {/* Custom Reason Note */}
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Observaciones o detalle adicional..."
              className="w-full mt-2 px-4 py-2.5 bg-[#1e293b] border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-red-500 font-bold min-h-[44px]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#0b1120] border-t border-slate-800 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-xs sm:text-sm transition cursor-pointer min-h-[46px] border border-slate-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 transition cursor-pointer min-h-[46px] border border-red-500"
          >
            <Trash2 size={18} />
            Confirmar Anulación
          </button>
        </div>
      </div>
    </div>
  );
};
