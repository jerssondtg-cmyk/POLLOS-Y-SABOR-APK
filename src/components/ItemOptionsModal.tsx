import React, { useState, useMemo } from 'react';
import { MenuItem, OrderItem } from '../types';
import { formatCOP } from '../data/menu';
import { posAudio } from '../utils/audio';
import {
  X,
  Check,
  Flame,
  Plus,
  Minus,
  CupSoda,
  Citrus,
  Package,
} from 'lucide-react';

interface ItemOptionsModalProps {
  item: MenuItem;
  onClose: () => void;
  onAdd: (orderItem: OrderItem) => void;
}

// Official sides definition
const getOfficialSidesForItem = (item: MenuItem): string[] => {
  const name = item.name.toLowerCase();
  const cat = item.cat;

  if (cat === 'Pollos') {
    if (name.includes('broaster')) {
      return ['Papa a la francesa', 'Arepa'];
    }
    if (name.includes('asado')) {
      return ['Papa salada', 'Arepa', 'Patacones'];
    }
    if (name.includes('mixto')) {
      return ['Papa salada', 'Papa francesa', 'Arepa', 'Patacones'];
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
    return ['Arepa', 'Papa francesa', 'Chorizo', 'Ensalada'];
  }

  if (cat === 'Pescados') {
    return ['Papa francesa', 'Yuca', 'Patacón', 'Ensalada'];
  }

  if (cat === 'Infantil') {
    return ['Papa francesa'];
  }

  return [];
};

export const ItemOptionsModal: React.FC<ItemOptionsModalProps> = ({
  item,
  onClose,
  onAdd,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isTakeaway, setIsTakeaway] = useState(false);
  const [isCombo, setIsCombo] = useState(false);
  const [comboDrink, setComboDrink] = useState<'Gaseosa' | 'Limonada Natural'>('Gaseosa');

  // Category detection
  const isChicken = item.cat === 'Pollos' || item.name.toLowerCase().includes('pollo');
  const isGrill = item.cat === 'Parrilla';
  const isFish = item.cat === 'Pescados';
  const isBurgerOrDog =
    item.cat === 'Hamb/Perros' ||
    item.name.toLowerCase().includes('hamb') ||
    item.name.toLowerCase().includes('perro');
  const isBeef =
    item.name.toLowerCase().includes('churrasco') ||
    item.name.toLowerCase().includes('carne') ||
    (isGrill &&
      !item.name.toLowerCase().includes('pechuga') &&
      !item.name.toLowerCase().includes('trucha') &&
      !item.name.toLowerCase().includes('costillitas')) ||
    (isBurgerOrDog && item.name.toLowerCase().includes('carne'));
  const isDrink = item.cat === 'Bebidas';
  const isJuice = isDrink && item.name.toLowerCase().includes('jugo');
  const isSoda =
    isDrink &&
    (item.name.toLowerCase().includes('gaseosa') || item.name.toLowerCase().includes('pet'));

  // Sides management: array of excluded sides
  const officialDishSides = useMemo(() => getOfficialSidesForItem(item), [item]);
  const [excludedSides, setExcludedSides] = useState<string[]>([]);
  const [doubleSides, setDoubleSides] = useState<string[]>([]);

  // Meat term
  const [selectedTerm, setSelectedTerm] = useState<string>('');

  // Drink flavor
  const [fruitFlavor, setFruitFlavor] = useState<string>('');
  const [sodaFlavor, setSodaFlavor] = useState<string>('');
  const [juiceBase, setJuiceBase] = useState<string>(
    item.name.toLowerCase().includes('leche')
      ? 'En Leche'
      : item.name.toLowerCase().includes('agua')
      ? 'En Agua'
      : ''
  );

  // Quick notes & custom note
  const [selectedQuickNotes, setSelectedQuickNotes] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState('');

  // Category specific quick notes
  const categoryQuickNotes = useMemo(() => {
    if (isChicken) {
      return [
        'Piel tostada',
        'Pechuga jugosa',
        'Salsa tártara',
        'Presa Pechuga',
        'Presa Muslo',
        'Salsa BBQ',
      ];
    }
    if (isGrill || isFish) {
      return [
        'Salsa aparte',
        'Bien dorado',
        'Limón extra',
        'Sin chimichurri',
        'Chimichurri extra',
        'Poca sal',
      ];
    }
    if (isBurgerOrDog) {
      return [
        'Sin cebolla',
        'Sin salsas',
        'Salsas aparte',
        'Tocineta crocante',
        'Sin ripio',
        'Queso extra',
      ];
    }
    if (isDrink) {
      return ['Sin Hielo', 'Poco Hielo', 'Sin Azúcar', 'Vaso desechable', 'Con pitillo'];
    }
    return ['Salsa aparte', 'Bien caliente'];
  }, [isChicken, isGrill, isFish, isBurgerOrDog, isDrink]);

  // Toggle side exclusion / inclusion
  const toggleSide = (sideName: string) => {
    posAudio.playClick();
    if (excludedSides.includes(sideName)) {
      setExcludedSides(excludedSides.filter((s) => s !== sideName));
    } else {
      setExcludedSides([...excludedSides, sideName]);
      setDoubleSides(doubleSides.filter((s) => s !== sideName));
    }
  };

  // Toggle double side
  const toggleDoubleSide = (sideName: string) => {
    posAudio.playClick();
    if (doubleSides.includes(sideName)) {
      setDoubleSides(doubleSides.filter((s) => s !== sideName));
    } else {
      setDoubleSides([...doubleSides, sideName]);
      setExcludedSides(excludedSides.filter((s) => s !== sideName));
    }
  };

  // Toggle quick note
  const toggleQuickNote = (note: string) => {
    posAudio.playClick();
    if (selectedQuickNotes.includes(note)) {
      setSelectedQuickNotes(selectedQuickNotes.filter((n) => n !== note));
    } else {
      setSelectedQuickNotes([...selectedQuickNotes, note]);
    }
  };

  // Price calculations
  const unitPrice = item.price + (isCombo && item.comboExtra ? item.comboExtra : 0);
  const totalPrice = unitPrice * quantity;

  // Consolidated note
  const generateFullNote = (): string => {
    const notesList: string[] = [];

    if (isTakeaway) {
      notesList.push('[PARA LLEVAR]');
    }

    excludedSides.forEach((s) => {
      notesList.push(`Sin ${s}`);
    });

    doubleSides.forEach((s) => {
      notesList.push(`x2 ${s}`);
    });

    if (selectedTerm) {
      notesList.push(`Término: ${selectedTerm}`);
    }

    if (fruitFlavor) {
      notesList.push(`Fruta: ${fruitFlavor}`);
    }
    if (juiceBase) {
      notesList.push(juiceBase);
    }
    if (sodaFlavor) {
      notesList.push(`Sabor: ${sodaFlavor}`);
    }

    notesList.push(...selectedQuickNotes);

    if (customNote.trim()) {
      notesList.push(customNote.trim());
    }

    return notesList.join(', ');
  };

  const handleConfirm = () => {
    posAudio.playSuccess();
    const finalNote = generateFullNote();

    const newOrderItem: OrderItem = {
      id: `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      menuItemId: item.id,
      name: isCombo ? `${item.name} (COMBO)` : item.name,
      desc: item.desc,
      price: unitPrice,
      quantity,
      isCombo,
      comboNote: isCombo ? `Francesa + ${comboDrink}` : undefined,
      isTakeaway,
      note: finalNote,
      term: selectedTerm || undefined,
      beverageType: isCombo ? comboDrink : fruitFlavor || sodaFlavor || undefined,
      area: item.area,
      timestamp: Date.now(),
    };

    onAdd(newOrderItem);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 select-none">
      <div className="bg-[#0f172a] text-white rounded-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[95vh] border border-slate-700">
        
        {/* Header - Flat, direct, large close icon */}
        <div className="bg-[#1e293b] px-4 py-3.5 flex items-center justify-between border-b border-slate-700 shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              {item.name}
            </h2>
            <span className="text-sm font-bold text-amber-400">
              {formatCOP(item.price)}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white flex items-center justify-center transition cursor-pointer border border-slate-600 active:scale-95"
          >
            <X size={26} />
          </button>
        </div>

        {/* Content Body - Flat, no filler cards */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 bg-[#0f172a]">

          {/* 1. ACOMPAÑAMIENTOS */}
          {officialDishSides.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                Acompañamientos
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {officialDishSides.map((side) => {
                  const isExcluded = excludedSides.includes(side);
                  const isDouble = doubleSides.includes(side);

                  return (
                    <div
                      key={side}
                      className={`p-2.5 rounded-lg border transition flex items-center justify-between gap-2 min-h-[48px] ${
                        isExcluded
                          ? 'bg-slate-900 border-slate-800 text-slate-500'
                          : isDouble
                          ? 'bg-orange-950 border-orange-600 text-orange-200'
                          : 'bg-[#1e293b] border-slate-700 text-white'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSide(side)}
                        className="flex items-center gap-2.5 font-black text-sm flex-1 text-left cursor-pointer"
                      >
                        <div
                          className={`w-7 h-7 rounded-md flex items-center justify-center border text-xs font-black transition shrink-0 ${
                            isExcluded
                              ? 'bg-slate-800 border-slate-700 text-slate-500'
                              : 'bg-orange-600 border-orange-500 text-white'
                          }`}
                        >
                          {!isExcluded && <Check size={20} className="stroke-[3.5]" />}
                        </div>
                        <span className={isExcluded ? 'line-through text-slate-500 font-bold' : 'text-white'}>
                          {side}
                        </span>
                      </button>

                      {!isExcluded && (
                        <button
                          type="button"
                          onClick={() => toggleDoubleSide(side)}
                          className={`text-sm font-black px-4 py-2 min-w-[56px] min-h-[38px] rounded-lg border transition cursor-pointer shrink-0 flex items-center justify-center active:scale-95 ${
                            isDouble
                              ? 'bg-orange-600 text-white border-orange-500 shadow-xs'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'
                          }`}
                        >
                          x2
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. COMBO OPTION */}
          {(item.combo || isBurgerOrDog) && (
            <div className="bg-[#1e293b] p-3 rounded-lg border border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-sm font-black text-white block">
                    Combo (+{formatCOP(item.comboExtra || 8000)})
                  </span>
                  <span className="text-xs text-slate-400">
                    Papa francesa + Bebida
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    posAudio.playClick();
                    setIsCombo(!isCombo);
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-black border transition cursor-pointer min-h-[42px] ${
                    isCombo
                      ? 'bg-orange-600 text-white border-orange-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {isCombo ? 'ACTIVADO' : 'AGREGAR'}
                </button>
              </div>

              {isCombo && (
                <div className="pt-2 border-t border-slate-700 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      posAudio.playClick();
                      setComboDrink('Gaseosa');
                    }}
                    className={`p-3 rounded-lg border text-sm font-black flex items-center justify-center gap-2 transition cursor-pointer min-h-[48px] ${
                      comboDrink === 'Gaseosa'
                        ? 'bg-orange-600 text-white border-orange-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <CupSoda size={22} />
                    <span>Gaseosa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      posAudio.playClick();
                      setComboDrink('Limonada Natural');
                    }}
                    className={`p-3 rounded-lg border text-sm font-black flex items-center justify-center gap-2 transition cursor-pointer min-h-[48px] ${
                      comboDrink === 'Limonada Natural'
                        ? 'bg-orange-600 text-white border-orange-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <Citrus size={22} />
                    <span>Limonada</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. TÉRMINO DE CARNE */}
          {(isBeef || isGrill) && (
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Flame size={18} className="text-orange-400" />
                <span>Término de Carne</span>
              </span>
              <div className="grid grid-cols-3 gap-2">
                {['Término 1/2', 'Término 3/4', 'Bien Asado'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      posAudio.playClick();
                      setSelectedTerm(selectedTerm === t ? '' : t);
                    }}
                    className={`py-3 px-2 rounded-lg text-xs font-black border text-center transition cursor-pointer min-h-[46px] ${
                      selectedTerm === t
                        ? 'bg-orange-600 text-white border-orange-500'
                        : 'bg-[#1e293b] text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. BEBIDAS / JUGOS / GASEOSAS */}
          {isDrink && (
            <div className="space-y-2.5">
              {isJuice && (
                <div className="space-y-2">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                    Sabor de Fruta
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {['Mora', 'Mango', 'Maracuyá', 'Lulo', 'Guanábana', 'Fresa'].map((fruit) => (
                      <button
                        key={fruit}
                        type="button"
                        onClick={() => {
                          posAudio.playClick();
                          setFruitFlavor(fruitFlavor === fruit ? '' : fruit);
                        }}
                        className={`py-3 px-2 rounded-lg text-xs font-black border transition cursor-pointer min-h-[44px] ${
                          fruitFlavor === fruit
                            ? 'bg-orange-600 text-white border-orange-500'
                            : 'bg-[#1e293b] text-slate-300 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        {fruit}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {['En Agua', 'En Leche'].map((base) => (
                      <button
                        key={base}
                        type="button"
                        onClick={() => {
                          posAudio.playClick();
                          setJuiceBase(juiceBase === base ? '' : base);
                        }}
                        className={`py-3 px-3 rounded-lg text-xs font-black border transition cursor-pointer min-h-[44px] ${
                          juiceBase === base
                            ? 'bg-orange-600 text-white border-orange-500'
                            : 'bg-[#1e293b] text-slate-300 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        {base}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isSoda && (
                <div className="space-y-2">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                    Sabor
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {['Coca Cola', 'Colombiana', 'Manzana', 'Cuatro', 'Sprite', 'Pepsi'].map(
                      (soda) => (
                        <button
                          key={soda}
                          type="button"
                          onClick={() => {
                            posAudio.playClick();
                            setSodaFlavor(sodaFlavor === soda ? '' : soda);
                          }}
                          className={`py-3 px-2 rounded-lg text-xs font-black border transition truncate cursor-pointer min-h-[44px] ${
                            sodaFlavor === soda
                              ? 'bg-orange-600 text-white border-orange-500'
                              : 'bg-[#1e293b] text-slate-300 border-slate-700 hover:bg-slate-800'
                          }`}
                        >
                          {soda}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. NOTAS & PARA LLEVAR */}
          <div className="space-y-2">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
              Notas
            </span>

            <div className="flex flex-wrap gap-2">
              {/* Para Llevar */}
              <button
                type="button"
                onClick={() => {
                  posAudio.playClick();
                  setIsTakeaway(!isTakeaway);
                }}
                className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-black border transition cursor-pointer flex items-center gap-2 min-h-[46px] ${
                  isTakeaway
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-[#1e293b] text-amber-400 border-amber-700/60 hover:bg-slate-800'
                }`}
              >
                <Package size={22} className={isTakeaway ? 'text-slate-950' : 'text-amber-400'} />
                <span>Para Llevar</span>
                {isTakeaway && <Check size={18} className="stroke-[3.5]" />}
              </button>

              {/* Quick Notes */}
              {categoryQuickNotes.map((qNote) => {
                const isSelected = selectedQuickNotes.includes(qNote);
                return (
                  <button
                    key={qNote}
                    type="button"
                    onClick={() => toggleQuickNote(qNote)}
                    className={`px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-bold border transition cursor-pointer flex items-center gap-1.5 min-h-[46px] ${
                      isSelected
                        ? 'bg-orange-600 text-white border-orange-500 font-black'
                        : 'bg-[#1e293b] text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {isSelected && <Check size={16} className="stroke-[3]" />}
                    <span>{qNote}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. OBSERVACIÓN */}
          <div className="space-y-1.5">
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Observación extra..."
              className="w-full px-3.5 py-3 text-sm border border-slate-700 rounded-lg focus:outline-hidden focus:border-orange-500 bg-[#1e293b] text-white font-medium placeholder-slate-500 min-h-[46px]"
            />
          </div>

          {/* 7. CANTIDAD */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <span className="text-sm font-black text-white uppercase">
              Cantidad
            </span>
            <div className="flex items-center gap-3 bg-[#1e293b] p-1 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => {
                  posAudio.playClick();
                  setQuantity(Math.max(1, quantity - 1));
                }}
                className="w-12 h-12 rounded-md bg-slate-800 border border-slate-700 font-black text-white hover:bg-slate-700 flex items-center justify-center text-lg active:scale-95 transition cursor-pointer"
              >
                <Minus size={22} className="stroke-[3]" />
              </button>
              <span className="w-9 text-center font-black text-xl text-white">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => {
                  posAudio.playClick();
                  setQuantity(quantity + 1);
                }}
                className="w-12 h-12 rounded-md bg-slate-800 border border-slate-700 font-black text-white hover:bg-slate-700 flex items-center justify-center text-lg active:scale-95 transition cursor-pointer"
              >
                <Plus size={22} className="stroke-[3]" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer - Large Flat Button & Large Icons */}
        <div className="p-3.5 sm:p-4 bg-[#1e293b] border-t border-slate-700 flex items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase block">
              Total
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-400">
              {formatCOP(totalPrice)}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-lg border border-slate-600 bg-slate-800 text-slate-300 font-bold text-sm hover:bg-slate-700 transition cursor-pointer min-h-[48px]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-6 py-3 rounded-lg bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-black text-sm uppercase flex items-center gap-2 transition cursor-pointer min-h-[48px] border border-orange-500"
            >
              <Plus size={22} className="stroke-[3]" />
              <span>Agregar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

