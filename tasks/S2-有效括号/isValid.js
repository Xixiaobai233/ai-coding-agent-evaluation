/**
 * 判断给定的括号字符串是否有效。
 *
 * 使用栈数据结构实现，时间复杂度 O(n)，空间复杂度 O(n)。
 *
 * @param {string} s 只包含 '('、')'、'{'、'}'、'['、']' 的字符串
 * @returns {boolean} 括号是否有效匹配
 */
function isValid(s) {
  const stack = [];
  const pairs = {
    ')': '(',
    '}': '{',
    ']': '[',
  };

  for (const char of s) {
    if (char in pairs) {
      // 遇到右括号：检查栈顶是否是对应的左括号
      const top = stack.pop();
      if (top !== pairs[char]) {
        return false;
      }
    } else {
      // 遇到左括号：入栈
      stack.push(char);
    }
  }

  // 栈为空说明所有括号都正确闭合
  return stack.length === 0;
}

module.exports = isValid;
