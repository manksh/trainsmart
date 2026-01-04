// MPA Assessment Dimension Definitions
// Source: https://train-smart.atlassian.net/wiki/spaces/TCS/pages/327713/MPA+Assessment+Definitions

export interface MPADimension {
  key: string
  name: string
  category: 'competency' | 'attribute' | 'overall'
  description: string
  aspectsMeasured: string[]
  exampleItem: string
}

export const MPA_DEFINITIONS: Record<string, MPADimension> = {
  // === COMPETENCIES (6) ===
  mindfulness: {
    key: 'mindfulness',
    name: 'Mindfulness',
    category: 'competency',
    description:
      'The ability to maintain present-moment awareness without judgment, noticing thoughts and feelings as they arise without being reactive to them.',
    aspectsMeasured: [
      'Observing thoughts without getting caught up in them',
      'Noticing emotions without letting them control behavior',
      'Remaining detached from internal experiences',
      'Avoiding automatic reactions to situations',
    ],
    exampleItem: "It's hard for me to notice my thoughts.",
  },
  confidence: {
    key: 'confidence',
    name: 'Confidence',
    category: 'competency',
    description:
      'Self-belief in your skills and abilities as an athlete, including the ability to build and maintain confidence even after setbacks.',
    aspectsMeasured: [
      'Belief in your skills and abilities',
      'Ability to boost confidence when needed',
      'Confidence in achieving your goals',
      'Maintaining confidence after disappointments',
      'Awareness of situations that challenge confidence',
    ],
    exampleItem: "I'm confident in my skills and abilities as an athlete.",
  },
  motivation: {
    key: 'motivation',
    name: 'Motivation',
    category: 'competency',
    description:
      'The internal drive, persistence, and commitment to improvement that fuels your athletic pursuits.',
    aspectsMeasured: [
      'Intrinsic motivation (love of the sport)',
      'Extrinsic motivation (external rewards)',
      'Persistence through challenges',
      'Awareness of motivational patterns',
      'Self-motivation ability',
    ],
    exampleItem: 'I know what situations challenge my motivation.',
  },
  attentional_focus: {
    key: 'attentional_focus',
    name: 'Attentional Focus',
    category: 'competency',
    description:
      'The ability to concentrate, maintain focus under pressure, and quickly refocus when distracted.',
    aspectsMeasured: [
      'Narrow focus on relevant cues',
      'Ability to refocus after distraction',
      'Sustaining focus over time',
      'Managing focus under stress',
      'Identifying key performance cues',
    ],
    exampleItem: 'When distracted, I can quickly refocus.',
  },
  arousal_control: {
    key: 'arousal_control',
    name: 'Arousal Control',
    category: 'competency',
    description:
      'The ability to manage your energy levels - calming down when anxious or pumping up when flat - to reach your optimal performance zone.',
    aspectsMeasured: [
      'Up-regulating energy when needed',
      'Down-regulating energy when anxious',
      'Managing stress and pressure',
      'Awareness of your ideal energy zone',
      'Controlling pre-competition nerves',
    ],
    exampleItem: 'I have a hard time calming myself down when I feel anxious.',
  },
  resilience: {
    key: 'resilience',
    name: 'Resilience',
    category: 'competency',
    description:
      'The capacity to bounce back from setbacks, learn from adversity, and maintain a positive mindset through challenges.',
    aspectsMeasured: [
      'Overcoming obstacles and adversity',
      'Learning and growing from failures',
      'Adapting to difficult situations',
      'Maintaining a positive outlook',
      'Awareness of what knocks you off balance',
    ],
    exampleItem: 'I believe I can overcome any obstacle in my way.',
  },

  // === ATTRIBUTES (4) ===
  knowledge: {
    key: 'knowledge',
    name: 'Knowledge',
    category: 'attribute',
    description:
      'Understanding of mental processes, performance psychology, and strategies to manage your mental game.',
    aspectsMeasured: [
      'Understanding of thoughts and how they work',
      'Knowledge of emotions and their impact',
      'Familiarity with mental performance strategies',
      'Awareness of the science behind peak performance',
    ],
    exampleItem: 'I know what mindfulness is and how to practice it.',
  },
  self_awareness: {
    key: 'self_awareness',
    name: 'Self-Awareness',
    category: 'attribute',
    description:
      'The ability to recognize your own strengths, weaknesses, patterns, and values that shape your performance.',
    aspectsMeasured: [
      'Awareness of personal strengths',
      'Recognition of areas for growth',
      'Understanding thought patterns',
      'Recognizing emotional patterns',
      'Clarity on values and purpose',
    ],
    exampleItem: 'I know my strengths.',
  },
  wellness: {
    key: 'wellness',
    name: 'Wellness',
    category: 'attribute',
    description:
      'Maintaining healthy lifestyle habits that support mental and physical performance.',
    aspectsMeasured: [
      'Prioritizing quality sleep',
      'Maintaining good nutrition',
      'Taking time to relax and recover',
      'Nurturing important relationships',
    ],
    exampleItem: 'I prioritize sleep.',
  },
  deliberate_practice: {
    key: 'deliberate_practice',
    name: 'Deliberate Practice',
    category: 'attribute',
    description:
      'The quality and intentionality of your training, including goal-setting, feedback-seeking, and purposeful improvement.',
    aspectsMeasured: [
      'Setting specific practice goals',
      'Being intentional and mindful in practice',
      'Putting in extra work to improve',
      'Seeking feedback from coaches',
      'Regular reflection on performance',
    ],
    exampleItem: 'I set goals in practice.',
  },

  // === OVERALL SCORES (3) ===
  thinking: {
    key: 'thinking',
    name: 'Thinking',
    category: 'overall',
    description:
      'Your awareness, understanding, and ability to manage your thoughts and mental processes.',
    aspectsMeasured: [
      'Noticing thought patterns',
      'Understanding how thoughts affect performance',
      'Managing unhelpful thoughts',
      'Maintaining helpful self-talk',
    ],
    exampleItem: 'I can notice my thoughts without letting them affect how I feel.',
  },
  feeling: {
    key: 'feeling',
    name: 'Feeling',
    category: 'overall',
    description:
      'Your awareness, understanding, and ability to manage your emotions and feelings.',
    aspectsMeasured: [
      'Recognizing emotions as they arise',
      'Understanding emotional triggers',
      'Managing difficult emotions',
      'Using emotions constructively',
    ],
    exampleItem: "I'm good at noticing my feelings and emotions.",
  },
  acting: {
    key: 'acting',
    name: 'Acting',
    category: 'overall',
    description:
      'Your awareness, understanding, and ability to manage your behaviors and actions.',
    aspectsMeasured: [
      'Awareness of behavioral patterns',
      'Controlling impulsive reactions',
      'Taking purposeful action',
      'Following through on intentions',
    ],
    exampleItem: "I do hard things even when I don't feel like it.",
  },
}

