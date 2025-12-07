import { NextRequest, NextResponse } from 'next/server';

/**
 * 获取系统配置信息
 */
export async function GET(request: NextRequest) {
  try {
    // 验证 token（可选，根据需要添加）
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 读取环境变量
    const expiryMinutes = parseInt(process.env.EMAIL_EXPIRY_MINUTES || '30', 10);

    return NextResponse.json({
      success: true,
      expiryMinutes,
    });
  } catch (error) {
    console.error('Config API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
