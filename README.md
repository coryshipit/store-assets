# Store Assets

Store Assets 是一个 Git-native、Agent-readable 的应用商店发布准备工作流。

它帮助开发者或 AI Agent 在 Git 仓库中管理应用商店文案、截图、release notes、submission 记录和发布准备状态。第一阶段聚焦 Microsoft Store，当前交付重点是规范、模板、示例和可复制的工作包。

Store Assets 不是应用商店后台的替代品，也不是 SaaS、GUI、ASO 平台或自动上传服务。它负责把发布知识和准备工作组织成可追踪、可验证的仓库流程，再由官方 CLI、API 或 CI 工具完成实际提交。

## 快速开始

如果要在自己的应用项目中使用 Store Assets：

1. 下载或复制 [`starter-kit/`](starter-kit/)
2. 将它放入应用仓库，并重命名为 `store-assets/`
3. 让 Agent 先阅读复制后的 `store-assets-workflow.md`
4. 再执行初始化、准备 submission 或校验任务

`starter-kit/` 是面向用户的可复制工作包；根目录 `AGENTS.md` 只用于开发 Store Assets 本身，不需要复制到用户应用项目中。

## 文档导航

- [`AGENTS.md`](AGENTS.md)：本仓库开发 Agent 的职责和行为约束
- [`reference/PROJECT-CONTEXT.zh-CN.md`](reference/PROJECT-CONTEXT.zh-CN.md)：项目背景、架构决策和范围
- [`docs/MISSION.md`](docs/MISSION.md)：项目使命陈述
- [`docs/ROADMAP.md`](docs/ROADMAP.md)：项目整体方向和开发任务进展
- [`docs/QA.md`](docs/QA.md)：starter-kit 的质量检查清单与干跑验证步骤
- [`docs/DISTRIBUTION.md`](docs/DISTRIBUTION.md)：starter-kit 的 Release 分发机制设计
- [`starter-kit/`](starter-kit/)：用户可直接下载和复制的工作包

## 核心生命周期

用户项目中的 Store Assets 使用以下高层生命周期：

```text
current → release-prep → validation → submission → published → current
```

不同应用商店可以拥有自己的字段和校验规则，但应保留这套高层生命周期。

## 当前范围

当前优先支持 Microsoft Store。Apple App Store 和 Google Play 是未来扩展方向，在完成真实研究和验证之前，不在本项目中假设其具体规则。