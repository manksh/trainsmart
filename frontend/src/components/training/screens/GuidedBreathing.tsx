'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { GuidedBreathingContent, ScreenComponentProps } from '../types'
import { getModuleColors } from '@/lib/colors'

interface GuidedBreathingProps extends ScreenComponentProps {
  content: GuidedBreathingContent
}

type BreathPhase = 'ready' | 'inhale' | 'hold' | 'exhale' | 'complete'

const PHASE_LABELS: Record<BreathPhase, string> = {
  ready: 'Get Ready',
  inhale: 'Breathe In',
  hold: 'Hold',
  exhale: 'Breathe Out',
  complete: 'Complete',
}

/**
 * Creates an AudioContext and plays a gentle tone for phase transitions
 */
function playTransitionTone(frequency: number = 440, duration: number = 150) {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return

    const audioContext = new AudioContextClass()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)

    // Gentle fade in/out
    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.02)
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration / 1000)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + duration / 1000)

    // Clean up
    setTimeout(() => {
      audioContext.close()
    }, duration + 100)
  } catch {
    // Audio not supported or blocked, fail silently
  }
}

/**
 * GuidedBreathing - Guided breathing exercise component for training modules
 *
 * Provides a visual breathing guide with optional audio cues.
 * Design decisions:
 * - Skippable in MVP
 * - Uses Tailwind transitions
 * - Optional Web Audio API for gentle phase transition tones
 */
