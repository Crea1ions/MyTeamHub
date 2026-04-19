import React, { useState, useEffect } from 'react';
import { Settings, Zap, BarChart3 } from 'lucide-react';
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

    // Poll every 5s
    pollStatus();
    const interval = setInterval(pollStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className={styles.navbar}>
      <div className={styles.brand}>
        <span className={styles.logo}>🧠</span>
        <span className={styles.title}>MyTeamHub</span>
      </div>

      <div className={styles.navItems}>
        <a
          href="/studio"
          className={`${styles.navItem} ${currentScreen === 'studio' ? styles.active : ''}`}
          title="Studio - Collaborative development"
        >
          <Zap size={16} />
          <span>Studio</span>
        </a>

        <a
          href="/vault"
          className={`${styles.navItem} ${currentScreen === 'vault' ? styles.active : ''}`}
          title="Vault - Cognitive memory"
        >
          <BarChart3 size={16} />
          <span>Vault</span>
        </a>

        <a
          href="/config"
          className={`${styles.navItem} ${currentScreen === 'config' ? styles.active : ''}`}
          title="Config - System settings"
        >
          <Settings size={16} />
          <span>Settings</span>
        </a>
      </div>

      <div className={styles.status}>
        <div
          className={styles.statusDot}
          style={{
            backgroundColor: isOnline ? '#2EE59D' : '#FF5C7A',
            animation: isOnline ? 'pulse 2s infinite' : 'none',
          }}
          title={`Orchestrator: ${statusText}`}
        />
        <span title={`${workflowCount} active workflow${workflowCount !== 1 ? 's' : ''}`}>
          {statusText}
        </span>
      </div>
    </nav>
  );
};
