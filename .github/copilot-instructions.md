# GitHub Copilot Instructions for TASKMAN Frontend

## Project Overview
TASKMAN is a task management application frontend built with Angular 20. This is a TypeScript-based single-page application (SPA) that provides a modern UI for managing tasks and projects.

## Technology Stack
- **Framework**: Angular 20.x
- **Language**: TypeScript 5.8.x
- **Styling**: SCSS with Angular Material (azure-blue theme)
- **State Management**: RxJS 7.8.x
- **Testing**: Karma + Jasmine
- **Code Quality**: ESLint, Prettier, Husky
- **Build Tool**: Angular CLI with esbuild
- **CI/CD**: SonarQube integration

## Development Workflow

### Setup and Development Server
- Run `npm install` to install dependencies
- Use `npm run start:dev` to start development server (includes OpenAPI sync)
- Development server runs at `http://localhost:4200/`
- Hot reload is enabled for all source files

### Building
- **Development build**: `npm run build`
- **Production build**: `npm run build:prod`
- Build output is placed in `dist/` directory
- Production builds are optimized with tree-shaking, minification, and bundling optimizations

### Testing
- **Run tests**: `npm test` (watch mode)
- **CI tests**: `npm run test:ci` (headless Chrome, no watch)
- **Coverage**: `npm run test:coverage`
- Tests use Karma + Jasmine
- Spec files should be named `*.spec.ts` and placed alongside the files they test

### Linting and Formatting
- **Lint**: `npm run lint` (runs Angular ESLint + ESLint)
- **Fix lint issues**: `npm run lint:fix`
- **Format code**: `npm run format` (Prettier)
- **Check formatting**: `npm run format:check`
- Pre-commit hooks automatically format and lint staged files

## Code Style Guidelines

### TypeScript
- Use **single quotes** for strings
- **Semicolons** are required
- **2 spaces** for indentation (no tabs)
- Arrow functions should avoid unnecessary parentheses for single parameters: `x => x` (not `(x) => x`)
- Max line length: 100 characters
- Trailing commas: ES5 style
- Use strict typing - avoid `any` when possible

### Angular Conventions
- **Component prefix**: `app`
- **Style language**: SCSS
- **Component naming**: kebab-case (e.g., `task-view.component.ts`)
- **Service naming**: PascalCase with `.service.ts` suffix
- **Module naming**: PascalCase with `.module.ts` suffix

### File Organization
```
src/
├── app/
│   ├── components/     # UI components
│   ├── services/       # Business logic and API services
│   ├── app.routes.ts   # Routing configuration
│   └── app.component.ts
├── environments/       # Environment configurations
└── styles.scss         # Global styles
```

### Component Structure
- Each component should have its own directory when complex
- Standalone components or module-based (this project uses both)
- Component files: `*.component.ts`, `*.component.html`, `*.component.scss`, `*.component.spec.ts`
- Keep components focused and single-responsibility

### Service Patterns
- Services should be injectable with `@Injectable({ providedIn: 'root' })`
- Services located in `src/app/services/`
- Each service should have a corresponding spec file
- Use RxJS observables for asynchronous operations
- Examples: `task.service.ts`, `auth.service.ts`

## Testing Conventions

### Unit Tests
- Use Jasmine's `describe`, `it`, `beforeEach`, `expect` syntax
- Mock dependencies using Jasmine spies
- Test files should cover:
  - Component initialization
  - User interactions
  - Service method calls
  - Error handling
- Aim for meaningful test descriptions

### Test Structure Example
```typescript
describe('ComponentName', () => {
  let component: ComponentName;
  let fixture: ComponentFixture<ComponentName>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // configuration
    }).compileComponents();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

## Routing and Navigation
- Routes defined in `src/app/app.routes.ts`
- Use Angular Router for navigation
- Implement route guards for authentication if needed

## Environment Configuration
- Development config: `src/environments/environment.ts`
- Production config: `src/environments/environment.prod.ts`
- File replacement happens during production build

## Pre-commit Automation
- **Husky** is configured for Git hooks
- **lint-staged** runs on commit:
  - Prettier formats `*.ts`, `*.html`, `*.scss` files
  - ESLint fixes `*.ts` files
- Do not bypass hooks unless absolutely necessary

## OpenAPI Integration
- OpenAPI specs are synced before start/build via `scripts/sync-openapi.mjs`
- This runs automatically with `prestart`, `prebuild` scripts

## Build Budgets
- Initial bundle: max 1MB (warning at 800kB)
- Component styles: max 16kB (warning at 8kB)
- Keep bundle sizes within limits
- If budgets are exceeded, consider:
  - Lazy loading modules/components
  - Code splitting strategies
  - Removing unused dependencies
  - Using dynamic imports for large libraries

## Additional Notes
- Project uses Angular Material with azure-blue prebuilt theme
- Global styles in `src/styles.scss`
- Static assets placed in `public/` directory
- SonarQube integration for code quality metrics
- Analytics are disabled in Angular CLI

## Common Commands Quick Reference
```bash
npm run start:dev      # Start dev server with OpenAPI sync
npm run build:prod     # Production build
npm test               # Run tests in watch mode
npm run test:ci        # Run tests once (CI)
npm run lint:fix       # Fix linting issues
npm run format         # Format all code
npm run clean          # Remove dist and node_modules
```

## When Creating New Features
1. Generate components using Angular CLI: `ng generate component component-name`
2. Follow existing patterns in similar components
3. Add unit tests (*.spec.ts) for new components/services
4. Use Angular Material components for UI consistency
5. Ensure code passes linting and formatting checks
6. Keep components small and focused
7. Use services for shared logic and API calls
8. Follow the existing project structure

## Quality Standards
- All code must pass ESLint checks
- All code must be formatted with Prettier
- Maintain or improve code coverage with tests
- Follow Angular style guide and best practices
- Write meaningful commit messages
