'use client'

import { useRouter } from 'next/navigation'

export default function JournalingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => router.push('/athlete')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to dashboard
        </button>

        {/* Placeholder Content */}
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Journaling
          </h1>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            The journaling tool is coming soon. You'll be able to reflect on your
            performance, process thoughts, and track your mental growth.
          </p>

          {/* Coming Soon Features */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-4">What You'll Be Able To Do</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="bg-purple-100 text-purple-600 p-1.5 rounded-lg mt-0.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Pre-Performance Journaling</p>
                  <p className="text-sm text-gray-500">Set intentions and prepare mentally</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-purple-100 text-purple-600 p-1.5 rounded-lg mt-0.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Post-Performance Reflection</p>
                  <p className="text-sm text-gray-500">Analyze what went well and what to improve</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-purple-100 text-purple-600 p-1.5 rounded-lg mt-0.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Gratitude Practice</p>
                  <p className="text-sm text-gray-500">Build a positive mindset through appreciation</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-purple-100 text-purple-600 p-1.5 rounded-lg mt-0.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Free Writing</p>
                  <p className="text-sm text-gray-500">Process thoughts without judgment</p>
                </div>
              </li>
            </ul>
          </div>

          <p className="text-sm text-gray-400 mt-8">
            Check back soon for updates
          </p>
        </div>
      </div>
    </div>
  )
}
