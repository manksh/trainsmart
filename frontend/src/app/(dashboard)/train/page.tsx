'use client'

import { useRouter } from 'next/navigation'

interface TrainItem {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  bgColor: string
  route: string
  isPlaceholder?: boolean
  badge?: string
}

const TOOLS: TrainItem[] = [
  {
    id: 'breathing',
    title: 'Breathing Exercises',
    description: 'Energize, relax, or focus with guided breathing techniques designed for athletes.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    route: '/tools/breathing',
  },
  {
    id: 'journaling',
    title: 'Journaling',
    description: 'Reflect on your performance and process thoughts through guided prompts.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    route: '/tools/journaling',
    isPlaceholder: true,
    badge: 'Coming soon',
  },
]

const MODULES: TrainItem[] = [
  {
    id: 'confidence-building',
    title: 'Building Confidence',
    description: 'Learn techniques to build and maintain confidence in high-pressure situations.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    route: '/modules/confidence',
    isPlaceholder: true,
    badge: 'Coming soon',
  },
  {
    id: 'focus-attention',
    title: 'Focus & Attention',
    description: 'Train your ability to maintain focus and redirect attention when distracted.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    route: '/modules/focus',
    isPlaceholder: true,
    badge: 'Coming soon',
  },
  {
    id: 'stress-management',
    title: 'Stress Management',
    description: 'Develop strategies to manage competitive stress and perform under pressure.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
    route: '/modules/stress',
    isPlaceholder: true,
    badge: 'Coming soon',
  },
]

function TrainCard({ item, onSelect }: { item: TrainItem; onSelect: (route: string) => void }) {
  return (
    <button
      onClick={() => !item.isPlaceholder && onSelect(item.route)}
      disabled={item.isPlaceholder}
      className={`w-full bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-left transition-all ${
        item.isPlaceholder
          ? 'opacity-60 cursor-not-allowed'
          : 'hover:shadow-md hover:border-gray-300'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`${item.bgColor} ${item.color} p-3 rounded-xl`}>
          {item.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{item.title}</h3>
            {item.badge && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{item.description}</p>
        </div>
        {!item.isPlaceholder && (
          <svg className="w-5 h-5 text-gray-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </button>
  )
}

export default function TrainPage() {
  const router = useRouter()

  const handleSelect = (route: string) => {
    router.push(route)
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Train</h1>
        <p className="text-gray-500">
          Build mental skills through tools and structured training modules.
        </p>
      </div>

      {/* Tools Section */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Tools</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Quick exercises you can use anytime to optimize your mental state.
        </p>
        <div className="space-y-3">
          {TOOLS.map((tool) => (
            <TrainCard key={tool.id} item={tool} onSelect={handleSelect} />
          ))}
        </div>
      </section>

      {/* Modules Section */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Training Modules</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Structured lessons and exercises to develop specific mental skills.
        </p>
        <div className="space-y-3">
          {MODULES.map((module) => (
            <TrainCard key={module.id} item={module} onSelect={handleSelect} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <p className="text-center text-sm text-gray-400 mt-8">
        More training content is on the way
      </p>
    </main>
  )
}
