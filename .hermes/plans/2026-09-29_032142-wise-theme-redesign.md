# Wise-Inspired Scandinavian Fintech Theme Redesign Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Transform Pockt's visual design system from the legacy Hallmark palette into the Wise-inspired Scandinavian fintech identity defined in `.agents/DESIGN.md`, featuring sage-tinted canvas neutrals, crisp white card surfaces, signature Wise lime-green accents (`#9fe870`), and a companion Obsidian Forest dark mode.

**Architecture:** Update CSS custom properties in `apps/web/src/app.css` to implement the two-tier surface contrast (`--color-paper` sage canvas vs `--color-paper-2` card surface), update Tailwind CSS v4 `@theme` mappings, adjust global selection and scrollbar tokens, and align layout/button color states across `+layout.svelte`, auth pages, and UI components without breaking existing layout structure or E2E tests.

**Tech Stack:** SvelteKit 5, Tailwind CSS v4, TypeScript, Lucide Icons, Playwright E2E.

---

### Task 1: Update CSS Theme Tokens in `apps/web/src/app.css`

**Objective:** Replace the legacy Hallmark Bloom/Aurora color tokens with Wise Light (sage canvas, pure white card, lime `#9fe870` accent) and Wise Dark (Obsidian forest slate `#0c120e`, deep sage surface `#131b15`, lime accent `#9fe870`).

**Files:**
- Modify: `apps/web/src/app.css:13-43`

**Step 1: Check existing token definitions**

Run: `search_files pattern="--color-accent" path="C:/Users/Caya/Desktop/Project/pockt/apps/web/src/app.css"`

**Step 2: Update `app.css` with Wise Scandinavian Fintech tokens**

In `apps/web/src/app.css`:
```css
:root,
[data-theme="light"] {
  /* Wise Light (Scandinavian Fintech) */
  --color-paper: oklch(0.965 0.008 135);        /* Pale sage canvas (#f4f6f2) */
  --color-paper-2: oklch(1.0 0 0);              /* Pure crisp white card surface (#ffffff) */
  --color-paper-3: oklch(0.925 0.012 135);      /* Sage-tinted neutral surface (#e8ebe6) */
  --color-ink: oklch(0.18 0.015 130);           /* Near-black ink with olive warmth (#0e0f0c) */
  --color-ink-muted: oklch(0.46 0.015 130);     /* Slate olive secondary body (#525850) */
  --color-border: oklch(0.89 0.010 135);        /* Soft sage hairline border (#dbe0d7) */

  /* Wise Lime Accent */
  --color-accent: oklch(0.86 0.18 135);         /* Signature Wise Lime Green (#9fe870) */
  --color-accent-subtle: oklch(0.95 0.05 135);  /* Pale lime tint (#e2f6d5) */
  --color-accent-hover: oklch(0.82 0.19 135);   /* Active lime green (#8de05a) */
  --color-on-accent: oklch(0.18 0.015 130);     /* Ink on accent for WCAG AAA (#0e0f0c) */

  /* Semantic Highlights */
  --color-positive: oklch(0.68 0.16 145);       /* #2ead4b */
  --color-positive-subtle: oklch(0.94 0.05 145);/* #e2f6d5 */
  --color-negative: oklch(0.58 0.20 25);        /* #d03238 */
  --color-negative-subtle: oklch(0.93 0.05 25); /* #fce8e8 */
  --color-warning: oklch(0.78 0.17 75);         /* #e5a100 */
}

[data-theme="dark"] {
  /* Wise Dark (Obsidian Forest) */
  --color-paper: oklch(0.14 0.015 145);         /* Obsidian forest canvas (#0c120e) */
  --color-paper-2: oklch(0.18 0.018 145);       /* Deep forest card surface (#131b15) */
  --color-paper-3: oklch(0.23 0.022 145);       /* Muted deep sage surface (#1b261e) */
  --color-ink: oklch(0.95 0.008 140);           /* Crisp off-white ink (#f2f5f1) */
  --color-ink-muted: oklch(0.66 0.018 140);     /* Muted sage secondary (#8c9a8e) */
  --color-border: oklch(0.26 0.020 145);        /* Hairline forest border (#223126) */

  /* Wise Lime Accent */
  --color-accent: oklch(0.86 0.18 135);         /* Signature Wise Lime Green (#9fe870) */
  --color-accent-subtle: oklch(0.24 0.04 135);  /* Deep lime forest tint */
  --color-accent-hover: oklch(0.89 0.17 135);   /* Hover bright lime (#adff7d) */
  --color-on-accent: oklch(0.12 0.015 145);     /* Ink on accent (#0c120e) */

  /* Semantic Highlights */
  --color-positive: oklch(0.72 0.16 145);
  --color-positive-subtle: oklch(0.22 0.04 145);
  --color-negative: oklch(0.65 0.20 25);
  --color-negative-subtle: oklch(0.22 0.05 25);
  --color-warning: oklch(0.82 0.16 75);
}
```

