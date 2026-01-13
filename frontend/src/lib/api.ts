const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface ApiOptions {
  method?: RequestMethod
  body?: unknown
  headers?: Record<string, string>
  /** Cache policy for the fetch request. Defaults to 'no-store' for fresh data. */
  cachePolicy?: RequestCache
}

class ApiError extends Error {
  /** Retry-After header value in seconds (for 429 responses) */
  public retryAfter?: number

  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown,
    retryAfter?: number
  ) {
    super(`API Error: ${status} ${statusText}`)
    this.name = 'ApiError'
    this.retryAfter = retryAfter
  }
}

export { ApiError }

async function getToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

export async function api<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {}, cachePolicy = 'no-store' } = options

  const token = await getToken()
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}/api/v1${endpoint}`, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
    cache: cachePolicy,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)

    // Parse Retry-After header for 429 responses
    let retryAfter: number | undefined
    if (response.status === 429) {
      const retryAfterHeader = response.headers.get('Retry-After')
      if (retryAfterHeader) {
        // Retry-After can be seconds (integer) or HTTP-date
        const parsed = parseInt(retryAfterHeader, 10)
        if (!isNaN(parsed)) {
          retryAfter = parsed
        } else {
          // Try parsing as HTTP-date
          const date = new Date(retryAfterHeader)
          if (!isNaN(date.getTime())) {
            retryAfter = Math.max(0, Math.ceil((date.getTime() - Date.now()) / 1000))
          }
        }
      }
    }

    throw new ApiError(response.status, response.statusText, data, retryAfter)
  }

  return response.json()
}

// Convenience methods
export const apiGet = <T>(endpoint: string) => api<T>(endpoint, { method: 'GET' })

/**
 * GET request with browser default caching enabled.
 * Use for data that doesn't change frequently (e.g., coaching tips, static content).
 */
export const apiGetCached = <T>(endpoint: string) =>
  api<T>(endpoint, { method: 'GET', cachePolicy: 'default' })

export const apiPost = <T>(endpoint: string, body: unknown) =>
  api<T>(endpoint, { method: 'POST', body })

export const apiPut = <T>(endpoint: string, body: unknown) =>
  api<T>(endpoint, { method: 'PUT', body })

export const apiPatch = <T>(endpoint: string, body: unknown) =>
  api<T>(endpoint, { method: 'PATCH', body })

export const apiDelete = <T>(endpoint: string) =>
  api<T>(endpoint, { method: 'DELETE' })
