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
  credits: number;
}

export const authApi = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
});

// Add session ID to requests for cross-domain scenarios
authApi.interceptors.request.use((config) => {
  const sessionId = localStorage.getItem('session_id');
  if (sessionId) {
    config.headers['X-Session-ID'] = sessionId;
  }
  return config;
});

// Check if user is authenticated
export async function checkAuth(retryCount = 0): Promise<User | null> {
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

    // If it's a network error and we haven't retried yet, retry once
    if (axios.isAxiosError(error) && error.code === 'NETWORK_ERROR' && retryCount < 1) {
      console.log('Retrying auth check due to network error...');
      await new Promise(resolve => setTimeout(resolve, 200)); // Wait 200ms
      return checkAuth(retryCount + 1);
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
    // Clear session ID from localStorage
    localStorage.removeItem('session_id');
    // Set flag to prevent immediate redirect to analysis
    sessionStorage.setItem('just_logged_out', 'true');
    // Clear any cached auth data by forcing a brief delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  } catch (error) {
    console.error('Logout failed:', error);
    return false;
  }
}

// Get Google OAuth login URL
export function getGoogleLoginURL(): string {
  return `${baseURL}/api/auth/google/login/`;
}

// Redirect to Google OAuth login
export function redirectToGoogleLogin(): void {
  window.location.href = getGoogleLoginURL();
}

// Temporary: Login with email/password for Razorpay verification
export async function tempLogin(email: string, password: string): Promise<boolean> {
  try {
    const response = await authApi.post('/api/auth/temp-login/', { email, password });

    if (response.status === 200 && response.data.access_token) {
      // Save tokens for API calls
      localStorage.setItem('access_token', response.data.access_token);
      if (response.data.refresh_token) {
        localStorage.setItem('refresh_token', response.data.refresh_token);
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('Temp login failed:', error);
    return false;
  }
}
