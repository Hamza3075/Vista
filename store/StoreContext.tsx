
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Ingredient, Packaging, Product, StoreContextType, InviteToken, AppSettings, Role, UserAccess, Permissions, ApiResponse, LogEntry, FormulaDraft, NavigationState } from '../types';
import { supabase, checkApiHealth } from '../lib/supabaseClient';
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
  const [settings, setSettings] = useState<AppSettings>({ defaultProductionMode: 'glasses' });
  const [tokens, setTokens] = useState<InviteToken[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userAccessList, setUserAccessList] = useState<UserAccess[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDbConnected, setIsDbConnected] = useState(true);

  // Temporary State
  const [formulaDraft, setFormulaDraft] = useState<FormulaDraft | null>(null);
  const [navigation, setNavigation] = useState<NavigationState>({
    inventoryTab: 'ingredients',
    insightsTab: 'performance',
    activeMainView: 'dashboard'
  });

  const updateNavigation = (updates: Partial<NavigationState>) => {
    setNavigation(prev => ({ ...prev, ...updates }));
  };

  const isAuthorized = !!(
    user?.user_metadata?.is_authorized || 
    userAccessList.some(a => a.userId === user?.id)
  );

  const addLog = useCallback((level: LogEntry['level'], source: string, message: string, details?: any) => {
    const newLog: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      details
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
    if (level === 'error') console.error(`[${source}] ${message}`, details);
  }, []);

  const apiResponse = (success: boolean, message: string, code: number = 200, data: any = null): ApiResponse => {
    const response: ApiResponse = { success, message, errorCode: code, data };
    if (!success) response.error = message;
    return response;
  };

  const verifyConnectivity = async (): Promise<boolean> => {
    const isHealthy = await checkApiHealth();
    setIsDbConnected(isHealthy);
    if (!isHealthy) {
      addLog('error', 'Network', 'Database core unreachable. Action aborted.');
    }
    return isHealthy;
  };

  const checkAuth = (): ApiResponse | null => {
    if (!user) {
      addLog('warn', 'Auth', 'Unauthorized operation attempt');
      return apiResponse(false, "Unauthorized access", 401);
    }
    return null;
  };

  const refreshAuthStatus = useCallback(async () => {
    if (!user) return;
    try {
      const { data: accessData, error: accessError } = await supabase
        .from('user_access')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (accessError) {
        if (accessError.code === 'PGRST116') {
            addLog('info', 'Auth', 'User profile not yet provisioned in registry.');
            return;
        }
        throw accessError;
      }

      if (accessData) {
        setUserAccessList(prev => {
          const exists = prev.find(a => a.userId === user.id);
          const updatedUser = { id: user.id, userId: user.id, email: user.email!, roleId: accessData.role_id };
          return exists ? prev.map(a => a.userId === user.id ? updatedUser : a) : [...prev, updatedUser];
        });
        addLog('info', 'Auth', 'Database credentials verified and synchronized.');
      }
    } catch (err) {
      addLog('error', 'Auth', 'Failed to sync user credentials from database', err);
    }
  }, [user, addLog]);

  useEffect(() => {
    if (user && isAuthorized && userAccessList.length === 0 && !loading) {
       updateUserAccess(user.id, { email: user.email!, roleId: 'owner' });
    }
  }, [user, isAuthorized, userAccessList, loading]);

  useEffect(() => {
    if (!user) {
      setIngredients([]);
      setPackaging([]);
      setProducts([]);
      setRoles([]);
      setTokens([]);
      setUserAccessList([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      addLog('info', 'Store', 'Verifying API connectivity...');
      
      const isHealthy = await checkApiHealth();
      setIsDbConnected(isHealthy);
      if (!isHealthy) {
        addLog('error', 'Store', 'Database endpoint unreachable. Check connection settings.');
      }

      try {
        const [ingRes, packRes, prodRes, roleRes, accessRes, tokenRes] = await Promise.all([
          supabase.from('ingredients').select('*').eq('user_id', user.id),
          supabase.from('packaging').select('*').eq('user_id', user.id),
          supabase.from('products').select('*, product_formulas(*)').eq('user_id', user.id),
          supabase.from('roles').select('*'),
          supabase.from('user_access').select('*'),
          supabase.from('invite_tokens').select('*').order('created_at', { ascending: false })
        ]);

        if (ingRes.data) setIngredients(ingRes.data.map(i => ({ 
          id: i.id, name: i.name, stock: Number(i.stock), unit: i.unit, 
          costPerBaseUnit: Number(i.cost_per_base_unit), minStock: i.min_stock 
        })));

        if (packRes.data) setPackaging(packRes.data.map(p => ({ 
          id: p.id, name: p.name, capacity: Number(p.capacity), stock: Number(p.stock), 
          cost: Number(p.cost), minStock: p.min_stock 
        })));

        if (prodRes.data) setProducts(prodRes.data.map(p => ({ 
          id: p.id, name: p.name, category: p.category, packagingId: p.packaging_id, 
          salePrice: Number(p.sale_price), stock: Number(p.stock), 
          formula: (p.product_formulas || []).map((f: any) => ({ 
            ingredientId: f.ingredient_id, 
            percentage: Number(f.amount) 
          })) 
        })));

        if (roleRes.data && roleRes.data.length > 0) {
          setRoles(roleRes.data.map(r => ({ id: r.id, name: r.name, permissions: r.permissions })));
        } else {
          setRoles([
            { id: 'owner', name: 'Owner', permissions: { products: { read: true, create: true, update: true, delete: true }, ingredients: { read: true, create: true, update: true, delete: true }, packaging: { read: true, create: true, update: true, delete: true }, sales: { read: true, create: true, update: true, delete: true }, access: { read: true, create: true, update: true, delete: true } } },
            { id: 'sales-eng', name: 'Sales Engineer', permissions: { ...DEFAULT_PERMISSIONS, sales: { read: true, create: true, update: false, delete: false } } },
            { id: 'guest', name: 'Guest', permissions: DEFAULT_PERMISSIONS }
          ]);
        }

        if (accessRes.data) setUserAccessList(accessRes.data.map(a => ({ 
          id: a.user_id, userId: a.user_id, email: a.email, roleId: a.role_id, customPermissions: a.custom_permissions 
        })));

        addLog('info', 'Store', 'Core data sync complete.');
      } catch (err: any) {
        addLog('error', 'Store', 'Critical sync error', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, addLog]);

  const updateUserAccess = async (userId: string, updates: Partial<UserAccess>): Promise<ApiResponse> => {
    const authCheck = checkAuth();
    if (authCheck) return authCheck;

    const { error } = await supabase.from('user_access').upsert({ 
      user_id: userId, role_id: updates.roleId, email: updates.email, custom_permissions: updates.customPermissions 
    });
    
    if (error) {
      addLog('error', 'Access', 'User credential update failed', error);
      return apiResponse(false, error.message, 500);
    }

    setUserAccessList(prev => {
      const exists = prev.find(a => a.userId === userId);
      const entry = { id: userId, userId, email: updates.email!, roleId: updates.roleId!, ...updates };
      return exists ? prev.map(a => a.userId === userId ? entry : a) : [...prev, entry];
    });
    return apiResponse(true, "Credentials synchronized.");
  };

  const setAuthorized = async (val: boolean) => {
    if (!user) return;
    const { error } = await supabase.auth.updateUser({ data: { is_authorized: val } });
    if (!error && val) {
      await updateUserAccess(user.id, { email: user.email!, roleId: userAccessList.length === 0 ? 'owner' : 'guest' });
    }
    await refreshAuthStatus();
  };

  const addIngredient = async (ing: Ingredient): Promise<ApiResponse> => {
    const authCheck = checkAuth();
    if (authCheck) return authCheck;
    if (!(await verifyConnectivity())) return apiResponse(false, "Network Failure", 503);
    const { data, error } = await supabase.from('ingredients').insert([{ 
      name: ing.name, stock: Number(ing.stock), unit: ing.unit, cost_per_base_unit: Number(ing.costPerBaseUnit), 
      min_stock: Number(ing.minStock), user_id: user?.id 
    }]).select().single();
    if (error) return apiResponse(false, error.message, 500);
    setIngredients(prev => [...prev, { ...ing, id: data.id }]);
    return apiResponse(true, "Ingredient added");
  };

  const updateIngredient = async (id: string, updates: Partial<Ingredient>): Promise<ApiResponse> => {
    const { error } = await supabase.from('ingredients').update(updates).eq('id', id);
    if (error) return apiResponse(false, error.message, 500);
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    return apiResponse(true, "Updated");
  };

  const removeIngredient = async (id: string): Promise<ApiResponse> => {
    const { error } = await supabase.from('ingredients').delete().eq('id', id);
    if (error) return apiResponse(false, error.message, 500);
    setIngredients(prev => prev.filter(i => i.id !== id));
    return apiResponse(true, "Removed");
  };

  const addPackaging = async (pack: Packaging): Promise<ApiResponse> => {
    const authCheck = checkAuth();
    if (authCheck) return authCheck;
    if (!(await verifyConnectivity())) return apiResponse(false, "Network Failure", 503);
    const { data, error } = await supabase.from('packaging').insert([{ 
      name: pack.name, capacity: Number(pack.capacity), stock: Number(pack.stock), cost: Number(pack.cost), 
      min_stock: Number(pack.minStock), user_id: user?.id 
    }]).select().single();
    if (error) return apiResponse(false, error.message, 500);
    setPackaging(prev => [...prev, { ...pack, id: data.id }]);
    return apiResponse(true, "Packaging added");
  };

  const updatePackaging = async (id: string, updates: Partial<Packaging>): Promise<ApiResponse> => {
    const { error } = await supabase.from('packaging').update(updates).eq('id', id);
    if (error) return apiResponse(false, error.message, 500);
    setPackaging(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    return apiResponse(true, "Updated");
  };

  const addProduct = async (prod: Product): Promise<ApiResponse> => {
    const authCheck = checkAuth();
    if (authCheck) return authCheck;
    if (!(await verifyConnectivity())) return apiResponse(false, "Network Failure", 503);
    const { data: pData, error: pError } = await supabase.from('products').insert([{ 
      name: prod.name, category: prod.category, packaging_id: prod.packagingId, sale_price: Number(prod.salePrice), 
      stock: Number(prod.stock), user_id: user?.id 
    }]).select().single();
    if (pError) return apiResponse(false, `Registry Error: ${pError.message}`, 500);
    const fItems = prod.formula.map(f => ({ 
      product_id: pData.id, 
      ingredient_id: f.ingredientId, 
      amount: Number(f.percentage) 
    }));
    const { error: fError } = await supabase.from('product_formulas').insert(fItems);
    if (fError) {
      await supabase.from('products').delete().eq('id', pData.id);
      return apiResponse(false, `Registry Error: ${fError.message}`, 500);
    }
    setProducts(prev => [...prev, { ...prod, id: pData.id }]);
    return apiResponse(true, "Product created");
  };

  const updateProduct = async (id: string, updates: Partial<Product>): Promise<ApiResponse> => {
    const { error } = await supabase.from('products').update(updates).eq('id', id);
    if (error) return apiResponse(false, error.message, 500);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    return apiResponse(true, "Updated");
  };

  const removeProduct = async (id: string): Promise<ApiResponse> => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return apiResponse(false, error.message, 500);
    setProducts(prev => prev.filter(p => p.id !== id));
    return apiResponse(true, "Removed");
  };

  const produceProduct = async (productId: string, batchSize: number, packagingId?: string): Promise<ApiResponse> => {
    const authCheck = checkAuth();
    if (authCheck) return authCheck;
    if (!(await verifyConnectivity())) return apiResponse(false, "Connection Failure", 503);
    const product = products.find(p => p.id === productId);
    if (!product) return apiResponse(false, "Product not found");
    const pack = packaging.find(p => p.id === (packagingId || product.packagingId));
    if (!pack) return apiResponse(false, "Packaging not found");
    const units = Math.floor((batchSize * 1000) / Number(pack.capacity));
    if (units <= 0) return apiResponse(false, "Volume too low for 1 unit");
    try {
      const updates = [];
      product.formula.forEach(f => {
        const ing = ingredients.find(i => i.id === f.ingredientId);
        if (ing) {
          const deduction = (f.percentage / 100) * batchSize * 1000;
          updates.push(supabase.from('ingredients').update({ stock: Number(ing.stock) - deduction }).eq('id', ing.id));
        }
      });
      updates.push(supabase.from('packaging').update({ stock: Number(pack.stock) - units }).eq('id', pack.id));
      updates.push(supabase.from('products').update({ stock: Number(product.stock) + units }).eq('id', productId));
      await Promise.all(updates);
      return apiResponse(true, `Successfully produced ${units} units.`);
    } catch (err: any) {
      return apiResponse(false, err.message, 500);
    }
  };

  const recordSale = async (productId: string, volumeL: number, pricePerUnit: number): Promise<ApiResponse> => {
    const product = products.find(p => p.id === productId);
    if (!product) return apiResponse(false, "Product not found");
    const pack = packaging.find(p => p.id === product.packagingId);
    if (!pack) return apiResponse(false, "Packaging not found");
    const units = Math.ceil((volumeL * 1000) / Number(pack.capacity));
    if (product.stock < units) return apiResponse(false, "Insufficient stock");
    const { error } = await supabase.from('products').update({ stock: Number(product.stock) - units }).eq('id', productId);
    if (error) return apiResponse(false, error.message, 500);
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: Number(p.stock) - units } : p));
    return apiResponse(true, "Sale recorded");
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => setSettings(prev => ({ ...prev, ...newSettings }));

  const generateInviteToken = async () => {
    if (!user) return '';
    const token = Array.from(crypto.getRandomValues(new Uint8Array(20))).map(b => b.toString(16).padStart(2, '0')).join('');
    const { data, error } = await supabase.from('invite_tokens').insert([{ token, status: 'active', user_id: user.id }]).select().single();
    if (error) return '';
    setTokens(prev => [{ id: data.id, token: data.token, createdAt: data.created_at, status: data.status }, ...prev]);
    return token;
  };

  const validateInviteToken = async (token: string, userId: string): Promise<ApiResponse> => {
    const { data, error } = await supabase.from('invite_tokens').select('*').eq('token', token).eq('status', 'active').single();
    if (error || !data) return apiResponse(false, "Invalid token");
    await supabase.from('invite_tokens').update({ status: 'used', used_by: userId }).eq('id', data.id);
    await setAuthorized(true);
    return apiResponse(true, "Authorized");
  };

  const removeInviteToken = async (id: string) => {
    await supabase.from('invite_tokens').delete().eq('id', id);
    setTokens(prev => prev.filter(t => t.id !== id));
    return apiResponse(true, "Token removed");
  };

  const addRole = async (role: Role) => {
    const { data, error } = await supabase.from('roles').insert([{ name: role.name, permissions: role.permissions }]).select().single();
    if (error) return apiResponse(false, error.message, 500);
    setRoles(prev => [...prev, { ...role, id: data.id }]);
    return apiResponse(true, "Role created");
  };

  const updateRole = async (id: string, updates: Partial<Role>) => {
    const { error } = await supabase.from('roles').update(updates).eq('id', id);
    if (error) return apiResponse(false, error.message, 500);
    setRoles(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    return apiResponse(true, "Role updated");
  };

  const removeRole = async (id: string) => {
    const { error } = await supabase.from('roles').delete().eq('id', id);
    if (error) return apiResponse(false, error.message, 500);
    setRoles(prev => prev.filter(r => r.id !== id));
    return apiResponse(true, "Role removed");
  };

  return (
    <StoreContext.Provider value={{
      ingredients, packaging, products, settings, tokens, roles, userAccessList, isAuthorized, logs,
      formulaDraft, setFormulaDraft, navigation, updateNavigation,
      addLog, addIngredient, updateIngredient, removeIngredient, addPackaging, updatePackaging,
      addProduct, updateProduct, removeProduct, produceProduct, recordSale, updateSettings,
      generateInviteToken, validateInviteToken, removeInviteToken, setAuthorized,
      addRole, updateRole, removeRole, updateUserAccess
    }}>
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
