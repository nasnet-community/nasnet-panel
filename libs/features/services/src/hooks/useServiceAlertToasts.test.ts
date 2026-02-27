import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useServiceAlertToasts, type UseServiceAlertToastsProps } from './useServiceAlertToasts';

// Mock the dependencies
vi.mock('@nasnet/api-client/queries', () => ({
  useServiceAlertSubscription: vi.fn(),
}));

vi.mock('@nasnet/state/stores', () => ({
  useNotificationStore: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

import { useServiceAlertSubscription } from '@nasnet/api-client/queries';
import { useNotificationStore } from '@nasnet/state/stores';

const mockUseServiceAlertSubscription = useServiceAlertSubscription as any;
const mockUseNotificationStore = useNotificationStore as any;

describe('useServiceAlertToasts', () => {
  let mockAddNotification: any;

  beforeEach(() => {
    mockAddNotification = vi.fn();
    mockUseNotificationStore.mockReturnValue({
      addNotification: mockAddNotification,
    });
    mockUseServiceAlertSubscription.mockReturnValue({
      alertEvent: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize without errors', () => {
    const { result } = renderHook(() => useServiceAlertToasts());
    expect(result).toBeDefined();
  });

  it('should not call addNotification when enabled=false', () => {
    mockUseServiceAlertSubscription.mockReturnValue({
      alertEvent: {
        alert: {
          id: 'alert-1',
          title: 'Test Alert',
          message: 'Test message',
          severity: 'INFO',
          deviceId: 'device-1',
          data: null,
        },
        action: 'CREATED',
      },
    });

    renderHook(() => useServiceAlertToasts({ enabled: false }));

    expect(mockAddNotification).not.toHaveBeenCalled();
  });

  it('should deduplicate alerts by ID', () => {
    const alertEvent = {
      alert: {
        id: 'alert-1',
        title: 'Test Alert',
        message: 'Test message',
        severity: 'INFO' as const,
        deviceId: 'device-1',
        data: null,
      },
      action: 'CREATED' as const,
    };

    // First render with alert
    const { rerender } = renderHook(
      ({ props }: { props: UseServiceAlertToastsProps }) => useServiceAlertToasts(props),
      { initialProps: { props: {} } }
    );

    mockUseServiceAlertSubscription.mockReturnValue({ alertEvent });

    rerender({ props: {} });

    expect(mockAddNotification).toHaveBeenCalledTimes(1);

    // Second render with same alert should not call addNotification again
    rerender({ props: {} });

    expect(mockAddNotification).toHaveBeenCalledTimes(1);
  });

  it('should ignore non-CREATED alert actions', () => {
    mockUseServiceAlertSubscription.mockReturnValue({
      alertEvent: {
        alert: {
          id: 'alert-1',
          title: 'Test Alert',
          message: 'Test message',
          severity: 'INFO',
          deviceId: 'device-1',
          data: null,
        },
        action: 'UPDATED',
      },
    });

    renderHook(() => useServiceAlertToasts({ enabled: true }));

    expect(mockAddNotification).not.toHaveBeenCalled();
  });

  it('should call onToastShown callback when provided', () => {
    const onToastShown = vi.fn();

    mockUseServiceAlertSubscription.mockReturnValue({
      alertEvent: {
        alert: {
          id: 'alert-1',
          title: 'Test Alert',
          message: 'Test message',
          severity: 'WARNING' as const,
          deviceId: 'device-1',
          data: null,
        },
        action: 'CREATED' as const,
      },
    });

    renderHook(() => useServiceAlertToasts({ enabled: true, onToastShown }));

    expect(onToastShown).toHaveBeenCalledWith('alert-1', 'WARNING');
  });

  it('should include navigation action for CRITICAL alerts', () => {
    const onNavigateToService = vi.fn();

    mockUseServiceAlertSubscription.mockReturnValue({
      alertEvent: {
        alert: {
          id: 'alert-1',
          title: 'Critical Alert',
          message: 'Critical message',
          severity: 'CRITICAL' as const,
          deviceId: 'device-1',
          data: { instanceId: 'instance-1' },
        },
        action: 'CREATED' as const,
      },
    });

    renderHook(() => useServiceAlertToasts({ enabled: true, onNavigateToService }));

    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        action: expect.objectContaining({
          label: 'services.alerts.viewService',
        }),
      })
    );
  });

  it('should not include action for non-CRITICAL alerts', () => {
    mockUseServiceAlertSubscription.mockReturnValue({
      alertEvent: {
        alert: {
          id: 'alert-1',
          title: 'Info Alert',
          message: 'Info message',
          severity: 'INFO' as const,
          deviceId: 'device-1',
          data: null,
        },
        action: 'CREATED' as const,
      },
    });

    renderHook(() => useServiceAlertToasts({ enabled: true }));

    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'info',
        action: undefined,
      })
    );
  });
});
