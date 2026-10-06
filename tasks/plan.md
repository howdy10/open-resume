# Implementation Plan: Per-Bullet Hide & Reorder for Work Experience Descriptions

## Overview

Each Work Experience entry has a `descriptions` field: an array of bullet-point strings, currently edited as one freeform contentEditable block (`BulletListTextarea`). We're adding the ability to hide individual bullets (exclude them from the PDF/preview without deleting them) and reorder them independently, each with its own control, the same way whole sections already have move-up/down and show/hide controls (`FormSection`, `Form` in `src/app/components/ResumeForm/Form/index.tsx`).

Scope is intentionally limited to **Work Experience** only, per the request. Education / Project / Skills / Custom keep their existing freeform bullet editor and `descriptions: string[]` shape untouched.

## Architecture Decisions

- **New per-item shape, Work Experience only.** `ResumeWorkExperience.descriptions` changes from `string[]` to `ResumeDescriptionItem[]` (`{ content: string; isIncluded: boolean }`). Hide/reorder requires stable per-bullet state (visibility) that must travel with the bullet's content; a parallel index-aligned boolean array would desync every time the freeform textarea regenerates `descriptions` from scratch on each keystroke (`getBulletListStringsFromInnerText` in `InputGroup.tsx`). This is why we're also dropping the freeform contentEditable editor for this field (see below) rather than keeping it and bolting state on top.
- **Replace the freeform bullet editor with discrete per-bullet rows**, each with its own small textarea, hide/show toggle (reuse `ShowIconButton`), move up/down (reuse `MoveIconButton` with `size="small"`), and delete (reuse `DeleteIconButton`) — mirroring the existing whole-section control pattern instead of inventing a new one. `BulletListTextarea` stays as-is for Education/Project/Skills/Custom.
- **No new reducer action needed.** `changeWorkExperiences({ idx, field: "descriptions", value })` already replaces the whole `descriptions` array; the new UI computes the next array (toggle/reorder/delete/add) and dispatches that same action. We do generalize the action's TypeScript types so `value`'s type for `field: "descriptions"` is derived from `T["descriptions"]` instead of hardcoded `string[]`, so Education/Project keep `string[]` while Work Experience gets `ResumeDescriptionItem[]`.
- **Explicit migration required for `localStorage`.** `src/app/lib/redux/local-storage.ts` does raw `JSON.parse`/`JSON.stringify` of the whole Redux state with no schema version. `useSetInitialStore` (`src/app/lib/redux/hooks.tsx`) merges stored state over `initialResumeState` via `deepMerge`, but `deepMerge` treats arrays as opaque values and overwrites wholesale (`src/app/lib/deep-merge.ts:18-19` — `Array.isArray` fails `isObject`, so the source array replaces the target directly). A resume saved before this change has `descriptions: string[]` on disk; without an explicit migration step, that raw array would flow straight into state with the new type, and the per-bullet UI would try to read `.content`/`.isIncluded` off plain strings and break. We add a small normalizer that runs on load, before `setResume`, converting any string item to `{ content: item, isIncluded: true }`.
- **PDF export respects `isIncluded`.** `ResumePDFBulletList` (`src/app/components/Resume/ResumePDF/common/index.tsx`) stays typed `items: string[]` and unaware of visibility — `ResumePDFWorkExperience.tsx` filters to included bullets and maps to their `content` before passing them in, matching how whole-section visibility already works via `selectShowByForm`.
- **PDF-import parser emits the new shape.** `extract-work-experience.ts` wraps each parsed bullet as `{ content, isIncluded: true }` so freshly-imported resumes match the new shape without a second migration path.

## Task List

### Phase 1: Data Foundation & Backward Compatibility
*(No visible UI change yet. Goal: every producer/consumer of `ResumeWorkExperience.descriptions` agrees on the new shape, build stays green, old saved resumes still load.)*

- [ ] Task 1: Data model, redux generics, and legacy-state migration
- [ ] Task 2: Update the two other producers of work-experience descriptions (PDF-import parser, home page sample data)

### Checkpoint: Foundation
- [ ] `npm run build` succeeds (full typecheck)
- [ ] `npm run test:ci` passes
- [ ] App manually loads with no visible change for a resume created *before* this change (paste an old-shape `descriptions: string[]` into `localStorage["open-resume-state"]`, reload, confirm bullets show correctly and editing still works)

### Phase 2: Per-Bullet Hide & Reorder UI
- [ ] Task 3: Per-bullet row component — hide/show, move up/down, delete, add
- [ ] Task 4: PDF/preview excludes hidden bullets

### Checkpoint: Feature Complete
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] Manual check in browser: add a job, add 3 bullets, hide one, move another up, delete the third — editor reflects all four actions, live PDF preview omits only the hidden one, reload the page and confirm it all persisted
- [ ] Ready for human review

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Old `localStorage` resumes (`descriptions: string[]`) silently corrupt after shape change | High — users lose/garble existing resumes | Explicit migration step in Task 1, verified manually with a pre-change snapshot before Phase 2 starts |
| Generalizing `CreateChangeActionWithDescriptions<T>` / `CreateHandleChangeArgsWithDescriptions<T>` breaks Education/Project typing | Medium — compile errors elsewhere | Keep Education/Project/Skills/Custom's `descriptions` type as `string[]` unchanged; the generic is parameterized per `T`, so this is a type-level change with no runtime effect on those forms. Verified by `npm run build` |
| New per-row UI regresses existing paste/multi-line-paste UX that `BulletListTextarea` handled (CRLF normalization, Firefox/Safari fallback) | Medium — editing feels worse for Work Experience bullets | Each row is a single-line `Textarea`; multi-line paste into one row is expected to land as one bullet (no auto-split). Call this out explicitly in Task 3's manual verification so it's a conscious trade-off, not a missed regression |
| `ResumePDFBulletList` or other code reads `ResumeWorkExperience.descriptions` as `string[]` somewhere we didn't find | Low-Medium | Task 2's build/typecheck pass is the safety net — any remaining `string[]`-typed call site fails to compile |

## Decisions

- Hidden bullets stay in the editor, dimmed (mirroring the whole-section `opacity-60` treatment in `Form`) — confirmed.
- No limit on empty bullets — confirmed.
