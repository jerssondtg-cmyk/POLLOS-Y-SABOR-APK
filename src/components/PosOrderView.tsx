import React, { useState, useMemo } from 'react';
import { ActiveTable, CategoryType, MenuItem, OrderItem, TableStatus, UserProfile } from '../types';
import { CATEGORIES, MENU_ITEMS, formatCOP, QUICK_NOTES } from '../data/menu';
import { posAudio } from '../utils/audio';
import { ItemOptionsModal } from './ItemOptionsModal';
import { TicketModal } from './TicketModal';
import { CajaModal } from './CajaModal';
import { AdminItemEditModal } from './AdminItemEditModal';
import { AdminItemVoidModal } from './AdminItemVoidModal';
import { ComboDrinkModal } from './ComboDrinkModal';
import { NetworkSyncBadge } from './NetworkSyncBadge';
import {
  ArrowLeft,
  Search,
  Plus,
  Minus,
  Trash2,
  ChefHat,
  Flame,
  Printer,
  CreditCard,
  X,
  SlidersHorizontal,
  FileEdit,
  Tag,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  User,
  ShieldCheck,
  RefreshCw,
  Edit3,
  Ban,
  ShieldAlert,
  Package,
  Receipt,
} from 'lucide-react';

interface PosOrderViewProps {
  table: ActiveTable;
  currentUser?: UserProfile;
  waiterName?: string;
  onOpenRoleSelector?: () => void;
  onExitToGatekeeper?: () => void;
  onBackToTables: () => void;
  onUpdateTableItems: (tableId: string, items: OrderItem[]) => void;
  onUpdateTableStatus?: (tableId: string, status: TableStatus) => void;
  onSendToKitchen: (table: ActiveTable, items: OrderItem[]) => void;
  onCompletePayment: (receipt: any) => void;
  onVoidItemByAdmin?: (tableId: string, itemId: string, reason: string) => void;
  onModifyItemByAdmin?: (tableId: string, updatedItem: OrderItem) => void;
}

