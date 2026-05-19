# AI Teacher Copilot 简历版

## 一、项目名称
AI Teacher Copilot | 教师端 AI 备课与出题助手

## 二、一句话简介
面向中小学教师的 AI 备课工作台，围绕“教学目标 -> 教案生成 -> 分层习题 -> 质量检查 -> 导出复用”设计完整工作流，并已完成真实 AI 接口、持久化与 ECS 上线部署。

## 三、方案要点

### AI / 编程技术线
- 基于 `Next.js 16 + React 19 + TypeScript` 搭建全栈应用，前端页面与后端 API 统一在 App Router 下管理。
- 封装 `OpenAI-compatible client`，接入 `Kimi / Moonshot` 模型服务，支持教案生成、题目生成、质量检查三段式 AI 流程。
- 通过结构化 Prompt + `extractJSON / safeJSONParse` 约束模型输出格式，降低大模型返回不可解析内容的风险。
- 使用 `SQLite + better-sqlite3` 完成教案、题目、质检结果的本地持久化，并支持历史记录检索、删除和结果追溯。
- 增加 `API health endpoint` 与生成接口限流逻辑，为后续商用接入监控、风控和多用户扩展留出基础设施接口。
- 在阿里云 `ECS + Nginx + PM2` 上完成部署，保留静态演示页的同时，新建真实 AI 应用入口，形成可运行线上版本。

### 传统产品经理线
- 从教师真实备课流程出发，而不是做泛聊天机器人，明确聚焦“备课提效”这一高频刚需场景。
- 将需求拆成三类核心能力：结构化教案、分层习题、质量护栏，避免功能发散成“什么都能聊”的工具型产品。
- 设计“教学目标驱动”的输入结构，把年级、学科、教材版本、教学目标、课时约束转成模型可控输入。
- 在结果页加入“导出、复用、历史记录、质量报告”四个关键环节，使产品更贴近真实教学工作流，而不是一次性生成 Demo。
- 以可验证的系统能力而非空泛用户数据作为阶段成果指标，保证项目在简历和面试里能被真实追问、真实解释。

## 四、成果实现（真实指标）
- 完成 `3` 条 AI 主流程接口：教案生成、题目生成、质量检查。
- 完成 `4` 个核心业务接口：`/api/generate/lesson`、`/api/generate/questions`、`/api/generate/check`、`/api/history`。
- 完成 `3` 类题型生成：选择题、填空题、简答题。
- 完成 `3` 个质量检查维度：目标覆盖率、题型分布、难度分布。
- 完成 `3` 个核心页面：创建页、结果页、历史页。
- 完成 `1` 个健康检查接口：`/api/health`，用于线上服务存活与配置状态检查。
- 完成 `1` 套线上部署链路：阿里云 `ECS + PM2 + Nginx`。
- 已通过 `npm run lint` 与 `npm run build`，并已实测 Kimi 返回真实教案生成结果。
- 当前线上可访问地址：
  - 演示页：`http://47.86.191.93/teacher-copilot/`
  - 真实应用：`http://47.86.191.93/teacher-copilot-app/`

## 五、技术栈
- 前端：Next.js 16 / React 19 / Tailwind CSS
- 后端：Next.js API Routes
- 数据库：SQLite / better-sqlite3
- AI：Kimi（Moonshot OpenAI-compatible API）
- 运维部署：Alibaba Cloud ECS / Nginx / PM2
- 语言：TypeScript

## 六、简历精简写法
`AI Teacher Copilot | 独立开发`

`• 设计教师备课工作流，构建“教案生成—分层习题—质量检查—导出复用”完整链路，兼顾教育场景逻辑与产品可用性`

`• 基于 Next.js + TypeScript + SQLite + Kimi API 实现全栈 AI 应用，完成 4 个核心接口、3 类题型生成和 3 维质量诊断`

`• 将项目部署至阿里云 ECS，接入 Nginx + PM2，完成线上健康检查与基础限流，推动 Demo 向真实可运行产品演进`
