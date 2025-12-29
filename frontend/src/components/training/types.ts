// Screen type definitions for training modules

export interface SwipeCardContent {
  title?: string
  body: string
  subtext?: string
  follow_up?: string
}

// Static card - simple text display without swipe interaction
export interface StaticCardContent {
  title?: string
  body: string
  subtext?: string
  follow_up?: string
  emphasis?: boolean
}

// Tap reveal list - sequential tap-to-reveal items in a single column
export interface TapRevealListContent {
  header?: string
  header2?: string // Optional second header (shown after some items)
  header2_after_item?: number // Show header2 after this many items revealed
  items: Array<{
    id: string
    text: string
  }>
  subtext_after_reveal?: string
}

// Emoji select - multi-select with emoji options
export interface EmojiSelectContent {
  prompt: string
  options: Array<{
    id: string
    emoji: string
    label: string
  }>
  allow_multiple: boolean
  optional_text_prompt?: string
}

// Multi select - select all that apply from text options
export interface MultiSelectContent {
  prompt: string
  options: Array<{
    id: string
    label: string
    description?: string
  }>
  include_other?: boolean
}

// Text input - free text entry with prompt
export interface TextInputContent {
  prompt: string
  subtext?: string
  placeholder?: string
  prefix?: string // e.g., "I know..."
  max_length?: number
}

// Confirmation display - shows user's previous responses
export interface ConfirmationDisplayContent {
  title: string
  display_from_screens: string[] // Screen IDs to pull responses from
  subtext?: string
  follow_up?: string
}

// Category toggle - tap to toggle between categories (simplified drag-drop)
export interface CategoryToggleContent {
  prompt: string
  categories: Array<{
    id: string
    label: string
  }>
  items: Array<{
    id: string
    text: string
    correct_category: string
  }>
  show_feedback?: boolean
}

export interface TapRevealColumnsContent {
  header: string
  left_column: {
    title: string
    items: string[]
  }
  right_column: {
    title: string
    items: { id: string; text: string }[]
  }
}

export interface ZoneDiagramContent {
  title: string
  prompt: string
  zones: Array<{
    id: string
    label: string
    description: string
    color: 'green' | 'blue' | 'red'
  }>
}

export interface SingleTapReflectionContent {
  prompt: string
  options: Array<{
    id: string
    label: string
    description?: string
  }>
}

export interface RecognitionListContent {
  title: string
  instruction: string
  items: Array<{
    id: string
    text: string
  }>
}

export interface FullScreenStatementContent {
  statement: string
  subtext?: string
  style: 'reassurance' | 'insight'
}

export interface MicroCommitmentContent {
  prompt: string
  options: Array<{
    id: string
    text: string
  }>
  confirmation_template?: string
  follow_up_prompt?: string
  allow_custom_input?: boolean
}

export interface MicroCommitmentConfirmationContent {
  title: string
  encouragement: string
  message_template: string
}

export interface ActivityCompletionContent {
  title: string
  message: string
  next_activity_hint?: string
}

// TapRevealCategories - Grouped tap-to-reveal with categories
export interface TapRevealCategoriesContent {
  header?: string
  categories: Array<{
    id: string
    title: string
    items: Array<{ id: string; text: string }>
  }>
  reveal_mode: 'sequential' | 'any_order'
  subtext_after_reveal?: string
}

// ConditionalContent - Shows different content based on previous responses
// Uses a branching format where each possible response maps to a different screen
export interface ConditionalContentContent {
  condition_screen: string // Screen ID to check for the user's response
  conditions: Record<string, ConditionalBranch> // Maps response value to screen to show
  default_branch?: ConditionalBranch // Optional fallback if no condition matches
}

// A branch within conditional content - defines what screen to show
export interface ConditionalBranch {
  type: ScreenType
  content:
    | StaticCardContent
    | GuidedBreathingContent
    | TapRevealListContent
    | FullScreenStatementContent
    | SingleTapReflectionContent
}

// TapMatching - Interactive matching exercise
export interface TapMatchingContent {
  prompt: string
  items: Array<{ id: string; text: string; correct_match: string }>
  targets: Array<{ id: string; label: string }>
  show_feedback: boolean
}

// GuidedBreathing - Breathing exercise with visual guidance
export interface GuidedBreathingContent {
  title: string
  instruction?: string
  timing: {
    inhale_seconds: number
    hold_seconds?: number
    exhale_seconds: number
  }
  cycles: number
  skippable: boolean
  audio_enabled?: boolean
}

// Union type for all screen types
export type ScreenType =
  | 'swipe_card'
  | 'static_card'
  | 'tap_reveal_list'
  | 'tap_reveal_columns'
  | 'tap_reveal_categories'
  | 'zone_diagram'
  | 'single_tap_reflection'
  | 'single_select'
  | 'recognition_list'
  | 'full_screen_statement'
  | 'micro_commitment'
  | 'micro_commitment_confirmation'
  | 'activity_completion'
  | 'emoji_select'
  | 'multi_select'
  | 'text_input'
  | 'confirmation_display'
  | 'category_toggle'
  | 'conditional_content'
  | 'tap_matching'
  | 'guided_breathing'

export interface Screen {
  id: string
  type: ScreenType
  content:
    | SwipeCardContent
    | StaticCardContent
    | TapRevealListContent
    | TapRevealColumnsContent
    | TapRevealCategoriesContent
    | ZoneDiagramContent
    | SingleTapReflectionContent
    | RecognitionListContent
    | FullScreenStatementContent
    | MicroCommitmentContent
    | MicroCommitmentConfirmationContent
    | ActivityCompletionContent
    | EmojiSelectContent
    | MultiSelectContent
    | TextInputContent
    | ConfirmationDisplayContent
    | CategoryToggleContent
    | ConditionalContentContent
    | TapMatchingContent
    | GuidedBreathingContent
}

export interface Activity {
  id: string
  name: string
  description: string
  estimated_minutes: number
  screens: Screen[]
}

export interface SequentialModuleContent {
  flow_type: 'sequential_activities'
  activities: Activity[]
}

// Screen response types for saving progress
export interface ScreenResponse {
  selection?: string
  selections?: string[]
  commitment_id?: string
  revealed_items?: string[]
  text_input?: string
  category_assignments?: Record<string, string> // item_id -> category_id
  matches?: Record<string, string> // item_id -> target_id (for TapMatching)
  breathing_completed?: boolean // for GuidedBreathing
  cycles_completed?: number // for GuidedBreathing
  breathing_skipped?: boolean // for GuidedBreathing
}

export interface SequentialProgressData {
  current_activity: string
  current_screen: number
  activities_completed: string[]
  screen_responses: Record<string, ScreenResponse>
}

// Props shared across screen components
export interface ScreenComponentProps {
  onContinue: () => void
  onSaveResponse: (response: ScreenResponse) => void
  savedResponse?: ScreenResponse
  moduleColor: string
}
