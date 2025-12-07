/**
 * 测试 Cloudflare Worker 邮件上传
 * 模拟 Worker 发送邮件到本地后端
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api/webhook/email';
const API_KEY = 'Gk1NGvD8QhuxOQ//5yNdrmrkg8+2UFweMGY5BYLjGkU=';

// 测试邮件数据 - 带 HTML 内容和链接
const testEmail = {
  from: 'info@account.netflix.com',
  to: 'your-email@gmail.com',
  subject: 'Your temporary access code',
  body: `Hi there,

Your temporary access code is: 845621

This code will expire in 15 minutes.

If you didn't request this code, please ignore this email.

Best regards,
Netflix Team`,
  html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #e50914; color: white; padding: 20px; text-align: center; }
    .content { background: #f5f5f5; padding: 30px; }
    .code-box { background: white; border: 2px solid #e50914; padding: 20px; text-align: center; margin: 20px 0; }
    .code { font-size: 32px; font-weight: bold; color: #e50914; letter-spacing: 3px; }
    .button { display: inline-block; background: #e50914; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Netflix</h1>
    </div>
    <div class="content">
      <h2>Your Temporary Access Code</h2>
      <p>Hi there,</p>
      <p>Here is your temporary access code to sign in to your Netflix account:</p>
      
      <div class="code-box">
        <div class="code">845621</div>
        <p style="margin: 10px 0 0 0; color: #666;">This code will expire in 15 minutes</p>
      </div>
      
      <p>Use this code to complete your sign-in, or click the button below:</p>
      
      <div style="text-align: center;">
        <a href="https://www.netflix.com/verify?code=845621" class="button">Verify Now</a>
      </div>
      
      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        If you didn't request this code, please ignore this email or 
        <a href="https://help.netflix.com" style="color: #e50914;">contact support</a>.
      </p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
      <p>Netflix, Inc. | 100 Winchester Circle | Los Gatos, CA 95032, USA</p>
      <p><a href="https://www.netflix.com/privacy">Privacy Policy</a> | <a href="https://help.netflix.com">Help Center</a></p>
    </div>
  </div>
</body>
</html>`,
  messageId: `test-${Date.now()}@netflix.com`,
};

console.log('📧 发送测试邮件到后端...\n');
console.log('API URL:', API_URL);
console.log('API Key:', API_KEY.substring(0, 20) + '...\n');
console.log('邮件内容:');
console.log('  From:', testEmail.from);
console.log('  To:', testEmail.to);
console.log('  Subject:', testEmail.subject);
console.log('  Message ID:', testEmail.messageId);
console.log('\n发送中...\n');

axios
  .post(API_URL, testEmail, {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
  })
  .then((response) => {
    console.log('✅ 邮件发送成功！\n');
    console.log('响应数据:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('\n📱 现在可以访问 http://localhost:3000/dashboard 查看邮件');
  })
  .catch((error) => {
    console.error('❌ 发送失败！\n');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
    process.exit(1);
  });
