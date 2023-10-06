import crypto from 'crypto';
import { type NextResponse } from 'next/server';
import { type Mock } from 'vitest';

import {
  applyHeaders,
  generateCspTemplates,
  generateSecurityHeaders,
  type ContentSecurityPolicyTemplate,
  type CspRule,
} from '../src';

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

describe('next.config header generation', () => {
  it('basic dev test', () => {
    const templates = generateCspTemplates(getCspConfig(true), cspRules);

    const expectedTemplates = [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "base-uri 'none';child-src 'none';connect-src 'self' webpack://*;default-src 'self';font-src 'self';form-action 'self';frame-ancestors 'none';frame-src 'none';img-src 'self';manifest-src 'self';media-src 'self';object-src 'none';script-src 'self' 'unsafe-inline' http://testscript 'unsafe-eval';style-src 'self' 'unsafe-inline';worker-src 'self';",
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
              "base-uri 'none';child-src 'none';connect-src 'self';default-src 'self';font-src 'self';form-action 'self';frame-ancestors 'none';frame-src 'none';img-src 'self';manifest-src 'self';media-src 'self';object-src 'none';script-src 'self' http://testscript;style-src 'self';worker-src 'self';",
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

describe('Middleware Generation', () => {
  it('basic dev test', () => {
    const cspRules: CspRule[] = [
      {
        description: 'nextjs',
        'script-src': 'http://testscript1',
        source: '/one',
      },
      {
        description: 'another',
        'script-src': 'http://testscript2',
        source: '/two',
      },
    ];

    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
    const headers = generateSecurityHeaders(getCspConfig(true), cspRules, undefined, nonce);

    const expectedHeaders = [
      {
        key: 'Content-Security-Policy',
        value:
          "base-uri 'none';child-src 'none';connect-src 'self' webpack://*;default-src 'self';font-src 'self';form-action 'self';frame-ancestors 'none';frame-src 'none';img-src 'self';manifest-src 'self';media-src 'self';object-src 'none';script-src 'self' 'unsafe-inline' http://testscript1 http://testscript2 'unsafe-eval';style-src 'self' 'unsafe-inline';worker-src 'self';",
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
      {
        key: 'x-nonce',
        value: nonce,
      },
    ];

    expect(headers).toEqual(expectedHeaders);
  });

  it('basic prod test', () => {
    const cspRules: CspRule[] = [
      {
        description: 'nextjs',
        'script-src': 'http://testscript1',
        source: '/one',
      },
      {
        description: 'another',
        'script-src': 'http://testscript2',
        source: '/two',
      },
    ];

    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
    const headers = generateSecurityHeaders(getCspConfig(false), cspRules, undefined, nonce);

    const expectedHeaders = [
      {
        key: 'Content-Security-Policy',
        value: `base-uri 'none';child-src 'none';connect-src 'self';default-src 'self';font-src 'self';form-action 'self';frame-ancestors 'none';frame-src 'none';img-src 'self';manifest-src 'self';media-src 'self';object-src 'none';script-src 'self' 'nonce-${nonce}' 'strict-dynamic' http://testscript1 http://testscript2;style-src 'self' 'nonce-${nonce}';worker-src 'self';`,
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
      {
        key: 'x-nonce',
        value: nonce,
      },
    ];

    expect(headers).toEqual(expectedHeaders);
  });

  // Mocking the type
  interface MockResponse {
    headers: {
      set: Mock;
    };
  }

  describe('applyCspHeaders', () => {
    it('applies headers to the response object', () => {
      // Mocking the Response object
      const mockResponse: MockResponse = {
        headers: {
          set: vi.fn(),
        },
      };

      const testHeaders: Header[] = [
        { key: 'Header-1', value: 'Value-1' },
        { key: 'Header-2', value: 'Value-2' },
      ];

      applyHeaders(mockResponse as unknown as NextResponse, testHeaders);

      // Assert that headers were set on the response
      expect(mockResponse.headers.set).toHaveBeenCalledWith('Header-1', 'Value-1');
      expect(mockResponse.headers.set).toHaveBeenCalledWith('Header-2', 'Value-2');
    });
  });

  /*
  describe('Middleware Generation', () => {
    let setHeaders: Record<string, string> = {};

    // Mock implementation of Headers class
    class MockHeaders {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-explicit-any
      constructor(initHeaders?: any) {}
      get(key: string) {
        return setHeaders[key];
      }
      set(key: string, value: string) {
        setHeaders[key] = value;
      }
    }

    beforeEach(() => {
      setHeaders = {}; // reset before each test run
    });

    it('applies headers to the response object', () => {
      // Mocking the Headers class with a factory function
      vi.spyOn(global, 'Headers').mockImplementation((...args) => new MockHeaders(...args));

      const mockRequest: NextRequest = {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        headers: new Headers(),
        // ... other properties of NextRequest, if required
      };

      generateSecureRequest(getCspConfig(true), cspRules, mockRequest);

      expect(setHeaders['Content-Security-Policy']).toBeTruthy();
      expect(setHeaders['Referrer-Policy']).toEqual('strict-origin-when-cross-origin');
      // ... test other headers as needed

      vi.restoreAllMocks(); // restore original Headers implementation after the test
    });
  });

   */
});
