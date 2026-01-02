# QA Test Plan: "About Emotions" Training Module

## Document Information
- **Module**: About Emotions
- **New Screen Type**: EmojiGrid (first implementation)
- **Date**: 2026-01-02
- **Status**: Draft

---

## 1. Module Overview

### Structure
- 6 intro screens (static content)
- 1 EmojiGrid screen (17 emotions, 5 core required)
- 1 completion screen

### Key Requirements
- Users must explore all 5 "core" emotions before proceeding
- Core emotions have distinct visual styling (border)
- Tapping an emotion opens an inline modal with details
- Progress tracked via `revealed_items` in `screen_responses`
- Responsive grid layout (3 cols mobile, 4 cols tablet)

---

## 2. Priority Matrix

| Priority | Category | Rationale |
|----------|----------|-----------|
| P0 (Critical) | Core emotion requirement enforcement | Blocks user progression |
| P0 (Critical) | Progress persistence | Data loss if broken |
| P1 (High) | Modal open/close behavior | Core interaction |
| P1 (High) | savedResponse restoration | Session continuity |
| P2 (Medium) | Visual styling (borders) | UX polish |
| P2 (Medium) | Accessibility | Compliance |
| P3 (Low) | Edge cases | Robustness |

---

## 3. Frontend Unit Tests (EmojiGrid.test.tsx)

### 3.1 Basic Rendering Tests

```typescript
// File: /frontend/src/components/training/screens/EmojiGrid.test.tsx

describe('EmojiGrid', () => {
  describe('basic rendering', () => {
    it('renders the header/prompt text')
    it('renders all 17 emotion items in the grid')
    it('renders emoji and label for each emotion')
    it('renders continue button')
    it('continue button is disabled initially')
  })
})
```

**Test Cases:**

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| BR-01 | Grid renders header text | Header displays correctly | P1 |
| BR-02 | Grid renders all 17 emotions | All emotion items visible in grid | P0 |
| BR-03 | Each emotion shows emoji + label | Both elements render for each item | P1 |
| BR-04 | Continue button renders | Button visible in footer | P1 |
| BR-05 | Continue button disabled initially | Button has `disabled` attribute | P0 |

### 3.2 Core vs Non-Core Emotion Styling

```typescript
describe('core emotion styling', () => {
  it('applies distinct border class to core emotions (5 specific emotions)')
  it('does not apply border class to non-core emotions (12 remaining)')
  it('uses correct border color matching moduleColor')
  it('maintains border styling after emotion is explored')
})
```

**Test Cases:**

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| CS-01 | Core emotions have border | 5 core emotions have `border-{color}` class | P2 |
| CS-02 | Non-core emotions no border | 12 non-core emotions lack border class | P2 |
| CS-03 | Border color matches moduleColor | Border uses theme color (e.g., `border-emerald-500`) | P2 |
| CS-04 | Border persists after exploration | Explored core emotions retain border | P2 |

### 3.3 Emotion Tap and Modal Behavior

```typescript
describe('modal behavior', () => {
  it('opens modal overlay when emotion is tapped')
  it('modal displays correct emotion details (name, description)')
  it('modal shows close button')
  it('close button closes the modal')
  it('tapping outside modal closes it')
  it('pressing Escape key closes modal')
  it('only one modal can be open at a time')
})
```

**Test Cases:**

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| MB-01 | Tap emotion opens modal | Modal overlay appears | P0 |
| MB-02 | Modal shows emotion name | Selected emotion name in modal header | P1 |
| MB-03 | Modal shows description | Description text renders in modal body | P1 |
| MB-04 | Close button visible | X button or "Got it" button present | P1 |
| MB-05 | Close button closes modal | Modal disappears on click | P0 |
| MB-06 | Outside tap closes modal | Click on overlay background closes modal | P2 |
| MB-07 | Escape key closes modal | Keyboard escape dismisses modal | P2 |
| MB-08 | Single modal constraint | Opening new emotion closes previous | P2 |

### 3.4 Explored State Tracking

```typescript
describe('explored state', () => {
  it('shows checkmark indicator on explored emotions')
  it('checkmark appears after modal is closed (not just opened)')
  it('unexplored emotions do not show checkmark')
  it('explored count updates in real-time')
  it('calls onSaveResponse with revealed_items after each exploration')
})
```

