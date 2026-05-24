# GitHub Actions 部署触发日志

- 日期：2026-05-24
- 仓库：Xi-Cloud-xitong/moemail
- 分支：master
- 触发方式：推送 `v*` 标签触发现有 `.github/workflows/deploy.yml`
- 新标签：v0.5.3
- 标签对象：b3a0a71b99336cf830530681f773e56650c5dff4
- 标签指向提交：3fbf0cdef28d85ac845db64f4b01536c778931cb
- 推送方式：Git HTTPS，经本机代理 `127.0.0.1:10808`
- 敏感信息处理：未写入、未回显、未持久化 Cloudflare/GitHub Token

## 触发依据

仓库已有 `.github/workflows/deploy.yml`，触发条件包含：

```yaml
on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:
```

因此普通 `master` 分支 push 不会触发部署，必须推送 `v*` 标签或手动执行 `workflow_dispatch`。

## 本次执行

已推送新标签：

```text
v0.5.3 -> v0.5.3
```

远端标签解析结果：

```text
b3a0a71b99336cf830530681f773e56650c5dff4 refs/tags/v0.5.3
3fbf0cdef28d85ac845db64f4b01536c778931cb refs/tags/v0.5.3^{}
```

## 后续检查

请在 GitHub Actions 页面查看 `Deploy` workflow：

- https://github.com/Xi-Cloud-xitong/moemail/actions/workflows/deploy.yml

如果 workflow 失败，优先检查仓库 Secrets：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `PROJECT_NAME`
- `DATABASE_NAME` / `DATABASE_ID`
- `KV_NAMESPACE_NAME` / `KV_NAMESPACE_ID`
- `CUSTOM_DOMAIN`
- OAuth/Auth 相关 secrets