export const PosOrderView: React.FC<PosOrderViewProps> = ({
  table,
  currentUser,
  waiterName,
  onOpenRoleSelector,
  onExitToGatekeeper,
  onBackToTables,
  onUpdateTableItems,
  onUpdateTableStatus,
  onSendToKitchen,
  onCompletePayment,
  onVoidItemByAdmin,
  onModifyItemByAdmin,
}) => {
  const [selectedCat, setSelectedCat] = useState<CategoryType | 'Todos'>('Pollos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemForModal, setSelectedItemForModal] = useState<MenuItem | null>(null);
  const [selectedItemForComboModal, setSelectedItemForComboModal] = useState<MenuItem | null>(null);
  const [ticketModalType, setTicketModalType] = useState<'cocina' | 'precuenta' | null>(null);
  const [ticketItemsToPrint, setTicketItemsToPrint] = useState<OrderItem[] | undefined>(undefined);
  const [ticketIsAddition, setTicketIsAddition] = useState<boolean>(false);
  const [ticketRoundNumber, setTicketRoundNumber] = useState<number>(1);
  const [showCajaModal, setShowCajaModal] = useState(false);
  const [customerNameInput, setCustomerNameInput] = useState(table.customerName || '');
  const [deliveryAddressInput, setDeliveryAddressInput] = useState(table.address || '');

  // Admin Item Edit & Void Modal States
  const [itemToEdit, setItemToEdit] = useState<OrderItem | null>(null);
  const [itemToVoid, setItemToVoid] = useState<OrderItem | null>(null);
  const [showMobileComandaModal, setShowMobileComandaModal] = useState(false);

  const isCashier = currentUser?.role === 'caja';

  // Split table items into unsent (draft / addition) and sent (already transmitted)
  const unsentItems = useMemo(
    () => table.items.filter((it) => !it.sentToKitchen),
    [table.items]
  );
  const sentItems = useMemo(
    () => table.items.filter((it) => it.sentToKitchen),
    [table.items]
  );

  const totalItemsCount = useMemo(
    () => table.items.reduce((s, it) => s + it.quantity, 0),
    [table.items]
  );
  const totalOrderPrice = useMemo(
    () => table.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [table.items]
  );

  const isAdditionOrder = sentItems.length > 0;
  const currentRound = (table.currentRound || 1) + (isAdditionOrder ? 1 : 0);

  // Filter items by category & search query
  // Helper to get clean note without [PARA LLEVAR] tags or trailing commas
  const getCleanNote = (note?: string): string => {
    if (!note) return '';
    return note
      .replace(/\[PARA LLEVAR\]/gi, '')
      .replace(/^,\s*|,\s*$/g, '')
      .replace(/,\s*,/g, ',')
      .trim();
  };

  const filteredProducts = useMemo(() => {
    return MENU_ITEMS.filter((item) => {
      if (selectedCat !== 'Todos' && item.cat !== selectedCat) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.desc.toLowerCase().includes(q);
        const matchesTags = item.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesTags) return false;
      }
      return true;
    });
  }, [selectedCat, searchQuery]);

  // Quick add item directly
  const handleQuickAdd = (item: MenuItem, isCombo: boolean = false) => {
    // If it's a combo request, route to the quick beverage selector modal
    if (isCombo) {
      setSelectedItemForComboModal(item);
      return;
    }

    posAudio.playAddBeep();
    const unitPrice = item.price;
    const itemName = item.name;

    // Check if an UNSENT duplicate item exists with same name and no custom notes
    const existingUnsentIndex = table.items.findIndex(
      (it) =>
        !it.sentToKitchen &&
        it.menuItemId === item.id &&
        !it.isCombo &&
        !it.note &&
        !it.term
    );

    let updatedItems: OrderItem[];
    if (existingUnsentIndex > -1) {
      updatedItems = [...table.items];
      updatedItems[existingUnsentIndex] = {
        ...updatedItems[existingUnsentIndex],
        quantity: updatedItems[existingUnsentIndex].quantity + 1,
      };
    } else {
      const newItem: OrderItem = {
        id: `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        menuItemId: item.id,
        name: itemName,
        desc: item.desc,
        price: unitPrice,
        quantity: 1,
        isCombo: false,
        note: '',
        area: item.area,
        timestamp: Date.now(),
        sentToKitchen: false,
        round: currentRound,
      };
      updatedItems = [...table.items, newItem];
    }

    onUpdateTableItems(table.id, updatedItems);
  };

  // Add Combo Item with 1-touch selected drink
  const handleConfirmComboWithDrink = (
    item: MenuItem,
    drinkChoice: 'Gaseosa' | 'Limonada Natural'
  ) => {
    posAudio.playAddBeep();
    const comboPriceAddition = item.comboExtra || 8000;
    const unitPrice = item.price + comboPriceAddition;
    const itemName = `${item.name} (COMBO: Papa Francesa + ${drinkChoice})`;
    const comboNote = `Papa Francesa + ${drinkChoice}`;

    // Check if duplicate unsent combo with same drink exists
    const existingUnsentIndex = table.items.findIndex(
      (it) =>
        !it.sentToKitchen &&
        it.menuItemId === item.id &&
        it.isCombo === true &&
        it.beverageType === drinkChoice &&
        !it.note &&
        !it.term
    );

    let updatedItems: OrderItem[];
    if (existingUnsentIndex > -1) {
      updatedItems = [...table.items];
      updatedItems[existingUnsentIndex] = {
        ...updatedItems[existingUnsentIndex],
        quantity: updatedItems[existingUnsentIndex].quantity + 1,
      };
    } else {
      const newItem: OrderItem = {
        id: `${item.id}-combo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        menuItemId: item.id,
        name: itemName,
        desc: item.desc,
        price: unitPrice,
        quantity: 1,
        isCombo: true,
        comboNote,
        beverageType: drinkChoice,
        note: '',
        area: item.area,
        timestamp: Date.now(),
        sentToKitchen: false,
        round: currentRound,
      };
      updatedItems = [...table.items, newItem];
    }

    onUpdateTableItems(table.id, updatedItems);
    setSelectedItemForComboModal(null);
  };

  // Add customized item from modal
  const handleAddCustomizedItem = (customItem: OrderItem) => {
    posAudio.playAddBeep();
    const itemToAdd: OrderItem = {
      ...customItem,
      sentToKitchen: false,
      round: currentRound,
    };
    const updatedItems = [...table.items, itemToAdd];
    onUpdateTableItems(table.id, updatedItems);
    setSelectedItemForModal(null);
  };

  // Admin Direct Quantity Change (+ / -) for any item
  const handleAdminQuantityChange = (item: OrderItem, delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      // If item is not yet sent to kitchen (taking order), delete immediately with zero friction
      if (!item.sentToKitchen) {
        posAudio.playRemove();
        const updatedItems = table.items.filter((it) => it.id !== item.id);
        onUpdateTableItems(table.id, updatedItems);
        return;
      }

      // Prompt void confirmation modal ONLY for items already sent to kitchen
      setItemToVoid(item);
      return;
    }

    posAudio.playClick();
    const updated: OrderItem = {
      ...item,
      quantity: newQty,
      isModified: item.sentToKitchen ? true : item.isModified,
      modifiedAt: item.sentToKitchen ? Date.now() : item.modifiedAt,
    };

    if (onModifyItemByAdmin && item.sentToKitchen) {
      onModifyItemByAdmin(table.id, updated);
    } else {
      const updatedItems = table.items.map((it) => (it.id === item.id ? updated : it));
      onUpdateTableItems(table.id, updatedItems);
    }
  };

  // Admin Save Edited Item (Substitution / Combos / Notes / Quantities)
  const handleSaveEditedItem = (updatedItem: OrderItem) => {
    if (onModifyItemByAdmin && updatedItem.sentToKitchen) {
      onModifyItemByAdmin(table.id, updatedItem);
    } else {
      const updatedItems = table.items.map((it) => (it.id === updatedItem.id ? updatedItem : it));
      onUpdateTableItems(table.id, updatedItems);
    }
    setItemToEdit(null);
  };

  // Admin Confirm Void Item
  const handleConfirmVoid = (itemId: string, reason: string) => {
    if (onVoidItemByAdmin) {
      onVoidItemByAdmin(table.id, itemId, reason);
    } else {
      const updatedItems = table.items.filter((it) => it.id !== itemId);
      onUpdateTableItems(table.id, updatedItems);
    }
    setItemToVoid(null);
  };

  // Adjust quantity (+ / -) for unsent item (Mesero mode)
  const handleUpdateUnsentQuantity = (itemId: string, delta: number) => {
    const itemIndex = table.items.findIndex((it) => it.id === itemId);
    if (itemIndex === -1) return;

    const updatedItems = [...table.items];
    const newQty = updatedItems[itemIndex].quantity + delta;
    if (newQty <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    posAudio.playClick();
    updatedItems[itemIndex] = { ...updatedItems[itemIndex], quantity: newQty };
    onUpdateTableItems(table.id, updatedItems);
  };

  // Add another of an already sent item (creates a new addition item)
  const handleAddAnotherOfSentItem = (sentItem: OrderItem) => {
    posAudio.playAddBeep();
    const newAdditionItem: OrderItem = {
      id: `${sentItem.menuItemId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      menuItemId: sentItem.menuItemId,
      name: sentItem.name,
      desc: sentItem.desc,
      price: sentItem.price,
      quantity: 1,
      isCombo: sentItem.isCombo,
      comboNote: sentItem.comboNote,
      note: sentItem.note,
      term: sentItem.term,
      area: sentItem.area,
      timestamp: Date.now(),
      sentToKitchen: false,
      round: currentRound,
    };

    const updatedItems = [...table.items, newAdditionItem];
    onUpdateTableItems(table.id, updatedItems);
  };

  // Remove item by ID
  const handleRemoveItem = (itemId: string, isSent: boolean = false) => {
    if (isSent) {
      const confirmVoid = window.confirm(
        'Este producto YA fue enviado a cocina.\n¿Está seguro de anularlo del pedido?'
      );
      if (!confirmVoid) return;
    }
    posAudio.playRemove();
    const updatedItems = table.items.filter((it) => it.id !== itemId);
    onUpdateTableItems(table.id, updatedItems);
  };

  // Update item note text
  const handleUpdateNote = (itemId: string, note: string) => {
    const itemIndex = table.items.findIndex((it) => it.id === itemId);
    if (itemIndex === -1) return;
    const updatedItems = [...table.items];
    updatedItems[itemIndex] = { ...updatedItems[itemIndex], note };
    onUpdateTableItems(table.id, updatedItems);
  };

  // Append quick note tag to item
  const handleAppendQuickNote = (itemId: string, quickTag: string) => {
    posAudio.playClick();
    const currentItem = table.items.find((it) => it.id === itemId);
    if (!currentItem) return;
    const currentNote = currentItem.note || '';
    const newNote = currentNote
      ? currentNote.includes(quickTag)
        ? currentNote
        : `${currentNote}, ${quickTag}`
      : quickTag;
    handleUpdateNote(itemId, newNote);
  };

  const unsentSubtotal = unsentItems.reduce(
    (sum, it) => sum + it.price * it.quantity,
    0
  );

  // Send to kitchen handler
  const handleSendOrder = () => {
    if (unsentItems.length === 0) {
      if (sentItems.length > 0) {
        // All items already sent, offer ticket reprint
        setTicketItemsToPrint(sentItems);
        setTicketIsAddition(false);
        setTicketRoundNumber(table.currentRound || 1);
        setTicketModalType('cocina');
        return;
      }
      alert('¡Agregue al menos un producto al pedido antes de enviar a cocina!');
      return;
    }

    posAudio.playKitchenSend();

    const isAddition = sentItems.length > 0;
    const roundNumber = isAddition ? (table.currentRound || 1) + 1 : 1;

    // Send only unsent items
    onSendToKitchen(
      {
        ...table,
        customerName: customerNameInput || table.customerName,
        address: deliveryAddressInput || table.address,
      },
      unsentItems
    );

    // Open ticket modal with the newly sent batch
    setTicketItemsToPrint(unsentItems);
    setTicketIsAddition(isAddition);
    setTicketRoundNumber(roundNumber);
    setTicketModalType('cocina');
  };

  const handleBack = () => {
    posAudio.playClick();
    onBackToTables();
  };

  const renderComandaContent = (isMobileDrawer: boolean = false) => (
    <div className="flex flex-col h-full overflow-hidden bg-[#0f172a]">
      {/* Flat Header of Comanda */}
      <div className="px-4 py-3 bg-[#1e293b] border-b border-slate-700 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <Receipt size={22} className="text-orange-400 shrink-0" />
          <h2 className="font-black text-base sm:text-lg text-white">
            {isMobileDrawer ? `Comanda • ${table.label}` : 'Comanda'}
          </h2>
          <span className="bg-slate-800 text-orange-400 border border-slate-700 px-2.5 py-0.5 rounded-md text-xs font-black">
            {totalItemsCount}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {table.customerName && (
            <span className="text-xs sm:text-sm text-slate-300 font-bold truncate max-w-[140px]">
              {table.customerName}
            </span>
          )}
          {isMobileDrawer && (
            <button
              type="button"
              onClick={() => setShowMobileComandaModal(false)}
              className="w-11 h-11 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white flex items-center justify-center cursor-pointer transition border border-slate-600"
              title="Cerrar comanda"
            >
              <X size={24} />
            </button>
          )}
        </div>
      </div>

      {/* Domicilio Customer Info Bar if applicable */}
      {table.type === 'domicilio' && (
        <div className="p-3 bg-[#1e293b] border-b border-slate-700 grid grid-cols-2 gap-2 text-xs shrink-0">
          <input
            type="text"
            placeholder="Nombre cliente..."
            value={customerNameInput}
            onChange={(e) => setCustomerNameInput(e.target.value)}
            className="bg-[#0f172a] border border-slate-700 px-3 py-2.5 rounded-lg text-sm text-white focus:outline-hidden focus:border-orange-500 font-bold"
          />
          <input
            type="text"
            placeholder="Dirección / Tel..."
            value={deliveryAddressInput}
            onChange={(e) => setDeliveryAddressInput(e.target.value)}
            className="bg-[#0f172a] border border-slate-700 px-3 py-2.5 rounded-lg text-sm text-white focus:outline-hidden focus:border-orange-500 font-bold"
          />
        </div>
      )}

      {/* Comanda Items List - Clean, elegant & consistent */}
      <div
        id="carrito-lista"
        className="lista-items flex-1 overflow-y-auto bg-[#0f172a] p-3 sm:p-4 space-y-4"
      >
        {table.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 py-16 px-4">
            <ChefHat size={48} className="text-slate-600 mb-3" />
            <p className="font-black text-base text-slate-300">
              Sin platos seleccionados
            </p>
            <p className="text-sm text-slate-400 text-center max-w-[240px] mt-1 font-medium">
              Toca los productos del menú para añadirlos.
            </p>
          </div>
        ) : (
          <>
            {/* SECTION 1: UNSENT ITEMS (POR ENVIAR) */}
            {unsentItems.length > 0 && (
              <div className="space-y-2">
                {/* Header Banner - Subtle and clean */}
                <div className="px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Flame size={15} />
                    <span>Por Enviar a Cocina</span>
                  </span>
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-xs font-bold">
                    {unsentItems.reduce((s, it) => s + it.quantity, 0)} platos
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-2">
                  {unsentItems.map((item) => {
                    const cleanNote = getCleanNote(item.note);
                    const isTakeaway = item.isTakeaway || item.note?.includes('[PARA LLEVAR]');
                    const noteParts = cleanNote
                      ? cleanNote
                          .split(/[,•\n]+/)
                          .map((s) => s.trim())
                          .filter(Boolean)
                      : [];

                    return (
                      <div
                        key={item.id}
                        className="item-carrito bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-3.5 flex flex-col gap-2 transition hover:border-slate-700"
                      >
                        {/* Top Row: Qty badge, Dish Name, Price, and Stepper */}
                        <div className="flex items-center justify-between gap-3">
                          {/* Left: Quantity + Name */}
                          <div
                            onClick={() => {
                              posAudio.playClick();
                              setItemToEdit(item);
                            }}
                            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer select-none"
                            title="Toca para editar notas o detalles"
                          >
                            <span className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center shrink-0">
                              {item.quantity}x
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-base text-white hover:text-amber-400 transition truncate leading-snug">
                                {item.name}
                              </div>
                              <div className="text-xs font-semibold text-emerald-400 mt-0.5">
                                {formatCOP(item.price * item.quantity)}
                                {item.quantity > 1 && (
                                  <span className="text-slate-500 font-normal text-xs ml-1.5">
                                    ({formatCOP(item.price)} c/u)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Stepper Controls & Remove */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAdminQuantityChange(item, -1);
                                }}
                                className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-base flex items-center justify-center cursor-pointer transition"
                              >
                                -
                              </button>
                              <span className="w-7 text-center font-bold text-sm text-slate-200">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAdminQuantityChange(item, 1);
                                }}
                                className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-base flex items-center justify-center cursor-pointer transition"
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveItem(item.id, false);
                              }}
                              title="Quitar plato"
                              className="w-9 h-9 rounded-lg bg-slate-800/60 hover:bg-red-950/60 text-slate-400 hover:text-red-400 flex items-center justify-center transition cursor-pointer active:scale-95 border border-slate-800"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Bottom Row: Unified clean modifier pills */}
                        {(isTakeaway || item.isCombo || item.term || noteParts.length > 0) && (
                          <div
                            onClick={() => {
                              posAudio.playClick();
                              setItemToEdit(item);
                            }}
                            className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80 cursor-pointer"
                          >
                            {isTakeaway && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
                                <Package size={11} />
                                Llevar
                              </span>
                            )}
                            {item.isCombo && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded">
                                <Sparkles size={11} className="text-amber-400" />
                                {item.comboNote || 'Combo'}
                              </span>
                            )}
                            {item.term && (
                              <span className="inline-flex items-center text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded">
                                Término: {item.term}
                              </span>
                            )}
                            {noteParts.map((part, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/80 px-2 py-0.5 rounded"
                              >
                                {part}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION 2: SENT ITEMS (EN COCINA) */}
            {sentItems.length > 0 && (
              <div className="space-y-2">
                {/* Header Banner - Subtle and clean */}
                <div className="px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 size={15} />
                    <span>Ya en Cocina</span>
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-xs font-bold">
                    {sentItems.reduce((s, it) => s + it.quantity, 0)} platos
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-2">
                  {sentItems.map((item) => {
                    const cleanNote = getCleanNote(item.note);
                    const isTakeaway = item.isTakeaway || item.note?.includes('[PARA LLEVAR]');
                    const noteParts = cleanNote
                      ? cleanNote
                          .split(/[,•\n]+/)
                          .map((s) => s.trim())
                          .filter(Boolean)
                      : [];

                    return (
                      <div
                        key={item.id}
                        className="item-carrito bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-3.5 flex flex-col gap-2 transition hover:border-slate-700"
                      >
                        {/* Top Row: Qty badge, Dish Name, Price, and Stepper */}
                        <div className="flex items-center justify-between gap-3">
                          {/* Left: Quantity + Name */}
                          <div
                            onClick={() => {
                              posAudio.playClick();
                              setItemToEdit(item);
                            }}
                            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer select-none"
                            title="Toca para editar notas o detalles"
                          >
                            <span className="w-8 h-8 rounded-lg bg-emerald-600/90 text-white font-bold text-sm flex items-center justify-center shrink-0">
                              {item.quantity}x
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-base text-slate-200 hover:text-emerald-400 transition truncate leading-snug">
                                  {item.name}
                                </span>
                                {item.isModified && (
                                  <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded">
                                    Modificado
                                  </span>
                                )}
                              </div>
                              <div className="text-xs font-semibold text-emerald-400 mt-0.5">
                                {formatCOP(item.price * item.quantity)}
                                {item.quantity > 1 && (
                                  <span className="text-slate-500 font-normal text-xs ml-1.5">
                                    ({formatCOP(item.price)} c/u)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Stepper Controls & Void */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAdminQuantityChange(item, -1);
                                }}
                                className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-base flex items-center justify-center cursor-pointer transition"
                              >
                                -
                              </button>
                              <span className="w-7 text-center font-bold text-sm text-slate-200">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAdminQuantityChange(item, 1);
                                }}
                                className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-base flex items-center justify-center cursor-pointer transition"
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                posAudio.playClick();
                                setItemToVoid(item);
                              }}
                              title="Anular plato de cocina"
                              className="w-9 h-9 rounded-lg bg-slate-800/60 hover:bg-red-950/60 text-slate-400 hover:text-red-400 flex items-center justify-center transition cursor-pointer active:scale-95 border border-slate-800"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Bottom Row: Unified clean modifier pills */}
                        {(isTakeaway || item.isCombo || item.term || noteParts.length > 0) && (
                          <div
                            onClick={() => {
                              posAudio.playClick();
                              setItemToEdit(item);
                            }}
                            className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80 cursor-pointer"
                          >
                            {isTakeaway && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
                                <Package size={11} />
                                Llevar
                              </span>
                            )}
                            {item.isCombo && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded">
                                <Sparkles size={11} className="text-amber-400" />
                                {item.comboNote || 'Combo'}
                              </span>
                            )}
                            {item.term && (
                              <span className="inline-flex items-center text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded">
                                Término: {item.term}
                              </span>
                            )}
                            {noteParts.map((part, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/80 px-2 py-0.5 rounded"
                              >
                                {part}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Flat Financial Footer */}
      <div className="footer-comanda p-4 bg-[#1e293b] border-t border-slate-700 shrink-0 space-y-3">
        {/* Total Row */}
        <div className="flex justify-between items-baseline text-white px-1">
          <span className="font-black text-sm text-slate-300 uppercase tracking-wider">
            Total:
          </span>
          <span className="font-black text-2xl sm:text-3xl text-emerald-400 tracking-tight">
            {formatCOP(totalOrderPrice)}
          </span>
        </div>

        {/* Primary Action Button: Cocina */}
        {unsentItems.length > 0 && (
          <button
            type="button"
            id="btn-enviar-cocina-mesa"
            onClick={() => {
              handleSendOrder();
              if (isMobileDrawer) {
                setShowMobileComandaModal(false);
              }
            }}
            className="w-full text-white font-black text-base py-4 rounded-lg cursor-pointer flex items-center justify-center gap-2.5 transition uppercase tracking-wide active:scale-95 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 min-h-[54px]"
          >
            <Flame size={24} className="stroke-[2.5]" />
            <span>Cocina ({unsentItems.reduce((s, it) => s + it.quantity, 0)})</span>
          </button>
        )}

        {/* Direct Action Buttons: Pre-cuenta / Cobrar */}
        {currentUser?.role === 'mesero' ? (
          <button
            type="button"
            onClick={() => {
              posAudio.playClick();
              setTicketItemsToPrint(table.items);
              setTicketIsAddition(false);
              setTicketRoundNumber(table.currentRound || 1);
              setTicketModalType('precuenta');
              onUpdateTableStatus?.(table.id, 'cuenta');
              if (isMobileDrawer) {
                setShowMobileComandaModal(false);
              }
            }}
            disabled={table.items.length === 0}
            className="w-full py-3.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black text-base flex items-center justify-center gap-2.5 border border-slate-700 transition disabled:opacity-50 cursor-pointer active:scale-95 min-h-[50px]"
          >
            <Printer size={22} className="text-orange-400" />
            <span>Pre-cuenta</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                posAudio.playClick();
                setTicketItemsToPrint(table.items);
                setTicketIsAddition(false);
                setTicketRoundNumber(table.currentRound || 1);
                setTicketModalType('precuenta');
                onUpdateTableStatus?.(table.id, 'cuenta');
                if (isMobileDrawer) {
                  setShowMobileComandaModal(false);
                }
              }}
              disabled={table.items.length === 0}
              className="py-3.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black text-base flex items-center justify-center gap-2 border border-slate-700 transition disabled:opacity-50 cursor-pointer active:scale-95 min-h-[50px]"
            >
              <Printer size={22} className="text-slate-300" />
              <span>Pre-cuenta</span>
            </button>

            <button
              type="button"
              onClick={() => {
                posAudio.playClick();
                setShowCajaModal(true);
                if (isMobileDrawer) {
                  setShowMobileComandaModal(false);
                }
              }}
              disabled={table.items.length === 0}
              className="py-3.5 px-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-black text-base flex items-center justify-center gap-2 transition disabled:opacity-50 border border-orange-500 cursor-pointer active:scale-95 min-h-[50px]"
            >
              <CreditCard size={22} />
              <span>Cobrar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      id="pantalla-pedido"
      className="flex flex-col h-full bg-[#0f172a] text-white select-none overflow-hidden"
    >
      {/* Top Header Bar */}
      <header className="header-pedido bg-[#0b1120] text-white px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between border-b border-slate-800 shrink-0 z-10">
        {/* Left: Mesas button & clean Table Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="btn-volver bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-black px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer border border-slate-700 min-h-[42px]"
          >
            <ArrowLeft size={18} className="text-orange-400" /> <span>Mesas</span>
          </button>

          <div className="flex items-center gap-2">
            <h1
              id="nombre-mesa-activa"
              className="text-orange-400 font-black text-xl sm:text-2xl uppercase tracking-tight"
            >
              {table.label}
            </h1>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="relative max-w-xs w-full mx-2 hidden sm:block">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-[#1e293b] border border-slate-700 text-white placeholder-slate-400 rounded-xl text-xs sm:text-sm font-bold focus:outline-hidden focus:border-orange-500 transition min-h-[40px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer p-1"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Right: Non-interactive Informative User Badge & Sync Status */}
        <div className="flex items-center gap-2">
          <NetworkSyncBadge currentUser={currentUser} className="hidden lg:flex" />

          <div
            id="indicador-usuario-mesa"
            className="px-3.5 py-2 bg-slate-800 text-slate-100 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 border border-slate-700 select-none min-h-[42px]"
          >
            <User size={16} className="text-orange-400 shrink-0" />
            <span className="truncate max-w-[130px]">{currentUser?.name || waiterName || 'Mesero'}</span>
          </div>
        </div>
      </header>

      {/* Main Container: Full width on mobile (<768px), 60%/40% split on tablets & desktop (>=768px) */}
      <div className="contenedor-pos flex flex-1 overflow-hidden relative">
        {/* Left Side: Food Menu Catalog (100% mobile, 60% on md+) */}
        <div className="menu-comida w-full md:w-[60%] lg:w-[65%] flex flex-col p-2.5 sm:p-3 overflow-hidden bg-[#0f172a] md:border-r border-slate-800">
          {/* Categories Bar with smooth horizontal scrolling */}
          <div className="categorias-bar flex gap-2 overflow-x-auto whitespace-nowrap scroll-smooth pb-2.5 shrink-0 no-scrollbar">
            <button
              onClick={() => {
                posAudio.playClick();
                setSelectedCat('Todos');
              }}
              className={`btn-cat px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase whitespace-nowrap transition cursor-pointer border min-h-[42px] ${
                selectedCat === 'Todos'
                  ? 'bg-orange-600 text-white border-orange-500'
                  : 'bg-[#1e293b] text-slate-200 border-slate-700 hover:bg-[#334155]'
              }`}
            >
              Todos
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  posAudio.playClick();
                  setSelectedCat(cat);
                }}
                className={`btn-cat px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase whitespace-nowrap transition cursor-pointer border min-h-[42px] ${
                  selectedCat === cat
                    ? 'bg-orange-600 text-white border-orange-500'
                    : 'bg-[#1e293b] text-slate-200 border-slate-700 hover:bg-[#334155]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Mobile Search input if small screen */}
          <div className="relative w-full mb-2 sm:hidden">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-[#1e293b] border border-slate-700 text-white placeholder-slate-400 rounded-xl text-xs sm:text-sm font-bold focus:outline-hidden focus:border-orange-500 min-h-[42px]"
            />
          </div>

          {/* Ergonomic Product Cards */}
          <div
            id="productos-grid"
            className="grid-productos grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 content-start auto-rows-max items-start gap-3 sm:gap-3.5 overflow-y-auto flex-1 pr-1 pb-28 md:pb-4"
          >
            {filteredProducts.map((p) => {
              const matchedItems = table.items.filter((it) => it.menuItemId === p.id);
              const currentQtyInCart = matchedItems.reduce((s, it) => s + it.quantity, 0);
              const firstCartItem = matchedItems[0];

              return (
                <div
                  key={p.id}
                  onClick={() => handleQuickAdd(p, false)}
                  className="card-producto w-full bg-[#1e293b] hover:bg-[#27354a] active:scale-[0.99] p-3.5 sm:p-4 rounded-2xl border border-slate-700 hover:border-slate-600 transition cursor-pointer flex flex-col justify-between gap-3 select-none group"
                >
                  {/* Row 1: Left (Name text-base & Price gold) vs Right (Personalize notes button) */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-black text-sm sm:text-base text-white leading-snug truncate group-hover:text-orange-400 transition"
                        title={p.name}
                      >
                        {p.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="precio font-black text-amber-400 text-base sm:text-lg">
                          {formatCOP(p.price)}
                        </span>

                        {/* Combo Pill if product supports combo */}
                        {p.combo && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              posAudio.playClick();
                              setSelectedItemForComboModal(p);
                            }}
                            className="btn-combo bg-blue-950 hover:bg-blue-900 active:scale-95 text-cyan-300 border border-blue-700 font-black text-xs px-2.5 py-1 rounded-lg transition cursor-pointer uppercase tracking-tight flex items-center gap-1 min-h-[30px]"
                          >
                            <span>+ Combo ({formatCOP(p.comboExtra || 8000)})</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Customize / Notes Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItemForModal(p);
                      }}
                      title="Personalizar plato / notas"
                      className="w-11 h-11 bg-slate-800 hover:bg-slate-700 active:scale-90 text-slate-200 hover:text-white rounded-lg transition flex items-center justify-center cursor-pointer border border-slate-700 shrink-0"
                    >
                      <SlidersHorizontal size={22} />
                    </button>
                  </div>

                  {/* Row 2: Action Control */}
                  <div className="pt-2 border-t border-slate-800">
                    {currentQtyInCart > 0 && firstCartItem ? (
                      /* If in cart: Clean direct tactile counter [ - ]  2  [ + ] */
                      <div className="flex items-center justify-between bg-orange-950 border border-orange-600 rounded-lg p-1 h-12 w-full">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdminQuantityChange(firstCartItem, -1);
                          }}
                          title="Restar 1"
                          className="w-14 h-10 rounded-md bg-orange-900 hover:bg-orange-800 active:scale-90 text-white font-black text-2xl flex items-center justify-center cursor-pointer transition border border-orange-700 select-none"
                        >
                          -
                        </button>
                        <span className="font-black text-2xl text-white select-none">
                          {currentQtyInCart}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdminQuantityChange(firstCartItem, 1);
                          }}
                          title="Sumar 1"
                          className="w-14 h-10 rounded-md bg-orange-600 hover:bg-orange-500 active:scale-90 text-white font-black text-2xl flex items-center justify-center cursor-pointer transition select-none"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      /* If not in cart: + AGREGAR button */
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAdd(p, false);
                        }}
                        className="btn-add w-full h-12 bg-orange-600 hover:bg-orange-500 active:scale-98 text-white font-black text-sm rounded-lg transition cursor-pointer flex items-center justify-center gap-2 border border-orange-500 uppercase tracking-wide"
                      >
                        <Plus size={22} className="stroke-[3]" />
                        <span>Agregar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Comanda / Resumen de Orden */}
        <div className="comanda hidden md:flex md:w-[40%] lg:w-[35%] bg-[#1e293b] flex-col overflow-hidden">
          {renderComandaContent(false)}
        </div>
      </div>

      {/* Floating Bottom Bar for Mobile (< 768px) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#0b1120] border-t border-slate-800 px-4 py-3.5 flex items-center justify-between md:hidden">
        <div className="flex flex-col">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
            Total Cuenta
          </span>
          <span className="text-2xl font-black text-emerald-400 leading-tight">
            {formatCOP(totalOrderPrice)}
          </span>
        </div>

        <button
          type="button"
          id="btn-ver-comanda-mobile"
          onClick={() => {
            posAudio.playClick();
            setShowMobileComandaModal(true);
          }}
          className="bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-black text-sm px-5 py-3 rounded-lg flex items-center gap-2.5 transition cursor-pointer border border-orange-500 min-h-[48px]"
        >
          <Receipt size={22} />
          <span>Comanda ({totalItemsCount})</span>
          {unsentItems.length > 0 && (
            <span className="px-2 py-0.5 bg-amber-400 text-slate-950 rounded-md text-xs font-black">
              {unsentItems.reduce((s, it) => s + it.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Mobile / Tablet Full-Screen Flat Modal for Comanda */}
      {showMobileComandaModal && (
        <div className="fixed inset-0 z-50 bg-[#0f172a] flex flex-col md:hidden">
          <div className="h-full w-full flex flex-col overflow-hidden">
            {renderComandaContent(true)}
          </div>
        </div>
      )}

      {/* Combo Beverage Quick Selector Modal (Fast Food: Hamb/Perros) */}
      {selectedItemForComboModal && (
        <ComboDrinkModal
          item={selectedItemForComboModal}
          onSelectDrink={(drinkChoice) =>
            handleConfirmComboWithDrink(selectedItemForComboModal, drinkChoice)
          }
          onClose={() => setSelectedItemForComboModal(null)}
        />
      )}

      {/* Item Customization Modal */}
      {selectedItemForModal && (
        <ItemOptionsModal
          item={selectedItemForModal}
          onClose={() => setSelectedItemForModal(null)}
          onAdd={handleAddCustomizedItem}
        />
      )}

      {/* Ticket Modal (Kitchen / Pre-bill) */}
      {ticketModalType && (
        <TicketModal
          type={ticketModalType}
          table={{
            ...table,
            customerName: customerNameInput || table.customerName,
            address: deliveryAddressInput || table.address,
          }}
          itemsToPrint={ticketItemsToPrint}
          orderNumber={table.orderNumber || 1}
          waiterName={waiterName || currentUser?.name || table.waiterName || 'Mesero'}
          isAddition={ticketIsAddition}
          roundNumber={ticketRoundNumber}
          onClose={() => setTicketModalType(null)}
        />
      )}

      {/* Caja & Cobro Modal */}
      {showCajaModal && (
        <CajaModal
          table={{
            ...table,
            customerName: customerNameInput || table.customerName,
            address: deliveryAddressInput || table.address,
          }}
          onClose={() => setShowCajaModal(false)}
          onCompletePayment={(receipt) => {
            setShowCajaModal(false);
            onCompletePayment(receipt);
          }}
        />
      )}

      {/* Admin Item Edition Modal (Substitute / Combos / Notes / Quantities) */}
      {itemToEdit && (
        <AdminItemEditModal
          item={itemToEdit}
          onClose={() => setItemToEdit(null)}
          onSave={handleSaveEditedItem}
        />
      )}

      {/* Admin Item Void Confirmation Modal */}
      {itemToVoid && (
        <AdminItemVoidModal
          item={itemToVoid}
          onClose={() => setItemToVoid(null)}
          onConfirmVoid={(reason) => handleConfirmVoid(itemToVoid.id, reason)}
        />
      )}
    </div>
  );
};
