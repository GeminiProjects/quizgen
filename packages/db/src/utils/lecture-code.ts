import { customAlphabet } from 'nanoid';

/**
 * 生成演讲码的字符集
 * 排除容易混淆的字符：0, O, I, l, 1
 */
const LECTURE_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * 演讲码长度
 */
const LECTURE_CODE_LENGTH = 6;

/**
 * 创建演讲码生成器
 */
const generateCode = customAlphabet(LECTURE_CODE_ALPHABET, LECTURE_CODE_LENGTH);

/**
 * 生成唯一的演讲码
 * @returns 6位大写字母和数字组成的演讲码
 * @example
 * generateLectureCode() // "A2B3C4"
 */
export function generateLectureCode(): string {
  return generateCode();
}

/**
 * 验证演讲码格式是否有效
 * @param code 演讲码
 * @returns 是否有效
 */
export function isValidLectureCode(code: string): boolean {
  if (!code || code.length !== LECTURE_CODE_LENGTH) {
    return false;
  }

  // 检查是否只包含允许的字符
  const regex = new RegExp(`^[${LECTURE_CODE_ALPHABET}]+$`);
  return regex.test(code);
}

/**
 * 格式化演讲码（统一转为大写）
 * @param code 原始演讲码
 * @returns 格式化后的演讲码
 */
export function formatLectureCode(code: string): string {
  // 去除所有非字母数字字符（如连字符），并转为大写
  return code
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase()
    .trim();
}
