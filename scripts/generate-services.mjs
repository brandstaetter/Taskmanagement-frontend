import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const GENERATED_DIR = resolve('src/app/generated');

function main() {
  try {
    // Clean up previous generated files
    if (existsSync(GENERATED_DIR)) {
      rmSync(GENERATED_DIR, { recursive: true, force: true });
      process.stdout.write('Cleaned previous generated files.\n');
    }

    // Generate TypeScript services and models from OpenAPI spec
    process.stdout.write('Generating services from OpenAPI spec...\n');
    execSync('npx @hey-api/openapi-ts -i src/app/api/openapi.json -o src/app/generated', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    process.stdout.write(`Generated services and models in ${GENERATED_DIR}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Failed to generate services: ${message}\n`);
    process.exit(1);
  }
}

main();
