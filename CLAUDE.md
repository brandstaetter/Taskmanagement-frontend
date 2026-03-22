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
