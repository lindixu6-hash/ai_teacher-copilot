/**
 * 历史记录 API
 * GET /api/history - 获取历史记录列表
 * GET /api/history?id=xxx - 获取单个教案详情
 * DELETE /api/history?id=xxx - 删除教案
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getLessonPlans,
  getLessonPlanById,
  getQuestionsByLessonId,
  getQualityCheckByLessonId,
  deleteLessonPlan,
  getLessonPlansCount,
} from '@/lib/db';
import { ApiResponse, LessonPlan, HistoryListResponse } from '@/types';

// 获取历史记录列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // 如果有 id 参数，返回单个教案详情
    if (id) {
      const lessonPlan = getLessonPlanById(id);

      if (!lessonPlan) {
        return NextResponse.json<ApiResponse<never>>({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '教案不存在',
          },
        }, { status: 404 });
      }

      // 获取关联题目
      const questions = getQuestionsByLessonId(id);

      // 获取质量检查
      const qualityCheck = getQualityCheckByLessonId(id);

      return NextResponse.json<ApiResponse<{
        lessonPlan: LessonPlan;
        questions: typeof questions;
        qualityCheck: typeof qualityCheck;
      }>>({
        success: true,
        data: {
          lessonPlan,
          questions,
          qualityCheck,
        },
      });
    }

    // 否则返回列表
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const items = getLessonPlans(limit, offset);
    const total = getLessonPlansCount();

    return NextResponse.json<ApiResponse<HistoryListResponse>>({
      success: true,
      data: {
        items,
        total,
        hasMore: offset + items.length < total,
      },
    });

  } catch (error) {
    console.error('获取历史记录失败:', error);

    return NextResponse.json<ApiResponse<never>>({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: '获取历史记录失败',
      },
    }, { status: 500 });
  }
}

// 删除教案
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json<ApiResponse<never>>({
        success: false,
        error: {
          code: 'MISSING_ID',
          message: '请提供教案ID',
        },
      }, { status: 400 });
    }

    const success = deleteLessonPlan(id);

    if (!success) {
      return NextResponse.json<ApiResponse<never>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '教案不存在',
        },
      }, { status: 404 });
    }

    return NextResponse.json<ApiResponse<{ deleted: boolean }>>({
      success: true,
      data: { deleted: true },
    });

  } catch (error) {
    console.error('删除教案失败:', error);

    return NextResponse.json<ApiResponse<never>>({
      success: false,
      error: {
        code: 'DELETE_FAILED',
        message: '删除教案失败',
      },
    }, { status: 500 });
  }
}
