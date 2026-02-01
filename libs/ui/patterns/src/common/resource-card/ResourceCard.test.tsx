/**
 * ResourceCard Tests
 *
 * Unit tests for the ResourceCard pattern component.
 * Tests both the headless hook and the presenters.
 */

import { render, screen, fireEvent , renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { ResourceCard } from './ResourceCard';
import { ResourceCardDesktop } from './ResourceCard.Desktop';
import { ResourceCardMobile } from './ResourceCard.Mobile';
import { useResourceCard } from './useResourceCard';

import type { BaseResource, ResourceAction } from './types';

// Mock the usePlatform hook
vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: vi.fn(() => 'desktop'),
}));

// Test fixtures
const mockResource: BaseResource = {
  id: '1',
  name: 'Test Resource',
  description: 'A test resource description',
  runtime: {
    status: 'online',
  },
};

const mockActions: ResourceAction[] = [
  { id: 'primary', label: 'Connect', onClick: vi.fn() },
  { id: 'secondary', label: 'Configure', onClick: vi.fn() },
  { id: 'delete', label: 'Delete', onClick: vi.fn(), variant: 'destructive' },
];

describe('useResourceCard', () => {
  it('returns correct status for online resource', () => {
    const { result } = renderHook(() =>
      useResourceCard({
        resource: mockResource,
      })
    );

    expect(result.current.status).toBe('online');
    expect(result.current.isOnline).toBe(true);
    expect(result.current.statusLabel).toBe('Online');
    expect(result.current.statusColor).toBe('success');
  });

  it('returns correct status for offline resource', () => {
    const offlineResource = {
      ...mockResource,
      runtime: { status: 'offline' as const },
    };

    const { result } = renderHook(() =>
      useResourceCard({
        resource: offlineResource,
      })
    );

    expect(result.current.status).toBe('offline');
    expect(result.current.isOnline).toBe(false);
    expect(result.current.statusLabel).toBe('Offline');
    expect(result.current.statusColor).toBe('muted');
  });

  it('returns unknown status when runtime is missing', () => {
    const noRuntimeResource = {
      id: '1',
      name: 'No Runtime',
    };

    const { result } = renderHook(() =>
      useResourceCard({
        resource: noRuntimeResource,
      })
    );

    expect(result.current.status).toBe('unknown');
    expect(result.current.isOnline).toBe(false);
    expect(result.current.statusLabel).toBe('Unknown');
  });

  it('correctly separates primary and secondary actions', () => {
    const { result } = renderHook(() =>
      useResourceCard({
        resource: mockResource,
        actions: mockActions,
      })
    );

    expect(result.current.primaryAction).toEqual(mockActions[0]);
    expect(result.current.secondaryActions).toHaveLength(2);
    expect(result.current.hasActions).toBe(true);
  });

  it('calls onToggle when handleToggle is invoked', () => {
    const onToggle = vi.fn();
    const { result } = renderHook(() =>
      useResourceCard({
        resource: mockResource,
        onToggle,
      })
    );

    result.current.handleToggle();
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('calls primary action onClick when handlePrimaryAction is invoked', () => {
    const onClick = vi.fn();
    const actions = [{ id: 'test', label: 'Test', onClick }];

    const { result } = renderHook(() =>
      useResourceCard({
        resource: mockResource,
        actions,
      })
    );

    result.current.handlePrimaryAction();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call disabled action', () => {
    const onClick = vi.fn();
    const actions = [{ id: 'test', label: 'Test', onClick, disabled: true }];

    const { result } = renderHook(() =>
      useResourceCard({
        resource: mockResource,
        actions,
      })
    );

    result.current.handlePrimaryAction();
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('ResourceCardMobile', () => {
  it('renders resource name', () => {
    render(<ResourceCardMobile resource={mockResource} />);
    expect(screen.getByText('Test Resource')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    render(<ResourceCardMobile resource={mockResource} />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<ResourceCardMobile resource={mockResource} />);
    expect(screen.getByText('A test resource description')).toBeInTheDocument();
  });

  it('renders primary action button', () => {
    render(<ResourceCardMobile resource={mockResource} actions={mockActions} />);
    expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument();
  });

  it('calls primary action onClick when button is clicked', () => {
    const onClick = vi.fn();
    const actions = [{ id: 'test', label: 'Test', onClick }];

    render(<ResourceCardMobile resource={mockResource} actions={actions} />);
    fireEvent.click(screen.getByRole('button', { name: 'Test' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('has accessible aria-label', () => {
    render(<ResourceCardMobile resource={mockResource} />);
    expect(
      screen.getByRole('article', { name: 'Test Resource - Online' })
    ).toBeInTheDocument();
  });
});

describe('ResourceCardDesktop', () => {
  it('renders resource name', () => {
    render(<ResourceCardDesktop resource={mockResource} />);
    expect(screen.getByText('Test Resource')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    render(<ResourceCardDesktop resource={mockResource} />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<ResourceCardDesktop resource={mockResource} />);
    expect(screen.getByText('A test resource description')).toBeInTheDocument();
  });

  it('renders primary action button', () => {
    render(<ResourceCardDesktop resource={mockResource} actions={mockActions} />);
    expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument();
  });

  it('renders more actions button when secondary actions exist', () => {
    render(<ResourceCardDesktop resource={mockResource} actions={mockActions} />);
    expect(screen.getByRole('button', { name: 'More actions' })).toBeInTheDocument();
  });

  it('has accessible aria-label', () => {
    render(<ResourceCardDesktop resource={mockResource} />);
    expect(
      screen.getByRole('article', { name: 'Test Resource - Online' })
    ).toBeInTheDocument();
  });
});

describe('ResourceCard (auto-detect)', () => {
  it('renders without crashing', () => {
    render(<ResourceCard resource={mockResource} />);
    expect(screen.getByText('Test Resource')).toBeInTheDocument();
  });
});
