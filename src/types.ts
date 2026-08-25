export type CategoryType = 
  | 'Pollos'
  | 'Bandejas'
  | 'Parrilla'
  | 'Pescados'
  | 'Hamb/Perros'
  | 'Sopas'
  | 'Infantil'
  | 'Otros'
  | 'Bebidas'
  | 'Porciones';

export interface MenuItem {
  id: number;
  cat: CategoryType;
  name: string;
  desc: string;
  price: number;
  combo?: boolean;
  comboExtra?: number; // default 8000
  tags?: string[];
  area?: 'cocina' | 'parrilla' | 'bebidas' | 'freidora';
}

export interface OrderItem {
  id: string; // unique item instance id
  menuItemId: number;
  name: string;
  desc?: string;
  price: number;
  quantity: number;
  isCombo?: boolean;
  comboNote?: string;
  isTakeaway?: boolean; // Para llevar (Empacar)
  note: string;
  term?: string; // Término de carne (e.g., 1/2, 3/4, Bien Asado)
  beverageType?: string; // En agua / En leche / Fruta
  area?: 'cocina' | 'parrilla' | 'bebidas' | 'freidora';
  timestamp: number;
  sentToKitchen?: boolean; // True if already dispatched to kitchen
  round?: number; // 1 for initial order, 2 for 1st addition, etc.
  sentAt?: number;
  isVoided?: boolean; // Voided by Cashier/Admin
  voidReason?: string;
  voidedAt?: number;
  isModified?: boolean; // Modified by Cashier/Admin after sending
  modifiedAt?: number;
}

export type TableStatus = 'libre' | 'activo' | 'cocina' | 'servido' | 'cuenta';

export type UserRole = 'mesero' | 'caja' | 'cocina' | 'visor';

export interface UserProfile {
  role: UserRole;
  name: string; // 'Mesero 1'..'Mesero 20', 'Caja / Administrador', 'Cocina KDS'
  waiterId?: number; // 1 to 20 for meseros
}

export interface ActiveTable {
  id: string; // 'Mesa 1'..'Mesa 30', 'Barra 1', 'Domicilio 1', etc.
  label: string;
  type: 'mesa' | 'barra' | 'domicilio';
  status: TableStatus;
  items: OrderItem[];
  waiterName?: string;
  customerName?: string;
  phone?: string;
  address?: string;
  openedAt?: number;
  lastKitchenSendAt?: number;
  orderNumber?: number;
  currentRound?: number; // Active round counter
  tip?: number;
  discount?: number;
}

export interface KitchenOrder {
  id: string;
  orderNumber: number;
  tableLabel: string;
  tableType: 'mesa' | 'barra' | 'domicilio';
  customerName?: string;
  items: OrderItem[];
  status: 'pendiente' | 'preparando' | 'listo' | 'entregado';
  createdAt: number;
  updatedAt: number;
  waiterName: string;
  isAddition?: boolean; // True if this ticket is an extra order / adición
  additionRound?: number; // Round # (e.g. 2, 3)
}

export interface PaymentReceipt {
  id: string;
  orderNumber: number;
  tableLabel: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tip: number;
  total: number;
  paymentMethod: 'efectivo' | 'nequi' | 'daviplata' | 'tarjeta' | 'transferencia';
  amountReceived?: number;
  change?: number;
  closedAt: number;
  waiterName: string;
  customerName?: string;
}
