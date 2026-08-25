import React from 'react';
import { ActiveTable, OrderItem } from '../types';
import { formatCOP } from '../data/menu';
import { X, Printer, Flame, Receipt, Zap } from 'lucide-react';

interface TicketModalProps {
  type?: 'cocina' | 'precuenta' | 'unico';
  table: ActiveTable;
  itemsToPrint?: OrderItem[];
  orderNumber?: number;
  waiterName?: string;
  isAddition?: boolean;
  roundNumber?: number;
  onClose: () => void;
  onPrinted?: () => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  type = 'unico',
  table,
  itemsToPrint,
  orderNumber = 1,
  waiterName = 'Mesero',
  isAddition = false,
  roundNumber = 1,
  onClose,
  onPrinted,
}) => {
  const items = itemsToPrint && itemsToPrint.length > 0 ? itemsToPrint : table.items;
  const itemsSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const entireTableTotal = table.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const handlePrint = () => {
    window.print();
    if (onPrinted) {
      onPrinted();
    }
  };

  const getCleanTicketNote = (note?: string): string => {
    if (!note) return '';
    return note
      .replace(/\[PARA LLEVAR\]/gi, '')
      .replace(/\[EMPACAR\]/gi, '')
      .replace(/^,\s*|,\s*$/g, '')
      .replace(/,\s*,/g, ',')
      .trim();
  };

  // Extract table number (e.g. "Mesa 12" -> "12" or "MESA 12")
  const tableNumStr = table.label.replace(/mesa\s*/i, '').trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-3 select-none">
      <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden flex flex-col max-h-[90vh] border border-slate-700">
        {/* Modal Controls Bar */}
        <div className="px-4 py-3.5 bg-[#0b1120] text-white flex items-center justify-between shrink-0 no-print border-b border-slate-800">
          <div className="font-black text-sm flex items-center gap-2">
            {isAddition ? (
              <span className="text-amber-400 font-black flex items-center gap-2 uppercase tracking-wider text-xs sm:text-sm">
                <Zap size={18} />
                <span>Ticket Adición #{roundNumber}</span>
              </span>
            ) : (
              <span className="text-orange-400 font-black flex items-center gap-2 uppercase tracking-wider text-xs sm:text-sm">
                <Receipt size={18} />
                <span>Comanda / Precuenta</span>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer transition active:scale-95 border border-slate-700"
            title="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Printable Thermal Receipt (58mm / 80mm Compatible) */}
        <div
          id="printable-ticket"
          className="p-5 font-mono text-slate-900 bg-white overflow-y-auto flex-1 text-xs leading-tight"
        >
          {/* 1. ENCABEZADO */}
          <div className="text-center pb-2">
            <h1 className="text-base font-black tracking-wider uppercase leading-tight">
              POLLOS & SABOR
            </h1>
            <p className="text-[10px] text-slate-600 font-medium">
              NIT: 901.234.567-8 | TEL: 315 313 4721
            </p>
          </div>

          <div className="border-t border-dashed border-slate-900 my-1" />

          {/* Si es adición posterior a una mesa */}
          {isAddition && (
            <div className="text-center font-black text-xs uppercase py-1 bg-slate-100 rounded my-1">
              *** ADICIÓN #{roundNumber} - MESA {tableNumStr || table.label} ***
            </div>
          )}

          <div className="py-1 text-[11px] space-y-1">
            <div className="flex justify-between items-baseline font-black">
              <span className="text-sm uppercase tracking-wide">
                MESA: <span className="text-base font-black">{tableNumStr || table.label}</span>
              </span>
              <span className="text-xs">
                ORDEN: #{orderNumber}
              </span>
            </div>
            <div className="flex justify-between text-slate-700 text-[10px] font-medium pt-0.5">
              <span>Mesero: <strong className="text-slate-900">{waiterName}</strong></span>
              <span>Hora: {timeStr}</span>
            </div>

            {table.customerName && (
              <div className="text-slate-800 font-bold text-[10px] pt-0.5">
                Cliente: {table.customerName}
              </div>
            )}
            {table.address && (
              <div className="text-slate-800 text-[10px]">
                Dirección: {table.address}
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-slate-900 my-1" />

          {/* 2. CUERPO DE PRODUCTOS (Línea compacta con precio y notas de cocina) */}
          <div className="py-1 space-y-2">
            {items.map((item, idx) => {
              // Build single-line item name without duplicate combo labels
              let displayName = item.name;
              if (item.isCombo) {
                const drinkChoice = item.comboNote
                  ? item.comboNote.toLowerCase().includes('limonada')
                    ? 'Limonada'
                    : 'Gaseosa'
                  : 'Gaseosa';
                
                if (!displayName.toLowerCase().includes('combo')) {
                  displayName = `${displayName} (Combo ${drinkChoice})`;
                }
              }

              const itemTotalCOP = formatCOP(item.price * item.quantity);
              const cleanNote = getCleanTicketNote(item.note);
              const isTakeaway = item.isTakeaway || item.note?.toUpperCase().includes('PARA LLEVAR');

              return (
                <div key={idx} className="space-y-0.5">
                  {/* Single compact line: 1x Name ..... $Price */}
                  <div className="flex items-baseline justify-between text-[11px] font-bold">
                    <span className="shrink-0 mr-1 font-black">{item.quantity}x</span>
                    <span className="flex-1 truncate pr-1">{displayName}</span>
                    <span className="shrink-0 font-mono font-black">{itemTotalCOP}</span>
                  </div>

                  {/* 3. NOTAS DE PREPARACIÓN PARA COCINA */}
                  {Boolean(cleanNote || item.term) && (
                    <div className="text-[10px] font-black text-slate-800 pl-4">
                      &gt;&gt; NOTA: {[item.term ? `Término ${item.term}` : '', cleanNote].filter(Boolean).join(', ')}
                    </div>
                  )}

                  {isTakeaway && (
                    <div className="text-[10px] font-black text-slate-900 pl-4 uppercase">
                      &gt;&gt; [PARA LLEVAR / EMPACAR]
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t border-dashed border-slate-900 my-1" />

          {/* 4. TOTALES Y ADICIONES */}
          <div className="py-1 space-y-1">
            {isAddition ? (
              <div className="space-y-1 text-[11px] font-bold">
                <div className="flex justify-between items-baseline">
                  <span>SUBTOTAL ADICIÓN:</span>
                  <span className="font-mono">{formatCOP(itemsSubtotal)}</span>
                </div>
                <div className="flex justify-between items-baseline text-sm font-black border-t border-slate-300 pt-1">
                  <span>NUEVO TOTAL MESA:</span>
                  <span className="font-mono text-base">{formatCOP(entireTableTotal)}</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-baseline text-sm font-black py-0.5">
                <span className="tracking-wide">TOTAL A PAGAR:</span>
                <span className="font-mono text-base font-black">{formatCOP(itemsSubtotal)}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-slate-900 my-1" />

          {/* 5. PIE DE TICKET */}
          <div className="text-center pt-2 pb-1 space-y-1 text-slate-700">
            <p className="text-xs font-bold">Gracias por su visita</p>
            <p className="text-[9px] text-slate-500 font-mono">
              REF-M{tableNumStr || table.id.replace(/\s+/g, '')}-{orderNumber}
            </p>
          </div>
        </div>

        {/* Modal Footer (No-print) */}
        <div className="p-4 bg-[#0b1120] border-t border-slate-800 flex gap-3 no-print shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black rounded-xl text-xs sm:text-sm transition cursor-pointer min-h-[46px] border border-slate-700"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 border border-orange-500 min-h-[46px]"
          >
            <Printer size={18} /> Imprimir Ticket
          </button>
        </div>
      </div>
    </div>
  );
};

