import { ActiveTable, KitchenOrder, PaymentReceipt, UserProfile } from '../types';

const TABLES_KEY = 'pollos_sabor_tables_v1';
const KITCHEN_KEY = 'pollos_sabor_kitchen_v1';
const RECEIPTS_KEY = 'pollos_sabor_receipts_v1';
const SETTINGS_KEY = 'pollos_sabor_settings_v1';
const USER_PROFILE_KEY = 'pollos_sabor_user_profile_v1';
const WAITER_NAMES_KEY = 'pollos_sabor_waiter_names_v1';

export const DEFAULT_WAITER_NAMES: Record<number, string> = Array.from(
  { length: 20 },
  (_, i) => i + 1
).reduce((acc, num) => {
  acc[num] = `Mesero ${num}`;
  return acc;
}, {} as Record<number, string>);

export const DEFAULT_USER_PROFILE: UserProfile = {
  role: 'mesero',
  name: 'Mesero 1',
  waiterId: 1,
};

export const CAJA_DEFAULT_PIN = '1234';

export const buildTablesList = (
  existingTables: ActiveTable[] = []
): ActiveTable[] => {
  const tableMap = new Map<string, ActiveTable>();
  for (const t of existingTables) {
    if (t && t.id && t.type !== 'barra' && t.type !== 'domicilio') {
      tableMap.set(t.id, t);
    }
  }

  // Exactly 90 tables (Mesa 1 to Mesa 90)
  const result: ActiveTable[] = Array.from({ length: 90 }, (_, i) => {
    const id = `Mesa ${i + 1}`;
    const existing = tableMap.get(id);
    if (existing) {
      return {
        ...existing,
        id,
        label: `Mesa ${i + 1}`,
        type: 'mesa' as const,
      };
    }
    return {
      id,
      label: `Mesa ${i + 1}`,
      type: 'mesa' as const,
      status: 'libre' as const,
      items: [],
    };
  });

  return result;
};

export const INITIAL_TABLES: ActiveTable[] = buildTablesList();

export interface AppSettings {
  waiterName: string;
  restaurantName: string;
  nit: string;
  phone: string;
  address: string;
  soundEnabled: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  waiterName: 'Mesero 1',
  restaurantName: 'POLLOS & SABOR',
  nit: '901.234.567-8',
  phone: '315 313 4721',
  address: 'Sede Principal',
  soundEnabled: true,
};

export const loadStoredTables = (): ActiveTable[] => {
  try {
    const raw = localStorage.getItem(TABLES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return buildTablesList(parsed);
      }
    }
  } catch (e) {
    console.error('Failed to load stored tables', e);
  }
  return buildTablesList();
};

export const saveStoredTables = (tables: ActiveTable[]) => {
  try {
    localStorage.setItem(TABLES_KEY, JSON.stringify(tables));
  } catch (e) {
    console.error('Failed to save tables', e);
  }
};

export const loadStoredKitchen = (): KitchenOrder[] => {
  try {
    const raw = localStorage.getItem(KITCHEN_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return [];
};

export const saveStoredKitchen = (orders: KitchenOrder[]) => {
  try {
    localStorage.setItem(KITCHEN_KEY, JSON.stringify(orders));
  } catch {}
};

export const loadStoredReceipts = (): PaymentReceipt[] => {
  try {
    const raw = localStorage.getItem(RECEIPTS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return [];
};

export const saveStoredReceipts = (receipts: PaymentReceipt[]) => {
  try {
    localStorage.setItem(RECEIPTS_KEY, JSON.stringify(receipts));
  } catch {}
};

export const loadStoredSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_SETTINGS;
};

export const saveStoredSettings = (settings: AppSettings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
};

export const loadStoredUserProfile = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return null;
};

export const saveStoredUserProfile = (profile: UserProfile) => {
  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch {}
};

export const clearStoredUserProfile = () => {
  try {
    localStorage.removeItem(USER_PROFILE_KEY);
  } catch {}
};

export const loadStoredWaiterNames = (): Record<number, string> => {
  try {
    const raw = localStorage.getItem(WAITER_NAMES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_WAITER_NAMES, ...parsed };
    }
  } catch {}
  return DEFAULT_WAITER_NAMES;
};

export const saveStoredWaiterNames = (names: Record<number, string>) => {
  try {
    localStorage.setItem(WAITER_NAMES_KEY, JSON.stringify(names));
  } catch {}
};

export const resetStoredWaiterNames = (): Record<number, string> => {
  try {
    localStorage.removeItem(WAITER_NAMES_KEY);
  } catch {}
  return DEFAULT_WAITER_NAMES;
};
