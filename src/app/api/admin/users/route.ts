import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest, listAdminUsers, updateUserPlan } from '@/lib/auth';
import type { ApiResponse, SubscriptionPlan, UserRole } from '@/types';

export async function GET(request: NextRequest) {
  const user = getCurrentUserFromRequest(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json<ApiResponse<never>>({
      success: false,
      error: { code: 'FORBIDDEN', message: '需要管理员权限' },
    }, { status: 403 });
  }

  return NextResponse.json<ApiResponse<{ users: ReturnType<typeof listAdminUsers> }>>({
    success: true,
    data: { users: listAdminUsers() },
  });
}

export async function PATCH(request: NextRequest) {
  const user = getCurrentUserFromRequest(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json<ApiResponse<never>>({
      success: false,
      error: { code: 'FORBIDDEN', message: '需要管理员权限' },
    }, { status: 403 });
  }

  const body = await request.json();
  const targetUserId = String(body.userId || '');
  const plan = String(body.plan || '') as SubscriptionPlan;
  const role = body.role ? String(body.role) as UserRole : undefined;

  if (!targetUserId || !['free', 'pro', 'team'].includes(plan)) {
    return NextResponse.json<ApiResponse<never>>({
      success: false,
      error: { code: 'MISSING_FIELDS', message: '请提供用户和套餐' },
    }, { status: 400 });
  }

  const updated = updateUserPlan(targetUserId, plan, role);
  if (!updated) {
    return NextResponse.json<ApiResponse<never>>({
      success: false,
      error: { code: 'NOT_FOUND', message: '用户不存在' },
    }, { status: 404 });
  }

  return NextResponse.json<ApiResponse<{ ok: boolean }>>({
    success: true,
    data: { ok: true },
  });
}
