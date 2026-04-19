import React, { useState } from 'react';
import { SplitPaneLayout } from './SplitPaneLayout';
import { APIConfig } from './APIConfig';
import { AgentsConfig } from './AgentsConfig';
import { SystemStatus } from './SystemStatus';
import type { APIConfig as APIConfigType, AgentConfig, SystemStatus as SystemStatusType, VaultObservability, OpenClawStatus } from '../types/index';

interface ConfigProps {}

export const Config: React.FC<ConfigProps> = () => {
  const [apiConfig, setApiConfig] = useState<APIConfigType>({
    mistralApiKey: 'sk-...',
    openaiApiKey: '',
    vaultPath: '/home/user/.vault',
  });

  const [agents, setAgents] = useState<AgentConfig[]>([
    {
      id: 'agent-1',
      name: 'Collaborateur',
      prompt: 'You are a collaborative assistant helping to develop ideas and solve problems.',
      enabled: true,
    },
    {
      id: 'agent-2',
      name: 'Analyste critique',
      prompt: 'You are a critical analyst identifying problems, gaps, and potential issues.',
      enabled: true,
    },
    {
      id: 'agent-3',
      name: 'Explorateur',
      prompt: 'You are an explorer discovering new connections and possibilities.',
      enabled: true,
    },
  ]);

  const [systemStatus, setSystemStatus] = useState<SystemStatusType>({
    orchestrator: 'ONLINE',
    llm: 'CONNECTED',
    vault: 'SYNC_OK',
    agentsActive: 3,
  });

  const [vaultObs, setVaultObs] = useState<VaultObservability>({
    logging: true,
    tracing: false,
    audit: false,
  });

  const [openClaw, setOpenClaw] = useState<OpenClawStatus>({
    mode: 'READ_ONLY',
    status: 'CONNECTED',
    endpoint: 'https://api.openclaw.ai/v1',
  });

  return (
    <SplitPaneLayout
      left={
        <APIConfig
          config={apiConfig}
          onConfigChange={setApiConfig}
        />
      }
      center={
        <AgentsConfig
          agents={agents}
          onAgentsChange={setAgents}
        />
      }
      right={
        <SystemStatus
          status={systemStatus}
          vaultObs={vaultObs}
          openClaw={openClaw}
          onVaultObsChange={setVaultObs}
        />
      }
    />
  );
};

export default Config;
