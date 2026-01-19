# Dependency Upgrade Policy

This document outlines the strategy for managing dependencies in the Scoreboard Manager project.

## Overview

We use a balanced approach to dependency management:

- **Automated updates** for patch and minor versions via Dependabot
- **Manual review** for major versions to prevent breaking changes
- **Immediate action** for security vulnerabilities

## Dependabot Configuration

Dependabot is configured in `.github/dependabot.yml` to:

### Schedule

- **Frequency**: Weekly (Mondays at 6:00 AM ET)
- **PR Limit**: 10 open PRs maximum

### Update Grouping

Dependencies are grouped to reduce PR noise:

| Group                     | Includes                                                | Update Types |
| ------------------------- | ------------------------------------------------------- | ------------ |
| `production-dependencies` | All packages except dev tools                           | Minor, Patch |
| `dev-dependencies`        | @types/_, eslint_, prettier*, @playwright/*, typescript | Minor, Patch |
| `github-actions`          | All GitHub Actions                                      | Minor, Patch |

### Major Version Policy

Major versions are **ignored by Dependabot** and handled manually. Dependabot is configured to ignore semver-major updates globally (for npm and GitHub Actions) to reduce noisy major PRs; security advisories may still create PRs for critical vulnerabilities. This applies to:

| Package                                  | Reason                                       |
| ---------------------------------------- | -------------------------------------------- |
| `react`, `react-dom`, `@types/react*`    | Major versions require coordinated migration |
| `next`, `eslint-config-next`             | Breaking changes between major versions      |
| `typescript`                             | May require code changes                     |
| `tailwindcss`                            | Breaking changes in utility classes          |
| `@supabase/supabase-js`, `@supabase/ssr` | API changes between major versions           |

**When to upgrade major versions:**

1. Current version reaches End of Life (EOL)
2. New major version has critical features we need
3. Security vulnerability requires major version upgrade

## Update Workflow

### Patch Updates (x.x.PATCH)

- **Risk**: Very Low
- **Action**: Auto-merged after CI passes
- **Examples**: Bug fixes, security patches

#### Automation
- **Dependabot Fast CI**: A lightweight workflow runs lint, type-check, and unit tests for Dependabot PRs and PRs labeled `dependencies`. On success it adds `fast-ci:pass`; for patch updates it also adds `automerge-eligible`.
- **Auto-merge**: When the Fast CI completes successfully, a workflow enables GitHub auto-merge (squash) for Dependabot patch updates labeled `automerge-eligible`.
- **Backport**: When a dependency PR is merged into `main`, an automated backport workflow attempts to cherry-pick the merge commit onto `dev`, publish a `backport/deps/{pr}-{sha}` branch and open a PR to `dev` labeled `dependencies` and `backport`. If cherry-picking fails due to conflicts, the original PR is labeled `backport/conflicts` and the workflow comments with instructions for manual resolution.

### Minor Updates (x.MINOR.x)

- **Risk**: Low
- **Action**: Review changelog, merge after CI passes
- **Examples**: New features (backward compatible)

### Major Updates (MAJOR.x.x)

- **Risk**: High
- **Action**: Manual upgrade with dedicated branch
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
- Critical vulnerabilities trigger immediate PRs regardless of ignore rules
- Security PRs are labeled with `security` for prioritization

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

- **Dependabot**: Automated PR creation
- **GitHub Security Advisories**: Vulnerability alerts
- **npm audit**: Local security scanning
- **CodeQL**: Code scanning for vulnerabilities

### Regular Review

- Weekly: Review and merge Dependabot PRs
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
- [GitHub Dependabot Docs](https://docs.github.com/en/code-security/dependabot)
- [Semantic Versioning](https://semver.org/)
- [npm Security Advisories](https://www.npmjs.com/advisories)
