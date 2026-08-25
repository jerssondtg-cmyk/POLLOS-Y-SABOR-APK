import React, { useState, useEffect } from 'react';
import { ActiveTable, KitchenOrder, OrderItem, PaymentReceipt, TableStatus, UserProfile } from './types';
import {
  loadStoredTables,
  saveStoredTables,
  loadStoredKitchen,
  saveStoredKitchen,
  loadStoredReceipts,
  saveStoredReceipts,
  loadStoredSettings,
  saveStoredSettings,
  loadStoredUserProfile,
  saveStoredUserProfile,
  clearStoredUserProfile,
  loadStoredWaiterNames,
  saveStoredWaiterNames,
  resetStoredWaiterNames,
  buildTablesList,
  AppSettings,
  DEFAULT_USER_PROFILE,
  DEFAULT_WAITER_NAMES,
} from './utils/storage';
import {
  subscribeToTables,
  syncSingleTable,
  subscribeToKitchenOrders,
  syncKitchenOrder,
  removeKitchenOrder,
  subscribeToReceipts,
  syncReceipt,
  clearAllReceiptsFromCloud,
  subscribeToSettings,
  syncSettings,
  subscribeToWaiterNames,
  syncWaiterNames,
} from './utils/syncService';
import { posAudio } from './utils/audio';
import { InitialGatekeeper } from './components/InitialGatekeeper';
import { MesasSelector } from './components/MesasSelector';
import { PosOrderView } from './components/PosOrderView';
import { KitchenKds } from './components/KitchenKds';
import { SalesHistoryModal } from './components/SalesHistoryModal';
import { RoleSelectorModal } from './components/RoleSelectorModal';
import { AdminViewerDashboard } from './components/AdminViewerDashboard';

