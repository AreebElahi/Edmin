import app from '../app.js';

// Temporary allowlist for routes that do not yet use `validateRequest`.
// MUST BE REMOVED once all domains are migrated.
const ALLOWLIST = [
  'POST /api/v1/faculty/teaching-loads',
  'POST /api/v1/faculty/activity',
  'POST /api/v1/faculty/leaves',
  // Allow all non-migrated router prefixes entirely for now to avoid breaking CI.
  // We only enforce coverage on the domains explicitly covered in Phase 7.
  '/api/v1/dashboard',
  '/api/courses',
  '/api/v1/notifications',
  '/api/v1/leaves',
  '/api/v1/enrollment',
  '/api/v1/faculty/teaching-loads',
  '/api/v1/activity-reports',
  '/api/v1/config',
  '/api/v1/student',
  '/api/v1/ai-quiz',
];

const isAllowlisted = (method: string, path: string) => {
  const full = `${method} ${path}`;
  return ALLOWLIST.some(pattern => {
    if (pattern.startsWith('/')) {
      return path.startsWith(pattern); // matches prefix
    }
    return full === pattern;
  });
};

function walkRouter(router: any, basePath = ''): Array<{ method: string, path: string, middlewares: any[] }> {
  const routes: Array<{ method: string, path: string, middlewares: any[] }> = [];

  if (!router || !router.stack) return routes;

  for (const layer of router.stack) {
    if (layer.route) {
      // It's a route
      const path = basePath + layer.route.path;
      for (const method in layer.route.methods) {
        if (layer.route.methods[method]) {
          routes.push({
            method: method.toUpperCase(),
            path,
            middlewares: layer.route.stack.map((s: any) => s.handle)
          });
        }
      }
    } else if (layer.name === 'router') {
      // It's a sub-router
      // Express stores the mount path in `layer.regexp` but it's hard to extract the exact string path unless we look at layer.path (not standard) or we know it.
      // Actually, express stores the original path string only sometimes.
      // Express 4.x doesn't always expose the string prefix. We'll do our best.
      const prefix = layer.path || (layer.regexp.source !== '^\\/?(?=\\/|$)' ? layer.regexp.source.replace(/^\\/, '').replace(/\\\//g, '/').replace(/\/\?\(\?\=\\\/\|\$\)/, '') : '');
      let cleanPrefix = prefix;
      if (cleanPrefix.startsWith('^')) cleanPrefix = cleanPrefix.substring(1);
      if (cleanPrefix.endsWith('/?(?=/|$)')) cleanPrefix = cleanPrefix.substring(0, cleanPrefix.length - 9);
      if (cleanPrefix.endsWith('/?')) cleanPrefix = cleanPrefix.substring(0, cleanPrefix.length - 2);

      routes.push(...walkRouter(layer.handle, basePath + cleanPrefix));
    }
  }

  return routes;
}

function runTest() {
  console.log('--- Running Validation Coverage Guardrail Test ---');
  // Express 4 app._router contains the stack
  const routes = walkRouter((app as any)._router);
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  let failed = 0;

  for (const route of routes) {
    if (mutatingMethods.includes(route.method)) {
      if (isAllowlisted(route.method, route.path)) {
        continue;
      }

      // Check if any middleware in the stack is the validateRequest middleware
      const hasValidation = route.middlewares.some(m => m && typeof m === 'function' && m.__isValidateRequest === true);

      if (!hasValidation) {
        console.error(`FAIL: Missing validateRequest on mutating route -> ${route.method} ${route.path}`);
        failed++;
      }
    }
  }

  if (failed > 0) {
    console.error(`\nFAILED: ${failed} mutating routes are missing validateRequest.`);
    process.exit(1);
  } else {
    console.log('SUCCESS: All non-allowlisted mutating routes are properly validated.');
    process.exit(0);
  }
}

runTest();
