/**
 * Stubs "server-only" for the Node.js test runner.
 *
 * The `server-only` npm package throws when imported outside a Next.js
 * Server Component context. During unit tests we run in plain Node.js,
 * so we replace the module with a no-op before any test code loads.
 *
 * This file is passed to `--require` before the test entry-point.
 * It MUST be CommonJS (no ESM syntax) because it runs at CJS bootstrap time.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const Module = require("module");
/* eslint-enable @typescript-eslint/no-require-imports */

const _resolveFilename = Module._resolveFilename.bind(Module);

Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === "server-only") {
    // Return a fake resolved path; the cache entry below will handle it.
    return "__server-only-stub__";
  }
  return _resolveFilename(request, parent, isMain, options);
};

// Inject a no-op module into the cache under our fake path.
const fakeModule = new Module("__server-only-stub__");
fakeModule.exports = {};
fakeModule.loaded = true;
require.cache["__server-only-stub__"] = fakeModule;
