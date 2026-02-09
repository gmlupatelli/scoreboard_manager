# Dependency Upgrade Policy

This document outlines the strategy for managing dependencies in the Scoreboard Manager project.

## Overview

We use a **manual-first** approach to dependency management:

- **No automated version-bump PRs** — Dependabot PRs are disabled (`open-pull-requests-limit: 0`)
- **Security alerts remain active** — Dependabot Security Advisories still flag vulnerabilities
- **Weekly audit workflow** — A GitHub Actions workflow (`dependency-check.yml`) runs `npm audit` and `npm outdated`, then creates/updates a GitHub Issue with the findings
- **All updates are manual** — review changelogs, test locally, and apply changes yourself

## Dependabot Configuration

Dependabot is configured in `.github/dependabot.yml` in **alerts-only mode**:

### What Dependabot Does

- ✅ **Security Alerts** — flags known vulnerabilities in the Security tab
- ✅ **Vulnerability Advisories** — shown on the repository's Security > Advisories page
- ❌ **Version-bump PRs** — disabled (`open-pull-requests-limit: 0`)

### Schedule

- **Frequency**: Weekly (Mondays at 6:00 AM ET)
- **PR Limit**: 0 (no automated PRs)

## Weekly Dependency Check Workflow

A GitHub Actions workflow (`.github/workflows/dependency-check.yml`) runs every Monday at 7:00 AM ET and:

1. Runs `npm audit` against production and all dependencies
2. Runs `npm outdated --long` to list available updates
3. Creates or updates a GitHub Issue titled **"📋 Weekly Dependency Report"** with the full findings
4. If everything is up to date and clean, no issue is created

You can also trigger the workflow manually from the Actions tab.

### When to Upgrade

1. A security vulnerability is flagged (see response timeline below)
2. Current version reaches End of Life (EOL)
3. New version has critical features we need
4. Weekly report shows a meaningful number of outdated packages

## Update Workflow

All dependency updates are applied manually. The process varies by risk level:

### Patch Updates (x.x.PATCH)

- **Risk**: Very Low
- **Action**: Review weekly report, update locally, verify CI passes
- **Examples**: Bug fixes, security patches
- **Command**: `npm update` or `npm install <package>@<version>`

### Minor Updates (x.MINOR.x)

- **Risk**: Low
- **Action**: Review changelog, update locally, run tests, create PR
- **Examples**: New features (backward compatible)

### Major Updates (MAJOR.x.x)

- **Risk**: High
- **Action**: Dedicated branch with thorough testing
- **Process**:
  1. Create feature branch: `feat/upgrade-{package}-v{version}`
  2. Review migration guide and changelog
  3. Update package and fix breaking changes
  4. Run full E2E test suite
  5. Test manually in staging environment
  6. Create PR with detailed notes

## Security Updates

### GitHub Security Advisories

- Dependabot Security Advisories are **always enabled**
- Vulnerabilities appear in the repository's Security tab and in the weekly audit issue
- No automated PRs are created — you apply the fix manually after reviewing

### Response Timeline

| Severity | Response Time | Action                        |
| -------- | ------------- | ----------------------------- |
| Critical | 24 hours      | Immediate patch or mitigation |
| High     | 48 hours      | Priority review and merge     |
| Medium   | 1 week        | Standard review process       |
| Low      | 2 weeks       | Batch with regular updates    |

## Testing Requirements

Before merging any dependency update:

### Automated Checks (Required)

- [ ] CI pipeline passes (lint, type-check, build)
- [ ] E2E tests pass (Chrome, Firefox)
- [ ] No new TypeScript errors
- [ ] No console errors in browser

### Manual Checks (Major Updates Only)

- [ ] Review changelog for breaking changes
- [ ] Test critical user flows manually
- [ ] Verify no visual regressions
- [ ] Check bundle size impact

## Monitoring

### Tools

- **Dependabot Security Alerts**: Vulnerability notifications (no PRs)
- **Dependency Check Workflow**: Weekly `npm audit` + `npm outdated` → GitHub Issue
- **npm audit**: Local security scanning
- **CodeQL**: Code scanning for vulnerabilities

### Regular Review

- Weekly: Review the auto-generated dependency report issue
- Monthly: Check for EOL packages
- Quarterly: Evaluate major version upgrades

## Key Dependencies

| Package      | Current | LTS/Support | Notes                          |
| ------------ | ------- | ----------- | ------------------------------ |
| Next.js      | 14.x    | Active      | Upgrade to 15.x when stable    |
| React        | 18.x    | Active      | Upgrade to 19.x with Next.js   |
| TypeScript   | 5.x     | Active      | Follow Next.js recommendations |
| Supabase JS  | 2.x     | Active      | Monitor for v3 release         |
| Tailwind CSS | 3.x     | Active      | Upgrade to 4.x when stable     |

## Commands

```bash
# Check for outdated packages
npm outdated

# Security audit
npm audit

# Fix security issues (patch only)
npm audit fix

# Update all patch versions
npm update

# Check specific package versions
npm view {package} versions
```

## References

- [Dependabot Configuration](../.github/dependabot.yml)
- [Dependency Check Workflow](../.github/workflows/dependency-check.yml)
- [GitHub Dependabot Docs](https://docs.github.com/en/code-security/dependabot)
- [Semantic Versioning](https://semver.org/)
- [npm Security Advisories](https://www.npmjs.com/advisories)
