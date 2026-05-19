import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest, getAdminOverview } from '@/lib/auth';
import type { ApiResponse, AdminOverview } from '@/types';

export async function GET(request: NextRequest) {
  const user = getCurrentUserFromRequest(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json<ApiResponse<never>>({
      success: false,
      error: { code: 'FORBIDDEN', message: '需要管理员权限' },
    }, { status: 403 });
  }

  return NextResponse.json<ApiResponse<AdminOverview>>({
    success: true,
    data: getAdminOverview(),
  });
}
