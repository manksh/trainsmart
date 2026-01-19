'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { apiPost, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

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

/** Format seconds into "X minutes" or "X seconds" */
function formatRetryTime(seconds: number): string {
  if (seconds >= 60) {
    const minutes = Math.ceil(seconds / 60)
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }
  return `${seconds} second${seconds !== 1 ? 's' : ''}`
}

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null)
  const [isRateLimited, setIsRateLimited] = useState(false)

  // Countdown timer for rate limiting
  useEffect(() => {
    if (retryAfterSeconds === null || retryAfterSeconds <= 0) {
      if (isRateLimited) {
        setIsRateLimited(false)
        setRetryAfterSeconds(null)
        setError(null)
      }
      return
    }

    const timer = setInterval(() => {
      setRetryAfterSeconds((prev) => {
        if (prev === null || prev <= 1) {
          return null
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [retryAfterSeconds, isRateLimited])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordForm) => {
    if (isRateLimited) return

    setError(null)
    setIsLoading(true)

    try {
      await apiPost('/auth/forgot-password', { email: data.email })
      setSubmittedEmail(data.email)
      setEmailSent(true)
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 429) {
        setIsRateLimited(true)
        const waitTime = err.retryAfter || 3600 // Default to 1 hour
        setRetryAfterSeconds(waitTime)
        setError(`Too many requests. Please wait ${formatRetryTime(waitTime)} before trying again.`)
      } else {
        const apiErr = err as ApiError
        const errorData = apiErr.data as { detail?: string } | undefined
        setError(errorData?.detail || 'Something went wrong. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
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
            <div className="bg-sage-50 border border-sage-200 rounded-xl p-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sage-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-sage-800 mb-2">
                Check your email
              </h2>
              <p className="text-sage-600 mb-2">
                If an account exists for <strong>{submittedEmail}</strong>, you will receive a password reset link shortly.
              </p>
              <p className="text-sage-500 text-sm mb-6">
                The link will expire in 30 minutes.
              </p>
              <div className="space-y-3">
                <Link href="/login">
                  <Button className="w-full bg-sage-700 hover:bg-sage-800 text-sage-50 focus:ring-sage-400">
                    Return to sign in
                  </Button>
                </Link>
                <p className="text-sm text-sage-500">
                  Didn&apos;t receive an email?{' '}
                  <button
                    onClick={() => setEmailSent(false)}
                    className="text-sage-700 hover:text-sage-800 font-medium underline underline-offset-2"
                  >
                    Try again
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
          <div
            className="bg-sage-50/15 backdrop-blur-sm rounded-xl p-5 motion-safe:animate-float"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-sage-50/20 flex items-center justify-center text-sage-50 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sage-50 font-semibold text-base mb-1">
                  Secure Password Reset
                </h3>
                <p className="text-sage-100/80 text-sm">
                  We&apos;ll send you a secure link to reset your password. The link expires in 30 minutes.
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
              Forgot password?
            </h2>
            <p className="text-sage-600">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Rate limit warning */}
            {isRateLimited && retryAfterSeconds !== null && (
              <div
                className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm"
                role="alert"
              >
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="font-medium">Too many requests</p>
                    <p className="mt-1">
                      Please wait {formatRetryTime(retryAfterSeconds)} before trying again.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Standard error message */}
            {error && !isRateLimited && (
              <div
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                role="alert"
              >
                {error}
              </div>
            )}

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
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="mt-1.5 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-sage-700 hover:bg-sage-800 text-sage-50 focus:ring-sage-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || isRateLimited}
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
                  Sending...
                </span>
              ) : isRateLimited && retryAfterSeconds !== null ? (
                `Wait ${formatRetryTime(retryAfterSeconds)}`
              ) : (
                'Send reset link'
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
