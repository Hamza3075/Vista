
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Ingredient, Packaging, Product, StoreContextType, InviteToken, AppSettings, FormulaItem, Role, UserAccess, Permissions } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const DEFAULT_PERMISSIONS: Permissions = {
  products: { read: true, create: false, update: false, delete: false },
  ingredients: { read: true, create: false, update: false, delete: false },
  packaging: { read: true, create: false, update: false, delete: false },
  sales: { read: true, create: false, update: false, delete: false },
  access: { read: false, create: false, update: false, delete: false },
};

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [packaging, setPackaging] = useState<Packaging[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ defaultProductionMode: 'units' });
  const [tokens, setTokens] = useState<InviteToken[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userAccessList, setUserAccessList] = useState<UserAccess[]>([]);
  const [loading, setLoading] = useState(true);

  const isAuthorized = !!user?.user_metadata?.is_authorized;

  useEffect(() => {
    if (!user) {
      setIngredients([]);
      setPackaging([]);
      setProducts([]);
      setRoles([]);
      setUserAccessList([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [ingRes, packRes, prodRes, roleRes, accessRes] = await Promise.all([
          supabase.from('ingredients').select('*').eq('user_id', user.id),
          supabase.from('packaging').select('*').eq('user_id', user.id),
          supabase.from('products').select('*, product_formulas(*)').eq('user_id', user.id),
          supabase.from('roles').select('*'),
          supabase.from('user_access').select('*')
        ]);

        if (ingRes.data) setIngredients(ingRes.data.map(i => ({ id: i.id, name: i.name, stock: i.stock, unit: i.unit, costPerBaseUnit: i.cost_per_base_unit, minStock: i.min_stock })));
        if (packRes.data) setPackaging(packRes.data.map(p => ({ id: p.id, name: p.name, capacity: p.capacity, stock: p.stock, cost: p.cost, minStock: p.min_stock })));
        if (prodRes.data) setProducts(prodRes.data.map(p => ({ 
          id: p.id, 
          name: p.name, 
          category: p.category, 
          packagingId: p.packaging_id, 
          salePrice: p.sale_price, 
          stock: p.stock, 
          formula: p.product_formulas.map((f: any) => ({ ingredientId: f.ingredient_id, amount: f.amount })) 
        })));
        
        if (roleRes.data) {
          setRoles(roleRes.data.map(r => ({ id: r.id, name: r.name, permissions: r.permissions })));
        } else {
          // Initialize default roles if table empty
          const initialRoles: Role[] = [
            { id: 'owner', name: 'Owner', permissions: { products: { read: true, create: true, update: true, delete: true }, ingredients: { read: true, create: true, update: true, delete: true }, packaging: { read: true, create: true, update: true, delete: true }, sales: { read: true, create: true, update: true, delete: true }, access: { read: true, create: true, update: true, delete: true } } },
            { id: 'sales-eng', name: 'Sales Engineer', permissions: { ...DEFAULT_PERMISSIONS, sales: { read: true, create: true, update: false, delete: false } } },
            { id: 'guest', name: 'Guest', permissions: DEFAULT_PERMISSIONS }
          ];
          setRoles(initialRoles);
        }

        if (accessRes.data) {
          /* Add id property to satisfy DataTable constraint */
          setUserAccessList(accessRes.data.map(a => ({ id: a.user_id, userId: a.user_id, email: a.email, roleId: a.role_id, customPermissions: a.custom_permissions })));
        }

      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const addRole = async (role: Role) => {
    const { data, error } = await supabase.from('roles').insert([{ name: role.name, permissions: role.permissions }]).select().single();
    if (data && !error) setRoles(prev => [...prev, { ...role, id: data.id }]);
  };

  const updateRole = async (id: string, updates: Partial<Role>) => {
    const { error } = await supabase.from('roles').update({ name: updates.name, permissions: updates.permissions }).eq('id', id);
    if (!error) setRoles(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const removeRole = async (id: string) => {
    if (id === 'owner') return;
    const { error } = await supabase.from('roles').delete().eq('id', id);
    if (!error) setRoles(prev => prev.filter(r => r.id !== id));
  };

  const updateUserAccess = async (userId: string, updates: Partial<UserAccess>) => {
    const { error } = await supabase.from('user_access').upsert({ 
      user_id: userId, 
      role_id: updates.roleId, 
      email: updates.email,
      custom_permissions: updates.customPermissions 
    });
    if (!error) setUserAccessList(prev => {
      const exists = prev.find(a => a.userId === userId);
      if (exists) return prev.map(a => a.userId === userId ? { ...a, ...updates } : a);
      /* Ensure newly added access record has an id */
      return [...prev, { id: userId, userId, email: updates.email!, roleId: updates.roleId!, ...updates }];
    });
  };

  const setAuthorized = async (val: boolean) => {
    if (!user) return;
    const { error } = await supabase.auth.updateUser({ data: { is_authorized: val } });
    if (!error && val) {
      // Create initial access record
      await updateUserAccess(user.id, { email: user.email!, roleId: user.email === 'safwatkamel6000@gmail.com' ? 'owner' : 'guest' });
    }
  };

  const addIngredient = async (ing: Ingredient) => {
    if (!user) return;
    const { data, error } = await supabase.from('ingredients').insert([{ name: ing.name, stock: ing.stock, unit: ing.unit, cost_per_base_unit: ing.costPerBaseUnit, min_stock: ing.minStock, user_id: user.id }]).select().single();
    if (data && !error) setIngredients(prev => [...prev, { ...ing, id: data.id }]);
  };

  const updateIngredient = async (id: string, updates: Partial<Ingredient>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.stock !== undefined) dbUpdates.stock = updates.stock;
    if (updates.costPerBaseUnit !== undefined) dbUpdates.cost_per_base_unit = updates.costPerBaseUnit;
    if (updates.minStock !== undefined) dbUpdates.min_stock = updates.minStock;
    const { error } = await supabase.from('ingredients').update(dbUpdates).eq('id', id);
    if (!error) setIngredients(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const removeIngredient = async (id: string) => {
    const { error } = await supabase.from('ingredients').delete().eq('id', id);
    if (!error) setIngredients(prev => prev.filter(i => i.id !== id));
  };

  const addPackaging = async (pack: Packaging) => {
    if (!user) return;
    const { data, error } = await supabase.from('packaging').insert([{ name: pack.name, capacity: pack.capacity, stock: pack.stock, cost: pack.cost, min_stock: pack.minStock, user_id: user.id }]).select().single();
    if (data && !error) setPackaging(prev => [...prev, { ...pack, id: data.id }]);
  };

  const updatePackaging = async (id: string, updates: Partial<Packaging>) => {
    const dbUpdates: any = {};
    if (updates.stock !== undefined) dbUpdates.stock = updates.stock;
    if (updates.cost !== undefined) dbUpdates.cost = updates.cost;
    const { error } = await supabase.from('packaging').update(dbUpdates).eq('id', id);
    if (!error) setPackaging(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const addProduct = async (prod: Product) => {
    if (!user) return;
    const { data: productData, error: productError } = await supabase.from('products').insert([{ name: prod.name, category: prod.category, packaging_id: prod.packagingId, sale_price: prod.salePrice, stock: prod.stock, user_id: user.id }]).select().single();
    if (productError || !productData) return;
    const formulaPayload = prod.formula.map(f => ({ product_id: productData.id, ingredient_id: f.ingredientId, amount: f.amount }));
    await supabase.from('product_formulas').insert(formulaPayload);
    setProducts(prev => [...prev, { ...prod, id: productData.id }]);
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.salePrice !== undefined) dbUpdates.sale_price = updates.salePrice;
    if (updates.stock !== undefined) dbUpdates.stock = updates.stock;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    const { error } = await supabase.from('products').update(dbUpdates).eq('id', id);
    if (!error) setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const removeProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) setProducts(prev => prev.filter(p => p.id !== id));
  };

  const produceProduct = (productId: string, batchSize: number): { success: boolean; message: string } => {
    const product = products.find((p) => p.id === productId);
    if (!product) return { success: false, message: 'Product not found' };
    const selectedPackaging = packaging.find(p => p.id === product.packagingId);
    if (!selectedPackaging) return { success: false, message: 'Packaging definition missing' };
    for (const item of product.formula) {
      const ing = ingredients.find((i) => i.id === item.ingredientId);
      if (!ing) return { success: false, message: `Ingredient not found` };
      const totalNeeded = item.amount * batchSize; 
      if (ing.stock < totalNeeded) return { success: false, message: `Insufficient stock for ${ing.name}.` };
    }
    const totalVolumeMl = batchSize * 1000;
    const unitsToProduce = Math.floor(totalVolumeMl / selectedPackaging.capacity);
    if (unitsToProduce <= 0) return { success: false, message: 'Batch size too small.' };
    if (selectedPackaging.stock < unitsToProduce) return { success: false, message: `Insufficient packaging units.` };

    setIngredients(prev => prev.map(ing => {
      const formulaItem = product.formula.find(f => f.ingredientId === ing.id);
      if (formulaItem) {
          const newStock = ing.stock - (formulaItem.amount * batchSize);
          supabase.from('ingredients').update({ stock: newStock }).eq('id', ing.id).then();
          return { ...ing, stock: newStock };
      }
      return ing;
    }));
    const newPackStock = selectedPackaging.stock - unitsToProduce;
    supabase.from('packaging').update({ stock: newPackStock }).eq('id', selectedPackaging.id).then();
    setPackaging(prev => prev.map(p => p.id === selectedPackaging.id ? { ...p, stock: newPackStock } : p));
    const newProdStock = product.stock + unitsToProduce;
    supabase.from('products').update({ stock: newProdStock }).eq('id', productId).then();
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newProdStock } : p));
    return { success: true, message: `Produced ${unitsToProduce} units.` };
  };

  const recordSale = (productId: string, volumeL: number, pricePerUnit: number): { success: boolean; message: string } => {
    const product = products.find(p => p.id === productId);
    if (!product) return { success: false, message: 'Product not found' };
    const pack = packaging.find(p => p.id === product.packagingId);
    if (!pack) return { success: false, message: 'Packaging missing' };
    const unitsToDeduct = Math.ceil((volumeL * 1000) / pack.capacity);
    if (product.stock < unitsToDeduct) return { success: false, message: `Insufficient inventory.` };
    const newStock = product.stock - unitsToDeduct;
    supabase.from('products').update({ stock: newStock }).eq('id', productId).then();
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
    return { success: true, message: `Invoice recorded.` };
  };

  /* Implementation of updateSettings */
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const generateInviteToken = async () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 40; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    const { data, error } = await supabase.from('invite_tokens').insert([{ token: result, status: 'active' }]).select().single();
    if (error || !data) return '';
    setTokens(prev => [{ id: data.id, token: data.token, createdAt: data.created_at, status: data.status, usedBy: data.used_by }, ...prev]);
    return result;
  };

  const validateInviteToken = async (tokenString: string, userId: string): Promise<{ success: boolean; message: string }> => {
    const { data: tokenData, error: fetchError } = await supabase.from('invite_tokens').select('*').eq('token', tokenString).eq('status', 'active').single();
    if (fetchError || !tokenData) return { success: false, message: 'Invalid token.' };
    await supabase.from('invite_tokens').update({ status: 'used', used_by: userId }).eq('id', tokenData.id);
    await setAuthorized(true);
    return { success: true, message: 'Access granted.' };
  };

  return (
    <StoreContext.Provider
      value={{
        ingredients, packaging, products, settings, tokens, roles, userAccessList, isAuthorized,
        addIngredient, updateIngredient, removeIngredient,
        addPackaging, updatePackaging,
        addProduct, updateProduct, removeProduct,
        produceProduct, recordSale, updateSettings,
        generateInviteToken, validateInviteToken, removeInviteToken: async (id) => { await supabase.from('invite_tokens').delete().eq('id', id); setTokens(prev => prev.filter(t => t.id !== id)); },
        setAuthorized, addRole, updateRole, removeRole, updateUserAccess
      }}
    >
      {!loading ? children : (
        <div className="min-h-screen bg-white dark:bg-vista-bg flex items-center justify-center">
            <img src={window.matchMedia('(prefers-color-scheme: dark)').matches ? "https://i.ibb.co/jvkPgrRH/Vista-1.png" : "https://i.ibb.co/M5KLbVnh/Vista-2.png"} alt="Vista Loading..." className="h-10 w-auto animate-pulse opacity-70" />
        </div>
      )}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
