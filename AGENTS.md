# Store Assets Repository Agent Guide

本文档只约束“开发 Store Assets 这个仓库”的 AI coding Agent。

它不是面向最终用户的产品说明，也不是用户应用仓库中的 Store Assets 操作手册。面向用户的内容放在根目录 `README.md`；可直接下载并复制到应用项目中的工作包放在 `starter-kit/`。

## 1. 任务范围

本仓库当前的目标是维护一套面向 Microsoft Store 的：

- publishing workflow specification
- repository convention
- reusable templates
- Agent instructions
- end-to-end example

当前阶段优先完善文档、模板和示例。不要在没有明确任务和稳定 specification 的情况下扩展到 GUI、SaaS、自动发布、复杂 CLI、CI 服务或 Apple / Google 规则。

## 2. 必读信息

开始工作前，按任务需要读取：

1. 本文件
2. `README.md`
3. `reference/PROJECT-CONTEXT.zh-CN.md`
4. `docs/MISSION.md` 中与当前任务相关的开发任务
5. `starter-kit/` 中将被用户实际复制和使用的文件

优先级如下：

- 用户当前明确指令优先
- 本文件约束仓库开发 Agent 的行为
- 项目产品决策以 `reference/PROJECT-CONTEXT.zh-CN.md` 为背景依据
- 面向用户的使用方式以 `README.md` 和 `starter-kit/README.md` 为准
- 具体 Microsoft Store 规则必须来自已记录的 specification 或可验证资料

不要把历史对话或隐藏上下文当作项目事实。重要决策必须落在仓库文件中。

## 3. 文档职责边界

| 文件或目录 | 职责 | 不应承载的内容 |
| --- | --- | --- |
| `AGENTS.md` | 仓库开发 Agent 的行为约束 | 面向用户的完整教程、产品宣传文案 |
| `README.md` | 项目介绍、价值、快速开始和文档导航 | 细粒度 Agent 内部执行规则 |
| `reference/` | 已确认的背景、决策和上下文 | 临时任务状态 |
| `docs/MISSION.md` | 当前任务、验收标准和任务状态 | 用户使用手册、长期路线图 |
| `docs/ROADMAP.md` | 项目整体方向、阶段规划和后续开发工作 | 当前任务的详细实现步骤 |
| `starter-kit/` | 用户可下载、复制到应用项目的实际工作包 | 本仓库内部开发过程 |

如果一段内容是在解释“用户如何使用 Store Assets”，应放入 `README.md` 或 `starter-kit/README.md`；如果是在规定“Agent 开发本仓库时如何工作”，才放入本文件。

## 4. 修改仓库时的工作方式

Agent 应：

1. 先检查现有文件和相关任务，不假设仓库已经有完整实现
2. 明确本次修改属于规范、模板、示例、用户文档还是工具实现
3. 优先做最小且可验证的修改
4. 保持 `README.md`、`starter-kit/`、模板和示例之间的术语一致
5. 不凭空补写 Microsoft Store 规则或产品能力
6. 修改行为规则后，同时检查用户工作包是否仍能独立使用
7. 在交付时说明修改了哪些路径，以及还有哪些内容尚未实现

涉及工具开发时，必须同时考虑：

- 输入和输出是否清晰
- 写入范围是否可预测
- 是否会覆盖用户内容
- 新 session 中的 Agent 是否只靠仓库文件即可继续工作
- 是否有 Microsoft Store 示例或 fixture 可以验证行为

## 5. 稳定的产品边界

Store Assets 的核心是：

```text
common publishing lifecycle
        +
repository convention
        +
store-specific rules and adapters
```

不要把不同 Store 强行压缩成一个 universal metadata schema。当前只研究和实现 Microsoft Store；未来 Store 扩展必须保留独立的 schema、必填字段、物料要求、校验规则和 adapter。

推荐的自动化演进顺序是：

```text
documented workflow
  → templates
  → repeated Agent execution
  → stable conventions
  → initialization script
  → validation script
  → CLI / CI / API integrations
```

只有 specification、模板和示例稳定后，才增加自动化。

## 6. 完成标准

涉及新规范、模板或工具的任务，至少应满足：

- 用户能在 README 中找到用途和开始方式
- Agent 能在对应的 Agent 文档中找到行为约束
- 真实使用的内容位于 `starter-kit/` 或示例中，而不是只存在于开发说明
- 输入、输出、修改范围和失败状态清楚
- 不会为了通过校验而编造事实、删除用户内容或静默覆盖文件
- 文档、模板、示例和实现使用一致的生命周期术语

## 7. 当前仓库优先级

1. 完善根目录 README 和文档导航
2. 建立可复制的 `starter-kit/`
3. 完善 Microsoft Store specification、模板和示例
4. 将具体开发任务记录在 `docs/MISSION.md`
5. 后续再补充 `docs/ROADMAP.md` 的详细内容
6. 最后再评估 validation、CLI 和 publishing integrations