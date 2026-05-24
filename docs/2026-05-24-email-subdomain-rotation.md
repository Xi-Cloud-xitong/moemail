# Cloudflare Worker 邮箱子域名轮换日志

- 日期：2026-05-24
- 仓库：Xi-Cloud-xitong/moemail
- 本地目录：C:\Users\Ceo-XiTong\Documents\MoMail
- 操作类型：配置文件变更
- 变更文件：`wrangler.example.json`
- 敏感信息处理：未写入、未回显、未持久化 Cloudflare API Token

## 背景

用户确认原有邮箱子域名批次不再使用，需要替换 Worker 配置中的邮箱域名列表。

本次只修改 Worker 示例配置里的 `vars.EMAIL_DOMAINS`，没有调用 Cloudflare API，没有变更线上 DNS、Email Routing、Worker 部署或数据库。

## 保留内容

继续保留 5 个根域名：

- 0355650.xyz
- xi-clouds.cn
- xi-clouds.top
- xi-cloud.top
- xi-work.cn

## 下线的旧子域名前缀

以下旧前缀已从 `wrangler.example.json` 的 `EMAIL_DOMAINS` 中移除：

- mail
- temp
- hi
- me
- go
- fun
- cool
- fast
- vip

## 新启用的子域名前缀

以下新前缀已应用到每个根域名：

- inbox
- post
- letter
- box
- drop
- send
- relay
- cloud
- edge

## 新域名清单

### 0355650.xyz

- 0355650.xyz
- inbox.0355650.xyz
- post.0355650.xyz
- letter.0355650.xyz
- box.0355650.xyz
- drop.0355650.xyz
- send.0355650.xyz
- relay.0355650.xyz
- cloud.0355650.xyz
- edge.0355650.xyz

### xi-clouds.cn

- xi-clouds.cn
- inbox.xi-clouds.cn
- post.xi-clouds.cn
- letter.xi-clouds.cn
- box.xi-clouds.cn
- drop.xi-clouds.cn
- send.xi-clouds.cn
- relay.xi-clouds.cn
- cloud.xi-clouds.cn
- edge.xi-clouds.cn

### xi-clouds.top

- xi-clouds.top
- inbox.xi-clouds.top
- post.xi-clouds.top
- letter.xi-clouds.top
- box.xi-clouds.top
- drop.xi-clouds.top
- send.xi-clouds.top
- relay.xi-clouds.top
- cloud.xi-clouds.top
- edge.xi-clouds.top

### xi-cloud.top

- xi-cloud.top
- inbox.xi-cloud.top
- post.xi-cloud.top
- letter.xi-cloud.top
- box.xi-cloud.top
- drop.xi-cloud.top
- send.xi-cloud.top
- relay.xi-cloud.top
- cloud.xi-cloud.top
- edge.xi-cloud.top

### xi-work.cn

- xi-work.cn
- inbox.xi-work.cn
- post.xi-work.cn
- letter.xi-work.cn
- box.xi-work.cn
- drop.xi-work.cn
- send.xi-work.cn
- relay.xi-work.cn
- cloud.xi-work.cn
- edge.xi-work.cn

## 验证计划

1. 校验 `wrangler.example.json` 是合法 JSON。
2. 校验 `EMAIL_DOMAINS` 总数仍为 50。
3. 校验旧子域名前缀不再出现在 `wrangler.example.json`。
4. 校验新子域名前缀完整覆盖 5 个根域名。

## 后续上线建议

如需让线上 Worker 生效，需要将实际部署使用的 `wrangler.json` 或 Cloudflare Worker 环境变量同步为这批新域名，并重新部署 Worker。

如果 Cloudflare Email Routing 后台也配置了旧地址或路由，需要另行通过 Cloudflare Dashboard/API 只读核查后再更新。更新线上配置前建议确认 DNS/MX/路由影响范围。
