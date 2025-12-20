/**
 * Tests for the shared module color configuration utilities.
 *
 * These tests ensure that color configuration is correctly returned
 * for both training modules and dashboard contexts.
 */

import { describe, it, expect } from 'vitest'
import {
  MODULE_COLORS,
  DEFAULT_MODULE_COLOR,
  DASHBOARD_COLORS,
  getModuleColors,
  getDashboardColors,
  type ModuleColorName,
  type ModuleColorClasses,
  type DashboardColorConfig,
} from './colors'

describe('MODULE_COLORS constant', () => {
  it('should have all expected color names', () => {
    const expectedColors: ModuleColorName[] = ['emerald', 'purple', 'blue', 'amber', 'rose', 'cyan']
    expectedColors.forEach(color => {
      expect(MODULE_COLORS).toHaveProperty(color)
    })
  })

  it('should have exactly 6 color definitions', () => {
    expect(Object.keys(MODULE_COLORS)).toHaveLength(6)
  })

  it('should have all required properties for each color', () => {
    const requiredProperties: (keyof ModuleColorClasses)[] = [
      'bg', 'bgLight', 'text', 'border', 'ring', 'focusRing', 'gradient'
    ]

    Object.values(MODULE_COLORS).forEach(colorConfig => {
      requiredProperties.forEach(prop => {
        expect(colorConfig).toHaveProperty(prop)
        expect(typeof colorConfig[prop]).toBe('string')
        expect(colorConfig[prop].length).toBeGreaterThan(0)
      })
    })
  })

  it('should have valid Tailwind class formats for emerald', () => {
    const emerald = MODULE_COLORS.emerald
    expect(emerald.bg).toBe('bg-emerald-600')
    expect(emerald.bgLight).toBe('bg-emerald-50')
    expect(emerald.text).toBe('text-emerald-600')
    expect(emerald.border).toBe('border-emerald-500')
    expect(emerald.ring).toBe('ring-emerald-500')
    expect(emerald.focusRing).toBe('focus:ring-emerald-500')
    expect(emerald.gradient).toBe('from-emerald-50 to-white')
  })

  it('should have valid Tailwind class formats for purple', () => {
    const purple = MODULE_COLORS.purple
    expect(purple.bg).toBe('bg-purple-600')
    expect(purple.bgLight).toBe('bg-purple-50')
    expect(purple.text).toBe('text-purple-600')
    expect(purple.border).toBe('border-purple-500')
    expect(purple.ring).toBe('ring-purple-500')
    expect(purple.focusRing).toBe('focus:ring-purple-500')
    expect(purple.gradient).toBe('from-purple-50 to-white')
  })

  it('should have consistent class naming patterns', () => {
    Object.entries(MODULE_COLORS).forEach(([colorName, config]) => {
      // bg classes should contain the color name
      expect(config.bg).toContain(colorName)
      expect(config.bgLight).toContain(colorName)
      expect(config.text).toContain(colorName)
      expect(config.border).toContain(colorName)
      expect(config.ring).toContain(colorName)
      expect(config.focusRing).toContain(colorName)
      expect(config.gradient).toContain(colorName)
    })
  })
})

describe('DEFAULT_MODULE_COLOR constant', () => {
  it('should be purple', () => {
    expect(DEFAULT_MODULE_COLOR).toBe('purple')
  })

  it('should be a valid ModuleColorName', () => {
    expect(MODULE_COLORS).toHaveProperty(DEFAULT_MODULE_COLOR)
  })
})

