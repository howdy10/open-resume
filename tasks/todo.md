# Task List: Per-Bullet Hide & Reorder for Work Experience Descriptions

See `tasks/plan.md` for architecture rationale.

## Phase 1: Data Foundation & Backward Compatibility

### Task 1: Data model, redux generics, and legacy-state migration ✅

**Description:** Introduce `ResumeDescriptionItem` (`{ content: string; isIncluded: boolean }`) and change `ResumeWorkExperience.descriptions` to `ResumeDescriptionItem[]`. Generalize the two generic "descriptions" action/arg types so the value type is derived per-`T` instead of hardcoded `string[]`, keeping Education/Project/Skills/Custom unaffected. Add a migration step that normalizes any legacy `string[]` descriptions (from old `localStorage` state) into the new shape on load, so existing saved resumes don't break. As a stopgap so the app keeps compiling and behaving identically, adapt `WorkExperiencesForm.tsx`'s use of `BulletListTextarea` to map `descriptions` to/from `string[]` via `.content` (real per-bullet UI lands in Task 3).

**Acceptance criteria:**
- [x] `ResumeDescriptionItem` type exists; `ResumeWorkExperience.descriptions: ResumeDescriptionItem[]`
- [x] `CreateChangeActionWithDescriptions<T>` (`src/app/lib/redux/resumeSlice.ts`) and `CreateHandleChangeArgsWithDescriptions<T>` (`src/app/components/ResumeForm/types.ts`) derive the "descriptions" value type from `T["descriptions"]` instead of hardcoding `string[]`
- [x] A resume saved to `localStorage` before this change (plain `descriptions: string[]`) loads without error and displays its bullets correctly after this change — covered by `migrate-resume.test.ts`
- [x] Existing Work Experience editing (add/edit/delete bullet text, add/delete/reorder whole job entries) still works exactly as before — no visible change yet

**Verification:**
- [x] `npm run build` succeeds (typecheck)
- [x] `npm run test:ci` passes (added `src/app/lib/redux/__tests__/migrate-resume.test.ts`, TDD: RED → GREEN)
- [~] Manual: old-shape localStorage resume loading — verified at the unit level (`migrate-resume.test.ts` covers the exact legacy shape); did not drive an actual browser/localStorage session for this pass
- [ ] Manual: add/edit/delete a bullet and a whole job entry in a running browser — not yet done this pass

