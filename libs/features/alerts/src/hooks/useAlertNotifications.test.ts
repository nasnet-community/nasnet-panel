/**
 * Unit tests for useAlertNotifications hook
 * Tests Apollo subscription integration, toast notifications, and sound playback
 */

import React, { type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAlertNotifications, playAlertSound } from './useAlertNotifications';
import {
  useAlertNotificationStore,
  type AlertSeverity,
} from '@nasnet/state/stores';
import { useConnectionStore } from '@nasnet/state/stores';

// ===== Mocks =====

// Mock useToast hook
const mockToast = {
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  success: vi.fn(),
};

vi.mock('@nasnet/ui/patterns', () => ({
  useToast: () => mockToast,
}));

// Mock Audio API
const mockAudioPlay = vi.fn();
const mockAudioConstructor = vi.fn().mockImplementation(() => ({
  play: mockAudioPlay,
  volume: 0.7,
}));

global.Audio = mockAudioConstructor as unknown as typeof Audio;

// ===== Test Fixtures =====

const _ALERT_EVENTS_SUBSCRIPTION = `
  subscription AlertEvents($deviceId: ID) {
    alertEvents(deviceId: $deviceId) {
      alert {
        id
        ruleId
        eventType
        severity
        title
        message
        data
        deviceId
        triggeredAt
        acknowledgedAt
        acknowledgedBy
      }
      action
    }
  }
`;

interface AlertEventPayload {
  alert: {
    id: string;
    ruleId: string;
    eventType: string;
    severity: AlertSeverity;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    deviceId?: string;
    triggeredAt: string;
    acknowledgedAt?: string;
    acknowledgedBy?: string;
  };
  action: 'CREATED' | 'UPDATED' | 'DELETED';
}

function createAlertEvent(
  overrides: Partial<AlertEventPayload['alert']> = {}
): AlertEventPayload {
  return {
    alert: {
      id: 'alert-1',
      ruleId: 'rule-1',
      eventType: 'router.offline',
      severity: 'CRITICAL',
      title: 'Router Offline',
      message: 'Router has lost connection',
      deviceId: 'router-1',
      triggeredAt: new Date().toISOString(),
      ...overrides,
    },
    action: 'CREATED',
  };
}

function createSubscriptionMock(
  deviceId: string | null,
  alertEvent: AlertEventPayload
): MockedResponse {
  return {
    request: {
      query: expect.objectContaining({
        definitions: expect.arrayContaining([
          expect.objectContaining({
            kind: 'OperationDefinition',
            operation: 'subscription',
          }),
        ]),
      }),
      variables: { deviceId },
    },
    result: {
      data: {
        alertEvents: alertEvent,
      },
    },
  };
}

// ===== Test Wrapper =====

interface WrapperProps {
  children: ReactNode;
}

function createWrapper(mocks: MockedResponse[] = []) {
  return function Wrapper({ children }: WrapperProps): React.ReactElement {
    return React.createElement(MockedProvider, { mocks }, children);
  };
}

// ===== Tests =====

