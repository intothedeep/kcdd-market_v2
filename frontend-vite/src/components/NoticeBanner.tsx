/**
 * Notice Banner Component
 * Displays an important notice at the top of every page
 */

export function NoticeBanner() {
  return (
    <div className="flex items-center justify-center overflow-hidden bg-[hsl(var(--brand-primary-light))] px-4 py-2.5">
      <p className="whitespace-nowrap text-sm font-normal text-[hsl(var(--brand-primary))]">
        Important Notice Banner • Important Notice Banner • Important Notice Banner • Important
        Notice Banner • Important Notice Banner • Important Notice Banner • Important Notice Banner
      </p>
    </div>
  )
}
