// ==================== Mihomo / Clash Meta 自建订阅通用覆写脚本 ====================
// 定位：只给自建节点订阅使用，负责分组、分流、可选 DNS 精简增强和节点细节优化

function main(params) {
  // ========== 生效范围：只有命中自建节点才应用 ==========
  const SELF_NODES = [
    "Akile-香港",
    "Akile-香港1",
    "vmiss-美西"
  ];

  // ========== 可配置项 ==========
  const GROUP_TYPE = "select";
  const FALLBACK = "DIRECT";
  const DNS_MODE = "off"; // 可选: off | lite

  const AUTO_GROUP_NAME = "AUTO";
  const AUTO_TEST_URL = "https://www.gstatic.com/generate_204";
  const AUTO_TEST_INTERVAL = 300;
  const AUTO_TEST_TOLERANCE = 50;
  const AUTO_TEST_TIMEOUT = 5000;

  // ========== 1. 节点名称 ==========
  const AI_NODES = [
    "hk-Front",
    "hk-Front1",
    "Akile-香港",
    "Akile-香港1",
    "vmiss-美西",
    "越南-河内",
    "合租_yanna"
  ];

  const STREAM_NODES = [
    "hk-Front",
    "hk-Front1",
    "Akile-香港",
    "Akile-香港1",
    "vmiss-美西",
    "越南-河内",
    "合租_yanna"
  ];

  const HOME_NODES = [
    "hk-Front",
    "hk-Front1",
    "Akile-香港",
    "Akile-香港1",
    "vmiss-美西",
    "越南-河内",
    "合租_yanna"
  ];

  // ========== 2. 自定义规则（最高优先级） ==========
  const CUSTOM_RULES = [
    // ========== 国内域名强制直连示例 ==========

    // "DOMAIN-SUFFIX,baidu.com,DIRECT",
    // "DOMAIN-SUFFIX,qq.com,DIRECT",
    // "DOMAIN-SUFFIX,weixin.qq.com,DIRECT",
   
    // ========== 指定走家宽组示例 ==========

    // "DOMAIN-SUFFIX,chatgpt.com,家宽组",
    // "DOMAIN-SUFFIX,openai.com,家宽组",
    // "DOMAIN-SUFFIX,netflix.com,家宽组",

    // ========== 指定走 AI解锁 示例 ==========

    // "DOMAIN-SUFFIX,example-ai.com,AI解锁",

    // ========== 广告 / 拦截示例 ==========

    // "DOMAIN-KEYWORD,adservice,REJECT",
    // "DOMAIN-KEYWORD,pagead,REJECT",
    // "DOMAIN-SUFFIX,doubleclick.net,REJECT",
  ];

  // ========== 3. 海外 AI 域名 ==========
  const AI_DOMAINS = [
    "openai.com", "chatgpt.com", "oaistatic.com", "oaiusercontent.com",
    "ai.com", "anthropic.com", "claude.ai",
    "gemini.google.com", "aistudio.google.com", "generativelanguage.googleapis.com",
    "bard.google.com", "copilot.microsoft.com", "perplexity.ai",
    "x.ai", "grok.x.ai", "cursor.sh", "cursor.com"
  ];

  // ========== 4. 流媒体域名 ==========
  const STREAM_DOMAINS = [
    "netflix.com", "netflix.net", "nflxvideo.net", "nflximg.net", "nflxso.net",
    "disneyplus.com", "disney.com", "bamgrid.com", "dssott.com",
    "youtube.com", "googlevideo.com", "ytimg.com", "youtu.be",
    "spotify.com", "scdn.co", "spoti.fi",
    "bahamut.com.tw", "gamer.com.tw", "mytvsuper.com", "tvb.com"
  ];

  // ========== 5. Telegram 规则 ==========
  const TG_DOMAINS = [
    "telegram.org",
    "telegram.me",
    "t.me",
    "telegra.ph",
    "telesco.pe",
    "tdesktop.com",
    "telegram-cdn.org"
  ];

  const TG_IP_RULES = [
    "91.108.4.0/22",
    "91.108.8.0/22",
    "91.108.12.0/22",
    "91.108.16.0/22",
    "91.108.20.0/22",
    "91.108.56.0/22",
    "149.154.160.0/20",
    "185.76.151.0/24"
  ];

  const proxies = Array.isArray(params.proxies) ? params.proxies : [];
  const existingNames = new Set(proxies.map(proxy => proxy.name).filter(Boolean));
  const isSelfBuilt = SELF_NODES.some(name => existingNames.has(name));

  if (!isSelfBuilt) {
    return params;
  }

  const allProxyNames = Array.from(existingNames);
  const filterExisting = list => list.filter(name => existingNames.has(name));

  // ========== 6. 规则集 ==========
  if (!params["rule-providers"]) params["rule-providers"] = {};
  Object.assign(params["rule-providers"], {
    reject: {
      type: "http",
      behavior: "domain",
      format: "text",
      url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt",
      path: "./ruleset/reject.yaml",
      interval: 86400
    },
    private: {
      type: "http",
      behavior: "domain",
      format: "text",
      url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/private.txt",
      path: "./ruleset/private.yaml",
      interval: 86400
    },
    direct: {
      type: "http",
      behavior: "domain",
      format: "text",
      url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt",
      path: "./ruleset/direct.yaml",
      interval: 86400
    },
    proxy: {
      type: "http",
      behavior: "domain",
      format: "text",
      url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/proxy.txt",
      path: "./ruleset/proxy.yaml",
      interval: 86400
    },
    cncidr: {
      type: "http",
      behavior: "ipcidr",
      format: "text",
      url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/cncidr.txt",
      path: "./ruleset/cncidr.yaml",
      interval: 86400
    }
  });

  // ========== 7. 可选 DNS 精简增强 ==========
  if (DNS_MODE === "lite") {
    const cnDns = [
      "https://dns.alidns.com/dns-query",
      "https://doh.pub/dns-query"
    ];
    const proxyDns = [
      "https://dns.cloudflare.com/dns-query",
      "https://dns.google/dns-query"
    ];

    params.dns = {
      enable: true,
      ipv6: false,
      "enhanced-mode": "redir-host",
      "default-nameserver": ["223.5.5.5", "119.29.29.29"],
      nameserver: cnDns,
      "direct-nameserver": cnDns,
      "direct-nameserver-follow-policy": true,
      "proxy-server-nameserver": proxyDns,
      "nameserver-policy": {
        "geosite:cn": cnDns,
        "+.openai.com": proxyDns,
        "+.chatgpt.com": proxyDns,
        "+.oaistatic.com": proxyDns,
        "+.oaiusercontent.com": proxyDns,
        "+.anthropic.com": proxyDns,
        "+.claude.ai": proxyDns,
        "+.x.ai": proxyDns,
        "+.cursor.sh": proxyDns,
        "+.cursor.com": proxyDns,
        "+.telegram.org": proxyDns,
        "+.telegram.me": proxyDns,
        "+.t.me": proxyDns,
        "+.telegra.ph": proxyDns,
        "+.telesco.pe": proxyDns,
        "+.netflix.com": proxyDns,
        "+.netflix.net": proxyDns,
        "+.youtube.com": proxyDns,
        "+.googlevideo.com": proxyDns,
        "+.ytimg.com": proxyDns,
        "+.spotify.com": proxyDns
      }
    };
  }

  // ========== 8. 创建策略组 ==========
  if (!Array.isArray(params["proxy-groups"])) {
    params["proxy-groups"] = [];
  }

  const makeSelectGroup = (name, nodes) => {
    const members = filterExisting(nodes);
    if (!members.length) return null;

    const proxiesForGroup = [];
    if (!proxiesForGroup.includes("PROXY")) {
      proxiesForGroup.push("PROXY");
    }
    members.forEach(member => {
      if (!proxiesForGroup.includes(member)) {
        proxiesForGroup.push(member);
      }
    });
    if (FALLBACK && !proxiesForGroup.includes(FALLBACK)) {
      proxiesForGroup.push(FALLBACK);
    }

    return {
      name,
      type: GROUP_TYPE,
      proxies: proxiesForGroup
    };
  };

  const makeAutoGroup = (name, nodes) => {
    if (!nodes.length) return null;
    return {
      name,
      type: "url-test",
      url: AUTO_TEST_URL,
      interval: AUTO_TEST_INTERVAL,
      tolerance: AUTO_TEST_TOLERANCE,
      timeout: AUTO_TEST_TIMEOUT,
      lazy: true,
      proxies: nodes
    };
  };

  const desiredGroups = [
    makeAutoGroup(AUTO_GROUP_NAME, allProxyNames),
    makeSelectGroup("家宽组", HOME_NODES),
    makeSelectGroup("AI解锁", AI_NODES),
    makeSelectGroup("流媒体解锁", STREAM_NODES)
  ].filter(Boolean);

  const desiredGroupNames = new Set(desiredGroups.map(group => group.name));
  const groups = params["proxy-groups"].filter(group => !desiredGroupNames.has(group.name));

  const mainGroup = groups.find(group => {
    const name = typeof group.name === "string" ? group.name.toUpperCase() : "";
    return name === "PROXY" || name === "GLOBAL";
  });

  if (mainGroup && Array.isArray(mainGroup.proxies)) {
    const merged = [];
    mainGroup.proxies.forEach(name => {
      if (!merged.includes(name)) {
        merged.push(name);
      }
    });
    if (!merged.includes(AUTO_GROUP_NAME)) {
      merged.unshift(AUTO_GROUP_NAME);
    }
    mainGroup.proxies = merged;
  }

  const proxyGroupIndex = groups.findIndex(group => {
    const name = typeof group.name === "string" ? group.name.toUpperCase() : "";
    return name === "PROXY";
  });
  const insertIndex = proxyGroupIndex === -1 ? groups.length : proxyGroupIndex + 1;
  groups.splice(insertIndex, 0, ...desiredGroups);
  params["proxy-groups"] = groups;

  // ========== 9. uTLS 指纹 ==========
  proxies.forEach(proxy => {
    if (["vless", "vmess", "trojan", "ss"].includes(proxy.type) && !proxy["client-fingerprint"]) {
      proxy["client-fingerprint"] = "chrome";
    }
  });

  // ========== 10. 生成规则 ==========
  const rules = [];
  const pushRule = rule => {
    if (!rules.includes(rule)) {
      rules.push(rule);
    }
  };

  CUSTOM_RULES.forEach(pushRule);
  pushRule("RULE-SET,reject,REJECT");

  TG_DOMAINS.forEach(domain => pushRule(`DOMAIN-SUFFIX,${domain},PROXY`));
  TG_IP_RULES.forEach(cidr => pushRule(`IP-CIDR,${cidr},PROXY,no-resolve`));

  if (desiredGroups.some(group => group.name === "AI解锁")) {
    AI_DOMAINS.forEach(domain => pushRule(`DOMAIN-SUFFIX,${domain},AI解锁`));
  }

  if (desiredGroups.some(group => group.name === "流媒体解锁")) {
    STREAM_DOMAINS.forEach(domain => pushRule(`DOMAIN-SUFFIX,${domain},流媒体解锁`));
  }

  [
    "RULE-SET,private,DIRECT",
    "RULE-SET,direct,DIRECT",
    "RULE-SET,cncidr,DIRECT",
    "GEOIP,CN,DIRECT",
    "RULE-SET,proxy,PROXY",
    "MATCH,PROXY"
  ].forEach(pushRule);

  params.rules = rules;
  return params;
}