**Test Cases:**

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| ES-01 | Checkmark on explored | Checkmark icon visible on explored items | P1 |
| ES-02 | Checkmark after close | Checkmark only after modal dismissed | P1 |
| ES-03 | No checkmark on unexplored | Unexplored items lack checkmark | P1 |
| ES-04 | Real-time count update | UI counter reflects explored count | P2 |
| ES-05 | onSaveResponse called | `revealed_items` array passed to callback | P0 |

### 3.5 Continue Button Enablement Logic

```typescript
describe('continue button behavior', () => {
  it('remains disabled when 0 core emotions explored')
  it('remains disabled when 4 core emotions explored')
  it('becomes enabled when all 5 core emotions explored')
  it('stays enabled when more than 5 (including non-core) explored')
  it('calls onContinue when clicked while enabled')
  it('does not call onContinue when clicked while disabled')
})
```

**Test Cases:**

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| CB-01 | Disabled at 0 core | Button disabled, cannot proceed | P0 |
| CB-02 | Disabled at 4 core | Button disabled, cannot proceed | P0 |
| CB-03 | Enabled at 5 core | Button enabled, can proceed | P0 |
| CB-04 | Enabled with extras | Button stays enabled with 6+ explored | P1 |
| CB-05 | Calls onContinue when enabled | Handler invoked on click | P0 |
| CB-06 | No action when disabled | Click on disabled button has no effect | P1 |

### 3.6 Saved Response Handling

```typescript
describe('savedResponse restoration', () => {
  it('restores explored emotions from savedResponse.revealed_items')
  it('shows checkmarks for previously explored emotions')
  it('enables continue if savedResponse has all 5 core')
  it('allows continuing exploration from saved state')
  it('handles empty savedResponse gracefully')
  it('handles undefined savedResponse gracefully')
  it('handles malformed revealed_items array')
})
```

**Test Cases:**

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| SR-01 | Restore revealed_items | Previously explored emotions marked | P0 |
| SR-02 | Checkmarks on restored | Visual indicators present | P0 |
| SR-03 | Enable if 5 core saved | Continue button enabled on load | P0 |
| SR-04 | Continue from saved state | New explorations append to saved | P1 |
| SR-05 | Empty savedResponse | No crash, starts fresh | P1 |
| SR-06 | Undefined savedResponse | No crash, starts fresh | P1 |
| SR-07 | Invalid revealed_items | Graceful handling, no crash | P2 |

### 3.7 Responsive Layout

```typescript
describe('responsive grid layout', () => {
  it('renders 3 columns on mobile viewport (< 640px)')
  it('renders 4 columns on tablet viewport (>= 768px)')
  it('maintains proper spacing between grid items')
  it('modal is properly centered on all viewports')
})
```

**Test Cases:**

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| RL-01 | 3 columns mobile | Grid shows 3 columns on small screens | P2 |
| RL-02 | 4 columns tablet | Grid shows 4 columns on medium+ screens | P2 |
| RL-03 | Grid gap consistent | Items have uniform spacing | P3 |
| RL-04 | Modal centered | Modal appears centered at all sizes | P2 |

### 3.8 Color Theming

```typescript
describe('module color theming', () => {
  it('applies emerald theme colors when moduleColor is emerald')
  it('applies purple theme colors when moduleColor is purple')
  it('applies correct color to core emotion borders')
  it('applies correct color to continue button')
  it('defaults to purple for unknown moduleColor')
})
```

**Test Cases:**

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| CT-01 | Emerald theme | Emerald colors throughout | P2 |
| CT-02 | Purple theme | Purple colors throughout | P2 |
| CT-03 | Border color match | Core borders use theme color | P2 |
| CT-04 | Button color match | Continue button uses theme color | P2 |
| CT-05 | Unknown color fallback | Defaults to purple | P3 |

---

## 4. Accessibility Tests

### 4.1 Keyboard Navigation

```typescript
describe('keyboard accessibility', () => {
  it('emotion items are focusable with Tab key')
  it('Enter key opens modal on focused emotion')
  it('Space key opens modal on focused emotion')
  it('focus moves to modal when opened')
  it('Tab cycles through modal interactive elements')
  it('focus returns to trigger element after modal closes')
  it('focus is trapped within modal while open')
})
```

**Test Cases:**

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| KA-01 | Tab to emotions | Focus moves through grid items | P2 |
| KA-02 | Enter opens modal | Focused item opens on Enter | P2 |
| KA-03 | Space opens modal | Focused item opens on Space | P2 |
| KA-04 | Focus to modal | Focus auto-moves to modal content | P2 |
| KA-05 | Tab in modal | Focus cycles through modal controls | P2 |
| KA-06 | Focus return | Focus returns to trigger after close | P2 |
| KA-07 | Focus trap | Tab cannot escape modal | P2 |

