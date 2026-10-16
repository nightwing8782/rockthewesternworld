# Domain Architecture Specification
**Platform:** Rock The Western World  
**Date:** October 2026  
**Document:** DOMAIN-ARCHITECTURE.md  
**Status:** Architecture Proposal • Pending Review  

---

## 1. Architectural Mission & Core Principles

The Rock The Western World platform currently operates as a unified system serving three distinct functional missions:
1. **The Broadsheet:** A public-facing traditional American periodical with editorial essays, arts critique, and an email newsletter.
2. **The Trophy Room:** A private digital library vault for comics, manga, and books with in-browser readers and offline storage.
3. **The Ledger:** A private life architecture and multi-horizon planning studio (Daily, Weekly, Monthly, Compass).

### Architectural Boundaries
```
                            rockthewesternworld.com
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         ▼                            ▼                            ▼
   [ The Broadsheet ]        [ The Trophy Room ]            [ The Ledger ]
  • Public Periodical        • Pop-Art Vault Gate         • Private Life Studio
  • Editorial CMS Studio     • Comic & Book Shelf         • Daily / Weekly / Monthly
  • The Dispatch (Email)     • CBZ / EPUB / PDF Readers   • Annual Compass Roadmap
  • Route: /, /[slug]        • Route: /trophy-room        • Route: /journal?mode=ledger
```

### Constraints & Invariants
- **Zero Route Changes:** The canonical entry point for both the Ledger and the Editorial Studio remains `/journal`.
- **Zero Schema Changes:** The Supabase database schema (`public.entries`, `public.subscribers`, `public.trophy_books`, `public.trophy_progress`) remains untouched.
- **Zero UX Redesign:** The user-facing visual hierarchy, typography, colors (Passion Amber `#B45309` vs. Studio Blue `#1E40AF`), keyboard interactions, and auto-save indicators are preserved pixel-for-pixel.
- **Zero Feature Creep:** No new features or behavioral modifications will be introduced.

---

## 2. Target Directory Structure

The internal boundaries will be partitioned into isolated feature packages under `src/features/`:

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                      # Broadsheet Index
│   ├── [slug]/page.tsx               # Broadsheet Article Reader
│   ├── trophy-room/page.tsx          # Trophy Room Vault
│   └── journal/page.tsx              # Thin Orchestrator (~120 lines)
│
├── features/
│   ├── ledger/                       # THE LEDGER DOMAIN
│   │   ├── components/
│   │   │   ├── CompassRoadmapView.tsx
│   │   │   ├── MonthlyHorizonView.tsx
│   │   │   ├── WeeklyRhythmView.tsx
│   │   │   ├── DailyLedgerView.tsx
│   │   │   ├── LedgerHierarchyTree.tsx
│   │   │   ├── LedgerHorizonNav.tsx
│   │   │   └── ReflectionPromptBar.tsx
│   │   ├── hooks/
│   │   │   └── useLedgerState.ts     # Encapsulated Ledger state, date math & auto-save
│   │   ├── types.ts                  # Re-export / local ledger types
│   │   └── LedgerWorkspace.tsx       # Top-level Ledger boundary
│   │
│   ├── studio/                       # THE EDITORIAL STUDIO DOMAIN
│   │   ├── components/
│   │   │   ├── TipTapEditor.tsx
│   │   │   ├── ReviewCraftPanel.tsx
│   │   │   ├── EditorialPhotographyAccordion.tsx
│   │   │   ├── SocialPublishingStudio.tsx
│   │   │   ├── StudioSidebar.tsx     # Drafts, published & archive desk drawers
│   │   │   ├── modals/
│   │   │   │   ├── PromoteModal.tsx
│   │   │   │   ├── DispatchModal.tsx
│   │   │   │   └── AnalyticsModal.tsx
│   │   │   └── media/
│   │   │       ├── OpenAccessImageGallery.tsx
│   │   │       └── MediaRibbon.tsx
│   │   ├── hooks/
│   │   │   └── useStudioState.ts     # Encapsulated Editorial drafts, publishing & metadata
│   │   ├── types.ts                  # Editorial desk & review taxonomy types
│   │   └── StudioWorkspace.tsx       # Top-level Editorial Studio boundary
│   │
│   ├── shared/                       # CROSS-CUTTING RUNTIME UTILITIES
│   │   ├── components/
│   │   │   ├── StudioAuthGate.tsx    # Shared Confidential Atelier login form
│   │   │   ├── SaveStatusBadge.tsx   # Real-time auto-saving badge
│   │   │   └── WorkspaceHeader.tsx   # Top navigation & Passion/Editorial mode switcher
│   │   └── hooks/
│   │       └── useStudioAuth.ts      # Supabase auth session listener
│   │
│   └── trophy-room/                  # THE TROPHY ROOM DOMAIN
│       ├── components/               # (Existing shelf, hub, readers, modals)
│       └── hooks/
│           └── useTrophyLibrary.ts
│
├── lib/
│   ├── security/sanitize.ts          # Phase 1 Sanitization engine
│   ├── supabase/                     # Client & Server clients
│   └── trophy/                       # OPFS, Dexie, S3 helpers
└── types/
```

---

## 3. Boundary Contracts & State Decoupling

### A. The Ledger Domain Contract (`src/features/ledger`)
* **Responsibility:** Managing multi-horizon reflective planning and personal habit architecture.
* **State Ownership:**
  - Active horizon (`'daily' | 'weekly' | 'monthly' | 'compass'`).
  - Active date keys (`dateKey`, `weekKey`, `monthKey`, `year`).
  - Habit matrix, energy quadrant, daily triad, monthly gamechangers, weekly tasks.
  - Auto-save timer strictly targeting `status = 'private_log'` and `entry_type = 'personal_ledger'`.
* **Zero Leakage:** The Ledger will have **no knowledge** of publishing desks (The Commonwealth, The Gallery, The Logbook), Resend newsletters, review ratings, or social media thread generators.

### B. The Editorial Studio Domain Contract (`src/features/studio`)
* **Responsibility:** Managing editorial workflows, drafting, critique panels, publishing, and newsletter broadcasts.
* **State Ownership:**
  - Active draft/article (`status = 'draft' | 'published'`).
  - Desk & Category picker (`commonwealth`, `gallery`, `logbook`).
  - TipTap content and HTML/JSON synchronization.
  - Review Craft panel metadata (Book / Comic ratings, ISBN, credits).
  - Newsletter broadcast queue & subscriber states.
  - Auto-save timer strictly targeting `status = 'draft'` or `status = 'published'`.
* **Zero Leakage:** The Editorial Studio will have **no knowledge** of habit tracking, Wikipedia "On This Day" APIs, annual gamechangers, or compass core values.

### C. The Orchestrator (`src/app/journal/page.tsx`)
* **Responsibility:** Pure layout shell and route coordinator.
* **Code Size:** Reduced from **2,384 lines** down to **~120 lines**.
* **Logic:**
  1. Verifies authentication session via `<StudioAuthGate>`.
  2. Reads and manages `workspaceMode: 'ledger' | 'editorial'`.
  3. Renders shared top header with workspace switcher (`Passion Ledger` vs. `Editorial CMS`).
  4. Renders `<LedgerWorkspace>` or `<StudioWorkspace>` depending on active mode.
