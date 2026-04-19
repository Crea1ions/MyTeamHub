import React from 'react';
import { CheckCircle, AlertCircle, Activity, Database, Zap } from 'lucide-react';
import type { SystemStatus, VaultObservability, OpenClawStatus } from '../types/index';
import styles from './SystemStatus.module.css';

export interface SystemStatusProps {
  status: SystemStatus;
  vaultObs: VaultObservability;
  openClaw: OpenClawStatus;
  onVaultObsChange: (obs: VaultObservability) => void;
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const isOnline = status === 'ONLINE' || status === 'CONNECTED' || status === 'SYNC_OK';
  const color = isOnline ? '#2ee59d' : '#ff5c7a';
  const icon = isOnline ? <CheckCircle size={14} /> : <AlertCircle size={14} />;

  return (
    <div className={styles.badge} style={{ borderColor: color, color }}>
      {icon}
      <span>{status}</span>
    </div>
  );
};

export const SystemStatus: React.FC<SystemStatusProps> = ({
  status,
  vaultObs,
  openClaw,
  onVaultObsChange,
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>System Status</h2>
      </div>

      <div className={styles.section}>
        <h3>
          <Activity size={14} />
          Orchestrator
        </h3>
        <StatusBadge status={status.orchestrator} />
        <p className={styles.detail}>Core runtime system</p>
      </div>

      <div className={styles.section}>
        <h3>
          <Zap size={14} />
          LLM
        </h3>
        <StatusBadge status={status.llm} />
        <p className={styles.detail}>API connection status</p>
      </div>

      <div className={styles.section}>
        <h3>
          <Database size={14} />
          Vault
        </h3>
        <StatusBadge status={status.vault} />
        <p className={styles.detail}>Memory synchronization</p>
      </div>

      <div className={styles.section}>
        <h3>Agents</h3>
        <div className={styles.agentCount}>{status.agentsActive} active</div>
        <p className={styles.detail}>Running agent instances</p>
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
        <h3>Vault Observability</h3>
        <div className={styles.toggleGroup}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={vaultObs.logging}
              onChange={(e) =>
                onVaultObsChange({ ...vaultObs, logging: e.target.checked })
              }
            />
            <span>Logging</span>
          </label>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={vaultObs.tracing}
              onChange={(e) =>
                onVaultObsChange({ ...vaultObs, tracing: e.target.checked })
              }
            />
            <span>Tracing</span>
          </label>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={vaultObs.audit}
              onChange={(e) =>
                onVaultObsChange({ ...vaultObs, audit: e.target.checked })
              }
            />
            <span>Audit</span>
          </label>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
        <h3>OpenClaw</h3>
        <div className={styles.openClawInfo}>
          <div className={styles.row}>
            <span className={styles.label}>Mode:</span>
            <span className={styles.value}>{openClaw.mode}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Status:</span>
            <span className={styles.value} style={{
              color: openClaw.status === 'CONNECTED' ? '#2ee59d' : '#ff5c7a'
            }}>
              {openClaw.status}
            </span>
          </div>
          {openClaw.endpoint && (
            <div className={styles.row}>
              <span className={styles.label}>Endpoint:</span>
              <span className={styles.value} style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                {openClaw.endpoint}
              </span>
            </div>
          )}
        </div>
        <p className={styles.detail}>Read-only external intelligence layer</p>
      </div>

      <div className={styles.footer}>
        <span className={styles.hint}>All systems operational</span>
      </div>
    </div>
  );
};
