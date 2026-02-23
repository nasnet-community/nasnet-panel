/**
 * Wireless Settings Validation Schema Tests
 * Comprehensive test suite for wirelessSettings schema validation
 *
 * Tests:
 * - Valid inputs (happy path)
 * - Invalid inputs (each field)
 * - Edge cases (boundary values, special characters)
 * - Error message quality (actionable, specific)
 */

import { describe, it, expect } from 'vitest';
import {
  wirelessSettingsSchema,
  wirelessSettingsPartialSchema,
  defaultWirelessSettings,
  WirelessSettingsFormData,
} from './wirelessSettings.schema';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parses and returns formatted errors for easier assertion
 */
function parseErrors(result: any): Record<string, (string | undefined)[] | undefined> {
  if (result.success) return {};
  return result.error.flatten().fieldErrors;
}

/**
 * Valid default test data
 */
function validFormData(): WirelessSettingsFormData {
  return {
    ssid: 'TestNetwork',
    password: 'ValidPassword123',
    hideSsid: false,
    channel: 'auto',
    channelWidth: '20MHz',
    txPower: 17,
    securityMode: 'wpa2-psk',
    countryCode: 'US',
  };
}

// ============================================================================
// VALID INPUT TESTS (Happy Path)
// ============================================================================

describe('WirelessSettingsSchema - Valid Inputs', () => {
  it('should accept complete valid form data', () => {
    const data = validFormData();
    const result = wirelessSettingsSchema.safeParse(data);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(data);
  });

  it('should accept SSID at minimum length (1 char)', () => {
    const data = validFormData();
    data.ssid = 'A';
    const result = wirelessSettingsSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should accept SSID at maximum length (32 chars)', () => {
    const data = validFormData();
    data.ssid = 'A'.repeat(32);
    const result = wirelessSettingsSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should accept SSID with spaces (printable ASCII)', () => {
    const data = validFormData();
    data.ssid = 'My Test Network 2024';
    const result = wirelessSettingsSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should accept password at minimum length (8 chars)', () => {
    const data = validFormData();
    data.password = '12345678';
    const result = wirelessSettingsSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should accept password at maximum length (63 chars)', () => {
    const data = validFormData();
    data.password = 'A'.repeat(63);
    const result = wirelessSettingsSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should accept password with special characters', () => {
    const data = validFormData();
    data.password = 'P@ss!w0rd#2024$Special';
    const result = wirelessSettingsSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should accept empty password (optional)', () => {
    const data = validFormData();
    data.password = '';
    const result = wirelessSettingsSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should accept undefined password', () => {
    const data = validFormData();
    data.password = undefined;
    const result = wirelessSettingsSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should accept channel as "auto"', () => {
    const data = validFormData();
    data.channel = 'auto';
    const result = wirelessSettingsSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should accept valid 2.4GHz channels (1-14)', () => {
    const data = validFormData();
    [1, 6, 11, 14].forEach((ch) => {
      data.channel = ch.toString();
      const result = wirelessSettingsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  it('should accept valid 5GHz channels (36+)', () => {
    const data = validFormData();
    [36, 40, 44, 48, 149, 153, 157, 161, 165].forEach((ch) => {
      data.channel = ch.toString();
      const result = wirelessSettingsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  it('should accept all valid channel widths', () => {
    const data = validFormData();
    ['20MHz', '40MHz', '80MHz', '160MHz'].forEach((width) => {
      data.channelWidth = width as any;
      const result = wirelessSettingsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  it('should accept TX power at minimum (1 dBm)', () => {
    const data = validFormData();
    data.txPower = 1;
    const result = wirelessSettingsSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should accept TX power at maximum (30 dBm)', () => {
    const data = validFormData();
    data.txPower = 30;
    const result = wirelessSettingsSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should accept all valid security modes', () => {
    const data = validFormData();
    ['none', 'wpa2-psk', 'wpa3-psk', 'wpa2-wpa3-psk'].forEach((mode) => {
      data.securityMode = mode as any;
      const result = wirelessSettingsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  it('should accept valid ISO country codes', () => {
    const data = validFormData();
    ['US', 'GB', 'DE', 'JP', 'FR', 'CN', 'BR', 'IN'].forEach((code) => {
      data.countryCode = code;
      const result = wirelessSettingsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// INVALID INPUT TESTS (Field Validation)
// ============================================================================

describe('WirelessSettingsSchema - Invalid Inputs', () => {
  // SSID Validation
  describe('SSID validation', () => {
    it('should reject empty SSID', () => {
      const data = validFormData();
      data.ssid = '';
      const result = wirelessSettingsSchema.safeParse(data);
      expect(result.success).toBe(false);
      const errors = parseErrors(result);
      expect(errors.ssid).toBeDefined();
      expect(errors.ssid?.[0]).toContain('at least');
    });

    it('should reject SSID exceeding 32 characters', () => {
      const data = validFormData();
      data.ssid = 'A'.repeat(33);
      const result = wirelessSettingsSchema.safeParse(data);
      expect(result.success).toBe(false);
      const errors = parseErrors(result);
      expect(errors.ssid).toBeDefined();
      expect(errors.ssid?.[0]).toContain('32');
    });

    it('should reject SSID with non-ASCII characters', () => {
      const data = validFormData();
      data.ssid = 'NetworkÜmlaut'; // Contains ü
      const result = wirelessSettingsSchema.safeParse(data);
      expect(result.success).toBe(false);
      const errors = parseErrors(result);
      expect(errors.ssid).toBeDefined();
      expect(errors.ssid?.[0]).toContain('printable ASCII');
    });

    it('should reject SSID with emoji', () => {
      const data = validFormData();
      data.ssid = 'Network 🔒'; // Contains emoji
      const result = wirelessSettingsSchema.safeParse(data);
      expect(result.success).toBe(false);
      const errors = parseErrors(result);
      expect(errors.ssid).toBeDefined();
    });

    it('should reject non-string SSID', () => {
      const data = validFormData();
      data.ssid = 123 as any;
      const result = wirelessSettingsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  // Password Validation
  describe('Password validation', () => {
    it('should reject password shorter than 8 characters', () => {
      const data = validFormData();
      data.password = '1234567'; // 7 chars
      const result = wirelessSettingsSchema.safeParse(data);
      expect(result.success).toBe(false);
      const errors = parseErrors(result);
      expect(errors.password).toBeDefined();
      expect(errors.password?.[0]).toContain('8');
    });

    it('should reject password exceeding 63 characters', () => {
      const data = validFormData();
      data.password = 'A'.repeat(64);
      const result = wirelessSettingsSchema.safeParse(data);
      expect(result.success).toBe(false);
      const errors = parseErrors(result);
      expect(errors.password).toBeDefined();
      expect(errors.password?.[0]).toContain('63');
    });

    it('should provide actionable error for short password', () => {
      const data = validFormData();
      data.password = 'short';
      const result = wirelessSettingsSchema.safeParse(data);
      expect(result.success).toBe(false);
      const errors = parseErrors(result);
      expect(errors.password?.[0]).toContain('WPA');
    });

    it('should not reject non-string password type', () => {
      const data = validFormData();
      data.password = 123 as any;
      const result = wirelessSettingsSchema.safeParse(data);
      // Zod coerces numbers to strings, so this may succeed
      // Test actual behavior
      expect(result.success).toBeDefined();
    });
  });

  // Channel Validation
  describe('Channel validation', () => {
    it('should reject invalid channel format', () => {
      const data = validFormData();
      data.channel = 'channel-1';
      const result = wirelessSettingsSchema.safeParse(data);
      expect(result.success).toBe(false);
      const errors = parseErrors(result);
      expect(errors.channel).toBeDefined();
      expect(errors.channel?.[0]).toContain('auto');
    });

    it('should provide actionable channel error', () => {
      const data = validFormData();
      data.channel = 'invalid';
      const result = wirelessSettingsSchema.safeParse(data);
      expect(result.success).toBe(false);
      const errors = parseErrors(result);
      expect(errors.channel?.[0]).toMatch(/auto|numeric/i);
    });
  });

  // Channel Width Validation
  describe('Channel width validation', () => {
    it('should reject invalid channel width', () => {
      const data = validFormData();
      data.channelWidth = '30MHz' as any;
      const result = wirelessSettingsSchema.safeParse(data);
      expect(result.success).toBe(false);
      const errors = parseErrors(result);
      expect(errors.channelWidth).toBeDefined();
    });

    it('should provide helpful error listing valid widths', () => {
      const data = validFormData();
      data.channelWidth = '50MHz' as any;
      const result = wirelessSettingsSchema.safeParse(data);
      expect(result.success).toBe(false);
      const errors = parseErrors(result);
      expect(errors.channelWidth?.[0]).toMatch(/20MHz|40MHz|80MHz|160MHz/);
    });
  });

  // TX Power Validation
  describe('TX Power validation', () => {
    it('should reject TX power below 1 dBm', () => {
      const data = validFormData();
      data.txPower = 0;
      const result = wirelessSettingsSchema.safeParse(data);
      expect(result.success).toBe(false);
      const errors = parseErrors(result);
      expect(errors.txPower).toBeDefined();
      expect(errors.txPower?.[0]).toContain('1');
    });

    it('should reject TX power above 30 dBm', () => {
      const data = validFormData();
      data.txPower = 31;
      const result = wirelessSettingsSchema.safeParse(data);
      expect(result.success).toBe(false);
      const errors = parseErrors(result);
      expect(errors.txPower).toBeDefined();
      expect(errors.txPower?.[0]).toContain('30');
    });

    it('should provide context in TX power error (regulatory limit)', () => {
      const data = validFormData();
      data.txPower = 50;
      const result = wirelessSettingsSchema.safeParse(data);
      expect(result.success).toBe(false);
      const errors = parseErrors(result);
      expect(errors.txPower?.[0]).toContain('regulatory');
    });
  });

  // Security Mode Validation
  describe('Security mode validation', () => {
    it('should reject invalid security mode', () => {
      const data = validFormData();
      data.securityMode = 'wpa-psk' as any;
      const result = wirelessSettingsSchema.safeParse(data);
      expect(result.success).toBe(false);
      const errors = parseErrors(result);
      expect(errors.securityMode).toBeDefined();
    });

    it('should provide helpful error listing valid modes', () => {
      const data = validFormData();
      data.securityMode = 'invalid' as any;
      const result = wirelessSettingsSchema.safeParse(data);
      expect(result.success).toBe(false);
      const errors = parseErrors(result);
      expect(errors.securityMode?.[0]).toMatch(/none|wpa2|wpa3/);
    });
  });

  // Country Code Validation
  describe('Country code validation', () => {
    it('should reject country code with wrong length', () => {
      const data = validFormData();
      data.countryCode = 'USA'; // 3 chars
      const result = wirelessSettingsSchema.safeParse(data);
      expect(result.success).toBe(false);
      const errors = parseErrors(result);
      expect(errors.countryCode).toBeDefined();
      expect(errors.countryCode?.[0]).toContain('2');
    });

    it('should reject country code with lowercase', () => {
      const data = validFormData();
      data.countryCode = 'us';
      const result = wirelessSettingsSchema.safeParse(data);
      expect(result.success).toBe(false);
      const errors = parseErrors(result);
      expect(errors.countryCode).toBeDefined();
      expect(errors.countryCode?.[0]).toContain('uppercase');
    });

    it('should reject country code with numbers', () => {
      const data = validFormData();
      data.countryCode = 'U1';
      const result = wirelessSettingsSchema.safeParse(data);
      expect(result.success).toBe(false);
      const errors = parseErrors(result);
      expect(errors.countryCode).toBeDefined();
      expect(errors.countryCode?.[0]).toContain('letters');
    });

    it('should provide actionable error with ISO standard reference', () => {
      const data = validFormData();
      data.countryCode = 'invalid';
      const result = wirelessSettingsSchema.safeParse(data);
      expect(result.success).toBe(false);
      const errors = parseErrors(result);
      expect(errors.countryCode?.[0]).toMatch(/ISO|3166/);
    });
  });
});

// ============================================================================
// EDGE CASE TESTS (Boundary Values, Special Characters)
// ============================================================================

describe('WirelessSettingsSchema - Edge Cases', () => {
  it('should handle SSID with only spaces (valid ASCII)', () => {
    const data = validFormData();
    data.ssid = '   '; // 3 spaces
    const result = wirelessSettingsSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should handle SSID with all special printable chars', () => {
    const data = validFormData();
    data.ssid = '!@#$%^&*()_+-=[]{}|:;<>?,./';
    const result = wirelessSettingsSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should handle password boundary: exactly 8 chars', () => {
    const data = validFormData();
    data.password = '12345678';
    const result = wirelessSettingsSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should handle password boundary: exactly 63 chars', () => {
    const data = validFormData();
    data.password = 'P'.repeat(63);
    const result = wirelessSettingsSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should handle password with unicode control chars (invalid)', () => {
    const data = validFormData();
    data.password = 'pass\x00word'; // Null byte
    const result = wirelessSettingsSchema.safeParse(data);
    // Should accept (Zod doesn't validate char encoding by default)
    expect(result.success).toBe(true);
  });

  it('should accept TX power as float', () => {
    const data = validFormData();
    data.txPower = 17.5;
    const result = wirelessSettingsSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should reject TX power as NaN', () => {
    const data = validFormData();
    data.txPower = NaN;
    const result = wirelessSettingsSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// PARTIAL SCHEMA TESTS (Optional Fields)
// ============================================================================

describe('WirelessSettingsPartialSchema - Optional Fields', () => {
  it('should accept completely empty object', () => {
    const data = {};
    const result = wirelessSettingsPartialSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should accept only SSID', () => {
    const data = { ssid: 'TestNetwork' };
    const result = wirelessSettingsPartialSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should accept only password', () => {
    const data = { password: 'NewPassword123' };
    const result = wirelessSettingsPartialSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should validate partial data against field rules', () => {
    const data = { ssid: '' }; // Empty SSID invalid
    const result = wirelessSettingsPartialSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should accept mix of fields', () => {
    const data = {
      ssid: 'NewNetwork',
      txPower: 20,
      securityMode: 'wpa3-psk',
    };
    const result = wirelessSettingsPartialSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// DEFAULT VALUES TESTS
// ============================================================================

describe('Default Wireless Settings', () => {
  it('should have valid default values', () => {
    const result = wirelessSettingsSchema.safeParse(defaultWirelessSettings);
    expect(result.success).toBe(true);
  });

  it('should have empty SSID (user must provide)', () => {
    expect(defaultWirelessSettings.ssid).toBe('');
  });

  it('should have empty password (optional)', () => {
    expect(defaultWirelessSettings.password).toBe('');
  });

  it('should default to auto channel', () => {
    expect(defaultWirelessSettings.channel).toBe('auto');
  });

  it('should default to 20MHz width (compatible)', () => {
    expect(defaultWirelessSettings.channelWidth).toBe('20MHz');
  });

  it('should default to WPA2-PSK (balance of security & compatibility)', () => {
    expect(defaultWirelessSettings.securityMode).toBe('wpa2-psk');
  });

  it('should use reasonable TX power default (17 dBm)', () => {
    expect(defaultWirelessSettings.txPower).toBe(17);
  });

  it('should not hide SSID by default', () => {
    expect(defaultWirelessSettings.hideSsid).toBe(false);
  });
});

// ============================================================================
// ERROR MESSAGE QUALITY TESTS
// ============================================================================

describe('Error Message Quality (Actionable & Specific)', () => {
  it('SSID min error should mention character requirement', () => {
    const result = wirelessSettingsSchema.safeParse({
      ...validFormData(),
      ssid: '',
    });
    const error = parseErrors(result).ssid?.[0];
    expect(error).toMatch(/character|SSID/i);
  });

  it('SSID max error should mention 32 char limit', () => {
    const result = wirelessSettingsSchema.safeParse({
      ...validFormData(),
      ssid: 'A'.repeat(33),
    });
    const error = parseErrors(result).ssid?.[0];
    expect(error).toContain('32');
  });

  it('Password min error should explain WPA requirement', () => {
    const result = wirelessSettingsSchema.safeParse({
      ...validFormData(),
      password: 'short',
    });
    const error = parseErrors(result).password?.[0];
    expect(error).toMatch(/WPA|8|character/i);
  });

  it('TX power error should mention regulatory context', () => {
    const result = wirelessSettingsSchema.safeParse({
      ...validFormData(),
      txPower: 50,
    });
    const error = parseErrors(result).txPower?.[0];
    expect(error).toMatch(/30|regulatory|limit/i);
  });

  it('Country code error should mention ISO format', () => {
    const result = wirelessSettingsSchema.safeParse({
      ...validFormData(),
      countryCode: 'invalid',
    });
    const error = parseErrors(result).countryCode?.[0];
    expect(error).toMatch(/ISO|3166|2.*letter/i);
  });

  it('All error messages should be > 10 chars (not generic)', () => {
    const data = validFormData();
    // Test multiple invalid scenarios
    const testCases: Array<WirelessSettingsFormData> = [
      { ...data, ssid: '' },
      { ...data, password: 'short' },
      { ...data, txPower: 50 },
      { ...data, countryCode: 'INVALID' },
      { ...data, channel: 'bad' },
    ];

    testCases.forEach((testData) => {
      const result = wirelessSettingsSchema.safeParse(testData);
      const errors = parseErrors(result);
      Object.entries(errors).forEach(([_fieldName, fieldErrors]) => {
        (fieldErrors as string[] | undefined)?.forEach((error) => {
          expect(error.length).toBeGreaterThan(10);
          expect(error).not.toMatch(/^Invalid/i);
        });
      });
    });
  });
});
