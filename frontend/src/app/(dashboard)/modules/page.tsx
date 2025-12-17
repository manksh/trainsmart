'use client'

import { useRouter } from 'next/navigation'

export default function ModulesPage() {
  const router = useRouter()

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
      {/* Back button */}
      <button
        onClick={() => router.push('/athlete')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to home
      </button>

      {/* Placeholder Content */}
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Training Modules
        </h1>
        <p className="text-gray-500 max-w-md mx-auto mb-8">
          Structured mental performance training modules are coming soon.
          You'll be able to develop specific skills through guided lessons and exercises.
        </p>

        {/* Coming Soon Features */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-md mx-auto text-left">
          <h3 className="font-semibold text-gray-900 mb-4">What's Coming</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="bg-amber-100 text-amber-600 p-1.5 rounded-lg mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Confidence Building</p>
                <p className="text-sm text-gray-500">Build unshakeable self-belief</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Focus & Attention</p>
                <p className="text-sm text-gray-500">Sharpen your concentration</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="bg-rose-100 text-rose-600 p-1.5 rounded-lg mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Stress Management</p>
                <p className="text-sm text-gray-500">Perform under pressure</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="bg-green-100 text-green-600 p-1.5 rounded-lg mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Resilience</p>
                <p className="text-sm text-gray-500">Bounce back from setbacks</p>
              </div>
            </li>
          </ul>
        </div>

        <p className="text-sm text-gray-400 mt-8">
          Check back soon for updates
        </p>
      </div>
    </main>
  )
}
