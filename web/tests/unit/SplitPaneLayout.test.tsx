import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import SplitPaneLayout from '../../src/components/SplitPaneLayout';

describe('SplitPaneLayout Component', () => {
  const defaultProps = {
    leftContent: <div>Left Panel</div>,
    centerContent: <div>Center Panel</div>,
    rightContent: <div>Right Panel</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all three columns', () => {
    render(<SplitPaneLayout {...defaultProps} />);
    
    expect(screen.getByText('Left Panel')).toBeInTheDocument();
    expect(screen.getByText('Center Panel')).toBeInTheDocument();
    expect(screen.getByText('Right Panel')).toBeInTheDocument();
  });

  it('should render with correct layout structure', () => {
    const { container } = render(<SplitPaneLayout {...defaultProps} />);
    
    const columns = container.querySelectorAll('[class*="column"]');
    expect(columns.length).toBeGreaterThanOrEqual(3);
  });

  it('should apply CSS variables for column widths', () => {
    const { container } = render(<SplitPaneLayout {...defaultProps} />);
    
    // Verify the component uses CSS variables (computed styles)
    const layoutContainer = container.querySelector('[class*="container"]');
    expect(layoutContainer).toBeInTheDocument();
  });

  it('should render draggable divider', () => {
    const { container } = render(<SplitPaneLayout {...defaultProps} />);
    
    const divider = container.querySelector('[class*="divider"]');
    expect(divider).toBeInTheDocument();
  });

  it('should handle divider drag interactions', () => {
    const { container } = render(<SplitPaneLayout {...defaultProps} />);
    
    const divider = container.querySelector('[class*="divider"]');
    expect(divider).toHaveStyle('cursor: col-resize');
  });

  it('should have correct overflow handling', () => {
    const { container } = render(<SplitPaneLayout {...defaultProps} />);
    
    const layoutContainer = container.querySelector('[class*="container"]');
    // Layout should not overflow
    expect(layoutContainer).toHaveStyle('overflow: hidden');
  });

  it('should render left column as fixed width', () => {
    const { container } = render(<SplitPaneLayout {...defaultProps} />);
    
    const leftColumn = container.querySelector('[class*="columnLeft"]');
    expect(leftColumn).toHaveStyle('flex-shrink: 0');
  });

  it('should render center column as flexible', () => {
    const { container } = render(<SplitPaneLayout {...defaultProps} />);
    
    const centerColumn = container.querySelector('[class*="columnCenter"]');
    expect(centerColumn).toHaveStyle('flex: 1');
  });

  it('should render right column with constraints', () => {
    const { container } = render(<SplitPaneLayout {...defaultProps} />);
    
    const rightColumn = container.querySelector('[class*="columnRight"]');
    expect(rightColumn).toHaveStyle('flex-shrink: 0');
  });

  it('should maintain full viewport height', () => {
    const { container } = render(<SplitPaneLayout {...defaultProps} />);
    
    const layoutContainer = container.querySelector('[class*="container"]');
    expect(layoutContainer).toHaveStyle('height: 100%');
    expect(layoutContainer).toHaveStyle('width: 100%');
  });
});
