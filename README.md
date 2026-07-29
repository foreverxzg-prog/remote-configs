# Mihomo 极简覆盖模板说明

这个目录用于单独存放给 `subconverter` / `SubConverter-Extended` 使用的远程配置模板文件，便于上传到一个只保存 `.ini` 和 `.md` 的独立仓库。

当前文件：

- `minimal-clean-meta-clash.ini`

## 这个模板的作用

这份模板不是给 `sing-box` 用的，也不是为了生成“纯节点列表”。

它的用途只有一个：

**强制覆盖 `SubConverter-Extended` 在 `Clash.Meta / Mihomo` 转换时自动附带的那一大堆预设分流、策略组和规则。**

覆盖后保留一个极简结构：

- 一个 `PROXY` 选择组
- 一个 `DIRECT` 选项
- 一条 `FINAL -> PROXY` 的兜底规则

也就是说，它会把后端原本复杂的默认分流压缩成一个非常薄的配置层，让客户端后续自行处理为主。

## 适用范围

适合这些客户端：

- Clash.Meta
- Mihomo 内核客户端
- 基于 Mihomo / Clash.Meta 配置格式工作的其他客户端

不建议用于：

- `sing-box` 纯节点订阅
- 你明确想保留后端完整分流模板的场景

## 与中间层的关系

Cloudflare Worker 中间层本身不保存这份模板的内容，也不在代码里写死分流规则。

中间层只负责：

1. 校验访问令牌
2. 从 GitHub 私有仓库拉取原始 `nodes.txt`
3. 调用 `SubConverter-Extended` 转换
4. 把转换结果返回给客户端

当你在中间层生成的 `clash-meta` 链接后附带 `config=这份 ini 的原始地址` 时，Worker 会把这个参数继续转发给 `SubConverter-Extended`。

这样做的结果是：

- `sing-box` 链接仍然可以保持纯净，不加这个模板
- `clash-meta / mihomo` 链接才会强制覆盖后端默认预设

示例：

```txt
https://你的worker域名/clash-meta/你的ACCESS_TOKEN?config=https://raw.githubusercontent.com/你的用户名/你的仓库/main/minimal-clean-meta-clash.ini
```

## 与 sub 前端的关系

如果你的 `subweb` 前端负责给用户生成订阅链接，那么前端只需要在 `Mihomo / Clash.Meta` 这类客户端的链接里追加 `config=...` 即可。

推荐做法：

- `sing-box`：不要加 `config`
- `clash-meta / mihomo`：加上这份模板的原始地址
- 其他客户端：按需决定是否共用这份模板

这样前端和中间层分工会很清晰：

- 前端决定“给哪个客户端追加模板”
- 中间层负责把参数安全转发给后端
- 后端负责真正执行转换

## 为什么单独放仓库

建议把这份 `.ini` 和本说明文件单独放在一个独立仓库，只保存配置文件，不和后端项目源码混在一起。

这样做有几个好处：

- 后端更新、重建容器、升级镜像时不会把模板覆盖掉
- 原始地址稳定，便于长期在 `config=` 里引用
- 以后如果要微调模板，只改这个仓库即可，不必改 Worker 或后端容器

## 推荐仓库结构

```txt
remote-configs/
├── README.md
└── minimal-clean-meta-clash.ini
```

## 当前模板内容概念

`minimal-clean-meta-clash.ini` 的逻辑非常简单：

- `overwrite_original_rules=true`
  - 覆盖后端默认预设规则
- `custom_proxy_group=PROXY\`select\`[]DIRECT\`.*`
  - 生成一个最小选择组，把所有节点放进去，并允许手动切到 `DIRECT`
- `ruleset=PROXY,[]FINAL`
  - 把最终规则指向 `PROXY`

它不是“无规则”，而是“只保留最小可运行规则”。

## 使用建议

如果你的目标是：

- `sing-box` 要纯节点
- `Mihomo` 不要后端默认那一堆复杂分流
- 但仍然要一份可导入、可运行、极简的 Mihomo 配置

那么这份模板就是给 `Mihomo / Clash.Meta` 准备的。