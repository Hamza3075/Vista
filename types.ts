
export type Unit = 'g' | 'kg' | 'ml' | 'l' | 'pcs';

export interface Ingredient {
  id: string;
  name: string;
  stock: number; // stored in base units (g or ml)
  unit: Unit; // display unit (usually kg or l)
  costPerBaseUnit: number; // cost per g or ml
  minStock?: number; // alert threshold in base units
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
  amount: number; // amount per 1 unit (1000ml/1000g) of product
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
  stock: number; // Number of finished units
}

export interface AppSettings {
  defaultProductionMode: 'units' | 'batch';
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

export interface StoreContextType {
  ingredients: Ingredient[];
  packaging: Packaging[];
  products: Product[];
  settings: AppSettings;
  tokens: InviteToken[];
  roles: Role[];
  userAccessList: UserAccess[];
  isAuthorized: boolean;
  addIngredient: (ing: Ingredient) => void;
  updateIngredient: (id: string, updates: Partial<Ingredient>) => void;
  removeIngredient: (id: string) => void;
  addPackaging: (pack: Packaging) => void;
  updatePackaging: (id: string, updates: Partial<Packaging>) => void;
  addProduct: (prod: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  produceProduct: (productId: string, batchSize: number) => { success: boolean; message: string };
  recordSale: (productId: string, volumeL: number, pricePerUnit: number) => { success: boolean; message: string };
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  generateInviteToken: () => Promise<string>;
  validateInviteToken: (token: string, userId: string) => Promise<{ success: boolean; message: string }>;
  removeInviteToken: (id: string) => Promise<void>;
  setAuthorized: (val: boolean) => void;
  addRole: (role: Role) => void;
  updateRole: (id: string, updates: Partial<Role>) => void;
  removeRole: (id: string) => void;
  updateUserAccess: (userId: string, updates: Partial<UserAccess>) => void;
}