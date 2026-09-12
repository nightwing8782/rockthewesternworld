# Rock The Western World • System Architecture, Keys & Integrations Record

This document serves as the master record of all integrated services, credentials, configuration keys, database schemas, and architectural components for **Rock The Western World** (`https://rockthewesternworld.com`).

---

## 1. Core Hosting & Deployment Infrastructure

| Property | Value / Configuration | Notes |
| :--- | :--- | :--- |
| **Live Domain** | `https://rockthewesternworld.com` | Production apex domain |
| **Hosting Provider** | SiteGround | Apache static export hosting with `.htaccess` rewrite rules |
| **GitHub Repository** | `https://github.com/nightwing8782/rockthewesternworld` | `main` branch |
| **Deployment Engine** | GitHub Actions (`.github/workflows/deploy.yml`) | Next.js Static Export (`output: 'export'`) automatically deployed on push |
| **Local Workspace** | `C:\Users\danbi\.gemini\antigravity\scratch\rock-the-western-world` | Project root |

---

## 2. Supabase Database & Author Authentication

| Setting | Value / Details |
| :--- | :--- |
| **Project URL** | `https://atbkwrwghrnsicwlrsfu.supabase.co` |
| **Publishable / Anon Key** | `sb_publishable_ZNlKCsHUjI288RknD4cKGA_unKTQRLv` |
| **Primary Tables** | 1. `entries`: Stores all public articles, working drafts, and private journals with JSONB metadata.<br/>2. `subscribers`: Stores registered newsletter subscribers (`email`, `status`, `created_at`). |
| **Authentication** | Supabase Auth via email/password used to lock and unlock the Studio (`/journal`). |
| **Client Implementation** | `@supabase/ssr` and `@supabase/supabase-js` (`src/lib/supabase/client.ts`). |

---

## 3. The Dispatch • Resend Email Newsletter API

| Setting | Value / Details |
| :--- | :--- |
| **Email Service Provider** | **Resend** (`https://resend.com`) |
| **API Key** | `re_cwmeHQyG_********************************` |
| **Verified Test Recipient** | `danbillingsster@gmail.com` |
| **Default Sender** | `Rock The Western World <onboarding@resend.dev>` |
| **Production Custom Domain Sender** | `Rock The Western World <dispatch@rockthewesternworld.com>` *(Available upon adding DNS records in Resend dashboard)* |
| **Dispatch Studio** | Modal in `/journal` to compose, preview Art Deco HTML emails, test-send, and broadcast to all Supabase subscribers. |
| **Anti-Spam Security** | 1. **Invisible Honeypot** (`website_url_verification`) off-screen field.<br/>2. **Timing Heuristic** (< 800ms bot instant submission drop).<br/>3. **RFC Email Regex Validation**. |

---

## 4. Privacy-Friendly Web Analytics (Umami)

| Setting | Value / Details |
| :--- | :--- |
| **Analytics Provider** | Umami Cloud (`https://cloud.umami.is`) |
| **Website ID** | `dcc3d041-035c-4ae2-b494-0dc3a21df101` |
| **Tracking Script URL** | `https://cloud.umami.is/script.js` |
| **Allowed Tracking Domains** | `rockthewesternworld.com` |
| **Public / Studio Share URL** | `https://cloud.umami.is/share/UzWCXvda5aJhSRrF` |
| **Studio Analytics Modal** | Integrated iframe dashboard accessible via the `[ Analytics ]` button in `/journal`. |

---

## 5. Media & Catalog Lookup APIs (Keyless & Open)

| Media Type | Provider & Endpoint | Implementation Notes |
| :--- | :--- | :--- |
| **Books & Literature** | **Open Library API** (`https://openlibrary.org/search.json?q=...`) | Fast lookup for author, cover art, ISBN, publication year, and publisher. |
| **Comics & Graphic Novels** | **Open Library API** + **Google Books API** fallback | Auto-populates comic series, writer, illustrator/artist, publisher, year, and cover art. |
| **Music & Records** | **Apple iTunes Search API** (`https://itunes.apple.com/search?term=...&entity=album`) | High-res 600x600 album artwork, artist, release year, label, and genre. |
| **Podcasts** | **Apple iTunes Search API** (`https://itunes.apple.com/search?term=...&entity=podcast`) | Podcast title, host/studio network, artwork, RSS feed URL, and category. |
| **Editorial Photography** | Curated Art Deco archive + Unsplash CDN | Categorized by Architecture, Jazz & Atmosphere, Vinyl & Books, Noir, and Typography. |

---

## 6. Environment Variables Reference (`.env.local`)

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://atbkwrwghrnsicwlrsfu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ZNlKCsHUjI288RknD4cKGA_unKTQRLv

# Umami Analytics
NEXT_PUBLIC_UMAMI_WEBSITE_ID=dcc3d041-035c-4ae2-b494-0dc3a21df101
NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js
NEXT_PUBLIC_UMAMI_DOMAINS=rockthewesternworld.com
NEXT_PUBLIC_UMAMI_SHARE_URL=https://cloud.umami.is/share/UzWCXvda5aJhSRrF

# Resend Email Newsletter API
NEXT_PUBLIC_RESEND_API_KEY=re_cwmeHQyG_********************************
RESEND_API_KEY=re_cwmeHQyG_********************************
```

---

## 7. Editorial Studio & Broadsheet Feature Map

### **Drafting Atelier (`/journal`)**
* **Collapsible Sidebar Drawer `[◧]`**: Toggleable drawer with 4 distinct archival tabs (`Drafts`, `Live`, `Private`, `Archive`) and delete trash buttons (`🗑`).
* **3-Way Segmented Status Switcher**: `[ Draft ]`, `[ 🔒 Private ]`, `[ 🌐 Live ]`.
* **Live Action Bar**: `[ View Live ]`, `[ ↺ Unpublish ]` (reverts published post to draft), `[ ✉ Dispatch Email ]`.
* **Review Craft Panel**: 1–5 star craft rating meters (Story/Script, Artwork/Visuals, Pacing/Tone, Historical Weight) and structured 3-act review generator.
* **Reflection Prompts**: 30 curated prompts categorized into 5 editorial themes with one-click blockquote insertion.
* **Branding Icon**: Custom faceted Art Deco **Gold Caret Diamond (`◆`)** with 3D gradient cuts on an obsidian dark base (`/icon.svg`, `/apple-icon.svg`, `/favicon.svg`).
* **SEO Schemas**: `schema.org/Review` and `schema.org/BlogPosting` rich JSON-LD data.
* **Masthead Location**: **Lexington, KY** drafting desk.
