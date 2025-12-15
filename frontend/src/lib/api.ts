const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface ApiOptions {
  method?: RequestMethod
  body?: unknown
  headers?: Record<string, string>
}

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`API Error: ${status} ${statusText}`)
    this.name = 'ApiError'
  }
}

async function getToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

export async function api<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options

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
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new ApiError(response.status, response.statusText, data)
  }

  return response.json()
}

// Convenience methods
export const apiGet = <T>(endpoint: string) => api<T>(endpoint, { method: 'GET' })

export const apiPost = <T>(endpoint: string, body: unknown) =>
  api<T>(endpoint, { method: 'POST', body })

export const apiPut = <T>(endpoint: string, body: unknown) =>
  api<T>(endpoint, { method: 'PUT', body })

export const apiPatch = <T>(endpoint: string, body: unknown) =>
  api<T>(endpoint, { method: 'PATCH', body })

export const apiDelete = <T>(endpoint: string) =>
  api<T>(endpoint, { method: 'DELETE' })
