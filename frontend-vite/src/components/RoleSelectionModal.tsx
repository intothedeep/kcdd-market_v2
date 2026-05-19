/**
 * Role Selection Modal
 *
 * Overlay shown after signup to let users choose between:
 * - Donor: "I want to give"
 * - Recipient: "I need support" (can be individual or organization)
 */

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { Heart, Users, Loader2, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { USER_TYPES, type UserType } from '@/constants/userTypes'
import { routes } from '@/config'
import { OnboardingModal } from '@/components/OnboardingModal'

interface RoleSelectionModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RoleSelectionModal({ isOpen, onClose }: RoleSelectionModalProps) {
  const { user } = useUser()
  const navigate = useNavigate()
  const location = useLocation()

  // Redirect to homepage if modal needs to show but user isn't there
  useEffect(() => {
    if (isOpen && location.pathname !== '/') {
      navigate('/')
    }
  }, [isOpen, location.pathname, navigate])
  const [selectedRole, setSelectedRole] = useState<UserType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [confirmedUserType, setConfirmedUserType] = useState<'cbo' | 'donor' | null>(null)

  const handleRoleSelect = async (userType: UserType) => {
    if (!user) return

    setSelectedRole(userType)
    setIsSubmitting(true)

    try {
      // Create user_profile with selected role (onboarding NOT complete yet).
      // Capture email + name from Clerk on this first write so we always
      // have contact info even if the user bails before completing the
      // donor / org-specific second step below.
      const clerkEmail = user.primaryEmailAddress?.emailAddress || null
      const clerkName =
        `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
        user.username ||
        clerkEmail ||
        null
      const { error: profileError } = await supabase.from('user_profiles').upsert(
        {
          id: user.id,
          user_type: userType,
          is_vetted: false,
          onboarding_complete: false,
          wants_updates: false,
          org_tier: 'individual',
          verification_status: 'unverified',
          email: clerkEmail,
          name: clerkName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )

      if (profileError) throw profileError

      // Create initial donor profile if donor
      if (userType === USER_TYPES.DONOR) {
        const { error: donorError } = await supabase.from('donor_profiles').upsert(
          {
            user_id: user.id,
            display_name: user.firstName || user.username || 'Anonymous',
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous',
            email: user.primaryEmailAddress?.emailAddress || '',
            phone: user.primaryPhoneNumber?.phoneNumber || null,
          },
          { onConflict: 'user_id' }
        )

        if (donorError && donorError.code !== '23505') {
          console.error('Error creating donor profile:', donorError)
        }
      }

      // Show onboarding modal
      setConfirmedUserType(userType === USER_TYPES.DONOR ? 'donor' : 'cbo')
      setShowOnboarding(true)
      setIsSubmitting(false)
    } catch (error) {
      console.error('Error setting user role:', error)
      setIsSubmitting(false)
      setSelectedRole(null)
    }
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    onClose()
    // Navigate to appropriate dashboard
    if (confirmedUserType === 'donor') {
      navigate(routes.donor.dashboard)
    } else {
      navigate(routes.cbo.dashboard)
    }
  }

  const handleOnboardingClose = () => {
    setShowOnboarding(false)
    onClose()
    // Still navigate even if they skip
    if (confirmedUserType === 'donor') {
      navigate(routes.donor.dashboard)
    } else {
      navigate(routes.cbo.dashboard)
    }
  }

  // Only show on homepage
  if (!isOpen || location.pathname !== '/') return null

  // If showing onboarding, render that instead
  if (showOnboarding && confirmedUserType) {
    return (
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={handleOnboardingClose}
        onComplete={handleOnboardingComplete}
        userType={confirmedUserType}
      />
    )
  }

  const roleOptions = [
    {
      type: USER_TYPES.DONOR,
      title: 'I want to give',
      description: 'Support Kansas City community members and organizations with donations',
      icon: Heart,
      color: '#ea580c',
      bgColor: 'bg-[#ea580c]/10',
      features: ['Browse active campaigns', 'Make secure donations', 'Track your impact'],
    },
    {
      type: USER_TYPES.RECIPIENT_ORG,
      title: 'I need support',
      description: 'Request technology equipment and resources for yourself or your organization',
      icon: Users,
      color: '#1b5858',
      bgColor: 'bg-[#1b5858]/10',
      features: ['Create funding campaigns', 'Connect with donors', 'Manage your profile'],
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-md" />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-[600px] overflow-hidden rounded-[10px] bg-[#103032]">
        {/* Content */}
        <div className="flex flex-col overflow-y-auto p-8 md:p-[40px]">
          {/* Header */}
          <div className="mb-8">
            <h2 className="mb-2 text-[28px] font-bold text-white md:text-[32px]">
              Welcome to KC Digital Drive
            </h2>
            <p className="text-base text-white/70">
              How would you like to participate in bridging the digital divide?
            </p>
          </div>

          {/* Role Cards - Stacked Vertically */}
          <div className="flex flex-1 flex-col gap-4">
            {roleOptions.map((option) => {
              const isSelected = selectedRole === option.type
              const isLoading = isSelected && isSubmitting
              const Icon = option.icon
              const isRecipient = option.type === USER_TYPES.RECIPIENT_ORG

              return (
                <button
                  key={option.type}
                  onClick={() => !isSubmitting && handleRoleSelect(option.type)}
                  disabled={isSubmitting}
                  className={`
                    group relative rounded-[10px] p-5 text-left
                    transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#103032]
                    disabled:cursor-not-allowed disabled:opacity-70
                    ${
                      isRecipient
                        ? 'border border-[#2a6b6b] bg-[#1b5858] hover:scale-[1.02] hover:border-[#c4e5c1] hover:bg-[#236363] focus:ring-[#c4e5c1]'
                        : 'border border-[#1b5858] bg-[#183c3f] hover:scale-[1.02] hover:border-[#ea580c] hover:bg-[#1f4a4d] focus:ring-[#ea580c]'
                    }
                    ${isSelected ? 'scale-[1.02] ring-2' : ''}
                    ${isSelected && isRecipient ? 'border-[#c4e5c1] ring-[#c4e5c1]' : ''}
                    ${isSelected && !isRecipient ? 'border-[#ea580c] ring-[#ea580c]' : ''}
                  `}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon - light background with colored icon */}
                    <div
                      className={`
                        flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full
                        transition-all duration-200
                        ${
                          isRecipient
                            ? 'bg-[#c4e5c1] group-hover:bg-[#d4efd1]'
                            : 'bg-[#ea580c]/20 group-hover:bg-[#ea580c]/30'
                        }
                      `}
                    >
                      <Icon
                        className="h-6 w-6"
                        style={{ color: isRecipient ? '#1b5858' : '#ea580c' }}
                      />
                    </div>

                    <div className="flex-1">
                      {/* Title */}
                      <h3 className="mb-1 text-lg font-bold text-white">{option.title}</h3>

                      {/* Description */}
                      <p className="mb-3 text-sm text-white/70">{option.description}</p>

                      {/* Features */}
                      <ul className="space-y-1">
                        {option.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm text-white/60">
                            <span
                              className="h-1 w-1 flex-shrink-0 rounded-full"
                              style={{ backgroundColor: isRecipient ? '#c4e5c1' : '#ea580c' }}
                            />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action indicator */}
                    <div
                      className={`
                        flex flex-shrink-0 items-center gap-2 self-center text-sm font-medium
                        transition-all duration-200
                        ${
                          isRecipient
                            ? 'text-[#c4e5c1] group-hover:translate-x-1'
                            : 'text-[#ea580c] group-hover:translate-x-1'
                        }
                      `}
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <ArrowRight className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Footer note */}
          <p className="mt-6 text-center text-sm text-white/50">
            You can always change this later in your account settings.
          </p>
        </div>
      </div>
    </div>
  )
}
