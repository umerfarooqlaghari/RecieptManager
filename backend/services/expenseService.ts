import { getSupabaseClient } from '../lib/supabase';

export interface ExpenseInput {
  userId: string;
  categoryId: string | null;
  amount: number;
  currency: string;
  date: string;
  storeName?: string;
  description?: string;
  receiptImageKey?: string;
  isIncome?: boolean;
  items?: {
    name: string;
    price: number;
    quantity: number;
  }[];
  tax?: number;
  metadata?: any;
}

export interface ExpenseFilters {
  userId: string;
  from?: string;
  to?: string;
  categoryId?: string;
  isIncome?: boolean;
  storeName?: string;
  amount?: number;
  date?: string;
  tax?: number;
}

/**
 * Creates a new expense with optional itemized list
 */
export async function createExpense(accessToken: string, data: ExpenseInput) {
  const supabase = getSupabaseClient(accessToken);
  
  // 1. Ensure Profile Exists (fallback for missed triggers)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', data.userId)
    .single();

  if (profileError || !profile) {
    console.log('Profile missing for user, creating one on the fly...');
    await supabase.from('profiles').upsert({ id: data.userId });
  }

  // 2. Insert Expense Header
  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .insert({
      user_id: data.userId,
      category_id: data.categoryId,
      amount: data.amount,
      currency: data.currency,
      date: data.date,
      store_name: data.storeName,
      description: data.description,
      tax: data.tax || 0,
      updated_at: new Date().toISOString(),
      receipt_image_key: data.receiptImageKey,
      is_income: data.isIncome || false,
      metadata: data.metadata,
    })
    .select()
    .single();

  if (expenseError) throw expenseError;

  // 2. Insert Items if present
  if (data.items && data.items.length > 0) {
    const itemsToInsert = data.items.map(item => ({
      expense_id: expense.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    const { error: itemsError } = await supabase.from('expense_items').insert(itemsToInsert);
    if (itemsError) throw itemsError;
  }

  return expense;
}

/**
 * Fetches all expenses with filters
 */
export async function getAllExpenses(accessToken: string, filters: ExpenseFilters) {
  const supabase = getSupabaseClient(accessToken);
  
  let query = supabase
    .from('expenses')
    .select('*, categories(*), expense_items(*)')
    .eq('user_id', filters.userId)
    .order('date', { ascending: false });

  if (filters.from) query = query.gte('date', filters.from);
  if (filters.to) query = query.lte('date', filters.to);
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
  if (filters.isIncome !== undefined) query = query.eq('is_income', filters.isIncome);
  if (filters.storeName) query = query.ilike('store_name', `%${filters.storeName}%`);
  if (filters.amount !== undefined) query = query.eq('amount', filters.amount);
  if (filters.date) query = query.eq('date', filters.date);
  if (filters.tax !== undefined) query = query.eq('tax', filters.tax);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Fetches a single expense detail
 */
export async function getExpense(accessToken: string, id: string) {
  const supabase = getSupabaseClient(accessToken);
  
  const { data, error } = await supabase
    .from('expenses')
    .select('*, categories(*), expense_items(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Updates an existing expense
 */
export async function updateExpense(accessToken: string, id: string, data: Partial<ExpenseInput>) {
  const supabase = getSupabaseClient(accessToken);
  
  // 1. Update Expense Header
  const { data: expense, error } = await supabase
    .from('expenses')
    .update({
      category_id: data.categoryId,
      amount: data.amount,
      currency: data.currency,
      date: data.date,
      store_name: data.storeName,
      description: data.description,
      is_income: data.isIncome,
      tax: data.tax ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // 2. Sync Items if provided
  if (data.items) {
    // Delete old items (requires DELETE RLS policy on expense_items)
    const { error: deleteError } = await supabase.from('expense_items').delete().eq('expense_id', id);
    if (deleteError) throw deleteError;
    
    // Insert new items
    if (data.items.length > 0) {
      const itemsToInsert = data.items.map(item => ({
        expense_id: id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));
      const { error: itemsError } = await supabase.from('expense_items').insert(itemsToInsert);
      if (itemsError) throw itemsError;
    }
  }

  return expense;
}

/**
 * Deletes an expense (cascade handles items)
 */
export async function deleteExpense(accessToken: string, id: string) {
  const supabase = getSupabaseClient(accessToken);
  
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { success: true };
}
