# Phase 1a: License & Public Pages

**Priority:** 🔴 High  
**Dependencies:** None  
**Estimated Scope:** Small-Medium

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
- [ ] `LICENSE` file added to repository root
- [ ] License is valid AGPL v3 text
- [ ] README updated with license badge and section
- [ ] All source files have appropriate license header (optional, discuss)

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
- [ ] Add "Open Source" badge/banner prominently displayed
- [ ] Link to GitHub repository with star count badge
- [ ] "Fork on GitHub" or "View Source" button
- [ ] Self-hosting section with link to documentation
- [ ] SaaS value proposition (convenience, no setup, support)
- [ ] Pricing preview or link to pricing page
- [ ] Call-to-action for both self-host and SaaS signup

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
- [ ] Route `/pricing` created
- [ ] Free vs Supporter comparison table
- [ ] Clear display of minimums ($5/month, $50/year)
- [ ] Appreciation tiers explained with badges
- [ ] FAQ section addressing common questions
- [ ] CTA buttons for signup/upgrade
- [ ] Note about self-hosting option

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
- [ ] Add "Open Source" section explaining the philosophy
- [ ] Link to GitHub repository
- [ ] Link to CONTRIBUTING.md
- [ ] Acknowledgment of contributors (or link to GitHub contributors)
- [ ] Link to supporters page

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
- [ ] `CONTRIBUTING.md` file added to repository root
- [ ] Development setup instructions
- [ ] Coding standards documented
- [ ] PR process explained
- [ ] Issue templates referenced or created

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
- [ ] GitHub link in footer with icon
- [ ] Pricing link in footer under "Product" section
- [ ] Supporters link in footer (when implemented)
- [ ] License mention in footer (e.g., "Open source under AGPL v3")
- [ ] Add pricing link to header navigation for unauthenticated users

**Technical Notes:**
- Update `src/components/common/Footer.tsx`
- Update `src/components/common/Header.tsx`
- Use existing Icon component for GitHub icon
