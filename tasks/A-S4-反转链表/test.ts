import { ListNode, reverseList, reverseListRecursive } from './template';
import assert from 'assert';

function arrayToList(arr: number[]): ListNode | null {
  if (arr.length === 0) return null;
  const head = new ListNode(arr[0]);
  let curr = head;
  for (let i = 1; i < arr.length; i++) {
    curr.next = new ListNode(arr[i]);
    curr = curr.next;
  }
  return head;
}

function listToArray(head: ListNode | null): number[] {
  const result: number[] = [];
  let curr = head;
  while (curr !== null) {
    result.push(curr.val);
    curr = curr.next;
  }
  return result;
}

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  PASS: ${name}`);
  } catch (e: any) {
    console.error(`  FAIL: ${name} - ${e.message}`);
    process.exitCode = 1;
  }
}

// 测试迭代法
test('迭代法 - 正常反转', () => {
  const head = arrayToList([1, 2, 3, 4, 5]);
  const reversed = reverseList(head);
  assert.deepStrictEqual(listToArray(reversed), [5, 4, 3, 2, 1]);
});

test('迭代法 - 单节点', () => {
  const head = arrayToList([1]);
  const reversed = reverseList(head);
  assert.deepStrictEqual(listToArray(reversed), [1]);
});

test('迭代法 - 空链表', () => {
  const reversed = reverseList(null);
  assert.strictEqual(reversed, null);
});

test('迭代法 - 两个节点', () => {
  const head = arrayToList([1, 2]);
  const reversed = reverseList(head);
  assert.deepStrictEqual(listToArray(reversed), [2, 1]);
});

// 测试递归法
test('递归法 - 正常反转', () => {
  const head = arrayToList([1, 2, 3, 4, 5]);
  const reversed = reverseListRecursive(head);
  assert.deepStrictEqual(listToArray(reversed), [5, 4, 3, 2, 1]);
});

test('递归法 - 单节点', () => {
  const head = arrayToList([1]);
  const reversed = reverseListRecursive(head);
  assert.deepStrictEqual(listToArray(reversed), [1]);
});

test('递归法 - 空链表', () => {
  const reversed = reverseListRecursive(null);
  assert.strictEqual(reversed, null);
});

test('递归法 - 两个节点', () => {
  const head = arrayToList([1, 2]);
  const reversed = reverseListRecursive(head);
  assert.deepStrictEqual(listToArray(reversed), [2, 1]);
});

console.log('\nA-S4 测试完成');
