/**
 * RouteFallback
 *
 * Suspense fallback for lazy-loaded route pages. Rendered inside the layout
 * (Navbar/Footer stay mounted) so only the page body shows the spinner while
 * its chunk loads. Mirrors the spinner used by ProtectedAdminRoute.
 */

export function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#ea580c]" />
    </div>
  )
}
