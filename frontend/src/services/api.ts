
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    // Auth might still be needed if user is logged in
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
    } as HeadersInit;

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.statusText}`);
    }

    return response.json();
}

export const api = {
    analyze: (youtubeUrl: string, commentLimit: number = 150) =>
        fetchWithAuth('/analyze', {
            method: 'POST',
            body: JSON.stringify({
                youtube_url: youtubeUrl,
                comment_limit: commentLimit
            }),
        }),
};