export default function GuidedBreathing({
  content,
  onContinue,
  onSaveResponse,
  savedResponse,
  moduleColor,
}: GuidedBreathingProps) {
  const [phase, setPhase] = useState<BreathPhase>('ready')
  const [currentCycle, setCurrentCycle] = useState(0)
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(
    savedResponse?.breathing_completed || false
  )
  const [wasSkipped, setWasSkipped] = useState(
    savedResponse?.breathing_skipped || false
  )

  const shouldStopRef = useRef(false)
  const colors = getModuleColors(moduleColor)

  // Get phase durations
  const { inhale_seconds, hold_seconds = 0, exhale_seconds } = content.timing
  const totalCycles = content.cycles

  // Calculate animation scale based on phase
  const getAnimationScale = useCallback(() => {
    switch (phase) {
      case 'inhale':
        return 1.4
      case 'hold':
        return 1.4
      case 'exhale':
        return 1
      default:
        return 1
    }
  }, [phase])

  // Run the breathing exercise
  const runExercise = useCallback(async () => {
    shouldStopRef.current = false
    setIsRunning(true)

    const playTone = content.audio_enabled !== false

    for (let cycle = 1; cycle <= totalCycles; cycle++) {
      if (shouldStopRef.current) break
      setCurrentCycle(cycle)

      // Inhale phase
      if (playTone) playTransitionTone(440, 150)
      setPhase('inhale')
      for (let t = inhale_seconds; t > 0; t--) {
        if (shouldStopRef.current) break
        setPhaseTimeLeft(t)
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      // Hold phase (if configured)
      if (hold_seconds > 0 && !shouldStopRef.current) {
        if (playTone) playTransitionTone(523, 150)
        setPhase('hold')
        for (let t = hold_seconds; t > 0; t--) {
          if (shouldStopRef.current) break
          setPhaseTimeLeft(t)
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }

      // Exhale phase
      if (!shouldStopRef.current) {
        if (playTone) playTransitionTone(392, 150)
        setPhase('exhale')
        for (let t = exhale_seconds; t > 0; t--) {
          if (shouldStopRef.current) break
          setPhaseTimeLeft(t)
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }
    }

    if (!shouldStopRef.current) {
      if (playTone) playTransitionTone(523, 300)
      setPhase('complete')
      setIsComplete(true)
      setIsRunning(false)
      onSaveResponse({
        breathing_completed: true,
        cycles_completed: totalCycles,
        breathing_skipped: false,
      })
    }
  }, [inhale_seconds, hold_seconds, exhale_seconds, totalCycles, content.audio_enabled, onSaveResponse])

  // Handle start
  const handleStart = () => {
    setPhase('ready')
    setCurrentCycle(0)
    setTimeout(() => {
      runExercise()
    }, 500)
  }

  // Handle skip
  const handleSkip = () => {
    shouldStopRef.current = true
    setIsRunning(false)
    setIsComplete(true)
    setWasSkipped(true)
    onSaveResponse({
      breathing_completed: true,
      cycles_completed: currentCycle,
      breathing_skipped: true,
    })
  }

  // Handle keyboard
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isRunning && content.skippable) {
      handleSkip()
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldStopRef.current = true
    }
  }, [])

  // Intro screen
  if (!isRunning && !isComplete && phase === 'ready') {
    return (
      <div className="flex flex-col min-h-[calc(100vh-180px)] px-4 py-8">
        <div className="flex-1 flex flex-col justify-center items-center text-center">
          <div
            className={`w-24 h-24 ${colors.bgLight} rounded-full flex items-center justify-center mb-6`}
          >
            <svg
              className={`w-12 h-12 ${colors.text}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {content.title}
          </h2>

          {content.instruction && (
            <p className="text-gray-600 mb-6 max-w-sm">
              {content.instruction}
            </p>
          )}

          <div className="bg-gray-50 rounded-xl p-4 mb-8 w-full max-w-xs">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className={`text-2xl font-bold ${colors.text}`}>
                  {inhale_seconds}s
                </p>
                <p className="text-xs text-gray-500">Inhale</p>
              </div>
              {hold_seconds > 0 && (
                <div>
                  <p className={`text-2xl font-bold ${colors.text}`}>
                    {hold_seconds}s
                  </p>
                  <p className="text-xs text-gray-500">Hold</p>
                </div>
              )}
              <div>
                <p className={`text-2xl font-bold ${colors.text}`}>
                  {exhale_seconds}s
                </p>
                <p className="text-xs text-gray-500">Exhale</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                {totalCycles} cycles
              </p>
            </div>
          </div>

          <button
            onClick={handleStart}
            className={`px-8 py-4 ${colors.bg} text-white font-semibold rounded-xl hover:opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors.focusRing}`}
          >
            Begin Breathing
          </button>
        </div>
      </div>
    )
  }

  // Complete screen
  if (isComplete) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-180px)] px-4 py-8">
        <div className="flex-1 flex flex-col justify-center items-center text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {wasSkipped ? 'Exercise Skipped' : 'Great Work!'}
          </h2>

          <p className="text-gray-600 mb-8">
            {wasSkipped
              ? `You completed ${currentCycle} of ${totalCycles} cycles.`
              : 'You completed the breathing exercise. Notice how your body feels.'}
          </p>
        </div>

        <div className="mt-8">
          <button
            onClick={onContinue}
            className={`w-full ${colors.bg} text-white font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors.focusRing}`}
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  // Active exercise screen
  return (
    <div
      className="flex flex-col min-h-[calc(100vh-180px)] px-4 py-8"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Breathing exercise in progress"
    >
      <div className="flex-1 flex flex-col justify-center items-center">
        {/* Breathing circle */}
        <div className="relative mb-8">
          <div
            className={`w-48 h-48 rounded-full ${colors.bgLight} flex items-center justify-center transition-transform duration-1000 ease-in-out`}
            style={{ transform: `scale(${getAnimationScale()})` }}
            aria-hidden="true"
          >
            <div className="w-40 h-40 rounded-full bg-white flex flex-col items-center justify-center shadow-inner">
              <span className={`text-4xl font-bold ${colors.text}`}>
                {phaseTimeLeft}
              </span>
              <span className="text-gray-600 text-lg">
                {PHASE_LABELS[phase]}
              </span>
            </div>
          </div>
        </div>

        {/* Cycle indicator */}
        <div className="text-center mb-8">
          <p className="text-gray-600 mb-2">
            Cycle {currentCycle} of {totalCycles}
          </p>
          <div className="flex justify-center gap-2" aria-label={`Progress: ${currentCycle} of ${totalCycles} cycles`}>
            {Array.from({ length: totalCycles }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-colors ${
                  i < currentCycle ? colors.bg : 'bg-gray-200'
                }`}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>

        {/* Skip button (if skippable) */}
        {content.skippable && (
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 text-sm transition-colors focus:outline-none focus:underline"
            aria-label="Skip breathing exercise"
          >
            Skip exercise
          </button>
        )}
      </div>

      {/* Screen reader announcements */}
      <div className="sr-only" role="status" aria-live="polite">
        {PHASE_LABELS[phase]}, {phaseTimeLeft} seconds remaining.
        Cycle {currentCycle} of {totalCycles}.
      </div>
    </div>
  )
}
