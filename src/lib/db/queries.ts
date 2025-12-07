import { getDatabase } from './init';

export interface ForwardRule {
  id: number;
  name: string;
  enabled: number;
  from_addr: string;
  subject_contains: string | null;
  body_contains: string | null;
  exclude_words: string | null;
  forward_to: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ForwardedEmail {
  id: number;
  message_id: string | null;
  rule_id: number;
  from_addr: string;
  to_addr: string;
  subject: string | null;
  body: string | null;
  html_body: string | null;
  raw_email: string | null;
  forwarded_to: string;
  created_at: string;
  expires_at: string;
}

/**
 * 添加转发规则
 */
export function addForwardRule(rule: Omit<ForwardRule, 'id' | 'created_at' | 'updated_at'>): number {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO forward_rules (
      name, enabled, from_addr, subject_contains, body_contains, 
      exclude_words, forward_to, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    rule.name,
    rule.enabled,
    rule.from_addr,
    rule.subject_contains || null,
    rule.body_contains || null,
    rule.exclude_words || null,
    rule.forward_to,
    rule.description || null
  );

  return result.lastInsertRowid as number;
}

/**
 * 获取所有启用的转发规则
 */
export function getEnabledRules(): ForwardRule[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM forward_rules WHERE enabled = 1 ORDER BY id');
  return stmt.all() as ForwardRule[];
}

/**
 * 保存转发的邮件
 */
export function saveForwardedEmail(email: Omit<ForwardedEmail, 'id'>): number {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO forwarded_emails (
      message_id, rule_id, from_addr, to_addr, subject, body, html_body, 
      raw_email, forwarded_to, created_at, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    email.message_id || null,
    email.rule_id,
    email.from_addr,
    email.to_addr,
    email.subject || null,
    email.body || null,
    email.html_body || null,
    email.raw_email || null,
    email.forwarded_to,
    email.created_at,
    email.expires_at
  );

  return result.lastInsertRowid as number;
}

/**
 * 获取所有未过期的转发邮件（按创建时间倒序）
 */
export function getForwardedEmails(limit: number = 100, offset: number = 0): ForwardedEmail[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM forwarded_emails 
    WHERE expires_at > datetime('now')
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);
  return stmt.all(limit, offset) as ForwardedEmail[];
}

/**
 * 获取单个转发邮件的详情
 */
export function getForwardedEmailById(id: number): ForwardedEmail | undefined {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM forwarded_emails 
    WHERE id = ? AND expires_at > datetime('now')
  `);
  return stmt.get(id) as ForwardedEmail | undefined;
}

/**
 * 获取转发邮件的总数
 */
export function getForwardedEmailsCount(): number {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM forwarded_emails 
    WHERE expires_at > datetime('now')
  `);
  const result = stmt.get() as { count: number };
  return result.count;
}

/**
 * 删除过期的邮件
 */
export function deleteExpiredEmails(): number {
  const db = getDatabase();
  const stmt = db.prepare(`
    DELETE FROM forwarded_emails 
    WHERE expires_at <= datetime('now')
  `);
  const result = stmt.run();
  return result.changes;
}

/**
 * 删除指定的邮件
 */
export function deleteEmailById(id: number): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM forwarded_emails WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * 检查邮件是否已处理过（避免重复）
 */
export function emailExists(messageId: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('SELECT id FROM forwarded_emails WHERE message_id = ?');
  return !!stmt.get(messageId);
}

/**
 * 获取数据库统计信息
 */
export function getDatabaseStats() {
  const db = getDatabase();
  
  const totalEmails = (db.prepare('SELECT COUNT(*) as count FROM forwarded_emails').get() as { count: number }).count;
  const activeEmails = (db.prepare('SELECT COUNT(*) as count FROM forwarded_emails WHERE expires_at > datetime(\'now\')').get() as { count: number }).count;
  const totalRules = (db.prepare('SELECT COUNT(*) as count FROM forward_rules').get() as { count: number }).count;
  const enabledRules = (db.prepare('SELECT COUNT(*) as count FROM forward_rules WHERE enabled = 1').get() as { count: number }).count;

  return {
    totalEmails,
    activeEmails,
    totalRules,
    enabledRules,
  };
}
