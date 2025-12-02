/**
 * Notice Banner Component
 * Displays an important notice at the top of every page
 */

export function NoticeBanner() {
  return (
    <div className="bg-[hsl(var(--brand-primary-light))] flex items-center justify-center px-4 py-2.5 overflow-hidden">
      <p className="text-[hsl(var(--brand-primary))] text-sm font-normal whitespace-nowrap">
        Important Notice Banner • Important Notice Banner • Important Notice Banner • Important Notice Banner • Important Notice Banner • Important Notice Banner • Important Notice Banner
      </p>
    </div>
  )
}

