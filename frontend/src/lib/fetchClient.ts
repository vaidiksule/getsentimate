import { useAuth } from "@/app/components/AuthProvider";

const useFetchClient = () => {
  const { accessToken, refreshToken, login, logout } = useAuth();

  const fetchClient = async (url: string, options: RequestInit = {}) => {
    const headers = {
      ...options.headers,
      'Content-Type': 'application/json',
      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      // Access token expired, try to refresh
      if (refreshToken) {
        try {
          const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/token/refresh/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh: refreshToken }),
          });

          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            // refresh access token and retry the original request
            login(data.access, refreshToken, null);
            const newHeaders = {
              ...options.headers,
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.access}`,
            };
            return await fetch(url, { ...options, headers: newHeaders });
          } else {
            // Refresh token also expired, log out
            logout();
            throw new Error('Session expired, please log in again.');
          }
        } catch (error) {
          logout();
          throw new Error('Session expired, please log in again.');
        }
      } else {
        // No refresh token, log out
        logout();
        throw new Error('Unauthorized');
      }
    }

    return response;
  };

  return fetchClient;
};

export default useFetchClient;