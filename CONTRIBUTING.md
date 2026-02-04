# Contributing to Scoreboard Manager

Thanks for your interest in contributing! This project is open source under the GNU Affero General Public License v3 (AGPL v3). Contributions are welcome and appreciated.

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- A Supabase project (for local development)

### Setup

1. Clone the repository
2. Install dependencies:
   - `npm install`
3. Copy environment variables:
   - `cp .env.example .env.local`
4. Configure Supabase and environment variables in `.env.local`
5. Run the development server:
   - `npm run dev`

For Supabase manual setup steps, see [docs/supabase-manual-setup.md](docs/supabase-manual-setup.md).

## Development Workflow

- **Start dev server:** `npm run dev`
- **Lint:** `npm run lint`
- **Type check:** `npm run type-check`
- **Build:** `npm run build`
- **E2E tests:** `npm run test:e2e`

## Coding Standards

- TypeScript strict mode (no `any`)
- Use `@/` alias for imports from `src/`
- Use `export default function ComponentName` (no `React.FC`)
- Use `async/await`, avoid raw `.then()`
- Tailwind for styling; avoid inline styles except for user-configured colors

See `.github/copilot-instructions.md` for project conventions and UI patterns.

## Submitting Issues

Before creating a new issue:

1. Search existing issues to avoid duplicates
2. Provide clear steps to reproduce
3. Include expected vs actual behavior
4. Add screenshots or logs if applicable

## Submitting Pull Requests

1. Create a feature branch from `dev`
2. Keep PRs focused and small when possible
3. Ensure `npm run lint` and `npm run type-check` pass
4. Add or update tests when relevant
5. Reference related issues in the PR description

For branch strategy details, see [.github/GIT_WORKFLOW.md](.github/GIT_WORKFLOW.md).

## Code Review

- Maintainers may request changes before merging
- Be responsive to feedback
- Keep discussions respectful and constructive

## License

By contributing, you agree that your contributions will be licensed under the AGPL v3.
