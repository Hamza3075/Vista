
export type Unit = 'g' | 'kg' | 'ml' | 'l' | 'pcs';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  error?: string;
  errorCode?: number;
  data?: T;
}

export interface Ingredient {
  id: string;
  name: string;
  stock: number; // stored in base units (g or ml)
  unit: Unit; // display unit (usually kg or l)
  costPerBaseUnit: number; // cost per g or ml
  minStock?: number; // alert threshold in base units
  isCommon?: boolean; // If true, stock is treated as infinite
}

export interface Packaging {
  id: string;
  name: string;
  capacity: number; // in ml
  stock: number;
  cost: number;
  minStock?: number; // alert threshold in pieces
}

export interface FormulaItem {
  ingredientId: string;
  percentage: number; // percentage of total volume (0-100)
}

export enum ProductCategory {
  SKIN_CARE = 'Skin Care',
  HAIR_CARE = 'Hair Care',
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  formula: FormulaItem[];
  packagingId: string;
  salePrice: number;
  stock: number; // Number of finished units (glasses)
}

export interface FormulaDraft {
  name: string;
  price: string;
  formula: FormulaItem[];
  packagingId: string;
  category: ProductCategory | null;
}

export interface NavigationState {
  inventoryTab: 'ingredients' | 'packaging';
  insightsTab: 'performance' | 'marketing';
  activeMainView: 'dashboard' | 'production' | 'inventory' | 'insights' | 'settings' | 'access';
}

export interface AppSettings {
  defaultProductionMode: 'glasses' | 'batch';
}

export interface InviteToken {
  id: string;
  token: string;
  createdAt: string;
  status: 'active' | 'used';
  usedBy?: string;
}

export interface ActionPermissions {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

export interface Permissions {
  products: ActionPermissions;
  ingredients: ActionPermissions;
  packaging: ActionPermissions;
  sales: ActionPermissions;
  access: ActionPermissions;
}

export interface Role {
  id: string;
  name: string;
  permissions: Permissions;
}

export interface UserAccess {
  /** id is required for DataTable, aliasing userId */
  id: string;
  userId: string;
  email: string;
  roleId: string;
  customPermissions?: Partial<Permissions>;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  source: string;
  message: string;
  details?: any;
}

export interface SystemStatus {
  auth: 'connected' | 'error' | 'loading';
  database: 'connected' | 'error' | 'loading';
}

export interface StoreContextType {
  ingredients: Ingredient[];
  packaging: Packaging[];
  products: Product[];
  settings: AppSettings;
  tokens: InviteToken[];
  roles: Role[];
  userAccessList: UserAccess[];
  isAuthorized: boolean;
  logs: LogEntry[];
  // Draft & Navigation State
  formulaDraft: FormulaDraft | null;
  setFormulaDraft: (draft: FormulaDraft | null) => void;
  navigation: NavigationState;
  updateNavigation: (updates: Partial<NavigationState>) => void;
  // Actions
  addLog: (level: LogEntry['level'], source: string, message: string, details?: any) => void;
  addIngredient: (ing: Ingredient) => Promise<ApiResponse>;
  updateIngredient: (id: string, updates: Partial<Ingredient>) => Promise<ApiResponse>;
  removeIngredient: (id: string) => Promise<ApiResponse>;
  addPackaging: (pack: Packaging) => Promise<ApiResponse>;
  updatePackaging: (id: string, updates: Partial<Packaging>) => Promise<ApiResponse>;
  removePackaging: (id: string) => Promise<ApiResponse>;
  addProduct: (prod: Product) => Promise<ApiResponse>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<ApiResponse>;
  removeProduct: (id: string) => Promise<ApiResponse>;
  produceProduct: (productId: string, batchSize: number, packagingId?: string) => Promise<ApiResponse>;
  recordSale: (productId: string, volumeL: number, pricePerUnit: number) => Promise<ApiResponse>;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  generateInviteToken: () => Promise<string>;
  validateInviteToken: (token: string, userId: string) => Promise<ApiResponse>;
  removeInviteToken: (id: string) => Promise<ApiResponse>;
  setAuthorized: (val: boolean) => void;
  addRole: (role: Role) => Promise<ApiResponse>;
  updateRole: (id: string, updates: Partial<Role>) => Promise<ApiResponse>;
  removeRole: (id: string) => Promise<ApiResponse>;
  updateUserAccess: (userId: string, updates: Partial<UserAccess>) => Promise<ApiResponse>;
}
