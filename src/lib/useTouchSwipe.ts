import { useRef, useCallback } from "react";

export interface UseTouchSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minDistance?: number;
  maxDurationMs?: number;
}

export function useTouchSwipe({
  onSwipeLeft,
  onSwipeRight,
  minDistance = 40,
  maxDurationMs = 800,
}: UseTouchSwipeOptions) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isSwipingRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    isSwipingRef.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Detect intentional horizontal drag
    if (Math.abs(deltaX) > 12 && Math.abs(deltaX) > Math.abs(deltaY) * 1.1) {
      isSwipingRef.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const duration = Date.now() - touchStartRef.current.time;

    touchStartRef.current = null;

    // Confirm true horizontal swipe gesture
    if (
      Math.abs(deltaX) >= minDistance &&
      Math.abs(deltaX) > Math.abs(deltaY) * 1.2 &&
      duration <= maxDurationMs
    ) {
      if (deltaX < 0) {
        onSwipeLeft?.();
      } else {
        onSwipeRight?.();
      }
    }

    // Give a brief window to prevent click events from firing immediately after a swipe
    setTimeout(() => {
      isSwipingRef.current = false;
    }, 120);
  }, [minDistance, maxDurationMs, onSwipeLeft, onSwipeRight]);

  return {
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    isSwiping: () => isSwipingRef.current,
  };
}
