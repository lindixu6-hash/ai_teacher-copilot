import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, deleteSession, getSessionTokenFromRequest } from '@/lib/auth';
import type { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  const token = getSessionTokenFromRequest(request);
  if (token) {
    deleteSession(token);
  }

  const response = NextResponse.json<ApiResponse<{ ok: boolean }>>({
    success: true,
    data: { ok: true },
  });

  return clearSessionCookie(response);
}
