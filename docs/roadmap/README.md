# Scoreboard Manager - Product Roadmap

This document outlines the planned features and implementation phases for transitioning Scoreboard Manager to an open-source project with a SaaS monetization model.

## Overview

### Business Model

- **Open Source License:** AGPL v3
- **Self-hosted:** Full functionality, no restrictions
- **SaaS (Hosted):** Freemium model with Supporter tier

### Payment Provider

- **LemonSqueezy** (Merchant of Record - handles global taxes)
- **Pay What You Want** model with minimums

### Pricing

| Plan    | Minimum  | Notes                           |
| ------- | -------- | ------------------------------- |
| Monthly | $5/month | Pay what you want above minimum |
| Yearly  | $50/year | ~2 months free (17% discount)   |

### Appreciation Tiers

| Monthly Amount | Tier          | Badge | Feature Access         |
| -------------- | ------------- | ----- | ---------------------- |
| $0             | Free          | -     | Basic features         |
| $5 - $9        | Supporter     | 🙌    | All Supporter features |
| $10 - $24      | Champion      | 🏆    | All Supporter features |
| $25 - $49      | Legend        | 🌟    | All Supporter features |
| $50+           | Hall of Famer | 👑    | All Supporter features |

> **Note:** All paying tiers ($5+) receive the same feature access. The appreciation tiers (Supporter, Champion, Legend, Hall of Famer) are recognition levels based on contribution amount, not feature gates.

## Free vs Supporter Comparison

| Feature                    | Free          | Supporter ($5+/mo)          |
| -------------------------- | ------------- | --------------------------- |
| Public scoreboards         | 2 max         | Unlimited                   |
| Private scoreboards        | ❌            | ✅ Unlimited                |
| Entries per scoreboard     | 50 max        | Unlimited                   |
| History snapshots          | 10 max        | 100 max                     |
| Themes                     | All presets   | All presets + Custom        |
| "Powered by" badge (embed) | ✅ Shown      | ❌ Hidden                   |
| "Created by" attribution   | Name only     | Name + Tier Badge           |
| Kiosk Mode                 | ❌            | ✅                          |
| Teams & Collaboration      | ❌            | ✅                          |
| Support                    | GitHub Issues | GitHub Issues + Email (48h) |

## Implementation Phases

| Phase | Name                                                               | Priority  | Status      |
| ----- | ------------------------------------------------------------------ | --------- | ----------- |
| 1a    | [License & Public Pages](./phase-1a-license-public-pages.md)       | 🔴 High   | ✅ Done     |
| 1b    | [LemonSqueezy Integration](./phase-1b-lemonsqueezy-integration.md) | 🔴 High   | ✅ Done     |
| 1c    | [Supporter/Free Limits](./phase-1c-supporter-free-limits.md)       | 🔴 High   | ✅ Done     |
| 1d    | [Supporter Tiers & Recognition](./phase-1d-supporter-tiers.md)     | 🔴 High   | Not Started |
| 1e    | [Admin Management Pages](./phase-1e-admin-management.md)           | 🔴 High   | Not Started |
| 2     | [Embed Branding](./phase-2-embed-branding.md)                      | 🔴 High   | Not Started |
| 3     | [Teams & Collaboration](./phase-3-teams-collaboration.md)          | 🟡 Medium | Not Started |
| 4     | [Kiosk/TV Mode](./phase-4-kiosk-mode.md)                           | � Medium | ✅ Done     |
| 5     | [Time Machine](./phase-5-time-machine.md)                          | 🟢 Lower  | Not Started |

## Existing Features (Already Implemented)

These features already exist in the codebase:

- ✅ **Theme System** - 6 presets (light, dark, transparent, high-contrast, minimal, custom) with 21+ customizable color properties
- ✅ **Custom Theme Builder** - Full color picker with RGBA/transparency support
- ✅ **Embed View** - Responsive iframe embed at `/embed/[id]`
- ✅ **Real-time Updates** - Supabase real-time subscriptions
- ✅ **Time-based Scores** - Multiple time formats (hh:mm, mm:ss, etc.)
- ✅ **CSV Import** - Bulk entry import
- ✅ **Invitation System** - User invitations with status tracking

## Future Features (Backlog)

These features have been discussed but are not yet planned for implementation:

- Data export (CSV/JSON)
- Score change notifications
- PowerPoint slide support (Kiosk Mode)
- Custom domains
- Custom logo on scoreboards
- API access
- Webhooks
- Analytics dashboard
