import { useEffect, useRef } from 'react';
import Konva from 'konva';

interface UseCanvasScrollArgs {
  stageRef: React.RefObject<Konva.Stage>;
}

export const useCanvasScroll = ({ stageRef }: UseCanvasScrollArgs) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const container = scrollContainerRef.current;
    if (!stage || !container) return;

    // Ensure stage matches viewport and initial position
    const resize = () => {
      stage.size({ width: window.innerWidth, height: window.innerHeight });
      stage.batchDraw();
    };

    // rAF-throttled scroll sync to avoid excessive redraws
    let rafId: number | null = null;
    let pending = false;
    let lastX = 0;
    let lastY = 0;

    const flush = () => {
      rafId = null;
      pending = false;
      stage.position({ x: lastX, y: lastY });
      stage.batchDraw();
    };

    const requestFlush = () => {
      if (!pending) {
        pending = true;
        rafId = requestAnimationFrame(flush);
      }
    };

    const syncScroll = () => {
      lastX = -(container.scrollLeft || 0);
      lastY = -(container.scrollTop || 0);
      requestFlush();
    };

    // Initialize size and position
    resize();
    // Defer scroll sync to ensure layout
    requestAnimationFrame(syncScroll);

    container.addEventListener('scroll', syncScroll, { passive: true });
    window.addEventListener('resize', resize);

    return () => {
      container.removeEventListener('scroll', syncScroll);
      window.removeEventListener('resize', resize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [stageRef]);

  return { scrollContainerRef };
};
