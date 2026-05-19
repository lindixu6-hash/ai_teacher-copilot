# AI Teacher Copilot

> 教师端 AI 备课与出题助手 MVP

## 项目状态

当前版本已完成可演示的 MVP，具备登录、套餐、用量限制、管理后台、教案生成、题目生成、质量检查、历史记录和导出能力。

这是一个可以放进简历的项目，但更适合写成“独立开发的 MVP / 可演示产品”，而不是“已上线的生产系统”。

## 项目简介

AI Teacher Copilot 面向中小学教师，帮助用户基于教学目标快速生成结构化教案、分层练习题、答案解析，并提供质量检查报告与历史管理能力。

核心价值是把备课时间从约 30 分钟压缩到约 5 分钟，同时把 AI 输出做成可直接落地的教学资产。

## 已实现能力

- 教案生成：按年级、学科、教材、课题、教学目标生成结构化教案
- 题目生成：支持选择题、填空题、简答题，且按难度分层
- 答案解析：为每道题生成标准答案与解析
- 质量检查：检查目标覆盖、难度分布、题型分布与表述清晰度
- 历史记录：保存并查看过往生成内容
- 导出功能：导出 Markdown 文件
- 登录系统：邮箱密码登录，带演示账号
- 套餐体系：Free / Pro / Team 三档套餐
- 用量限制：按月额度控制，防止成本失控
- 管理后台：查看用户、套餐和用量概览

## 技术栈

- 前端：Next.js 16 + React 19 + TypeScript + Tailwind CSS
- 后端：Next.js API Routes
- 数据库：SQLite（`better-sqlite3`）
- AI：OpenAI API
- 鉴权：Cookie Session

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.local.example` 为 `.env.local`，并填入 OpenAI API Key：

```bash
cp .env.local.example .env.local
```

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问：http://localhost:3000

### 4. 构建生产版本

```bash
npm run build
npm start
```

## 演示账号

- Free：`free@teachercopilot.local` / `Free123!`
- Pro：`pro@teachercopilot.local` / `Pro123!`
- Admin：`admin@teachercopilot.local` / `Admin123!`

## 项目结构

```text
ai-teacher-copilot/
├── src/
│   ├── app/
│   │   ├── (main)/            # 首页、登录、历史、管理后台
│   │   ├── api/               # 生成、认证、历史、管理 API
│   │   ├── layout.tsx         # 根布局
│   │   └── globals.css        # 全局样式
│   ├── lib/                   # 数据库、鉴权、OpenAI、导出、限流
│   └── types/                 # TypeScript 类型定义
├── data/                      # SQLite 数据库（运行时生成）
├── public/                    # 静态资源
└── README.md
```

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

## 简历写法建议

建议写成：

```text
AI Teacher Copilot | 独立开发者
2026.05 - 至今

• 面向中小学教师的 AI 备课助手，支持教案生成、题目生成、答案解析与质量检查
• 搭建登录、套餐、用量限制和管理后台，形成完整的产品闭环
• 使用 Next.js + TypeScript + SQLite + OpenAI API 实现全栈 MVP
• 设计结构化工作流，将备课时间从 30 分钟缩短到 5 分钟
```

## 结论

这项目已经达到“可以放简历”的水平，前提是你把它作为：

- 独立开发作品
- MVP / Demo 产品
- 有完整产品闭环的 AI 工具

不建议把它包装成：

- 已商业化上线的成熟 SaaS
- 已大规模真实用户验证的产品

如果你愿意，我可以下一步继续帮你把 `RESUME.md` 也改成更适合投递的版本。
