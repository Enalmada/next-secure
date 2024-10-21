// src/index.ts
import * as nextSafe from "next-safe";
function deepMerge(target, source) {
  const output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}
function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}
var getDefaultConfig = (isDev, nonceConfig) => {
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
    contentTypeOptions: "nosniff",
    contentSecurityPolicy: {
      "base-uri": "'none'",
      "child-src": "'none'",
      "connect-src": "'self'",
      "default-src": "'self'",
      "font-src": "'self'",
      "form-action": "'self'",
      "frame-ancestors": "'none'",
      "frame-src": "'none'",
      "img-src": "'self'",
      "manifest-src": "'self'",
      "media-src": "'self'",
      "object-src": "'none'",
      "prefetch-src": "'self'",
      "script-src": scriptSrc,
      "style-src": styleSrc,
      "worker-src": "'self'",
      mergeDefaultDirectives: false,
      reportOnly: false
    },
    frameOptions: "DENY",
    permissionsPolicyDirectiveSupport: ["proposed", "standard"],
    isDev: false,
    referrerPolicy: "no-referrer",
    xssProtection: "1; mode=block"
  };
};
function groupBySource(cspRules, ignorePath = false) {
  const grouped = {};
  cspRules.forEach((rule) => {
    const source = ignorePath ? "/" : rule.source || "/";
    if (!grouped[source]) {
      grouped[source] = [];
    }
    grouped[source].push(rule);
  });
  return grouped;
}
function generateCspTemplate(cspConfig, cspRules, nonceConfig) {
  const groupedRules = groupBySource(cspRules, !!nonceConfig?.nonce);
  const finalConfigs = [];
  for (const [source, rules] of Object.entries(groupedRules)) {
    const finalConfig = deepMerge(getDefaultConfig(cspConfig.isDev, nonceConfig), cspConfig);
    const generatedCsp = { ...finalConfig.contentSecurityPolicy };
    rules.forEach((rule) => {
      for (const [key, value] of Object.entries(rule)) {
        if (key !== "source") {
          const cspKey = key;
          if (typeof value === "boolean") {
            generatedCsp[cspKey] = value;
          } else {
            if (generatedCsp[cspKey] === "'none'") {
              generatedCsp[cspKey] = value;
            } else {
              generatedCsp[cspKey] += ` ${value}`;
            }
          }
        }
      }
    });
    for (const [key, value] of Object.entries(generatedCsp)) {
      if (typeof value === "string") {
        generatedCsp[key] = value.trim();
      }
    }
    finalConfigs.push({
      source,
      ...finalConfig,
      contentSecurityPolicy: {
        ...finalConfig.contentSecurityPolicy,
        ...generatedCsp
      }
    });
  }
  return finalConfigs;
}
var defaultKeysToRemove = [
  "Feature-Policy",
  "X-Content-Security-Policy",
  "X-WebKit-CSP"
];
function generateCspTemplates(cspConfig, cspRules, keysToRemove = defaultKeysToRemove, nonceConfig) {
  const contentSecurityPolicyTemplates = generateCspTemplate(cspConfig, cspRules, nonceConfig);
  return contentSecurityPolicyTemplates.map((template) => {
    return {
      source: template.source || "/:path*",
      headers: nextSafe.default({ ...template }).filter((header) => !keysToRemove.includes(header.key))
    };
  });
}
function generateSecurityHeaders(cspConfig, cspRules, keysToRemove = defaultKeysToRemove, nonceConfigParam = {}) {
  const defaultNonceConfig = {
    nonce: undefined,
    scriptNonce: true,
    styleNonce: true
  };
  const nonceConfig = {
    ...defaultNonceConfig,
    ...nonceConfigParam
  };
  if (!nonceConfig.nonce) {
    nonceConfig.nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  }
  const templates = generateCspTemplates(cspConfig, cspRules, keysToRemove, nonceConfig);
  const headersFromTemplate = templates.shift()?.headers || [];
  headersFromTemplate.push({ key: "x-nonce", value: nonceConfig.nonce });
  return headersFromTemplate;
}
function applyHeaders(response, headers) {
  headers.forEach((header) => {
    response.headers.set(header.key, header.value);
  });
  return response;
}
export {
  generateSecurityHeaders,
  generateCspTemplates,
  applyHeaders
};
