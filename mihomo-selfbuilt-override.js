// ==================== Mihomo / Clash Meta 自建订阅覆写脚本（极简·防泄漏 DNS） ====================
// 定位：只给含自建节点的订阅使用，负责全局增强 + fake-ip 防泄漏 DNS。
//
// 【DNS 铁律】全脚本只有一处 config.dns（合并写法）。任何地方都不得再硬赋值 config.dns，
//   否则会冲掉 Sparkle 面板注入的 nameserver-policy / proxy-server-nameserver（防泄漏关键项）。
// 【使用前提】Sparkle 客户端「DNS」面板必须保持开启——它提供上述 policy，本脚本只补基座并保留它。
//   两者合体才不泄漏；关掉面板 DNS 则防泄漏失效。

function main(config) {
  // ========== 生效范围：只有命中自建节点才应用 ==========
  const SELF_NODES = [
    "云悠-香港",
    "vmiss-美西"
  ];

  const proxies = Array.isArray(config.proxies) ? config.proxies : [];
  const existingNames = new Set(proxies.map(proxy => proxy && proxy.name).filter(Boolean));
  const isSelfBuilt = SELF_NODES.some(name => existingNames.has(name));

  if (!isSelfBuilt) {
    return config;
  }

  // ========== 全局增强 ==========
  config.profile = {
    "store-selected": true,
    "store-fake-ip": false,
  };

  config["geox-url"] = {
    geoip: "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip.dat",
    geosite: "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat",
    mmdb: "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/country.mmdb",
    asn: "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/GeoLite2-ASN.mmdb",
  };

  config["hosts"] = {
    "doh.pub": ["1.12.12.21", "1.12.12.12"],
    "dns.google": ["8.8.8.8", "8.8.4.4"],
    "dns.alidns.com": ["223.5.5.5", "223.6.6.6"],
    "cloudflare-dns.com": ["1.1.1.1", "1.0.0.1"]
  };

  config.sniffer = {
    enable: true,
    "parse-pure-ip": true,
    sniff: {
      HTTP: { ports: [80, "8080-8880"], "override-destination": true },
      QUIC: { ports: [443, 8443] },
      TLS: { ports: [443, 8443] },
    },
  };

  // ---------------- DNS 覆写逻辑开始 ----------------
  config.dns = config.dns || {};

  // 基础 DNS 配置，不包含 nameserver-policy 和 proxy-server-nameserver
  const defaultDnsConfig = {
    enable: true,
    listen: "0.0.0.0:5053",
    ipv6: false,
    "filter-aaaa": true,
    "use-system-hosts": false,
    "enhanced-mode": "fake-ip",
    "fake-ip-range": "198.18.0.1/16",
    "fake-ip-filter-mode": "blacklist",
    "respect-rules": true,
    "fake-ip-filter": [
      "+.lan", "+.local", "+.msftconnecttest.com", "+.msftncsi.com",
      "localhost.ptlogin2.qq.com", "time.*.com", "stun.*.*",
      "+.srv.nintendo.net", "+.stun.playstation.net", "+.xboxlive.com"
    ],
    "default-nameserver": ["223.5.5.5", "119.29.29.29"],
    "nameserver": [
      "https://doh.pub/dns-query",
      "https://dns.alidns.com/dns-query"
    ],
    "fallback": [
      "https://1.1.1.1/dns-query",
      "https://8.8.8.8/dns-query",
      "https://dns.google/dns-query"
    ],
    "fallback-filter": {
      "geoip": true,
      "geoip-code": "CN",
      "geosite": ["gfw"],
      "ipcidr": ["240.0.0.0/4"]
    },
    "direct-nameserver": ["https://doh.pub/dns-query", "https://dns.alidns.com/dns-query"],
    "direct-nameserver-follow-policy": false
  };

  // 将 defaultDnsConfig 合并到 config.dns 中。
  // 因为 ...config.dns 在后面，所以原配置中自带的 nameserver-policy 和 proxy-server-nameserver 会被完美保留。
  config.dns = { ...defaultDnsConfig, ...config.dns };
  // ---------------- DNS 覆写逻辑结束 ----------------

  return config;
}
