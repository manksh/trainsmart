'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

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
    title: 'Perform Under Pressure',
    description: 'Build mental resilience for high-stakes moments',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: 'Science-Backed Methods',
    description: 'Evidence-based techniques from sports psychology',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    title: 'Track Your Progress',
    description: 'Monitor growth with personalized insights',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
]

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setError(null)
    setIsLoading(true)

    try {
      await login(data.email, data.password)
      // Redirect based on role will be handled by dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.data?.detail || 'Invalid email or password')
    } finally {
      setIsLoading(false)
    }
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
            Train your mind like you train your body
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

      {/* Right Panel - Login Form */}
      <div
        className="lg:w-[60%] flex items-center justify-center px-6 py-12 lg:px-16 lg:py-16"
        style={{ backgroundColor: '#fafdf7' }}
      >
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-sage-700 mb-2">
              Welcome back
            </h2>
            <p className="text-sage-600">
              Sign in to continue your training
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="space-y-4">
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
                  autoComplete="current-password"
                  {...register('password')}
                  className="w-full border-sage-200 focus:border-sage-400 focus:ring-sage-400"
                  placeholder="Enter your password"
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                {errors.password && (
                  <p id="password-error" className="mt-1.5 text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>
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
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </Button>

            <p className="text-center text-sm text-sage-600">
              Have an invite code?{' '}
              <Link
                href="/signup"
                className="text-sage-700 hover:text-sage-800 font-medium underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:ring-offset-2 rounded"
              >
                Sign up here
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
