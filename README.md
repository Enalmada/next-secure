# helper for generating headers with next-safe

## Why

* group csp rules into object with description field as a means of documenting what needs specific rules
* source path allows grouping rules by source (very limited exact match grouping)

## Installation

```bash
bun add @enalmada/next-secure
```

## Usage

```ts
// next.config.mjs
// @ts-check

import * as nextSafe from 'next-safe';

const isDev = process.env.NODE_ENV !== 'production';

/** @type {import("@enalmada/next-secure").ContentSecurityPolicyTemplate} */
const cspConfig = {
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

/** @type {import("@enalmada/next-secure").CspRule[]} */
// https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid#cross_origin_opener_policy
const cspRules = [
    { description: 'react-dev', 'object-src': isDev ? 'data:' : undefined, source: '/:path*' },
    {
        description: 'nextjs',
        // NextJS requires 'unsafe-inline' in prod?!
        // TODO - use nonce or hash.  next.js is working on improving this.  Revisit when they do.
        'script-src': "'unsafe-inline'",
        // https://github.com/vercel/next.js/issues/18557#issuecomment-727160210
        'style-src': "'unsafe-inline'",
        source: '/:path*',
    },
    {
        description: 'graphiQL',
        'style-src': 'https://unpkg.com/@graphql-yoga/',
        'script-src': "'unsafe-inline' https://unpkg.com/@graphql-yoga/",
        'font-src': 'data:',
        'connect-src': 'https://unpkg.com',
        'img-src': 'https://raw.githubusercontent.com',
        source: '/api/graphql',
    }
];

const contentSecurityPolicyTemplates = generateCspTemplate(cspConfig, cspRules);

// next-safe adds legacy keys that are unnecessary and cause console noise
const keysToRemove = ['Feature-Policy', 'X-Content-Security-Policy', 'X-WebKit-CSP'];

// noinspection JSUnusedLocalSymbols
/** @type {import("next").NextConfig} */
const config = {
    async headers() {
        return contentSecurityPolicyTemplates.map(
            (/** @type {import("@enalmada/next-secure").ContentSecurityPolicyTemplate } */ template) => {
                return {
                    source: template.source || '/:path*',
                    headers: nextSafe
                        // @ts-ignore this works but typescript can't tell for some reason
                        .default({ ...template })
                        .filter((/** @type {{ key: string; }} */ header) => !keysToRemove.includes(header.key)),
                };
            }
        );
    },
    ...
}
```

## TODO
[ ] move next-safe into module so header generation is completely abstracted 
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