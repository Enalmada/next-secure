/* eslint-disable @typescript-eslint/ban-ts-comment,@typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return */
import { type NextResponse } from 'next/server';
import * as nextSafe from 'next-safe';

function deepMerge<T extends object, S extends object>(target: T, source: S): T & S {
  const output: any = Object.assign({}, target); // using any here to bypass type restrictions, handle with care

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      // @ts-ignore
      if (isObject(source[key])) {
        if (!(key in target)) {
          // @ts-ignore
          Object.assign(output, { [key]: source[key] });
        } else {
          // @ts-ignore
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        // @ts-ignore
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output as T & S; // typecast back to T & S
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// default configuration https://trezy.gitbook.io/next-safe/usage/configuration

type NextSafeConfigFunction = (isDev: boolean, nonceConfig?: NonceConfig) => NextSafeConfig;

const getDefaultConfig: NextSafeConfigFunction = (isDev, nonceConfig) => {
  let scriptSrc = "'self'";
  let styleSrc = "'self'";

  if (nonceConfig?.nonce) {
    if (nonceConfig.scriptNonce) {
      scriptSrc += ` 'nonce-${nonceConfig.nonce}' 'strict-dynamic'`;
    }
    if (nonceConfig.styleNonce) {
      styleSrc += ` 'nonce-${nonceConfig.nonce}'`;
    }
  }

  return {
    contentTypeOptions: 'nosniff',
    contentSecurityPolicy: {
      'base-uri': "'none'",
      'child-src': "'none'",
      'connect-src': "'self'",
      'default-src': "'self'",
      'font-src': "'self'",
      'form-action': "'self'",
      'frame-ancestors': "'none'",
      'frame-src': "'none'",
      'img-src': "'self'",
      'manifest-src': "'self'",
      'media-src': "'self'",
      'object-src': "'none'",
      'prefetch-src': "'self'",
      'script-src': scriptSrc,
      'style-src': styleSrc,
      'worker-src': "'self'",
      mergeDefaultDirectives: false,
      reportOnly: false,
    },
    frameOptions: 'DENY',
    permissionsPolicyDirectiveSupport: ['proposed', 'standard'],
    isDev: false,
    referrerPolicy: 'no-referrer',
    xssProtection: '1; mode=block',
  };
};

export interface CspRule {
  description?: string;
  source?: string;
  'script-src'?: string | boolean;
  'style-src'?: string | boolean;
  'img-src'?: string | boolean;
  'connect-src'?: string | boolean;
  'font-src'?: string | boolean;
  'object-src'?: string | boolean;
  'media-src'?: string | boolean;
  'frame-src'?: string | boolean;
  'worker-src'?: string | boolean;
  'manifest-src'?: string | boolean;
  'prefetch-src'?: string | boolean;
  'base-uri'?: string | boolean;
  'child-src'?: string | boolean;
  'default-src'?: string | boolean;
  'form-action'?: string | boolean;
  'frame-ancestors'?: string | boolean;
  'block-all-mixed-content'?: boolean;
  'upgrade-insecure-requests'?: boolean;
}

export interface ContentSecurityPolicyTemplate {
  source?: string;
  contentSecurityPolicy: {
    mergeDefaultDirectives: boolean;
    [key: string]: string | boolean;
  };
  referrerPolicy: string;
  permissionsPolicy?: {
    [key: string]: string | boolean;
  };
  permissionsPolicyDirectiveSupport: any[];
  isDev: boolean;
}

function groupBySource(
  cspRules: CspRule[],
  ignorePath: boolean = false
): Record<string, CspRule[]> {
  const grouped: Record<string, CspRule[]> = {};
  cspRules.forEach((rule) => {
    const source = ignorePath ? '/' : rule.source || '/';
    if (!grouped[source]) {
      grouped[source] = [];
    }
    grouped[source].push(rule);
  });
  return grouped;
}

function generateCspTemplate(
  cspConfig: ContentSecurityPolicyTemplate,
  cspRules: CspRule[],
  nonceConfig?: NonceConfig
): ContentSecurityPolicyTemplate[] {
  const groupedRules = groupBySource(cspRules, !!nonceConfig?.nonce);
  const finalConfigs: ContentSecurityPolicyTemplate[] = [];

  for (const [source, rules] of Object.entries(groupedRules)) {
    const finalConfig: ContentSecurityPolicyTemplate = deepMerge(
      getDefaultConfig(cspConfig.isDev, nonceConfig),
      cspConfig
    );
    const generatedCsp = { ...finalConfig.contentSecurityPolicy };

    rules.forEach((rule) => {
      for (const [key, value] of Object.entries(rule)) {
        if (key !== 'source') {
          const cspKey = key;
          if (typeof value === 'boolean') {
            generatedCsp[cspKey] = value;
          } else {
            if (generatedCsp[cspKey] === "'none'") {
              generatedCsp[cspKey] = value;
            } else {
              generatedCsp[cspKey] += ' ' + value;
            }
          }
        }
      }
    });

    for (const [key, value] of Object.entries(generatedCsp)) {
      if (typeof value === 'string') {
        generatedCsp[key] = value.trim();
      }
    }

    finalConfigs.push({
      source,
      ...finalConfig,
      contentSecurityPolicy: {
        ...finalConfig.contentSecurityPolicy,
        ...generatedCsp,
      },
    });
  }

  return finalConfigs;
}

export type SourceHeaders = {
  source: string;
  headers: string;
};

// next-safe adds legacy keys that are unnecessary and cause console noise
const defaultKeysToRemove = ['Feature-Policy', 'X-Content-Security-Policy', 'X-WebKit-CSP'];

function generateCspTemplates(
  cspConfig: ContentSecurityPolicyTemplate,
  cspRules: CspRule[],
  keysToRemove: string[] = defaultKeysToRemove,
  nonceConfig?: NonceConfig
) {
  const contentSecurityPolicyTemplates = generateCspTemplate(cspConfig, cspRules, nonceConfig);

  return contentSecurityPolicyTemplates.map((template: ContentSecurityPolicyTemplate) => {
    return {
      source: template.source || '/:path*',
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      headers: nextSafe
        // @ts-ignore
        .default({ ...template })
        .filter((header: { key: string }) => !keysToRemove.includes(header.key)) as Header[],
    };
  });
}

export type NonceConfig = {
  nonce?: string;
  scriptNonce?: boolean;
  styleNonce?: boolean;
};

export function generateSecurityHeaders(
  cspConfig: ContentSecurityPolicyTemplate,
  cspRules: CspRule[],
  keysToRemove: string[] = defaultKeysToRemove,
  nonceConfigParam: Partial<NonceConfig> = {} // Use a Partial type and provide an empty default
): Header[] {
  const defaultNonceConfig: NonceConfig = {
    nonce: undefined,
    scriptNonce: true,
    styleNonce: true,
  };

  // Merge the defaultNonceConfig with the passed-in nonceConfigParam
  const nonceConfig: NonceConfig = {
    ...defaultNonceConfig,
    ...nonceConfigParam,
  };

  if (!nonceConfig.nonce) {
    nonceConfig.nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  }

  const templates = generateCspTemplates(cspConfig, cspRules, keysToRemove, nonceConfig);

  const headersFromTemplate = templates.shift()?.headers || [];

  headersFromTemplate.push({ key: 'x-nonce', value: nonceConfig.nonce });

  return headersFromTemplate;
}

export function applyHeaders(response: NextResponse, headers: Header[]): NextResponse {
  headers.forEach((header) => {
    response.headers.set(header.key, header.value);
  });

  return response;
}

/*
// pathname missing when spreading request
export function generateSecureRequest(
  cspConfig: ContentSecurityPolicyTemplate,
  cspRules: CspRule[],
  request: NextRequest
): NextRequest {
  const secureHeaders = generateSecurityHeaders(cspConfig, cspRules);

  const requestHeaders = new Headers(request.headers);

  secureHeaders.forEach((header: Header) => {
    requestHeaders.set(header.key, header.value);
  });

  return {
    ...request,
    headers: requestHeaders,
  } as NextRequest;
}
 */

export { generateCspTemplates };
