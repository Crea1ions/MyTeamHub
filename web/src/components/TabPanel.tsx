import React, { useState } from 'react';
import { X } from 'lucide-react';
import styles from './TabPanel.module.css';

export interface Tab {
  id: string;
  label: string;
  badge?: number; // optional count badge
  content: React.ReactNode;
}

export interface TabPanelProps {
  tabs: Tab[];
  defaultTab?: string;
  onClose?: () => void;
}

/**
 * Compact tab panel for secondary content sections
 * Used in ContentViewer for Links, Tags, Metadata
 */
export const TabPanel: React.FC<TabPanelProps> = ({
  tabs,
  defaultTab = tabs[0]?.id || '',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const activeTabObj = tabs.find(t => t.id === activeTab);

  return (
    <div className={styles.container}>
      {/* Tab Headers */}
      <div className={styles.tabBar}>
        <div className={styles.tabs}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
            >
              <span className={styles.label}>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={styles.badge}>{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {onClose && (
          <button className={styles.closeBtn} onClick={onClose} title="Close panel">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className={styles.content}>
        {activeTabObj ? activeTabObj.content : null}
      </div>
    </div>
  );
};
