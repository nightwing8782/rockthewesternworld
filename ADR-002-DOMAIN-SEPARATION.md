# Architecture Decision Record
# ADR-002: Domain Separation Architecture

## Status

Accepted

---

## Date

October 2026

---

## Related ADRs

- ADR-001 Hosting & Runtime Architecture Strategy

---

# Context

Following completion of Phase 1 Security Hardening, the platform underwent a comprehensive domain inventory analysis.

The audit revealed that Rock The Western World already consisted of three mature functional domains:

1. Trophy Room
2. Ledger
3. Broadsheet

However, significant implementation coupling existed within `src/app/journal/page.tsx`.

---

# Decision

The platform formally adopts a three-domain architecture:

- Trophy Room
- Ledger
- Broadsheet

Editorial tooling exists as the Studio domain supporting Broadsheet publication workflows.

---

# Domain Definitions

## Trophy Room

Private digital reading environment.

Responsibilities:
- Comic library
- EPUB library
- PDF library
- Reading progress
- Metadata management
- Offline reading

## Ledger

Private reflection and planning environment.

Responsibilities:
- Daily Ledger
- Weekly Rhythm
- Monthly Horizon
- Compass
- Habit tracking
- Reflection prompts

Data scope:
- status = private_log
- entry_type = personal_ledger

## Broadsheet

Public publishing platform.

Responsibilities:
- Essays
- Reviews
- Commentary
- Archive
- Newsletter
- RSS
- SEO

---

# Architectural Principles

1. Code structure should mirror product structure.
2. Private reflection and public publishing are separate concerns.
3. Domain ownership must be explicit.
4. Shared functionality belongs in a dedicated shared layer.

---

# Results

Before:
- journal/page.tsx ~2384 lines
- Mixed responsibilities

After:
- journal/page.tsx ~134 lines
- Shared, Ledger, Studio, and Trophy Room boundaries established

---

# Future Direction

The platform supports the workflow:

Read → Reflect → Write → Publish

Represented by:

Trophy Room → Ledger → Broadsheet

Future work should strengthen connections between domains rather than pursue major structural refactoring.

---

# Decision Outcome

Accepted.

The three-domain architecture is the authoritative conceptual model for Rock The Western World.
