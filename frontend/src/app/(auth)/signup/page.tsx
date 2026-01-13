'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { apiGet, apiPost } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

/** Password validation requirements */
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 12,
  hasLetter: /[a-zA-Z]/,
  hasNumber: /\d/,
  hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
}

/** Validate password and return which requirements are met */
function validatePasswordRequirements(password: string) {
  return {
    length: password.length >= PASSWORD_REQUIREMENTS.minLength && password.length <= PASSWORD_REQUIREMENTS.maxLength,
    hasLetter: PASSWORD_REQUIREMENTS.hasLetter.test(password),
    hasNumber: PASSWORD_REQUIREMENTS.hasNumber.test(password),
    hasSpecial: PASSWORD_REQUIREMENTS.hasSpecial.test(password),
  }
}

const signupSchema = z.object({
  invite_code: z.string().min(1, 'Invite code is required'),
  email: z.string().email('Invalid email address'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  password: z.string()
    .min(PASSWORD_REQUIREMENTS.minLength, `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`)
    .max(PASSWORD_REQUIREMENTS.maxLength, `Password must be at most ${PASSWORD_REQUIREMENTS.maxLength} characters`)
    .regex(PASSWORD_REQUIREMENTS.hasLetter, 'Password must contain at least one letter')
    .regex(PASSWORD_REQUIREMENTS.hasNumber, 'Password must contain at least one number')
    .regex(PASSWORD_REQUIREMENTS.hasSpecial, 'Password must contain at least one special character'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
})

type SignupFormData = z.infer<typeof signupSchema>

interface InviteValidation {
  is_valid: boolean
  email?: string
  organization_name?: string
  role?: string
  message?: string
}

/** Check icon for met requirements */
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

/** X icon for unmet requirements */
function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  )
}

