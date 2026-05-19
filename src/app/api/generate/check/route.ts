/**
 * 质量检查 API
 * POST /api/generate/check
 */

import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/openai';
import { saveQualityCheck, getLessonPlanById, getQuestionsByLessonId } from '@/lib/db';
import { qualityCheckPrompt, extractJSON, safeJSONParse } from '@/lib/prompts';
import { getClientKey, rateLimit } from '@/lib/rate-limit';
import { assertUsageAllowance, getCurrentUserFromRequest, recordUsage } from '@/lib/auth';
import { QualityCheck, ApiResponse } from '@/types';

type GeneratedQualityCheck = {
  coverageScore?: number;
  difficultyDistribution?: QualityCheck['difficultyDistribution'];
  typeDistribution?: QualityCheck['typeDistribution'];
  issues?: QualityCheck['issues'];
  summary?: string;
};

export async function POST(request: NextRequest) {
  try {
    const currentUser = getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json<ApiResponse<never>>({
        success: false,
        error: { code: 'UNAUTHENTICATED', message: '请先登录' },
      }, { status: 401 });
    }

    const allowance = assertUsageAllowance(currentUser.id, 'quality');
    if (!allowance.ok) {
      return NextResponse.json<ApiResponse<never>>({
        success: false,
        error: { code: 'PLAN_LIMIT_REACHED', message: allowance.reason || '本月额度已用完' },
      }, { status: 402 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    const limiter = rateLimit(getClientKey(ip, 'quality'), 10, 60_000);
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
    const body = await request.json();

    // 验证必填字段
    if (!body.lessonPlanId) {
      return NextResponse.json<ApiResponse<never>>({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: '请提供教案ID',
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

    // 获取题目
    const questions = getQuestionsByLessonId(body.lessonPlanId);

    // 生成 Prompt
    const prompt = qualityCheckPrompt({
      objectives: lessonPlan.objectives,
      lessonContent: JSON.stringify(lessonPlan.content, null, 2),
      questions: questions.map(q => ({
        type: q.type,
        difficulty: q.difficulty,
        content: q.content,
        knowledgePoint: q.knowledgePoint,
      })),
    });

    // 调用 OpenAI
    const response = await chatCompletion([
      {
        role: 'system',
        content: '你是一位资深的教学质量专家，负责评估教案和题目的质量。请严格按照用户要求的格式输出，不要添加任何额外的说明文字。',
      },
      {
        role: 'user',
        content: prompt,
      },
    ], {
      temperature: 0.5,
      maxTokens: 2000,
    });

    // 提取 JSON
    const jsonContent = extractJSON(response);
    const checkData = safeJSONParse<GeneratedQualityCheck>(jsonContent, {});

    // 验证质量检查结果
    if (!checkData.coverageScore || !checkData.issues) {
      return NextResponse.json<ApiResponse<never>>({
        success: false,
        error: {
          code: 'INVALID_RESPONSE',
          message: '质量检查结果格式不正确，请重试',
        },
      }, { status: 500 });
    }

    // 构建质量检查结果
    const qualityCheckData: Omit<QualityCheck, 'id' | 'createdAt'> = {
      lessonPlanId: body.lessonPlanId,
      coverageScore: checkData.coverageScore,
      difficultyDistribution: checkData.difficultyDistribution || { basic: 0, intermediate: 0, advanced: 0 },
      typeDistribution: checkData.typeDistribution || { choice: 0, fill: 0, short: 0 },
      issues: checkData.issues || [],
      summary: checkData.summary || '',
    };

    // 保存到数据库
    const qualityCheck = saveQualityCheck(qualityCheckData);
    recordUsage(currentUser.id, 'quality', { lessonPlanId: body.lessonPlanId });

    return NextResponse.json<ApiResponse<QualityCheck>>({
      success: true,
      data: qualityCheck,
    });

  } catch (error) {
    console.error('质量检查失败:', error);

    return NextResponse.json<ApiResponse<never>>({
      success: false,
      error: {
        code: 'CHECK_FAILED',
        message: error instanceof Error ? error.message : '质量检查失败，请稍后重试',
      },
    }, { status: 500 });
  }
}
