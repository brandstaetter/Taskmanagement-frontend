# Taskmanagement-frontend — Frontend

TypeScript / Angular 21 / npm / Jest / Angular Material

## Quick Commands

```bash
npm start                                              # dev server (port 4200, auto-syncs API)
npm test -- --watch=false --browsers=ChromeHeadless   # run tests (CI mode)
npm run lint                                           # ESLint + Angular lint
npm run format                                         # Prettier
```

## Generated Code Rule

`src/app/generated/` is **auto-generated** from the backend OpenAPI schema. **Never edit it manually.** Run `npm run prestart` to regenerate after backend changes.

See [../docs/frontend-codegen.md](../docs/frontend-codegen.md) for the full local regeneration workflow.

## Tests Must Pass Before PR

```bash
npm test -- --watch=false --browsers=ChromeHeadless
```

## E2E Tests (Playwright)

End-to-end tests live in `e2e/` and run against the app in a **real browser**.

```bash
# Install Playwright browsers (first time only)
npx playwright install chromium

# Start backend + frontend servers first, then:
npx playwright test --project=smoke          # read-only, safe for production
npx playwright test --project=full           # includes write operations
npx playwright test --headed                 # with visible browser for debugging
```

**Two projects:**
- `smoke` (`e2e/smoke/`) — read-only navigation tests. Run post-deployment against production.
- `full` (`e2e/` including `e2e/full/`) — includes task CRUD, user management via UI.

**Page Objects** in `e2e/pages/`: LoginPage, TaskListPage, TaskDetailPage, AdminPage, UserProfilePage.

**Auth:** The setup fixture (`e2e/fixtures/auth.setup.ts`) logs in and saves browser state to `e2e/.auth/`. Credentials from env vars: `E2E_USERNAME`, `E2E_PASSWORD`, `E2E_ADMIN_USERNAME`, `E2E_ADMIN_PASSWORD`.

**CI integration:** The `e2e-tests` job in `ci-cd.yml` runs the full suite on PRs. The `smoke-test` job runs smoke tests after deployment (requires `DEPLOY_URL`, `E2E_USERNAME`, `E2E_PASSWORD` secrets). Note: the full E2E job needs a running backend — see the TODO comment in the workflow.

## Key Conventions

- Standalone components (`standalone: true`)
- Services use `@Injectable({ providedIn: 'root' })`
- All async operations return `Observable<T>` via RxJS `from()` + `pipe(map(...))`
- Component prefix: `app-`
- Spec files live next to the file they test

## Further Reading

- Code style, Angular conventions, testing patterns: [.github/copilot-instructions.md](.github/copilot-instructions.md)
- API client generation details: [../docs/frontend-codegen.md](../docs/frontend-codegen.md)
- PR workflow and CI dependency on backend: [../docs/pr-workflow.md](../docs/pr-workflow.md)
