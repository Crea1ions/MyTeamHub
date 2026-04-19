import React from 'react';
import { Navigation } from './Navigation';
import styles from './ScreenLayout.module.css';

export interface ScreenLayoutProps {
  screen: 'studio' | 'vault' | 'config';
  children: React.ReactNode;
}

export const ScreenLayout: React.FC<ScreenLayoutProps> = ({ screen, children }) => {
  return (
    <div className={styles.container}>
      <Navigation currentScreen={screen} />
      <div className={styles.content}>{children}</div>
    </div>
  );
};
