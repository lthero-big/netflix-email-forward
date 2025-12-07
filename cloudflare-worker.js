/**
 * Cloudflare Email Worker
 * 接收邮件并转发到你的 Web 应用
 * 
 * 部署方式：
 * 1. 在 Cloudflare Dashboard 创建一个 Worker
 * 2. 复制此代码到 Worker 编辑器
 * 3. 在 Email Routing 中将邮件路由到此 Worker
 * 4. 配置环境变量（可选）
 */

export default {
  // 处理 HTTP 请求（用于健康检查和测试）
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 健康检查端点
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        message: 'Email Worker is running',
        timestamp: new Date().toISOString(),
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // 测试邮件转发端点
    if (url.pathname === '/test' && request.method === 'POST') {
      try {
        const testEmail = await request.json();
        const WEB_APP_URL = env.WEB_APP_URL || 'http://your-server-ip:3303';
        const API_KEY = env.WEBHOOK_API_KEY || '';
        
        const response = await fetch(`${WEB_APP_URL}/api/webhook/email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY,
          },
          body: JSON.stringify(testEmail),
        });
        
        const result = await response.json();
        return new Response(JSON.stringify({
          success: true,
          webAppResponse: result,
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message,
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    
    // 默认响应
    return new Response(JSON.stringify({
      message: 'Email Worker',
      endpoints: {
        health: '/health - Check worker status',
        test: '/test - POST to test email forwarding',
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  // 处理邮件（Cloudflare Email Routing）
  async email(message, env, ctx) {
    try {
      // 你的 Web 应用地址（建议从环境变量读取）
      const WEB_APP_URL = env.WEB_APP_URL || 'http://your-server-ip:3303';
      
      // API 密钥（必须与 Web 应用的 WEBHOOK_API_KEY 保持一致）
      // 在 Worker Settings → Variables 中设置 WEBHOOK_API_KEY
      const API_KEY = env.WEBHOOK_API_KEY || 'your-webhook-api-key-here';
      
      console.log('📧 Receiving email from:', message.from, 'to:', message.to);
      console.log('🔗 Forwarding to:', WEB_APP_URL);
      console.log('🔑 Using API Key:', API_KEY ? API_KEY.substring(0, 20) + '...' : 'NONE');
      
      // 读取原始邮件内容 - 使用 message.rawSize 和 ReadableStream
      const rawEmailStream = message.raw;
      const rawEmail = await streamToArrayBuffer(rawEmailStream);
      
      // 转发到你的 Web 应用
      const response = await fetch(`${WEB_APP_URL}/api/webhook/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'message/rfc822',
          'X-API-Key': API_KEY,
        },
        body: rawEmail,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Email forwarded successfully:', result);
        
        // 标记为已处理，不继续传递
        message.setReject('Email processed and forwarded to web app');
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to forward email');
        console.error('   Status:', response.status);
        console.error('   Response:', errorText);
        console.error('   Headers:', JSON.stringify([...response.headers.entries()]));
        
        // 转发失败，可以选择拒绝或继续传递
        message.setReject(`Failed to forward: ${response.status}`);
      }
      
    } catch (error) {
      console.error('❌ Error processing email:', error);
      message.setReject(`Error: ${error.message}`);
    }
  },
};

/**
 * 将 ReadableStream 转换为 ArrayBuffer
 */
async function streamToArrayBuffer(stream) {
  const reader = stream.getReader();
  const chunks = [];
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  // 合并所有 chunks
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return result;
}
