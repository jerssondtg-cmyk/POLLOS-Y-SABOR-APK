import React, { useState, useMemo } from 'react';
import { MenuItem, OrderItem, CategoryType } from '../types';
import { MENU_ITEMS, CATEGORIES, formatCOP } from '../data/menu';
import { posAudio } from '../utils/audio';
import {
  X,
  Check,
  Search,
  SlidersHorizontal,
  Flame,
  Utensils,
  Plus,
  Minus,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  CupSoda,
  Citrus,
  ArrowRight,
  UtensilsCrossed,
  Package,
} from 'lucide-react';

interface AdminItemEditModalProps {
  item: OrderItem;
  tableLabel?: string;
  onClose: () => void;
  onSave: (updatedItem: OrderItem) => void;
}

// Official intra-dish sides definition according to the Pollos & Sabor menu
const getOfficialSidesForItem = (item: MenuItem): string[] => {
  const name = item.name.toLowerCase();
  const cat = item.cat;

  if (cat === 'Pollos') {
    if (name.includes('broaster')) {
      return ['Papa a la francesa', 'Arepa doradita'];
    }
    if (name.includes('asado')) {
      return ['Papa salada', 'Arepa', 'Patacones'];
    }
    if (name.includes('mixto')) {
      return ['Papa salada', 'Papa a la francesa', 'Arepa', 'Patacones'];
    }
    return ['Papa salada', 'Arepa', 'Patacones'];
  }

  if (cat === 'Bandejas') {
    if (
      name.includes('churrasco') ||
      name.includes('pechuga') ||
      name.includes('mixta') ||
      name.includes('chuleta') ||
      name.includes('trucha') ||
      item.desc?.toLowerCase().includes('chorizo')
    ) {
      return ['Papa francesa', 'Arroz', 'Chorizo', 'Ensalada'];
    }
    return ['Papa francesa', 'Arroz', 'Patacón', 'Ensalada'];
  }

  if (cat === 'Parrilla') {
    return ['Arepa boyacense', 'Papa francesa', 'Chorizo casero', 'Ensalada'];
  }

  if (cat === 'Pescados') {
    return ['Papa francesa', 'Yuca', 'Patacón', 'Ensalada'];
  }

  if (cat === 'Infantil') {
    return ['Papa francesa'];
  }

  return [];
};

interface SideState {
  originalName: string;
  active: boolean;
  swapTo: string | null;
}

