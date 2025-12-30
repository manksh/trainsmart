'use client'

import { useState } from 'react'
import { FlowProps } from '../types'
import { journalColors } from '../colors'
import { journalIcons } from '../icons'

/**
 * OpenEndedFlow - Single-page free write journal
 *
 * This flow is intentionally different from the multi-step flows.
 * It's a single page with optional prompt selection and tags.
 */
export function OpenEndedFlow({ config, onSave, onCancel, isSaving }: FlowProps) {
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [promptUsed, setPromptUsed] = useState<string | null>(null)
  const [showPrompts, setShowPrompts] = useState(false)

  const colors = journalColors.open_ended
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

  const handleSave = () => {
    onSave({
      journal_type: 'open_ended',
      content: content,
      tags: tags.length > 0 ? tags : null,
      prompt_used: promptUsed,
    })
  }

  const canSave = content.trim().length > 0

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${colors.gradient}`}>
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={onCancel} className="p-2 hover:bg-white/50 rounded-lg">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className={colors.text}>{journalIcons.pencil}</div>
            <h1 className="text-xl font-bold text-gray-900">Free Write</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              canSave && !isSaving
                ? `${colors.buttonBg} text-white ${colors.buttonHover}`
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* Prompt Selector */}
        <div className="mb-4">
          <button
            onClick={() => setShowPrompts(!showPrompts)}
            className={`text-sm ${colors.text} hover:opacity-80 flex items-center gap-1`}
          >
            <svg className={`w-4 h-4 transition-transform ${showPrompts ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {promptUsed ? 'Change prompt' : 'Need a prompt?'}
          </button>

          {showPrompts && (
            <div className="mt-2 p-3 bg-white rounded-xl border border-gray-200 max-h-48 overflow-y-auto">
              <div className="space-y-2">
                {config.open_ended_prompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setPromptUsed(prompt)
                      setShowPrompts(false)
                    }}
                    className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                      promptUsed === prompt
                        ? `${colors.bg} ${colors.text}`
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {promptUsed && !showPrompts && (
            <div className={`mt-2 p-3 rounded-xl ${colors.bg} border ${colors.border}`}>
              <p className="text-sm text-gray-600 italic">{promptUsed}</p>
            </div>
          )}
        </div>

        {/* Text Area */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className={`w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${colors.ring} resize-none h-64 text-gray-800`}
          autoFocus
        />

        {/* Word Count */}
        <div className="flex justify-end mt-2">
          <span className="text-xs text-gray-400">{wordCount} words</span>
        </div>

        {/* Tags */}
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Tags (optional)</p>
          <div className="flex flex-wrap gap-2">
            {config.open_ended_tags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  tags.includes(tag)
                    ? `${colors.bg} ${colors.text} ${colors.border}`
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
