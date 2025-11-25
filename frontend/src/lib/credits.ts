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
    const response = await fetch(`${API_BASE_URL}/api/credits/`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch credit balance: ${response.status}`);
    }

    const data: CreditBalance = await response.json();
    return data.balance;
  } catch (error) {
    console.error('Error fetching credit balance:', error);
    throw error;
  }
}

export async function consumeCredits(amount: number = 1): Promise<number> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/credits/consume/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ amount }),
    });

    if (response.status === 402) {
      const error = await response.json();
      throw new Error(error.error || 'Insufficient credits');
    }

    if (!response.ok) {
      throw new Error(`Failed to consume credits: ${response.status}`);
    }

    const data: CreditBalance = await response.json();
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

    const response = await fetch(`${API_BASE_URL}/api/credits/history/?${params}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch credit history: ${response.status}`);
    }

    const data: CreditHistory = await response.json();
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

    const response = await fetch(`${API_BASE_URL}/api/credits/topup/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Failed to top up credits: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error topping up credits:', error);
    throw error;
  }
}
