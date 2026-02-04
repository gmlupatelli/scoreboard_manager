# Phase 1a: License & Public Pages

**Priority:** 🔴 High  
**Dependencies:** None  
**Estimated Scope:** Small-Medium  
**Status:** ✅ Done

## Overview

Add AGPL v3 license and update all public-facing pages to reflect the transition from a closed product to an open-source project with a hosted SaaS option.

## Existing Components to Update

The following components already exist and need modification:

- `src/app/page.tsx` - Landing page (needs open source messaging)
- `src/app/about/page.tsx` - About page (needs open source philosophy)
- `src/components/common/Header.tsx` - Header navigation (needs pricing link)
- `src/components/common/Footer.tsx` - Footer (needs GitHub link, license info)

---

## Issues

### Issue 1a.1: Add AGPL v3 License

**Title:** Add AGPL v3 open source license

**Description:**
Add the GNU Affero General Public License v3 to the repository. This license:

- Allows free use, modification, and distribution
- Requires derivative works to use the same license
- Requires network use (SaaS) to provide source code access
- Protects the project from competitors hosting the code without contributing back

**Acceptance Criteria:**

- [x] `LICENSE` file added to repository root
- [x] License is valid AGPL v3 text
- [x] README updated with license badge and section
- [x] All source files have appropriate license header (optional, discuss)

**Technical Notes:**

- Use official AGPL v3 text from https://www.gnu.org/licenses/agpl-3.0.txt
- Add license badge to README: `[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)`

---

### Issue 1a.2: Update Landing Page

**Title:** Update landing page for open source + SaaS model

**Description:**
Update the existing landing page (`src/app/page.tsx`) to communicate:

1. This is an open-source project (AGPL v3)
2. Users can self-host for free with full functionality
3. A hosted SaaS option is available with free and Supporter tiers
4. "Pay What You Want" pricing model

**Current State:**

- Landing page exists with feature cards, benefits, and testimonials
- Already mentions "Team Collaboration" as a feature (keep as aspirational)
- No open source messaging or GitHub links

**Acceptance Criteria:**

- [x] Add "Open Source" badge/banner prominently displayed
- [x] Link to GitHub repository with star count badge
- [x] "Fork on GitHub" or "View Source" button
- [x] Self-hosting section with link to documentation
- [x] SaaS value proposition (convenience, no setup, support)
- [x] Pricing preview or link to pricing page
- [x] Call-to-action for both self-host and SaaS signup

**Technical Notes:**

- Update `src/app/page.tsx`
- Add GitHub stars badge using shields.io
- Consider adding a "Why Open Source?" section

---

### Issue 1a.3: Create Pricing Page

**Title:** Create pricing page with Free vs Supporter comparison

**Description:**
Create a dedicated pricing page that clearly shows:

1. Free tier features and limitations
2. Supporter tier features and benefits
3. "Pay What You Want" model explanation
4. Appreciation tiers with badges
5. Self-hosting as an alternative

**Acceptance Criteria:**

- [x] Route `/pricing` created
- [x] Free vs Supporter comparison table
- [x] Clear display of minimums ($5/month, $50/year)
- [x] Appreciation tiers explained with badges
- [x] FAQ section addressing common questions
- [x] CTA buttons for signup/upgrade
- [x] Note about self-hosting option

**Content to Include:**

```
Free Tier:
- 2 public scoreboards
- 50 entries per scoreboard
- 10 history snapshots per scoreboard
- All theme presets
- Community support (GitHub Issues)

Supporter Tier ($5+/month or $50+/year):
- Unlimited public scoreboards
- Unlimited private scoreboards
- Unlimited entries
- 100 history snapshots per scoreboard
- Custom theme builder
- No "Powered by" badge on embeds
- Tier badge & recognition
- Kiosk/TV Mode
- Team collaboration
- Priority email support (48h response)

Appreciation Tiers (all receive same features):
- $5-9/mo: Supporter 🙌
- $10-24/mo: Champion 🏆
- $25-49/mo: Legend 🌟
- $50+/mo: Hall of Famer 👑
```

**Technical Notes:**

- Create `src/app/pricing/page.tsx`
- Reuse existing UI components (Button, Icon, Header, Footer)
- Make comparison table responsive
- Add toggle for monthly/yearly pricing

---

### Issue 1a.4: Update About Page

**Title:** Update about page with open source information

**Description:**
Update the existing about page (`src/app/about/page.tsx`) to include open source information.

**Current State:**

- About page exists with mission, features, and story sections
- No mention of open source or GitHub

**Acceptance Criteria:**

- [x] Add "Open Source" section explaining the philosophy
- [x] Link to GitHub repository
- [x] Link to CONTRIBUTING.md
- [x] Acknowledgment of contributors (or link to GitHub contributors)
- [x] Link to supporters page

**Technical Notes:**

- Update `src/app/about/page.tsx`
- Add new section between existing sections

---

### Issue 1a.5: Create CONTRIBUTING.md

**Title:** Add contribution guidelines

**Description:**
Create a CONTRIBUTING.md file to guide potential contributors on:

1. How to set up the development environment
2. Code style and conventions
3. How to submit issues
4. How to submit pull requests
5. Code review process

**Acceptance Criteria:**

- [x] `CONTRIBUTING.md` file added to repository root
- [x] Development setup instructions
- [x] Coding standards documented
- [x] PR process explained
- [x] Issue templates referenced or created

---

### Issue 1a.6: Update Footer and Navigation

**Title:** Update site footer and navigation for open source

**Description:**
Update the existing footer (`src/components/common/Footer.tsx`) and header (`src/components/common/Header.tsx`) to include open source links.

**Current State:**

- Footer has Product, Company, and Legal sections
- No GitHub link or license information
- Header has basic navigation (Dashboard, Manage Scoreboards when authenticated)
- No pricing link in navigation

**Acceptance Criteria:**

- [x] GitHub link in footer with icon
- [x] Pricing link in footer under "Product" section
- [x] Supporters link in footer (when implemented)
- [x] License mention in footer (e.g., "Open source under AGPL v3")
- [x] Add pricing link to header navigation for unauthenticated users

**Technical Notes:**

- Update `src/components/common/Footer.tsx`
- Update `src/components/common/Header.tsx`
- Use existing Icon component for GitHub icon
