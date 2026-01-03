# Spike: Audio/Video Content in Training Modules

**Date:** 2026-01-02
**Status:** Analysis Complete - On Hold
**Decision:** Saved for future implementation

---

## Executive Summary

Adding audio/video to training modules is **feasible** with our current architecture. The codebase is ready (GuidedBreathing provides a pattern), but operational complexity is HIGH due to media hosting decisions, bandwidth costs, and cross-browser testing.

**Recommended approach when ready:** Start with Vimeo Pro ($20/mo) for fastest time-to-production, migrate to self-hosted GCS/Mux if costs justify.

---

## Complexity Ratings

| Area | Rating | Notes |
|------|--------|-------|
| Frontend | Medium | 5-7 days, follows existing patterns |
| Backend | Medium | 1-2 days, JSONB content is flexible |
| Overall | **High** | Due to operational complexity, not code |

---

## Estimated Effort

| Task | Duration |
|------|----------|
| VideoScreen component | 2-3 days |
| AudioScreen component | 1-2 days |
| Progress tracking updates | 1 day |
| Cross-browser testing | 2-3 days |
| Pilot module | 1 week |
| **Total MVP** | **2-3 weeks** |

---

## Hosting Options Analysis

| Option | Cost | Pros | Cons |
|--------|------|------|------|
| **Vimeo Pro** | $20/mo flat | Fastest, proven player, privacy controls | Less customization |
| **GCS + Cloudflare** | ~$0.12/GB egress | Full control, no vendor lock | Operational overhead |
| **Mux** | ~$0.005/min delivered | Best DX, analytics | Another vendor |
| **YouTube Private** | Free | Global CDN | Branding, limited tracking |

### Cost Projections (Self-Hosted GCS)

| Users/Month | Bandwidth Cost |
|-------------|----------------|
| 100 | ~$90 |
| 1,000 | ~$900 |
| 10,000 | ~$9,000 |

---

## Technical Details

### Proposed Screen Types

```typescript
// VideoScreenContent
interface VideoScreenContent {
  title?: string
  video_url: string           // Or vimeo_id if using Vimeo
  thumbnail_url?: string
  duration_seconds: number
  allow_skip: boolean
  skip_after_seconds?: number
  require_completion: boolean
  captions_url?: string       // WebVTT file
  transcript?: string
}

// AudioScreenContent
interface AudioScreenContent {
  title: string
  audio_url: string
  duration_seconds: number
  allow_skip: boolean
  transcript?: string
  background_image_url?: string
}

// Progress tracking addition
interface ScreenResponse {
  // ... existing fields
  media_progress?: {
    watched_seconds: number
    completed: boolean
    skipped: boolean
    watch_percentage: number
  }
}
```

### Files to Create/Modify

| File | Changes |
|------|---------|
| `frontend/src/components/training/screens/VideoPlayer.tsx` | NEW - ~300 lines |
| `frontend/src/components/training/screens/AudioPlayer.tsx` | NEW - ~250 lines |
| `frontend/src/components/training/types.ts` | Add content interfaces |
| `frontend/src/components/training/screens/ScreenRenderer.tsx` | Add cases |
| `frontend/src/components/training/screens/index.ts` | Add exports |

### Video Player Recommendation

**Native HTML5** with custom Tailwind controls:
- Zero bundle size impact
- Full design control
- Can migrate to react-player later if needed

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Reliability regression | High | Feature flag, graceful degradation |
| Mobile browser quirks | Medium | Thorough testing, skip option |
| Progress complexity | Medium | Clear "completion" definition |
| Bundle size | Low | Native HTML5, no extra libraries |

---

## Phased Rollout Plan

1. **Phase 1 (1-2 weeks)**: Infrastructure
   - VideoScreen/AudioScreen components
   - Vimeo Pro setup
   - Feature flag: `ENABLE_MEDIA_SCREENS=false`

2. **Phase 2 (1 week)**: Pilot
   - Single module with 3-5 videos
   - Monitor completion rates, errors

3. **Phase 3 (2 weeks)**: Full Rollout
   - Enable across modules
   - Add to existing content via migrations

4. **Phase 4 (future)**: Optimization
   - Migrate to self-hosted if costs > $500/mo
   - Add offline support
   - Adaptive bitrate streaming

---

## Key Decisions Before Starting

1. [ ] Choose hosting: Vimeo Pro vs GCS vs Mux
2. [ ] Define "completion": 80%? 100%? Just opened?
3. [ ] Create video content
4. [ ] Identify target devices for testing

---

## References

- GuidedBreathing component: `frontend/src/components/training/screens/GuidedBreathing.tsx`
- Screen types: `frontend/src/components/training/types.ts`
- ScreenRenderer: `frontend/src/components/training/screens/ScreenRenderer.tsx`

---

*Analysis by: Frontend Engineer, Backend Architect, Code Architecture Reviewer*
