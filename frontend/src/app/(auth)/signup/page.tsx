'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { apiGet, apiPost } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const signupSchema = z.object({
  invite_code: z.string().min(1, 'Invite code is required'),
  email: z.string().email('Invalid email address'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
})

type SignupForm = z.infer<typeof signupSchema>

interface InviteValidation {
  is_valid: boolean
  email?: string
  organization_name?: string
  role?: string
  message?: string
}

function SignupForm() {
  const router = useRouter()
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
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      invite_code: searchParams.get('code') || '',
    },
  })

  const inviteCode = watch('invite_code')

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

  const onSubmit = async (data: SignupForm) => {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-green-800 mb-2">
              Account Created!
            </h2>
            <p className="text-green-700 mb-4">
              Your account has been created successfully.
            </p>
            <Link href="/login">
              <Button>Sign in to your account</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-primary-600">
            TrainSmart
          </h1>
          <h2 className="mt-6 text-center text-2xl font-semibold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your invite code to get started
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Invite Code */}
            <div>
              <label htmlFor="invite_code" className="block text-sm font-medium text-gray-700">
                Invite Code
              </label>
              <Input
                id="invite_code"
                {...register('invite_code')}
                className="mt-1"
                placeholder="Enter your invite code"
              />
              {errors.invite_code && (
                <p className="mt-1 text-sm text-red-600">{errors.invite_code.message}</p>
              )}
              {isValidating && (
                <p className="mt-1 text-sm text-gray-500">Validating...</p>
              )}
              {inviteInfo && (
                <div className={`mt-2 p-3 rounded-md text-sm ${
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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                className="mt-1"
                placeholder="you@example.com"
                disabled={!!inviteInfo?.email}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Names */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                  First name
                </label>
                <Input
                  id="first_name"
                  {...register('first_name')}
                  className="mt-1"
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                  Last name
                </label>
                <Input
                  id="last_name"
                  {...register('last_name')}
                  className="mt-1"
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                className="mt-1"
                placeholder="At least 8 characters"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <Input
                id="confirm_password"
                type="password"
                {...register('confirm_password')}
                className="mt-1"
              />
              {errors.confirm_password && (
                <p className="mt-1 text-sm text-red-600">{errors.confirm_password.message}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !inviteInfo?.is_valid}
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-600 hover:text-primary-500 font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
