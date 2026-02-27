/**
 * Tests for Cross-Resource Validation components
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { ConflictCard } from '../ConflictCard';
import { ConflictList } from '../ConflictList';

import type { ResourceConflict } from '../types';

const mockConflict: ResourceConflict = {
  id: '1',
  type: 'ip_collision',
  severity: 'error',
  title: 'IP Address Collision',
  description: 'Two interfaces have the same IP address',
  conflictValue: '192.168.1.1',
  resources: [
    {
      type: 'interface',
      id: 'ether1',
      name: 'ether1',
      path: '/interface/ether1',
      value: '192.168.1.1',
    },
    {
      type: 'interface',
      id: 'bridge1',
      name: 'bridge1',
      path: '/interface/bridge1',
      value: '192.168.1.1',
    },
  ],
  resolutions: [
    {
      id: 'change-bridge',
      label: 'Change Bridge IP',
      description: 'Assign a different IP to bridge1',
      recommended: true,
      action: 'change_ip_bridge1',
    },
    {
      id: 'remove-ether',
      label: 'Remove Ether1 IP',
      description: 'Remove the IP from ether1',
      action: 'remove_ip_ether1',
      destructive: true,
    },
  ],
};

const mockWarningConflict: ResourceConflict = {
  id: '2',
  type: 'port_conflict',
  severity: 'warning',
  title: 'Port Conflict',
  description: 'Same port used by multiple services',
  conflictValue: '8080',
  resources: [],
  resolutions: [],
};

describe('ConflictCard', () => {
  it('renders conflict title and description', () => {
    render(<ConflictCard conflict={mockConflict} />);

    // Title appears in h3 and badge, so use heading role
    expect(screen.getByRole('heading', { name: 'IP Address Collision' })).toBeInTheDocument();
    expect(screen.getByText('Two interfaces have the same IP address')).toBeInTheDocument();
  });

  it('renders conflict value', () => {
    render(<ConflictCard conflict={mockConflict} />);

    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
  });

  it('shows conflict type badge', () => {
    render(<ConflictCard conflict={mockConflict} />);

    // Badge also shows "IP Address Collision" - at least 2 elements
    expect(screen.getAllByText('IP Address Collision').length).toBeGreaterThanOrEqual(1);
  });

  it('shows affected resources when expanded', () => {
    render(
      <ConflictCard
        conflict={mockConflict}
        isExpanded
      />
    );

    expect(screen.getByText('Affected Resources')).toBeInTheDocument();
    expect(screen.getByText('ether1')).toBeInTheDocument();
    expect(screen.getByText('bridge1')).toBeInTheDocument();
  });

  it('shows resolution options when expanded', () => {
    render(
      <ConflictCard
        conflict={mockConflict}
        isExpanded
      />
    );

    expect(screen.getByText('Resolution Options')).toBeInTheDocument();
    expect(screen.getByText('Change Bridge IP')).toBeInTheDocument();
    expect(screen.getByText('Remove Ether1 IP')).toBeInTheDocument();
  });

  it('shows recommended badge on resolution', () => {
    render(
      <ConflictCard
        conflict={mockConflict}
        isExpanded
      />
    );

    expect(screen.getByText('Recommended')).toBeInTheDocument();
  });

  it('shows destructive badge on resolution', () => {
    render(
      <ConflictCard
        conflict={mockConflict}
        isExpanded
      />
    );

    expect(screen.getByText('Destructive')).toBeInTheDocument();
  });

  it('calls onToggle when expand button is clicked', () => {
    const onToggle = vi.fn();
    render(
      <ConflictCard
        conflict={mockConflict}
        onToggle={onToggle}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /expand|collapse/i }));
    expect(onToggle).toHaveBeenCalled();
  });

  it('calls onSelectResolution when Apply button is clicked', () => {
    const onSelectResolution = vi.fn();
    render(
      <ConflictCard
        conflict={mockConflict}
        isExpanded
        onSelectResolution={onSelectResolution}
      />
    );

    const applyButtons = screen.getAllByRole('button', { name: 'Apply' });
    fireEvent.click(applyButtons[0]);
    expect(onSelectResolution).toHaveBeenCalledWith('1', 'change-bridge');
  });
});

describe('ConflictList', () => {
  const conflicts: ResourceConflict[] = [mockConflict, mockWarningConflict];

  it('renders all conflicts', () => {
    render(<ConflictList conflicts={conflicts} />);

    // Use heading role to find titles (not badges)
    expect(screen.getByRole('heading', { name: 'IP Address Collision' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Port Conflict' })).toBeInTheDocument();
  });

  it('shows conflict counts in summary', () => {
    render(
      <ConflictList
        conflicts={conflicts}
        showSummary
      />
    );

    expect(screen.getByText(/1 error/)).toBeInTheDocument();
    expect(screen.getByText(/1 warning/)).toBeInTheDocument();
  });

  it('shows empty state when no conflicts', () => {
    render(<ConflictList conflicts={[]} />);

    expect(screen.getByText('All Clear')).toBeInTheDocument();
    expect(screen.getByText('No conflicts detected')).toBeInTheDocument();
  });

  it('can filter by severity', () => {
    render(
      <ConflictList
        conflicts={conflicts}
        showSummary
      />
    );

    // Click "Errors" filter button
    fireEvent.click(screen.getByRole('button', { name: 'Errors' }));

    // Should only show error conflict - use heading to find title
    expect(screen.getByRole('heading', { name: 'IP Address Collision' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Port Conflict' })).not.toBeInTheDocument();
  });

  it('can expand all conflicts', () => {
    render(
      <ConflictList
        conflicts={[mockConflict]}
        showSummary
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Expand All' }));

    // Should show expanded content
    expect(screen.getByText('Affected Resources')).toBeInTheDocument();
  });

  it('can collapse all conflicts', () => {
    render(
      <ConflictList
        conflicts={[mockConflict]}
        showSummary
      />
    );

    // First expand
    fireEvent.click(screen.getByRole('button', { name: 'Expand All' }));
    expect(screen.getByText('Affected Resources')).toBeInTheDocument();

    // Then collapse
    fireEvent.click(screen.getByRole('button', { name: 'Collapse All' }));
    expect(screen.queryByText('Affected Resources')).not.toBeInTheDocument();
  });

  it('shows custom title', () => {
    render(
      <ConflictList
        conflicts={conflicts}
        title="Validation Issues"
        showSummary
      />
    );

    expect(screen.getByText('Validation Issues')).toBeInTheDocument();
  });

  it('passes resolution handler to cards', () => {
    const onSelectResolution = vi.fn();
    render(
      <ConflictList
        conflicts={[mockConflict]}
        onSelectResolution={onSelectResolution}
        showSummary
      />
    );

    // Expand the card first - use "Expand All" button
    fireEvent.click(screen.getByRole('button', { name: 'Expand All' }));

    // Click apply
    const applyButtons = screen.getAllByRole('button', { name: 'Apply' });
    fireEvent.click(applyButtons[0]);
    expect(onSelectResolution).toHaveBeenCalledWith('1', 'change-bridge');
  });
});