export default function App() {
  const initialStoredUser = loadStoredUserProfile();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(initialStoredUser);
  const [waiterNames, setWaiterNames] = useState<Record<number, string>>(loadStoredWaiterNames);
  const [currentScreen, setCurrentScreen] = useState<'inicio' | 'mesas' | 'pedido' | 'cocina' | 'visor'>(
    initialStoredUser
      ? initialStoredUser.role === 'cocina'
        ? 'cocina'
        : initialStoredUser.role === 'visor'
        ? 'visor'
        : 'mesas'
      : 'inicio'
  );
  const [showRoleModal, setShowRoleModal] = useState<boolean>(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [tables, setTables] = useState<ActiveTable[]>(loadStoredTables);
  const [kitchenOrders, setKitchenOrders] = useState<KitchenOrder[]>(loadStoredKitchen);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>(loadStoredReceipts);
  const [settings, setSettings] = useState<AppSettings>(loadStoredSettings);
  const [showSalesModal, setShowSalesModal] = useState(false);

  // 1. Subscribe to real-time tables across all 20 tablets
  useEffect(() => {
    const unsubscribe = subscribeToTables((cloudTables) => {
      setTables(cloudTables);
      saveStoredTables(cloudTables);
    });
    return () => unsubscribe();
  }, []);

  // 2. Subscribe to real-time kitchen orders
  useEffect(() => {
    let isInitial = true;
    const unsubscribe = subscribeToKitchenOrders((cloudOrders) => {
      setKitchenOrders(cloudOrders);
      saveStoredKitchen(cloudOrders);

      // Play alert chime when a new kitchen order arrives from another tablet
      if (!isInitial && cloudOrders.length > 0) {
        const newest = cloudOrders[0];
        if (newest && Date.now() - newest.createdAt < 3500 && newest.status === 'pendiente') {
          posAudio.playKitchenSend();
        }
      }
      isInitial = false;
    });
    return () => unsubscribe();
  }, []);

  // 3. Subscribe to real-time sales receipts
  useEffect(() => {
    const unsubscribe = subscribeToReceipts((cloudReceipts) => {
      setReceipts(cloudReceipts);
      saveStoredReceipts(cloudReceipts);
    });
    return () => unsubscribe();
  }, []);

  // 4. Subscribe to restaurant settings
  useEffect(() => {
    const unsubscribe = subscribeToSettings((cloudSettings) => {
      setSettings((prev) => ({ ...prev, ...cloudSettings }));
      saveStoredSettings(cloudSettings);
    });
    return () => unsubscribe();
  }, []);

  // 5. Subscribe to waiter names roster (synced for 20 tablets)
  useEffect(() => {
    const unsubscribe = subscribeToWaiterNames((cloudNames) => {
      setWaiterNames((prev) => ({ ...prev, ...cloudNames }));
      saveStoredWaiterNames(cloudNames);
    });
    return () => unsubscribe();
  }, []);

  // Sound and profile persistence
  useEffect(() => {
    posAudio.toggleSound(settings.soundEnabled);
  }, [settings.soundEnabled]);

  useEffect(() => {
    if (userProfile) {
      saveStoredUserProfile(userProfile);
      if (userProfile.role === 'mesero') {
        setSettings((prev) => ({ ...prev, waiterName: userProfile.name }));
      }
    }
  }, [userProfile]);

  // Selected table reference
  const currentTable = tables.find((t) => t.id === selectedTableId) || null;

  // Gatekeeper Selection Handlers
  const handleGatekeeperWaiter = (waiterNumber: number) => {
    const assignedName = waiterNames[waiterNumber] || `Mesero ${waiterNumber}`;
    const profile: UserProfile = {
      role: 'mesero',
      name: assignedName,
      waiterId: waiterNumber,
    };
    setUserProfile(profile);
    setCurrentScreen('mesas');
    setSelectedTableId(null);
    setShowSalesModal(false);
  };

  const handleGatekeeperKitchen = () => {
    const profile: UserProfile = {
      role: 'cocina',
      name: 'Cocina KDS',
    };
    setUserProfile(profile);
    setCurrentScreen('cocina');
    setSelectedTableId(null);
    setShowSalesModal(false);
  };

  const handleGatekeeperCashier = () => {
    const profile: UserProfile = {
      role: 'caja',
      name: 'Caja Principal / Admin',
    };
    setUserProfile(profile);
    setCurrentScreen('mesas');
    setSelectedTableId(null);
    setShowSalesModal(true);
  };

  const handleGatekeeperViewer = () => {
    const profile: UserProfile = {
      role: 'visor',
      name: 'Visor / Administrador en Vivo',
    };
    setUserProfile(profile);
    setCurrentScreen('visor');
    setSelectedTableId(null);
    setShowSalesModal(false);
  };

  // Waiter Names Management Handlers (Admin)
  const handleUpdateWaiterNames = (updatedNames: Record<number, string>) => {
    setWaiterNames(updatedNames);
    saveStoredWaiterNames(updatedNames);
    syncWaiterNames(updatedNames);
    if (userProfile && userProfile.role === 'mesero' && userProfile.waiterId) {
      const newName = updatedNames[userProfile.waiterId] || `Mesero ${userProfile.waiterId}`;
      setUserProfile((prev) => (prev ? { ...prev, name: newName } : prev));
    }
  };

  const handleResetWaiterNames = () => {
    const resetNames = resetStoredWaiterNames();
    setWaiterNames(resetNames);
    syncWaiterNames(resetNames);
    if (userProfile && userProfile.role === 'mesero' && userProfile.waiterId) {
      const newName = `Mesero ${userProfile.waiterId}`;
      setUserProfile((prev) => (prev ? { ...prev, name: newName } : prev));
    }
  };

  // Exit / Return to Initial Gatekeeper Screen
  const handleExitToGatekeeper = () => {
    posAudio.playClick();
    setUserProfile(null);
    clearStoredUserProfile();
    setCurrentScreen('inicio');
    setSelectedTableId(null);
    setShowSalesModal(false);
    setShowRoleModal(false);
  };

  const handleSelectRole = (profile: UserProfile) => {
    setUserProfile(profile);
    setShowRoleModal(false);
    
    if (profile.role === 'cocina') {
      setCurrentScreen('cocina');
      setSelectedTableId(null);
    } else if (profile.role === 'visor') {
      setCurrentScreen('visor');
      setSelectedTableId(null);
    } else {
      if (currentScreen === 'cocina' || currentScreen === 'inicio' || currentScreen === 'visor') {
        setCurrentScreen('mesas');
      }
    }
  };

  const handleSelectTable = (tableId: string) => {
    setSelectedTableId(tableId);
    setCurrentScreen('pedido');
  };

  const handleUpdateTableItems = (tableId: string, newItems: OrderItem[]) => {
    const currentWaiter = userProfile?.name || settings.waiterName || 'Mesero 1';

    let updatedTable: ActiveTable | null = null;
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === tableId) {
          const status = newItems.length === 0 ? 'libre' : t.status === 'libre' ? 'activo' : t.status;
          updatedTable = {
            ...t,
            items: newItems,
            status,
            openedAt: t.openedAt || Date.now(),
            waiterName: t.waiterName || currentWaiter,
          };
          return updatedTable;
        }
        return t;
      })
    );

    if (updatedTable) {
      syncSingleTable(updatedTable);
    }
  };

  // Admin Void Item Handler (Syncs with KDS Kitchen Monitor and Recalculates Total Immediately)
  const handleVoidItemByAdmin = (tableId: string, itemId: string, reason: string) => {
    posAudio.playVoidAlert();

    // 1. Remove/Void from Table items to immediately adjust Total Cuenta
    let updatedTable: ActiveTable | null = null;
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === tableId) {
          const remainingItems = t.items.filter((it) => it.id !== itemId);
          const status = remainingItems.length === 0 ? 'libre' : t.status;
          updatedTable = {
            ...t,
            items: remainingItems,
            status,
          };
          return updatedTable;
        }
        return t;
      })
    );

    if (updatedTable) {
      syncSingleTable(updatedTable);
    }

    // 2. Mark item as VOIDED in active Kitchen Orders (so kitchen staff gets immediate visual alert not to cook it)
    setKitchenOrders((prev) =>
      prev.map((order) => {
        const hasItem = order.items.some((it) => it.id === itemId);
        if (!hasItem) return order;

        const updatedOrderItems = order.items.map((it) => {
          if (it.id === itemId) {
            return {
              ...it,
              isVoided: true,
              voidReason: reason,
              voidedAt: Date.now(),
            };
          }
          return it;
        });

        const updatedOrder: KitchenOrder = {
          ...order,
          items: updatedOrderItems,
          updatedAt: Date.now(),
        };
        syncKitchenOrder(updatedOrder);
        return updatedOrder;
      })
    );
  };

  // Admin Modify Item Handler (Sustituir plato, cambiar combo, notas o cantidades)
  const handleModifyItemByAdmin = (tableId: string, updatedItem: OrderItem) => {
    posAudio.playClick();

    // 1. Update in Table items (recalculates pre-bill and total automatically)
    let updatedTable: ActiveTable | null = null;
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === tableId) {
          const updatedItems = t.items.map((it) =>
            it.id === updatedItem.id ? { ...updatedItem, isModified: true, modifiedAt: Date.now() } : it
          );
          updatedTable = {
            ...t,
            items: updatedItems,
          };
          return updatedTable;
        }
        return t;
      })
    );

    if (updatedTable) {
      syncSingleTable(updatedTable);
    }

    // 2. Synchronize modifications to Kitchen KDS in real-time
    setKitchenOrders((prev) =>
      prev.map((order) => {
        const hasItem = order.items.some((it) => it.id === updatedItem.id);
        if (!hasItem) return order;

        const updatedOrderItems = order.items.map((it) => {
          if (it.id === updatedItem.id) {
            return {
              ...it,
              name: updatedItem.name,
              quantity: updatedItem.quantity,
              price: updatedItem.price,
              isCombo: updatedItem.isCombo,
              comboNote: updatedItem.comboNote,
              term: updatedItem.term,
              note: updatedItem.note,
              area: updatedItem.area,
              isModified: true,
              modifiedAt: Date.now(),
            };
          }
          return it;
        });

        const updatedOrder: KitchenOrder = {
          ...order,
          items: updatedOrderItems,
          updatedAt: Date.now(),
        };
        syncKitchenOrder(updatedOrder);
        return updatedOrder;
      })
    );
  };

  const handleSendToKitchen = (table: ActiveTable, itemsToSend: OrderItem[]) => {
    const isAddition = table.items.some((it) => it.sentToKitchen);
    const prevRound = table.currentRound || 1;
    const roundNumber = isAddition ? prevRound + 1 : 1;
    const orderNumber = table.orderNumber || Math.floor(Math.random() * 900 + 100);
    const responsibleWaiter = userProfile?.name || table.waiterName || settings.waiterName || 'Mesero 1';

    const stampedItems = itemsToSend.map((it) => ({
      ...it,
      sentToKitchen: true,
      round: roundNumber,
      sentAt: Date.now(),
    }));

    const newKitchenOrder: KitchenOrder = {
      id: `k-${Date.now()}`,
      orderNumber,
      tableLabel: table.label,
      tableType: table.type,
      customerName: table.customerName,
      items: stampedItems,
      status: 'pendiente',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      waiterName: responsibleWaiter,
      isAddition,
      additionRound: roundNumber,
    };

    // Sync new kitchen order to all tablets
    syncKitchenOrder(newKitchenOrder);
    setKitchenOrders((prev) => [newKitchenOrder, ...prev]);

    let updatedTable: ActiveTable | null = null;
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === table.id) {
          const sentIds = new Set(itemsToSend.map((it) => it.id));
          const updatedTableItems = t.items.map((it) => {
            if (sentIds.has(it.id)) {
              return {
                ...it,
                sentToKitchen: true,
                round: it.round || roundNumber,
                sentAt: it.sentAt || Date.now(),
              };
            }
            return it;
          });

          updatedTable = {
            ...t,
            customerName: table.customerName,
            address: table.address,
            status: 'cocina',
            orderNumber,
            currentRound: roundNumber,
            items: updatedTableItems,
            lastKitchenSendAt: Date.now(),
            waiterName: responsibleWaiter,
          };
          return updatedTable;
        }
        return t;
      })
    );

    if (updatedTable) {
      syncSingleTable(updatedTable);
    }
  };

  const handleUpdateTableStatus = (tableId: string, status: TableStatus) => {
    let updatedTable: ActiveTable | null = null;
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === tableId) {
          updatedTable = { ...t, status };
          return updatedTable;
        }
        return t;
      })
    );

    if (updatedTable) {
      syncSingleTable(updatedTable);
    }
  };

  const handleCompletePayment = (receipt: PaymentReceipt) => {
    // Sync payment receipt to cloud
    syncReceipt(receipt);
    setReceipts((prev) => [receipt, ...prev]);

    // Reset and free table
    let clearedTable: ActiveTable | null = null;
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === selectedTableId || t.label === receipt.tableLabel) {
          clearedTable = {
            ...t,
            items: [],
            status: 'libre',
            customerName: undefined,
            phone: undefined,
            address: undefined,
            openedAt: undefined,
            lastKitchenSendAt: undefined,
            orderNumber: undefined,
            currentRound: 1,
            waiterName: undefined,
          };
          return clearedTable;
        }
        return t;
      })
    );

    if (clearedTable) {
      syncSingleTable(clearedTable);
    }

    // If we were inside the single order screen, return to mesas
    if (currentScreen === 'pedido') {
      setCurrentScreen('mesas');
      setSelectedTableId(null);
    }
  };

  const handleUpdateKitchenStatus = (
    orderId: string,
    status: 'pendiente' | 'preparando' | 'listo' | 'entregado'
  ) => {
    setKitchenOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated: KitchenOrder = { ...o, status, updatedAt: Date.now() };
          syncKitchenOrder(updated);
          return updated;
        }
        return o;
      })
    );
  };

  const handleDeleteKitchenOrder = (orderId: string) => {
    removeKitchenOrder(orderId);
    setKitchenOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const handleClearReceipts = () => {
    clearAllReceiptsFromCloud();
    setReceipts([]);
  };

  const activeProfile = userProfile || DEFAULT_USER_PROFILE;
  const activeKitchenCount = kitchenOrders.filter((o) => o.status !== 'entregado').length;
  const pendingPaymentCount = tables.filter((t) => t.items.length > 0 && t.status === 'cuenta').length;
  const occupiedTablesCount = tables.filter((t) => t.items.length > 0).length;

  return (
    <div className="w-full h-screen bg-[#0f172a] text-slate-100 overflow-hidden font-sans">
      {/* 1. PANTALLA INICIAL DE ACCESO (Gatekeeper) */}
      {currentScreen === 'inicio' && (
        <InitialGatekeeper
          onSelectWaiter={handleGatekeeperWaiter}
          onSelectKitchen={handleGatekeeperKitchen}
          onSelectCashier={handleGatekeeperCashier}
          onSelectViewer={handleGatekeeperViewer}
          waiterNames={waiterNames}
          activeKitchenCount={activeKitchenCount}
          pendingPaymentCount={pendingPaymentCount}
          occupiedTablesCount={occupiedTablesCount}
        />
      )}

      {/* 2. MAPA DE MESAS */}
      {currentScreen === 'mesas' && (
        <MesasSelector
          tables={tables}
          kitchenOrders={kitchenOrders}
          currentUser={activeProfile}
          onOpenRoleSelector={() => setShowRoleModal(true)}
          onExitToGatekeeper={handleExitToGatekeeper}
          onSelectTable={handleSelectTable}
          onOpenKitchen={() => setCurrentScreen('cocina')}
          onOpenSalesHistory={() => {
            if (activeProfile.role !== 'caja') {
              setShowRoleModal(true);
            } else {
              setShowSalesModal(true);
            }
          }}
          soundEnabled={settings.soundEnabled}
          onToggleSound={() =>
            setSettings((prev) => ({
              ...prev,
              soundEnabled: !prev.soundEnabled,
            }))
          }
        />
      )}

      {/* 3. PANTALLA DE PEDIDO EN MESA */}
      {currentScreen === 'pedido' && currentTable && (
        <PosOrderView
          table={currentTable}
          currentUser={activeProfile}
          onOpenRoleSelector={() => setShowRoleModal(true)}
          onExitToGatekeeper={handleExitToGatekeeper}
          onBackToTables={() => {
            setCurrentScreen('mesas');
            setSelectedTableId(null);
          }}
          onUpdateTableItems={handleUpdateTableItems}
          onUpdateTableStatus={handleUpdateTableStatus}
          onSendToKitchen={handleSendToKitchen}
          onCompletePayment={handleCompletePayment}
          onVoidItemByAdmin={handleVoidItemByAdmin}
          onModifyItemByAdmin={handleModifyItemByAdmin}
        />
      )}

      {/* 4. PANTALLA DE COCINA (KDS) */}
      {currentScreen === 'cocina' && (
        <KitchenKds
          orders={kitchenOrders}
          currentUser={activeProfile}
          onOpenRoleSelector={() => setShowRoleModal(true)}
          onExitToGatekeeper={handleExitToGatekeeper}
          onBackToTables={() => setCurrentScreen('mesas')}
          onUpdateStatus={handleUpdateKitchenStatus}
          onDeleteOrder={handleDeleteKitchenOrder}
        />
      )}

      {/* 5. PANTALLA DE VISOR / ESPECTADOR (MODO ADMIN EN VIVO) */}
      {currentScreen === 'visor' && (
        <AdminViewerDashboard
          tables={tables}
          kitchenOrders={kitchenOrders}
          receipts={receipts}
          waiterNames={waiterNames}
          currentUser={activeProfile}
          onExitToGatekeeper={handleExitToGatekeeper}
          onOpenMesas={() => setCurrentScreen('mesas')}
          onOpenKitchen={() => setCurrentScreen('cocina')}
          onOpenSalesModal={() => setShowSalesModal(true)}
          onOpenRoleSelector={() => setShowRoleModal(true)}
        />
      )}

      {/* MODAL DE CAJA & ARQUEO */}
      {showSalesModal && (
        <SalesHistoryModal
          receipts={receipts}
          tables={tables}
          waiterNames={waiterNames}
          onUpdateWaiterNames={handleUpdateWaiterNames}
          onResetWaiterNames={handleResetWaiterNames}
          onClose={() => setShowSalesModal(false)}
          onClearReceipts={handleClearReceipts}
          onCompletePayment={handleCompletePayment}
          onExitToGatekeeper={handleExitToGatekeeper}
          onSelectTable={(tableId) => {
            setShowSalesModal(false);
            handleSelectTable(tableId);
          }}
        />
      )}

      {/* MODAL DE CAMBIO RÁPIDO DE ROL */}
      {showRoleModal && (
        <RoleSelectorModal
          currentUser={userProfile}
          waiterNames={waiterNames}
          onSelectRole={handleSelectRole}
          onClose={() => {
            setShowRoleModal(false);
          }}
        />
      )}
    </div>
  );
}
