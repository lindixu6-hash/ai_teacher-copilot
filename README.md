# AI Teacher Copilot

> 教师端 AI 备课与出题助手 MVP

## 项目简介

AI Teacher Copilot 是一个面向中小学教师的备课提效工具。教师输入教学信息后，可以一键生成结构化教案、分层练习题、答案解析，并获得质量检查报告。

**核心价值**：将备课时间从 30 分钟缩短到 5 分钟。

## 功能特性

- ✅ **教案生成**：输入年级、学科、课题、教学目标，自动生成结构化教案
- ✅ **题目生成**：支持选择题、填空题、简答题，难度分层
- ✅ **答案解析**：每道题配标准答案和解题思路
- ✅ **质量检查**：检查目标覆盖、难度分布、题型分布、表述清晰度
- ✅ **历史记录**：保存和查看过往教案
- ✅ **导出功能**：导出 Markdown 格式

## 技术栈

- **前端**: Next.js 15 (App Router) + React 19 + Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: SQLite (better-sqlite3)
- **AI**: OpenAI API (GPT-4o-mini)

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.local.example` 为 `.env.local`：

```bash
cp .env.local.example .env.local
```

编辑 `.env.local`，填入你的 OpenAI API Key：

```
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 4. 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
ai-teacher-copilot/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (main)/            # 主页面组
│   │   │   ├── page.tsx       # 首页（教案生成表单）
│   │   │   ├── result/        # 结果页
│   │   │   └── history/       # 历史记录页
│   │   ├── api/               # API 路由
│   │   │   ├── generate/      # 生成相关 API
│   │   │   └── history/       # 历史记录 API
│   │   ├── layout.tsx         # 根布局
│   │   └── globals.css        # 全局样式
│   ├── components/            # React 组件
│   │   └── ui/                # UI 组件（预留）
│   ├── lib/                   # 工具库
│   │   ├── db.ts              # 数据库操作
│   │   ├── openai.ts          # OpenAI API 封装
│   │   ├── prompts.ts         # Prompt 模板
│   │   └── export.ts          # 导出功能
│   └── types/                 # TypeScript 类型定义
│       └── index.ts
├── data/                      # SQLite 数据库文件（运行时生成）
├── .env.local                 # 环境变量（需手动创建）
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

## API 接口

### POST /api/generate/lesson
生成教案

**请求体**:
```json
{
  "grade": "primary-3",
  "subject": "math",
  "topic": "分数的初步认识",
  "objectives": "学生能够理解分数的概念...",
  "duration": 40
}
```

### POST /api/generate/questions
生成题目

**请求体**:
```json
{
  "lessonPlanId": "xxx",
  "types": ["choice", "fill", "short"],
  "count": 3,
  "difficulty": "basic"
}
```

### POST /api/generate/check
质量检查

**请求体**:
```json
{
  "lessonPlanId": "xxx"
}
```

### GET /api/history
获取历史记录

**查询参数**:
- `limit`: 返回数量（默认 20）
- `offset`: 偏移量（默认 0）
- `id`: 获取单个教案详情

## 开发说明

### 添加新的题型

在 `src/types/index.ts` 中修改 `QuestionType` 类型，然后在 `src/lib/prompts.ts` 中更新 Prompt 模板。

### 修改质量检查标准

在 `src/lib/prompts.ts` 的 `qualityCheckPrompt` 函数中修改评估维度和标准。

### 自定义导出格式

在 `src/lib/export.ts` 中修改 `exportToMarkdown` 函数。

## 注意事项

1. **API Key 安全**: 不要将 `.env.local` 提交到版本控制
2. **数据库位置**: SQLite 文件位于 `data/teacher-copilot.db`
3. **AI 成本**: 使用 GPT-4o-mini，单次教案生成约 0.001-0.002 USD

## 许可证

MIT

## 作者

Created for AI PM Portfolio Project