### 4.2 Screen Reader Support

```typescript
describe('screen reader accessibility', () => {
  it('emotion buttons have accessible names')
  it('modal has aria-modal="true"')
  it('modal has appropriate role="dialog"')
  it('modal has aria-labelledby for title')
  it('explored state announced via aria-label or aria-describedby')
  it('continue button disabled state conveyed to assistive tech')
})
```

**Test Cases:**

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| SR-01 | Accessible button names | Each emotion has `aria-label` | P2 |
| SR-02 | Modal aria-modal | Modal has `aria-modal="true"` | P2 |
| SR-03 | Modal role | Modal has `role="dialog"` | P2 |
| SR-04 | Modal title linked | `aria-labelledby` points to title | P2 |
| SR-05 | Explored announced | State conveyed accessibly | P2 |
| SR-06 | Disabled state | `aria-disabled` or native disabled | P2 |

### 4.3 Color Contrast

```typescript
describe('color contrast', () => {
  it('core emotion border has sufficient contrast ratio')
  it('checkmark icon has sufficient contrast')
  it('modal text has sufficient contrast')
  it('continue button text has sufficient contrast')
})
```

---

## 5. Integration Tests

### 5.1 Module Load and Navigation

```typescript
describe('module integration', () => {
  it('About Emotions module loads successfully')
  it('intro screens display in correct order')
  it('navigation from intro screens to EmojiGrid works')
  it('EmojiGrid renders within module context')
  it('completion screen shows after EmojiGrid')
})
```

**Test Cases:**

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| MI-01 | Module loads | No errors, content appears | P0 |
| MI-02 | Intro screen order | 6 intros in correct sequence | P1 |
| MI-03 | Navigate to EmojiGrid | Transition works | P0 |
| MI-04 | EmojiGrid in context | Props passed correctly | P0 |
| MI-05 | Completion after grid | Final screen renders | P0 |

### 5.2 Progress Persistence

```typescript
describe('progress persistence', () => {
  it('saves progress after exploring emotions')
  it('progress persists after page refresh')
  it('progress persists after browser close/reopen')
  it('partially explored state restored correctly')
  it('fully explored state restored correctly')
})
```

**Test Cases:**

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| PP-01 | Save on explore | API call made with revealed_items | P0 |
| PP-02 | Persist on refresh | State restored after refresh | P0 |
| PP-03 | Persist across sessions | State restored in new session | P0 |
| PP-04 | Partial state restore | Incomplete exploration restored | P1 |
| PP-05 | Complete state restore | Full exploration restored | P1 |

### 5.3 Screen Response Data Structure

```typescript
describe('screen_responses structure', () => {
  it('revealed_items is an array of emotion IDs')
  it('revealed_items contains only valid emotion IDs')
  it('revealed_items has no duplicates')
  it('revealed_items order matches exploration order')
})
```

---

## 6. Edge Case Tests

### 6.1 User Interaction Edge Cases

```typescript
describe('interaction edge cases', () => {
  it('exploring same emotion multiple times does not duplicate in revealed_items')
  it('exploring all 17 emotions works correctly')
  it('exploring exactly 5 core and 0 non-core enables continue')
  it('rapid tapping emotions does not cause race conditions')
  it('double-tap on emotion opens modal only once')
})
```

**Test Cases:**

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| EC-01 | Duplicate exploration | No duplicates in revealed_items | P1 |
| EC-02 | Explore all 17 | All marked explored, no errors | P1 |
| EC-03 | Exactly 5 core | Continue enabled with minimum | P0 |
| EC-04 | Rapid tapping | No race conditions or errors | P2 |
| EC-05 | Double tap | Single modal instance only | P2 |

### 6.2 Navigation Edge Cases

```typescript
describe('navigation edge cases', () => {
  it('browser back button from EmojiGrid returns to previous screen')
  it('browser forward after back returns to EmojiGrid with state')
  it('refreshing page mid-exploration preserves progress')
  it('closing modal with back button works correctly')
})
```

**Test Cases:**

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| NE-01 | Back button | Returns to previous screen | P2 |
| NE-02 | Forward after back | State preserved | P2 |
| NE-03 | Refresh mid-explore | Progress maintained | P1 |
| NE-04 | Modal back button | Closes modal, stays on screen | P2 |

### 6.3 Modal Content Edge Cases

