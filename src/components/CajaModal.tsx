import React, { useState } from 'react';
import { ActiveTable, PaymentReceipt } from '../types';
import { formatCOP } from '../data/menu';
import { posAudio } from '../utils/audio';
import { X, Check, DollarSign, CreditCard, Smartphone, Percent, Printer, User, Wallet, CheckCircle2 } from 'lucide-react';

interface CajaModalProps {
  table: ActiveTable;
  onClose: () => void;
  onCompletePayment: (receipt: PaymentReceipt) => void;
}

export const CajaModal: React.FC<CajaModalProps> = ({
  table,
  onClose,
  onCompletePayment,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'nequi' | 'daviplata' | 'tarjeta' | 'transferencia'>('efectivo');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [tipPercent, setTipPercent] = useState<number>(0);
  const [amountReceivedStr, setAmountReceivedStr] = useState<string>('');
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  const subtotal = table.items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const tipAmount = Math.round(((subtotal - discountAmount) * tipPercent) / 100);
  const total = subtotal - discountAmount + tipAmount;

  const amountReceived = parseFloat(amountReceivedStr.replace(/[^0-9]/g, '')) || 0;
  const change = Math.max(0, amountReceived - total);

  const handleFinish = () => {
    posAudio.playCashRegister();
    setShowSuccessToast(true);

    const receipt: PaymentReceipt = {
      id: `rec-${Date.now()}`,
      orderNumber: table.orderNumber || Math.floor(Math.random() * 900 + 100),
      tableLabel: table.label,
      items: table.items,
      subtotal,
      discount: discountAmount,
      tip: tipAmount,
      total,
      paymentMethod,
      amountReceived: paymentMethod === 'efectivo' ? amountReceived : total,
      change: paymentMethod === 'efectivo' ? change : 0,
      closedAt: Date.now(),
      waiterName: table.waiterName || 'Mesero 1',
      customerName: table.customerName,
    };

    setTimeout(() => {
      onCompletePayment(receipt);
    }, 850);
  };

  const quickCashShortcuts = [
    total,
    Math.ceil(total / 10000) * 10000,
    Math.ceil(total / 20000) * 20000,
    50000,
    100000,
  ].filter((v, i, a) => v >= total && a.indexOf(v) === i);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-3 select-none font-sans">
      <div className="bg-[#1e293b] text-white rounded-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh] border border-slate-700">
        {/* Header */}
        <div className="bg-[#0b1120] text-white px-4 sm:px-5 py-3.5 sm:py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div>
            <span className="text-emerald-400 font-black text-xs uppercase tracking-wider block">
              Cobro en Caja
            </span>
            <h2 className="text-base sm:text-lg font-black text-white">{table.label}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer border border-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-sm flex-1 bg-[#0f172a]">
          {/* Waiter Responsibility Banner */}
          <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-xs border border-slate-700">
                <User size={16} />
              </div>
              <div>
                <span className="font-black text-xs sm:text-sm text-slate-200">
                  Mesero: {table.waiterName || 'Mesero 1'}
                </span>
              </div>
            </div>
            {table.orderNumber && (
              <span className="text-xs font-mono font-black text-amber-400 bg-[#0f172a] px-2.5 py-1 rounded-md border border-slate-700">
                Orden #{table.orderNumber}
              </span>
            )}
          </div>

          {/* Order Summary Breakdown */}
          <div className="bg-[#1e293b] p-3.5 sm:p-4 rounded-xl border border-slate-700 space-y-1.5 text-xs sm:text-sm">
            <div className="flex justify-between text-slate-300 font-bold">
              <span>Subtotal:</span>
              <span className="font-black text-white">{formatCOP(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-red-400 font-bold">
                <span>Descuento ({discountPercent}%):</span>
                <span className="font-black">-{formatCOP(discountAmount)}</span>
              </div>
            )}
            {tipAmount > 0 && (
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Propina ({tipPercent}%):</span>
                <span className="font-black">+{formatCOP(tipAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm sm:text-base font-black text-white pt-2 border-t border-slate-700">
              <span className="tracking-wide">TOTAL A COBRAR:</span>
              <span className="text-emerald-400 text-xl sm:text-2xl font-black">{formatCOP(total)}</span>
            </div>
          </div>

          {/* Quick Tip & Discount options */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-300 uppercase mb-1.5">
                Propina
              </label>
              <div className="flex gap-1.5">
                {[0, 5, 10].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipPercent(t)}
                    className={`flex-1 py-2 text-xs sm:text-sm font-black rounded-xl border transition cursor-pointer min-h-[42px] ${
                      tipPercent === t
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-[#1e293b] text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {t === 0 ? '0%' : `${t}%`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-300 uppercase mb-1.5">
                Descuento
              </label>
              <div className="flex gap-1.5">
                {[0, 5, 10, 15].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDiscountPercent(d)}
                    className={`flex-1 py-2 text-xs sm:text-sm font-black rounded-xl border transition cursor-pointer min-h-[42px] ${
                      discountPercent === d
                        ? 'bg-red-600 text-white border-red-500'
                        : 'bg-[#1e293b] text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {d === 0 ? '0%' : `${d}%`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs sm:text-sm font-black text-slate-200 uppercase mb-2">
              Método de Pago
            </label>
            <div className="grid grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('efectivo')}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 font-black text-xs transition cursor-pointer min-h-[64px] justify-center active:scale-95 ${
                  paymentMethod === 'efectivo'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-[#1e293b] text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <DollarSign size={20} />
                <span className="text-xs">Efectivo</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('nequi')}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 font-black text-xs transition cursor-pointer min-h-[64px] justify-center active:scale-95 ${
                  paymentMethod === 'nequi'
                    ? 'bg-purple-700 text-white border-purple-600'
                    : 'bg-[#1e293b] text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <Smartphone size={20} />
                <span className="text-xs">Nequi</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('daviplata')}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 font-black text-xs transition cursor-pointer min-h-[64px] justify-center active:scale-95 ${
                  paymentMethod === 'daviplata'
                    ? 'bg-red-700 text-white border-red-600'
                    : 'bg-[#1e293b] text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <Smartphone size={20} />
                <span className="text-xs">Daviplata</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('tarjeta')}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 font-black text-xs transition cursor-pointer min-h-[64px] justify-center active:scale-95 ${
                  paymentMethod === 'tarjeta'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-[#1e293b] text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <CreditCard size={20} />
                <span className="text-xs">Datáfono</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('transferencia')}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 font-black text-xs transition cursor-pointer min-h-[64px] justify-center active:scale-95 ${
                  paymentMethod === 'transferencia'
                    ? 'bg-cyan-700 text-white border-cyan-600'
                    : 'bg-[#1e293b] text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <Wallet size={20} />
                <span className="text-xs">Transf.</span>
              </button>
            </div>
          </div>

          {/* Cash Change Calculator */}
          {paymentMethod === 'efectivo' && (
            <div className="bg-[#1e293b] p-3.5 sm:p-4 rounded-xl border border-emerald-600/50 space-y-2.5">
              <label className="block text-xs sm:text-sm font-black text-emerald-300 uppercase">
                Monto Recibido
              </label>
              <input
                type="text"
                placeholder={`Ej: ${formatCOP(total)}`}
                value={amountReceivedStr}
                onChange={(e) => setAmountReceivedStr(e.target.value)}
                className="w-full px-4 py-2.5 text-sm sm:text-base font-black bg-[#0f172a] border border-slate-600 rounded-xl text-white focus:outline-hidden focus:border-emerald-500 min-h-[44px]"
              />

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                {quickCashShortcuts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmountReceivedStr(amt.toString())}
                    className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-emerald-300 rounded-xl text-xs sm:text-sm font-black hover:bg-slate-700 transition cursor-pointer active:scale-95 min-h-[38px]"
                  >
                    {formatCOP(amt)}
                  </button>
                ))}
              </div>

              {amountReceived >= total && (
                <div className="pt-2.5 border-t border-slate-700 flex justify-between items-center">
                  <span className="font-black text-xs sm:text-sm text-slate-300 uppercase">
                    Cambio / Vueltas:
                  </span>
                  <span className="text-lg sm:text-xl font-black text-emerald-400">
                    {formatCOP(change)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <div className="p-4 bg-[#0b1120] border-t border-slate-800 flex gap-2.5 shrink-0 relative">
          {showSuccessToast && (
            <div className="absolute inset-0 bg-emerald-600 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 rounded-b-2xl z-20">
              <CheckCircle2 size={24} className="text-white" />
              <span>✓ Pago Registrado con Éxito</span>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={showSuccessToast}
            className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-xs sm:text-sm transition cursor-pointer min-h-[48px] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleFinish}
            disabled={showSuccessToast}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition cursor-pointer min-h-[48px] disabled:opacity-50 border border-emerald-500"
          >
            <Check size={18} />
            Confirmar Pago ({formatCOP(total)})
          </button>
        </div>
      </div>
    </div>
  );
};
