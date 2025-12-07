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
 * 用户在环境变量中配置明文密码，系统自动进行 SHA-256 加密后比较
 */
export function validatePassword(password: string): boolean {
  const plainPassword = process.env.ADMIN_PASSWORD;

  // 如果没有配置密码，拒绝登录
  if (!plainPassword) {
    console.error('No password configured in environment (ADMIN_PASSWORD)');
    return false;
  }

  // 将用户配置的明文密码和输入的密码都进行哈希后比较
  const storedPasswordHash = hashPassword(plainPassword);
  const inputPasswordHash = hashPassword(password);

  return storedPasswordHash === inputPasswordHash;
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
