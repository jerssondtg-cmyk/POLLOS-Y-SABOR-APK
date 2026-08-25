import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ActiveTable, KitchenOrder, PaymentReceipt } from '../types';
import { AppSettings, buildTablesList } from './storage';

export type SyncStatus = 'connected' | 'syncing' | 'offline' | 'error';

export interface NetworkSyncState {
  status: SyncStatus;
  lastSyncedAt: number;
  activeNodesCount: number;
}

// 1. REAL-TIME TABLES SYNC
export const subscribeToTables = (
  onTablesUpdated: (tables: ActiveTable[]) => void,
  onError?: (err: any) => void
) => {
  const tablesCol = collection(db, 'tables');

  return onSnapshot(
    tablesCol,
    (snapshot) => {
      if (snapshot.empty) {
        // If Firestore is empty, seed with 90 tables
        const defaultTables = buildTablesList();
        seedDefaultTables(defaultTables);
        onTablesUpdated(defaultTables);
      } else {
        const fetchedTables: ActiveTable[] = [];
        snapshot.forEach((docSnap) => {
          fetchedTables.push(docSnap.data() as ActiveTable);
        });

        // Ensure all 90 tables exist and are properly sorted
        const mergedTables = buildTablesList(fetchedTables);
        onTablesUpdated(mergedTables);
      }
    },
    (error) => {
      console.warn('Firestore tables subscription warning:', error);
      if (onError) onError(error);
    }
  );
};

export const syncSingleTable = async (table: ActiveTable) => {
  try {
    const tableRef = doc(db, 'tables', table.id);
    await setDoc(
      tableRef,
      {
        ...table,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error syncing table to cloud:', err);
  }
};

export const seedDefaultTables = async (tables: ActiveTable[]) => {
  try {
    const batch = writeBatch(db);
    for (const t of tables) {
      const ref = doc(db, 'tables', t.id);
      batch.set(ref, { ...t, updatedAt: Date.now() }, { merge: true });
    }
    await batch.commit();
  } catch (err) {
    console.error('Error seeding default tables to Firestore:', err);
  }
};

// 2. REAL-TIME KITCHEN (KDS) ORDERS SYNC
export const subscribeToKitchenOrders = (
  onOrdersUpdated: (orders: KitchenOrder[]) => void,
  onError?: (err: any) => void
) => {
  const ordersCol = collection(db, 'kitchenOrders');

  return onSnapshot(
    ordersCol,
    (snapshot) => {
      const orders: KitchenOrder[] = [];
      snapshot.forEach((docSnap) => {
        orders.push(docSnap.data() as KitchenOrder);
      });
      // Sort newest created first
      orders.sort((a, b) => b.createdAt - a.createdAt);
      onOrdersUpdated(orders);
    },
    (error) => {
      console.warn('Firestore kitchen subscription warning:', error);
      if (onError) onError(error);
    }
  );
};

export const syncKitchenOrder = async (order: KitchenOrder) => {
  try {
    const orderRef = doc(db, 'kitchenOrders', order.id);
    await setDoc(orderRef, order, { merge: true });
  } catch (err) {
    console.error('Error syncing kitchen order:', err);
  }
};

export const removeKitchenOrder = async (orderId: string) => {
  try {
    const orderRef = doc(db, 'kitchenOrders', orderId);
    await deleteDoc(orderRef);
  } catch (err) {
    console.error('Error deleting kitchen order:', err);
  }
};

// 3. REAL-TIME RECEIPTS & SALES SYNC
export const subscribeToReceipts = (
  onReceiptsUpdated: (receipts: PaymentReceipt[]) => void,
  onError?: (err: any) => void
) => {
  const receiptsCol = collection(db, 'receipts');

  return onSnapshot(
    receiptsCol,
    (snapshot) => {
      const list: PaymentReceipt[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as PaymentReceipt);
      });
      list.sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));
      onReceiptsUpdated(list);
    },
    (error) => {
      console.warn('Firestore receipts subscription warning:', error);
      if (onError) onError(error);
    }
  );
};

export const syncReceipt = async (receipt: PaymentReceipt) => {
  try {
    const receiptRef = doc(db, 'receipts', receipt.id);
    await setDoc(receiptRef, receipt, { merge: true });
  } catch (err) {
    console.error('Error syncing receipt:', err);
  }
};

export const clearAllReceiptsFromCloud = async () => {
  try {
    const receiptsCol = collection(db, 'receipts');
    const snapshot = await getDocs(receiptsCol);
    const batch = writeBatch(db);
    snapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  } catch (err) {
    console.error('Error clearing receipts:', err);
  }
};

// 4. REAL-TIME RESTAURANT SETTINGS SYNC
export const subscribeToSettings = (
  onSettingsUpdated: (settings: AppSettings) => void
) => {
  const settingsDoc = doc(db, 'settings', 'restaurant_config');

  return onSnapshot(settingsDoc, (docSnap) => {
    if (docSnap.exists()) {
      onSettingsUpdated(docSnap.data() as AppSettings);
    }
  });
};

export const syncSettings = async (settings: AppSettings) => {
  try {
    const settingsDoc = doc(db, 'settings', 'restaurant_config');
    await setDoc(
      settingsDoc,
      { ...settings, updatedAt: Date.now() },
      { merge: true }
    );
  } catch (err) {
    console.error('Error syncing settings:', err);
  }
};

// 5. REAL-TIME WAITER ROSTER & NAMES SYNC (20 TABLETS)
export const subscribeToWaiterNames = (
  onNamesUpdated: (names: Record<number, string>) => void
) => {
  const waitersDoc = doc(db, 'waiters', 'roster');

  return onSnapshot(waitersDoc, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && data.waiterNames) {
        onNamesUpdated(data.waiterNames);
      }
    }
  });
};

export const syncWaiterNames = async (names: Record<number, string>) => {
  try {
    const waitersDoc = doc(db, 'waiters', 'roster');
    await setDoc(
      waitersDoc,
      { waiterNames: names, updatedAt: Date.now() },
      { merge: true }
    );
  } catch (err) {
    console.error('Error syncing waiter names:', err);
  }
};
