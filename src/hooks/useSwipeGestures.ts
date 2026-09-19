import { useEffect, useRef } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTapCenter?: () => void;
  minDistance?: number;
  maxTimeMs?: number;
}

export function useSwipeGestures(
  elementRef: React.RefObject<HTMLElement | null>,
  options: SwipeGestureOptions
) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTapCenter,
    minDistance = 45,
    maxTimeMs = 400,
  } = options;

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: Date.now(),
        };
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || e.changedTouches.length === 0) return;

      const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
      const elapsed = Date.now() - touchStartRef.current.time;

      touchStartRef.current = null;

      if (elapsed > maxTimeMs) return;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX < 15 && absY < 15) {
        // Tap gesture
        if (onTapCenter) onTapCenter();
        return;
      }

      if (absX > absY && absX >= minDistance) {
        if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        } else if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        }
      } else if (absY >= minDistance) {
        if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        } else if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        }
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTapCenter, minDistance, maxTimeMs]);
}
