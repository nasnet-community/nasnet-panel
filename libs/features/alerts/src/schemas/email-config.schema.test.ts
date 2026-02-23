/**
 * Unit tests for email-config.schema
 * Tests Zod validation rules and helper functions
 */

import { describe, it, expect } from 'vitest';
import {
  emailConfigSchema,
  defaultEmailConfig,
  SMTP_PORT_PRESETS,
  isValidEmail,
  toEmailConfigInput,
  type EmailConfig,
} from './email-config.schema';

// ===== Test Fixtures =====

const validEmailConfig: EmailConfig = {
  enabled: true,
  host: 'smtp.gmail.com',
  port: 587,
  username: 'user@example.com',
  password: 'securepassword',
  fromAddress: 'alerts@example.com',
  fromName: 'Alert System',
  toAddresses: ['admin@example.com'],
  useTLS: true,
  skipVerify: false,
};

// ===== Tests =====

describe('emailConfigSchema', () => {
  describe('Validation', () => {
    it('accepts valid complete configuration', () => {
      const result = emailConfigSchema.safeParse(validEmailConfig);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validEmailConfig);
      }
    });

    it('applies default values for optional fields', () => {
      const minimalConfig = {
        host: 'smtp.example.com',
        username: 'user',
        password: 'pass',
        fromAddress: 'from@example.com',
        toAddresses: ['to@example.com'],
      };

      const result = emailConfigSchema.safeParse(minimalConfig);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.enabled).toBe(false); // Default
        expect(result.data.port).toBe(587); // Default
        expect(result.data.useTLS).toBe(true); // Default
        expect(result.data.skipVerify).toBe(false); // Default
      }
    });

    it('allows optional fromName to be omitted', () => {
      const configWithoutFromName = {
        ...validEmailConfig,
        fromName: undefined,
      };

      const result = emailConfigSchema.safeParse(configWithoutFromName);

      expect(result.success).toBe(true);
    });
  });

  describe('SMTP Host Validation', () => {
    it('accepts valid hostnames', () => {
      const validHosts = [
        'smtp.gmail.com',
        'mail.example.com',
        'smtp-relay.sendinblue.com',
        'mx.server123.net',
        'localhost',
      ];

      validHosts.forEach((host) => {
        const config = { ...validEmailConfig, host };
        const result = emailConfigSchema.safeParse(config);
        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid hostname formats', () => {
      const invalidHosts = [
        '',
        ' ',
        'smtp gmail com',
        'smtp@gmail.com',
        'smtp://gmail.com',
        '-invalid.com',
        'invalid-.com',
        'inv alid.com',
      ];

      invalidHosts.forEach((host) => {
        const config = { ...validEmailConfig, host };
        const result = emailConfigSchema.safeParse(config);
        expect(result.success).toBe(false);
      });
    });

    it('requires non-empty host', () => {
      const config = { ...validEmailConfig, host: '' };
      const result = emailConfigSchema.safeParse(config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('SMTP server hostname');
      }
    });
  });

  describe('Port Validation', () => {
    it('accepts valid port numbers', () => {
      const validPorts = [1, 25, 587, 465, 2525, 65535];

      validPorts.forEach((port) => {
        const config = { ...validEmailConfig, port };
        const result = emailConfigSchema.safeParse(config);
        expect(result.success).toBe(true);
      });
    });

    it('rejects port below 1', () => {
      const config = { ...validEmailConfig, port: 0 };
      const result = emailConfigSchema.safeParse(config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Port must be between 1 and 65535');
      }
    });

    it('rejects port above 65535', () => {
      const config = { ...validEmailConfig, port: 70000 };
      const result = emailConfigSchema.safeParse(config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Port must be between 1 and 65535');
      }
    });

    it('rejects non-integer ports', () => {
      const config = { ...validEmailConfig, port: 587.5 };
      const result = emailConfigSchema.safeParse(config);

      expect(result.success).toBe(false);
    });
  });

  describe('Authentication Validation', () => {
    it('requires non-empty username', () => {
      const config = { ...validEmailConfig, username: '' };
      const result = emailConfigSchema.safeParse(config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('SMTP username');
      }
    });

    it('requires non-empty password', () => {
      const config = { ...validEmailConfig, password: '' };
      const result = emailConfigSchema.safeParse(config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('SMTP password');
      }
    });

    it('accepts any string for username', () => {
      const usernames = ['user@example.com', 'apikey', 'admin', '123456'];

      usernames.forEach((username) => {
        const config = { ...validEmailConfig, username };
        const result = emailConfigSchema.safeParse(config);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Email Address Validation', () => {
    it('accepts valid fromAddress emails', () => {
      const validEmails = [
        'alerts@example.com',
        'no-reply@sub.domain.com',
        'user+tag@example.com',
        'test.user@example.co.uk',
      ];

      validEmails.forEach((fromAddress) => {
        const config = { ...validEmailConfig, fromAddress };
        const result = emailConfigSchema.safeParse(config);
        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid fromAddress emails', () => {
      const invalidEmails = [
        '',
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@.com',
      ];

      invalidEmails.forEach((fromAddress) => {
        const config = { ...validEmailConfig, fromAddress };
        const result = emailConfigSchema.safeParse(config);
        expect(result.success).toBe(false);
      });
    });

    it('requires fromAddress to be non-empty', () => {
      const config = { ...validEmailConfig, fromAddress: '' };
      const result = emailConfigSchema.safeParse(config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('sender email address');
      }
    });
  });

  describe('Recipient Validation', () => {
    it('accepts valid recipient arrays', () => {
      const validRecipients = [
        ['admin@example.com'],
        ['user1@example.com', 'user2@example.com'],
        Array(10)
          .fill(0)
          .map((_, i) => `user${i}@example.com`),
      ];

      validRecipients.forEach((toAddresses) => {
        const config = { ...validEmailConfig, toAddresses };
        const result = emailConfigSchema.safeParse(config);
        expect(result.success).toBe(true);
      });
    });

    it('requires at least one recipient', () => {
      const config = { ...validEmailConfig, toAddresses: [] };
      const result = emailConfigSchema.safeParse(config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Add at least one recipient'
        );
      }
    });

    it('rejects more than 10 recipients', () => {
      const tooManyRecipients = Array(11)
        .fill(0)
        .map((_, i) => `user${i}@example.com`);

      const config = { ...validEmailConfig, toAddresses: tooManyRecipients };
      const result = emailConfigSchema.safeParse(config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Maximum 10 recipient');
      }
    });

    it('validates each recipient email format', () => {
      const config = {
        ...validEmailConfig,
        toAddresses: ['valid@example.com', 'invalid-email'],
      };
      const result = emailConfigSchema.safeParse(config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid email');
      }
    });
  });

  describe('TLS Settings Validation', () => {
    it('accepts useTLS as boolean', () => {
      const config1 = { ...validEmailConfig, useTLS: true };
      const config2 = { ...validEmailConfig, useTLS: false };

      expect(emailConfigSchema.safeParse(config1).success).toBe(true);
      expect(emailConfigSchema.safeParse(config2).success).toBe(true);
    });

    it('accepts skipVerify as boolean', () => {
      const config1 = { ...validEmailConfig, skipVerify: true };
      const config2 = { ...validEmailConfig, skipVerify: false };

      expect(emailConfigSchema.safeParse(config1).success).toBe(true);
      expect(emailConfigSchema.safeParse(config2).success).toBe(true);
    });

    it('defaults useTLS to true', () => {
      const config = {
        host: 'smtp.example.com',
        username: 'user',
        password: 'pass',
        fromAddress: 'from@example.com',
        toAddresses: ['to@example.com'],
      };

      const result = emailConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.useTLS).toBe(true);
      }
    });

    it('defaults skipVerify to false', () => {
      const config = {
        host: 'smtp.example.com',
        username: 'user',
        password: 'pass',
        fromAddress: 'from@example.com',
        toAddresses: ['to@example.com'],
      };

      const result = emailConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.skipVerify).toBe(false);
      }
    });
  });
});

describe('defaultEmailConfig', () => {
  it('provides sensible defaults', () => {
    expect(defaultEmailConfig).toEqual({
      enabled: false,
      host: '',
      port: 587,
      username: '',
      password: '',
      fromAddress: '',
      fromName: '',
      toAddresses: [],
      useTLS: true,
      skipVerify: false,
    });
  });

  it('defaults to secure settings (TLS enabled, skipVerify disabled)', () => {
    expect(defaultEmailConfig.useTLS).toBe(true);
    expect(defaultEmailConfig.skipVerify).toBe(false);
  });

  it('defaults to port 587 (STARTTLS)', () => {
    expect(defaultEmailConfig.port).toBe(587);
  });
});

describe('SMTP_PORT_PRESETS', () => {
  it('defines three standard SMTP ports', () => {
    expect(SMTP_PORT_PRESETS).toHaveLength(3);
  });

  it('includes port 25 (Plain SMTP)', () => {
    const preset = SMTP_PORT_PRESETS.find((p) => p.port === 25);
    expect(preset).toBeDefined();
    expect(preset?.tls).toBe(false);
    expect(preset?.label).toContain('Plain');
  });

  it('includes port 587 (STARTTLS)', () => {
    const preset = SMTP_PORT_PRESETS.find((p) => p.port === 587);
    expect(preset).toBeDefined();
    expect(preset?.tls).toBe(true);
    expect(preset?.label).toContain('STARTTLS');
  });

  it('includes port 465 (TLS/SSL)', () => {
    const preset = SMTP_PORT_PRESETS.find((p) => p.port === 465);
    expect(preset).toBeDefined();
    expect(preset?.tls).toBe(true);
    expect(preset?.label).toContain('TLS/SSL');
  });
});

describe('isValidEmail helper', () => {
  it('returns true for valid emails', () => {
    const validEmails = [
      'user@example.com',
      'test.user@sub.domain.com',
      'user+tag@example.com',
      'admin@localhost',
    ];

    validEmails.forEach((email) => {
      expect(isValidEmail(email)).toBe(true);
    });
  });

  it('returns false for invalid emails', () => {
    const invalidEmails = [
      '',
      'notanemail',
      '@example.com',
      'user@',
      'user @example.com',
      'user@.com',
      'user..name@example.com',
    ];

    invalidEmails.forEach((email) => {
      expect(isValidEmail(email)).toBe(false);
    });
  });
});

describe('toEmailConfigInput transformer', () => {
  it('transforms EmailConfig to GraphQL input format', () => {
    const input = toEmailConfigInput(validEmailConfig);

    expect(input).toEqual({
      enabled: true,
      host: 'smtp.gmail.com',
      port: 587,
      username: 'user@example.com',
      password: 'securepassword',
      fromAddress: 'alerts@example.com',
      fromName: 'Alert System',
      toAddresses: ['admin@example.com'],
      useTLS: true,
      skipVerify: false,
    });
  });

  it('converts empty fromName to undefined', () => {
    const config = { ...validEmailConfig, fromName: '' };
    const input = toEmailConfigInput(config);

    expect(input.fromName).toBeUndefined();
  });

  it('preserves fromName when provided', () => {
    const config = { ...validEmailConfig, fromName: 'Custom Name' };
    const input = toEmailConfigInput(config);

    expect(input.fromName).toBe('Custom Name');
  });

  it('preserves all field names matching backend schema', () => {
    const input = toEmailConfigInput(validEmailConfig);

    // Verify all fields match backend EmailConfigInput type
    expect(input).toHaveProperty('enabled');
    expect(input).toHaveProperty('host');
    expect(input).toHaveProperty('port');
    expect(input).toHaveProperty('username');
    expect(input).toHaveProperty('password');
    expect(input).toHaveProperty('fromAddress');
    expect(input).toHaveProperty('fromName');
    expect(input).toHaveProperty('toAddresses');
    expect(input).toHaveProperty('useTLS');
    expect(input).toHaveProperty('skipVerify');
  });

  it('handles toAddresses array correctly', () => {
    const config = {
      ...validEmailConfig,
      toAddresses: ['admin@example.com', 'ops@example.com'],
    };
    const input = toEmailConfigInput(config);

    expect(input.toAddresses).toEqual(['admin@example.com', 'ops@example.com']);
  });
});
