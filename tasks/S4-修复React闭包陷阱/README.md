# 修复 React useEffect 闭包陷阱

## 任务描述

我写了一个 React 计数器组件，但它的表现很奇怪。每次点击按钮，控制台输出的 `count` 值都跟上一次一样，而不是当前值。我怀疑是 useEffect 的闭包陷阱问题，帮我修复它。

## 代码

```jsx
import React, { useState, useEffect } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      console.log('当前 count:', count);
      setCount(count + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []); // 目前依赖数组为空

  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={() => setCount(count + 1)}>加 1</button>
    </div>
  );
}

export default Counter;
```

问题表现：
1. 控制台 `count` 始终显示 0
2. 点击按钮后，页面显示更新了，但 interval 里的 count 还是旧的
3. 如果去掉依赖数组 `[]`，又会疯狂创建和销毁定时器

请修复这个问题，让定时器能读到最新的 count 值。

## 语言要求

使用 React + JavaScript/TypeScript。
