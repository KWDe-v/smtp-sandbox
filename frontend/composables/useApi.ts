import { useRuntimeConfig } from '#app';
import { useAuth } from './useAuth';

export function useApi() {
  const config = useRuntimeConfig();
  const auth = useAuth();
  
  let apiBase = config.public.apiBase || '';
  if (typeof window !== 'undefined') {
    if (window.location.port === '' || window.location.port === '80' || window.location.port === '443') {
      apiBase = '';
    } else if (apiBase.includes('localhost') && window.location.hostname !== 'localhost') {
      apiBase = `${window.location.protocol}//${window.location.hostname}:4000`;
    }
  }

  async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    auth.initAuth();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (auth.token.value) {
      headers['Authorization'] = `Bearer ${auth.token.value}`;
    }

    const url = endpoint.startsWith('http') ? endpoint : `${apiBase}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401 && auth.refreshToken.value) {
        // Tenta refresh token
        try {
          const refreshRes = await fetch(`${apiBase}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: auth.refreshToken.value }),
          });

          if (refreshRes.ok) {
            const data = await refreshRes.json();
            if (data.data?.accessToken && auth.user.value) {
              auth.setAuthData(data.data.accessToken, data.data.refreshToken, auth.user.value);
              headers['Authorization'] = `Bearer ${data.data.accessToken}`;
              const retryRes = await fetch(url, { ...options, headers });
              return retryRes.json();
            }
          }
        } catch {
          auth.logout();
          throw new Error('Sessão expirada. Faça login novamente.');
        }
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro na requisição');
      }

      return data;
    } catch (err: any) {
      throw new Error(err.message || 'Erro de conexão com o servidor');
    }
  }

  return {
    get: <T = any>(url: string) => request<T>(url, { method: 'GET' }),
    post: <T = any>(url: string, body?: any) => request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
    patch: <T = any>(url: string, body?: any) => request<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: <T = any>(url: string) => request<T>(url, { method: 'DELETE' }),
    request,
    apiBase,
  };
}
