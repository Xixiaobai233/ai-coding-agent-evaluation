/**
 * 单链表节点定义
 */
export class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val?: number, next?: ListNode | null) {
    this.val = val ?? 0;
    this.next = next ?? null;
  }
}

/**
 * 反转链表 - 迭代法
 *
 * 使用三个指针 prev / curr / next 遍历并反转。
 *
 * @param head 链表头节点
 * @returns 反转后的链表头节点
 */
export function reverseList(head: ListNode | null): ListNode | null {
  // TODO: 实现迭代法反转
  return null;
}

/**
 * 反转链表 - 递归法
 *
 * 递归到链表末尾，然后逐层反转指针。
 *
 * @param head 链表头节点
 * @returns 反转后的链表头节点
 */
export function reverseListRecursive(head: ListNode | null): ListNode | null {
  // TODO: 实现递归法反转
  return null;
}
