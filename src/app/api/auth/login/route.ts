import { NextRequest, NextResponse } from 'next/server';
import { validatePassword } from '@/lib/auth';

/**
 * POST /api/auth/login
 * 验证密码并返回会话令牌
 */
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password required' },
        { status: 400 }
      );
    }

    if (!validatePassword(password)) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    // 生成简单的会话令牌
    const token = Buffer.from(
      JSON.stringify({
        timestamp: Date.now(),
        random: Math.random(),
      })
    ).toString('base64');

    return NextResponse.json({
      success: true,
      token,
      expiresIn: 86400, // 24 小时
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
