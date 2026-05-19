/**
 * AI Prompt 模板
 * 用于教案生成、题目生成和质量检查
 */

import { LessonInput, QuestionType, Difficulty } from '@/types';

// ==================== 教案生成 Prompt ====================

/**
 * 教案生成 Prompt 模板
 */
export function generateLessonPrompt(input: LessonInput): string {
  // 年级映射
  const gradeMap: Record<string, string> = {
    'primary-1': '小学一年级',
    'primary-2': '小学二年级',
    'primary-3': '小学三年级',
    'primary-4': '小学四年级',
    'primary-5': '小学五年级',
    'primary-6': '小学六年级',
    'junior-1': '初中一年级',
    'junior-2': '初中二年级',
    'junior-3': '初中三年级',
    'senior-1': '高中一年级',
    'senior-2': '高中二年级',
    'senior-3': '高中三年级',
  };

  // 学科映射
  const subjectMap: Record<string, string> = {
    'chinese': '语文',
    'math': '数学',
    'english': '英语',
    'physics': '物理',
    'chemistry': '化学',
    'biology': '生物',
    'history': '历史',
    'geography': '地理',
    'morality': '道德与法治',
  };

  const gradeLabel = gradeMap[input.grade] || input.grade;
  const subjectLabel = subjectMap[input.subject] || input.subject;

  return `你是一位经验丰富的${subjectLabel}教师，擅长教学设计和课堂实践。

请根据以下信息，为${gradeLabel}学生设计一份完整的教案：

**课题**: ${input.topic}
${input.textbook ? `**教材版本**: ${input.textbook}` : ''}
**教学目标**: ${input.objectives}
**课时长度**: ${input.duration}分钟
${input.standards ? `**课程标准要求**: ${input.standards}` : ''}

请严格按照以下 JSON 格式输出教案内容：

\`\`\`json
{
  "objectives": {
    "knowledge": "知识与技能目标...",
    "process": "过程与方法目标...",
    "emotion": "情感态度与价值观目标..."
  },
  "keyPoints": {
    "key": "教学重点...",
    "difficulty": "教学难点..."
  },
  "preparation": {
    "teaching": ["教具1", "教具2"],
    "learning": ["学具1", "学具2"]
  },
  "process": [
    {
      "stage": "导入新课",
      "duration": 5,
      "content": "具体教学活动描述..."
    },
    {
      "stage": "探究新知",
      "duration": 15,
      "content": "具体教学活动描述..."
    },
    {
      "stage": "巩固练习",
      "duration": 10,
      "content": "具体教学活动描述..."
    },
    {
      "stage": "课堂小结",
      "duration": 5,
      "content": "具体教学活动描述..."
    }
  ],
  "boardDesign": "板书设计内容...",
  "homework": "作业布置内容..."
}
\`\`\`

**要求**:
1. 教学目标要具体、可操作、可检测
2. 教学流程要符合${gradeLabel}学生的认知特点
3. 每个环节的时间分配要合理，总计${input.duration}分钟
4. 教学活动要具体，避免空泛描述
5. 板书设计要简洁明了，突出重点
6. 作业布置要有层次性，适合不同水平学生

**重要**: 只输出 JSON 格式的内容，不要有任何其他文字说明。`;
}

// ==================== 题目生成 Prompt ====================

/**
 * 题目生成 Prompt 模板
 */
