# Cloudflare KV 同步命令修正日志

- 日期：2026-05-24
- 问题：`v0.5.5` 增加了部署时同步 KV，但命令使用了当前 Wrangler 不支持的参数组合
- 修复文件：`scripts/deploy/index.ts`

## 修正内容

原同步命令使用：

```text
wrangler kv key put EMAIL_DOMAINS ... --binding SITE_CONFIG --config wrangler.json --remote
```

本地 `wrangler kv key put --help` 显示该命令支持 `--binding` / `--namespace-id`，但不支持 `--remote` / `--config`。

已改为：

1. 从部署脚本生成后的 `wrangler.json` 读取 `kv_namespaces[0].id`。
2. 使用 `wrangler kv key put EMAIL_DOMAINS ... --namespace-id <id>` 写入远端 KV。

## 验证

- `scripts/deploy/index.ts` 文件开头不是 BOM。
- `wrangler.example.json` 文件开头不是 BOM。
- `wrangler.example.json` 可被 `JSON.parse` 正常解析。
- `node_modules/.bin/tsc --noEmit --pretty false` 通过。
