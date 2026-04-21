import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface ImpersonationState {
  userId: string
  userType: 'donor' | 'cbo' | 'admin'
  displayName: string
}

interface ImpersonationContextValue {
  impersonating: ImpersonationState | null
  startImpersonating: (state: ImpersonationState) => void
  stopImpersonating: () => void
  isImpersonating: boolean
}

const ImpersonationContext = createContext<ImpersonationContextValue>({
  impersonating: null,
  startImpersonating: () => {},
  stopImpersonating: () => {},
  isImpersonating: false,
})

export function useImpersonation() {
  return useContext(ImpersonationContext)
}

function loadFromSession(): ImpersonationState | null {
  try {
    const stored = sessionStorage.getItem('impersonation')
    if (stored) return JSON.parse(stored)
  } catch {
    // ignore
  }
  return null
}

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [impersonating, setImpersonating] = useState<ImpersonationState | null>(loadFromSession)

  const startImpersonating = useCallback((state: ImpersonationState) => {
    sessionStorage.setItem('impersonation', JSON.stringify(state))
    setImpersonating(state)
  }, [])

  const stopImpersonating = useCallback(() => {
    sessionStorage.removeItem('impersonation')
    setImpersonating(null)
  }, [])

  return (
    <ImpersonationContext.Provider
      value={{
        impersonating,
        startImpersonating,
        stopImpersonating,
        isImpersonating: !!impersonating,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  )
}

export function ImpersonationBanner() {
  const { impersonating, stopImpersonating, isImpersonating } = useImpersonation()
  const navigate = useNavigate()

  if (!isImpersonating || !impersonating) return null

  return (
    <div className="sticky top-0 z-[100] flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-md">
      <span>
        Impersonating <strong>{impersonating.displayName}</strong> ({impersonating.userType})
      </span>
      <button
        onClick={() => {
          stopImpersonating()
          navigate('/admin')
        }}
        className="rounded bg-white/20 px-3 py-0.5 text-xs font-semibold transition hover:bg-white/30"
      >
        Stop Impersonating
      </button>
    </div>
  )
}
