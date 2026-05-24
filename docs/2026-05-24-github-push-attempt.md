# GitHub 推送尝试日志

- 日期：2026-05-24
- 仓库：Xi-Cloud-xitong/moemail
- 本地目录：C:\Users\Ceo-XiTong\Documents\MoMail
- 目标：将邮箱子域名轮换配置推送到 GitHub，由现有部署环境接管
- 敏感信息处理：未写入、未回显、未持久化 Cloudflare/GitHub Token

## 本次准备好的变更

计划推送的最小文件范围：

- `wrangler.example.json`
- `docs/2026-05-24-email-subdomain-rotation.md`
- `docs/2026-05-24-cloudflare-email-domains-check.md`

其中核心配置变更为：

- 保留根域名：`0355650.xyz`、`xi-clouds.cn`、`xi-clouds.top`、`xi-cloud.top`、`xi-work.cn`
- 移除旧前缀：`mail`、`temp`、`hi`、`me`、`go`、`fun`、`cool`、`fast`、`vip`
- 新增前缀：`inbox`、`post`、`letter`、`box`、`drop`、`send`、`relay`、`cloud`、`edge`

## 已执行验证

- `wrangler.example.json` 可被 JSON 解析。
- `EMAIL_DOMAINS` 总数：50。
- `EMAIL_DOMAINS` 唯一数：50。
- 旧前缀残留：0。

## 推送阻塞点

当前环境无法完成 GitHub 推送：

1. 本机未安装 `gh`。
2. 当前 Codex 进程中没有 `GITHUB_TOKEN` 或 `GH_TOKEN` 环境变量。
3. `git fetch/ls-remote` 走 HTTPS 访问 `github.com:443` 失败。
4. SSH 默认配置文件 `C:\Users\Ceo-XiTong\.ssh\config` 带 BOM，Git SSH 报错：`Bad configuration option: \357\273\277host`。
5. 临时忽略 SSH 配置后，GitHub 返回：`Permission denied (publickey)`。

## 可继续执行的方式

### 方式 A：提供 GitHub Token 环境变量

在同一运行环境中设置具备仓库写权限的 Token：

```powershell
$env:GITHUB_TOKEN = "[REDACTED]"
```

然后可通过 GitHub Contents API 仅更新目标文件，不需要全量 Git 推送。

### 方式 B：修复 SSH 权限

1. 去除 `C:\Users\Ceo-XiTong\.ssh\config` 文件开头 BOM。
2. 确认本机 SSH key 已添加到 GitHub 账号或仓库 Deploy Key，且具备写权限。
3. 再执行正常 `git fetch` / `git push`。

### 方式 C：手动在 GitHub 网页更新

将本地 `wrangler.example.json` 内容复制到 GitHub 对应文件，并新增两份 `docs/*.md` 日志文件。