describe('getModuleColors function', () => {
  it('should return correct colors for valid color names', () => {
    const validColors: ModuleColorName[] = ['emerald', 'purple', 'blue', 'amber', 'rose', 'cyan']

    validColors.forEach(colorName => {
      const result = getModuleColors(colorName)
      expect(result).toEqual(MODULE_COLORS[colorName])
    })
  })

  it('should return emerald colors when passed "emerald"', () => {
    const result = getModuleColors('emerald')
    expect(result.bg).toBe('bg-emerald-600')
    expect(result.text).toBe('text-emerald-600')
  })

  it('should return purple colors when passed "purple"', () => {
    const result = getModuleColors('purple')
    expect(result.bg).toBe('bg-purple-600')
    expect(result.text).toBe('text-purple-600')
  })

  it('should return default (purple) colors for invalid color names', () => {
    const invalidColors = ['invalid', 'red', 'green', 'teal', '', 'EMERALD', 'Purple']

    invalidColors.forEach(colorName => {
      const result = getModuleColors(colorName)
      expect(result).toEqual(MODULE_COLORS[DEFAULT_MODULE_COLOR])
    })
  })

  it('should return default (purple) colors for empty string', () => {
    const result = getModuleColors('')
    expect(result).toEqual(MODULE_COLORS.purple)
  })

  it('should be case-sensitive (uppercase should return default)', () => {
    const result = getModuleColors('EMERALD')
    expect(result).toEqual(MODULE_COLORS.purple)
  })

  it('should handle whitespace in color name (return default)', () => {
    const result = getModuleColors(' emerald ')
    expect(result).toEqual(MODULE_COLORS.purple)
  })

  it('should return a complete ModuleColorClasses object', () => {
    const result = getModuleColors('blue')
    expect(result).toHaveProperty('bg')
    expect(result).toHaveProperty('bgLight')
    expect(result).toHaveProperty('text')
    expect(result).toHaveProperty('border')
    expect(result).toHaveProperty('ring')
    expect(result).toHaveProperty('focusRing')
    expect(result).toHaveProperty('gradient')
  })

  it('should return the same reference for the same color', () => {
    // This tests that we're returning the object from MODULE_COLORS directly
    const result1 = getModuleColors('amber')
    const result2 = getModuleColors('amber')
    expect(result1).toBe(result2)
    expect(result1).toBe(MODULE_COLORS.amber)
  })
})

describe('DASHBOARD_COLORS constant', () => {
  it('should have all expected color names', () => {
    const expectedColors = ['emerald', 'purple', 'blue', 'amber', 'rose', 'cyan', 'pink', 'green', 'indigo']
    expectedColors.forEach(color => {
      expect(DASHBOARD_COLORS).toHaveProperty(color)
    })
  })

  it('should have 9 color definitions (more than MODULE_COLORS)', () => {
    expect(Object.keys(DASHBOARD_COLORS)).toHaveLength(9)
  })

  it('should have text and bg properties for each color', () => {
    Object.values(DASHBOARD_COLORS).forEach(colorConfig => {
      expect(colorConfig).toHaveProperty('text')
      expect(colorConfig).toHaveProperty('bg')
      expect(typeof colorConfig.text).toBe('string')
      expect(typeof colorConfig.bg).toBe('string')
    })
  })

  it('should have valid Tailwind class formats', () => {
    const emerald = DASHBOARD_COLORS.emerald
    expect(emerald.text).toBe('text-emerald-600')
    expect(emerald.bg).toBe('bg-emerald-100')

    const indigo = DASHBOARD_COLORS.indigo
    expect(indigo.text).toBe('text-indigo-600')
    expect(indigo.bg).toBe('bg-indigo-100')
  })

  it('should use -100 shade for backgrounds (lighter than MODULE_COLORS)', () => {
    Object.values(DASHBOARD_COLORS).forEach(colorConfig => {
      expect(colorConfig.bg).toMatch(/-100$/)
    })
  })

  it('should use -600 shade for text (consistent with MODULE_COLORS)', () => {
    Object.values(DASHBOARD_COLORS).forEach(colorConfig => {
      expect(colorConfig.text).toMatch(/-600$/)
    })
  })
})

