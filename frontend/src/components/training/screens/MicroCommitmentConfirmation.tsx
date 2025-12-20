'use client'

import { ScreenComponentProps, ScreenResponse } from '../types'

interface MicroCommitmentConfirmationContent {
  title: string
  encouragement: string
  message_template: string
}

interface MicroCommitmentConfirmationProps extends ScreenComponentProps {
  content: MicroCommitmentConfirmationContent
  // Access to all screen responses to get the commitment from previous screen
  allScreenResponses?: Record<string, ScreenResponse>
}

export default function MicroCommitmentConfirmation({
  content,
  onContinue,
  savedResponse,
  moduleColor,
  allScreenResponses,
}: MicroCommitmentConfirmationProps) {
  const colorClasses: Record<string, { bg: string; bgLight: string; text: string; border: string; gradient: string }> = {
    emerald: {
      bg: 'bg-emerald-600',
      bgLight: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-500',
      gradient: 'from-emerald-50 to-white',
    },
    purple: {
      bg: 'bg-purple-600',
      bgLight: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-500',
      gradient: 'from-purple-50 to-white',
    },
    blue: {
      bg: 'bg-blue-600',
      bgLight: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-500',
      gradient: 'from-blue-50 to-white',
    },
    amber: {
      bg: 'bg-amber-600',
      bgLight: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-500',
      gradient: 'from-amber-50 to-white',
    },
  }

  const colors = colorClasses[moduleColor] || colorClasses.purple

  // Try to find the commitment from the previous micro_commitment screen
  const getCommitmentText = () => {
    if (!allScreenResponses) return 'your chosen commitment'

    // Look for any screen response with a commitment_id
    for (const [screenId, response] of Object.entries(allScreenResponses)) {
      if (response.commitment_id) {
        // We found a commitment, but we need the text
        // For now, just indicate they made a commitment
        return response.commitment_id.replace('mc_', '').replace(/_/g, ' ')
      }
    }
    return 'your chosen commitment'
  }

  return (
    <div className={`flex flex-col min-h-[calc(100vh-180px)] bg-gradient-to-b ${colors.gradient}`}>
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        <div className="text-center space-y-6">
          {/* Checkmark icon */}
          <div className="flex justify-center mb-8">
            <div className={`${colors.bg} p-4 rounded-full`}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-900">{content.title}</h2>

          <div className={`${colors.bgLight} ${colors.border} border-2 rounded-xl p-6 mx-auto max-w-sm`}>
            <p className="text-gray-600 mb-2">{content.message_template}</p>
            <p className="text-lg text-gray-800 font-medium capitalize">{getCommitmentText()}</p>
          </div>

          <p className="text-gray-500 text-sm">{content.encouragement}</p>
        </div>
      </div>

      <div className="px-4 pb-8">
        <button
          onClick={onContinue}
          className={`w-full ${colors.bg} text-white font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-all`}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
