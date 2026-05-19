# AI Teacher Copilot

> AI PM 作品集项目 | 教师端 AI 备课与出题助手

## 线上入口

- 演示页：`http://47.86.191.93/teacher-copilot/`

## 项目定位

AI Teacher Copilot 不是一个“会聊天的 AI”，而是一个面向中小学教师的备课工作台。
我把它定义成一个可演示、可讲清楚产品思路、也可以放进简历的 AI PM 作品集项目。

它解决的不是“生成内容”本身，而是教师在备课中真正高频的工作流问题：

- 输入信息太散，AI 输出不结构化
- 备课、出题、质检、导出分散在不同工具里
- 缺少账号体系、套餐与用量控制，难以做成商业产品

## 我做了什么

- 教案生成：按年级、学科、教材、课题、教学目标生成结构化教案
- 题目生成：支持选择题、填空题、简答题，并按难度分层
- 答案解析：每道题都配标准答案与解题思路
- 质量检查：检查目标覆盖、题型分布、难度分布和表述清晰度
- 历史记录：保存并查看过往教案
- 导出功能：支持 Markdown 导出
- 登录系统：邮箱密码登录，支持演示账号
- 套餐体系：Free / Pro / Team 三档套餐
- 用量限制：按月额度控制，避免成本失控
- 管理后台：查看用户、套餐和用量概览

## 作为 AI PM 的思路

这个项目我重点不是堆功能，而是把产品链路做完整：

1. 定义场景：教师备课不是闲聊，是有明确交付物的工作流
2. 拆解流程：教案生成 -> 题目生成 -> 质量检查 -> 历史管理 -> 导出
3. 加商业层：登录、套餐、用量、后台，让项目从 Demo 变成产品
4. 控成本：通过用量限制，把 AI 成本纳入产品设计
5. 可讲述：每个模块都能讲清楚为什么做、怎么做、有什么价值

## 技术栈

- 前端：Next.js 16 + React 19 + TypeScript + Tailwind CSS
- 后端：Next.js API Routes
- 数据库：SQLite（`better-sqlite3`）
- AI：OpenAI API
- 鉴权：Cookie Session

## 核心页面

- 首页：教案生成工作台
- 结果页：展示教案、习题、质检结果
- 历史页：查看过往生成记录
- 登录页：演示账号登录
- 管理后台：查看用户与套餐用量

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.local.example .env.local
```

```env
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_BASE_PATH=/teacher-copilot
```

### 3. 本地开发

```bash
npm run dev
```

访问：`http://localhost:3000`

### 4. 生产部署

```bash
npm run build
npm start
```

然后由 Nginx / 阿里云反向代理挂载到 `/teacher-copilot/`。

## 演示账号

- Free：`free@teachercopilot.local` / `Free123!`
- Pro：`pro@teachercopilot.local` / `Pro123!`
- Admin：`admin@teachercopilot.local` / `Admin123!`

## API 概览

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/generate/lesson`
- `POST /api/generate/questions`
- `POST /api/generate/check`
- `GET /api/history`
- `GET /api/admin/overview`
- `GET /api/admin/users`

## 简历写法

建议写成：

```text
AI Teacher Copilot | 独立开发者
2026.05 - 至今

• 面向中小学教师的 AI 备课助手，支持教案生成、题目生成、答案解析与质量检查
• 设计登录、套餐、用量限制和管理后台，形成完整的产品闭环
• 使用 Next.js + TypeScript + SQLite + OpenAI API 实现全栈 MVP
• 将备课流程从“多工具拼接”重构为“结构化工作流”，目标是将备课时间从 30 分钟缩短到 5 分钟
```

## 结论

这项目已经适合放进简历。

更准确地说，它适合被描述为：

- AI PM 作品集
- 独立开发的 MVP
- 有商业化思路的可演示产品

不建议描述成：

- 已大规模商业化上线的成熟 SaaS
- 已经过大量真实用户验证的正式产品

