import { describe, it, expect } from 'vitest';
import {
  logActionsByTopic,
  commonLogActions,
  getActionsForTopic,
  extractDataFromMessage,
  type LogAction,
} from './logActionRegistry';

describe('logActionRegistry', () => {
  describe('logActionsByTopic', () => {
    it('should have actions for firewall topic', () => {
      const firewallActions = logActionsByTopic.firewall;
      expect(firewallActions).toHaveLength(3);
      expect(firewallActions[0].id).toBe('view-rule');
      expect(firewallActions[1].id).toBe('add-to-whitelist');
      expect(firewallActions[2].id).toBe('block-ip');
    });

    it('should have actions for dhcp topic', () => {
      const dhcpActions = logActionsByTopic.dhcp;
      expect(dhcpActions).toHaveLength(2);
      expect(dhcpActions[0].id).toBe('view-lease');
      expect(dhcpActions[1].id).toBe('make-static');
    });

    it('should have actions for wireless topic', () => {
      const wirelessActions = logActionsByTopic.wireless;
      expect(wirelessActions).toHaveLength(2);
      expect(wirelessActions[0].id).toBe('view-client');
      expect(wirelessActions[1].id).toBe('disconnect-client');
    });

    it('should have empty arrays for system, critical, info, warning, error', () => {
      expect(logActionsByTopic.system).toEqual([]);
      expect(logActionsByTopic.critical).toEqual([]);
      expect(logActionsByTopic.info).toEqual([]);
      expect(logActionsByTopic.warning).toEqual([]);
      expect(logActionsByTopic.error).toEqual([]);
    });

    it('should have correct action properties', () => {
      const action = logActionsByTopic.firewall[0];
      expect(action).toHaveProperty('id');
      expect(action).toHaveProperty('label');
      expect(action).toHaveProperty('icon');
      expect(action).toHaveProperty('handler');
      expect(['navigate', 'dialog', 'api']).toContain(action.handler);
    });
  });

  describe('commonLogActions', () => {
    it('should have three common actions', () => {
      expect(commonLogActions).toHaveLength(3);
    });

    it('should have copy action', () => {
      const copyAction = commonLogActions.find((a) => a.id === 'copy');
      expect(copyAction).toBeDefined();
      expect(copyAction?.label).toBe('Copy Log Entry');
      expect(copyAction?.handler).toBe('dialog');
    });

    it('should have bookmark action', () => {
      const bookmarkAction = commonLogActions.find((a) => a.id === 'bookmark');
      expect(bookmarkAction).toBeDefined();
      expect(bookmarkAction?.label).toBe('Bookmark');
      expect(bookmarkAction?.handler).toBe('dialog');
    });

    it('should have view-details action', () => {
      const detailsAction = commonLogActions.find((a) => a.id === 'view-details');
      expect(detailsAction).toBeDefined();
      expect(detailsAction?.label).toBe('View Details');
      expect(detailsAction?.handler).toBe('dialog');
    });
  });

  describe('getActionsForTopic', () => {
    it('should return topic-specific + common actions', () => {
      const actions = getActionsForTopic('firewall');
      expect(actions.length).toBeGreaterThan(3);
      expect(actions.length).toBe(6); // 3 firewall + 3 common
    });

    it('should include all common actions', () => {
      const actions = getActionsForTopic('firewall');
      const commonIds = commonLogActions.map((a) => a.id);
      const actionIds = actions.map((a) => a.id);

      for (const commonId of commonIds) {
        expect(actionIds).toContain(commonId);
      }
    });

    it('should handle unknown topics gracefully', () => {
      const actions = getActionsForTopic('system');
      expect(actions).toEqual(commonLogActions);
    });

    it('should preserve action order: topic-specific first, then common', () => {
      const actions = getActionsForTopic('dhcp');
      const topicActionIds = logActionsByTopic.dhcp.map((a) => a.id);
      const commonActionIds = commonLogActions.map((a) => a.id);

      // Check that topic actions come before common actions
      const firstTopicIndex = actions.findIndex((a) => topicActionIds.includes(a.id));
      const firstCommonIndex = actions.findIndex((a) => commonActionIds.includes(a.id));

      expect(firstTopicIndex).toBeLessThan(firstCommonIndex);
    });
  });

  describe('extractDataFromMessage', () => {
    it('should extract IP address from firewall add-to-whitelist action', () => {
      const action = logActionsByTopic.firewall[1]; // add-to-whitelist
      const ip = extractDataFromMessage('Blocked from 192.168.1.5 trying to access port 80', action);
      expect(ip).toBe('192.168.1.5');
    });

    it('should extract IP address from firewall block-ip action', () => {
      const action = logActionsByTopic.firewall[2]; // block-ip
      const ip = extractDataFromMessage('Attempted connection from 10.0.0.1', action);
      expect(ip).toBe('10.0.0.1');
    });

    it('should extract IP from dhcp make-static action', () => {
      const action = logActionsByTopic.dhcp[1]; // make-static
      const ip = extractDataFromMessage('IP 192.168.1.100 assigned to device', action);
      expect(ip).toBe('192.168.1.100');
    });

    it('should extract MAC address from wireless disconnect-client action', () => {
      const action = logActionsByTopic.wireless[1]; // disconnect-client
      const mac = extractDataFromMessage('Client 00:1A:2B:3C:4D:5E disconnected', action);
      expect(mac).toBe('00:1A:2B:3C:4D:5E');
    });

    it('should return null if pattern does not match', () => {
      const action = logActionsByTopic.firewall[1]; // add-to-whitelist with IP pattern
      const result = extractDataFromMessage('No IP address in this message', action);
      expect(result).toBeNull();
    });

    it('should return null if action has no extractPattern', () => {
      const action: LogAction = {
        id: 'test',
        label: 'Test',
        icon: 'Test',
        handler: 'navigate',
        target: '/test',
      };
      const result = extractDataFromMessage('Any message', action);
      expect(result).toBeNull();
    });

    it('should be case-insensitive for firewall patterns', () => {
      const action = logActionsByTopic.firewall[1]; // add-to-whitelist
      const ip = extractDataFromMessage('BLOCKED FROM 192.168.1.5', action);
      expect(ip).toBe('192.168.1.5');
    });

    it('should handle multiple matches (return first capture group)', () => {
      const action = logActionsByTopic.firewall[1]; // add-to-whitelist
      const ip = extractDataFromMessage('from 192.168.1.5 and from 10.0.0.1', action);
      expect(ip).toBe('192.168.1.5'); // Only first match
    });
  });

  describe('action properties validation', () => {
    it('should have consistent action structure', () => {
      const allActions = [
        ...Object.values(logActionsByTopic).flat(),
        ...commonLogActions,
      ];

      for (const action of allActions) {
        expect(action.id).toBeDefined();
        expect(typeof action.id).toBe('string');
        expect(action.label).toBeDefined();
        expect(typeof action.label).toBe('string');
        expect(action.icon).toBeDefined();
        expect(typeof action.icon).toBe('string');
        expect(['navigate', 'dialog', 'api']).toContain(action.handler);
      }
    });

    it('should have unique action IDs across all topics and common', () => {
      const allActions = [
        ...Object.values(logActionsByTopic).flat(),
        ...commonLogActions,
      ];
      const ids = allActions.map((a) => a.id);
      const uniqueIds = new Set(ids);

      expect(ids.length).toBe(uniqueIds.size);
    });

    it('navigate actions should have target property', () => {
      const navigateActions = Object.values(logActionsByTopic)
        .flat()
        .filter((a) => a.handler === 'navigate');

      for (const action of navigateActions) {
        expect(action.target).toBeDefined();
        expect(action.target).toMatch(/^\//); // Should be a path
      }
    });

    it('dialog actions should have target property', () => {
      const dialogActions = [
        ...Object.values(logActionsByTopic)
          .flat()
          .filter((a) => a.handler === 'dialog'),
        ...commonLogActions.filter((a) => a.handler === 'dialog'),
      ];

      for (const action of dialogActions) {
        expect(action.target).toBeDefined();
      }
    });

    it('extract pattern should be valid regex', () => {
      const actionsWithPattern = Object.values(logActionsByTopic)
        .flat()
        .filter((a) => a.extractPattern);

      for (const action of actionsWithPattern) {
        expect(action.extractPattern).toBeInstanceOf(RegExp);
        // Should be able to use the regex
        expect(() => 'test'.match(action.extractPattern!)).not.toThrow();
      }
    });
  });
});
