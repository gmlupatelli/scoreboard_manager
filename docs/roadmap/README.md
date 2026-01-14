# Scoreboard Manager - Product Roadmap

This document outlines the planned features and implementation phases for transitioning Scoreboard Manager to an open-source project with a SaaS monetization model.

## Overview

### Business Model
- **Open Source License:** AGPL v3
- **Self-hosted:** Full functionality, no restrictions
- **SaaS (Hosted):** Freemium model with Pro tier

### Payment Provider
- **LemonSqueezy** (Merchant of Record - handles global taxes)
- **Pay What You Want** model with minimums

### Pricing
| Plan | Minimum | Notes |
|------|---------|-------|
| Monthly | $5/month | Pay what you want above minimum |
| Yearly | $50/year | ~2 months free (17% discount) |

### Appreciation Tiers
| Monthly Amount | Tier | Badge |
|----------------|------|-------|
| $5 - $9 | Supporter | 🙌 |
| $10 - $24 | Champion | 🏆 |
| $25 - $49 | Legend | 🌟 |
| $50+ | Hall of Famer | 👑 |

## Free vs Pro Comparison

| Feature | Free | Pro |
|---------|------|-----|
| Public scoreboards | 2 max | Unlimited |
| Private scoreboards | ❌ | ✅ Unlimited |
| Entries per scoreboard | 50 max | Unlimited |
| Total scoreboards | Unlimited | Unlimited |
| Themes | Standard only | Custom |
| "Powered by" badge (embed) | ✅ Shown | ❌ Hidden |
| "Created by" + Pro badge | Name only | Name + Tier Badge |
| Kiosk Mode | ❌ | ✅ |
| Teams & Collaboration | ❌ | ✅ |
| Support | GitHub Issues | GitHub Issues + Email (48h) |

## Implementation Phases

| Phase | Name | Priority | Status |
|-------|------|----------|--------|
| 1a | [License & Public Pages](./phase-1a-license-public-pages.md) | 🔴 High | Not Started |
| 1b | [LemonSqueezy Integration](./phase-1b-lemonsqueezy-integration.md) | 🔴 High | Not Started |
| 1c | [Pro/Free Limits](./phase-1c-pro-free-limits.md) | 🔴 High | Not Started |
| 1d | [Supporter Tiers & Recognition](./phase-1d-supporter-tiers.md) | 🔴 High | Not Started |
| 2 | [Embed & Theming](./phase-2-embed-theming.md) | 🔴 High | Not Started |
| 3 | [Teams & Collaboration](./phase-3-teams-collaboration.md) | 🟡 Medium | Not Started |
| 4 | [Kiosk/TV Mode](./phase-4-kiosk-mode.md) | 🟡 Medium | Not Started |
| 5 | [Time Machine](./phase-5-time-machine.md) | 🟢 Lower | Not Started |

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
