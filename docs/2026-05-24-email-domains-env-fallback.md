# 邮箱域名读取兜底修复日志

- 日期：2026-05-24
- 问题：后台域名邮箱列表仍显示旧值
- 根因：后台与邮箱生成接口读取 Cloudflare KV `SITE_CONFIG.EMAIL_DOMAINS`，而 Worker 变量 `EMAIL_DOMAINS` 已更新但未被优先使用
- 修复文件：
  - `app/api/config/route.ts`
  - `app/api/emails/generate/route.ts`
  - `types.d.ts`

## 修复内容

1. `CloudflareEnv` 增加可选 `EMAIL_DOMAINS` 类型。
2. 后台配置接口优先返回 `env.EMAIL_DOMAINS`，没有该变量时再读 KV。
3. 邮箱生成接口优先使用 `env.EMAIL_DOMAINS` 校验域名，没有该变量时再读 KV。

## 作用

部署后，只要 `wrangler.example.json` / `wrangler.json` 中的 `vars.EMAIL_DOMAINS` 是新域名批次，后台和生成接口就会立即使用新域名，不再被 KV 旧值阻塞。

## 验证

- `node_modules/.bin/tsc --noEmit --pretty false` 通过。
