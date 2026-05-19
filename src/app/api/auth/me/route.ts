import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest, getCurrentUserProfile } from '@/lib/auth';
import type { ApiResponse, CurrentUserResponse } from '@/types';

export async function GET(request: NextRequest) {
  const user = getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json<ApiResponse<never>>({
      success: false,
      error: { code: 'UNAUTHENTICATED', message: '请先登录' },
    }, { status: 401 });
  }

  const profile = getCurrentUserProfile(user.id);
  if (!profile) {
    return NextResponse.json<ApiResponse<never>>({
      success: false,
      error: { code: 'NOT_FOUND', message: '用户不存在' },
    }, { status: 404 });
  }

  return NextResponse.json<ApiResponse<CurrentUserResponse>>({
    success: true,
    data: profile,
  });
}
