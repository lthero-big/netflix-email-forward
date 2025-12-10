import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;

/**
 * 获取数据库实例，初始化表结构
 */
export function getDatabase(): Database.Database {
  if (db) return db;

  // 在 Vercel 等无服务器环境使用 /tmp 目录，本地使用项目根目录
  const isVercel = process.env.VERCEL === '1';
  const dbPath = isVercel 
    ? '/tmp/emails.db' 
    : path.join(process.cwd(), 'emails.db');
  
  db = new Database(dbPath);
  
  // 启用外键支持
  db.pragma('foreign_keys = ON');
  
  // 初始化数据库表
  initializeSchema();
  
  return db;
}

/**
 * 初始化数据库表结构
 */
function initializeSchema() {
  if (!db) return;

  try {
    // 创建转发规则表
    db.exec(`
      CREATE TABLE IF NOT EXISTS forward_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,
        from_addr TEXT NOT NULL,
        subject_contains TEXT,
        body_contains TEXT,
        exclude_words TEXT,
        forward_to TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建转发邮件表
    db.exec(`
      CREATE TABLE IF NOT EXISTS forwarded_emails (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id TEXT UNIQUE,
        rule_id INTEGER NOT NULL,
        from_addr TEXT NOT NULL,
        to_addr TEXT NOT NULL,
        subject TEXT,
        body TEXT,
        html_body TEXT,
        raw_email TEXT,
        forwarded_to TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        FOREIGN KEY (rule_id) REFERENCES forward_rules(id)
      )
    `);

    // 创建索引
    db.exec('CREATE INDEX IF NOT EXISTS idx_forwarded_emails_rule_id ON forwarded_emails(rule_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_forwarded_emails_created_at ON forwarded_emails(created_at)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_forwarded_emails_expires_at ON forwarded_emails(expires_at)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_forwarded_emails_message_id ON forwarded_emails(message_id)');

    // 添加默认规则（如果不存在）
    const ruleCount = db.prepare('SELECT COUNT(*) as count FROM forward_rules').get() as { count: number };
    if (ruleCount.count === 0) {
      db.prepare(`
        INSERT INTO forward_rules (name, enabled, from_addr, subject_contains, body_contains, forward_to, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        'All Emails',
        1,
        '*',
        null,
        null,
        '',
        'Accept all emails (wildcard rule)'
      );
      console.log('✅ Default forwarding rule added');
    }

    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database schema:', error);
    throw error;
  }
}

/**
 * 关闭数据库连接
 */
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * 获取数据库实例（用于导出，以便在其他地方使用）
 */
export default getDatabase;
