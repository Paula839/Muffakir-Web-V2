const API_URL = 'http://localhost:3000';

export const fetcher = async (url: string, options?: RequestInit) => {
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  return response.json();
};

export const wsClient = (path: string) => 
  new WebSocket(`${API_URL.replace('http', 'ws')}${path}`);