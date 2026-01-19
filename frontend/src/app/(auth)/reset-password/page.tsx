'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { apiPost, apiGet, ApiError } from '@/lib/api'
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

const resetPasswordSchema = z.object({
  new_password: z.string()
    .min(PASSWORD_REQUIREMENTS.minLength, `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`)
    .max(PASSWORD_REQUIREMENTS.maxLength, `Password must be at most ${PASSWORD_REQUIREMENTS.maxLength} characters`)
    .regex(PASSWORD_REQUIREMENTS.hasLetter, 'Password must contain at least one letter')
    .regex(PASSWORD_REQUIREMENTS.hasNumber, 'Password must contain at least one number')
    .regex(PASSWORD_REQUIREMENTS.hasSpecial, 'Password must contain at least one special character'),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
})

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

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
    { key: 'length', label: '8-12 characters', met: requirements.length },
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

function ResetPasswordFormComponent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [isTokenValid, setIsTokenValid] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const passwordValue = watch('new_password') || ''

  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setIsValidating(false)
        setIsTokenValid(false)
        return
      }

      try {
        const response = await apiGet<{ valid: boolean }>(`/auth/validate-token/${token}`)
        setIsTokenValid(response.valid)
      } catch (err) {
        setIsTokenValid(false)
      } finally {
        setIsValidating(false)
      }
    }

    validateToken()
  }, [token])

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) return

    setError(null)
    setIsLoading(true)

    try {
      await apiPost('/auth/reset-password', {
        token,
        new_password: data.new_password,
      })
      setIsSuccess(true)
    } catch (err: unknown) {
      const apiErr = err as ApiError
      const errorData = apiErr.data as { detail?: string } | undefined
      setError(errorData?.detail || 'Failed to reset password. Please try again or request a new reset link.')
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state while validating token
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fafdf7' }}>
        <div className="text-center">
          <LoadingSpinner size="md" />
          <p className="mt-4 text-sage-600">Validating reset link...</p>
        </div>
      </div>
    )
  }

  // Invalid or expired token
  if (!token || !isTokenValid) {
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

        {/* Right Panel - Invalid Token Message */}
        <div
          className="lg:w-[60%] flex items-center justify-center px-6 py-12 lg:px-16 lg:py-16"
          style={{ backgroundColor: '#fafdf7' }}
        >
          <div className="w-full max-w-md text-center">
            <div className="bg-red-50 border border-red-200 rounded-xl p-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-red-800 mb-2">
                Invalid or Expired Link
              </h2>
              <p className="text-red-700 mb-6">
                This password reset link is invalid or has expired. Reset links are only valid for 30 minutes.
              </p>
              <div className="space-y-3">
                <Link href="/forgot-password">
                  <Button className="w-full bg-sage-700 hover:bg-sage-800 text-sage-50 focus:ring-sage-400">
                    Request a new reset link
                  </Button>
                </Link>
                <Link
                  href="/login"
                  className="block text-sage-700 hover:text-sage-800 font-medium underline underline-offset-2"
                >
                  Return to sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (isSuccess) {
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
                Password Reset!
              </h2>
              <p className="text-green-700 mb-6">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <Link href="/login">
                <Button className="w-full bg-sage-700 hover:bg-sage-800 text-sage-50 focus:ring-sage-400">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Reset password form
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Brand */}
      <div className="lg:w-[40%] bg-gradient-to-br from-sage-700 to-sage-400 flex flex-col justify-center px-8 py-12 lg:px-12 lg:py-16 min-h-[30vh] lg:min-h-screen">
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

        {/* Info Card - Hidden on mobile */}
        <div className="hidden lg:block">
          <div className="bg-sage-50/15 backdrop-blur-sm rounded-xl p-5 motion-safe:animate-float">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-sage-50/20 flex items-center justify-center text-sage-50 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sage-50 font-semibold text-base mb-1">
                  Create a Strong Password
                </h3>
                <p className="text-sage-100/80 text-sm">
                  Your new password must include letters, numbers, and special characters.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div
        className="lg:w-[60%] flex items-center justify-center px-6 py-12 lg:px-16 lg:py-16"
        style={{ backgroundColor: '#fafdf7' }}
      >
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-sage-700 mb-2">
              Create new password
            </h2>
            <p className="text-sage-600">
              Enter your new password below.
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

            <div>
              <label
                htmlFor="new_password"
                className="block text-sm font-medium text-sage-700 mb-1.5"
              >
                New password
              </label>
              <Input
                id="new_password"
                type="password"
                autoComplete="new-password"
                {...register('new_password')}
                className="w-full border-sage-200 focus:border-sage-400 focus:ring-sage-400"
                placeholder="8-12 characters"
                aria-describedby="password-requirements password-error"
              />
              <PasswordRequirementsChecklist password={passwordValue} />
              {errors.new_password && (
                <p id="password-error" className="mt-1.5 text-sm text-red-600">
                  {errors.new_password.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirm_password"
                className="block text-sm font-medium text-sage-700 mb-1.5"
              >
                Confirm new password
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

            <Button
              type="submit"
              className="w-full bg-sage-700 hover:bg-sage-800 text-sage-50 focus:ring-sage-400 focus:ring-offset-2"
              disabled={isLoading}
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
                  Resetting password...
                </span>
              ) : (
                'Reset password'
              )}
            </Button>

            <p className="text-center text-sm text-sage-600">
              Remember your password?{' '}
              <Link
                href="/login"
                className="text-sage-700 hover:text-sage-800 font-medium underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:ring-offset-2 rounded"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fafdf7' }}>
        <LoadingSpinner size="md" />
      </div>
    }>
      <ResetPasswordFormComponent />
    </Suspense>
  )
}
