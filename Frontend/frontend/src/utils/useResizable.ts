// ─────────────────────────────────────────────────────────────────────────────
// utils/useResizable.ts
//
// A React hook that lets users drag a vertical divider to resize two side-by-side
// panels expressed as flex percentages.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef } from 'react';

interface ResizableOptions {
  /** Initial width percentage for the left panel (0–100). Default 60. */
  initialLeft?: number;
  /** Minimum left panel width as a percentage. Default 25. */
  minLeft?: number;
  /** Maximum left panel width as a percentage. Default 80. */
  maxLeft?: number;
}

export function useResizable(options: ResizableOptions = {}) {
  const {
    initialLeft = 60,
    minLeft     = 25,
    maxLeft     = 80,
  } = options;

  const [leftPct, setLeftPct] = useState(initialLeft);
  const dragging              = useRef(false);
  const containerRef          = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const raw  = ((ev.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(maxLeft, Math.max(minLeft, raw)));
    };

    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',  onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  }, [minLeft, maxLeft]);

  return { leftPct, containerRef, onMouseDown };
}