**Note:** the type change forced minimal compatibility edits beyond the originally-scoped files, to keep `npm run build` green:
- `src/app/lib/parse-resume-from-pdf/extract-resume-from-sections/extract-work-experience.ts` (pulled forward from Task 2 — wraps parsed bullets as `{ content, isIncluded: true }`)
- `src/app/home/constants.ts` (pulled forward from Task 2 — wraps the 3 sample work-experience bullet arrays)
- `src/app/resume-parser/ResumeTable.tsx` (not previously listed — maps to `.content` for display)
- `src/app/components/Resume/ResumePDF/ResumePDFWorkExperience.tsx` (not previously listed — maps to `.content`; does **not** yet filter by `isIncluded`, that's still Task 4)

Task 2's own remaining work is just its manual verification (PDF upload smoke test), since its file changes landed here.

**Dependencies:** None

**Files touched:**
- `src/app/lib/redux/types.ts`
- `src/app/lib/redux/resumeSlice.ts`
- `src/app/components/ResumeForm/types.ts`
- `src/app/lib/redux/migrate-resume.ts` (new)
- `src/app/lib/redux/__tests__/migrate-resume.test.ts` (new)
- `src/app/lib/redux/hooks.tsx` (migration wiring)
- `src/app/components/ResumeForm/WorkExperiencesForm.tsx` (temporary adapter)
- `src/app/lib/parse-resume-from-pdf/extract-resume-from-sections/extract-work-experience.ts`
- `src/app/home/constants.ts`
- `src/app/resume-parser/ResumeTable.tsx`
- `src/app/components/Resume/ResumePDF/ResumePDFWorkExperience.tsx`

**Estimated scope:** Medium (5 files) — actual: Large (11 files), due to the type change's compile-time blast radius. Flagged in plan.md risks.

---

### Task 2: Update the other producers of work-experience descriptions ✅

**Description:** The PDF-import parser and the home page's hardcoded sample resume both construct `ResumeWorkExperience` objects directly and need to emit the new `ResumeDescriptionItem[]` shape instead of `string[]`.

**Note:** the actual code changes to both files landed during Task 1 (forced by the type change, to keep `npm run build` green). This task added the test that proves `extract-work-experience.ts`'s behavior and completed its own verification.

**Acceptance criteria:**
- [x] `extract-work-experience.ts` wraps each parsed bullet as `{ content, isIncluded: true }` — covered by new `extract-work-experience.test.ts`
- [x] `src/app/home/constants.ts`'s work experience sample entries use the new shape — enforced by `npm run build` typecheck (static literal, no dedicated runtime test added)
- [~] Importing a PDF resume on `/resume-parser` or `/resume-import` still extracts and displays work experience bullets correctly — not verified in an actual browser (no browser-automation tool available this session); the parsing logic itself is unit-tested end-to-end through `extractWorkExperience`

**Verification:**
- [x] `npm run build` succeeds
- [x] `npm run test:ci` passes
- [x] Added `extract-work-experience.test.ts`: constructed a minimal synthetic `ResumeSectionToLines` fixture, confirmed RED by temporarily reverting the `.map(...)` wrap (test failed on plain strings), then GREEN after restoring it
- [ ] Manual: upload a sample PDF resume (`public/resume-example/*.pdf`) in a running browser — not done this pass, flagged for follow-up or a future browser-testing-equipped session

**Dependencies:** Task 1

**Files touched:**
- `src/app/lib/parse-resume-from-pdf/extract-resume-from-sections/extract-work-experience.ts` (already wrapped in Task 1's commit)
- `src/app/home/constants.ts` (already wrapped in Task 1's commit)
- `src/app/lib/parse-resume-from-pdf/extract-resume-from-sections/extract-work-experience.test.ts` (new)

**Estimated scope:** Small (2 files) — actual: 1 new test file (the 2 source files were already done)

---

## Checkpoint: Foundation Complete
- [ ] `npm run build` succeeds
- [ ] `npm run test:ci` passes
- [ ] Old-shape localStorage resume still loads correctly (see Task 1 manual check)
- [ ] **Pause here for human review before starting Phase 2**

---

## Phase 2: Per-Bullet Hide & Reorder UI

### Task 3: Per-bullet row component — hide/show, move up/down, delete, add ✅

**Description:** Replace the freeform `BulletListTextarea` editor for Work Experience descriptions with a list of discrete bullet rows. Each row gets its own single-line `Textarea`, a hide/show toggle (reuse `ShowIconButton`), move up/down buttons (reuse `MoveIconButton size="small"`, hidden at the first/last row same as `FormSection`), and a delete button (reuse `DeleteIconButton`). Add a small "Add bullet" action below the list. All actions compute the next `ResumeDescriptionItem[]` and dispatch the existing `changeWorkExperiences({ idx, field: "descriptions", value })` action — no new reducer logic needed. A hidden bullet stays visible and editable in the form (dimmed, mirroring the `opacity-60` treatment `Form`'s whole-section hide already uses) — it's just excluded from the PDF (Task 4).

**Acceptance criteria:**
- [x] Each bullet in a Work Experience entry renders as its own row with hide/show, move up (hidden on first row), move down (hidden on last row), and delete controls
- [x] Clicking hide/show toggles that bullet's `isIncluded` without affecting others
- [x] Clicking move up/down swaps that bullet with its neighbor, preserving each bullet's content and hidden state
- [x] Clicking delete removes just that bullet; an "Add bullet" control appends a new, visible, empty bullet
- [x] A hidden bullet is visually distinguished (dimmed via `opacity-50`) but remains editable
- [x] Existing whole-job-entry controls (move/delete job, add job) are unaffected (untouched code path)

**Verification:**
- [x] `npm run build` succeeds
- [x] `npm run test:ci` passes — added `workExperienceDescriptionActions.test.ts` (8 cases: content/included edits, move up/down incl. no-op at boundaries, delete, add), RED confirmed by running before the module existed
- [~] Manual in browser: add a job with 3 bullets, hide/move/delete/add — not done this pass (no browser-automation tool available); the array-transformation logic each control dispatches is unit-tested directly, and `npm run build`'s static generation of `/resume-builder` (which renders this form against real sample data) didn't crash

**Dependencies:** Task 1

**Files touched:**
- `src/app/components/ResumeForm/WorkExperiencesForm.tsx` (replaced the Task 1 adapter)
- `src/app/components/ResumeForm/WorkExperienceDescriptionBulletRow.tsx` (new)
- `src/app/components/ResumeForm/workExperienceDescriptionActions.ts` (new — pure array-transform helpers, unit-tested)
- `src/app/components/ResumeForm/workExperienceDescriptionActions.test.ts` (new)
- `src/app/components/ResumeForm/Form/IconButton.tsx` (`ShowIconButton` got an optional `size` prop and overridable tooltip text, default behavior unchanged for its one existing caller)

**Estimated scope:** Medium (3 files) — actual: 5 files (2 extra: the new pure-logic module + its test, split out for testability)

---

### Task 4: PDF/preview excludes hidden bullets ✅

**Description:** `ResumePDFWorkExperience.tsx` currently passes `descriptions` straight into `ResumePDFBulletList items={descriptions}`. Filter to `isIncluded` bullets and map to their `content` before passing in, so hidden bullets never appear in the live preview or exported PDF. `ResumePDFBulletList` itself stays `string[]`-typed and unchanged.

**Acceptance criteria:**
- [x] A bullet hidden via Task 3's toggle does not appear in the live PDF preview — `getIncludedDescriptionContents` filters by `isIncluded` before `ResumePDFBulletList` ever sees the array
- [x] A bullet hidden via Task 3's toggle does not appear in the downloaded PDF — same render path (live preview and download both go through `ResumePDFWorkExperience`)
- [x] All other bullets, and bullets in Education/Project/Skills/Custom, render exactly as before — untouched code paths

**Verification:**
- [x] `npm run build` succeeds (incl. static generation of `/resume-builder`, which renders this component against real sample data)
- [x] `npm run test:ci` passes — added `getIncludedDescriptionContents.test.ts` (3 cases: mixed, all-hidden, empty), RED confirmed before the module existed
- [~] Manual: hide a bullet in a running browser, confirm it's absent from live preview and downloaded PDF — not done this pass (no browser-automation tool available); the exact filter the render path depends on is unit-tested directly

**Dependencies:** Task 3

**Files touched:**
- `src/app/components/Resume/ResumePDF/ResumePDFWorkExperience.tsx`
- `src/app/components/Resume/ResumePDF/getIncludedDescriptionContents.ts` (new — pure filter, kept out of the `@react-pdf/renderer`-importing file so it unit-tests cleanly under jsdom)
- `src/app/components/Resume/ResumePDF/getIncludedDescriptionContents.test.ts` (new)

**Estimated scope:** Small (1 file) — actual: 3 files (2 extra: the extracted pure helper + its test)

---

## Checkpoint: Feature Complete
- [x] `npm run build` succeeds
- [x] `npm run lint` passes
- [x] `npm run test:ci` passes (22 tests across 7 suites)
- [ ] Full manual flow: add a job, add 3 bullets, hide one, reorder two, delete one, add one back — editor and live PDF preview both reflect every action correctly; reload the page and confirm everything persisted — **not done**, no browser-automation tool was available in any session this feature was built in; every underlying transformation (migration, parsing, per-bullet move/delete/toggle/add, PDF filtering) is covered by unit tests instead
- [ ] Ready for human review — pending the manual flow above, or your own click-through

