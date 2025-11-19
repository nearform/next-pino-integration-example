# Next.js + Pino integration (example)

This repository demonstrates a safe way to integrate Pino with a Next.js app using `next-logger`, while avoiding Turbopack build-time analysis of problematic transitive files (for example, `thread-stream` test files shipped in some packages).

What's included
- A minimal Next.js app using the App Router
- Example `instrumentation.ts` that registers `pino` + `next-logger` only on the Node server runtime
- `next.config.ts` configured to keep Pino and known transitive packages external to the server bundle

Why this is necessary
- Some npm packages include test fixtures or non-JavaScript files that Turbopack tries to statically parse. That can cause build or start failures.
- Marking these packages as server externals lets Node require them at runtime instead of the bundler processing their sources.

Quick start

- Clone the repo and install:

```bash
npm install
```

- Run development server:

```bash
npm run dev
```

- Build and run production locally:

```bash
npm run build
npm run start
```

TypeScript notes
- If you use TypeScript and `next-logger` doesn't provide types, add a declaration file (for example `global.d.ts` or `types/next-logger.d.ts`) with:

```ts
declare module 'next-logger'
```

Configuration
- Example `next.config.ts` (this repo already contains a working example):

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Keep server-only packages external so Turbopack doesn't analyze their sources
  serverExternalPackages: [
    'pino',
    'thread-stream',
    'pino-elasticsearch',
    'sonic-boom'
  ],
}

export default nextConfig
```

Instrumentation hook
- Add `instrumentation.ts` at the project root (or `src/`) and register this hook with Next's instrumentation loader. The hook should only run on the Node server runtime.

Example (safe runtime import):

```ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      // Use a runtime import to avoid Turbopack static analysis
      const dynamicImport = new Function('s', 'return import(s)')
      await dynamicImport('pino')
      await dynamicImport('next-logger')
    } catch (err) {
      // If instrumentation fails to load, log and continue — don't crash the server
      console.error('instrumentation.register: failed to load instrumentation modules', err)
    }
  }
}
```

Troubleshooting
- Symptom: `next build` or `next start` fails with parse errors pointing at `node_modules/<package>/test/*` or unknown module type errors.
  - Cause: Turbopack attempted to statically analyze files inside a dependency that are not intended for runtime.
  - Fix: mark the package(s) as server externals via `serverExternalPackages` in `next.config.ts`, or ensure the instrumentation module is loaded only at runtime (see the `instrumentation.ts` approach above).

- Symptom: `Cannot find module as expression is too dynamic` when using overly-dynamic import expressions.
  - Cause: Next's module loader may reject overly-dynamic module expressions during module resolution.
  - Fix: use a try/catch around the runtime `new Function('s','return import(s)')` approach, or prefer a small server-only CommonJS wrapper that uses `require()`.

Recommendations
- For reliability in production, consider adding a small server-only CommonJS wrapper that performs `require('pino')` under a try/catch — this avoids bundler rules and dynamic-import restrictions.
- Keep the `serverExternalPackages` list minimal and only add packages that actually cause issues during build or start.

Example output
When `next-logger` is active, server console output is converted into JSON lines suitable for structured logging systems:

``` json
{"level":30,"time":1763577811389,"pid":15460,"hostname":"exampleHost","name":"console","msg":"Example console.log() message"}
{"level":40,"time":1763577811389,"pid":15460,"hostname":"exampleHost","name":"console","msg":"Example console.warn() message"}
{"level":50,"time":1763577811389,"pid":15460,"hostname":"exampleHost","name":"console","msg":"Example console.error() message"}
```
