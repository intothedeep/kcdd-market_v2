/**
 * Maps a Postgres/PostgREST error raised by the `set_user_type` RPC into a
 * human-readable message. The RPC raises distinct ERRCODEs / sentinel messages
 * for each guard (see migration 20260625000000_set_user_type_rpc.sql):
 *   42501              -> caller is not an admin
 *   22023              -> invalid user_type value
 *   P0001 LAST_ADMIN   -> would demote the last remaining admin
 *   P0001 SELF_DEMOTE  -> admin tried to demote themselves
 *   P0002              -> target user not found
 * Pure function — deterministic, no side effects.
 */
export function setUserTypeErrorMessage(error: {
  code?: string | null
  message?: string | null
}): string {
  const code = error?.code ?? ''
  const message = error?.message ?? ''

  if (code === '42501') return "You don't have permission to change user roles."
  if (code === '22023') return 'Invalid user type.'
  if (message.includes('LAST_ADMIN')) return 'Cannot remove the last admin.'
  if (message.includes('SELF_DEMOTE')) return "You can't remove your own admin access."
  if (code === 'P0002') return 'User not found.'
  return 'Failed to update user role. Please try again.'
}
