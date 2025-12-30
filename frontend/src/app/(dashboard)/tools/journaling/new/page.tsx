'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiGet, apiPost } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import {
  AffirmationsFlow,
  DailyWinsFlow,
  GratitudeFlow,
  IKnowFlow,
  OpenEndedFlow,
  JournalConfig,
} from '@/components/journaling'

// User type for full user data
interface FullUser {
  id: string
  email: string
  memberships: {
    organization_id: string
    organization_name: string
    role: string
  }[]
}

// Inner component that uses useSearchParams
function NewJournalEntryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: authLoading } = useAuth()
  const journalType = searchParams.get('type')

  const [config, setConfig] = useState<JournalConfig | null>(null)
  const [fullUser, setFullUser] = useState<FullUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      try {
        const [configData, userData] = await Promise.all([
          apiGet<JournalConfig>('/journals/config'),
          apiGet<FullUser>('/users/me/full'),
        ])
        setConfig(configData)
        setFullUser(userData)
      } catch (err) {
        console.error('Failed to load data:', err)
        setError('Failed to load journal configuration')
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading && user) {
      loadData()
    }
  }, [user, authLoading])

  const handleSave = async (data: Record<string, unknown>) => {
    if (!fullUser?.memberships?.[0]) {
      setError('No organization found')
      return
    }

    setIsSaving(true)
    try {
      await apiPost('/journals', {
        ...data,
        organization_id: fullUser.memberships[0].organization_id,
      })
      router.push('/tools/journaling')
    } catch (err) {
      console.error('Failed to save entry:', err)
      setError('Failed to save journal entry')
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    router.push('/tools/journaling')
  }

  if (authLoading || isLoading || !config) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-lg mx-auto px-4 py-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/tools/journaling')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // Common props for all flows
  const flowProps = {
    config,
    onSave: handleSave,
    onCancel: handleCancel,
    isSaving,
  }

  // Render appropriate flow based on journal type
  switch (journalType) {
    case 'affirmations':
      return <AffirmationsFlow {...flowProps} />
    case 'daily_wins':
      return <DailyWinsFlow {...flowProps} />
    case 'gratitude':
      return <GratitudeFlow {...flowProps} />
    case 'open_ended':
      return <OpenEndedFlow {...flowProps} />
    case 'i_know':
      return <IKnowFlow {...flowProps} />
    default:
      // Invalid type, redirect back
      router.push('/tools/journaling')
      return null
  }
}

// Main Page Component with Suspense wrapper
export default function NewJournalEntryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    }>
      <NewJournalEntryContent />
    </Suspense>
  )
}
