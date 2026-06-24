import { create } from 'zustand'

/**
 * Shared open state for the mobile navigation bottom-sheet so multiple triggers
 * (the top-nav hamburger in Navbar + the bottom-left FAB in MobileNavSheet)
 * control the same sheet.
 */
interface MobileNavState {
  open: boolean
  setOpen: (open: boolean) => void
  openNav: () => void
  closeNav: () => void
}

export const useMobileNavStore = create<MobileNavState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  openNav: () => set({ open: true }),
  closeNav: () => set({ open: false }),
}))
