import express from 'express'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// POST /api/users/sync
// Ensures a user_profiles row exists for the authenticated Clerk user.
// Idempotent: insert-or-ignore on conflict, never overwrites an existing user_type.
// Required because new Clerk users have no auto-trigger creating their profile row,
// and downstream FK constraints (requests.donor_id, etc.) need it to exist.
router.post('/sync', async (req, res) => {
  try {
    const clerkUserId = req.auth.userId

    const { error } = await supabase
      .from('user_profiles')
      .upsert(
        { id: clerkUserId, user_type: 'donor' },
        { onConflict: 'id', ignoreDuplicates: true }
      )

    if (error) throw error

    res.json({ success: true })
  } catch (error) {
    console.error('Error syncing user_profiles:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/users/become-cbo
// Requires clerkAuth middleware (applied in server.js mount)
router.post('/become-cbo', async (req, res) => {
  try {
    const clerkUserId = req.auth.userId

    const { error } = await supabase
      .from('user_profiles')
      .update({ user_type: 'cbo' })
      .eq('id', clerkUserId)

    if (error) throw error

    res.json({ success: true })
  } catch (error) {
    console.error('Error updating user type to cbo:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
