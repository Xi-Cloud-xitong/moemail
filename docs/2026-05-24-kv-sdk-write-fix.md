# Cloudflare KV SDK 写入修复日志

- 日期：2026-05-24
- 问题：Deploy workflow 仍在 `Run deploy script` 失败
- 失败 Run：26364615682
- 修复文件：
  - `scripts/deploy/index.ts`
  - `scripts/deploy/cloudflare.ts`

## 判断

无法下载完整 Actions 日志，GitHub API 显示失败步骤仍是 `Run deploy script`。结合此前修改，最可疑点是新增的 `wrangler kv key put` 子命令在 GitHub Actions 环境中参数/鉴权行为不稳定。

## 修复

移除部署脚本中的 `pnpm dlx wrangler kv key put ...` 子进程调用，改用项目已有 `cloudflare` SDK 客户端直接写 KV：

```ts
client.kv.namespaces.values.update(namespaceId, "EMAIL_DOMAINS", {
  account_id: CF_ACCOUNT_ID,
  metadata: "",
  value,
})
```

部署流程仍然是：

1. 创建/发现 KV namespace。
2. 写入 `wrangler.json` 的 namespace id。
3. 从 `wrangler.json` 读取 `vars.EMAIL_DOMAINS`。
4. 用 SDK 写入 `SITE_CONFIG` KV 的 `EMAIL_DOMAINS`。
5. 继续 Pages / Email Worker / Cleanup Worker 部署。

## 验证

- `scripts/deploy/index.ts` 文件开头不是 BOM。
- `scripts/deploy/cloudflare.ts` 文件开头不是 BOM。
- `wrangler.example.json` 文件开头不是 BOM。
- `wrangler.example.json` 可被 `JSON.parse` 正常解析。
- `node_modules/.bin/tsc --noEmit --pretty false` 通过。
