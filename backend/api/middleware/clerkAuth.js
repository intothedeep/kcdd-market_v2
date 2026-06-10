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
  const authHeader = req.headers['authorization']
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' })
  }

  const token = authHeader.slice(7)

  // If Clerk backend SDK is available, use it for verified token
  if (process.env.CLERK_SECRET_KEY) {
    try {
      const { createClerkClient } = await import('@clerk/backend')
      const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
      const claims = await clerk.verifyToken(token)
      req.auth = { userId: claims.sub }
      return next()
    } catch {
      // Fall through to unverified decode in dev if SDK verification fails
      if (process.env.NODE_ENV === 'production') {
        return res.status(401).json({ error: 'Invalid token' })
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
