
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const API_URL = `${API_BASE_URL}/api`;

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    // Auth might still be needed if user is logged in
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    } as any;

    // Add session ID if available (fallback for cross-domain)
    if (typeof window !== 'undefined') {
        const sessionId = localStorage.getItem('session_id');
        if (sessionId) {
            headers['X-Session-ID'] = sessionId;
        }

        // Only add token if it exists and we're not using session ID
        const token = localStorage.getItem('access_token');
        if (token && !sessionId) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

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