export const AdminItemEditModal: React.FC<AdminItemEditModalProps> = ({
  item,
  tableLabel = 'Comanda',
  onClose,
  onSave,
}) => {
  // Current selected menu item for substitution
  const initialMenuItem =
    MENU_ITEMS.find((m) => m.id === item.menuItemId) || {
      id: item.menuItemId,
      name: item.name.replace(' (COMBO)', ''),
      cat: 'Pollos' as CategoryType,
      desc: item.desc || '',
      price: item.price - (item.isCombo ? (item.comboExtra || 8000) : 0),
      area: item.area || 'cocina',
      combo: item.isCombo,
      comboExtra: 8000,
    };

  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem>(initialMenuItem as MenuItem);
  const [isSubstituting, setIsSubstituting] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'Todos'>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modifiers
  const [quantity, setQuantity] = useState<number>(item.quantity);
  const [isTakeaway, setIsTakeaway] = useState<boolean>(
    Boolean(item.isTakeaway || (item.note && item.note.includes('[PARA LLEVAR]')))
  );
  const [isCombo, setIsCombo] = useState<boolean>(!!item.isCombo);
  const [comboDrink, setComboDrink] = useState<'Gaseosa' | 'Limonada Natural'>(
    item.beverageType === 'Limonada Natural' || item.name.toLowerCase().includes('limonada')
      ? 'Limonada Natural'
      : 'Gaseosa'
  );
  const [term, setTerm] = useState<string>(item.term || '');
  const [customNote, setCustomNote] = useState<string>(() => {
    // Extract base note if exists, leaving out [PARA LLEVAR] since managed by toggle
    return (item.note || '').replace(/\[PARA LLEVAR\]/g, '').replace(/,\s*,/g, ',').trim();
  });

  // Category detection for current selected item
  const isFastFood =
    selectedMenuItem.cat === 'Hamb/Perros' ||
    selectedMenuItem.name.toLowerCase().includes('hamb') ||
    selectedMenuItem.name.toLowerCase().includes('perro') ||
    selectedMenuItem.name.toLowerCase().includes('choriperro') ||
    selectedMenuItem.name.toLowerCase().includes('salchipapa');

  const isChicken =
    selectedMenuItem.cat === 'Pollos' ||
    selectedMenuItem.name.toLowerCase().includes('pollo') ||
    selectedMenuItem.name.toLowerCase().includes('asado') ||
    selectedMenuItem.name.toLowerCase().includes('broaster');

  const isGrill = selectedMenuItem.cat === 'Parrilla';
  const isFish = selectedMenuItem.cat === 'Pescados';
  const isDrink = selectedMenuItem.cat === 'Bebidas';
  const isSoup = selectedMenuItem.cat === 'Sopas';

  // Meat term applies exclusively to Parrilla and Beef burgers
  const isBeef =
    isGrill ||
    selectedMenuItem.name.toLowerCase().includes('churrasco') ||
    selectedMenuItem.name.toLowerCase().includes('carne') ||
    (isFastFood && selectedMenuItem.name.toLowerCase().includes('carne'));

  // Official Sides Handling (Intra-Dish)
  const officialDishSides = useMemo(
    () => getOfficialSidesForItem(selectedMenuItem),
    [selectedMenuItem]
  );

  const [sides, setSides] = useState<SideState[]>(() =>
    officialDishSides.map((sideName) => {
      // Check if item's initial note had "Sin [sideName]"
      const isSin = (item.note || '').toLowerCase().includes(`sin ${sideName.toLowerCase()}`);
      return {
        originalName: sideName,
        active: !isSin,
        swapTo: null,
      };
    })
  );

  const [swappingSideIndex, setSwappingSideIndex] = useState<number | null>(null);

  // Filtered menu items for substitution catalog
  const filteredMenuItems = useMemo(() => {
    return MENU_ITEMS.filter((p) => {
      const matchCat = selectedCategory === 'Todos' || p.cat === selectedCategory;
      const matchQuery =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  // Exclusive category quick notes
  const categoryQuickTags = useMemo(() => {
    if (isChicken) {
      return ['Bien tostado / crocante', 'Pechuga jugosa', 'Salsa tártara aparte', 'Para llevar', 'Urgente'];
    }
    if (isGrill) {
      return ['Término 1/2', 'Término 3/4', 'Bien asado', 'Salsa chimichurri aparte', 'Para llevar', 'Urgente'];
    }
    if (isFastFood) {
      return ['Sin cebolla', 'Sin salsas', 'Salsa aparte', 'Tocineta crocante', 'Para llevar', 'Urgente'];
    }
    if (isFish) {
      return ['Bien dorado', 'Limón extra', 'Salsa aparte', 'Para llevar', 'Urgente'];
    }
    if (isDrink) {
      return ['Con hielo', 'Sin hielo', 'Poco dulce', 'Bien fría', 'Para llevar'];
    }
    if (isSoup) {
      return ['Bien caliente', 'Cilantro aparte', 'Limón extra', 'Para llevar', 'Urgente'];
    }
    return ['Para llevar', 'Urgente', 'Bien caliente', 'Salsa aparte'];
  }, [isChicken, isGrill, isFastFood, isFish, isDrink, isSoup]);

  // Base and total price calculation
  const comboPriceAddition = isFastFood && isCombo ? (selectedMenuItem.comboExtra || 8000) : 0;
  const unitPrice = selectedMenuItem.price + comboPriceAddition;
  const totalPrice = unitPrice * quantity;

  // Substitute menu item
  const handleSelectSubstitute = (menuItem: MenuItem) => {
    posAudio.playClick();
    setSelectedMenuItem(menuItem);
    setIsSubstituting(false);

    // Reset sides for new item
    const newSides = getOfficialSidesForItem(menuItem);
    setSides(
      newSides.map((sideName) => ({
        originalName: sideName,
        active: true,
        swapTo: null,
      }))
    );

    // Reset fast food combo if new item doesn't support it
    const isNewFastFood =
      menuItem.cat === 'Hamb/Perros' ||
      menuItem.name.toLowerCase().includes('hamb') ||
      menuItem.name.toLowerCase().includes('perro');

    if (!isNewFastFood) {
      setIsCombo(false);
    }

    // Reset meat term if not beef/grill
    if (menuItem.cat !== 'Parrilla' && !menuItem.name.toLowerCase().includes('carne')) {
      setTerm('');
    }
  };

  // Toggle side active/inactive
  const handleToggleSide = (index: number) => {
    posAudio.playClick();
    setSides((prev) =>
      prev.map((s, i) => {
        if (i === index) {
          const nextActive = !s.active;
          return {
            ...s,
            active: nextActive,
            swapTo: null,
          };
        }
        return s;
      })
    );
    if (swappingSideIndex === index) {
      setSwappingSideIndex(null);
    }
  };

  // Swap side strictly for another side of this same dish
  const handleSelectSwap = (index: number, targetSideToDouble: string) => {
    posAudio.playClick();
    setSides((prev) =>
      prev.map((s, i) => {
        if (i === index) {
          return {
            ...s,
            active: true,
            swapTo: targetSideToDouble,
          };
        }
        return s;
      })
    );
    setSwappingSideIndex(null);
  };

  const handleResetSwap = (index: number) => {
    posAudio.playClick();
    setSides((prev) =>
      prev.map((s, i) => (i === index ? { ...s, swapTo: null } : s))
    );
  };

  // Toggle quick tags
  const handleToggleTag = (tag: string) => {
    posAudio.playClick();
    if (tag.startsWith('Término') || tag === 'Bien asado') {
      setTerm(term === tag ? '' : tag);
      return;
    }
    if (customNote.includes(tag)) {
      setCustomNote(customNote.replace(new RegExp(`(,\\s*)?${tag}`, 'g'), '').trim());
    } else {
      setCustomNote(customNote ? `${customNote}, ${tag}` : tag);
    }
  };

  // Generate clean unified comanda note
  const generateFullNote = (): string => {
    const notesList: string[] = [];

    // 0. Para llevar flag
    if (isTakeaway) {
      notesList.push('[PARA LLEVAR]');
    }

    // 1. Sides changes
    sides.forEach((s) => {
      if (!s.active) {
        notesList.push(`Sin ${s.originalName}`);
      } else if (s.swapTo) {
        notesList.push(`Sin ${s.originalName}, Doble ${s.swapTo}`);
      }
    });

    // 2. Meat Term
    if (term) {
      notesList.push(`Término: ${term}`);
    }

    // 3. Custom text & tags
    if (customNote.trim()) {
      notesList.push(customNote.trim());
    }

    return notesList.join(', ');
  };

  const handleSave = () => {
    posAudio.playSuccess();
    const finalNote = generateFullNote();

    const cleanBaseName = selectedMenuItem.name.replace(/\s*\(COMBO[^)]*\)/gi, '');
    const finalName =
      isFastFood && isCombo
        ? `${cleanBaseName} (COMBO: Papa Francesa + ${comboDrink})`
        : cleanBaseName;

    const updated: OrderItem = {
      ...item,
      menuItemId: selectedMenuItem.id,
      name: finalName,
      desc: selectedMenuItem.desc,
      price: unitPrice,
      quantity,
      isCombo: isFastFood && isCombo,
      comboNote: isFastFood && isCombo ? `Papa Francesa + ${comboDrink}` : undefined,
      isTakeaway,
      beverageType: isFastFood && isCombo ? comboDrink : item.beverageType,
      term: term || undefined,
      note: finalNote,
      area: selectedMenuItem.area || item.area || 'cocina',
      isModified: true,
      modifiedAt: Date.now(),
    };

    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-3 select-none font-sans">
      <div className="bg-[#1e293b] border border-slate-700 rounded-2xl w-full max-w-2xl text-white overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 bg-[#0b1120] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-950 border border-orange-600 flex items-center justify-center text-orange-400 shrink-0">
              <SlidersHorizontal size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black uppercase text-white tracking-wide">
                  Modificar Ítem
                </h2>
                {item.sentToKitchen && (
                  <span className="bg-amber-950 text-amber-300 border border-amber-700 text-xs font-black px-2 py-0.5 rounded-md uppercase">
                    En Cocina
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-bold">
                {tableLabel} • <span className="text-orange-400">{item.name}</span>
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

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 bg-[#0f172a] text-sm">
          {/* Warning if already in kitchen */}
          {item.sentToKitchen && (
            <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-600 flex items-start gap-2.5 text-xs sm:text-sm text-amber-200">
              <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-black block text-amber-300">
                  Plato ya enviado a Cocina:
                </strong>
                Se actualizará la comanda y se notificará el cambio a cocina.
              </div>
            </div>
          )}

          {/* Section 1: Selected Dish & Substitution */}
          <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Utensils size={16} className="text-orange-400" />
                Plato Base
              </span>
              <button
                type="button"
                onClick={() => {
                  posAudio.playClick();
                  setIsSubstituting(!isSubstituting);
                }}
                className="text-xs sm:text-sm font-black text-orange-400 hover:text-orange-300 bg-orange-950/80 border border-orange-700 px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 min-h-[36px]"
              >
                <Sparkles size={14} />
                <span>{isSubstituting ? 'Cerrar Catálogo' : 'Cambiar por otro plato'}</span>
              </button>
            </div>

            {/* Current Selected Dish Card */}
            {!isSubstituting ? (
              <div className="p-3.5 rounded-xl bg-[#0b1120] border border-slate-700 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-white">{selectedMenuItem.name}</h3>
                    <span className="text-xs uppercase font-black bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                      {selectedMenuItem.cat}
                    </span>
                  </div>
                  {selectedMenuItem.desc && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{selectedMenuItem.desc}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="text-base sm:text-lg font-black text-amber-400 block">
                    {formatCOP(selectedMenuItem.price)}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">Precio base</span>
                </div>
              </div>
            ) : (
              /* Substitution Catalog Browser */
              <div className="space-y-3 pt-2 border-t border-slate-800">
                {/* Search */}
                <div className="relative">
                  <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar plato en la carta..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-orange-500 font-bold min-h-[42px]"
                  />
                </div>

                {/* Category Pills */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => setSelectedCategory('Todos')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase whitespace-nowrap transition cursor-pointer border min-h-[36px] ${
                      selectedCategory === 'Todos'
                        ? 'bg-orange-600 text-white border-orange-500'
                        : 'bg-slate-900 text-slate-300 hover:text-white border-slate-700'
                    }`}
                  >
                    Todos
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase whitespace-nowrap transition cursor-pointer border min-h-[36px] ${
                        selectedCategory === cat
                          ? 'bg-orange-600 text-white border-orange-500'
                          : 'bg-slate-900 text-slate-300 hover:text-white border-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1">
                  {filteredMenuItems.map((menuItem) => (
                    <button
                      key={menuItem.id}
                      onClick={() => handleSelectSubstitute(menuItem)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between min-h-[48px] ${
                        selectedMenuItem.id === menuItem.id
                          ? 'bg-orange-950 border-orange-500 text-orange-200'
                          : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
                      }`}
                    >
                      <div className="pr-2">
                        <strong className="text-xs sm:text-sm font-black block">{menuItem.name}</strong>
                        <span className="text-xs font-bold text-amber-400">{formatCOP(menuItem.price)}</span>
                      </div>
                      {selectedMenuItem.id === menuItem.id && (
                        <Check size={18} className="text-orange-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Cantidad & Combo Condicional */}
          <div className={`grid ${isFastFood ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-3`}>
            {/* Quantity Stepper */}
            <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-xs sm:text-sm font-black uppercase text-slate-300 block">Cantidad</span>
                <span className="text-xs text-slate-400">Unidades en cuenta</span>
              </div>
              <div className="flex items-center gap-2 bg-[#0b1120] p-1.5 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    if (quantity > 1) {
                      posAudio.playClick();
                      setQuantity(quantity - 1);
                    }
                  }}
                  className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-white font-black text-lg transition cursor-pointer"
                >
                  <Minus size={16} />
                </button>
                <span className="w-10 text-center font-black text-lg text-emerald-400 select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    posAudio.playClick();
                    setQuantity(quantity + 1);
                  }}
                  className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-white font-black text-lg transition cursor-pointer"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Combo Toggle — Fast Food */}
            {isFastFood && (
              <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-xs sm:text-sm font-black uppercase text-slate-300 block">Combo Especial</span>
                    <span className="text-xs text-cyan-400 font-bold">+ $8.000 (Papas + Bebida)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      posAudio.playClick();
                      setIsCombo(!isCombo);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer border flex items-center gap-1.5 min-h-[42px] ${
                      isCombo
                        ? 'bg-blue-600 border-blue-400 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    {isCombo && <UtensilsCrossed size={16} />}
                    <span>{isCombo ? 'COMBO ACTIVO' : '+ AGREGAR COMBO'}</span>
                  </button>
                </div>

                {isCombo && (
                  <div className="pt-2.5 border-t border-slate-700 space-y-2">
                    <span className="text-xs font-black uppercase tracking-wider text-cyan-300 block">
                      Bebida del Combo:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          posAudio.playClick();
                          setComboDrink('Gaseosa');
                        }}
                        className={`p-2.5 rounded-xl border text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition cursor-pointer min-h-[44px] ${
                          comboDrink === 'Gaseosa'
                            ? 'bg-blue-600 border-blue-400 text-white'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        <CupSoda size={18} />
                        <span>Gaseosa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          posAudio.playClick();
                          setComboDrink('Limonada Natural');
                        }}
                        className={`p-2.5 rounded-xl border text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition cursor-pointer min-h-[44px] ${
                          comboDrink === 'Limonada Natural'
                            ? 'bg-orange-600 border-orange-500 text-white'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        <Citrus size={18} />
                        <span>Limonada Natural</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 3: Acompañamientos Oficiales del Plato */}
          {sides.length > 0 && (
            <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Utensils size={16} className="text-orange-400" />
                  Acompañamientos del Plato
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  Toca para desactivar o duplicar
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sides.map((side, idx) => {
                  const otherDishSides = sides
                    .filter((_, i) => i !== idx)
                    .map((s) => s.originalName);

                  return (
                    <div
                      key={side.originalName}
                      className={`p-3 rounded-xl border transition flex flex-col justify-between gap-2 min-h-[52px] ${
                        side.active
                          ? side.swapTo
                            ? 'bg-orange-950 border-orange-600'
                            : 'bg-[#0f172a] border-slate-700'
                          : 'bg-slate-900/60 border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleSide(idx)}
                          className="flex items-center gap-2 text-left font-black text-xs sm:text-sm transition cursor-pointer flex-1"
                        >
                          {side.active ? (
                            <CheckCircle2 size={18} className="text-orange-400 shrink-0" />
                          ) : (
                            <XCircle size={18} className="text-red-400 shrink-0" />
                          )}
                          <span
                            className={
                              side.active
                                ? 'text-white font-black'
                                : 'text-slate-500 line-through font-bold'
                            }
                          >
                            {side.active ? side.originalName : `Sin ${side.originalName}`}
                          </span>
                        </button>

                        {side.active && otherDishSides.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            {side.swapTo ? (
                              <button
                                type="button"
                                onClick={() => handleResetSwap(idx)}
                                className="text-xs bg-orange-900 hover:bg-orange-800 text-orange-200 border border-orange-600 px-2.5 py-1 rounded-lg font-black transition flex items-center gap-1 cursor-pointer min-h-[30px]"
                              >
                                <X size={12} /> Quitar
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setSwappingSideIndex(
                                    swappingSideIndex === idx ? null : idx
                                  )
                                }
                                className={`text-xs px-2.5 py-1 rounded-lg font-black transition flex items-center gap-1 border cursor-pointer min-h-[30px] ${
                                  swappingSideIndex === idx
                                    ? 'bg-slate-700 text-white border-slate-600'
                                    : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                                }`}
                              >
                                <RefreshCw size={12} /> Cambiar
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {side.active && side.swapTo && (
                        <div className="text-xs font-black text-amber-300 bg-amber-950/80 border border-amber-600 px-2.5 py-1 rounded-lg flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <RefreshCw size={12} className="text-amber-400" />
                            <span>Cambiado por:</span>
                          </span>
                          <strong className="text-amber-200 uppercase">
                            Doble {side.swapTo}
                          </strong>
                        </div>
                      )}

                      {swappingSideIndex === idx && side.active && (
                        <div className="mt-1 pt-2 border-t border-slate-800 space-y-1.5">
                          <span className="text-xs font-bold text-slate-400 block">
                            Cambiar {side.originalName} por:
                          </span>
                          <div className="grid grid-cols-1 gap-1.5">
                            {otherDishSides.map((otherSide) => (
                              <button
                                key={otherSide}
                                type="button"
                                onClick={() => handleSelectSwap(idx, otherSide)}
                                className="text-xs px-3 py-2 rounded-lg bg-slate-900 hover:bg-orange-950 border border-slate-700 hover:border-orange-500 text-slate-200 font-bold text-left transition cursor-pointer flex items-center justify-between min-h-[36px]"
                              >
                                <span className="flex items-center gap-2">
                                  <ArrowRight size={12} className="text-orange-400" />
                                  <span>Por Doble {otherSide}</span>
                                </span>
                                <span className="text-xs text-amber-300 font-black bg-amber-950 px-2 py-0.5 rounded border border-amber-700">
                                  2x
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 4: Término de la Carne */}
          {(isBeef || isGrill || term) && (
            <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700 space-y-2.5">
              <span className="text-xs sm:text-sm font-black uppercase text-slate-200 flex items-center gap-2">
                <Flame size={16} className="text-orange-400" />
                Término de la Carne
              </span>
              <div className="grid grid-cols-3 gap-2">
                {['Término 1/2', 'Término 3/4', 'Bien Asado'].map((tOption) => (
                  <button
                    key={tOption}
                    type="button"
                    onClick={() => {
                      posAudio.playClick();
                      setTerm(term === tOption ? '' : tOption);
                    }}
                    className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-black border text-center transition cursor-pointer min-h-[44px] ${
                      term === tOption
                        ? 'bg-orange-600 border-orange-500 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    {tOption}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 5: Notas Rápidas & Campo Libre */}
          <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-black uppercase text-slate-200 block">
                Notas de Preparación ({selectedMenuItem.cat})
              </span>
              {isTakeaway && (
                <span className="text-xs font-black uppercase text-amber-300 bg-amber-950 px-2.5 py-1 rounded-md border border-amber-600">
                  📦 Para Llevar Activo
                </span>
              )}
            </div>

            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Instrucciones adicionales para cocina..."
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-orange-500 font-bold min-h-[44px]"
            />
            <div className="flex flex-wrap gap-2 pt-1">
              {/* Botón Destacado Para Llevar */}
              <button
                id="btn-admin-para-llevar"
                type="button"
                onClick={() => {
                  posAudio.playClick();
                  setIsTakeaway(!isTakeaway);
                }}
                className={`text-xs sm:text-sm px-3.5 py-2 rounded-xl border font-black transition cursor-pointer flex items-center gap-2 min-h-[40px] ${
                  isTakeaway
                    ? 'bg-amber-400 text-slate-950 border-amber-400'
                    : 'bg-amber-950/40 text-amber-300 border-amber-700 hover:bg-amber-900/60'
                }`}
              >
                <Package size={16} className={isTakeaway ? 'text-slate-950' : 'text-amber-400'} />
                <span>Para Llevar</span>
                {isTakeaway && <Check size={14} className="text-slate-950 stroke-[3]" />}
              </button>

              {categoryQuickTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className={`text-xs font-bold px-3 py-2 rounded-xl border transition cursor-pointer min-h-[40px] ${
                    customNote.includes(tag) || term === tag
                      ? 'bg-orange-600 text-white border-orange-500'
                      : 'bg-slate-900 text-slate-300 hover:text-white border-slate-700'
                  }`}
                >
                  +{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Resumen Final de Nota para Cocina */}
          {generateFullNote() && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-600 text-amber-200 text-xs sm:text-sm">
              <strong className="text-amber-400 block text-xs uppercase font-black mb-0.5">
                Modificaciones Registradas:
              </strong>
              <span className="font-bold">{generateFullNote()}</span>
            </div>
          )}
        </div>

        {/* Footer with Totals & Save */}
        <div className="p-4 bg-[#0b1120] border-t border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <span className="text-xs font-black text-slate-400 uppercase block">
              Total Actualizado:
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400">
              {formatCOP(totalPrice)}
            </div>
          </div>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-xs sm:text-sm transition cursor-pointer min-h-[46px] border border-slate-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 transition cursor-pointer min-h-[46px] border border-emerald-500"
            >
              <Check size={18} />
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
