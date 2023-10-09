# helper for generating headers with next-safe

## Why

* group csp rules into object with description field as a means of documenting what needs specific rules
* source path allows grouping rules by source (very limited exact match grouping)

## Installation

```bash
bun add @enalmada/next-secure
```

## Usage

### In middleware (dynamic)

1) Define your rules.  See [next-safe](https://github.com/trezy/next-safe) for config values
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

2) use `generateSecurityHeaders` to create headers and `applyHeaders` to add them to response.
```ts

import { applyHeaders, generateSecurityHeaders } from '@enalmada/next-secure';
import { cspConfig, cspRules } from '@/cspRules';

export async function middleware(request: NextRequest) {
  const secureHeaders = generateSecurityHeaders(cspConfig, cspRules);
  ...     
  const response = NextResponse.next();  // or intlMiddleware(request); etc
  return applyHeaders(response, secureHeaders);
```

### In next.config.cjs (static)

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

## TODO
[ ] review [with-csp](https://nextjs.org/docs/pages/building-your-application/configuring/content-security-policy) and use in middleware vs next.config.mjs

## Alternatives

[next-safe](https://www.npmjs.com/package/next-safe)
* only supported raw list of CSP whitelist but I wanted tracking per 3rd party 
  * to only add CSP on routes that needed it
  * to know why things were being added and minimize risk of orphaning

[next-safe-middleware](https://github.com/nibtime/next-safe-middleware)
* no longer maintained
* didn't seem to support app directory
* Next > 13.4.4 issues (possibly workaround https://github.com/nibtime/next-safe-middleware/issues/96#issuecomment-1702264013)

[with-csp](https://nextjs.org/docs/pages/building-your-application/configuring/content-security-policy) next.js has had work in 13.5 to improve dynamic csp
* unclear how static pages should be protected

## Build Notes
* Using [latest module and target settings](https://stackoverflow.com/questions/72380007/what-typescript-configuration-produces-output-closest-to-node-js-18-capabilities/72380008#72380008) for current LTS
* using tsc for types until [bun support](https://github.com/oven-sh/bun/issues/5141#issuecomment-1727578701) comes around

## Contribute
Using [changesets](https://github.com/changesets/changesets) so please remember to run "changeset" with any PR.  
Give consideration for the summary as it is what will show up in the changelog.