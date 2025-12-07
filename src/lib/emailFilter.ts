/**
 * 邮件过滤引擎
 * 根据转发规则判断邮件是否应该被转发
 */

import type { ForwardRule } from './db/queries';

export interface EmailMessage {
  from: string;
  to: string;
  subject: string;
  body: string;
  html?: string;
  messageId?: string;
}

/**
 * 检查邮件地址是否匹配规则（支持通配符）
 */
function matchesEmailPattern(email: string, pattern: string): boolean {
  if (pattern === '*') return true;
  if (pattern === '*@*') return true;

  // 转换为正则表达式（* 代表任意字符）
  const regexPattern = pattern
    .toLowerCase()
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // 转义正则特殊字符
    .replace(/\*/g, '.*'); // * 代表任意字符

  try {
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(email.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * 检查邮件是否应该被转发
 */
export function shouldForwardEmail(email: EmailMessage, rule: ForwardRule): boolean {
  // 检查发件人
  if (!matchesEmailPattern(email.from, rule.from_addr)) {
    console.log(`Email from ${email.from} does not match pattern ${rule.from_addr}`);
    return false;
  }

  // 检查主题
  if (rule.subject_contains) {
    const subjectLower = email.subject.toLowerCase();
    const patternLower = rule.subject_contains.toLowerCase();
    if (!subjectLower.includes(patternLower)) {
      console.log(`Subject "${email.subject}" does not contain "${rule.subject_contains}"`);
      return false;
    }
  }

  // 检查邮件体
  if (rule.body_contains) {
    const bodyLower = email.body.toLowerCase();
    const patternLower = rule.body_contains.toLowerCase();
    if (!bodyLower.includes(patternLower)) {
      console.log(`Body does not contain "${rule.body_contains}"`);
      return false;
    }
  }

  // 检查排除词
  if (rule.exclude_words) {
    const excludeWords = rule.exclude_words
      .split(',')
      .map(w => w.trim().toLowerCase())
      .filter(w => w);

    const emailContent = `${email.subject.toLowerCase()} ${email.body.toLowerCase()}`;

    for (const word of excludeWords) {
      if (emailContent.includes(word)) {
        console.log(`Email contains exclude word "${word}"`);
        return false;
      }
    }
  }

  return true;
}

/**
 * 查找第一个匹配的规则
 */
export function findMatchingRule(email: EmailMessage, rules: ForwardRule[]): ForwardRule | null {
  for (const rule of rules) {
    if (shouldForwardEmail(email, rule)) {
      return rule;
    }
  }
  return null;
}
