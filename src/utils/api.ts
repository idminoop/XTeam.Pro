// API configuration for frontend-backend communication
import { useAdminStore } from '@/store/adminStore';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  '';

// Internal raw fetch — skips 401-retry to avoid infinite loops
async function _rawFetch(endpoint: string, options: RequestInit): Promise<Response> {
  const url = API_BASE_URL ? `${API_BASE_URL}${endpoint}` : endpoint;
  const defaultHeaders: Record<string, string> = {};

  // Only set Content-Type automatically for non-FormData bodies
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  return fetch(url, {
    ...options,
    headers: { ...defaultHeaders, ...options.headers },
  });
}

// Try to refresh the access token using the stored refresh_token.
// Returns the new access token on success, null on failure.
async function _tryRefresh(): Promise<string | null> {
  const { refreshToken, setAuthToken, logout } = useAdminStore.getState();
  if (!refreshToken) return null;

  try {
    const res = await _rawFetch('/api/admin/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      logout();
      return null;
    }
    const data = await res.json();
    const newToken: string = data.access_token;
    setAuthToken(newToken);
    return newToken;
  } catch {
    logout();
    return null;
  }
}

/**
 * Primary API fetch wrapper.
 * - Merges default headers (Content-Type: application/json unless FormData)
 * - On 401: attempts token refresh once, then retries the original request
 * - On refresh failure: calls logout() and throws
 * - On other non-OK responses: throws with status info
 */
export const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  let response = await _rawFetch(endpoint, options);

  if (response.status === 401) {
    const newToken = await _tryRefresh();
    if (!newToken) {
      throw new Error('Session expired. Please log in again.');
    }
    // Retry with updated Authorization header
    const retryHeaders = {
      ...(options.headers as Record<string, string> || {}),
      Authorization: `Bearer ${newToken}`,
    };
    response = await _rawFetch(endpoint, { ...options, headers: retryHeaders });
  }

  if (!response.ok) {
    // Try to parse error detail from FastAPI response
    let detail = `${response.status} ${response.statusText}`;
    try {
      const body = await response.clone().json();
      if (body?.detail) detail = body.detail;
    } catch { /* ignore parse error */ }
    throw new Error(detail);
  }

  return response;
};

export { API_BASE_URL };
