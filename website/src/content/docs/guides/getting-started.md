---
title: Getting Started
description: A guide how to use this module.
---

## Installation

```bash
bun add @enalmada/next-secure
```


## In middleware (dynamic)

### Define your rules.  
See [next-safe](https://github.com/trezy/next-safe) for config values
```ts
// cspRules.ts
import { type ContentSecurityPolicyTemplate, type CspRule } from '@enalmada/next-secure';

const isDev = process.env.NODE_ENV === 'development';

export const cspConfig: ContentSecurityPolicyTemplate = {
  isDev,
  contentSecurityPolicy: {
    mergeDefaultDirectives: true,
    'prefetch-src': false, // shouldn't be used
  },
  // https://web.dev/referrer-best-practices/
  referrerPolicy: 'strict-origin-when-cross-origin',
  // These "false" are included in proposed/standard but cause chrome noise.  Disabling for now.
  permissionsPolicy: {
    'ambient-light-sensor': false,
    battery: false,
    'document-domain': false,
    'execution-while-not-rendered': false,
    'execution-while-out-of-viewport': false,
    'navigation-override': false,
    'speaker-selection': false,
  },
  permissionsPolicyDirectiveSupport: ['proposed', 'standard'], // default causes tons of console noise
};

export const cspRules: CspRule[] = [
  { description: 'react-dev', 'object-src': isDev ? 'data:' : undefined, source: '/:path*' },
  {
    description: 'firebase',
    'script-src': 'https://apis.google.com/ https://accounts.google.com/gsi/client',
    'connect-src':
            'https://apis.google.com https://accounts.google.com/gsi/ https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://lh3.googleusercontent.com',
    'img-src': 'https://lh3.googleusercontent.com',
    'frame-src': `https://accounts.google.com/gsi/ https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}/`,
    source: '/:path*',
  },
  {
    description: 'sentry',
    'worker-src': 'blob:',
    'connect-src': 'https://oxxxxx.ingest.sentry.io',
    source: '/:path*',
  },
];
```

Notes:
* static files will not have access to the nonce
* source is not yet supported.  All rules are merged.

### use `generateSecurityHeaders` to create headers and `applyHeaders` to add them to response.
```ts

import { applyHeaders, generateSecurityHeaders } from '@enalmada/next-secure';
import { cspConfig, cspRules } from '@/cspRules';

export async function middleware(request: NextRequest) {
  const secureHeaders = generateSecurityHeaders(cspConfig, cspRules);
  /*
    const secureHeaders = generateSecurityHeaders(cspConfig, filteredCspRules, undefined, {
    scriptNonce: false,  // if something out of your control uses inline scripts
    styleNonce: false // if something out of your control uses inline styles
    });
 */
  ...     
  const response = NextResponse.next();  // or intlMiddleware(request); etc
  return applyHeaders(response, secureHeaders);
```

## In next.config.cjs (static)

```ts
// next.config.mjs
// @ts-check


const isDev = process.env.NODE_ENV === 'development';

/** @type {import("@enalmada/next-secure").ContentSecurityPolicyTemplate} */
const cspConfig = {
    isDev,
    contentSecurityPolicy: {
        mergeDefaultDirectives: true,
        'prefetch-src': false, // shouldn't be used
    },
    referrerPolicy: 'strict-origin-when-cross-origin',
    // These "false" are included in proposed/standard but cause chrome noise.  Disabling for now.
    permissionsPolicy: {
        'ambient-light-sensor': false,
        battery: false,
        'document-domain': false,
        'execution-while-not-rendered': false,
        'execution-while-out-of-viewport': false,
        'navigation-override': false,
        'speaker-selection': false,
    },
    permissionsPolicyDirectiveSupport: ['proposed', 'standard'], // default causes tons of console noise
};

/** @type {import("@enalmada/next-secure").CspRule[]} */
const cspRules = [
  {
    description: 'vercel',
    'frame-src': 'https://vercel.live/',
    'script-src': 'https://vercel.live/_next-live/feedback/',
    source: '/:path*',
  }
];

const contentSecurityPolicyTemplates = generateCspTemplates(cspConfig, cspRules);

/** @type {import("next").NextConfig} */
const nextConfig = {

  async headers() {
    return [...contentSecurityPolicyTemplates];
  },
  ...
}
```