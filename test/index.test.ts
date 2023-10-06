import { generateCspTemplates, type ContentSecurityPolicyTemplate, type CspRule } from '../src';

function getCspConfig(isDev: boolean): ContentSecurityPolicyTemplate {
  return {
    isDev: isDev,
    contentSecurityPolicy: {
      mergeDefaultDirectives: true,
      'prefetch-src': false,
    },
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: {
      'ambient-light-sensor': false,
      battery: false,
      'document-domain': false,
      'execution-while-not-rendered': false,
      'execution-while-out-of-viewport': false,
      'navigation-override': false,
      'speaker-selection': false,
    },
    permissionsPolicyDirectiveSupport: ['proposed', 'standard'],
  };
}

// https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid#cross_origin_opener_policy
export const cspRules: CspRule[] = [
  {
    description: 'nextjs',
    'script-src': 'http://testscript',
    source: '/:path*',
  },
];

describe('CSP Template Generation', () => {
  it('basic dev test', () => {
    const templates = generateCspTemplates(getCspConfig(true), cspRules);

    const expectedTemplates = [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "base-uri 'none';child-src 'none';connect-src 'self' webpack://*;default-src 'self';font-src 'self';form-action 'self';frame-ancestors 'none';frame-src 'none';img-src 'self';manifest-src 'self';media-src 'self';object-src 'none';script-src 'self' http://testscript 'unsafe-eval';style-src 'self' 'unsafe-inline';worker-src 'self';block-all-mixed-content ;upgrade-insecure-requests ;",
          },
          {
            key: 'Permissions-Policy',
            value:
              'clipboard-read=(),clipboard-write=(),gamepad=(),accelerometer=(),autoplay=(),camera=(),cross-origin-isolated=(),display-capture=(),encrypted-media=(),fullscreen=(),geolocation=(),gyroscope=(),magnetometer=(),microphone=(),midi=(),payment=(),picture-in-picture=(),publickey-credentials-get=(),screen-wake-lock=(),sync-xhr=(),usb=(),web-share=(),xr-spatial-tracking=()',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];

    expect(templates).toEqual(expectedTemplates);
  });

  it('basic prod test', () => {
    const templates = generateCspTemplates(getCspConfig(false), cspRules);

    const expectedTemplates = [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "base-uri 'none';child-src 'none';connect-src 'self';default-src 'self';font-src 'self';form-action 'self';frame-ancestors 'none';frame-src 'none';img-src 'self';manifest-src 'self';media-src 'self';object-src 'none';script-src 'self' http://testscript;style-src 'self';worker-src 'self';block-all-mixed-content ;upgrade-insecure-requests ;",
          },
          {
            key: 'Permissions-Policy',
            value:
              'clipboard-read=(),clipboard-write=(),gamepad=(),accelerometer=(),autoplay=(),camera=(),cross-origin-isolated=(),display-capture=(),encrypted-media=(),fullscreen=(),geolocation=(),gyroscope=(),magnetometer=(),microphone=(),midi=(),payment=(),picture-in-picture=(),publickey-credentials-get=(),screen-wake-lock=(),sync-xhr=(),usb=(),web-share=(),xr-spatial-tracking=()',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];

    expect(templates).toEqual(expectedTemplates);
  });
});
