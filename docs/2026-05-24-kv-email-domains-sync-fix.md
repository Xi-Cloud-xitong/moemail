# Cloudflare KV 邮箱域名同步修复日志

- 日期：2026-05-24
- 问题：GitHub Actions 部署成功后，后台域名邮箱列表仍未变化
- 根因：应用运行时从 Cloudflare KV `SITE_CONFIG` 读取 `EMAIL_DOMAINS`，而此前只修改并部署了 `wrangler.example.json` 中的 `vars.EMAIL_DOMAINS`
- 修复文件：`scripts/deploy/index.ts`

## 代码路径确认

后台配置接口：`app/api/config/route.ts`

- `GET` 从 `env.SITE_CONFIG.get("EMAIL_DOMAINS")` 读取域名列表。
- `POST` 写入 `env.SITE_CONFIG.put("EMAIL_DOMAINS", emailDomains)`。

邮箱生成接口：`app/api/emails/generate/route.ts`

- 从 `env.SITE_CONFIG.get("EMAIL_DOMAINS")` 读取允许的邮箱域名。
- 如果 KV 中旧值未更新，后台和生成接口都会继续显示/使用旧域名。

## 修复内容

部署脚本新增 `syncEmailDomainsToKV()`：

1. 读取部署过程中生成的 `wrangler.json`。
2. 解析 `vars.EMAIL_DOMAINS`。
3. 使用 `wrangler kv key put EMAIL_DOMAINS ... --binding SITE_CONFIG --config wrangler.json --remote` 写入 Cloudflare KV。
4. 在 `checkAndCreateKVNamespace()` 之后、Pages 部署之前执行同步。

## 验证

- `scripts/deploy/index.ts` 文件开头不是 BOM。
- `wrangler.example.json` 文件开头不是 BOM。
- `wrangler.example.json` 可被 `JSON.parse` 正常解析。
- `node_modules/.bin/tsc --noEmit --pretty false` 通过。

## 预期效果

下一次 GitHub Actions Deploy 成功后，Cloudflare KV `SITE_CONFIG.EMAIL_DOMAINS` 会同步为新域名批次，后台域名邮箱列表会随之变化。