/** Password requirements checklist with real-time validation */
function PasswordRequirementsChecklist({ password }: { password: string }) {
  const requirements = validatePasswordRequirements(password)
  const hasStartedTyping = password.length > 0

  const items = [
    { key: 'length', label: `8-12 characters`, met: requirements.length },
    { key: 'hasLetter', label: 'At least one letter (a-z, A-Z)', met: requirements.hasLetter },
    { key: 'hasNumber', label: 'At least one number (0-9)', met: requirements.hasNumber },
    { key: 'hasSpecial', label: 'At least one special character (!@#$...)', met: requirements.hasSpecial },
  ]

  return (
    <div className="mt-2 p-3 bg-sage-50 border border-sage-200 rounded-lg" role="status" aria-live="polite">
      <p className="text-xs font-medium text-sage-700 mb-2">Password requirements:</p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li
            key={item.key}
            className={`flex items-center gap-2 text-xs ${
              !hasStartedTyping
                ? 'text-sage-500'
                : item.met
                ? 'text-green-600'
                : 'text-red-600'
            }`}
          >
            {!hasStartedTyping ? (
              <span className="w-4 h-4 rounded-full border border-sage-300 flex-shrink-0" aria-hidden="true" />
            ) : item.met ? (
              <CheckIcon className="w-4 h-4 flex-shrink-0" />
            ) : (
              <XIcon className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Lightning bolt icon for CTLST Labs branding */
function LightningBoltIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )
}

/** Feature card data for the left panel */
const featureCards = [
  {
    title: 'Invite-Only Access',
    description: 'Join your team with a personalized invite code',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
  },
  {
    title: 'Personalized Training',
    description: 'Customized mental performance programs for you',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    title: 'Team Integration',
    description: 'Connect with your coaches and teammates',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
]

function SignupFormComponent() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [inviteInfo, setInviteInfo] = useState<InviteValidation | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      invite_code: searchParams.get('code') || '',
    },
  })

  const inviteCode = watch('invite_code')
  const passwordValue = watch('password') || ''

  // Validate invite code
  useEffect(() => {
    const validateInvite = async () => {
      if (!inviteCode || inviteCode.length < 10) {
        setInviteInfo(null)
        return
      }

      setIsValidating(true)
      try {
        const result = await apiGet<InviteValidation>(`/invites/validate/${inviteCode}`)
        setInviteInfo(result)
        if (result.email) {
          setValue('email', result.email)
        }
      } catch (err) {
        setInviteInfo({ is_valid: false, message: 'Could not validate invite' })
      } finally {
        setIsValidating(false)
      }
    }

    const timer = setTimeout(validateInvite, 500)
    return () => clearTimeout(timer)
  }, [inviteCode, setValue])

  const onSubmit = async (data: SignupFormData) => {
    setError(null)
    setIsLoading(true)

    try {
      await apiPost('/auth/register', {
        invite_code: data.invite_code,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        password: data.password,
      })
      setSuccess(true)
    } catch (err: any) {
      setError(err.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Left Panel - Brand */}
        <div className="lg:w-[40%] bg-gradient-to-br from-sage-700 to-sage-400 flex flex-col justify-center px-8 py-12 lg:px-12 lg:py-16 min-h-[30vh] lg:min-h-screen">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-sage-50/20 backdrop-blur-sm flex items-center justify-center">
              <LightningBoltIcon className="w-6 h-6 lg:w-7 lg:h-7 text-sage-50" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-sage-50">
              CTLST Labs
            </h1>
          </div>
          <p className="text-sage-100 text-lg lg:text-xl font-medium">
            Train your mind. Own your performance.
          </p>
        </div>

        {/* Right Panel - Success Message */}
        <div
          className="lg:w-[60%] flex items-center justify-center px-6 py-12 lg:px-16 lg:py-16"
          style={{ backgroundColor: '#fafdf7' }}
        >
          <div className="w-full max-w-md text-center">
            <div className="bg-green-50 border border-green-200 rounded-xl p-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">
                Account Created!
              </h2>
              <p className="text-green-700 mb-6">
                Your account has been created successfully.
              </p>
              <Link href="/login">
                <Button className="bg-sage-700 hover:bg-sage-800 text-sage-50 focus:ring-sage-400">
                  Sign in to your account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Brand and Features */}
      <div className="lg:w-[40%] bg-gradient-to-br from-sage-700 to-sage-400 flex flex-col justify-center px-8 py-12 lg:px-12 lg:py-16 min-h-[30vh] lg:min-h-screen">
        {/* Logo and Tagline */}
        <div className="mb-8 lg:mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-sage-50/20 backdrop-blur-sm flex items-center justify-center">
              <LightningBoltIcon className="w-6 h-6 lg:w-7 lg:h-7 text-sage-50" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-sage-50">
              CTLST Labs
            </h1>
          </div>
          <p className="text-sage-100 text-lg lg:text-xl font-medium">
            Train your mind. Own your performance.
          </p>
        </div>

        {/* Feature Cards - Hidden on mobile */}
        <div className="hidden lg:flex flex-col gap-4">
          {featureCards.map((card, index) => (
            <div
              key={card.title}
              className="bg-sage-50/15 hover:bg-sage-50/25 backdrop-blur-sm rounded-xl p-5 transition-colors duration-300 motion-safe:animate-float"
              style={{
                animationDelay: `${index * 0.5}s`,
              }}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-sage-50/20 flex items-center justify-center text-sage-50 flex-shrink-0">
                  {card.icon}
                </div>
                <div>
                  <h3 className="text-sage-50 font-semibold text-base mb-1">
                    {card.title}
                  </h3>
                  <p className="text-sage-100/80 text-sm">
                    {card.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div
        className="lg:w-[60%] flex items-center justify-center px-6 py-12 lg:px-16 lg:py-16"
        style={{ backgroundColor: '#fafdf7' }}
      >
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-sage-700 mb-2">
              Create your account
            </h2>
            <p className="text-sage-600">
              Enter your invite code to get started
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Invite Code */}
              <div>
                <label
                  htmlFor="invite_code"
                  className="block text-sm font-medium text-sage-700 mb-1.5"
                >
                  Invite Code
                </label>
                <Input
                  id="invite_code"
                  {...register('invite_code')}
                  className="w-full border-sage-200 focus:border-sage-400 focus:ring-sage-400"
                  placeholder="Enter your invite code"
                  aria-describedby={errors.invite_code ? 'invite-code-error' : undefined}
                />
                {errors.invite_code && (
                  <p id="invite-code-error" className="mt-1.5 text-sm text-red-600">
                    {errors.invite_code.message}
                  </p>
                )}
                {isValidating && (
                  <p className="mt-1.5 text-sm text-sage-500">Validating...</p>
                )}
                {inviteInfo && (
                  <div className={`mt-2 p-3 rounded-lg text-sm ${
                    inviteInfo.is_valid
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {inviteInfo.is_valid ? (
                      <>
                        <p className="font-medium">Valid invite!</p>
                        <p>Organization: {inviteInfo.organization_name}</p>
                        <p>Role: {inviteInfo.role}</p>
                      </>
                    ) : (
                      <p>{inviteInfo.message || 'Invalid invite code'}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-sage-700 mb-1.5"
                >
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className="w-full border-sage-200 focus:border-sage-400 focus:ring-sage-400"
                  placeholder="you@example.com"
                  disabled={!!inviteInfo?.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="mt-1.5 text-sm text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Names */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="first_name"
                    className="block text-sm font-medium text-sage-700 mb-1.5"
                  >
                    First name
                  </label>
                  <Input
                    id="first_name"
                    autoComplete="given-name"
                    {...register('first_name')}
                    className="w-full border-sage-200 focus:border-sage-400 focus:ring-sage-400"
                    aria-describedby={errors.first_name ? 'first-name-error' : undefined}
                  />
                  {errors.first_name && (
                    <p id="first-name-error" className="mt-1.5 text-sm text-red-600">
                      {errors.first_name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="last_name"
                    className="block text-sm font-medium text-sage-700 mb-1.5"
                  >
                    Last name
                  </label>
                  <Input
                    id="last_name"
                    autoComplete="family-name"
                    {...register('last_name')}
                    className="w-full border-sage-200 focus:border-sage-400 focus:ring-sage-400"
                    aria-describedby={errors.last_name ? 'last-name-error' : undefined}
                  />
                  {errors.last_name && (
                    <p id="last-name-error" className="mt-1.5 text-sm text-red-600">
                      {errors.last_name.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-sage-700 mb-1.5"
                >
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  {...register('password')}
                  className="w-full border-sage-200 focus:border-sage-400 focus:ring-sage-400"
                  placeholder="8-12 characters"
                  aria-describedby="password-requirements password-error"
                />
                <PasswordRequirementsChecklist password={passwordValue} />
                {errors.password && (
                  <p id="password-error" className="mt-1.5 text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirm_password"
                  className="block text-sm font-medium text-sage-700 mb-1.5"
                >
                  Confirm password
                </label>
                <Input
                  id="confirm_password"
                  type="password"
                  autoComplete="new-password"
                  {...register('confirm_password')}
                  className="w-full border-sage-200 focus:border-sage-400 focus:ring-sage-400"
                  aria-describedby={errors.confirm_password ? 'confirm-password-error' : undefined}
                />
                {errors.confirm_password && (
                  <p id="confirm-password-error" className="mt-1.5 text-sm text-red-600">
                    {errors.confirm_password.message}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-sage-700 hover:bg-sage-800 text-sage-50 focus:ring-sage-400 focus:ring-offset-2"
              disabled={isLoading || !inviteInfo?.is_valid}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </Button>

            <p className="text-center text-sm text-sage-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-sage-700 hover:text-sage-800 font-medium underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:ring-offset-2 rounded"
              >
                Sign in
              </Link>
            </p>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-sage-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#fafdf7] text-sage-500">or</span>
              </div>
            </div>

            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfNjBEJ1GLOUNp8TJ30mClOU948HKyohfX_0kDhBmvZ1xPNvg/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-2.5 px-4 border border-sage-300 rounded-lg text-sage-700 font-medium hover:bg-sage-50 hover:border-sage-400 transition-colors focus:outline-none focus:ring-2 focus:ring-sage-400 focus:ring-offset-2"
            >
              Join Our Waitlist
            </a>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    }>
      <SignupFormComponent />
    </Suspense>
  )
}
