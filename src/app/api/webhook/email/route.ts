import { NextRequest, NextResponse } from 'next/server';
import { getEnabledRules, saveForwardedEmail, emailExists, deleteExpiredEmails } from '@/lib/db/queries';
import { findMatchingRule, type EmailMessage } from '@/lib/emailFilter';
import { addMinutes } from 'date-fns';
import { simpleParser } from 'mailparser';

/**
 * 处理 Cloudflare Email Routing 的 POST 请求
 * 或从其他邮件服务接收原始邮件内容
 */
export async function POST(request: NextRequest) {
  try {
    // 每次接收邮件时自动清理过期邮件
    const deletedCount = deleteExpiredEmails();
    if (deletedCount > 0) {
      console.log(`🗑️  Auto-cleaned ${deletedCount} expired emails`);
    }

    // 验证 API 密钥（可选，用于安全性）
    const apiKey = request.headers.get('x-api-key');
    const expectedKey = process.env.WEBHOOK_API_KEY;
    
    console.log('📨 Webhook request received');
    console.log('   API Key provided:', apiKey ? apiKey.substring(0, 20) + '...' : 'NONE');
    console.log('   API Key provided (full):', apiKey || 'NONE');
    console.log('   Expected API Key:', expectedKey ? expectedKey.substring(0, 20) + '...' : 'NOT CONFIGURED');
    console.log('   Expected API Key (full):', expectedKey || 'NOT CONFIGURED');
    console.log('   Content-Type:', request.headers.get('content-type'));
    console.log('   Keys match:', apiKey === expectedKey);
    
    if (apiKey && apiKey !== expectedKey) {
      console.error('❌ API Key mismatch!');
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      );
    }
    
    if (!apiKey && expectedKey) {
      console.warn('⚠️  No API Key provided but one is configured');
    }

    // 获取请求体
    const contentType = request.headers.get('content-type');
    let mailData: EmailMessage | null = null;

    if (contentType?.includes('application/json')) {
      // JSON 格式的邮件数据
      const data = await request.json();
      mailData = {
        from: data.from || '',
        to: data.to || '',
        subject: data.subject || '',
        body: data.body || '',
        html: data.html || undefined,
        messageId: data.messageId || undefined,
      };
    } else {
      // 原始 RFC 5322 邮件格式
      const rawEmail = await request.text();
      const parsed = await simpleParser(rawEmail);

      // 处理 AddressObject 类型（可能是单个对象或数组）
      const getAddressText = (addr: any): string => {
        if (!addr) return '';
        if (Array.isArray(addr)) {
          return addr[0]?.text || addr[0]?.address || '';
        }
        return addr.text || addr.address || '';
      };

      mailData = {
        from: getAddressText(parsed.from),
        to: getAddressText(parsed.to),
        subject: parsed.subject || '',
        body: parsed.text || '',
        html: parsed.html ? String(parsed.html) : undefined,
        messageId: parsed.messageId || undefined,
      };
    }

    if (!mailData.from || !mailData.to) {
      return NextResponse.json(
        { success: false, error: 'Missing from or to address' },
        { status: 400 }
      );
    }

    console.log(`Processing email from ${mailData.from} to ${mailData.to}`);

    // 检查是否已处理过（避免重复）
    if (mailData.messageId && emailExists(mailData.messageId)) {
      console.log(`Email ${mailData.messageId} already processed`);
      return NextResponse.json({
        success: true,
        message: 'Email already processed',
      });
    }

    // 获取启用的规则
    const rules = getEnabledRules();
    if (rules.length === 0) {
      console.warn('No forwarding rules configured');
      return NextResponse.json({
        success: true,
        message: 'No rules configured',
      });
    }

    // 找到匹配的规则
    const matchedRule = findMatchingRule(mailData, rules);
    if (!matchedRule) {
      console.log(`No matching rule found for email from ${mailData.from}`);
      return NextResponse.json({
        success: true,
        message: 'No matching rule found',
      });
    }

    // 保存邮件到数据库
    // 从环境变量读取过期时间（分钟），默认 30 分钟
    const expiryMinutes = parseInt(process.env.EMAIL_EXPIRY_MINUTES || '30', 10);
    const expiresAt = addMinutes(new Date(), expiryMinutes).toISOString();
    const emailId = saveForwardedEmail({
      message_id: mailData.messageId || null,
      rule_id: matchedRule.id,
      from_addr: mailData.from,
      to_addr: mailData.to,
      subject: mailData.subject,
      body: mailData.body,
      html_body: mailData.html || null,
      raw_email: null,
      forwarded_to: matchedRule.forward_to || 'local',
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
    });

    const forwardStatus = matchedRule.forward_to 
      ? `forwarded to ${matchedRule.forward_to}` 
      : 'saved locally only';
    console.log(`Email saved with ID ${emailId}, ${forwardStatus}`);

    // 仅当配置了转发地址时才转发
    // if (matchedRule.forward_to) {
    //   await forwardEmailToService(matchedRule.forward_to, mailData);
    // }

    return NextResponse.json({
      success: true,
      message: matchedRule.forward_to ? 'Email processed and forwarded' : 'Email processed and saved locally',
      emailId,
      ruleId: matchedRule.id,
      forwardedTo: matchedRule.forward_to || 'local',
    });
  } catch (error) {
    console.error('Error processing email:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * 清理过期邮件的定期任务
 * 可以通过 cron 端点调用或定时任务触发
 */
export async function GET(request: NextRequest) {
  try {
    const action = request.nextUrl.searchParams.get('action');
    const token = request.nextUrl.searchParams.get('token');

    // 简单的令牌验证
    if (token !== process.env.CLEANUP_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    if (action === 'cleanup') {
      const deletedCount = deleteExpiredEmails();
      return NextResponse.json({
        success: true,
        message: `Deleted ${deletedCount} expired emails`,
        deletedCount,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
