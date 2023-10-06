import { type NextResponse } from 'next/server';
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
export type SourceHeaders = {
    source: string;
    headers: string;
};
declare function generateCspTemplates(cspConfig: ContentSecurityPolicyTemplate, cspRules: CspRule[], keysToRemove?: string[], nonce?: string): {
    source: string;
    headers: Header[];
}[];
export declare function generateSecurityHeaders(cspConfig: ContentSecurityPolicyTemplate, cspRules: CspRule[], keysToRemove?: string[], nonce?: string): Header[];
export declare function applyHeaders(response: NextResponse, headers: Header[]): NextResponse;
export { generateCspTemplates };
