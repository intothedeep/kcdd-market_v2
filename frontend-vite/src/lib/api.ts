import { apiConfig } from '@/config'

type GetToken = (options?: { template?: string }) => Promise<string | null>

/**
 * Authenticated fetch wrapper for backend API endpoints.
 * Automatically adds the Clerk JWT as Authorization header.
 */
export const api = {
  async post<T>(path: string, body: unknown, getToken: GetToken): Promise<T> {
    // Backend calls use the default Clerk SESSION token (verified by
    // clerk.verifyToken on the server). Do NOT send the 'supabase' JWT-template
    // token here — that token has no session claims (sid) and the backend's
    // verifyToken expects a session token, which 401s in production (NODE_ENV
    // disables the dev decode fallback). The Supabase client keeps the
    // 'supabase' template (useClerkSupabase.ts) — that one needs role/aud claims.
    const token = await getToken()

    const response = await fetch(`${apiConfig.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(err.error || `Request failed: ${response.status}`)
    }

    return response.json()
  },

  async get<T>(path: string, getToken: GetToken): Promise<T> {
    // Backend calls use the default Clerk SESSION token (verified by
    // clerk.verifyToken on the server). Do NOT send the 'supabase' JWT-template
    // token here — that token has no session claims (sid) and the backend's
    // verifyToken expects a session token, which 401s in production (NODE_ENV
    // disables the dev decode fallback). The Supabase client keeps the
    // 'supabase' template (useClerkSupabase.ts) — that one needs role/aud claims.
    const token = await getToken()

    const response = await fetch(`${apiConfig.baseUrl}${path}`, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(err.error || `Request failed: ${response.status}`)
    }

    return response.json()
  },
}
