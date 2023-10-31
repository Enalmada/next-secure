# helper for generating headers with next-safe

## Why
* group csp rules into object with description field as a means of documenting what needs specific rules
* abstract out some security best practices that can be shared with multiple projects

## Getting Started
Read the [documentation](https://next-secure-xxx.vercel.app/)

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