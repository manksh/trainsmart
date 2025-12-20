/**
 * Shared module color configuration for TrainSmart training components.
 *
 * This centralizes color definitions to ensure consistency across all
 * training module screens and components.
 */

/**
 * Available module color names
 */
export type ModuleColorName = 'emerald' | 'purple' | 'blue' | 'amber' | 'rose' | 'cyan';

/**
 * Color classes for a specific module color
 */
export interface ModuleColorClasses {
  /** Primary background color (e.g., 'bg-emerald-600') */
  bg: string;
  /** Light background color for highlights (e.g., 'bg-emerald-50') */
  bgLight: string;
  /** Text color (e.g., 'text-emerald-600') */
  text: string;
  /** Border color (e.g., 'border-emerald-500') */
  border: string;
  /** Ring color for focus states (e.g., 'ring-emerald-500') */
  ring: string;
  /** Focus ring color (e.g., 'focus:ring-emerald-500') */
  focusRing: string;
  /** Gradient background (e.g., 'from-emerald-50 to-white') */
  gradient: string;
}

/**
 * Complete module color configuration mapping color names to their Tailwind classes
 */
export const MODULE_COLORS: Record<ModuleColorName, ModuleColorClasses> = {
  emerald: {
    bg: 'bg-emerald-600',
    bgLight: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-500',
    ring: 'ring-emerald-500',
    focusRing: 'focus:ring-emerald-500',
    gradient: 'from-emerald-50 to-white',
  },
  purple: {
    bg: 'bg-purple-600',
    bgLight: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-500',
    ring: 'ring-purple-500',
    focusRing: 'focus:ring-purple-500',
    gradient: 'from-purple-50 to-white',
  },
  blue: {
    bg: 'bg-blue-600',
    bgLight: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-500',
    ring: 'ring-blue-500',
    focusRing: 'focus:ring-blue-500',
    gradient: 'from-blue-50 to-white',
  },
  amber: {
    bg: 'bg-amber-600',
    bgLight: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-500',
    ring: 'ring-amber-500',
    focusRing: 'focus:ring-amber-500',
    gradient: 'from-amber-50 to-white',
  },
  rose: {
    bg: 'bg-rose-600',
    bgLight: 'bg-rose-50',
    text: 'text-rose-600',
    border: 'border-rose-500',
    ring: 'ring-rose-500',
    focusRing: 'focus:ring-rose-500',
    gradient: 'from-rose-50 to-white',
  },
  cyan: {
    bg: 'bg-cyan-600',
    bgLight: 'bg-cyan-50',
    text: 'text-cyan-600',
    border: 'border-cyan-500',
    ring: 'ring-cyan-500',
    focusRing: 'focus:ring-cyan-500',
    gradient: 'from-cyan-50 to-white',
  },
};

/**
 * Default color to use when module color is not specified or invalid
 */
export const DEFAULT_MODULE_COLOR: ModuleColorName = 'purple';

/**
 * Gets the color classes for a given module color name.
 * Falls back to purple if the color name is not found.
 *
 * @param colorName - The name of the module color
 * @returns The color classes for the specified module color
 *
 * @example
 * ```tsx
 * const colors = getModuleColors('emerald');
 * <button className={`${colors.bg} text-white`}>Continue</button>
 * ```
 */
export function getModuleColors(colorName: string): ModuleColorClasses {
  if (colorName in MODULE_COLORS) {
    return MODULE_COLORS[colorName as ModuleColorName];
  }
  return MODULE_COLORS[DEFAULT_MODULE_COLOR];
}

/**
 * Dashboard color configuration for non-training contexts
 * (e.g., check-in options, tool options on athlete dashboard)
 */
export interface DashboardColorConfig {
  text: string;
  bg: string;
}

/**
 * Mapping from color names to dashboard-style color classes
 */
export const DASHBOARD_COLORS: Record<string, DashboardColorConfig> = {
  emerald: { text: 'text-emerald-600', bg: 'bg-emerald-100' },
  purple: { text: 'text-purple-600', bg: 'bg-purple-100' },
  blue: { text: 'text-blue-600', bg: 'bg-blue-100' },
  amber: { text: 'text-amber-600', bg: 'bg-amber-100' },
  rose: { text: 'text-rose-600', bg: 'bg-rose-100' },
  cyan: { text: 'text-cyan-600', bg: 'bg-cyan-100' },
  pink: { text: 'text-pink-600', bg: 'bg-pink-100' },
  green: { text: 'text-green-600', bg: 'bg-green-100' },
  indigo: { text: 'text-indigo-600', bg: 'bg-indigo-100' },
};

/**
 * Gets dashboard color configuration for a given color name.
 * Falls back to emerald if the color name is not found.
 *
 * @param colorName - The name of the color
 * @returns The dashboard color configuration
 */
export function getDashboardColors(colorName: string): DashboardColorConfig {
  return DASHBOARD_COLORS[colorName] || DASHBOARD_COLORS.emerald;
}
