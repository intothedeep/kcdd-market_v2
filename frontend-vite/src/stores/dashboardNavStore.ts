import { create } from 'zustand'

/**
 * Shared open state for the dashboard side-navigation off-canvas Sheet
 * (admin / cbo / donor dashboards). Lifting it out of each DashboardPage's
 * local useState lets an external trigger — the bottom-left speed-dial FAB
 * (MobileNavFab) — open the dashboard menu, the same way mobileNavStore lets
 * it open the home bottom-sheet.
 *
 * Only one dashboard renders at a time, so a single shared store is safe.
 */
interface DashboardNavState {
  open: boolean
  setOpen: (open: boolean) => void
  openNav: () => void
  closeNav: () => void
}

export const useDashboardNavStore = create<DashboardNavState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  openNav: () => set({ open: true }),
  closeNav: () => set({ open: false }),
}))