// === PILLAR KEY ARRAYS ===

/** Core competency pillars (6 pillars) */
export const CORE_PILLAR_KEYS = [
  'mindfulness',
  'confidence',
  'motivation',
  'attentional_focus',
  'arousal_control',
  'resilience',
] as const

/** Supporting attribute pillars (4 pillars) */
export const SUPPORTING_PILLAR_KEYS = [
  'knowledge',
  'self_awareness',
  'wellness',
  'deliberate_practice',
] as const

/** All pillar keys (core + supporting) */
export const ALL_PILLAR_KEYS = [
  ...CORE_PILLAR_KEYS,
  ...SUPPORTING_PILLAR_KEYS,
] as const

/** Type for core pillar keys */
export type CorePillarKey = (typeof CORE_PILLAR_KEYS)[number]

/** Type for supporting pillar keys */
export type SupportingPillarKey = (typeof SUPPORTING_PILLAR_KEYS)[number]

/** Type for all pillar keys */
export type PillarKey = (typeof ALL_PILLAR_KEYS)[number]

// === DISPLAY NAMES ===

/** Human-readable names for each pillar */
export const PILLAR_DISPLAY_NAMES: Record<PillarKey, string> = {
  mindfulness: 'Mindfulness',
  confidence: 'Confidence',
  motivation: 'Motivation',
  attentional_focus: 'Attentional Focus',
  arousal_control: 'Arousal Control',
  resilience: 'Resilience',
  knowledge: 'Knowledge',
  self_awareness: 'Self-Awareness',
  wellness: 'Wellness',
  deliberate_practice: 'Deliberate Practice',
}

// === META CATEGORIES ===

/** Meta score category keys */
export const META_CATEGORY_KEYS = ['thinking', 'feeling', 'action'] as const

/** Type for meta category keys */
export type MetaCategoryKey = (typeof META_CATEGORY_KEYS)[number]

/** Meta category display configuration - Option A: Muted Naturals */
export const META_CATEGORIES: Record<
  MetaCategoryKey,
  { name: string; bg: string; text: string }
> = {
  thinking: { name: 'Thinking', bg: 'bg-slate-100', text: 'text-slate-700' },
  feeling: { name: 'Feeling', bg: 'bg-amber-50', text: 'text-amber-700' },
  action: { name: 'Action', bg: 'bg-teal-50', text: 'text-teal-700' },
}

// Helper to get category display name
export function getCategoryDisplayName(category: MPADimension['category']): string {
  switch (category) {
    case 'competency':
      return 'Competency'
    case 'attribute':
      return 'Attribute'
    case 'overall':
      return 'Overall Score'
  }
}

// Helper to get category color classes
export function getCategoryColorClasses(category: MPADimension['category']): {
  bg: string
  text: string
} {
  switch (category) {
    case 'competency':
      return { bg: 'bg-blue-100', text: 'text-blue-700' }
    case 'attribute':
      return { bg: 'bg-purple-100', text: 'text-purple-700' }
    case 'overall':
      return { bg: 'bg-green-100', text: 'text-green-700' }
  }
}
