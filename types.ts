export type Unit = 'g' | 'kg' | 'ml' | 'l' | 'pcs';

export interface Ingredient {
  id: string;
  name: string;
  stock: number; // stored in base units (g or ml)
  unit: Unit; // display unit (usually kg or l)
  costPerBaseUnit: number; // cost per g or ml
}

export interface Packaging {
  id: string;
  name: string;
  capacity: number; // in ml
  stock: number;
  cost: number;
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

export interface StoreContextType {
  ingredients: Ingredient[];
  packaging: Packaging[];
  products: Product[];
  settings: AppSettings;
  addIngredient: (ing: Ingredient) => void;
  updateIngredient: (id: string, updates: Partial<Ingredient>) => void;
  removeIngredient: (id: string) => void;
  addPackaging: (pack: Packaging) => void;
  updatePackaging: (id: string, updates: Partial<Packaging>) => void;
  addProduct: (prod: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  produceProduct: (productId: string, batchSize: number) => { success: boolean; message: string };
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}