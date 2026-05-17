import React, { useState, useEffect } from 'react';
import { orchestratorClient } from '../lib/api';
import styles from './Navigation.module.css';

export interface NavigationProps {
  currentScreen: 'studio' | 'vault' | 'config';
}

export const Navigation: React.FC<NavigationProps> = ({ currentScreen }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [workflowCount, setWorkflowCount] = useState(0);
  const [statusText, setStatusText] = useState('Connecting...');

  useEffect(() => {
    const pollStatus = async () => {
      try {
        const status = await orchestratorClient.getStatus();
        setIsOnline(true);
        setWorkflowCount(status.active_workflows || 0);
        setStatusText(status.active_workflows > 0 ? `${status.active_workflows} active` : 'Ready');
      } catch (error) {
        setIsOnline(false);
        setStatusText('Offline');
      }
    };

    // Poll only once on mount, then every 10s (not 5s) to reduce load
    pollStatus();
    const interval = setInterval(pollStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className={styles.navbar}>
      {/* Left: Brand + Tagline */}
      <div className={styles.leftSection}>
        <div className={styles.brand}>
          <span className={styles.logo}>🎲</span>
          <div className={styles.brandText}>
            <span className={styles.title}>MyTeamHub</span>
            <span className={styles.tagline}>Think • Create • Build</span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className={styles.navItems}>
          <a
            href="/studio"
            className={`${styles.navItem} ${currentScreen === 'studio' ? styles.active : ''}`}
            title="Studio - Collaborative development"
          >
            <span>Studio</span>
          </a>

          <a
            href="/vault"
            className={`${styles.navItem} ${currentScreen === 'vault' ? styles.active : ''}`}
            title="Vault - Cognitive memory"
          >
            <span>Vault</span>
          </a>

          <a
            href="/config"
            className={`${styles.navItem} ${currentScreen === 'config' ? styles.active : ''}`}
            title="Config - System settings"
          >
            <span>Settings</span>
          </a>
        </div>
      </div>

      {/* Right: System Status Indicator Only */}
      <div className={styles.rightSection}>
        {/* Status Indicator - Critical Element */}
        <div className={styles.status}>
          <div
            className={styles.statusDot}
            style={{
              backgroundColor: isOnline ? '#2EE59D' : '#FF5C7A',
            }}
            title={`Orchestrator: ${statusText}`}
          />
          <span className={styles.statusText}>{statusText}</span>
        </div>
      </div>
    </nav>
  );
};
