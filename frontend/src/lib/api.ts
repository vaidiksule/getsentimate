import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
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
