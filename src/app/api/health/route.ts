import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      service: 'ai-teacher-copilot',
      status: 'ok',
      nodeEnv: process.env.NODE_ENV || 'development',
      aiConfigured: Boolean(process.env.OPENAI_API_KEY),
      aiProvider: process.env.OPENAI_BASE_URL?.includes('moonshot') ? 'kimi' : 'openai',
      timestamp: new Date().toISOString(),
    },
  });
}
