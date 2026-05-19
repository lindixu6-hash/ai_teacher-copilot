/**
 * 教案生成 API
 * POST /api/generate/lesson
 */

import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/openai';
import { saveLessonPlan } from '@/lib/db';
import { generateLessonPrompt, extractJSON, safeJSONParse } from '@/lib/prompts';
import { getClientKey, rateLimit } from '@/lib/rate-limit';
import { assertUsageAllowance, getCurrentUserFromRequest, recordUsage } from '@/lib/auth';
import { LessonInput, LessonContent, ApiResponse, LessonGenerateResponse } from '@/types';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const currentUser = getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json<ApiResponse<never>>({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: '请先登录',
        },
      }, { status: 401 });
    }

    const allowance = assertUsageAllowance(currentUser.id, 'lesson');
    if (!allowance.ok) {
      return NextResponse.json<ApiResponse<never>>({
        success: false,
        error: {
          code: 'PLAN_LIMIT_REACHED',
          message: allowance.reason || '本月额度已用完',
        },
      }, { status: 402 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    const limiter = rateLimit(getClientKey(ip, 'lesson'), 10, 60_000);
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
    const body: LessonInput = await request.json();

    // 验证必填字段
    if (!body.grade || !body.subject || !body.topic || !body.objectives || !body.duration) {
      return NextResponse.json<ApiResponse<never>>({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: '请填写完整的教案信息',
        },
      }, { status: 400 });
    }

    // 生成 Prompt
    const prompt = generateLessonPrompt(body);

    // 调用 OpenAI
    const response = await chatCompletion([
      {
        role: 'system',
        content: '你是一位专业的教师，擅长教学设计和课程开发。请严格按照用户要求的格式输出，不要添加任何额外的说明文字。',
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
    const content = safeJSONParse<LessonContent>(jsonContent, {} as LessonContent);

    // 验证生成的教案内容
    if (!content.objectives || !content.keyPoints || !content.process) {
      return NextResponse.json<ApiResponse<never>>({
        success: false,
        error: {
          code: 'INVALID_RESPONSE',
          message: 'AI 生成的教案格式不正确，请重试',
        },
      }, { status: 500 });
    }

    // 保存到数据库
    const lessonPlan = saveLessonPlan({
      grade: body.grade,
      subject: body.subject,
      textbook: body.textbook,
      topic: body.topic,
      objectives: body.objectives,
      duration: body.duration,
      content,
    });
    recordUsage(currentUser.id, 'lesson', { lessonPlanId: lessonPlan.id });

    const duration = Date.now() - startTime;

    return NextResponse.json<ApiResponse<LessonGenerateResponse>>({
      success: true,
      data: {
        lessonPlan,
        duration,
      },
    });

  } catch (error) {
    console.error('教案生成失败:', error);

    return NextResponse.json<ApiResponse<never>>({
      success: false,
      error: {
        code: 'GENERATION_FAILED',
        message: error instanceof Error ? error.message : '教案生成失败，请稍后重试',
      },
    }, { status: 500 });
  }
}

// 获取所有教案
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { getLessonPlans } = await import('@/lib/db');
    const items = getLessonPlans(limit, offset);
    const { getLessonPlansCount } = await import('@/lib/db');
    const total = getLessonPlansCount();

    return NextResponse.json<ApiResponse<{
      items: typeof items;
      total: number;
      hasMore: boolean;
    }>>({
      success: true,
      data: {
        items,
        total,
        hasMore: offset + items.length < total,
      },
    });
  } catch (error) {
    console.error('获取教案列表失败:', error);

    return NextResponse.json<ApiResponse<never>>({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: '获取教案列表失败',
      },
    }, { status: 500 });
  }
}
