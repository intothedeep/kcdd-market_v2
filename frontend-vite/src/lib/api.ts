import { apiConfig } from '@/config'

type GetToken = (options?: { template?: string }) => Promise<string | null>

/**
 * Error thrown by the api helper on a non-2xx response. Carries the optional
 * machine-readable `code` from the backend body (e.g. 'WINDOW_TOO_LARGE') so
 * callers can branch on it instead of string-matching the message.
 */
export class ApiError extends Error {
  code?: string
  status: number
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

async function toError(response: Response): Promise<ApiError> {
  const body = await response.json().catch(() => ({ error: response.statusText }))
  const message = body.error || body.message || `Request failed: ${response.status}`
  return new ApiError(message, response.status, body.code)
}

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
      throw await toError(response)
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
      throw await toError(response)
    }

    return response.json()
  },

  async patch<T>(path: string, body: unknown, getToken: GetToken): Promise<T> {
    const token = await getToken()

    const response = await fetch(`${apiConfig.baseUrl}${path}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw await toError(response)
    }

    return response.json()
  },
}
