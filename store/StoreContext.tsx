import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Ingredient, Packaging, Product, StoreContextType, ProductCategory, AppSettings } from '../types';
import { INITIAL_INGREDIENTS, INITIAL_PACKAGING, INITIAL_PRODUCTS } from '../constants';

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>(INITIAL_INGREDIENTS);
  const [packaging, setPackaging] = useState<Packaging[]>(INITIAL_PACKAGING);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [settings, setSettings] = useState<AppSettings>({ defaultProductionMode: 'units' });

  const addIngredient = (ing: Ingredient) => {
    setIngredients((prev) => [...prev, ing]);
  };

  const updateIngredient = (id: string, updates: Partial<Ingredient>) => {
    setIngredients((prev) =>
      prev.map((ing) => (ing.id === id ? { ...ing, ...updates } : ing))
    );
  };

  const removeIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((ing) => ing.id !== id));
  };

  const addPackaging = (pack: Packaging) => {
    setPackaging((prev) => [...prev, pack]);
  };

  const updatePackaging = (id: string, updates: Partial<Packaging>) => {
    setPackaging((prev) =>
      prev.map((pack) => (pack.id === id ? { ...pack, ...updates } : pack))
    );
  };

  const addProduct = (prod: Product) => {
    setProducts((prev) => [...prev, prod]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((prod) => (prod.id === id ? { ...prod, ...updates } : prod))
    );
  };

  const removeProduct = (id: string) => {
    setProducts((prev) => prev.filter((prod) => prod.id !== id));
  };

  const produceProduct = (productId: string, batchSize: number): { success: boolean; message: string } => {
    const product = products.find((p) => p.id === productId);
    if (!product) return { success: false, message: 'Product not found' };

    const selectedPackaging = packaging.find(p => p.id === product.packagingId);
    if (!selectedPackaging) return { success: false, message: 'Packaging definition missing' };

    // 1. Check Ingredients
    for (const item of product.formula) {
      const ing = ingredients.find((i) => i.id === item.ingredientId);
      if (!ing) return { success: false, message: `Ingredient not found for formula` };
      
      const totalNeeded = item.amount * batchSize; 
      if (ing.stock < totalNeeded) {
        return { 
          success: false, 
          message: `Insufficient stock for ${ing.name}. Needed: ${totalNeeded/1000}${ing.unit}, Have: ${ing.stock/1000}${ing.unit}` 
        };
      }
    }

    // 2. Check Packaging
    const totalVolumeMl = batchSize * 1000;
    const unitsToProduce = Math.floor(totalVolumeMl / selectedPackaging.capacity);

    if (unitsToProduce <= 0) {
        return { success: false, message: 'Batch size too small for selected packaging.' };
    }

    if (selectedPackaging.stock < unitsToProduce) {
      return { 
        success: false, 
        message: `Insufficient packaging. Needed: ${unitsToProduce}, Have: ${selectedPackaging.stock}` 
      };
    }

    // 3. Consume Resources
    const newIngredients = ingredients.map((ing) => {
      const formulaItem = product.formula.find((f) => f.ingredientId === ing.id);
      if (formulaItem) {
        return { ...ing, stock: ing.stock - (formulaItem.amount * batchSize) };
      }
      return ing;
    });

    const newPackaging = packaging.map((pack) => {
      if (pack.id === selectedPackaging.id) {
        return { ...pack, stock: pack.stock - unitsToProduce };
      }
      return pack;
    });

    // 4. Update Product Stock
    const newProducts = products.map((prod) => {
      if (prod.id === productId) {
        return { ...prod, stock: prod.stock + unitsToProduce };
      }
      return prod;
    });

    setIngredients(newIngredients);
    setPackaging(newPackaging);
    setProducts(newProducts);

    return { success: true, message: `Successfully produced ${unitsToProduce} units (${batchSize}kg/L batch).` };
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <StoreContext.Provider
      value={{
        ingredients,
        packaging,
        products,
        settings,
        addIngredient,
        updateIngredient,
        removeIngredient,
        addPackaging,
        updatePackaging,
        addProduct,
        updateProduct,
        removeProduct,
        produceProduct,
        updateSettings,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};