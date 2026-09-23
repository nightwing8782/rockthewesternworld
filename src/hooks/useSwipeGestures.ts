import { useEffect, useRef } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTapLeft?: () => void;
  onTapCenter?: () => void;
  onTapRight?: () => void;
  onDoubleTap?: (clientX: number, clientY: number) => void;
  onPinchZoom?: (scaleDelta: number) => void;
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
    onTapLeft,
    onTapCenter,
    onTapRight,
    onDoubleTap,
    onPinchZoom,
    minDistance = 35,
    maxTimeMs = 450,
  } = options;

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const initialPinchDistRef = useRef<number | null>(null);

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
        initialPinchDistRef.current = null;
      } else if (e.touches.length === 2 && onPinchZoom) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDistRef.current = Math.hypot(dx, dy);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && onPinchZoom && initialPinchDistRef.current) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const scaleDelta = dist / initialPinchDistRef.current;
        onPinchZoom(scaleDelta);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || e.changedTouches.length === 0) {
        initialPinchDistRef.current = null;
        return;
      }

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const elapsed = Date.now() - touchStartRef.current.time;

      touchStartRef.current = null;
      initialPinchDistRef.current = null;

      if (elapsed > maxTimeMs) return;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // TAP Gesture Handling
      if (absX < 18 && absY < 18) {
        const now = Date.now();
        const lastTap = lastTapRef.current;

        // Check for Double Tap (< 300ms and close proximity)
        if (lastTap && now - lastTap.time < 300 && Math.abs(touch.clientX - lastTap.x) < 35 && Math.abs(touch.clientY - lastTap.y) < 35) {
          lastTapRef.current = null;
          if (onDoubleTap) {
            onDoubleTap(touch.clientX, touch.clientY);
            return;
          }
        }

        lastTapRef.current = { x: touch.clientX, y: touch.clientY, time: now };

        // 3-Zone Tap Partitioning (Left 30% | Center 40% | Right 30%)
        const rect = el.getBoundingClientRect();
        const relativeX = touch.clientX - rect.left;
        const width = rect.width || window.innerWidth;
        const leftBoundary = width * 0.30;
        const rightBoundary = width * 0.70;

        if (relativeX < leftBoundary) {
          if (onTapLeft) onTapLeft();
          else if (onTapCenter) onTapCenter();
        } else if (relativeX > rightBoundary) {
          if (onTapRight) onTapRight();
          else if (onTapCenter) onTapCenter();
        } else {
          if (onTapCenter) onTapCenter();
        }
        return;
      }

      // SWIPE Gesture Handling
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
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [
    elementRef,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTapLeft,
    onTapCenter,
    onTapRight,
    onDoubleTap,
    onPinchZoom,
    minDistance,
    maxTimeMs,
  ]);
}
