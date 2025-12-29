'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiGet, apiPatch } from '@/lib/api'
import { ScreenHeader } from '@/components/training/shared'
import { ScreenRenderer } from '@/components/training/screens'
import {
  Activity,
  Screen,
  SequentialModuleContent,
  ScreenResponse,
  SequentialProgressData,
} from '@/components/training/types'

interface ModuleData {
  id: string
  slug: string
  name: string
  color: string
  content: SequentialModuleContent
}

interface ModuleProgress {
  id: string
  progress_data: SequentialProgressData
  is_completed: boolean
  is_started: boolean
}

export default function ActivityPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const activityId = params.activityId as string

  const [module, setModule] = useState<ModuleData | null>(null)
  const [progress, setProgress] = useState<ModuleProgress | null>(null)
  const [activity, setActivity] = useState<Activity | null>(null)
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [moduleData, progressData] = await Promise.all([
          apiGet<ModuleData>(`/training-modules/${slug}`),
          apiGet<ModuleProgress | null>(`/training-modules/progress/me/${slug}`).catch(() => null),
        ])

        setModule(moduleData)
        setProgress(progressData)

        // Find the activity
        const content = moduleData.content as SequentialModuleContent
        const foundActivity = content.activities?.find((a) => a.id === activityId)
        setActivity(foundActivity || null)

        // Resume to saved screen position if available
        if (progressData?.progress_data?.current_activity === activityId) {
          const savedScreen = progressData.progress_data.current_screen || 0
          setCurrentScreenIndex(savedScreen)
        }
      } catch (err) {
        console.error('Failed to load activity:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [slug, activityId])

  const currentScreen: Screen | null = activity?.screens?.[currentScreenIndex] || null
  const totalScreens = activity?.screens?.length || 0
  const isLastScreen = currentScreenIndex >= totalScreens - 1

  const saveProgress = useCallback(
    async (screenResponse?: ScreenResponse) => {
      if (!progress?.id || !currentScreen) return

      setIsSaving(true)
      try {
        const updatedProgressData: Partial<SequentialProgressData> = {
          current_activity: activityId,
          current_screen: currentScreenIndex,
        }

        // Save screen response if provided
        if (screenResponse) {
          updatedProgressData.screen_responses = {
            ...progress.progress_data?.screen_responses,
            [currentScreen.id]: screenResponse,
          }
        }

        // Optimistic update: update local state immediately so next screen has access
        // This is critical for ConditionalContent which needs previous screen responses
        setProgress((prev) =>
          prev
            ? {
                ...prev,
                progress_data: {
                  ...prev.progress_data,
                  ...updatedProgressData,
                },
              }
            : null
        )

        // Then persist to server (fire and forget for responsiveness)
        await apiPatch(`/training-modules/progress/${progress.id}`, {
          progress_data: {
            ...progress.progress_data,
            ...updatedProgressData,
          },
        })
      } catch (err) {
        console.error('Failed to save progress:', err)
      } finally {
        setIsSaving(false)
      }
    },
    [progress, currentScreen, activityId, currentScreenIndex]
  )

  const handleSaveResponse = useCallback(
    (response: ScreenResponse) => {
      saveProgress(response)
    },
    [saveProgress]
  )

  const handleContinue = useCallback(async () => {
    if (isLastScreen) {
      // Activity complete - mark activity as completed
      if (progress?.id) {
        try {
          // Build the new activities_completed array, ensuring no duplicates
          const existingCompleted = progress.progress_data?.activities_completed || []
          const activitiesCompleted = existingCompleted.includes(activityId)
            ? existingCompleted
            : [...existingCompleted, activityId]

          // Save the completion - wait for it to finish before navigating
          const response = await apiPatch<{ progress_data: SequentialProgressData }>(
            `/training-modules/progress/${progress.id}`,
            {
              progress_data: {
                ...progress.progress_data,
                activities_completed: activitiesCompleted,
                current_activity: null, // Clear current activity since we're done
                current_screen: 0,
              },
            }
          )

          // Verify the save was successful by checking the response
          if (!response?.progress_data?.activities_completed?.includes(activityId)) {
            console.error('Activity completion may not have been saved correctly')
          }

          // Check if this was the last activity
          const content = module?.content as SequentialModuleContent
          const allActivities = content?.activities || []
          const isModuleComplete = allActivities.every((a) =>
            activitiesCompleted.includes(a.id)
          )

          if (isModuleComplete) {
            // Complete the module
            await fetch(
              `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/training-modules/progress/${progress.id}/complete`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
              }
            )
          }

          // Navigate back to module overview after successful save
          router.push(`/train/${slug}`)
        } catch (err) {
          console.error('Failed to complete activity:', err)
          // Still navigate even on error, but user might see stale state
          router.push(`/train/${slug}`)
        }
      } else {
        // No progress record, just navigate
        router.push(`/train/${slug}`)
      }
    } else {
      // Move to next screen
      const nextIndex = currentScreenIndex + 1
      setCurrentScreenIndex(nextIndex)

      // Save position
      if (progress?.id) {
        try {
          await apiPatch(`/training-modules/progress/${progress.id}`, {
            progress_data: {
              ...progress.progress_data,
              current_activity: activityId,
              current_screen: nextIndex,
            },
          })
        } catch (err) {
          console.error('Failed to save screen position:', err)
        }
      }
    }
  }, [isLastScreen, progress, activityId, currentScreenIndex, module, router, slug])

  const handleBack = useCallback(() => {
    if (currentScreenIndex > 0) {
      setCurrentScreenIndex((prev) => prev - 1)
    } else {
      // Show exit confirmation on first screen
      setShowExitConfirm(true)
    }
  }, [currentScreenIndex])

  const handleExit = useCallback(() => {
    setShowExitConfirm(true)
  }, [])

  const handleConfirmExit = useCallback(() => {
    router.push(`/train/${slug}`)
  }, [router, slug])

  const handleCancelExit = useCallback(() => {
    setShowExitConfirm(false)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-2 bg-gray-200 rounded w-full"></div>
            <div className="h-32 bg-gray-100 rounded-xl mt-8"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!module || !activity || !currentScreen) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 py-8 text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Activity not found</h1>
          <button
            onClick={() => router.push(`/train/${slug}`)}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            Back to Module
          </button>
        </div>
      </div>
    )
  }

  const savedResponse = progress?.progress_data?.screen_responses?.[currentScreen.id]

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <ScreenHeader
        currentScreen={currentScreenIndex}
        totalScreens={totalScreens}
        onBack={handleBack}
        onExit={handleExit}
        activityName={activity.name}
        moduleColor={module.color}
      />

      <div className="flex-1">
        <ScreenRenderer
          screen={currentScreen}
          onContinue={handleContinue}
          onSaveResponse={handleSaveResponse}
          savedResponse={savedResponse}
          moduleColor={module.color}
          allScreenResponses={progress?.progress_data?.screen_responses}
        />
      </div>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Exit activity?</h3>
            <p className="text-gray-600 mb-6">
              Your progress has been saved. You can resume where you left off anytime.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelExit}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
              >
                Stay
              </button>
              <button
                onClick={handleConfirmExit}
                className="flex-1 py-3 px-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