```typescript
describe('modal edge cases', () => {
  it('long emotion description scrolls within modal')
  it('modal handles missing description gracefully')
  it('modal handles missing emoji gracefully')
  it('modal animation does not cause layout shift')
})
```

---

## 7. Mobile-Specific Tests

### 7.1 Touch Interactions

```typescript
describe('mobile touch interactions', () => {
  it('tap gesture opens emotion modal')
  it('swipe on grid does not cause unexpected scrolling')
  it('modal close button has adequate touch target (44x44px)')
  it('emotion items have adequate touch targets')
})
```

**Test Cases:**

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| MT-01 | Tap opens modal | Touch event triggers modal | P1 |
| MT-02 | No accidental scroll | Grid interaction stable | P2 |
| MT-03 | Close touch target | >= 44x44px touch area | P2 |
| MT-04 | Item touch targets | Adequate spacing for fingers | P2 |

### 7.2 Viewport Handling

```typescript
describe('mobile viewport', () => {
  it('grid is visible without horizontal scrolling')
  it('modal does not overflow viewport')
  it('continue button is visible above keyboard (if applicable)')
  it('handles orientation change gracefully')
})
```

---

## 8. Backend API Tests

### 8.1 Module Endpoint Tests

```python
# File: /backend/tests/test_about_emotions_module.py

class TestAboutEmotionsModule:
    """Tests specific to About Emotions module."""

    async def test_get_module_by_slug(self):
        """Should return About Emotions module by slug."""

    async def test_module_has_correct_structure(self):
        """Module should have 8 screens in 1 activity."""

    async def test_emoji_grid_screen_content_structure(self):
        """EmojiGrid screen content should have required fields."""
```

**Test Cases:**

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| BE-01 | Get by slug | 200 response with module data | P0 |
| BE-02 | Correct structure | 1 activity, 8 screens | P0 |
| BE-03 | EmojiGrid content | Has emotions array with core flags | P0 |

### 8.2 Progress Save Tests

```python
class TestAboutEmotionsProgress:
    """Tests for progress saving in About Emotions module."""

    async def test_save_revealed_items_progress(self):
        """Should save revealed_items in screen_responses."""

    async def test_progress_data_structure(self):
        """progress_data should follow sequential_activities format."""

    async def test_revealed_items_validation(self):
        """Should validate revealed_items are valid emotion IDs."""
```

**Test Cases:**

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| PS-01 | Save revealed_items | Data persisted in DB | P0 |
| PS-02 | Progress structure | Matches sequential_activities format | P0 |
| PS-03 | Validate IDs | Invalid IDs rejected or ignored | P2 |

---

## 9. Data Validation Tests

### 9.1 Emotion Content Validation

```typescript
describe('emotion content validation', () => {
  it('all 17 emotions have unique IDs')
  it('all emotions have non-empty emoji')
  it('all emotions have non-empty label')
  it('all emotions have non-empty description')
  it('exactly 5 emotions marked as core')
  it('core emotion IDs match expected values')
})
```

---

## 10. Implementation Checklist

### Frontend Files to Create/Modify

| File | Action | Priority |
|------|--------|----------|
| `/frontend/src/components/training/screens/EmojiGrid.tsx` | Create | P0 |
| `/frontend/src/components/training/screens/EmojiGrid.test.tsx` | Create | P0 |
| `/frontend/src/components/training/types.ts` | Add EmojiGridContent interface | P0 |
| `/frontend/src/components/training/screens/index.ts` | Export EmojiGrid | P0 |
| `/frontend/src/components/training/screens/ScreenRenderer.tsx` | Add case for emoji_grid | P0 |
| `/frontend/src/components/training/screens/ScreenRenderer.test.tsx` | Add test for emoji_grid | P1 |

### Backend Files to Create/Modify

| File | Action | Priority |
|------|--------|----------|
| `/backend/alembic/versions/xxxx_seed_about_emotions_module.py` | Create migration | P0 |
| `/backend/tests/test_about_emotions.py` | Create test file | P1 |

---

## 11. Test Implementation Order (Recommended)

### Phase 1: Core Functionality (P0 - Must have before release)

1. **EmojiGrid.test.tsx - Basic Rendering**
   - Grid renders all 17 emotions
   - Continue button disabled initially

2. **EmojiGrid.test.tsx - Core Requirement Logic**
   - Disabled at 4 core explored
   - Enabled at 5 core explored
   - Calls onContinue when enabled

3. **EmojiGrid.test.tsx - Modal Behavior**
   - Tap opens modal
   - Close button works

