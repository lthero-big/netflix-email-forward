/**
 * 测试 API Key 验证
 */

const axios = require('axios');

const API_URL = process.argv[2] || 'http://159.195.60.133:3303/api/webhook/email';
const API_KEY = process.argv[3] || 'Gk1NGvD8QhuxOQ//5yNdrmrkg8+2UFweMGY5BYLjGkU=';

console.log('🔑 测试 API Key 验证\n');
console.log('API URL:', API_URL);
console.log('API Key:', API_KEY.substring(0, 20) + '...\n');

async function test() {
  const testEmail = {
    from: 'test@example.com',
    to: 'test@example.com',
    subject: 'API Key Test',
    body: 'Testing API Key validation',
  };

  console.log('📤 发送请求...\n');

  try {
    const response = await axios.post(API_URL, testEmail, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      validateStatus: () => true, // 接受所有状态码
    });

    console.log('📬 响应状态:', response.status);
    console.log('📄 响应头:', JSON.stringify(response.headers, null, 2));
    console.log('📝 响应体:', JSON.stringify(response.data, null, 2));

    if (response.status === 200 || response.status === 201) {
      console.log('\n✅ 测试成功！API Key 验证通过');
    } else if (response.status === 401) {
      console.log('\n❌ API Key 验证失败！密钥不匹配');
    } else if (response.status === 403) {
      console.log('\n❌ 403 Forbidden - 可能原因:');
      console.log('   1. Nginx 配置问题');
      console.log('   2. 防火墙拦截');
      console.log('   3. IP 白名单限制');
    } else {
      console.log('\n⚠️  意外的状态码:', response.status);
    }
  } catch (error) {
    console.error('\n❌ 请求失败:', error.message);
    if (error.response) {
      console.error('   状态码:', error.response.status);
      console.error('   响应:', error.response.data);
    }
  }
}

test();
