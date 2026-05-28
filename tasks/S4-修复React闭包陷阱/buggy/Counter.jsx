import React, { useState, useEffect, useRef } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);
  countRef.current = count;

  useEffect(() => {
    const timer = setInterval(() => {
      console.log('当前 count:', countRef.current);
      setCount(countRef.current + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={() => setCount(count + 1)}>加 1</button>
    </div>
  );
}

export default Counter;
