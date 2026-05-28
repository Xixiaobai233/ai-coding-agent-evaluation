/**
 * 修复 TypeScript 类型窄化错误
 *
 * 演示常见的类型窄化问题及其修复。
 */

// ========== 问题 1：未处理的 null/undefined ==========

function getLength1(value: string | null): number {
  // BUG: 没有检查 null，直接访问 length
  return value.length;
}


// ========== 问题 2：typeof 类型守卫不完整 ==========

function doubleValue1(value: string | number): string | number {
  // BUG: typeof 检查不完整
  if (typeof value === 'string') {
    return value + value;
  }
  // 这里的 value 已经是 number，但应使用 typeof 窄化
  return value * 2;
}


// ========== 问题 3：in 操作符类型守卫 ==========

interface Dog {
  bark(): void;
  run(): void;
}

interface Fish {
  swim(): void;
}

function makeSound1(animal: Dog | Fish): void {
  // BUG: Dog 上有 run，Fish 上也可能有
  if ('run' in animal) {
    animal.bark();
  } else {
    animal.swim();
  }
}


// ========== 问题 4： discriminated union 未处理 ==========

type Shape1 =
  | { kind: 'circle'; radius: number }
  | { kind: 'rectangle'; width: number; height: number }
  | { kind: 'triangle'; base: number; height: number };

function getArea1(shape: Shape1): number {
  // BUG: 缺少 triangle 分支
  if (shape.kind === 'circle') {
    return Math.PI * shape.radius ** 2;
  } else if (shape.kind === 'rectangle') {
    return shape.width * shape.height;
  }
  // 这里 shape 被窄化为 triangle，但未处理
  // 实际上这里应该处理 triangle 或使用 exhaustive check
  return shape.base * shape.height / 2;
}


// ========== 问题 5：Array.isArray 类型守卫 ==========

function processData1(data: number[] | number): number[] {
  // BUG: 类型窄化不正确
  if (Array.isArray(data)) {
    return data;
  }
  return [data];
}


// ========== 问题 6：可选链操作符问题 ==========

interface User1 {
  name: string;
  address?: {
    city: string;
    zip?: string;
  };
}

function getCity1(user: User1): string {
  // BUG: 多层可选链可能返回 undefined，但函数签名返回 string
  return user.address?.city;
}
