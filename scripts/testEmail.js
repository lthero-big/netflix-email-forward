const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const API_KEY = process.env.WEBHOOK_API_KEY || '';

console.log('📧 Sending test email to API...\n');

const testEmail = {
  from: 'info@account.netflix.com',
  to: 'test@example.com',
  subject: 'Your temporary access code',
  body: 'Your temporary access code is: 123456\n\nThis code will expire in 5 minutes.',
  messageId: `test-${Date.now()}@example.com`,
};

console.log('Test email data:');
console.log(JSON.stringify(testEmail, null, 2));
console.log('');

axios.post(`${API_URL}/api/webhook/email`, testEmail, {
  headers: {
    'Content-Type': 'application/json',
    ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
  },
})
  .then(response => {
    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  })
  .catch(error => {
    console.error('❌ Error!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
    process.exit(1);
  });
