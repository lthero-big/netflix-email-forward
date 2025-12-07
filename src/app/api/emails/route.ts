import { NextRequest, NextResponse } from 'next/server';
import { 
  getForwardedEmails, 
  getForwardedEmailsCount, 
  getForwardedEmailById,
  getDatabaseStats 
} from '@/lib/db/queries';

/**
 * 验证会话令牌
 */
function isAuthenticated(request: NextRequest): boolean {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  // 简单的令牌验证，生产环境应使用更安全的方案
  return !!token;
}

/**
 * GET /api/emails?limit=20&offset=0
 * 获取转发的邮件列表（分页）
 */
export async function GET(request: NextRequest) {
  try {
    if (!isAuthenticated(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const id = searchParams.get('id');

    // 获取单个邮件详情
    if (id) {
      const email = getForwardedEmailById(parseInt(id));
      if (!email) {
        return NextResponse.json(
          { success: false, error: 'Email not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: email,
      });
    }

    // 获取邮件列表
    const emails = getForwardedEmails(limit, offset);
    const total = getForwardedEmailsCount();
    const stats = getDatabaseStats();

    return NextResponse.json({
      success: true,
      data: emails,
      pagination: {
        limit,
        offset,
        total,
      },
      stats,
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
