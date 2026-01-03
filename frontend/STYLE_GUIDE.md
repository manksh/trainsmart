# TrainSmart Design System & Style Guide

> A comprehensive visual design system for ensuring consistency across the TrainSmart mental performance training platform.

> **Living Document**: This style guide is actively maintained during the design system migration. See [Migration Status](#migration-status) for current progress.

## Table of Contents

1. [Migration Status](#migration-status)
2. [Design Audit Summary](#design-audit-summary)
3. [Brand Colors](#brand-colors)
4. [Typography](#typography)
5. [Spacing System](#spacing-system)
6. [Component Styles](#component-styles)
7. [Shared Components](#shared-components)
8. [Motion & Animation](#motion--animation)
9. [Accessibility](#accessibility)
10. [File Reference](#file-reference)
11. [Migration Recommendations](#migration-recommendations)

---

## Migration Status

This section tracks the progress of consolidating the design system from the legacy blue primary to the sage green brand identity.

### Phase Overview

| Phase | Name | Status | Description |
|-------|------|--------|-------------|
| 1 | Brand Foundation | **In Progress** | CSS variables, shared components, core patterns |
| 2 | Dashboard Migration | Pending | Athlete home, profile, training pages |
| 3 | Polish | Pending | Glassmorphism, animations, final refinements |

### Phase 1: Brand Foundation (In Progress)

**Objective**: Establish the sage green primary color system and create shared components to reduce duplication.

| Task | Status | Notes |
|------|--------|-------|
| Update `--primary` CSS variable to sage-700 | Planned | HSL: `153 13% 27%` |
| Update `--ring` CSS variable to match | Planned | HSL: `153 13% 27%` |
| Create `LoadingSpinner` shared component | Planned | Consolidates 4+ duplicated patterns |
| Document color mapping utilities | Planned | `src/lib/colors.ts` |

### Phase 2: Dashboard Migration (Pending)

| Task | Status | Notes |
|------|--------|-------|
| Athlete home page sage updates | Pending | Assessment CTA, spinners |
| Profile page sage updates | Pending | Charts, buttons |
| Train page section headers | Pending | Indigo to sage |
| TopNav active states | Pending | Blue to sage |

### Phase 3: Polish (Pending)

| Task | Status | Notes |
|------|--------|-------|
| Page background color (`#fafdf7`) | Pending | Warm off-white |
| Glassmorphism for elevated cards | Pending | Welcome cards, featured modules |
| Button.tsx sage variant | Pending | New variant or update default |

### Component Consolidation Opportunities

The following architectural improvements are identified for reducing code duplication:

| Opportunity | Current State | Proposed Solution | Priority |
|-------------|---------------|-------------------|----------|
| LoadingSpinner | 4+ hardcoded spinners across pages | Shared `LoadingSpinner` component | **High** |
| AssessmentCTA | Duplicated in athlete page | Extract to `AssessmentCTA` component | Medium |
| Color Mapping | Scattered color logic | Consolidate in `src/lib/colors.ts` | Medium |

---

## Design Audit Summary

### Current State Analysis

The TrainSmart app currently has **two distinct visual languages** that need reconciliation:

#### 1. New Auth Design (Login Page) - "Sage Green System"
- **Colors**: Sage green gradient (`sage-700` to `sage-400`), warm off-white backgrounds (`#fafdf7`)
- **Style**: Modern glassmorphism, floating cards with backdrop blur, subtle animations
- **Feel**: Premium, calm, wellness-focused

#### 2. Main App Design - "Blue Primary System"
- **Colors**: Sky blue primary (`primary-600` = `hsl(199 89% 48%)`), standard gray backgrounds
- **Style**: Functional cards with borders, minimal shadows
- **Feel**: Corporate, utility-focused

### Key Inconsistencies Found

| Area | Auth Pages | Main App | Severity |
|------|-----------|----------|----------|
| Primary Color | Sage green (`sage-700`) | Blue (`primary-600`, `blue-600`) | **Critical** |
| Background | Off-white `#fafdf7` | Pure white/gray-50 | Moderate |
| Card Style | Glassmorphism with backdrop-blur | Solid white with border | Moderate |
| Typography | Sage-colored headings | Gray/primary-colored headings | Moderate |
| Button Style | `sage-700/800` with rounded-lg | `primary-600/700` or module colors | **Critical** |
| Animations | Float animation on cards | Minimal to none | Minor |

### Recommended Direction

**Option A (Recommended): Adopt Sage as Primary, Keep Module Colors**

The sage green system represents a more sophisticated, wellness-appropriate aesthetic that better suits a mental performance platform. The recommendation is to:

1. Use sage green as the **brand primary** color (navigation, buttons on neutral pages, auth)
2. Keep the existing **module accent colors** (emerald, purple, blue, amber, rose, cyan) for training content
3. Introduce the warmer off-white background system-wide
4. Apply consistent glassmorphism to elevated cards

---

## Brand Colors

### CSS Variables

The design system uses CSS custom properties for theming. These are defined in `src/app/globals.css`.

#### Current State (Legacy Blue)
```css
:root {
  --primary: 199 89% 48%;      /* Sky blue - being phased out */
  --ring: 199 89% 48%;         /* Matches primary */
}
```

#### Target State (Sage Green)
```css
:root {
  --primary: 153 13% 27%;      /* Sage-700 - brand primary */
  --ring: 153 13% 27%;         /* Matches primary for focus states */
}
```

> **Migration Note**: The `--primary` variable is being updated from the legacy blue (`199 89% 48%`) to sage-700 (`153 13% 27%`). This change affects all components using `bg-primary`, `text-primary`, and `ring-primary` utilities.

### Primary Palette (Sage Green)

Use for brand elements, navigation, primary CTAs on non-training pages.

```typescript
// tailwind.config.ts - sage palette (already defined)
sage: {
  50: '#f0f4e8',   // Lightest - subtle backgrounds
  100: '#e4ebe0',  // Light backgrounds
  200: '#c9d7c1',  // Borders, dividers
  300: '#a8bda0',  // Disabled states
  400: '#7a9b8e',  // Secondary text on dark
  500: '#5d8273',  // Secondary text
  600: '#4a6b5c',  // Primary text on light
  700: '#3d4f4a',  // Primary buttons, headings (brand color)
  800: '#2f3d39',  // Hover states
  900: '#242e2b',  // Darkest - footers
}
```

**HSL Reference for sage-700**: `153 13% 27%` (hue: 153, saturation: 13%, lightness: 27%)

**Usage Examples:**
```tsx
// Primary button (auth/general pages)
<button className="bg-sage-700 hover:bg-sage-800 text-sage-50">

// Brand heading
<h1 className="text-sage-700">

// Form label
<label className="text-sage-700">

// Link
<a className="text-sage-700 hover:text-sage-800">
```

### Module Accent Colors

Use within training modules to differentiate content and maintain engagement. Each module has a designated color.

```typescript
// Already defined in src/lib/colors.ts
moduleColors: {
  emerald: 'bg-emerald-600',  // Managing Stress module
  purple: 'bg-purple-600',    // Default/fallback
  blue: 'bg-blue-600',        // Focus & Attention
  amber: 'bg-amber-600',      // Building Confidence
  rose: 'bg-rose-600',        // Emotional Regulation
  cyan: 'bg-cyan-600',        // Breathing tools
}
```

### Semantic Colors

For feedback and status indicators.

```css
/* Success */
--success-bg: bg-green-50;
--success-text: text-green-700;
--success-border: border-green-200;
--success-icon: text-green-600;

/* Warning */
--warning-bg: bg-yellow-50;
--warning-text: text-yellow-700;
--warning-border: border-yellow-200;

/* Error */
--error-bg: bg-red-50;
--error-text: text-red-700;
--error-border: border-red-200;

/* Info */
--info-bg: bg-blue-50;
--info-text: text-blue-700;
--info-border: border-blue-200;
```

### Neutral Grays

For text, borders, and backgrounds.

```css
/* Text hierarchy */
--text-primary: text-gray-900;      /* Headings, important text */
--text-secondary: text-gray-600;    /* Body text */
--text-muted: text-gray-500;        /* Helper text, descriptions */
--text-disabled: text-gray-400;     /* Disabled, placeholders */

/* Backgrounds */
--bg-page: #fafdf7;                 /* Page background (warm off-white) */
--bg-card: white;                   /* Card backgrounds */
--bg-elevated: bg-gray-50;          /* Elevated sections */
--bg-hover: bg-gray-100;            /* Hover states */

/* Borders */
--border-light: border-gray-100;    /* Subtle dividers */
--border-default: border-gray-200;  /* Card borders */
--border-strong: border-gray-300;   /* Input borders */
```

---

## Typography

### Font Stack

```css
/* System font stack (default in Tailwind) */
font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
             "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

### Type Scale

| Element | Class | Size | Weight | Color |
|---------|-------|------|--------|-------|
| Page Title | `text-2xl font-bold` | 24px | 700 | `text-gray-900` |
| Section Title | `text-lg font-semibold` | 18px | 600 | `text-gray-900` |
| Card Title | `text-base font-semibold` | 16px | 600 | `text-gray-900` |
| Body Large | `text-xl` | 20px | 400 | `text-gray-900` |
| Body | `text-base` | 16px | 400 | `text-gray-600` |
| Body Small | `text-sm` | 14px | 400 | `text-gray-500` |
| Caption | `text-xs` | 12px | 400 | `text-gray-400` |
| Label | `text-sm font-medium` | 14px | 500 | `text-sage-700` or `text-gray-700` |

### Heading Hierarchy

```tsx
// Page titles (athlete dashboard, profile, train)
<h1 className="text-2xl font-bold text-gray-900">

// Section headings
<h2 className="text-lg font-semibold text-gray-900">

// Card headings
<h3 className="font-semibold text-gray-900">

// Subsection headings
<h4 className="text-sm font-semibold text-gray-700">
```

---

## Spacing System

### Base Unit

Use Tailwind's default 4px base unit consistently.

### Standard Spacing Values

| Token | Value | Usage |
|-------|-------|-------|
| `p-2` / `gap-2` | 8px | Tight groupings, icon padding |
| `p-3` / `gap-3` | 12px | Small cards, list items |
| `p-4` / `gap-4` | 16px | Standard card padding, section gaps |
| `p-5` | 20px | Comfortable card padding |
| `p-6` | 24px | Large card padding |
| `p-8` | 32px | Page section padding |
| `py-6 sm:py-8` | 24-32px | Page vertical padding |

### Container Widths

```tsx
// Main content (dashboard, profile)
<main className="max-w-lg mx-auto px-4">      // 512px - mobile-first single column

// Wider content (train page, assessment results)
<main className="max-w-2xl mx-auto px-4">     // 672px - comfortable reading

// Full layouts (profile with charts)
<main className="max-w-4xl mx-auto px-4">     // 896px - multi-column
```

### Component Spacing Patterns

```tsx
// Page layout
<main className="max-w-lg mx-auto px-4 py-6 sm:py-8">
  <div className="mb-6">              {/* Header section */}
    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
    <p className="text-gray-500">{subtitle}</p>
  </div>
  <div className="space-y-4">         {/* Content cards with consistent gaps */}
    {/* Cards */}
  </div>
</main>

// Card internals
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
  <div className="flex items-center justify-between mb-4">
    <h3 className="font-semibold text-gray-900">{title}</h3>
  </div>
  <div className="space-y-3">          {/* List items */}
    {/* Content */}
  </div>
</div>
```

---

## Component Styles

### Buttons

#### Primary Button (Sage - for auth/general pages)

```tsx
<button className="
  w-full
  bg-sage-700 hover:bg-sage-800
  text-sage-50
  font-semibold
  py-4 px-6
  rounded-xl
  transition-all
  focus:ring-2 focus:ring-sage-400 focus:ring-offset-2
">
  Sign in
</button>
```

#### Primary Button (Module-colored - for training)

```tsx
// Using getModuleColors() from src/lib/colors.ts
const colors = getModuleColors(moduleColor)
<button className={`w-full ${colors.bg} text-white font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-all`}>
  Continue
</button>
```

#### Secondary Button

```tsx
<button className="
  w-full
  border border-gray-300
  text-gray-700
  font-medium
  py-3 px-4
  rounded-xl
  hover:bg-gray-50
  transition-colors
">
  Cancel
</button>
```

#### Ghost Button

```tsx
<button className="
  text-sm text-gray-500 hover:text-gray-700
  underline
  transition-colors
">
  Skip for now
</button>
```

#### Icon Button

```tsx
<button className="
  p-2
  text-gray-400 hover:text-gray-600
  hover:bg-gray-100
  rounded-lg
  transition-colors
">
  <svg className="w-5 h-5">...</svg>
</button>
```

### Form Inputs

#### Text Input

```tsx
// Standard input (auth pages with sage theme)
<input className="
  w-full
  h-10
  px-3 py-2
  border border-sage-200
  rounded-md
  text-sm
  placeholder:text-gray-400
  focus:border-sage-400 focus:ring-2 focus:ring-sage-400 focus:ring-offset-0
  focus:outline-none
  transition-colors
" />

// Standard input (main app - uses CSS variables)
<Input className="..." />  // Uses border-input from globals.css
```

#### Form Label

```tsx
<label className="block text-sm font-medium text-sage-700 mb-1.5">
  Email address
</label>
```

#### Error State

```tsx
<p className="mt-1.5 text-sm text-red-600">
  {errorMessage}
</p>
```

### Cards

#### Standard Card

```tsx
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
  {/* Content */}
</div>
```

#### Interactive Card

```tsx
<button className="
  w-full
  bg-white rounded-xl shadow-sm border border-gray-200
  p-5
  text-left
  hover:shadow-md hover:border-gray-300
  transition-all
">
  {/* Content */}
</button>
```

#### Glassmorphism Card (for premium features/auth)

```tsx
<div className="
  bg-sage-50/15
  backdrop-blur-sm
  rounded-xl
  p-5
  hover:bg-sage-50/25
  transition-colors
">
  {/* Content */}
</div>
```

#### Colored Accent Card (module-specific)

```tsx
const colors = getModuleColors(moduleColor)
<div className={`rounded-2xl p-6 ${colors.bgLight} border-2 border-${moduleColor}-200`}>
  {/* Content */}
</div>
```

### Navigation

#### Top Navigation Bar

```tsx
<header className="bg-white shadow-sm sticky top-0 z-50">
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16">
      {/* Logo, nav items, user menu */}
    </div>
  </div>
</header>
```

#### Active Nav State

```tsx
// Current: Uses blue
className={isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}

// Recommended: Use sage
className={isActive ? 'bg-sage-50 text-sage-700' : 'text-gray-600 hover:bg-gray-100'}
```

### Progress Indicators

#### Progress Bar

```tsx
<div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
  <div
    className={`h-full ${colors.bg} rounded-full transition-all duration-300`}
    style={{ width: `${progress}%` }}
  />
</div>
```

#### Score Bar (Assessment)

```tsx
// Color based on score percentage
const getScoreColor = (score: number) => {
  const percentage = (score / 7) * 100
  if (percentage >= 70) return 'bg-green-500'
  if (percentage >= 50) return 'bg-yellow-500'
  return 'bg-orange-500'
}
```

### Alerts & Feedback

#### Error Alert

```tsx
<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
  {errorMessage}
</div>
```

#### Success Alert

```tsx
<div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
  {successMessage}
</div>
```

### Icons

Use Heroicons (outline style) consistently. Standard size: `w-5 h-5`.

```tsx
// Standard icon in button
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="..." />
</svg>

// Icon in colored container
<div className={`${bgColor} ${color} p-2 rounded-lg`}>
  <svg className="w-5 h-5">...</svg>
</div>
```

---

## Shared Components

This section documents reusable UI components that consolidate common patterns across the application.

### LoadingSpinner

A unified loading spinner component that replaces hardcoded spinner patterns throughout the app.

**Location**: `/frontend/src/components/ui/LoadingSpinner.tsx`

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Controls the spinner dimensions |
| `className` | `string` | `''` | Additional CSS classes for customization |

**Size Reference**:

| Size | Dimensions | Use Case |
|------|------------|----------|
| `sm` | `h-4 w-4` | Inline loading, buttons |
| `md` | `h-8 w-8` | Card loading, section loading |
| `lg` | `h-12 w-12` | Full page loading states |

**Usage Examples**:

```tsx
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// Default medium spinner (page loading)
<LoadingSpinner />

// Small spinner in a button
<button disabled={isLoading}>
  {isLoading ? <LoadingSpinner size="sm" /> : 'Submit'}
</button>

// Large spinner for full-page loading
<div className="flex items-center justify-center min-h-screen">
  <LoadingSpinner size="lg" />
</div>

// Custom styling
<LoadingSpinner size="md" className="text-emerald-600" />
```

**Styling**:
- Uses `animate-spin` for rotation
- Border-based spinner with `border-b-2` for the visible arc
- Inherits color from `border-sage-600` by default (can be overridden via className)
- Rounded with `rounded-full`

**Migration Note**: This component consolidates 4+ duplicated spinner implementations found in:
- Athlete dashboard page
- Profile page
- Training module pages
- Assessment pages

When adding loading states, always use this shared component instead of creating inline spinners.

### Future Components (Planned)

#### AssessmentCTA

A reusable call-to-action component for prompting users to take assessments.

**Status**: Planned for Phase 2

**Current location of duplicated pattern**: `/frontend/src/app/(dashboard)/athlete/page.tsx`

---

## Motion & Animation

### Transition Defaults

```css
/* Standard transition for interactive elements */
transition-colors      /* Color changes only */
transition-all         /* All properties (use sparingly) */
duration-200           /* Default: 200ms */
duration-300           /* Slightly slower: 300ms */
```

### Float Animation (Glassmorphism cards)

```css
/* In globals.css */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}

.animate-float {
  animation: float 4s ease-in-out infinite;
}
```

Usage with staggered delay:
```tsx
<div
  className="motion-safe:animate-float"
  style={{ animationDelay: `${index * 0.5}s` }}
>
```

### Loading Spinner

> **Note**: Use the shared `LoadingSpinner` component instead of hardcoding spinners. See [Shared Components](#shared-components) for details.

```tsx
// Preferred: Use the shared component
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
<LoadingSpinner size="lg" />

// Legacy pattern (avoid in new code):
<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-600" />
```

### Loading Skeleton

```tsx
<div className="animate-pulse">
  <div className="h-5 w-24 bg-gray-200 rounded" />
</div>
```

### Hover/Focus States

```tsx
// Button hover
hover:opacity-90           // Colored buttons
hover:bg-gray-50           // Ghost/outline buttons
hover:shadow-md            // Cards

// Focus states
focus:outline-none
focus:ring-2 focus:ring-sage-400 focus:ring-offset-2
```

---

## Accessibility

### Color Contrast

All text must meet WCAG 2.1 AA standards:
- Normal text: 4.5:1 ratio minimum
- Large text (18px+): 3:1 ratio minimum

| Combination | Ratio | Pass |
|-------------|-------|------|
| `sage-700` on white | 5.2:1 | Yes |
| `sage-600` on white | 4.6:1 | Yes |
| `sage-50` on `sage-700` | 7.1:1 | Yes |
| `gray-600` on white | 5.7:1 | Yes |
| `gray-500` on white | 4.6:1 | Yes |

### Focus Indicators

Always provide visible focus states:

```tsx
focus:outline-none
focus:ring-2
focus:ring-sage-400
focus:ring-offset-2
```

### Semantic HTML

```tsx
// Use proper heading hierarchy
<h1> -> <h2> -> <h3>

// Use semantic elements
<main>, <nav>, <header>, <footer>, <section>

// Use ARIA when needed
<button aria-label="Close dialog">
<div role="alert">
```

### Motion Safety

Respect user preferences:

```tsx
// Only animate for users who haven't requested reduced motion
className="motion-safe:animate-float"
```

---

## File Reference

### Core Configuration

| File | Purpose | Migration Status |
|------|---------|------------------|
| `tailwind.config.ts` | Color palette, theme extensions | Sage palette defined |
| `src/app/globals.css` | CSS variables, base styles, animations | Pending: Update `--primary` |
| `src/lib/colors.ts` | Module color utilities | No changes needed |

### Shared UI Components

| File | Purpose | Status |
|------|---------|--------|
| `src/components/ui/LoadingSpinner.tsx` | Unified loading spinner | **Planned** |
| `src/components/ui/button.tsx` | Button variants | Pending sage variant |

### Key Components to Update

| File | Current Style | Recommended Change | Priority | Status |
|------|--------------|-------------------|----------|--------|
| `src/app/globals.css` | `--primary: 199 89% 48%` | `--primary: 153 13% 27%` | **Critical** | Planned |
| `src/app/page.tsx` | Blue primary | Sage primary | High | Pending |
| `src/app/(auth)/signup/page.tsx` | Blue primary, gray bg | Match login (sage, off-white) | High | Pending |
| `src/components/layout/TopNav.tsx` | Blue active states | Sage active states | High | Pending |
| `src/components/ui/button.tsx` | primary-600/700 | Add sage variant or update default | High | Pending |
| `src/app/(dashboard)/athlete/page.tsx` | Blue accents, inline spinners | Sage brand, use LoadingSpinner | Medium | Pending |
| `src/app/(dashboard)/profile/page.tsx` | Blue accents, inline spinners | Sage brand, use LoadingSpinner | Medium | Pending |
| `src/app/(dashboard)/train/page.tsx` | Indigo section icons | Sage section icons | Medium | Pending |

---

## Migration Recommendations

### Phase 1: Critical (Brand Consistency)

**Priority: High | Estimated effort: 2-3 hours**

1. **Update globals.css CSS variables**
   - Change `--primary` to sage (`142 40% 30%` for sage-700)
   - Add `--primary-bg` for page backgrounds

2. **Update TopNav.tsx**
   - Change logo background from `bg-blue-600` to `bg-sage-700`
   - Change active state from `bg-blue-50 text-blue-600` to `bg-sage-50 text-sage-700`

3. **Update signup page**
   - Apply same layout structure as login
   - Use sage color system throughout

4. **Update landing page (page.tsx)**
   - Change heading from `text-primary-600` to `text-sage-700`
   - Update button colors to sage

### Phase 2: Dashboard Pages

**Priority: Medium | Estimated effort: 3-4 hours**

1. **Update athlete home page**
   - Change assessment prompt from blue gradient to sage gradient
   - Change "Show more" buttons from `text-blue-600` to `text-sage-700`
   - Update loading spinners to sage

2. **Update profile page**
   - Keep score colors (green/yellow/orange for performance)
   - Change "Start Assessment" button to sage
   - Change radar chart accent from blue to sage

3. **Update train page**
   - Change section header icons from indigo to sage
   - Keep individual module colors as-is

### Phase 3: Refinements

**Priority: Low | Estimated effort: 2-3 hours**

1. **Add page background color**
   - Apply `style={{ backgroundColor: '#fafdf7' }}` or add to layout

2. **Update button.tsx variants**
   - Add `sage` variant for primary brand buttons
   - Keep `default` for backward compatibility

3. **Consider glassmorphism for elevated cards**
   - Apply to welcome cards, featured modules
   - Use `bg-white/80 backdrop-blur-sm` pattern

---

## Quick Reference Card

```tsx
// === BRAND PRIMARY (Sage) ===
// Use for: Nav, auth pages, brand CTAs
bg-sage-700 hover:bg-sage-800 text-sage-50
text-sage-700 hover:text-sage-800
bg-sage-50 text-sage-700                    // Active/selected states

// === MODULE COLORS ===
// Use for: Training content, module-specific elements
import { getModuleColors } from '@/lib/colors'
const colors = getModuleColors('emerald')   // or purple, blue, amber, rose, cyan

// === NEUTRALS ===
text-gray-900                               // Headings
text-gray-600                               // Body text
text-gray-500                               // Muted text
text-gray-400                               // Disabled/placeholder
bg-white border border-gray-200             // Cards
bg-gray-50                                  // Subtle backgrounds
bg-gray-100                                 // Hover backgrounds

// === PAGE LAYOUT ===
<main className="max-w-lg mx-auto px-4 py-6 sm:py-8">
  <div className="space-y-4">
    {/* Cards */}
  </div>
</main>

// === STANDARD CARD ===
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">

// === TRANSITIONS ===
transition-colors                           // Default for buttons
transition-all duration-300                 // For complex transitions
```

---

## Changelog

### Version 1.1 (January 2026)
- Added Migration Status section to track phase progress
- Documented LoadingSpinner shared component specification
- Added CSS Variables section with current vs. target state
- Updated File Reference table with migration status column
- Added Component Consolidation Opportunities section
- Added Shared UI Components table

### Version 1.0 (January 2026)
- Initial style guide with design audit findings
- Documented sage green primary palette
- Established typography, spacing, and component patterns

---

*Last updated: January 2026*
*Version: 1.1*
