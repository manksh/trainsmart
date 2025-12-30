'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import {
  MPADimension,
  getCategoryDisplayName,
  getCategoryColorClasses,
} from '@/lib/mpaDefinitions'

interface DimensionInfoModalProps {
  dimension: MPADimension | null
  isOpen: boolean
  onClose: () => void
}

export function DimensionInfoModal({ dimension, isOpen, onClose }: DimensionInfoModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !dimension) return null

  const categoryColors = getCategoryColorClasses(dimension.category)

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
      onClick={onClose}
    >
      {/* Modal content - bottom sheet on mobile, centered on desktop */}
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-auto animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar for mobile */}
        <div className="sm:hidden flex justify-center pt-3">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{dimension.name}</h3>
              <span
                className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${categoryColors.bg} ${categoryColors.text}`}
              >
                {getCategoryDisplayName(dimension.category)}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Description */}
          <p className="text-gray-600 mb-5 leading-relaxed">{dimension.description}</p>

          {/* Aspects Measured */}
          <div className="mb-5">
            <h4 className="font-medium text-sm text-gray-900 mb-2">Aspects Measured</h4>
            <ul className="space-y-1.5">
              {dimension.aspectsMeasured.map((aspect, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-gray-400 mt-1">•</span>
                  <span>{aspect}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Example Item */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-medium text-sm text-gray-900 mb-1">Example Question</h4>
            <p className="text-sm text-gray-600 italic">&ldquo;{dimension.exampleItem}&rdquo;</p>
          </div>
        </div>
      </div>
    </div>
  )
}
