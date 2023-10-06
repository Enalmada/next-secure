// src/index.ts
import * as nextSafe from "next-safe";
var deepMerge = function(target, source) {
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
};
var isObject = function(item) {
  return item && typeof item === "object" && !Array.isArray(item);
};
var groupBySource = function(cspRules, ignorePath = false) {
  const grouped = {};
  cspRules.forEach((rule) => {
    const source = ignorePath ? "/" : rule.source || "/";
    if (!grouped[source]) {
      grouped[source] = [];
    }
    grouped[source].push(rule);
  });
  return grouped;
};
var generateCspTemplate = function(cspConfig, cspRules, nonce) {
  const groupedRules = groupBySource(cspRules, !!nonce);
  const finalConfigs = [];
  for (const [source, rules] of Object.entries(groupedRules)) {
    const finalConfig = deepMerge(getDefaultConfig(cspConfig.isDev, nonce), cspConfig);
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
              generatedCsp[cspKey] += " " + value;
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
};
var generateCspTemplates = function(cspConfig, cspRules, keysToRemove = defaultKeysToRemove, nonce) {
  const contentSecurityPolicyTemplates = generateCspTemplate(cspConfig, cspRules, nonce);
  return contentSecurityPolicyTemplates.map((template) => {
    return {
      source: template.source || "/:path*",
      headers: nextSafe.default({ ...template }).filter((header) => !keysToRemove.includes(header.key))
    };
  });
};
function generateSecurityHeaders(cspConfig, cspRules, keysToRemove = defaultKeysToRemove, nonce) {
  if (!nonce) {
    nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  }
  const templates = generateCspTemplates(cspConfig, cspRules, keysToRemove, nonce);
  const headersFromTemplate = templates.shift()?.headers || [];
  headersFromTemplate.push({ key: "x-nonce", value: nonce });
  return headersFromTemplate;
}
function applyHeaders(response, headers) {
  headers.forEach((header) => {
    response.headers.set(header.key, header.value);
  });
  return response;
}
var getDefaultConfig = (isDev, nonce) => {
  let scriptSrc = "'self'";
  let styleSrc = "'self'";
  if (isDev) {
    scriptSrc += " 'unsafe-inline'";
    styleSrc += " 'unsafe-inline'";
  } else if (nonce) {
    scriptSrc += ` 'nonce-${nonce}' 'strict-dynamic'`;
    styleSrc += ` 'nonce-${nonce}'`;
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
var defaultKeysToRemove = ["Feature-Policy", "X-Content-Security-Policy", "X-WebKit-CSP"];
export {
  generateSecurityHeaders,
  generateCspTemplates,
  applyHeaders
};
