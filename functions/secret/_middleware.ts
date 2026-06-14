// Gates every /secret/* request. Without a valid, unexpired, path-bound access
// cookie (set by /api/secret on a correct code), the request gets the site's
// normal 404 — so the secret pages are not just hidden but unreachable, and a
// direct-URL guess looks like the page simply doesn't exist.

import { SECRET_COOKIE, readCookie, verifyToken } from '../_lib/secretToken'

interface Env {
  SECRET_SALT: string
}

export const onRequest = async ({
  request,
  env,
  next,
}: {
  request: Request
  env: Env
  next: () => Promise<Response>
}): Promise<Response> => {
  const url = new URL(request.url)

  const token = readCookie(request, SECRET_COOKIE)
  const allowed =
    !!token && !!env.SECRET_SALT && (await verifyToken(token, url.pathname, env.SECRET_SALT))

  if (allowed) return next()

  // Relay the site's real 404 page so the route looks nonexistent.
  try {
    const notFound = await fetch(new URL('/404', url.origin))
    return new Response(notFound.body, {
      status: 404,
      headers: { 'Content-Type': notFound.headers.get('Content-Type') ?? 'text/html' },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
