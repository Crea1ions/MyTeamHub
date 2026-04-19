import React, { useState } from 'react';
import styles from './SplitPaneLayout.module.css';

export interface SplitPaneLayoutProps {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
  onLeftResize?: (width: number) => void;
  onCenterResize?: (width: number) => void;
}

/**
 * 3-Column VSCode-like split pane layout
 * Responsive columns with minimum sizes
 */
export const SplitPaneLayout: React.FC<SplitPaneLayoutProps> = ({
  left,
  center,
  right,
  onLeftResize,
  onCenterResize,
}) => {
  const [leftWidth, setLeftWidth] = useState(280);
  const [centerWidth, setCenterWidth] = useState(500);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingCenter, setIsDraggingCenter] = useState(false);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);

  // Track container width for responsive behavior
  React.useEffect(() => {
    const handleResize = () => {
      const container = document.querySelector('[class*="container"]') as HTMLElement;
      if (container) {
        setContainerWidth(container.clientWidth);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(handleResize, 100);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  const handleMouseDown = (type: 'left' | 'center') => (e: React.MouseEvent) => {
    e.preventDefault();
    if (type === 'left') {
      setIsDraggingLeft(true);
    } else {
      setIsDraggingCenter(true);
    }
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingLeft && !isDraggingCenter) return;

      if (isDraggingLeft) {
        const newLeftWidth = Math.max(200, Math.min(500, e.clientX));
        setLeftWidth(newLeftWidth);
        onLeftResize?.(newLeftWidth);
      }

      if (isDraggingCenter) {
        const newCenterWidth = Math.max(300, Math.min(800, e.clientX - leftWidth - 4));
        setCenterWidth(newCenterWidth);
        onCenterResize?.(newCenterWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingCenter(false);
    };

    if (isDraggingLeft || isDraggingCenter) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingLeft, isDraggingCenter, leftWidth, centerWidth, onLeftResize, onCenterResize]);

  // Responsive sizing: on small screens, reduce column sizes proportionally
  const effectiveLeftWidth = Math.min(leftWidth, Math.max(150, containerWidth * 0.2));
  const effectiveCenterWidth = Math.min(centerWidth, Math.max(200, containerWidth * 0.3));
  const effectiveRightWidth = Math.max(200, containerWidth - effectiveLeftWidth - effectiveCenterWidth - 8);

  return (
    <div className={styles.container}>
      {/* Left Column */}
      <div className={styles.column} style={{ width: `${effectiveLeftWidth}px`, minWidth: '150px' }}>
        {left}
      </div>

      {/* Left Divider */}
      <div
        className={`${styles.divider} ${isDraggingLeft ? styles.active : ''}`}
        onMouseDown={handleMouseDown('left')}
      />

      {/* Center Column */}
      <div className={styles.column} style={{ width: `${effectiveCenterWidth}px`, minWidth: '200px' }}>
        {center}
      </div>

      {/* Center Divider */}
      <div
        className={`${styles.divider} ${isDraggingCenter ? styles.active : ''}`}
        onMouseDown={handleMouseDown('center')}
      />

      {/* Right Column */}
      <div className={styles.column} style={{ width: `${effectiveRightWidth}px`, minWidth: '200px', flex: 1 }}>
        {right}
      </div>
    </div>
  );
};
