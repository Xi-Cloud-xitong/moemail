# Cloudflare Worker 邮箱域名配置核查日志

- 日期：2026-05-24
- 仓库：Xi-Cloud-xitong/moemail
- 本地目录：C:\Users\Ceo-XiTong\Documents\MoMail
- 操作类型：只读核查 + 本地日志记录
- 敏感信息处理：未写入、未回显、未持久化 Cloudflare API Token

## 核查结论

从公开仓库 `wrangler.example.json` 的 `vars.EMAIL_DOMAINS` 读取到 Worker 侧配置的邮箱域名共 50 个。

注意：这是 Worker 仓库配置中的域名白名单/可用域名配置，不等同于 Cloudflare Email Routing 后台当前已启用的线上路由状态。线上 Email Routing 状态需要通过 Cloudflare Dashboard 或 API 以安全凭据查询。

## 域名清单

### 0355650.xyz

- 0355650.xyz
- mail.0355650.xyz
- temp.0355650.xyz
- hi.0355650.xyz
- me.0355650.xyz
- go.0355650.xyz
- fun.0355650.xyz
- cool.0355650.xyz
- fast.0355650.xyz
- vip.0355650.xyz

### xi-clouds.cn

- xi-clouds.cn
- mail.xi-clouds.cn
- temp.xi-clouds.cn
- hi.xi-clouds.cn
- me.xi-clouds.cn
- go.xi-clouds.cn
- fun.xi-clouds.cn
- cool.xi-clouds.cn
- fast.xi-clouds.cn
- vip.xi-clouds.cn

### xi-clouds.top

- xi-clouds.top
- mail.xi-clouds.top
- temp.xi-clouds.top
- hi.xi-clouds.top
- me.xi-clouds.top
- go.xi-clouds.top
- fun.xi-clouds.top
- cool.xi-clouds.top
- fast.xi-clouds.top
- vip.xi-clouds.top

### xi-cloud.top

- xi-cloud.top
- mail.xi-cloud.top
- temp.xi-cloud.top
- hi.xi-cloud.top
- me.xi-cloud.top
- go.xi-cloud.top
- fun.xi-cloud.top
- cool.xi-cloud.top
- fast.xi-cloud.top
- vip.xi-cloud.top

### xi-work.cn

- xi-work.cn
- mail.xi-work.cn
- temp.xi-work.cn
- hi.xi-work.cn
- me.xi-work.cn
- go.xi-work.cn
- fun.xi-work.cn
- cool.xi-work.cn
- fast.xi-work.cn
- vip.xi-work.cn

## 已执行检查

1. 检查本地目录：当前工作区只有 `.git`，没有检出的源码文件。
2. 检查 `wrangler`：本机安装 `wrangler 4.94.0`。
3. 检查登录态：`npx wrangler whoami` 显示未登录。
4. 尝试 `git clone` 公开仓库：网络连接被重置，未成功克隆。
5. 使用 GitHub Raw 只读读取 `wrangler.example.json`，解析 `vars.EMAIL_DOMAINS`。

## 后续如需查 Cloudflare 线上配置

建议先在当前 PowerShell 会话中临时设置环境变量，不要写入文件：

```powershell
$env:CLOUDFLARE_API_TOKEN = "[REDACTED]"
```

然后再执行只读 API 查询 Cloudflare zones 与 Email Routing rules。查询完成后清除：

```powershell
Remove-Item Env:CLOUDFLARE_API_TOKEN
```
