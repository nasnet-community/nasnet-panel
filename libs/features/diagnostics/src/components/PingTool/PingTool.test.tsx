/**
 * Component tests for PingTool
 *
 * Simplified integration tests focusing on:
 * - Platform detection
 * - Basic rendering
 * - Form structure  */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { PingTool } from './PingTool';
import { PingToolDesktop } from './PingToolDesktop';
import { PingToolMobile } from './PingToolMobile';

// Mock usePlatform hook
vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: vi.fn(() => 'desktop'),
}));

const mockUsePlatform = vi.mocked(
  await import('@nasnet/ui/layouts').then((m) => m.usePlatform)
);

describe('PingTool Platform Detection', () => {
  const defaultProps = {
    routerId: 'test-router-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render desktop presenter on desktop platform', () => {
    mockUsePlatform.mockReturnValue('desktop');

    render(
      <MockedProvider mocks={[]}>
        <PingTool {...defaultProps} />
      </MockedProvider>
    );

    // Desktop has "Ping Diagnostic Tool" title
    expect(screen.getByText('Ping Diagnostic Tool')).toBeInTheDocument();

    // Desktop has "Advanced Options" section
    expect(screen.getByText('Advanced Options')).toBeInTheDocument();
  });

  it('should render mobile presenter on mobile platform', () => {
    mockUsePlatform.mockReturnValue('mobile');

    render(
      <MockedProvider mocks={[]}>
        <PingTool {...defaultProps} />
      </MockedProvider>
    );

    // Mobile has "Ping Diagnostic" title (no "Tool")
    expect(screen.getByText('Ping Diagnostic')).toBeInTheDocument();

    // Mobile doesn't have "Advanced Options" text
    expect(screen.queryByText('Advanced Options')).not.toBeInTheDocument();
  });

  it('should render desktop presenter on tablet platform', () => {
    mockUsePlatform.mockReturnValue('tablet');

    render(
      <MockedProvider mocks={[]}>
        <PingTool {...defaultProps} />
      </MockedProvider>
    );

    // Tablet uses desktop presenter
    expect(screen.getByText('Ping Diagnostic Tool')).toBeInTheDocument();
  });
});

describe('PingToolDesktop Rendering', () => {
  const defaultProps = {
    routerId: 'test-router-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form with required fields', () => {
    render(
      <MockedProvider mocks={[]}>
        <PingToolDesktop {...defaultProps} />
      </MockedProvider>
    );

    // Target field (required)
    expect(screen.getByLabelText(/target/i)).toBeInTheDocument();

    // Start button
    expect(screen.getByRole('button', { name: /start ping/i })).toBeInTheDocument();
  });

  it('should render advanced fields', () => {
    render(
      <MockedProvider mocks={[]}>
        <PingToolDesktop {...defaultProps} />
      </MockedProvider>
    );

    // Advanced fields
    expect(screen.getByLabelText(/count/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/size \(bytes\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/timeout \(ms\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/source interface/i)).toBeInTheDocument();
  });

  it('should have correct default values', () => {
    render(
      <MockedProvider mocks={[]}>
        <PingToolDesktop {...defaultProps} />
      </MockedProvider>
    );

    expect(screen.getByLabelText(/count/i)).toHaveValue(10);
    expect(screen.getByLabelText(/size \(bytes\)/i)).toHaveValue(56);
    expect(screen.getByLabelText(/timeout \(ms\)/i)).toHaveValue(1000);
  });

  it('should render results section', () => {
    render(
      <MockedProvider mocks={[]}>
        <PingToolDesktop {...defaultProps} />
      </MockedProvider>
    );

    // Results card should be visible
    expect(screen.getByText(/^Results/)).toBeInTheDocument();
  });

  it('should show empty state when no results', () => {
    render(
      <MockedProvider mocks={[]}>
        <PingToolDesktop {...defaultProps} />
      </MockedProvider>
    );

    expect(
      screen.getByText(/no results yet.*start a ping test/i)
    ).toBeInTheDocument();
  });
});

describe('PingToolMobile Rendering', () => {
  const defaultProps = {
    routerId: 'test-router-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render compact form', () => {
    render(
      <MockedProvider mocks={[]}>
        <PingToolMobile {...defaultProps} />
      </MockedProvider>
    );

    // Target field
    expect(screen.getByLabelText(/target/i)).toBeInTheDocument();

    // Compact advanced fields
    expect(screen.getByLabelText(/count/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/timeout \(ms\)/i)).toBeInTheDocument();

    // Start button
    expect(screen.getByRole('button', { name: /start ping/i })).toBeInTheDocument();
  });

  it('should have mobile-specific title', () => {
    render(
      <MockedProvider mocks={[]}>
        <PingToolMobile {...defaultProps} />
      </MockedProvider>
    );

    expect(screen.getByText('Ping Diagnostic')).toBeInTheDocument();
  });

  it('should not show results button initially', () => {
    render(
      <MockedProvider mocks={[]}>
        <PingToolMobile {...defaultProps} />
      </MockedProvider>
    );

    // No "View Results" button when results are empty
    expect(screen.queryByRole('button', { name: /view results/i })).not.toBeInTheDocument();
  });

  it('should not show size and source interface fields', () => {
    render(
      <MockedProvider mocks={[]}>
        <PingToolMobile {...defaultProps} />
      </MockedProvider>
    );

    // Mobile doesn't show Size or Source Interface
    expect(screen.queryByLabelText(/size \(bytes\)/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/source interface/i)).not.toBeInTheDocument();
  });
});

describe('Accessibility', () => {
  const defaultProps = {
    routerId: 'test-router-123',
  };

  it('should have proper form labels on desktop', () => {
    render(
      <MockedProvider mocks={[]}>
        <PingToolDesktop {...defaultProps} />
      </MockedProvider>
    );

    // All form fields should have associated labels
    const targetInput = screen.getByLabelText(/target/i);
    expect(targetInput).toHaveAccessibleName();

    const countInput = screen.getByLabelText(/count/i);
    expect(countInput).toHaveAccessibleName();
  });

  it('should have proper button labels', () => {
    render(
      <MockedProvider mocks={[]}>
        <PingToolDesktop {...defaultProps} />
      </MockedProvider>
    );

    const startButton = screen.getByRole('button', { name: /start ping/i });
    expect(startButton).toHaveAccessibleName();
  });

  it('should have proper ARIA attributes', () => {
    render(
      <MockedProvider mocks={[]}>
        <PingToolDesktop {...defaultProps} />
      </MockedProvider>
    );

    // Target field should have aria-describedby for help text
    const targetInput = screen.getByLabelText(/target/i);
    expect(targetInput).toHaveAttribute('aria-describedby', 'ping-target-description');
  });
});
