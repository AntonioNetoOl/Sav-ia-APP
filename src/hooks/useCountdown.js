import { useEffect, useRef, useState } from "react";

export default function useCountdown(initial = 60) {
  const [left, setLeft] = useState(initial);
  const timerRef = useRef(null);

  useEffect(() => {
    if (left <= 0) return;
    timerRef.current = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [left]);

  const reset = (n = initial) => setLeft(n);
  return { left, reset };
}
