import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility function', () => {
  it('merges class names correctly', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('handles conditional classes', () => {
    expect(cn('base', true && 'active', false && 'inactive')).toBe('base active')
  })

  it('handles array of classes', () => {
    expect(cn(['px-2', 'py-1'])).toBe('px-2 py-1')
  })

  it('overrides conflicting Tailwind classes', () => {
    // twMerge should keep the last conflicting class
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles empty inputs', () => {
    expect(cn()).toBe('')
    expect(cn('')).toBe('')
    expect(cn(null, undefined)).toBe('')
  })

  it('handles mixed inputs', () => {
    expect(cn('base', { active: true, disabled: false }, ['extra'])).toBe(
      'base active extra'
    )
  })
})
