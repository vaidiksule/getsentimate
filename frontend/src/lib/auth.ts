import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  avatar: string | null;
  google_sub: string | null;
  is_authenticated: boolean;
}

export const authApi = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
});

// Check if user is authenticated
export async function checkAuth(): Promise<User | null> {
  try {
    const response = await authApi.get('/api/auth/me/');
    
    if (response.status === 200 && response.data.is_authenticated) {
      return response.data;
    }
    return null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Not authenticated
      return null;
    }
    // Other error
    console.error('Auth check failed:', error);
    return null;
  }
}

// Logout user
export async function logout(): Promise<boolean> {
  try {
    await authApi.post('/api/auth/logout/');
    return true;
  } catch (error) {
    console.error('Logout failed:', error);
    return false;
  }
}

// Get Google OAuth login URL
export function getGoogleLoginURL(): string {
  return `${baseURL}/api/auth/login/`;
}

// Redirect to Google OAuth login
export function redirectToGoogleLogin(): void {
  window.location.href = getGoogleLoginURL();
}
