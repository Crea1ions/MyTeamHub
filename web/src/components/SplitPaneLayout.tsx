import React, { useState, useRef, useEffect } from 'react';
import styles from './SplitPaneLayout.module.css';

export interface SplitPaneLayoutProps {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
  onLeftResize?: (width: number) => void;
  onCenterResize?: (width: number) => void;
  onRightResize?: (width: number) => void;
}

/**
 * VSCode-style IDE layout with 3 columns:
 * - Left: FIXED 280px (navigation stable)
 * - Center: FLEX responsive (fills available space, adapts to right column changes)
 * - Right: RESIZABLE max 400px (user controlled, graph adapts)
 */
export const SplitPaneLayout: React.FC<SplitPaneLayoutProps> = ({
  left,
  center,
  right,
  onLeftResize,
  onCenterResize,
  onRightResize,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rightWidth, setRightWidth] = useState(() => {
    const saved = localStorage.getItem('split-pane-right-width');
    return saved ? parseInt(saved, 10) : 350;
  });
  
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);
  const dragStartXRef = useRef(0);
  const dragStartRightWidthRef = useRef(0);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  // Track container width for responsive
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle mouse down on right divider
  const handleRightDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDraggingRight(true);
    dragStartXRef.current = e.clientX;
    dragStartRightWidthRef.current = rightWidth;
    
    document.body.classList.add('dragging-split-pane');
  };

  // Handle mouse move - update right column width
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRight) return;

      const delta = dragStartXRef.current - e.clientX; // Negative = drag left (expand right), positive = drag right (shrink right)
      const minRightWidth = 200;
      const maxRightWidth = Math.min(400, containerWidth * 0.4); // Max 400px or 40% of container

      const newRightWidth = Math.max(
        minRightWidth,
        Math.min(maxRightWidth, dragStartRightWidthRef.current + delta)
      );
      
      setRightWidth(newRightWidth);
      localStorage.setItem('split-pane-right-width', newRightWidth.toString());
      onRightResize?.(newRightWidth);
    };

    const handleMouseUp = () => {
      setIsDraggingRight(false);
      document.body.classList.remove('dragging-split-pane');
    };

    if (isDraggingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingRight, containerWidth, onRightResize]);

  const leftWidth = 280; // Fixed
  const centerWidth = containerWidth - leftWidth - rightWidth - 8; // 8px for divider

  return (
    <div className={styles.container} ref={containerRef}>
      {/* Left Column - FIXED navigation */}
      <div 
        className={styles.columnLeft}
        style={{ width: `${leftWidth}px` }}
      >
        {left}
      </div>

      {/* Center Column - FLEX responsive graph */}
      <div 
        className={styles.columnCenter}
        style={{ 
          width: `${Math.max(300, centerWidth)}px`,
        }}
      >
        {center}
      </div>

      {/* Right Divider - draggable */}
      <div
        className={`${styles.dividerRight} ${isDraggingRight ? styles.active : ''}`}
        onMouseDown={handleRightDividerMouseDown}
        role="separator"
        aria-orientation="vertical"
        title="Drag to resize content panel"
      />

      {/* Right Column - RESIZABLE content */}
      <div 
        className={styles.columnRight}
        style={{ 
          width: `${rightWidth}px`,
          minWidth: '200px',
          maxWidth: '400px',
        }}
      >
        {right}
      </div>
    </div>
  );
};