4. **EmojiGrid.test.tsx - Progress Persistence**
   - onSaveResponse called with revealed_items
   - savedResponse restoration

5. **ScreenRenderer.test.tsx**
   - Add emoji_grid type test case

### Phase 2: Polish and Edge Cases (P1 - High priority)

6. **EmojiGrid.test.tsx - Explored State**
   - Checkmark indicators
   - No duplicates in revealed_items

7. **EmojiGrid.test.tsx - savedResponse Edge Cases**
   - Empty/undefined handling
   - Partial state restoration

8. **Integration Tests**
   - Module load
   - Screen navigation

### Phase 3: Accessibility and Styling (P2 - Medium priority)

9. **EmojiGrid.test.tsx - Accessibility**
   - Keyboard navigation
   - ARIA attributes

10. **EmojiGrid.test.tsx - Styling**
    - Core emotion borders
    - Color theming

11. **EmojiGrid.test.tsx - Responsive**
    - Grid columns at breakpoints

### Phase 4: Edge Cases (P3 - Nice to have)

12. **EmojiGrid.test.tsx - Edge Cases**
    - Rapid tapping
    - Long content in modal
    - Mobile touch targets

---

## 12. Test Data Fixtures

### Sample EmojiGrid Content

```typescript
const sampleEmojiGridContent: EmojiGridContent = {
  header: "Let's explore how emotions show up in your life",
  instruction: "Tap each emotion to learn more. Explore all 5 core emotions to continue.",
  emotions: [
    // Core emotions (5)
    { id: 'joy', emoji: '😊', label: 'Joy', description: 'A feeling of great pleasure...', isCore: true },
    { id: 'sadness', emoji: '😢', label: 'Sadness', description: 'A feeling of sorrow...', isCore: true },
    { id: 'fear', emoji: '😨', label: 'Fear', description: 'An unpleasant emotion...', isCore: true },
    { id: 'anger', emoji: '😠', label: 'Anger', description: 'A strong feeling of displeasure...', isCore: true },
    { id: 'disgust', emoji: '🤢', label: 'Disgust', description: 'A feeling of revulsion...', isCore: true },
    // Non-core emotions (12)
    { id: 'surprise', emoji: '😲', label: 'Surprise', description: 'A brief emotional state...', isCore: false },
    // ... additional emotions
  ],
  coreCount: 5,
}
```

### Sample Saved Response

```typescript
const savedResponsePartial = {
  revealed_items: ['joy', 'sadness', 'fear']
}

const savedResponseComplete = {
  revealed_items: ['joy', 'sadness', 'fear', 'anger', 'disgust', 'surprise']
}
```

---

## 13. Definition of Done

- [ ] All P0 tests written and passing
- [ ] All P1 tests written and passing
- [ ] P2 accessibility tests passing
- [ ] Manual QA smoke test completed
- [ ] No console errors in browser
- [ ] Progress saves correctly to backend
- [ ] Module accessible from training dashboard
- [ ] Code reviewed and merged

---

## 14. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Core emotion logic bug | High | Medium | Thorough unit tests on enablement logic |
| Progress not saving | High | Low | Integration tests + manual verification |
| Modal accessibility issues | Medium | Medium | WCAG checklist + screen reader testing |
| Mobile layout broken | Medium | Low | Viewport-specific tests |
| Race conditions on rapid tap | Low | Low | Debounce implementation |

---

## Appendix A: Type Definition Reference

```typescript
// Proposed EmojiGridContent interface
export interface EmojiGridContent {
  header?: string
  instruction?: string
  emotions: Array<{
    id: string
    emoji: string
    label: string
    description: string
    isCore: boolean
  }>
  coreCount: number // Number of core emotions required
}

// ScreenResponse extension
export interface ScreenResponse {
  // ... existing fields
  revealed_items?: string[] // Already exists, used for EmojiGrid
}
```

---

## Appendix B: Related Documentation

- `/Users/mankshgupta/Desktop/trainsmart/CLAUDE.md` - Project development guide
- `/Users/mankshgupta/Desktop/trainsmart/frontend/src/components/training/types.ts` - Screen type definitions
- `/Users/mankshgupta/Desktop/trainsmart/frontend/src/components/training/screens/TapRevealCategories.test.tsx` - Similar pattern (reveal mechanics)
- `/Users/mankshgupta/Desktop/trainsmart/frontend/src/components/training/screens/EmojiSelect.tsx` - Similar UI (emoji grid, but different purpose)
