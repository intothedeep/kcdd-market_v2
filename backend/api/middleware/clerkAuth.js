/**
 * Clerk JWT Authentication Middleware
 *
 * Verifies the Clerk JWT from the Authorization header and attaches
 * req.auth = { userId } for downstream route handlers.
 *
 * For local development without CLERK_SECRET_KEY set, falls back to
 * decoding the JWT payload directly (no signature verification).
 * In production CLERK_SECRET_KEY must be set for secure verification.
 */

function decodeJwtPayload(token) {
  try {
    const [, payload] = token.split('.')
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = Buffer.from(padded, 'base64').toString('utf8')
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export async function clerkAuth(req, res, next) {
  // Fail closed in production if the Clerk secret is missing — otherwise the
  // code below would silently fall through to the unverified dev decoder,
  // allowing forged JWT impersonation.
  if (process.env.NODE_ENV === 'production' && !process.env.CLERK_SECRET_KEY) {
    console.error('clerkAuth: CLERK_SECRET_KEY missing in production — failing closed')
    return res.status(500).json({ error: 'Auth not configured' })
  }

  const authHeader = req.headers['authorization']
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' })
  }

  const token = authHeader.slice(7)

  // If Clerk backend SDK is available, use it for verified token
  if (process.env.CLERK_SECRET_KEY) {
    try {
      // verifyToken is a NAMED export of @clerk/backend, NOT a method on the
      // client from createClerkClient() (that object has no verifyToken — calling
      // it throws "clerk.verifyToken is not a function", which the empty catch
      // used to hide → 401 in prod). Pass secretKey so it can fetch the JWKS.
      const { verifyToken } = await import('@clerk/backend')
      const claims = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      })
      req.auth = { userId: claims.sub }
      return next()
    } catch (err) {
      // Surface the real verification failure — otherwise the empty catch hides
      // WHY (e.g. CLERK_SECRET_KEY from the wrong Clerk instance → JWKS/signature
      // mismatch, expired token, or wrong token type). Logged to the function
      // logs; `detail` is echoed in the response for quick Network-tab debugging.
      const reason = err?.message || String(err)
      console.error('[clerkAuth] verifyToken failed:', reason)
      // Fall through to unverified decode in dev if SDK verification fails
      if (process.env.NODE_ENV === 'production') {
        return res.status(401).json({ error: 'Invalid token', detail: reason })
      }
    }
  }

  // Dev fallback: decode without verification
  const payload = decodeJwtPayload(token)
  if (!payload?.sub) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  req.auth = { userId: payload.sub }
  next()
}