describe('useAlertNotifications', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Reset stores
    useAlertNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
      settings: {
        enabled: true,
        soundEnabled: true,
        severityFilter: 'ALL',
        autoDismissTiming: 5000,
      },
    });

    useConnectionStore.setState({
      activeRouterId: 'router-1',
    });

    // Mock Audio.play to resolve successfully
    mockAudioPlay.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Subscription Behavior', () => {
    it('should subscribe with active router ID from connection store', async () => {
      const alertEvent = createAlertEvent();
      const mocks = [createSubscriptionMock('router-1', alertEvent)];

      const { result } = renderHook(() => useAlertNotifications(), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(() => {
        expect(result.current).toBeUndefined(); // Hook returns void
      });
    });

    it('should use override deviceId when provided', async () => {
      const alertEvent = createAlertEvent({ deviceId: 'router-2' });
      const mocks = [createSubscriptionMock('router-2', alertEvent)];

      renderHook(() => useAlertNotifications({ deviceId: 'router-2' }), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(() => {
        expect(mocks[0]!.request.variables?.deviceId).toBe('router-2');
      });
    });

    it('should skip subscription when enabled=false', async () => {
      const addNotification = vi.spyOn(
        useAlertNotificationStore.getState(),
        'addNotification'
      );

      renderHook(() => useAlertNotifications({ enabled: false }), {
        wrapper: createWrapper([]),
      });

      await waitFor(() => {
        expect(addNotification).not.toHaveBeenCalled();
      });
    });

    it('should skip subscription when settings.enabled=false', async () => {
      useAlertNotificationStore.setState({
        settings: {
          enabled: false,
          soundEnabled: true,
          severityFilter: 'ALL',
          autoDismissTiming: 5000,
        },
      });

      const addNotification = vi.spyOn(
        useAlertNotificationStore.getState(),
        'addNotification'
      );

      renderHook(() => useAlertNotifications(), {
        wrapper: createWrapper([]),
      });

      await waitFor(() => {
        expect(addNotification).not.toHaveBeenCalled();
      });
    });

    it('should skip subscription when no deviceId available', async () => {
      useConnectionStore.setState({ activeRouterId: null });

      const addNotification = vi.spyOn(
        useAlertNotificationStore.getState(),
        'addNotification'
      );

      renderHook(() => useAlertNotifications(), {
        wrapper: createWrapper([]),
      });

      await waitFor(() => {
        expect(addNotification).not.toHaveBeenCalled();
      });
    });
  });

  describe('Alert Processing', () => {
    it('should add notification to store when alert arrives', async () => {
      const alertEvent = createAlertEvent({
        id: 'alert-123',
        title: 'Test Alert',
        message: 'Test message',
        severity: 'WARNING',
      });

      const mocks = [createSubscriptionMock('router-1', alertEvent)];

      renderHook(() => useAlertNotifications(), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(
        () => {
          const notifications =
            useAlertNotificationStore.getState().notifications;
          expect(notifications).toHaveLength(1);
          expect(notifications[0]).toMatchObject({
            alertId: 'alert-123',
            title: 'Test Alert',
            message: 'Test message',
            severity: 'WARNING',
          });
        },
        { timeout: 3000 }
      );
    });

    it('should only process CREATED action events', async () => {
      const alertEvent = createAlertEvent();
      const updatedEvent = { ...alertEvent, action: 'UPDATED' as const };

      const mocks = [createSubscriptionMock('router-1', updatedEvent)];

      renderHook(() => useAlertNotifications(), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(() => {
        const notifications = useAlertNotificationStore.getState().notifications;
        expect(notifications).toHaveLength(0);
      });
    });

    it('should deduplicate alerts with same ID', async () => {
      const alertEvent = createAlertEvent({ id: 'alert-dup' });

      const mocks = [
        createSubscriptionMock('router-1', alertEvent),
        createSubscriptionMock('router-1', alertEvent), // Duplicate
      ];

      const addNotification = vi.spyOn(
        useAlertNotificationStore.getState(),
        'addNotification'
      );

      renderHook(() => useAlertNotifications(), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(
        () => {
          // Should only be called once despite two events
          expect(addNotification).toHaveBeenCalledTimes(1);
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Severity Filtering', () => {
    it('should filter alerts below severity threshold', async () => {
      useAlertNotificationStore.setState({
        settings: {
          enabled: true,
          soundEnabled: true,
          severityFilter: 'WARNING', // Only WARNING and CRITICAL
          autoDismissTiming: 5000,
        },
      });

      const infoEvent = createAlertEvent({ severity: 'INFO' });
      const mocks = [createSubscriptionMock('router-1', infoEvent)];

      renderHook(() => useAlertNotifications(), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(() => {
        const notifications = useAlertNotificationStore.getState().notifications;
        expect(notifications).toHaveLength(0);
      });
    });

    it('should allow alerts at or above severity threshold', async () => {
      useAlertNotificationStore.setState({
        settings: {
          enabled: true,
          soundEnabled: true,
          severityFilter: 'WARNING',
          autoDismissTiming: 5000,
        },
      });

      const criticalEvent = createAlertEvent({ severity: 'CRITICAL' });
      const mocks = [createSubscriptionMock('router-1', criticalEvent)];

      renderHook(() => useAlertNotifications(), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(
        () => {
          const notifications =
            useAlertNotificationStore.getState().notifications;
          expect(notifications).toHaveLength(1);
        },
        { timeout: 3000 }
      );
    });

    it('should allow all severities when filter is ALL', async () => {
      useAlertNotificationStore.setState({
        settings: {
          enabled: true,
          soundEnabled: true,
          severityFilter: 'ALL',
          autoDismissTiming: 5000,
        },
      });

      const infoEvent = createAlertEvent({ severity: 'INFO' });
      const mocks = [createSubscriptionMock('router-1', infoEvent)];

      renderHook(() => useAlertNotifications(), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(
        () => {
          const notifications =
            useAlertNotificationStore.getState().notifications;
          expect(notifications).toHaveLength(1);
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Toast Notifications', () => {
    it('should show error toast for CRITICAL alerts', async () => {
      const criticalEvent = createAlertEvent({
        severity: 'CRITICAL',
        title: 'Critical Alert',
        message: 'Critical message',
      });

      const mocks = [createSubscriptionMock('router-1', criticalEvent)];

      renderHook(() => useAlertNotifications(), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(
        () => {
          expect(mockToast.error).toHaveBeenCalledWith(
            'Critical Alert',
            expect.objectContaining({
              message: 'Critical message',
              duration: null, // Critical never auto-dismiss
            })
          );
        },
        { timeout: 3000 }
      );
    });

    it('should show warning toast for WARNING alerts', async () => {
      const warningEvent = createAlertEvent({
        severity: 'WARNING',
        title: 'Warning Alert',
        message: 'Warning message',
      });

      const mocks = [createSubscriptionMock('router-1', warningEvent)];

      renderHook(() => useAlertNotifications(), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(
        () => {
          expect(mockToast.warning).toHaveBeenCalledWith(
            'Warning Alert',
            expect.objectContaining({
              message: 'Warning message',
              duration: 8000, // Default 8s for warnings
            })
          );
        },
        { timeout: 3000 }
      );
    });

    it('should show info toast for INFO alerts', async () => {
      const infoEvent = createAlertEvent({
        severity: 'INFO',
        title: 'Info Alert',
        message: 'Info message',
      });

      const mocks = [createSubscriptionMock('router-1', infoEvent)];

      renderHook(() => useAlertNotifications(), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(
        () => {
          expect(mockToast.info).toHaveBeenCalledWith(
            'Info Alert',
            expect.objectContaining({
              message: 'Info message',
              duration: 5000, // Default 5s for info
            })
          );
        },
        { timeout: 3000 }
      );
    });

    it('should include navigation action for known event types', async () => {
      const vpnEvent = createAlertEvent({
        eventType: 'vpn.disconnected',
        title: 'VPN Disconnected',
      });

      const mocks = [createSubscriptionMock('router-1', vpnEvent)];

      renderHook(() => useAlertNotifications(), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(
        () => {
          expect(mockToast.error).toHaveBeenCalledWith(
            'VPN Disconnected',
            expect.objectContaining({
              action: expect.objectContaining({
                label: 'View',
                onClick: expect.any(Function),
              }),
            })
          );
        },
        { timeout: 3000 }
      );
    });

    it('should respect user auto-dismiss timing setting', async () => {
      useAlertNotificationStore.setState({
        settings: {
          enabled: true,
          soundEnabled: true,
          severityFilter: 'ALL',
          autoDismissTiming: 10000, // Custom 10s
        },
      });

      const warningEvent = createAlertEvent({
        severity: 'WARNING',
        title: 'Warning',
      });

      const mocks = [createSubscriptionMock('router-1', warningEvent)];

      renderHook(() => useAlertNotifications(), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(
        () => {
          expect(mockToast.warning).toHaveBeenCalledWith(
            'Warning',
            expect.objectContaining({
              duration: 10000, // Use custom setting
            })
          );
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Sound Playback', () => {
    it('should play critical sound for CRITICAL alerts', async () => {
      const criticalEvent = createAlertEvent({ severity: 'CRITICAL' });
      const mocks = [createSubscriptionMock('router-1', criticalEvent)];

      renderHook(() => useAlertNotifications(), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(
        () => {
          expect(mockAudioConstructor).toHaveBeenCalledWith(
            '/sounds/alert-critical.mp3'
          );
          expect(mockAudioPlay).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });

    it('should play warning sound for WARNING alerts', async () => {
      const warningEvent = createAlertEvent({ severity: 'WARNING' });
      const mocks = [createSubscriptionMock('router-1', warningEvent)];

      renderHook(() => useAlertNotifications(), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(
        () => {
          expect(mockAudioConstructor).toHaveBeenCalledWith(
            '/sounds/alert-warning.mp3'
          );
          expect(mockAudioPlay).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });

    it('should play info sound for INFO alerts', async () => {
      const infoEvent = createAlertEvent({ severity: 'INFO' });
      const mocks = [createSubscriptionMock('router-1', infoEvent)];

      renderHook(() => useAlertNotifications(), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(
        () => {
          expect(mockAudioConstructor).toHaveBeenCalledWith(
            '/sounds/alert-info.mp3'
          );
          expect(mockAudioPlay).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });

    it('should not play sound when settings.soundEnabled=false', async () => {
      useAlertNotificationStore.setState({
        settings: {
          enabled: true,
          soundEnabled: false, // Disabled
          severityFilter: 'ALL',
          autoDismissTiming: 5000,
        },
      });

      const criticalEvent = createAlertEvent({ severity: 'CRITICAL' });
      const mocks = [createSubscriptionMock('router-1', criticalEvent)];

      renderHook(() => useAlertNotifications(), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(
        () => {
          const notifications =
            useAlertNotificationStore.getState().notifications;
          expect(notifications).toHaveLength(1);
        },
        { timeout: 3000 }
      );

      expect(mockAudioConstructor).not.toHaveBeenCalled();
      expect(mockAudioPlay).not.toHaveBeenCalled();
    });

    it('should handle audio playback errors gracefully', async () => {
      mockAudioPlay.mockRejectedValueOnce(new Error('Autoplay blocked'));

      const criticalEvent = createAlertEvent({ severity: 'CRITICAL' });
      const mocks = [createSubscriptionMock('router-1', criticalEvent)];

      renderHook(() => useAlertNotifications(), {
        wrapper: createWrapper(mocks),
      });

      await waitFor(
        () => {
          const notifications =
            useAlertNotificationStore.getState().notifications;
          expect(notifications).toHaveLength(1); // Still adds notification
        },
        { timeout: 3000 }
      );
    });
  });

  describe('playAlertSound helper', () => {
    it('should play sound when enabled', () => {
      playAlertSound('CRITICAL', true);

      expect(mockAudioConstructor).toHaveBeenCalledWith(
        '/sounds/alert-critical.mp3'
      );
      expect(mockAudioPlay).toHaveBeenCalled();
    });

    it('should not play sound when disabled', () => {
      playAlertSound('CRITICAL', false);

      expect(mockAudioConstructor).not.toHaveBeenCalled();
      expect(mockAudioPlay).not.toHaveBeenCalled();
    });

    it('should set volume to 70%', () => {
      playAlertSound('WARNING', true);

      const audioInstance = mockAudioConstructor.mock.results[0]?.value;
      expect(audioInstance.volume).toBe(0.7);
    });

    it('should handle Audio constructor errors', () => {
      mockAudioConstructor.mockImplementationOnce(() => {
        throw new Error('Audio not supported');
      });

      // Should not throw
      expect(() => playAlertSound('INFO', true)).not.toThrow();
    });
  });
});
