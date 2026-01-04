# TASKMAN

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=brandstaetter_Taskmanagement-frontend&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=brandstaetter_Taskmanagement-frontend)

## Frontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli). Install it by running `npm install -g @angular/cli`.

### 🚀 Quick Commands

```bash
# Development
npm start              # Start dev server (auto-syncs API)
npm run start:dev     # Dev server with development config
npm run start:prod    # Dev server with production config

# Building
npm run build         # Build for production (auto-syncs API)
npm run build:prod    # Production build

# Code Quality
npm run lint          # Run ESLint and Angular linting
npm run lint:fix      # Auto-fix linting issues
npm run format        # Format code with Prettier
npm test              # Run unit tests
npm run test:ci       # Run tests in CI mode
npm run test:coverage # Run tests with coverage report

# API Management
npm run prestart      # Sync OpenAPI spec and generate services
npm run prebuild      # Sync OpenAPI spec and generate services
```

## 🔌 Automatic API Service Generation

This project automatically generates TypeScript services and models from the OpenAPI specification, ensuring your frontend is always synchronized with the backend API.

### How It Works

1. **Sync OpenAPI**: Downloads the latest OpenAPI spec from `brandstaetter/Taskmanagement-App` releases
2. **Generate Services**: Creates TypeScript services and models using `@hey-api/openapi-ts`
3. **Integration**: Generated code is available in `src/app/generated/`

### Generated Structure

```text
src/app/generated/
├── client/           # HTTP client utilities
├── core/             # Core functionality
├── index.ts          # Main exports
├── sdk.gen.ts        # Generated API functions
├── types.gen.ts      # Generated TypeScript types
└── README.md         # Detailed usage documentation
```

### Usage Examples

```typescript
import { readTasksApiV1TasksGet, createNewTaskApiV1TasksPost } from '../generated';
import { environment } from '../../environments/environment';

// Direct usage
const tasks = await readTasksApiV1TasksGet({
  baseUrl: environment.apiUrl,
});

// In Angular services
import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class TaskService {
  getTasks(): Observable<Task[]> {
    return from(
      readTasksApiV1TasksGet({
        baseUrl: environment.apiUrl,
      })
    ).pipe(map(response => response.data));
  }
}
```

### Manual API Management

```bash
# Force sync OpenAPI and regenerate services
node scripts/sync-openapi.mjs

# Generate services only (assumes OpenAPI is up-to-date)
node scripts/generate-services.mjs

# Check current OpenAPI version
cat src/app/api/openapi.json | grep '"version"'
```

### Environment Configuration

The generated services use `environment.apiUrl`. Configure this in:

```typescript
// src/environments/environment.ts
export const environment = {
  apiUrl: 'http://localhost:8000', // Your backend URL
  // ...
};
```

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

### Environment Variables

```bash
# API Configuration
TASKMAN_OPENAPI_URL    # Custom OpenAPI spec URL (optional)
FAIL_OPENAPI_SYNC      # Set to '1' to fail build on API sync errors

# SonarQube (for CI/CD)
SONAR_TOKEN           # Your SonarQube authentication token
SONAR_HOST_URL        # Your SonarQube server URL
```

### Troubleshooting

#### API Sync Issues

```bash
# Check OpenAPI URL accessibility
curl "https://github.com/brandstaetter/Taskmanagement-App/releases/latest/download/openapi.json"

# Verify generated files
ls -la src/app/generated/
```

#### Build Issues

```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```
