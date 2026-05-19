/**
 * 题目生成 API
 * POST /api/generate/questions
 */

import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/openai';
import { saveQuestions, getLessonPlanById } from '@/lib/db';
import { generateQuestionsPrompt, extractJSON, safeJSONParse } from '@/lib/prompts';
import { getClientKey, rateLimit } from '@/lib/rate-limit';
import { assertUsageAllowance, getCurrentUserFromRequest, recordUsage } from '@/lib/auth';
import { QuestionGenerateRequest, Question, ApiResponse, QuestionGenerateResponse } from '@/types';

type GeneratedQuestion = {
  type: Question['type'];
  difficulty: Question['difficulty'];
  content: string;
  options?: string[];
  answer: string;
  explanation: string;
  knowledgePoint?: string;
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const currentUser = getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json<ApiResponse<never>>({
        success: false,
        error: { code: 'UNAUTHENTICATED', message: '请先登录' },
      }, { status: 401 });
    }

    const allowance = assertUsageAllowance(currentUser.id, 'questions');
    if (!allowance.ok) {
      return NextResponse.json<ApiResponse<never>>({
        success: false,
        error: { code: 'PLAN_LIMIT_REACHED', message: allowance.reason || '本月额度已用完' },
      }, { status: 402 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    const limiter = rateLimit(getClientKey(ip, 'questions'), 10, 60_000);
    if (!limiter.ok) {
      return NextResponse.json<ApiResponse<never>>({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: `请求过于频繁，请在 ${limiter.retryAfter} 秒后重试`,
        },
      }, { status: 429 });
    }

    // 解析请求体
    const body: QuestionGenerateRequest = await request.json();

    // 验证必填字段
    if (!body.lessonPlanId || !body.types || body.types.length === 0) {
      return NextResponse.json<ApiResponse<never>>({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: '请提供教案ID和题型',
        },
      }, { status: 400 });
    }

    // 获取教案信息
    const lessonPlan = getLessonPlanById(body.lessonPlanId);
    if (!lessonPlan) {
      return NextResponse.json<ApiResponse<never>>({
        success: false,
        error: {
          code: 'LESSON_NOT_FOUND',
          message: '教案不存在',
        },
      }, { status: 404 });
    }

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

    // 生成 Prompt
    const prompt = generateQuestionsPrompt({
      subject: subjectMap[lessonPlan.subject] || lessonPlan.subject,
      topic: lessonPlan.topic,
      objectives: lessonPlan.objectives,
      grade: lessonPlan.grade,
      types: body.types,
      count: body.count || 3,
      difficulty: body.difficulty || 'basic',
    });

    // 调用 OpenAI
    const response = await chatCompletion([
      {
        role: 'system',
        content: '你是一位专业的教师，擅长设计高质量的练习题目。请严格按照用户要求的格式输出，不要添加任何额外的说明文字。',
      },
      {
        role: 'user',
        content: prompt,
      },
    ], {
      temperature: 0.7,
      maxTokens: 3000,
    });

    // 提取 JSON
    const jsonContent = extractJSON(response);
    const questionsData = safeJSONParse<GeneratedQuestion[]>(jsonContent, []);

    // 验证生成的题目
    if (!Array.isArray(questionsData) || questionsData.length === 0) {
      return NextResponse.json<ApiResponse<never>>({
        success: false,
        error: {
          code: 'INVALID_RESPONSE',
          message: 'AI 生成的题目格式不正确，请重试',
        },
      }, { status: 500 });
    }

    // 转换为 Question 格式
    const questionsToSave: Omit<Question, 'id'>[] = questionsData.map(q => ({
      lessonPlanId: body.lessonPlanId,
      type: q.type,
      difficulty: q.difficulty,
      content: q.content,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation,
      knowledgePoint: q.knowledgePoint,
    }));

    // 保存到数据库
    const savedQuestions = saveQuestions(questionsToSave);
    recordUsage(currentUser.id, 'questions', { lessonPlanId: body.lessonPlanId, count: savedQuestions.length });

    const duration = Date.now() - startTime;

    return NextResponse.json<ApiResponse<QuestionGenerateResponse>>({
      success: true,
      data: {
        questions: savedQuestions,
        duration,
      },
    });

  } catch (error) {
    console.error('题目生成失败:', error);

    return NextResponse.json<ApiResponse<never>>({
      success: false,
      error: {
        code: 'GENERATION_FAILED',
        message: error instanceof Error ? error.message : '题目生成失败，请稍后重试',
      },
    }, { status: 500 });
  }
}
