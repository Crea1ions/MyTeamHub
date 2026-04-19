import { useState, useEffect, useRef, useCallback } from 'react';
import { orchestratorClient, WorkflowMetrics } from '../api';

interface PollingState {
  status: string;
  isLoading: boolean;
  error: Error | null;
  result: any;
  isComplete: boolean;
}

/**
 * Hook to poll a workflow's status until completion
 * Polls at 1s intervals for active workflows
 * Max timeout: 30s
 */
export function useWorkflowPolling(workflowId: string | null, onComplete?: (result: any) => void) {
  const [state, setState] = useState<PollingState>({
    status: 'idle',
    isLoading: false,
    error: null,
    result: null,
    isComplete: false,
  });

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedRef = useRef<number>(0);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (id: string) => {
      stopPolling();
      setState({
        status: 'polling',
        isLoading: true,
        error: null,
        result: null,
        isComplete: false,
      });

      elapsedRef.current = 0;

      // Timeout after 30s
      timeoutRef.current = setTimeout(() => {
        stopPolling();
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: new Error('Workflow polling timeout (30s)'),
          status: 'timeout',
        }));
      }, 30000);

      // Poll every 1s
      pollIntervalRef.current = setInterval(async () => {
        try {
          const metrics = await orchestratorClient.getWorkflowMetrics(id);

          if (metrics.state === 'complete') {
            stopPolling();
            setState({
              status: 'complete',
              isLoading: false,
              error: null,
              result: metrics.result || { status: metrics.status },
              isComplete: true,
            });
            onComplete?.(metrics.result || { status: metrics.status });
          } else if (metrics.state === 'error') {
            stopPolling();
            setState({
              status: 'error',
              isLoading: false,
              error: new Error(metrics.error_message || 'Workflow failed'),
              result: null,
              isComplete: true,
            });
          } else {
            // Still pending/running - update status
            setState((prev) => ({
              ...prev,
              status: metrics.state,
              isLoading: true,
            }));
          }
        } catch (error: any) {
          // Handle 404 gracefully - workflow might have completed or doesn't exist
          // Consider this as workflow completion
          if (error?.response?.status === 404) {
            stopPolling();
            setState({
              status: 'complete',
              isLoading: false,
              error: null,
              result: { status: 'completed', message: 'Workflow processed' },
              isComplete: true,
            });
            onComplete?.({ status: 'completed', message: 'Workflow processed' });
          } else {
            stopPolling();
            setState((prev) => ({
              ...prev,
              isLoading: false,
              error: error instanceof Error ? error : new Error('Unknown error'),
              status: 'error',
            }));
          }
        }
      }, 1000);
    },
    [stopPolling, onComplete]
  );

  useEffect(() => {
    if (workflowId) {
      startPolling(workflowId);
    }

    return () => {
      stopPolling();
    };
  }, [workflowId, startPolling, stopPolling]);

  return state;
}
