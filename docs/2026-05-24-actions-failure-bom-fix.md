# GitHub Actions 部署失败排障日志

- 日期：2026-05-24
- 失败 Run：26363803914
- 失败 Job：77603934845
- 失败步骤：Run deploy script
- 失败标签：v0.5.3
- 根因类型：配置文件编码问题

## 现象

GitHub Actions `Deploy` workflow 已被 `v0.5.3` 标签触发，但在 `Run deploy script` 步骤失败。

GitHub API 可见步骤状态：

- Checkout：成功
- Setup pnpm：成功
- Setup Node.js：成功
- Install Dependencies：成功
- Run deploy script：失败

## 根因

`wrangler.example.json` 被 PowerShell `Set-Content -Encoding UTF8` 写成带 BOM 的 UTF-8 文件。

部署脚本 `scripts/deploy/index.ts` 使用：

```ts
const configContent = readFileSync(examplePath, "utf-8");
const json = JSON.parse(configContent);
```

Node.js `JSON.parse` 不接受文件开头的 BOM，导致部署脚本在解析 `wrangler.example.json` 时失败。

本地复现结果：

```text
firstCodePoint=0xfeff
JSON_PARSE_FAIL=Unexpected token '﻿', "﻿{ ..." is not valid JSON
```

## 修复

已用 Node.js 重新写入 `wrangler.example.json`：

- 移除文件开头 BOM。
- 保持合法 JSON。
- 保留已轮换后的 `EMAIL_DOMAINS`。

修复后本地验证：

```text
firstCodePoint=0x7b
JSON_PARSE_OK
```

## 后续动作

修复提交推送后，需要重新打 `v*` 标签触发 `.github/workflows/deploy.yml`。