export function generateQuestionsPrompt(params: {
  subject: string;
  topic: string;
  objectives: string;
  grade: string;
  types: QuestionType[];
  count: number;
  difficulty: Difficulty;
}): string {
  // 题型映射
  const typeMap: Record<QuestionType, string> = {
    'choice': '选择题',
    'fill': '填空题',
    'short': '简答题',
  };

  // 难度映射
  const difficultyMap: Record<Difficulty, string> = {
    'basic': '基础',
    'intermediate': '进阶',
    'advanced': '挑战',
  };

  const typesLabel = params.types.map(t => typeMap[t]).join('、');
  const difficultyLabel = difficultyMap[params.difficulty];

  return `你是一位经验丰富的教师，擅长设计高质量的练习题目。

请根据以下信息，生成${difficultyLabel}难度的${typesLabel}：

**学科**: ${params.subject}
**课题**: ${params.topic}
**教学目标**: ${params.objectives}
**题目数量**: 每种题型${params.count}题

请严格按照以下 JSON 格式输出：

\`\`\`json
[
  {
    "type": "choice",
    "difficulty": "basic",
    "content": "题目内容...",
    "options": ["选项A", "选项B", "选项C", "选项D"],
    "answer": "A",
    "explanation": "解析内容，说明为什么这个答案正确...",
    "knowledgePoint": "对应的知识点"
  },
  {
    "type": "fill",
    "difficulty": "basic",
    "content": "题目内容，用____表示填空位置...",
    "answer": "填空答案",
    "explanation": "解析内容...",
    "knowledgePoint": "对应的知识点"
  },
  {
    "type": "short",
    "difficulty": "basic",
    "content": "题目内容...",
    "answer": "标准答案",
    "explanation": "解析内容，答题思路...",
    "knowledgePoint": "对应的知识点"
  }
]
\`\`\`

**要求**:
1. 题目要紧扣教学目标，考查重点知识
2. 难度要符合${difficultyLabel}水平
3. 选择题的选项要有干扰性，不能太明显
4. 填空题的答案要唯一明确
5. 简答题的答案要完整，解析要给出答题思路
6. 每道题都要标注对应的知识点
7. 题目表述要清晰，无歧义
8. ${params.difficulty === 'advanced' ? '挑战题要有一定综合性，考查学生的高阶思维' : ''}
${params.difficulty === 'basic' ? '基础题要面向全体学生，确保大部分学生能正确作答' : ''}

**重要**: 只输出 JSON 数组格式，不要有任何其他文字说明。`;
}

// ==================== 质量检查 Prompt ====================

/**
 * 质量检查 Prompt 模板
 */
export function qualityCheckPrompt(params: {
  objectives: string;
  lessonContent: string;
  questions: Array<{ type: string; difficulty: string; content: string; knowledgePoint?: string }>;
}): string {
  return `你是一位资深的教学质量专家，负责评估教案和题目的质量。

请对以下教案和题目进行质量检查：

**教学目标**:
${params.objectives}

**教案内容**:
${params.lessonContent}

**题目列表**:
${params.questions.map((q, i) => `
${i + 1}. [${q.type}] [${q.difficulty}] ${q.content}
   ${q.knowledgePoint ? `知识点: ${q.knowledgePoint}` : ''}
`).join('\n')}

请从以下维度进行评估，并严格按照 JSON 格式输出：

\`\`\`json
{
  "coverageScore": 85,
  "difficultyDistribution": {
    "basic": 50,
    "intermediate": 30,
    "advanced": 20
  },
  "typeDistribution": {
    "choice": 4,
    "fill": 3,
    "short": 2
  },
  "issues": [
    {
      "level": "warning",
      "message": "问题描述",
      "suggestion": "改进建议"
    }
  ],
  "summary": "总体评价..."
}
\`\`\`

**评估维度**:

1. **目标覆盖率** (0-100分):
   - 教学目标是否在教学流程中得到体现
   - 题目是否覆盖所有教学目标
   - 计算公式: (被覆盖的目标数 / 总目标数) × 100

2. **难度分布**:
   - 统计各难度题目的数量和百分比
   - 理想比例: 基础50% / 进阶30% / 挑战20%
   - 偏差超过20%需要提醒

3. **题型分布**:
   - 统计各题型的数量
   - 建议至少包含2种题型
   - 全是选择题时建议增加其他题型

4. **问题检测**:
   - error: 严重问题（如目标完全未覆盖、题目错误）
   - warning: 需要改进（如难度失衡、题型单一）
   - info: 优化建议（如增加某些环节）

**重要**: 只输出 JSON 格式，不要有任何其他文字说明。`;
}

// ==================== 辅助函数 ====================

/**
 * 从 AI 响应中提取 JSON
 * 处理可能包含 markdown 代码块的情况
 */
export function extractJSON(response: string): string {
  // 尝试提取 ```json ... ``` 代码块
  const jsonBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim();
  }

  // 尝试提取 ``` ... ``` 代码块
  const codeBlockMatch = response.match(/```\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // 如果没有代码块，直接返回
  return response.trim();
}

/**
 * 安全解析 JSON
 */
export function safeJSONParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (e) {
    console.error('JSON 解析失败:', e);
    return fallback;
  }
}
