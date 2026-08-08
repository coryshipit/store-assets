# Store Assets User Project Agent Guide

本文档随 `starter-kit/` 一起复制到用户的应用仓库中。它约束 Agent 如何在该应用项目内执行 Store Assets 工作流。

它不是 Store Assets 开源仓库的开发指南；开发开源仓库时应阅读仓库根目录的 `AGENTS.md`。

## 开始前

Agent 应先读取：

1. 本文件
2. 同目录的 `README.md`
3. `microsoft-store/` 下的说明、模板和已有记录
4. 应用项目中可验证的 PRD、实现、release notes、QA 结果和已批准截图

然后识别：

- product name
- target store
- default locale
- current application version
- 本次任务是初始化、准备 submission、校验，还是更新已发布状态

无法安全判断的信息应标记为待确认，不得自行补全。

## 文件修改边界

- `microsoft-store/current/` 表示当前已确认线上版本，准备新 submission 时不得直接修改
- 新 submission 必须创建在 `microsoft-store/release-prep/<submission-id>/`
- `microsoft-store/submissions/` 保存每次 submission 的记录
- `microsoft-store/templates/` 保存可重复使用的模板
- 只有用户确认 submission 已经 published 后，才能把结果同步到 `current/`

submission ID 使用：

```text
YYYY-MM-DD-task-name
```

## 内容准确性

Store 文案必须基于应用项目中的可验证事实。不得宣传：

- 尚未发布的功能
- 不支持的平台或文件格式
- 尚未实现的集成
- 没有证据支持的隐私或性能保证

无法验证的 claim 必须标记为需要人工 review。

## 变量与命名

模板应保留 placeholders；生成文件才使用解析后的实际值。Agent 不得在整个仓库中进行无差别的全局替换。

普通目录和 Markdown 文件名使用 lowercase kebab-case；locale 使用官方 locale code；截图使用两位顺序编号和语义化 lowercase kebab-case 名称，例如：

```text
screenshots/en-US/export/01-primary-value.png
```

## 任务完成时

Agent 应报告：

- 创建、修改和未修改的路径
- 已识别的缺失项
- 未解析的 placeholders
- 需要人工 review 的 claims
- 当前 submission 状态

除非用户明确确认线上发布已经完成，否则不得把状态标记为 `published`，也不得更新 `current/`。

