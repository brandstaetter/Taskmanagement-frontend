# Auto-Generated API Services

This project automatically generates TypeScript services and models from the OpenAPI specification during the build process.

## How it works

1. **Sync OpenAPI**: The `scripts/sync-openapi.mjs` downloads the latest OpenAPI spec from the backend repository
2. **Generate Services**: The `scripts/generate-services.mjs` generates TypeScript services and models using `@hey-api/openapi-ts`
3. **Integration**: Generated code is placed in `src/app/generated/` and can be imported in your services

## Generated Structure

```
src/app/generated/
├── client/           # HTTP client utilities
├── core/             # Core functionality
├── index.ts          # Main exports
├── sdk.gen.ts        # Generated API functions
└── types.gen.ts      # Generated TypeScript types
```

## Usage Examples

### Basic Usage

```typescript
import { readTasksApiV1TasksGet, createNewTaskApiV1TasksPost } from '../generated';
import { environment } from '../../environments/environment';

// Get all tasks
const tasks = await readTasksApiV1TasksGet({
  baseUrl: environment.apiUrl,
});

// Extract data from response
const taskList = tasks.data;

// Create a new task
const newTask = await createNewTaskApiV1TasksPost({
  body: {
    title: 'New Task',
    description: 'Task description',
  },
  baseUrl: environment.apiUrl,
});
```

### In Angular Services

```typescript
import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { readTasksApiV1TasksGet, type Task } from '../generated';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly options = {
    baseUrl: environment.apiUrl,
  };

  getTasks(): Observable<Task[]> {
    return from(readTasksApiV1TasksGet(this.options)).pipe(
      map(response => response.data)
    );
  }
}
```

## Available API Functions

The generated code includes functions for all endpoints defined in the OpenAPI spec:

- **Tasks**: `readTasksApiV1TasksGet`, `createNewTaskApiV1TasksPost`, `updateTaskEndpointApiV1TasksTaskIdPatch`, etc.
- **Auth**: `loginUserForAccessTokenApiV1AuthUserTokenPost`
- **Admin**: `createNewUserApiV1AdminUsersPost`, `initDbApiV1AdminDbInitPost`, etc.
- **Users**: `changePasswordApiV1UsersMePasswordPut`, `updateAvatarApiV1UsersMeAvatarPut`
- **Print**: `printDataApiV1PrintPost`, `printTaskApiV1TasksTaskIdPrintPost`

## Build Integration

The service generation is automatically integrated into your build process:

- `npm run prestart` / `npm run prestart:dev` / `npm run prestart:prod`
- `npm run prebuild` / `npm run prebuild:prod`

This ensures your generated services are always up-to-date with the latest API specification.

## Manual Generation

To manually regenerate services:

```bash
# Sync OpenAPI and generate services
npm run prestart

# Or run scripts individually
node scripts/sync-openapi.mjs
node scripts/generate-services.mjs
```

## Environment Configuration

The generated services use `environment.apiUrl` as the base URL. Make sure this is correctly configured in your environment files:

```typescript
// src/environments/environment.ts
export const environment = {
  apiUrl: 'http://localhost:8000',
  // ...
};
```

## Type Safety

All generated services include full TypeScript type safety:

- Request parameters are typed
- Response data is typed
- Error responses are handled with proper types
- All models and enums are generated from the OpenAPI spec

## Error Handling

The generated API functions return responses in this format:

```typescript
// Success response
{
  data: T,           // Your data
  request: Request,  // HTTP request info
  response: Response // HTTP response info
}

// Error response
{
  data: undefined,
  error: ErrorType,  // Typed error from OpenAPI spec
  request: Request,
  response: Response
}
```

Always check for the presence of `data` vs `error` properties when handling responses.
