# Architecture Decision Record
# ADR-003: Cross-Domain Bridge Architecture

## Status

Accepted

---

## Date

October 2026

---

## Related ADRs

- ADR-001: Hosting & Runtime Architecture Strategy
- ADR-002: Domain Separation Architecture

---

# Context

Following ADR-002, Rock The Western World formally established three isolated functional domains:
1. **The Trophy Room:** Digital reading vault (CBZ, EPUB, PDF), offline OPFS storage, and reading progress tracking.
2. **The Ledger:** Private reflective life architecture, temporal horizons (Daily, Weekly, Monthly, Compass), and habit matrices.
3. **The Broadsheet & Editorial Studio:** Public American periodical publishing, cultural reviews, newsletter dispatches, and TipTap WYSIWYG drafting.

While domain isolation eliminated the 2,384-line monolithic coupling in `src/app/journal/page.tsx`, the platform's overarching product vision relies on a cohesive authorial workflow:

$$\text{Read} \longrightarrow \text{Reflect} \longrightarrow \text{Write} \longrightarrow \text{Publish}$$

Without formal cross-domain communication patterns, developers might be tempted to directly import components or state hooks across domain boundaries (e.g., importing `TipTapEditor` or `useStudioState` inside `src/features/ledger`), which would re-introduce the exact circular dependencies and architectural rot that ADR-002 resolved.

---

# Decision

The platform adopts a **Contract-First Cross-Domain Bridge Architecture**.

All inter-domain data exchanges must conform to four strict architectural invariants:

### 1. Zero Direct Cross-Domain Imports
- Components in `src/features/ledger` must **never** import components or state hooks from `src/features/studio`.
- Components in `src/features/studio` must **never** import components or state hooks from `src/features/ledger`.
- Components in `src/features/trophy-room` must **never** import components or state hooks from `src/features/ledger` or `src/features/studio`.

### 2. Shared Bridge Contracts in `src/features/shared/`
All cross-domain communication payloads, types, and serialization utilities must reside exclusively in:
`src/features/shared/types/bridge.ts`

These payloads are plain TypeScript interfaces representing unidirectional, immutable value objects.

### 3. Orchestrator-Mediated Event Delegation
When a user interaction in one workspace requires an action in another workspace (such as clicking *"Seed to Essay"* in the Ledger):
1. The originating domain component emits a typed event through its workspace props interface (e.g., `onSeedToEssay(seed: EssaySeedPayload)`).
2. The thin page orchestrator (`src/app/journal/page.tsx`) intercepts the event.
3. The orchestrator coordinates the state transition: flushes any dirty state in the originating domain, calls the ingestion handler on the target domain hook (e.g., `studioState.createSeedDraft(seed)`), and updates the workspace mode (`workspaceMode = 'editorial'`).

### 4. Route-Param Fallback for Detached Workspaces
For detached routes (e.g., navigating from `/trophy-room` to `/journal`), cross-domain bridges use standard URL search parameters or session storage keys (e.g., `/journal?mode=editorial&reviewBookId=...`) resolved upon mounting.

---

# Data Contracts Specification

### Bridge 1: Reflect → Write (`EssaySeedPayload`)
Transfers an observation from Daily Triad (`Working Thought`, `Bright Spot`, `Calibration`) into a fresh Broadsheet draft:
```typescript
export interface EssaySeedPayload {
  text: string;
  sourceDateKey: string;
  sourceField: 'working_thought' | 'bright_spot' | 'calibration';
}
```

### Bridge 2: Read → Reflect (`ReadingDeckItem`)
Exposes active reading progress from Trophy Room to the Daily Ledger habit rail:
```typescript
export interface ReadingDeckItem {
  bookId: string;
  title: string;
  series?: string;
  issueNumber?: number;
  format: 'cbz' | 'epub' | 'pdf';
  currentPage: number;
  totalPages: number;
  progressPercent: number;
  coverUrl?: string | null;
  lastReadAt?: string;
}
```

### Bridge 3: Read → Write (`ReviewBridgePayload`)
Translates rich book/comic metadata from Trophy Room into the Editorial Studio Review Craft panel:
```typescript
export interface ReviewBridgePayload {
  entryType: 'book_review' | 'comic_review';
  selectedDesk: 'gallery' | 'logbook';
  selectedCategory: string;
  title: string;
  metadata: Record<string, any>;
}
```

---

# Consequences

### Positive
- **Guaranteed Domain Purity:** Ledger and Studio remain 100% independently testable and maintainable.
- **Zero Circular Dependencies:** TypeScript compiler enforces compile-time boundary integrity.
- **Clear Flow of Control:** The orchestrator in `journal/page.tsx` remains the single source of truth for workspace transitions.
- **Natural Flywheel Ergonomics:** The author can move effortlessly from reading to reflecting to writing without data re-entry.

### Negative / Trade-offs
- Adding a new cross-domain capability requires declaring a payload type in `src/features/shared/types/bridge.ts` and threading props through the workspace shell rather than calling an internal function directly.

---

# Decision Outcome

Accepted.

ADR-003 governs all feature development under Sprint 1 and future cross-domain integrations.
