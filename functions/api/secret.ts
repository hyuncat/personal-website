// Cloudflare Pages Function — validates a secret code server-side.
// The salt, hashes, and destination URLs live ONLY in these env vars and are
// never sent to the browser:
//   SECRET_SALT    — a random string
//   SECRET_ROUTES  — JSON map of sha256("<SECRET_SALT>|<code>") -> destination path,
//                    where <code> is trimmed + lowercased.
//   e.g. {"ab12…":"/secret/aurora","cd34…":"/secret/eva"}

import { SECRET_COOKIE, signToken } from '../_lib/secretToken'

interface Env {
  SECRET_SALT: string
  SECRET_ROUTES: string
}

// How long an access cookie stays valid after a correct code (seconds).
const ACCESS_TTL = 30 * 60

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  const json = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json', ...extraHeaders },
    })

  try {
    const { code } = (await request.json()) as { code?: unknown }
    if (!code || typeof code !== 'string') {
      return json({ error: 'Enter a code.' }, 400)
    }

    if (!env.SECRET_SALT || !env.SECRET_ROUTES) {
      console.error('Secrets not configured: missing SECRET_SALT or SECRET_ROUTES')
      return json({ error: 'Secrets are not configured.' }, 500)
    }

    let routes: Record<string, string>
    try {
      routes = JSON.parse(env.SECRET_ROUTES)
    } catch {
      console.error('SECRET_ROUTES is not valid JSON')
      return json({ error: 'Secrets are misconfigured.' }, 500)
    }

    // Case-insensitive + trimmed, matching the "Codes are case-insensitive" hint.
    const normalized = code.trim().toLowerCase()
    const hash = await sha256Hex(`${env.SECRET_SALT}|${normalized}`)
    const dest = routes[hash]

    if (!dest || typeof dest !== 'string' || !dest.startsWith('/')) {
      return json({ error: 'Wrong!' }, 401)
    }

    // Grant a short, path-bound access cookie so the /secret/* middleware lets
    // this visitor reach exactly this page. Scoped to /secret/ so it's only ever
    // sent to the gated routes.
    const token = await signToken(dest, ACCESS_TTL, env.SECRET_SALT)
    const cookie = `${SECRET_COOKIE}=${token}; Path=/secret/; Max-Age=${ACCESS_TTL}; HttpOnly; Secure; SameSite=Lax`

    return json({ dest }, 200, { 'Set-Cookie': cookie })
  } catch (e) {
    console.error('Secret check error:', e)
    return json({ error: 'Something went wrong.' }, 500)
  }
}
