/**
 * Tests for ScoreBar component.
 *
 * This component displays a horizontal progress bar with a score value.
 * Tests cover:
 * - Percentage width calculation
 * - Default color scheme thresholds (green/yellow/orange)
 * - Purple color scheme thresholds
 * - Score display formatting
 * - Custom maxScore handling
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScoreBar } from './ScoreBar'

describe('ScoreBar', () => {
  // ===========================================================================
  // Basic Rendering Tests
  // ===========================================================================

  describe('basic rendering', () => {
    it('renders the score bar container', () => {
      render(<ScoreBar score={5} />)

      // The outer container should exist
      const container = document.querySelector('.flex.items-center.gap-2')
      expect(container).toBeInTheDocument()
    })

    it('renders the background track', () => {
      render(<ScoreBar score={5} />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      expect(track).toBeInTheDocument()
    })

    it('renders the progress bar fill', () => {
      render(<ScoreBar score={5} />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')
      expect(fill).toBeInTheDocument()
      expect(fill).toHaveClass('h-full')
    })

    it('displays the formatted score value', () => {
      render(<ScoreBar score={5.5} />)

      expect(screen.getByText('5.5')).toBeInTheDocument()
    })

    it('formats score to one decimal place', () => {
      render(<ScoreBar score={5.123} />)

      expect(screen.getByText('5.1')).toBeInTheDocument()
    })

    it('formats whole numbers with decimal', () => {
      render(<ScoreBar score={5} />)

      expect(screen.getByText('5.0')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Percentage Width Calculation Tests
  // ===========================================================================

  describe('percentage width calculation', () => {
    it('calculates correct percentage with default maxScore of 7', () => {
      render(<ScoreBar score={3.5} />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      // 3.5 / 7 = 50%
      expect(fill).toHaveStyle({ width: '50%' })
    })

    it('calculates 100% for full score', () => {
      render(<ScoreBar score={7} />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      expect(fill).toHaveStyle({ width: '100%' })
    })

    it('calculates 0% for zero score', () => {
      render(<ScoreBar score={0} />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      expect(fill).toHaveStyle({ width: '0%' })
    })

    it('uses custom maxScore for percentage calculation', () => {
      render(<ScoreBar score={5} maxScore={10} />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      // 5 / 10 = 50%
      expect(fill).toHaveStyle({ width: '50%' })
    })

    it('handles decimal percentages correctly', () => {
      render(<ScoreBar score={1} maxScore={7} />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      // 1 / 7 = 14.285714...%
      const expectedPercentage = (1 / 7) * 100
      expect(fill).toHaveStyle({ width: `${expectedPercentage}%` })
    })
  })

  // ===========================================================================
  // Default Color Scheme Tests (green/yellow/orange)
  // ===========================================================================

  describe('default color scheme', () => {
    it('applies green color for score >= 70% (4.9/7)', () => {
      render(<ScoreBar score={4.9} />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      // 4.9 / 7 = 70%
      expect(fill).toHaveClass('bg-green-500')
    })

    it('applies green color for score > 70%', () => {
      render(<ScoreBar score={6} />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      // 6 / 7 = 85.7%
      expect(fill).toHaveClass('bg-green-500')
    })

    it('applies yellow color for score >= 50% and < 70%', () => {
      render(<ScoreBar score={4} />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      // 4 / 7 = 57.1%
      expect(fill).toHaveClass('bg-yellow-500')
    })

    it('applies yellow color at exactly 50% boundary (3.5/7)', () => {
      render(<ScoreBar score={3.5} />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      // 3.5 / 7 = 50%
      expect(fill).toHaveClass('bg-yellow-500')
    })

    it('applies orange color for score < 50%', () => {
      render(<ScoreBar score={3} />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      // 3 / 7 = 42.8%
      expect(fill).toHaveClass('bg-orange-500')
    })

    it('applies orange color for very low scores', () => {
      render(<ScoreBar score={1} />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      // 1 / 7 = 14.3%
      expect(fill).toHaveClass('bg-orange-500')
    })

    it('applies orange color for zero score', () => {
      render(<ScoreBar score={0} />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      expect(fill).toHaveClass('bg-orange-500')
    })

    it('applies green color for maximum score', () => {
      render(<ScoreBar score={7} />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      expect(fill).toHaveClass('bg-green-500')
    })
  })

  // ===========================================================================
  // Purple Color Scheme Tests
  // ===========================================================================

  describe('purple color scheme', () => {
    it('applies purple-500 for score >= 70%', () => {
      render(<ScoreBar score={5} colorScheme="purple" />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      // 5 / 7 = 71.4%
      expect(fill).toHaveClass('bg-purple-500')
    })

    it('applies purple-500 at exactly 70% boundary', () => {
      render(<ScoreBar score={4.9} colorScheme="purple" />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      // 4.9 / 7 = 70%
      expect(fill).toHaveClass('bg-purple-500')
    })

    it('applies purple-400 for score >= 50% and < 70%', () => {
      render(<ScoreBar score={4} colorScheme="purple" />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      // 4 / 7 = 57.1%
      expect(fill).toHaveClass('bg-purple-400')
    })

    it('applies purple-400 at exactly 50% boundary', () => {
      render(<ScoreBar score={3.5} colorScheme="purple" />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      // 3.5 / 7 = 50%
      expect(fill).toHaveClass('bg-purple-400')
    })

    it('applies purple-300 for score < 50%', () => {
      render(<ScoreBar score={3} colorScheme="purple" />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      // 3 / 7 = 42.8%
      expect(fill).toHaveClass('bg-purple-300')
    })

    it('applies purple-300 for very low scores', () => {
      render(<ScoreBar score={1} colorScheme="purple" />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      expect(fill).toHaveClass('bg-purple-300')
    })

    it('applies purple-300 for zero score', () => {
      render(<ScoreBar score={0} colorScheme="purple" />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      expect(fill).toHaveClass('bg-purple-300')
    })

    it('applies purple-500 for maximum score', () => {
      render(<ScoreBar score={7} colorScheme="purple" />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      expect(fill).toHaveClass('bg-purple-500')
    })
  })

  // ===========================================================================
  // Color Scheme Default Behavior Tests
  // ===========================================================================

  describe('color scheme defaults', () => {
    it('uses default color scheme when not specified', () => {
      render(<ScoreBar score={5} />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      // Should use green (default scheme) not purple
      expect(fill).toHaveClass('bg-green-500')
      expect(fill).not.toHaveClass('bg-purple-500')
    })

    it('explicitly uses default color scheme', () => {
      render(<ScoreBar score={5} colorScheme="default" />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      expect(fill).toHaveClass('bg-green-500')
    })
  })

  // ===========================================================================
  // Custom maxScore Tests
  // ===========================================================================

  describe('custom maxScore', () => {
    it('uses default maxScore of 7', () => {
      render(<ScoreBar score={7} />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      expect(fill).toHaveStyle({ width: '100%' })
    })

    it('handles maxScore of 10', () => {
      render(<ScoreBar score={7} maxScore={10} />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      // 7 / 10 = 70%
      expect(fill).toHaveStyle({ width: '70%' })
      expect(fill).toHaveClass('bg-green-500')
    })

    it('handles maxScore of 100', () => {
      render(<ScoreBar score={75} maxScore={100} />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      // 75 / 100 = 75%
      expect(fill).toHaveStyle({ width: '75%' })
      expect(fill).toHaveClass('bg-green-500')
    })

    it('handles small maxScore', () => {
      render(<ScoreBar score={1} maxScore={2} />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      // 1 / 2 = 50%
      expect(fill).toHaveStyle({ width: '50%' })
      expect(fill).toHaveClass('bg-yellow-500')
    })
  })

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('edge cases', () => {
    it('handles score exactly at 70% threshold boundary', () => {
      // For maxScore 7, 70% = 4.9
      render(<ScoreBar score={4.9} />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      expect(fill).toHaveClass('bg-green-500')
    })

    it('handles score just below 70% threshold', () => {
      // For maxScore 7, just below 70% = 4.89
      render(<ScoreBar score={4.89} />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      // 4.89 / 7 = 69.857% < 70%
      expect(fill).toHaveClass('bg-yellow-500')
    })

    it('handles score just below 50% threshold', () => {
      // For maxScore 7, just below 50% = 3.49
      render(<ScoreBar score={3.49} />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      // 3.49 / 7 = 49.857% < 50%
      expect(fill).toHaveClass('bg-orange-500')
    })

    it('handles negative score gracefully', () => {
      render(<ScoreBar score={-1} />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      // Should render without crashing
      expect(fill).toBeInTheDocument()
      expect(screen.getByText('-1.0')).toBeInTheDocument()
    })

    it('handles score exceeding maxScore', () => {
      render(<ScoreBar score={10} maxScore={7} />)

      const track = document.querySelector('.bg-gray-200.rounded-full')
      const fill = track?.querySelector('div')

      // 10 / 7 = 142.8%
      const expectedPercentage = (10 / 7) * 100
      expect(fill).toHaveStyle({ width: `${expectedPercentage}%` })
      expect(fill).toHaveClass('bg-green-500')
    })

    it('handles very small decimal scores', () => {
      render(<ScoreBar score={0.001} />)

      expect(screen.getByText('0.0')).toBeInTheDocument()
    })
  })
})
