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

### Task 3: Per-bullet row component — hide/show, move up/down, delete, add

**Description:** Replace the freeform `BulletListTextarea` editor for Work Experience descriptions with a list of discrete bullet rows. Each row gets its own single-line `Textarea`, a hide/show toggle (reuse `ShowIconButton`), move up/down buttons (reuse `MoveIconButton size="small"`, hidden at the first/last row same as `FormSection`), and a delete button (reuse `DeleteIconButton`). Add a small "Add bullet" action below the list. All actions compute the next `ResumeDescriptionItem[]` and dispatch the existing `changeWorkExperiences({ idx, field: "descriptions", value })` action — no new reducer logic needed. A hidden bullet stays visible and editable in the form (dimmed, mirroring the `opacity-60` treatment `Form`'s whole-section hide already uses) — it's just excluded from the PDF (Task 4).

**Acceptance criteria:**
- [ ] Each bullet in a Work Experience entry renders as its own row with hide/show, move up (hidden on first row), move down (hidden on last row), and delete controls
- [ ] Clicking hide/show toggles that bullet's `isIncluded` without affecting others
- [ ] Clicking move up/down swaps that bullet with its neighbor, preserving each bullet's content and hidden state
- [ ] Clicking delete removes just that bullet; an "Add bullet" control appends a new, visible, empty bullet
- [ ] A hidden bullet is visually distinguished (dimmed) but remains editable
- [ ] Existing whole-job-entry controls (move/delete job, add job) are unaffected

**Verification:**
- [ ] `npm run build` succeeds
- [ ] Manual in browser: add a job with 3 bullets; hide the 2nd, move the 3rd above the 1st, delete the (now) 2nd, add a new one — confirm each step reflects correctly and nothing else in the form shifts unexpectedly

**Dependencies:** Task 1

**Files likely touched:**
- `src/app/components/ResumeForm/WorkExperiencesForm.tsx`
- New: `src/app/components/ResumeForm/WorkExperienceDescriptionBulletRow.tsx` (or similar)
- `src/app/components/ResumeForm/Form/IconButton.tsx` (only if `ShowIconButton` needs a `size` prop added for the compact row — check before editing)

**Estimated scope:** Medium (3 files)

---

### Task 4: PDF/preview excludes hidden bullets

**Description:** `ResumePDFWorkExperience.tsx` currently passes `descriptions` straight into `ResumePDFBulletList items={descriptions}`. Filter to `isIncluded` bullets and map to their `content` before passing in, so hidden bullets never appear in the live preview or exported PDF. `ResumePDFBulletList` itself stays `string[]`-typed and unchanged.

**Acceptance criteria:**
- [ ] A bullet hidden via Task 3's toggle does not appear in the live PDF preview
- [ ] A bullet hidden via Task 3's toggle does not appear in the downloaded PDF
- [ ] All other bullets, and bullets in Education/Project/Skills/Custom, render exactly as before

**Verification:**
- [ ] `npm run build` succeeds
- [ ] Manual: hide a bullet, confirm it disappears from the live preview pane; download the PDF and confirm it's absent there too; confirm an un-hidden bullet in the same job still shows

**Dependencies:** Task 3

**Files likely touched:**
- `src/app/components/Resume/ResumePDF/ResumePDFWorkExperience.tsx`

**Estimated scope:** Small (1 file)

---

## Checkpoint: Feature Complete
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] `npm run test:ci` passes
- [ ] Full manual flow: add a job, add 3 bullets, hide one, reorder two, delete one, add one back — editor and live PDF preview both reflect every action correctly; reload the page and confirm everything persisted
- [ ] Ready for human review
