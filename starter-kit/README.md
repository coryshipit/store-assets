# Store Assets Starter Kit

这是可以直接下载并复制到应用项目中的 Store Assets 工作包。

当前工作包面向 Microsoft Store。复制后，建议将本目录重命名为应用项目中的：

```text
store-assets/
```

## 给 Agent 的使用方式

开始任何任务前，Agent 应先阅读本文件和同目录的 `AGENTS.md`，然后检查应用项目中的产品事实、版本信息和现有 Store Assets 文件。

常见任务包括：

- 初始化缺失的 Store Assets 目录
- 准备新的 `release-prep/<submission-id>/`
- 校验发布物料
- 记录 submission 状态
- 在确认已经 published 后更新 `current/`

Agent 不得凭空创建产品能力或未经验证的商店声明，也不得在准备新 submission 时直接修改 `current/`。

## 目录结构

```text
store-assets/
├── README.md
├── AGENTS.md
└── microsoft-store/
    ├── current/
    ├── release-prep/
    ├── submissions/
    └── templates/
```

这是用户项目中的工作目录，不要把本仓库根目录的开发任务、Roadmap 或 reference 文件复制进来。

