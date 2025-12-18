// Screen type definitions for About Performance module

export interface SwipeCardContent {
  title?: string
  body: string
  subtext?: string
  follow_up?: string
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

// Union type for all screen types
export type ScreenType =
  | 'swipe_card'
  | 'tap_reveal_columns'
  | 'zone_diagram'
  | 'single_tap_reflection'
  | 'recognition_list'
  | 'full_screen_statement'
  | 'micro_commitment'
  | 'micro_commitment_confirmation'
  | 'activity_completion'

export interface Screen {
  id: string
  type: ScreenType
  content:
    | SwipeCardContent
    | TapRevealColumnsContent
    | ZoneDiagramContent
    | SingleTapReflectionContent
    | RecognitionListContent
    | FullScreenStatementContent
    | MicroCommitmentContent
    | MicroCommitmentConfirmationContent
    | ActivityCompletionContent
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
