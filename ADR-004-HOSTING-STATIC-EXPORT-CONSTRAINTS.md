# Architecture Decision Record
# ADR-004: Hosting & Static Export Constraints

## Status

**Accepted**

---

## Date

October 2026

---

## Related ADRs

- ADR-001: Hosting & Runtime Architecture Strategy
- ADR-002: Domain Separation Architecture
- ADR-003: Cross-Domain Bridges

---

# Context

Rock The Western World is hosted on SiteGround using an Apache-based shared hosting environment.

Deployment is performed via GitHub Actions and synchronizes the generated static export to SiteGround's `public_html` directory.

Current deployment pipeline:

```bash
npm run build
rsync -avz --delete out/ user@siteground:public_html/
```

Apache serves only the files that exist in `public_html`.

No Node.js runtime exists in production.

---

# Decision

Rock The Western World formally adopts a Static Export Deployment Model for production.

Required Next.js configuration:

```ts
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};
```

---

# Hosting Constraints

## Constraint 1: No Node Runtime

Production hosting does not execute `next start` or a custom Node server.

## Constraint 2: Exportable Routes Only

All public routes must successfully generate static HTML output.

Examples:

- `/`
- `/journal/`
- `/trophy-room/`
- `/[slug]/`

## Constraint 3: No Required Server API Routes

Production functionality must not depend upon `src/app/api/*` unless hosting strategy changes.

## Constraint 4: Static Compatibility First

When evaluating new platform features, the first architectural question shall be:

> Can this work within a static-export architecture?

---

# Security Header Policy

Security headers are managed through Apache in:

```text
public/.htaccess
```

Security headers must not be implemented through `async headers()` in `next.config.ts` while static export remains the approved deployment model.

---

# Deployment Invariant

Every release must satisfy:

```bash
npm run build
```

Verification Checklist:

- `out/` directory generated
- `out/index.html` exists
- `out/journal/index.html` exists
- `out/trophy-room/index.html` exists
- Article pages generated
- RSS generated
- Sitemap generated
- `.htaccess` copied into `out/`

---

# Operational Lesson

**Build Success ≠ Deployment Success.**

Release validation must verify deployment artifacts, not just successful builds.

---

# Future Reconsideration

This ADR remains authoritative until migration to a Node-capable hosting model, containerized infrastructure, or SSR-requiring architecture.

---

# Decision Outcome

**Accepted.**

Rock The Western World is a static-exported Next.js application deployed to SiteGround using the generated `out/` directory as the production artifact.
