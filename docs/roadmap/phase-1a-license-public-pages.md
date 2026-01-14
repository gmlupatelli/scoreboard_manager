# Phase 1a: License & Public Pages

**Priority:** 🔴 High  
**Dependencies:** None  
**Estimated Scope:** Small-Medium

## Overview

Add AGPL v3 license and update all public-facing pages to reflect the transition from a closed product to an open-source project with a hosted SaaS option.

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
Redesign the landing page to communicate:
1. This is an open-source project (AGPL v3)
2. Users can self-host for free with full functionality
3. A hosted SaaS option is available with free and Pro tiers
4. "Pay What You Want" pricing model

**Acceptance Criteria:**
- [ ] Clear messaging about open-source nature
- [ ] Link to GitHub repository prominently displayed
- [ ] Self-hosting instructions or link to docs
- [ ] SaaS value proposition (convenience, no setup, support)
- [ ] Pricing preview or link to pricing page
- [ ] Call-to-action for both self-host and SaaS signup

**Technical Notes:**
- Update `src/app/page.tsx` or equivalent landing page component
- Consider adding GitHub stars badge
- Add "Fork on GitHub" or "View Source" button

---

### Issue 1a.3: Create Pricing Page

**Title:** Create pricing page with Free vs Pro comparison

**Description:**
Create a dedicated pricing page that clearly shows:
1. Free tier features and limitations
2. Pro tier features and benefits
3. "Pay What You Want" model explanation
4. Appreciation tiers with badges
5. Self-hosting as an alternative

**Acceptance Criteria:**
- [ ] Route `/pricing` created
- [ ] Free vs Pro comparison table
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
- Standard themes
- Community support (GitHub Issues)

Pro Tier ($5+/month or $50+/year):
- Unlimited public scoreboards
- Unlimited private scoreboards
- Unlimited entries
- Custom themes
- No "Powered by" badge
- Supporter badge & recognition
- Kiosk/TV Mode
- Team collaboration
- Priority email support

Appreciation Tiers:
- $5-9/mo: Supporter 🙌
- $10-24/mo: Champion 🏆
- $25-49/mo: Legend 🌟
- $50+/mo: Hall of Famer 👑
```

**Technical Notes:**
- Create `src/app/pricing/page.tsx`
- Reuse existing UI components where possible
- Make comparison table responsive

---

### Issue 1a.4: Update About Page

**Title:** Update about page with open source information

**Description:**
Update the about page to include:
1. Project history and mission
2. Open source philosophy
3. Contribution guidelines link
4. Team/maintainer information
5. Link to supporters page

**Acceptance Criteria:**
- [ ] Open source mission statement
- [ ] Link to GitHub repository
- [ ] Link to CONTRIBUTING.md (if exists)
- [ ] Acknowledgment of contributors
- [ ] Link to supporters page

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
Update the site footer and main navigation to include:
1. Link to GitHub repository
2. Link to pricing page
3. Link to supporters page (when implemented)
4. License information

**Acceptance Criteria:**
- [ ] GitHub link in footer with icon
- [ ] Pricing link in navigation
- [ ] License mention in footer (e.g., "Open source under AGPL v3")
- [ ] Consistent navigation across all pages
