import { env } from '../config/env'

export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${env.apiUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      message = body?.error?.message ?? JSON.stringify(body.detail ?? body)
    } catch {
      /* body yo'q */
    }
    throw new Error(message)
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
}
