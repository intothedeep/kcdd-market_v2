import { create } from 'zustand'

interface Organization {
  id: string
  name: string
  user_id: string
  [key: string]: any
}

interface AuthState {
  organization: Organization | null
  userType: 'donor' | 'cbo' | 'admin' | null
  organizationLoaded: boolean
  setOrganization: (org: Organization | null) => void
  setUserType: (type: AuthState['userType']) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  organization: null,
  userType: null,
  organizationLoaded: false,
  setOrganization: (organization) => set({ organization, organizationLoaded: true }),
  setUserType: (userType) => set({ userType }),
  reset: () => set({ organization: null, userType: null, organizationLoaded: false }),
}))
