import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, attachSessionCookie, createSession, updateLastLogin, getCurrentUserProfile } from '@/lib/auth';
import type { ApiResponse, CurrentUserResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      return NextResponse.json<ApiResponse<never>>({
        success: false,
        error: { code: 'MISSING_FIELDS', message: '请填写邮箱和密码' },
      }, { status: 400 });
    }

    const user = authenticateUser(email, password);
    if (!user) {
      return NextResponse.json<ApiResponse<never>>({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: '邮箱或密码错误' },
      }, { status: 401 });
    }

    updateLastLogin(user.id);
    const session = createSession(user.id);
    const profile = getCurrentUserProfile(user.id);

    const response = NextResponse.json<ApiResponse<CurrentUserResponse>>({
      success: true,
      data: profile!,
    });

    return attachSessionCookie(response, session.token);
  } catch (error) {
    return NextResponse.json<ApiResponse<never>>({
      success: false,
      error: { code: 'LOGIN_FAILED', message: error instanceof Error ? error.message : '登录失败' },
    }, { status: 500 });
  }
}
