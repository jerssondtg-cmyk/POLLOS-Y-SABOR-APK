import React from 'react';
import { MenuItem } from '../types';
import { formatCOP } from '../data/menu';
import { posAudio } from '../utils/audio';
import { X, Sparkles, CupSoda, Citrus, UtensilsCrossed } from 'lucide-react';

interface ComboDrinkModalProps {
  item: MenuItem;
  onSelectDrink: (drinkChoice: 'Gaseosa' | 'Limonada Natural') => void;
  onClose: () => void;
}

export const ComboDrinkModal: React.FC<ComboDrinkModalProps> = ({
  item,
  onSelectDrink,
  onClose,
}) => {
  const comboPrice = item.comboExtra || 8000;
  const totalPrice = item.price + comboPrice;

  const handleSelect = (drink: 'Gaseosa' | 'Limonada Natural') => {
    posAudio.playAddBeep();
    onSelectDrink(drink);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 font-sans select-none">
      <div className="bg-[#0f172a] border border-slate-700 rounded-xl w-full max-w-md text-white overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header - Flat, direct */}
        <div className="px-4 py-3.5 bg-[#1e293b] border-b border-slate-700 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">
              Combo ({item.name})
            </h2>
            <p className="text-xs text-amber-400 font-bold">
              +{formatCOP(comboPrice)} • Total: {formatCOP(totalPrice)}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-11 h-11 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200 hover:text-white transition cursor-pointer border border-slate-600 active:scale-95"
            title="Cerrar"
          >
            <X size={26} />
          </button>
        </div>

        {/* 2 Big Touch Beverage Buttons */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-[#0f172a]">
          <div className="grid grid-cols-2 gap-3">
            {/* Button 1: GASEOSA */}
            <button
              type="button"
              onClick={() => handleSelect('Gaseosa')}
              className="p-5 rounded-xl bg-[#1e293b] border border-slate-700 hover:border-orange-500 active:scale-95 transition cursor-pointer flex flex-col items-center justify-center text-center min-h-[140px]"
            >
              <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-orange-400 mb-3">
                <CupSoda size={36} />
              </div>
              <strong className="text-base font-black text-white tracking-wide block">
                GASEOSA
              </strong>
            </button>

            {/* Button 2: LIMONADA NATURAL */}
            <button
              type="button"
              onClick={() => handleSelect('Limonada Natural')}
              className="p-5 rounded-xl bg-[#1e293b] border border-slate-700 hover:border-orange-500 active:scale-95 transition cursor-pointer flex flex-col items-center justify-center text-center min-h-[140px]"
            >
              <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 mb-3">
                <Citrus size={36} />
              </div>
              <strong className="text-base font-black text-white tracking-wide block">
                LIMONADA
              </strong>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#1e293b] border-t border-slate-700 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-black text-sm transition cursor-pointer min-h-[44px] border border-slate-600"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
