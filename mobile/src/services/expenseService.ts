import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { toAmount } from '../utils/money';

const BACKEND_URL = (process.env.EXPO_PUBLIC_BACKEND_URL || '').replace(/\/$/, '');

export interface ExpenseItem {
  id?: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Expense {
  id: string;
  amount: number;
  currency: string;
  date: string;
  store_name: string;
  category_id: string;
  tax?: number;
  is_income?: boolean;
  receipt_image_key?: string;
  categories?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  expense_items?: ExpenseItem[];
}

export interface CreateExpenseData {
  userId: string;
  storeName?: string;
  amount: number;
  currency?: string;
  date: string;
  categoryId?: string | null;
  tax?: number;
  isIncome?: boolean;
  items?: ExpenseItem[];
}

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

function normalizeExpense(raw: any): Expense {
  return {
    ...raw,
    amount: toAmount(raw?.amount),
    tax: toAmount(raw?.tax),
    expense_items: Array.isArray(raw?.expense_items)
      ? raw.expense_items.map((item: any) => ({
          ...item,
          price: toAmount(item?.price),
          quantity: toAmount(item?.quantity, 1),
        }))
      : [],
  };
}

async function readError(response: Response, fallback: string): Promise<string> {
  const err = await response.json().catch(() => ({} as any));
  return err.error || err.message || fallback;
}

export const fetchExpenses = async (token: string, filters: Record<string, any> = {}): Promise<Expense[]> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') params.append(key, String(val));
  });

  const response = await fetch(`${BACKEND_URL}/api/expenses?${params.toString()}`, {
    headers: authHeader(token),
  });
  if (!response.ok) {
    throw new Error(await readError(response, 'Failed to load expenses'));
  }
  const data = await response.json();
  if (!Array.isArray(data)) return [];
  return data.map(normalizeExpense);
};

export const createExpense = async (token: string, data: CreateExpenseData): Promise<Expense> => {
  const payload = {
    ...data,
    currency: data.currency || 'USD',
  };
  const response = await fetch(`${BACKEND_URL}/api/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await readError(response, 'Failed to create expense'));
  }
  return normalizeExpense(await response.json());
};

export const updateExpense = async (token: string, id: string, data: Partial<CreateExpenseData>): Promise<Expense> => {
  const response = await fetch(`${BACKEND_URL}/api/expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(await readError(response, 'Failed to update expense'));
  }
  return normalizeExpense(await response.json());
};

export const deleteExpense = async (token: string, id: string): Promise<{ success: boolean }> => {
  const response = await fetch(`${BACKEND_URL}/api/expenses/${id}`, {
    method: 'DELETE',
    headers: authHeader(token),
  });
  if (!response.ok) throw new Error(await readError(response, 'Failed to delete expense'));
  return response.json();
};

export const getReceiptUrl = async (token: string, id: string): Promise<string | null> => {
  const response = await fetch(`${BACKEND_URL}/api/expenses/${id}/receipt-url`, {
    headers: authHeader(token),
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.url ?? null;
};

export const submitSupport = async (token: string, data: { subject: string; message: string }) => {
  const response = await fetch(`${BACKEND_URL}/api/support`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(await readError(response, 'Failed to send support message'));
  return response.json();
};

export const uploadProfilePicture = async (
  token: string,
  imageBase64: string,
  mimeType: string = 'image/jpeg'
) => {
  const response = await fetch(`${BACKEND_URL}/api/profile/picture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: JSON.stringify({ imageBase64, mimeType }),
  });
  if (!response.ok) throw new Error(await readError(response, 'Failed to upload profile picture'));
  return response.json();
};

export const exportExpensesExcel = async (token: string, filters: Record<string, any>) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') params.append(key, String(val));
  });

  const fileUri = `${FileSystem.documentDirectory}expenses.xlsx`;

  const downloadRes = await FileSystem.downloadAsync(
    `${BACKEND_URL}/api/reports/export/excel?${params.toString()}`,
    fileUri,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (downloadRes.status === 402) {
    throw new Error('Premium subscription required to export reports');
  }
  if (downloadRes.status !== 200) throw new Error('Failed to export Excel');

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) throw new Error('Sharing is not available on this device');

  await Sharing.shareAsync(fileUri);
};
