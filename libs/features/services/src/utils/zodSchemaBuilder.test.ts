import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { buildZodSchema, evaluateCondition } from './zodSchemaBuilder';
import type { ConfigSchema, ConfigSchemaField } from '@nasnet/api-client/generated';

describe('buildZodSchema', () => {
  it('should build a valid schema from ConfigSchema', () => {
    const configSchema: ConfigSchema = {
      serviceType: 'test-service',
      version: '1.0.0',
      fields: [
        {
          name: 'port',
          type: 'PORT',
          label: 'Port',
          required: true,
          description: 'Service port',
          defaultValue: null,
          options: null,
          min: null,
          max: null,
          pattern: null,
          showIf: null,
          sensitive: false,
        },
        {
          name: 'enabled',
          type: 'TOGGLE',
          label: 'Enabled',
          required: false,
          description: 'Enable service',
          defaultValue: true,
          options: null,
          min: null,
          max: null,
          pattern: null,
          showIf: null,
          sensitive: false,
        },
      ],
    };

    const zodSchema = buildZodSchema(configSchema);

    expect(zodSchema).toBeInstanceOf(z.ZodObject);
    expect(zodSchema.shape).toHaveProperty('port');
    expect(zodSchema.shape).toHaveProperty('enabled');
  });

  it('should handle TEXT field type with min/max constraints', () => {
    const configSchema: ConfigSchema = {
      serviceType: 'test',
      version: '1.0.0',
      fields: [
        {
          name: 'nickname',
          type: 'TEXT',
          label: 'Nickname',
          required: true,
          description: 'Service nickname',
          defaultValue: null,
          options: null,
          min: 3,
          max: 20,
          pattern: null,
          showIf: null,
          sensitive: false,
        },
      ],
    };

    const zodSchema = buildZodSchema(configSchema);
    const result = zodSchema.safeParse({ nickname: 'ab' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Minimum length is 3');
    }
  });

  it('should handle TEXT field with pattern validation', () => {
    const configSchema: ConfigSchema = {
      serviceType: 'test',
      version: '1.0.0',
      fields: [
        {
          name: 'username',
          type: 'TEXT',
          label: 'Username',
          required: true,
          description: 'Alphanumeric username',
          defaultValue: null,
          options: null,
          min: null,
          max: null,
          pattern: '^[a-zA-Z0-9]+$',
          showIf: null,
          sensitive: false,
        },
      ],
    };

    const zodSchema = buildZodSchema(configSchema);

    const validResult = zodSchema.safeParse({ username: 'user123' });
    expect(validResult.success).toBe(true);

    const invalidResult = zodSchema.safeParse({ username: 'user-123!' });
    expect(invalidResult.success).toBe(false);
  });

  it('should handle NUMBER field type with min/max validation', () => {
    const configSchema: ConfigSchema = {
      serviceType: 'test',
      version: '1.0.0',
      fields: [
        {
          name: 'workers',
          type: 'NUMBER',
          label: 'Workers',
          required: true,
          description: 'Number of workers',
          defaultValue: null,
          options: null,
          min: 1,
          max: 10,
          pattern: null,
          showIf: null,
          sensitive: false,
        },
      ],
    };

    const zodSchema = buildZodSchema(configSchema);

    const validResult = zodSchema.safeParse({ workers: 5 });
    expect(validResult.success).toBe(true);

    const tooLowResult = zodSchema.safeParse({ workers: 0 });
    expect(tooLowResult.success).toBe(false);

    const tooHighResult = zodSchema.safeParse({ workers: 11 });
    expect(tooHighResult.success).toBe(false);
  });

  it('should handle PORT field type with correct range (1-65535)', () => {
    const configSchema: ConfigSchema = {
      serviceType: 'test',
      version: '1.0.0',
      fields: [
        {
          name: 'port',
          type: 'PORT',
          label: 'Port',
          required: true,
          description: 'Service port',
          defaultValue: null,
          options: null,
          min: null,
          max: null,
          pattern: null,
          showIf: null,
          sensitive: false,
        },
      ],
    };

    const zodSchema = buildZodSchema(configSchema);

    const validResult = zodSchema.safeParse({ port: 8080 });
    expect(validResult.success).toBe(true);

    const invalidZeroResult = zodSchema.safeParse({ port: 0 });
    expect(invalidZeroResult.success).toBe(false);

    const invalidHighResult = zodSchema.safeParse({ port: 65536 });
    expect(invalidHighResult.success).toBe(false);
  });

  it('should handle IP_ADDRESS field type with IPv4 validation', () => {
    const configSchema: ConfigSchema = {
      serviceType: 'test',
      version: '1.0.0',
      fields: [
        {
          name: 'bind_ip',
          type: 'IP_ADDRESS',
          label: 'Bind IP',
          required: true,
          description: 'IP address',
          defaultValue: null,
          options: null,
          min: null,
          max: null,
          pattern: null,
          showIf: null,
          sensitive: false,
        },
      ],
    };

    const zodSchema = buildZodSchema(configSchema);

    const validResult = zodSchema.safeParse({ bind_ip: '192.168.1.100' });
    expect(validResult.success).toBe(true);

    const invalidResult = zodSchema.safeParse({ bind_ip: '999.999.999.999' });
    expect(invalidResult.success).toBe(false);
  });

  it('should handle EMAIL field type with email validation', () => {
    const configSchema: ConfigSchema = {
      serviceType: 'test',
      version: '1.0.0',
      fields: [
        {
          name: 'contact',
          type: 'EMAIL',
          label: 'Contact Email',
          required: true,
          description: 'Contact email address',
          defaultValue: null,
          options: null,
          min: null,
          max: null,
          pattern: null,
          showIf: null,
          sensitive: false,
        },
      ],
    };

    const zodSchema = buildZodSchema(configSchema);

    const validResult = zodSchema.safeParse({ contact: 'user@example.com' });
    expect(validResult.success).toBe(true);

    const invalidResult = zodSchema.safeParse({ contact: 'not-an-email' });
    expect(invalidResult.success).toBe(false);
  });

  it('should handle URL field type with URL validation', () => {
    const configSchema: ConfigSchema = {
      serviceType: 'test',
      version: '1.0.0',
      fields: [
        {
          name: 'webhook_url',
          type: 'URL',
          label: 'Webhook URL',
          required: true,
          description: 'Webhook endpoint',
          defaultValue: null,
          options: null,
          min: null,
          max: null,
          pattern: null,
          showIf: null,
          sensitive: false,
        },
      ],
    };

    const zodSchema = buildZodSchema(configSchema);

    const validResult = zodSchema.safeParse({ webhook_url: 'https://example.com/webhook' });
    expect(validResult.success).toBe(true);

    const invalidResult = zodSchema.safeParse({ webhook_url: 'not-a-url' });
    expect(invalidResult.success).toBe(false);
  });

  it('should handle SELECT field type with enum validation', () => {
    const configSchema: ConfigSchema = {
      serviceType: 'test',
      version: '1.0.0',
      fields: [
        {
          name: 'mode',
          type: 'SELECT',
          label: 'Mode',
          required: true,
          description: 'Operating mode',
          defaultValue: null,
          options: ['relay', 'bridge', 'exit'],
          min: null,
          max: null,
          pattern: null,
          showIf: null,
          sensitive: false,
        },
      ],
    };

    const zodSchema = buildZodSchema(configSchema);

    const validResult = zodSchema.safeParse({ mode: 'relay' });
    expect(validResult.success).toBe(true);

    const invalidResult = zodSchema.safeParse({ mode: 'invalid-mode' });
    expect(invalidResult.success).toBe(false);
  });

  it('should handle MULTI_SELECT field type with array validation', () => {
    const configSchema: ConfigSchema = {
      serviceType: 'test',
      version: '1.0.0',
      fields: [
        {
          name: 'protocols',
          type: 'MULTI_SELECT',
          label: 'Protocols',
          required: true,
          description: 'Supported protocols',
          defaultValue: null,
          options: ['http', 'https', 'socks5'],
          min: 1,
          max: 3,
          pattern: null,
          showIf: null,
          sensitive: false,
        },
      ],
    };

    const zodSchema = buildZodSchema(configSchema);

    const validResult = zodSchema.safeParse({ protocols: ['http', 'https'] });
    expect(validResult.success).toBe(true);

    const emptyResult = zodSchema.safeParse({ protocols: [] });
    expect(emptyResult.success).toBe(false);

    const invalidValueResult = zodSchema.safeParse({ protocols: ['ftp'] });
    expect(invalidValueResult.success).toBe(false);
  });

  it('should handle PASSWORD field with minimum length', () => {
    const configSchema: ConfigSchema = {
      serviceType: 'test',
      version: '1.0.0',
      fields: [
        {
          name: 'password',
          type: 'PASSWORD',
          label: 'Password',
          required: true,
          description: 'Admin password',
          defaultValue: null,
          options: null,
          min: 8,
          max: null,
          pattern: null,
          showIf: null,
          sensitive: true,
        },
      ],
    };

    const zodSchema = buildZodSchema(configSchema);

    const validResult = zodSchema.safeParse({ password: 'securepassword123' });
    expect(validResult.success).toBe(true);

    const tooShortResult = zodSchema.safeParse({ password: 'short' });
    expect(tooShortResult.success).toBe(false);
  });

  it('should handle TEXT_ARRAY field type with array of strings', () => {
    const configSchema: ConfigSchema = {
      serviceType: 'test',
      version: '1.0.0',
      fields: [
        {
          name: 'dns_servers',
          type: 'TEXT_ARRAY',
          label: 'DNS Servers',
          required: true,
          description: 'List of DNS servers',
          defaultValue: null,
          options: null,
          min: 1,
          max: 5,
          pattern: null,
          showIf: null,
          sensitive: false,
        },
      ],
    };

    const zodSchema = buildZodSchema(configSchema);

    const validResult = zodSchema.safeParse({ dns_servers: ['1.1.1.1', '8.8.8.8'] });
    expect(validResult.success).toBe(true);

    const emptyResult = zodSchema.safeParse({ dns_servers: [] });
    expect(emptyResult.success).toBe(false);
  });

  it('should handle FILE_PATH field type', () => {
    const configSchema: ConfigSchema = {
      serviceType: 'test',
      version: '1.0.0',
      fields: [
        {
          name: 'cert_path',
          type: 'FILE_PATH',
          label: 'Certificate Path',
          required: true,
          description: 'Path to certificate file',
          defaultValue: null,
          options: null,
          min: null,
          max: null,
          pattern: null,
          showIf: null,
          sensitive: false,
        },
      ],
    };

    const zodSchema = buildZodSchema(configSchema);

    const validResult = zodSchema.safeParse({ cert_path: '/etc/ssl/cert.pem' });
    expect(validResult.success).toBe(true);
  });

  it('should handle TOGGLE field type with boolean validation', () => {
    const configSchema: ConfigSchema = {
      serviceType: 'test',
      version: '1.0.0',
      fields: [
        {
          name: 'enabled',
          type: 'TOGGLE',
          label: 'Enabled',
          required: false,
          description: 'Enable feature',
          defaultValue: false,
          options: null,
          min: null,
          max: null,
          pattern: null,
          showIf: null,
          sensitive: false,
        },
      ],
    };

    const zodSchema = buildZodSchema(configSchema);

    const trueResult = zodSchema.safeParse({ enabled: true });
    expect(trueResult.success).toBe(true);

    const falseResult = zodSchema.safeParse({ enabled: false });
    expect(falseResult.success).toBe(true);
  });

  it('should handle optional fields correctly', () => {
    const configSchema: ConfigSchema = {
      serviceType: 'test',
      version: '1.0.0',
      fields: [
        {
          name: 'optional_field',
          type: 'TEXT',
          label: 'Optional Field',
          required: false,
          description: 'An optional field',
          defaultValue: null,
          options: null,
          min: null,
          max: null,
          pattern: null,
          showIf: null,
          sensitive: false,
        },
      ],
    };

    const zodSchema = buildZodSchema(configSchema);

    const withValueResult = zodSchema.safeParse({ optional_field: 'value' });
    expect(withValueResult.success).toBe(true);

    const withoutValueResult = zodSchema.safeParse({});
    expect(withoutValueResult.success).toBe(true);
  });

  it('should throw error for SELECT field without options', () => {
    const configSchema: ConfigSchema = {
      serviceType: 'test',
      version: '1.0.0',
      fields: [
        {
          name: 'mode',
          type: 'SELECT',
          label: 'Mode',
          required: true,
          description: 'Mode',
          defaultValue: null,
          options: [],
          min: null,
          max: null,
          pattern: null,
          showIf: null,
          sensitive: false,
        },
      ],
    };

    expect(() => buildZodSchema(configSchema)).toThrow('must have options');
  });
});

describe('evaluateCondition', () => {
  it('should return true when no condition is provided', () => {
    const result = evaluateCondition(undefined, {});
    expect(result).toBe(true);
  });

  it('should evaluate equality condition with string value', () => {
    const result = evaluateCondition("mode === 'relay'", { mode: 'relay' });
    expect(result).toBe(true);

    const falseResult = evaluateCondition("mode === 'relay'", { mode: 'bridge' });
    expect(falseResult).toBe(false);
  });

  it('should evaluate inequality condition', () => {
    const result = evaluateCondition("mode !== 'exit'", { mode: 'relay' });
    expect(result).toBe(true);

    const falseResult = evaluateCondition("mode !== 'relay'", { mode: 'relay' });
    expect(falseResult).toBe(false);
  });

  it('should evaluate boolean condition', () => {
    const result = evaluateCondition('enabled === true', { enabled: true });
    expect(result).toBe(true);

    const falseResult = evaluateCondition('enabled === true', { enabled: false });
    expect(falseResult).toBe(false);
  });

  it('should evaluate numeric condition', () => {
    const result = evaluateCondition('port === 8080', { port: 8080 });
    expect(result).toBe(true);

    const falseResult = evaluateCondition('port === 8080', { port: 9000 });
    expect(falseResult).toBe(false);
  });

  it('should handle simple boolean field check', () => {
    const result = evaluateCondition('enableAdvanced', { enableAdvanced: true });
    expect(result).toBe(true);

    const falseResult = evaluateCondition('enableAdvanced', { enableAdvanced: false });
    expect(falseResult).toBe(false);
  });

  it('should handle unmatched conditions as boolean field check', () => {
    // Conditions that don't match === or !== patterns are treated as simple boolean checks
    const result = evaluateCondition('someField', { someField: true });
    expect(result).toBe(true);

    const falseResult = evaluateCondition('someField', { someField: false });
    expect(falseResult).toBe(false);

    // If field doesn't exist, returns false
    const missingResult = evaluateCondition('missingField', {});
    expect(missingResult).toBe(false);
  });

  it('should handle double-quoted strings in conditions', () => {
    const result = evaluateCondition('name === "test"', { name: 'test' });
    expect(result).toBe(true);
  });

  it('should handle single-quoted strings in conditions', () => {
    const result = evaluateCondition("name === 'test'", { name: 'test' });
    expect(result).toBe(true);
  });
});
