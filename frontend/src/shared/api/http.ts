import { env } from '@/config/env'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json()
    return body?.error?.message ?? JSON.stringify(body.detail ?? body)
  } catch {
    return res.statusText
  }
}

export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  // FormData bo'lsa, brauzer Content-Type'ni (boundary bilan) o'zi qo'yadi.
  const json = !(init?.body instanceof FormData)
  let res: Response
  try {
    res = await fetch(`${env.apiUrl}${path}`, {
      ...init,
      headers: { ...(json && { 'Content-Type': 'application/json' }), ...init?.headers },
    })
  } catch {
    throw new ApiError("Serverga ulanib bo'lmadi", 0)
  }
  if (!res.ok) throw new ApiError(await readErrorMessage(res), res.status)
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
}
