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
import { Heart, Users, Loader2, ArrowRight, X } from 'lucide-react'
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
      // Create user_profile with selected role (onboarding NOT complete yet)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          user_type: userType,
          is_vetted: false,
          onboarding_complete: false,
          wants_updates: false,
          org_tier: 'individual',
          verification_status: 'unverified',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })

      if (profileError) throw profileError

      // Create initial donor profile if donor
      if (userType === USER_TYPES.DONOR) {
        const { error: donorError } = await supabase
          .from('donor_profiles')
          .upsert({
            user_id: user.id,
            display_name: user.firstName || user.username || 'Anonymous',
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous',
            email: user.primaryEmailAddress?.emailAddress || '',
            phone: user.primaryPhoneNumber?.phoneNumber || null,
          }, { onConflict: 'user_id' })

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
      features: [
        'Browse active campaigns',
        'Make secure donations',
        'Track your impact',
      ],
    },
    {
      type: USER_TYPES.RECIPIENT_ORG,
      title: 'I need support',
      description: 'Request technology equipment and resources for yourself or your organization',
      icon: Users,
      color: '#1b5858',
      bgColor: 'bg-[#1b5858]/10',
      features: [
        'Create funding campaigns',
        'Connect with donors',
        'Manage your profile',
      ],
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-md" />

      {/* Modal */}
      <div className="relative bg-[#103032] rounded-[10px] overflow-hidden max-w-[600px] w-full mx-4">
        {/* Content */}
        <div className="p-8 md:p-[40px] overflow-y-auto flex flex-col">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-[28px] md:text-[32px] font-bold text-white mb-2">
              Welcome to KC Digital Drive
            </h2>
            <p className="text-white/70 text-base">
              How would you like to participate in bridging the digital divide?
            </p>
          </div>

          {/* Role Cards - Stacked Vertically */}
          <div className="flex flex-col gap-4 flex-1">
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
                    disabled:opacity-70 disabled:cursor-not-allowed
                    ${isRecipient
                      ? 'bg-[#1b5858] border border-[#2a6b6b] hover:bg-[#236363] hover:border-[#c4e5c1] hover:scale-[1.02] focus:ring-[#c4e5c1]'
                      : 'bg-[#183c3f] border border-[#1b5858] hover:bg-[#1f4a4d] hover:border-[#ea580c] hover:scale-[1.02] focus:ring-[#ea580c]'
                    }
                    ${isSelected ? 'ring-2 scale-[1.02]' : ''}
                    ${isSelected && isRecipient ? 'ring-[#c4e5c1] border-[#c4e5c1]' : ''}
                    ${isSelected && !isRecipient ? 'ring-[#ea580c] border-[#ea580c]' : ''}
                  `}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon - light background with colored icon */}
                    <div
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
                        transition-all duration-200
                        ${isRecipient
                          ? 'bg-[#c4e5c1] group-hover:bg-[#d4efd1]'
                          : 'bg-[#ea580c]/20 group-hover:bg-[#ea580c]/30'
                        }
                      `}
                    >
                      <Icon
                        className="w-6 h-6"
                        style={{ color: isRecipient ? '#1b5858' : '#ea580c' }}
                      />
                    </div>

                    <div className="flex-1">
                      {/* Title */}
                      <h3 className="text-lg font-bold mb-1 text-white">
                        {option.title}
                      </h3>

                      {/* Description */}
                      <p className="text-sm mb-3 text-white/70">
                        {option.description}
                      </p>

                      {/* Features */}
                      <ul className="space-y-1">
                        {option.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm text-white/60">
                            <span
                              className="w-1 h-1 rounded-full flex-shrink-0"
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
                        flex items-center gap-2 text-sm font-medium flex-shrink-0 self-center
                        transition-all duration-200
                        ${isRecipient
                          ? 'text-[#c4e5c1] group-hover:translate-x-1'
                          : 'text-[#ea580c] group-hover:translate-x-1'
                        }
                      `}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <ArrowRight className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Footer note */}
          <p className="text-center text-sm text-white/50 mt-6">
            You can always change this later in your account settings.
          </p>
        </div>
      </div>
    </div>
  )
}
