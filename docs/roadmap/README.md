# Scoreboard Manager - Product Roadmap

This document outlines the planned features and implementation phases for transitioning Scoreboard Manager to an open-source project with a SaaS monetization model.

## Overview

### Business Model

- **Open Source License:** AGPL v3
- **Self-hosted:** Full functionality, no restrictions
- **SaaS (Hosted):** Freemium model with Supporter tier

### Payment Provider

- **LemonSqueezy** (Merchant of Record - handles global taxes)
- **Fixed-tier pricing** (4 tiers with monthly/yearly options)

### Pricing

| Tier          | Monthly  | Yearly   | Badge |
| ------------- | -------- | -------- | ----- |
| Supporter     | $4/mo    | $40/yr   | 🙌     |
| Champion      | $8/mo    | $80/yr   | 🏆     |
| Legend        | $23/mo   | $230/yr  | 🌟     |
| Hall of Famer | $48/mo   | $480/yr  | 👑     |

> **Note:** Yearly plans offer approximately 2 months free (16-17% discount).

### Appreciation Tiers

All paying tiers receive the same feature access. The tiers are recognition levels based on contribution amount:

| Tier          | Badge | Feature Access         |
| ------------- | ----- | ---------------------- |
| Free          | -     | Basic features         |
| Supporter     | 🙌     | All Supporter features |
| Champion      | 🏆     | All Supporter features |
| Legend        | 🌟     | All Supporter features |
| Hall of Famer | 👑     | All Supporter features |

> **Note:** All paying tiers ($4+) receive the same feature access. The appreciation tiers are recognition levels, not feature gates.

## Free vs Supporter Comparison

| Feature                    | Free          | Supporter ($4+/mo)          |
| -------------------------- | ------------- | --------------------------- |
| Public scoreboards         | 2 max         | Unlimited                   |
| Private scoreboards        | ❌            | ✅ Unlimited                |
| Entries per scoreboard     | 50 max        | Unlimited                   |
| History snapshots          | 10 max        | 100 max                     |
| Themes                     | All presets   | All presets + Custom        |
| "Powered by" badge (embed) | ✅ Shown      | ❌ Hidden                   |
| Supporters page listing    | ❌            | ✅ Optional (can opt-out)   |
| Kiosk Mode                 | ❌            | ✅                          |
| Teams & Collaboration      | ❌            | ✅                          |
| Support                    | GitHub Issues | GitHub Issues + Email (48h) |

## Completed Phases (Archived)

The following phases have been successfully implemented and archived:
- ✅ **Phase 1a** - License & Public Pages
- ✅ **Phase 1b** - LemonSqueezy Integration
- ✅ **Phase 1c** - Supporter/Free Limits
- ✅ **Phase 1d** - Supporter Tiers & Recognition (partial - database layer complete)
- ✅ **Phase 1e** - Admin Management Pages (partial - core features complete)
- ✅ **Phase 2** - Embed Branding
- ✅ **Phase 4** - Kiosk/TV Mode (originally)
- ✅ **Phase 6** - Unit Tests

## Active Implementation Phases

| Phase | Name                                                       | Priority  | Status      |
| ----- | ---------------------------------------------------------- | --------- | ----------- |
| 1     | [CSV Export](./phase-1-csv-export.md)                      | 🟡 Medium | ✅ Completed |
| 2     | [Supporter Recognition](./phase-2-supporter-recognition.md) | 🔴 High   | ✅ Completed |
| 3     | [Admin Enhancements](./phase-3-admin-enhancements.md)      | 🟡 Medium | Not Started |
| 4     | [Dynamic Pricing](./phase-4-dynamic-pricing.md)            | 🟢 Low    | Not Started |
| 5     | [Time Machine](./phase-5-time-machine.md)                  | 🟢 Lower  | Not Started |
| 6     | [Teams & Collaboration](./phase-6-teams-collaboration.md)  | 🟡 Medium | Not Started |

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

- Score change notifications
- PowerPoint slide support (Kiosk Mode)
- Custom domains
- Custom logo on scoreboards
- API access
- Webhooks
- Analytics dashboard
- JSON export format
