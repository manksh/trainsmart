'use client'

import { useState, useEffect } from 'react'
import { ZoneDiagramContent, ScreenComponentProps, ScreenResponse } from '../types'

interface ZoneDiagramProps extends ScreenComponentProps {
  content: ZoneDiagramContent
}

const zoneColors = {
  green: {
    fill: 'fill-green-100',
    stroke: 'stroke-green-500',
    bg: 'bg-green-100',
    border: 'border-green-500',
    text: 'text-green-700',
    ring: 'ring-green-500',
  },
  blue: {
    fill: 'fill-blue-100',
    stroke: 'stroke-blue-500',
    bg: 'bg-blue-100',
    border: 'border-blue-500',
    text: 'text-blue-700',
    ring: 'ring-blue-500',
  },
  red: {
    fill: 'fill-red-100',
    stroke: 'stroke-red-500',
    bg: 'bg-red-100',
    border: 'border-red-500',
    text: 'text-red-700',
    ring: 'ring-red-500',
  },
}

export default function ZoneDiagram({
  content,
  onContinue,
  onSaveResponse,
  savedResponse,
  moduleColor,
}: ZoneDiagramProps) {
  const [selectedZone, setSelectedZone] = useState<string | null>(
    savedResponse?.selection || null
  )
  const [showDescription, setShowDescription] = useState(false)

  const buttonColors: Record<string, string> = {
    emerald: 'bg-emerald-600',
    purple: 'bg-purple-600',
    blue: 'bg-blue-600',
  }

  const btnColor = buttonColors[moduleColor] || buttonColors.purple

  useEffect(() => {
    if (savedResponse?.selection) {
      setSelectedZone(savedResponse.selection)
      setShowDescription(true)
    }
  }, [savedResponse])

  const handleZoneClick = (zoneId: string) => {
    setSelectedZone(zoneId)
    setShowDescription(true)
  }

  const handleContinue = () => {
    if (selectedZone) {
      onSaveResponse({ selection: selectedZone })
      onContinue()
    }
  }

  const selectedZoneData = content.zones.find((z) => z.id === selectedZone)

  // Calculate circle radii (from outer to inner)
  const circleRadii = [120, 85, 50]

  return (
    <div className="flex flex-col min-h-[calc(100vh-180px)] px-4 py-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{content.title}</h2>
      <p className="text-gray-600 mb-6">{content.prompt}</p>

      <div className="flex-1 flex flex-col items-center">
        {/* Concentric circles diagram */}
        <div className="relative w-64 h-64 mb-6">
          <svg viewBox="0 0 260 260" className="w-full h-full">
            {content.zones.map((zone, index) => {
              const radius = circleRadii[index] || circleRadii[circleRadii.length - 1]
              const colors = zoneColors[zone.color]
              const isSelected = selectedZone === zone.id

              return (
                <g key={zone.id}>
                  <circle
                    cx="130"
                    cy="130"
                    r={radius}
                    className={`${colors.fill} ${colors.stroke} cursor-pointer transition-all ${
                      isSelected ? 'stroke-[4px]' : 'stroke-2'
                    }`}
                    onClick={() => handleZoneClick(zone.id)}
                  />
                  <text
                    x="130"
                    y={130 - radius + (index === 0 ? 25 : index === 1 ? 20 : 5)}
                    textAnchor="middle"
                    className={`${colors.text} text-xs font-medium fill-current pointer-events-none`}
                    style={{ fontSize: index === 2 ? '10px' : '11px' }}
                  >
                    {zone.label}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* Zone legend/buttons */}
        <div className="w-full space-y-2">
          {content.zones.map((zone) => {
            const colors = zoneColors[zone.color]
            const isSelected = selectedZone === zone.id

            return (
              <button
                key={zone.id}
                onClick={() => handleZoneClick(zone.id)}
                className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                  isSelected
                    ? `${colors.bg} ${colors.border} ${colors.ring} ring-2`
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${colors.bg} ${colors.border} border-2`} />
                  <span className={`font-medium ${isSelected ? colors.text : 'text-gray-700'}`}>
                    {zone.label}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Selected zone description */}
        {showDescription && selectedZoneData && (
          <div
            className={`w-full mt-4 p-4 rounded-xl ${zoneColors[selectedZoneData.color].bg} border ${
              zoneColors[selectedZoneData.color].border
            } animate-fade-in`}
          >
            <p className={`text-sm ${zoneColors[selectedZoneData.color].text}`}>
              {selectedZoneData.description}
            </p>
          </div>
        )}
      </div>

      {/* Continue button */}
      <div className="mt-8">
        <button
          onClick={handleContinue}
          disabled={!selectedZone}
          className={`w-full ${btnColor} text-white font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
