// Mihomo / Clash.Meta global override script.
//
// What it does:
// 1. Only runs when the exact front node name exists in the current config.
// 2. Builds a hidden front pool for the Aliyun transit node(s).
// 3. Clones every other real proxy into a chained proxy via dialer-proxy.
// 4. Creates a visible policy group named "阿里云前置".
// 5. Injects that new group into top-level selector groups like PROXY.
//
// Adjust FRONT_NODE_NAMES if your Aliyun front node uses a different name.

const FRONT_NODE_NAMES = ["阿里云中转"];
const FRONT_POOL_GROUP_NAME = "__阿里云前置池";
const CHAIN_GROUP_NAME = "阿里云前置";
const CHAIN_NAME_SUFFIX = " · 阿里云前置";
const INSERT_TO_GROUPS = ["PROXY", "Proxy", "GLOBAL"];

function main(config, profileName) {
  const nextConfig = config || {};
  const proxies = Array.isArray(nextConfig.proxies) ? nextConfig.proxies : [];
  const proxyGroups = Array.isArray(nextConfig["proxy-groups"]) ? nextConfig["proxy-groups"] : [];

  if (!proxies.length) {
    return nextConfig;
  }

  nextConfig.proxies = proxies.filter(proxy => {
    const name = proxy && proxy.name;
    return name && !isGeneratedChainProxy(name);
  });

  nextConfig["proxy-groups"] = proxyGroups.filter(group => {
    const name = group && group.name;
    return name !== FRONT_POOL_GROUP_NAME && name !== CHAIN_GROUP_NAME;
  });

  const baseProxies = nextConfig.proxies;
  const baseGroups = nextConfig["proxy-groups"];
  const frontNodes = baseProxies.filter(proxy => isFrontNode(proxy && proxy.name));

  if (!frontNodes.length) {
    return nextConfig;
  }

  const frontNodeNames = unique(frontNodes.map(proxy => proxy.name));
  const chainCandidates = baseProxies.filter(proxy => shouldChainProxy(proxy, frontNodeNames));

  if (!chainCandidates.length) {
    return nextConfig;
  }

  const chainedProxies = chainCandidates.map(proxy => {
    const chained = deepClone(proxy);
    chained.name = makeChainName(proxy.name);
    chained["dialer-proxy"] = FRONT_POOL_GROUP_NAME;
    return chained;
  });

  const chainProxyNames = chainedProxies.map(proxy => proxy.name);

  nextConfig.proxies = baseProxies.concat(chainedProxies);
  nextConfig["proxy-groups"] = baseGroups.concat([
    {
      name: FRONT_POOL_GROUP_NAME,
      type: "select",
      proxies: frontNodeNames,
      hidden: true,
    },
    {
      name: CHAIN_GROUP_NAME,
      type: "select",
      proxies: chainProxyNames,
    },
  ]);

  for (const group of nextConfig["proxy-groups"]) {
    if (!group || !INSERT_TO_GROUPS.includes(group.name)) {
      continue;
    }

    group.proxies = Array.isArray(group.proxies) ? group.proxies : [];
    if (!group.proxies.includes(CHAIN_GROUP_NAME)) {
      group.proxies.unshift(CHAIN_GROUP_NAME);
    }
  }

  return nextConfig;
}

function shouldChainProxy(proxy, frontNodeNames) {
  if (!proxy || !proxy.name || !proxy.type) {
    return false;
  }

  if (isGeneratedChainProxy(proxy.name)) {
    return false;
  }

  if (frontNodeNames.includes(proxy.name)) {
    return false;
  }

  const type = String(proxy.type).toLowerCase();
  return type !== "direct" && type !== "reject" && type !== "pass";
}

function isFrontNode(name) {
  return FRONT_NODE_NAMES.includes(name);
}

function isGeneratedChainProxy(name) {
  return typeof name === "string" && name.endsWith(CHAIN_NAME_SUFFIX);
}

function makeChainName(name) {
  return `${name}${CHAIN_NAME_SUFFIX}`;
}

function unique(list) {
  return Array.from(new Set(list.filter(Boolean)));
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}
