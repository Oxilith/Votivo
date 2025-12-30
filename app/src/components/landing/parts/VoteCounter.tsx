/**
 * @file src/components/landing/shared/VoteCounter.tsx
 * @purpose Animated counter displaying community vote/action count
 * @functionality
 * - Animates number counting from zero to target value on scroll into view
 * - Uses tabular-nums for consistent digit width during animation
 * - Supports customizable animation duration and formatting
 * - Integrates with IntersectionObserver for visibility detection
 * @dependencies
 * - React (useState, useEffect, useRef, useCallback)
 */

import { useState, useEffect, useRef, useCallback, type FC } from 'react';

interface VoteCounterProps {
  targetValue: number;
  duration?: number;
  className?: string;
}

const VoteCounter: FC<VoteCounterProps> = ({ targetValue, duration = 2000, className = '' }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const counterRef = useRef<HTMLSpanElement>(null);

  const animateCount = useCallback(() => {
    const startTime = performance.now();
    const startValue = 0;

    const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      const currentValue = Math.floor(startValue + (targetValue - startValue) * easedProgress);

      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [duration, targetValue]);

  useEffect(() => {
    const element = counterRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          animateCount();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [hasAnimated, animateCount]);

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  return (
    <span ref={counterRef} className={`vote-counter ${className}`.trim()}>
      {formatNumber(count)}
    </span>
  );
};

export default VoteCounter;
