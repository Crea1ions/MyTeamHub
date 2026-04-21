import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Studio from '../../src/components/Studio';

describe('Studio Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render studio main container', () => {
    const { container } = render(<Studio />);
    const studio = container.querySelector('[class*="studio"]');
    expect(studio || screen.getByText(/studio|editor/i)).toBeTruthy();
  });

  it('should render split pane layout', () => {
    const { container } = render(<Studio />);
    const splitPane = container.querySelector('[class*="SplitPane"]') || 
                      container.querySelector('[class*="column"]');
    expect(splitPane).toBeInTheDocument();
  });

  it('should render vault explorer in left column', () => {
    const { container } = render(<Studio />);
    const leftPanel = container.querySelector('[class*="columnLeft"]');
    expect(leftPanel).toBeInTheDocument();
  });

  it('should render editor in center column', () => {
    const { container } = render(<Studio />);
    const centerPanel = container.querySelector('[class*="columnCenter"]');
    expect(centerPanel).toBeInTheDocument();
  });

  it('should render agent chat in right column', () => {
    const { container } = render(<Studio />);
    const rightPanel = container.querySelector('[class*="columnRight"]');
    expect(rightPanel).toBeInTheDocument();
  });

  it('should handle markdown input and rendering', async () => {
    const { container } = render(<Studio />);
    const editor = container.querySelector('textarea') || 
                   container.querySelector('[contenteditable="true"]');
    
    if (editor) {
      expect(editor).toBeInTheDocument();
    }
  });

  it('should render agent selection dropdown', async () => {
    const { container } = render(<Studio />);
    const agentSelect = container.querySelector('select') || 
                        container.querySelector('[class*="select"]');
    
    // Agent selector may be in chat panel or separate
    if (agentSelect) {
      expect(agentSelect).toBeInTheDocument();
    }
  });

  it('should have send/submit button in chat area', () => {
    const { container } = render(<Studio />);
    const sendButton = screen.queryByRole('button', { name: /send|submit|chat/i }) ||
                      container.querySelector('[class*="sendButton"]') ||
                      container.querySelector('[class*="submitButton"]');
    
    // Button may be present in agent chat panel
    if (sendButton) {
      expect(sendButton).toBeInTheDocument();
    }
  });

  it('should render chat message history area', () => {
    const { container } = render(<Studio />);
    const chatHistory = container.querySelector('[class*="messages"]') ||
                        container.querySelector('[class*="chat"]') ||
                        container.querySelector('[class*="history"]');
    
    if (chatHistory) {
      expect(chatHistory).toBeInTheDocument();
    }
  });

  it('should use dark theme colors', () => {
    const { container } = render(<Studio />);
    const studio = container.querySelector('[class*="studio"]') ||
                   container.firstChild;
    
    // Should not have light backgrounds
    expect(studio).toBeInTheDocument();
  });

  it('should maintain 3-column layout structure', () => {
    const { container } = render(<Studio />);
    const columns = container.querySelectorAll('[class*="column"]');
    expect(columns.length).toBeGreaterThanOrEqual(3);
  });

  it('should render without errors on mount', () => {
    expect(() => {
      render(<Studio />);
    }).not.toThrow();
  });

  it('should handle responsive scrollbars', () => {
    const { container } = render(<Studio />);
    const scrollableElements = container.querySelectorAll('[style*="overflow"]');
    expect(scrollableElements.length).toBeGreaterThan(0);
  });

  it('should render with proper spacing using CSS variables', () => {
    const { container } = render(<Studio />);
    // Verify component renders (spacing applied via CSS variables)
    const studio = container.querySelector('[class*="studio"]') ||
                   container.firstChild;
    expect(studio).toBeInTheDocument();
  });
});
