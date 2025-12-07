const crypto = require('crypto');

/**
 * 生成密码的 SHA-256 哈希值
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// 从命令行参数获取密码
const password = process.argv[2];

if (!password) {
  console.log('用法: node scripts/hashPassword.js <your-password>');
  console.log('');
  console.log('示例:');
  console.log('  node scripts/hashPassword.js admin123');
  console.log('');
  process.exit(1);
}

const hash = hashPassword(password);

console.log('');
console.log('🔐 密码哈希生成成功！');
console.log('');
console.log('原始密码:', password);
console.log('哈希值:', hash);
console.log('');
console.log('请将以下内容添加到 .env.local 文件中：');
console.log('');
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log('');
console.log('或者使用明文密码（不推荐生产环境）：');
console.log('');
console.log(`ADMIN_PASSWORD=${password}`);
console.log('');
