/**
 * 密码验证工具
 */

import crypto from 'crypto';

/**
 * 使用 SHA-256 对密码进行哈希
 */
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * 验证密码
 * 支持两种模式：
 * 1. ADMIN_PASSWORD_HASH - 存储预先哈希的密码（推荐）
 * 2. ADMIN_PASSWORD - 存储明文密码，运行时哈希后比较
 */
export function validatePassword(password: string): boolean {
  const storedHash = process.env.ADMIN_PASSWORD_HASH;
  const plainPassword = process.env.ADMIN_PASSWORD;

  // 如果两者都没配置，拒绝登录
  if (!storedHash && !plainPassword) {
    console.error('No password configured in environment (ADMIN_PASSWORD or ADMIN_PASSWORD_HASH)');
    return false;
  }

  // 计算输入密码的哈希值
  const inputHash = hashPassword(password);

  // 优先使用 ADMIN_PASSWORD_HASH
  if (storedHash) {
    return inputHash === storedHash;
  }

  // 如果只配置了 ADMIN_PASSWORD，哈希后比较
  if (plainPassword) {
    const plainPasswordHash = hashPassword(plainPassword);
    return inputHash === plainPasswordHash;
  }

  return false;
}

/**
 * 生成会话令牌（简单实现）
 */
export function generateSessionToken(): string {
  return Buffer.from(Date.now() + '-' + Math.random()).toString('base64');
}

/**
 * 验证会话令牌
 */
export function validateSessionToken(token: string): boolean {
  // 这是一个简单的实现，生产环境应使用 JWT 或更安全的方案
  // 为简化起见，这里只检查令牌是否存在且不为空
  return !!token && token.length > 0;
}
