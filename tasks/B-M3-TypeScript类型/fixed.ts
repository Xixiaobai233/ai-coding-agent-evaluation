/**
 * 修复 TypeScript 类型窄化错误 - 修复版本
 */

// ========== 问题 1：未处理的 null/undefined ==========

function getLength2(value: string | null): number {
  if (value === null) {
    return 0;
  }
  return value.length;
}


// ========== 问题 2：typeof 类型守卫不完整 ==========

function doubleValue2(value: string | number): string | number {
  if (typeof value === 'string') {
    return value + value;
  }
  // 修复：使用 typeof 窄化 number
  if (typeof value === 'number') {
    return value * 2;
  }
  // exhaustive check
  const _exhaustive: never = value;
  return _exhaustive;
}


// ========== 问题 3：in 操作符类型守卫 ==========

function makeSound2(animal: Dog | Fish): void {
  // 修复：使用 bark 作为区分特征（Dog 有 bark，Fish 没有）
  if ('bark' in animal) {
    animal.bark();
  } else {
    animal.swim();
  }
}


// ========== 问题 4： discriminated union 未处理 ==========

type Shape2 =
  | { kind: 'circle'; radius: number }
  | { kind: 'rectangle'; width: number; height: number }
  | { kind: 'triangle'; base: number; height: number };

function getArea2(shape: Shape2): number {
  // 修复：使用 exhaustive switch
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'rectangle':
      return shape.width * shape.height;
    case 'triangle':
      return shape.base * shape.height / 2;
    default:
      const _exhaustive: never = shape;
      return _exhaustive;
  }
}


// ========== 问题 5：Array.isArray 类型守卫 ==========

function processData2(data: number[] | number): number[] {
  // 修复：通过 Array.isArray 正确窄化
  if (Array.isArray(data)) {
    return data;
  }
  return [data];
}


// ========== 问题 6：可选链操作符问题 ==========

function getCity2(user: User1): string {
  // 修复：处理 undefined 情况
  return user.address?.city ?? 'unknown';
}


// 类型定义（供修复版使用）
interface Dog {
  bark(): void;
  run(): void;
}

interface Fish {
  swim(): void;
}

interface User1 {
  name: string;
  address?: {
    city: string;
    zip?: string;
  };
}
