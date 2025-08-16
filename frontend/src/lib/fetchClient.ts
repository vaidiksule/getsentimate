import { useAuth } from "@/app/components/AuthProvider";

const useFetchClient = () => {
  const { user, logout } = useAuth();

  const fetchClient = async (url: string, options: RequestInit = {}) => {
    // Check if user is authenticated
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const headers = {
      ...options.headers,
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(url, { 
      ...options, 
      headers,
    });

    if (response.status === 401) {
      // User not authenticated, redirect to login
      logout();
      throw new Error('Session expired, please log in again.');
    }

    if (response.status === 402) {
      // Payment required - insufficient credits
      throw new Error('Insufficient credits. Please purchase more credits to continue.');
    }

    return response;
  };

  return fetchClient;
};

export default useFetchClient;