**Step 3: Verify CSS build passes**

Run: `pnpm --filter @pockt/web build`
Expected: PASS — zero CSS syntax or Tailwind build errors.

---

### Task 2: Align Global Shell, Header, and Sidebar Accents in `+layout.svelte`

**Objective:** Update button states, selection highlight, tooltip titles, and active nav styling in `apps/web/src/routes/+layout.svelte` to match the Wise theme tokens without altering the N3 layout structure.

**Files:**
- Modify: `apps/web/src/routes/+layout.svelte:140-435`

**Step 1: Check theme toggle titles and button contrast**

Ensure `button[title*="Mode"]` and `button[aria-label="Toggle Theme"]` remain present for Playwright E2E tests:
```svelte
title={currentTheme === 'light' ? 'Switch to Dark Mode (Wise Dark)' : 'Switch to Light Mode (Wise Light)'}
```
Ensure primary action buttons (like Quick Add) use `text-[var(--color-on-accent)]` with `bg-[var(--color-accent)]` for high-contrast accessibility.

**Step 2: Verify active nav link styles**

Ensure active nav items use:
`bg-[var(--color-accent-subtle)] text-[var(--color-ink)] font-bold` or `border-l-2 border-[var(--color-accent)]` rather than washed out low-contrast tints.

**Step 3: Verify TypeScript and markup checks**

Run: `pnpm --filter @pockt/web check`
Expected: PASS — 0 errors.

---

### Task 3: Align Auth Pages (`/login` and `/register`) & Animated Glide Overlay

**Objective:** Update login/register card styles, input focus rings, and transition overlay so the initial brand entrance reflects the new Wise lime & sage theme.

**Files:**
- Modify: `apps/web/src/routes/login/+page.svelte`
- Modify: `apps/web/src/routes/register/+page.svelte`
- Modify: `apps/web/src/routes/+layout.svelte:438-474` (Glide Overlay)

**Step 1: Review `/login` and `/register` button styling**

Submit buttons use `bg-[var(--color-accent)] text-[var(--color-on-accent)] font-mono font-bold hover:bg-[var(--color-accent-hover)]`.

**Step 2: Verify input focus rings**

Ensure `.modal-input` and auth inputs focus ring matches `border-color: var(--color-accent)`.

**Step 3: Run dev test in browser / check syntax**

Run: `pnpm --filter @pockt/web check`
Expected: PASS.

---

### Task 4: Align Component Form Elements & Semantic Badges

**Objective:** Align `AmountInput.svelte`, `QuickAddModal.svelte`, `Modal.svelte`, and `SortDropdown.svelte` with the new theme colors.

**Files:**
- Modify: `apps/web/src/components/QuickAddModal.svelte`
- Modify: `apps/web/src/components/Modal.svelte`
- Modify: `apps/web/src/components/SortDropdown.svelte`
- Modify: `apps/web/src/components/AmountInput.svelte`

**Step 1: Inspect QuickAddModal switcher**

Update active expense/income toggle pills to leverage `--color-paper-3` and `--color-ink` with crisp borders.

**Step 2: Update modal action buttons**

Save buttons should use the canonical `button-primary` styling: `bg-[var(--color-accent)] text-[var(--color-on-accent)] font-bold rounded-lg`.

**Step 3: Run TypeScript validation**

Run: `pnpm --filter @pockt/web check`
Expected: PASS.

---

### Task 5: End-to-End Validation & Visual Smoke Test

**Objective:** Execute Playwright E2E test suite across all 3 viewports to guarantee 0 regressions on login, theme toggling, quick add, responsive widths, and page loads.

**Files:**
- Test: `apps/web/tests/ui.spec.ts`

**Step 1: Run frontend test suite**

Run: `pnpm --filter @pockt/web test` (or `pnpm test:web`)
Expected: All 33 layout & theme tests pass.

**Step 2: Verify zero horizontal overflow across breakpoints**

Verify mobile 320px–412px, tablet 768px, and desktop 1280px pass with zero horizontal scrollbar.

**Step 3: Prepare commit**

Run: `git status`
Review changes strictly within scope.
