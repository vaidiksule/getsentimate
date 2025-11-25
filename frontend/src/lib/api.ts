import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies for session authentication
});

export interface RawApiResponse {
  status: number;
  data: string;
}

export async function postUrlAnalysis(url: string): Promise<RawApiResponse> {
  const response = await api.post<string>(
    '/api/analysis/url/',
    { url },
    {
      // Disable axios JSON parsing so we can handle malformed JSON ourselves.
      transformResponse: [(data) => data],
      responseType: 'text',
      validateStatus: () => true,
    },
  );

  return {
    status: response.status,
    data: response.data ?? '',
  };
}
