// src/index.ts
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
var groupBySource = function(cspRules) {
  const grouped = {};
  cspRules.forEach((rule) => {
    const source = rule.source || "/";
    if (!grouped[source]) {
      grouped[source] = [];
    }
    grouped[source].push(rule);
  });
  return grouped;
};
var generateCspTemplate = function(cspConfig, cspRules) {
  const groupedRules = groupBySource(cspRules);
  const finalConfigs = [];
  for (const [source, rules] of Object.entries(groupedRules)) {
    const finalConfig = deepMerge(Default, cspConfig);
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
var Default = {
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
    "script-src": "'self'",
    "style-src": "'self'",
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
export {
  generateCspTemplate,
  Default
};
