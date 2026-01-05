import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const OPENAPI_URL =
  process.env.TASKMAN_OPENAPI_URL ??
  'https://github.com/brandstaetter/Taskmanagement-App/releases/latest/download/openapi.json';

const TARGET_FILE = resolve('src/app/api/openapi.json');
const TARGET_DIR = dirname(TARGET_FILE);

const isCi = String(process.env.CI ?? '').toLowerCase() === 'true';
const failOnError = isCi || String(process.env.FAIL_OPENAPI_SYNC ?? '') === '1';
const execAsync = promisify(exec);

async function main() {
  try {
    const response = await fetch(OPENAPI_URL, {
      redirect: 'follow',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download openapi.json: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    const parsed = JSON.parse(text);
    const formatted = JSON.stringify(parsed, null, 2) + '\n';

    await mkdir(TARGET_DIR, { recursive: true });

    let previous = null;
    try {
      previous = await readFile(TARGET_FILE, 'utf8');
    } catch {
      previous = null;
    }

    if (previous === formatted) {
      process.stdout.write('openapi.json is already up to date.\n');
      // Still generate client to ensure generated files exist for compilation
      process.stdout.write('Generating services from existing OpenAPI spec...\n');
      await execAsync('node scripts/generate-services.mjs', {
        cwd: process.cwd(),
      });
      return;
    }

    await writeFile(TARGET_FILE, formatted, 'utf8');
    process.stdout.write(`Updated ${TARGET_FILE} from ${OPENAPI_URL}\n`);
    
    // Generate services from the updated OpenAPI spec
    process.stdout.write('Generating services from updated OpenAPI spec...\n');
    await execAsync('node scripts/generate-services.mjs', {
      cwd: process.cwd(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (failOnError) {
      process.stderr.write(`${message}\n`);
      process.exit(1);
    }

    process.stderr.write(`${message} (skipping; using existing openapi.json)\n`);
  }
}

await main();
