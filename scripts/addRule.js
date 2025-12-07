const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'emails.db');
const db = new Database(dbPath);

console.log('📧 Adding Netflix forward rule...');

// 首先确保表已经创建
db.exec(`
  CREATE TABLE IF NOT EXISTS forward_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    enabled INTEGER DEFAULT 1,
    from_addr TEXT NOT NULL,
    subject_contains TEXT,
    body_contains TEXT,
    exclude_words TEXT,
    forward_to TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// 添加 Netflix 转发规则
const stmt = db.prepare(`
  INSERT INTO forward_rules (
    name, enabled, from_addr, subject_contains, body_contains, 
    exclude_words, forward_to, description
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

try {
  const result = stmt.run(
    'Netflix OTP',
    1,
    '*@account.netflix.com',
    'Your temporary access code',
    null,
    null,
    '', // 留空表示仅保存本地，不转发
    'Save Netflix temporary access codes locally'
  );

  console.log(`✅ Rule added successfully with ID: ${result.lastInsertRowid}`);
} catch (error) {
  console.error('❌ Error adding rule:', error.message);
}

// 显示所有规则
console.log('\n📋 Current rules:');
const rules = db.prepare('SELECT * FROM forward_rules').all();
rules.forEach(rule => {
  console.log(`  ${rule.id}. ${rule.name} (${rule.enabled ? 'Enabled' : 'Disabled'})`);
  console.log(`     From: ${rule.from_addr}`);
  console.log(`     Subject contains: ${rule.subject_contains || 'N/A'}`);
  console.log(`     Forward to: ${rule.forward_to}`);
  console.log('');
});

db.close();
