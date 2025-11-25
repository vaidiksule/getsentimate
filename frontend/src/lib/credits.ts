import { authApi } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export interface CreditBalance {
  balance: number;
}

export interface CreditTransaction {
  id: number;
  amount: number;
  transaction_type: string;
  reference: string | null;
  created_at: string;
}

export interface CreditHistory {
  transactions: CreditTransaction[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export async function getCreditBalance(): Promise<number> {
  try {
    const response = await authApi.get('/api/credits/');

    if (!response.data) {
      throw new Error(`Failed to fetch credit balance`);
    }

    const data: CreditBalance = response.data;
    return data.balance;
  } catch (error) {
    console.error('Error fetching credit balance:', error);
    throw error;
  }
}

export async function consumeCredits(amount: number = 1): Promise<number> {
  try {
    const response = await authApi.post('/api/credits/consume/', { amount });

    if (response.status === 402) {
      throw new Error(response.data.error || 'Insufficient credits');
    }

    if (!response.data) {
      throw new Error(`Failed to consume credits`);
    }

    const data: CreditBalance = response.data;
    return data.balance;
  } catch (error) {
    console.error('Error consuming credits:', error);
    throw error;
  }
}

export async function getCreditHistory(page: number = 1, pageSize: number = 20): Promise<CreditHistory> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    const response = await authApi.get(`/api/credits/history/?${params}`);

    if (!response.data) {
      throw new Error(`Failed to fetch credit history`);
    }

    const data: CreditHistory = response.data;
    return data;
  } catch (error) {
    console.error('Error fetching credit history:', error);
    throw error;
  }
}

// Admin-only function for development/testing
export async function topupCredits(userId?: number, userEmail?: string, amount?: number): Promise<any> {
  try {
    const body: any = {};
    if (userId) body.user_id = userId;
    if (userEmail) body.user_email = userEmail;
    if (amount) body.amount = amount;

    const response = await authApi.post('/api/credits/topup/', body);

    if (!response.data) {
      throw new Error(`Failed to top up credits`);
    }

    return response.data;
  } catch (error) {
    console.error('Error topping up credits:', error);
    throw error;
  }
}
