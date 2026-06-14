// Shared helpers for the secret-area access token. Underscore-prefixed dir, so
// Cloudflare Pages does NOT expose this as a route — it's import-only.
//
// The token is an HMAC-signed, path-bound, expiring string:
//   base64url("<exp>|<path>") + "." + base64url(HMAC_SHA256(key, "<exp>|<path>"))
// It proves the bearer entered the correct code for exactly <path>, until <exp>.

const enc = new TextEncoder()

function b64urlEncode(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(s: string): Uint8Array {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0
  const bin = atob(s + '='.repeat(pad))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

/** Normalize a path so a trailing slash doesn't cause a false mismatch. */
function normalizePath(path: string): string {
  return path.replace(/\/+$/, '') || '/'
}

/** Sign a token granting access to `path` for `ttlSeconds`, using `secret` as the HMAC key. */
export async function signToken(
  path: string,
  ttlSeconds: number,
  secret: string,
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds
  const payload = `${exp}|${normalizePath(path)}`
  const key = await hmacKey(secret)
  const sig = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, enc.encode(payload) as BufferSource),
  )
  return `${b64urlEncode(enc.encode(payload))}.${b64urlEncode(sig)}`
}

/** Verify a token is well-signed, unexpired, and bound to `path`. */
export async function verifyToken(
  token: string,
  path: string,
  secret: string,
): Promise<boolean> {
  const dot = token.indexOf('.')
  if (dot <= 0) return false
  try {
    const payloadBytes = b64urlDecode(token.slice(0, dot))
    const sig = b64urlDecode(token.slice(dot + 1))
    const key = await hmacKey(secret)
    // crypto.subtle.verify is constant-time, avoiding timing leaks.
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sig as BufferSource,
      payloadBytes as BufferSource,
    )
    if (!valid) return false

    const [expStr, boundPath] = new TextDecoder().decode(payloadBytes).split('|')
    const exp = Number(expStr)
    if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false
    // Grant the bound page AND its nested assets (e.g. /secret/aurora plus
    // /secret/aurora/img.png), but nothing belonging to another secret.
    const reqPath = normalizePath(path)
    return reqPath === boundPath || reqPath.startsWith(`${boundPath}/`)
  } catch {
    return false
  }
}

/** Read a single cookie value from a request's Cookie header. */
export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('Cookie')
  if (!header) return null
  for (const part of header.split(';')) {
    const eq = part.indexOf('=')
    if (eq === -1) continue
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim()
  }
  return null
}

export const SECRET_COOKIE = 'secret_access'