describe('getDashboardColors function', () => {
  it('should return correct colors for valid color names', () => {
    const validColors = ['emerald', 'purple', 'blue', 'amber', 'rose', 'cyan', 'pink', 'green', 'indigo']

    validColors.forEach(colorName => {
      const result = getDashboardColors(colorName)
      expect(result).toEqual(DASHBOARD_COLORS[colorName])
    })
  })

  it('should return emerald colors for valid "emerald" input', () => {
    const result = getDashboardColors('emerald')
    expect(result.text).toBe('text-emerald-600')
    expect(result.bg).toBe('bg-emerald-100')
  })

  it('should return default (emerald) colors for invalid color names', () => {
    const invalidColors = ['invalid', 'red', 'teal', '', 'PURPLE', 'Blue']

    invalidColors.forEach(colorName => {
      const result = getDashboardColors(colorName)
      expect(result).toEqual(DASHBOARD_COLORS.emerald)
    })
  })

  it('should return default (emerald) colors for empty string', () => {
    const result = getDashboardColors('')
    expect(result).toEqual(DASHBOARD_COLORS.emerald)
  })

  it('should be case-sensitive (uppercase should return default)', () => {
    const result = getDashboardColors('PURPLE')
    expect(result).toEqual(DASHBOARD_COLORS.emerald)
  })

  it('should return a complete DashboardColorConfig object', () => {
    const result = getDashboardColors('pink')
    expect(result).toHaveProperty('text')
    expect(result).toHaveProperty('bg')
    expect(Object.keys(result)).toHaveLength(2)
  })
})

describe('color consistency between MODULE_COLORS and DASHBOARD_COLORS', () => {
  it('should have overlapping color names', () => {
    const moduleColorNames = Object.keys(MODULE_COLORS)
    const dashboardColorNames = Object.keys(DASHBOARD_COLORS)

    // All MODULE_COLORS names should exist in DASHBOARD_COLORS
    moduleColorNames.forEach(colorName => {
      expect(dashboardColorNames).toContain(colorName)
    })
  })

  it('should use same text color shade for overlapping colors', () => {
    const overlappingColors = ['emerald', 'purple', 'blue', 'amber', 'rose', 'cyan']

    overlappingColors.forEach(colorName => {
      const moduleText = MODULE_COLORS[colorName as ModuleColorName].text
      const dashboardText = DASHBOARD_COLORS[colorName].text
      expect(moduleText).toBe(dashboardText)
    })
  })
})

describe('default color differences', () => {
  it('should have different defaults for module vs dashboard colors', () => {
    // MODULE_COLORS defaults to purple
    const moduleDefault = getModuleColors('invalid')
    expect(moduleDefault).toEqual(MODULE_COLORS.purple)

    // DASHBOARD_COLORS defaults to emerald
    const dashboardDefault = getDashboardColors('invalid')
    expect(dashboardDefault).toEqual(DASHBOARD_COLORS.emerald)
  })
})

describe('edge cases', () => {
  it('getModuleColors should handle null-ish string values gracefully', () => {
    // These should not throw, just return default
    expect(() => getModuleColors('null')).not.toThrow()
    expect(() => getModuleColors('undefined')).not.toThrow()
    expect(getModuleColors('null')).toEqual(MODULE_COLORS.purple)
    expect(getModuleColors('undefined')).toEqual(MODULE_COLORS.purple)
  })

  it('getDashboardColors should handle null-ish string values gracefully', () => {
    // These should not throw, just return default
    expect(() => getDashboardColors('null')).not.toThrow()
    expect(() => getDashboardColors('undefined')).not.toThrow()
    expect(getDashboardColors('null')).toEqual(DASHBOARD_COLORS.emerald)
    expect(getDashboardColors('undefined')).toEqual(DASHBOARD_COLORS.emerald)
  })

  it('should handle color names with special characters', () => {
    const specialInputs = ['emerald!', 'purple@', 'blue#', 'amber$', 'rose%']
    specialInputs.forEach(input => {
      expect(getModuleColors(input)).toEqual(MODULE_COLORS.purple)
      expect(getDashboardColors(input)).toEqual(DASHBOARD_COLORS.emerald)
    })
  })

  it('should handle numeric strings', () => {
    expect(getModuleColors('123')).toEqual(MODULE_COLORS.purple)
    expect(getDashboardColors('456')).toEqual(DASHBOARD_COLORS.emerald)
  })
})
