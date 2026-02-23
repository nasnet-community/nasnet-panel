/**
 * Unit tests for wirelessOptions data module
 * Tests all exported functions and data structures
 */

import { describe, it, expect } from 'vitest';
import {
  CHANNELS_2_4GHZ,
  CHANNELS_5GHZ,
  CHANNELS_6GHZ,
  CHANNEL_WIDTH_OPTIONS,
  COUNTRY_OPTIONS,
  SECURITY_MODE_OPTIONS,
  TX_POWER_OPTIONS,
  getChannelsByBand,
  getChannelWidthsByBand,
  getCountryName,
} from './wirelessOptions';

describe('wirelessOptions', () => {
  describe('Channel Data', () => {
    it('should have valid 2.4GHz channels', () => {
      expect(CHANNELS_2_4GHZ).toBeDefined();
      expect(CHANNELS_2_4GHZ.length).toBeGreaterThan(0);
      expect(CHANNELS_2_4GHZ[0].value).toBe('auto');
    });

    it('should have valid 5GHz channels', () => {
      expect(CHANNELS_5GHZ).toBeDefined();
      expect(CHANNELS_5GHZ.length).toBeGreaterThan(0);
      expect(CHANNELS_5GHZ[0].value).toBe('auto');
    });

    it('should have valid 6GHz channels', () => {
      expect(CHANNELS_6GHZ).toBeDefined();
      expect(CHANNELS_6GHZ.length).toBeGreaterThan(0);
      expect(CHANNELS_6GHZ[0].value).toBe('auto');
    });

    it('all 2.4GHz channels should have frequency data', () => {
      const nonAutoChannels = CHANNELS_2_4GHZ.filter((c) => c.value !== 'auto');
      nonAutoChannels.forEach((channel) => {
        expect(channel.frequency).toBeDefined();
        expect(typeof channel.frequency).toBe('number');
        expect(channel.frequency).toBeGreaterThan(2400);
        expect(channel.frequency).toBeLessThan(2500);
      });
    });

    it('all 5GHz channels should have frequency data', () => {
      const nonAutoChannels = CHANNELS_5GHZ.filter((c) => c.value !== 'auto');
      nonAutoChannels.forEach((channel) => {
        expect(channel.frequency).toBeDefined();
        expect(typeof channel.frequency).toBe('number');
        expect(channel.frequency).toBeGreaterThan(5000);
        expect(channel.frequency).toBeLessThan(6000);
      });
    });
  });

  describe('getChannelsByBand', () => {
    it('should return 2.4GHz channels for 2.4GHz band', () => {
      const channels = getChannelsByBand('2.4GHz');
      expect(channels).toEqual(CHANNELS_2_4GHZ);
    });

    it('should return 5GHz channels for 5GHz band', () => {
      const channels = getChannelsByBand('5GHz');
      expect(channels).toEqual(CHANNELS_5GHZ);
    });

    it('should return 6GHz channels for 6GHz band', () => {
      const channels = getChannelsByBand('6GHz');
      expect(channels).toEqual(CHANNELS_6GHZ);
    });

    it('should return auto channel for unknown band', () => {
      const channels = getChannelsByBand('unknown' as any);
      expect(channels).toEqual([{ value: 'auto', label: 'Auto' }]);
    });
  });

  describe('Channel Width Options', () => {
    it('should have valid channel width options', () => {
      expect(CHANNEL_WIDTH_OPTIONS).toBeDefined();
      expect(CHANNEL_WIDTH_OPTIONS.length).toBeGreaterThan(0);
    });

    it('all channel widths should have supported bands', () => {
      CHANNEL_WIDTH_OPTIONS.forEach((option) => {
        expect(option.value).toBeDefined();
        expect(option.label).toBeDefined();
        expect(option.supportedBands).toBeDefined();
        expect(option.supportedBands.length).toBeGreaterThan(0);
      });
    });

    it('20MHz should support all bands', () => {
      const option20MHz = CHANNEL_WIDTH_OPTIONS.find((o) => o.value === '20MHz');
      expect(option20MHz?.supportedBands).toContain('2.4GHz');
      expect(option20MHz?.supportedBands).toContain('5GHz');
      expect(option20MHz?.supportedBands).toContain('6GHz');
    });

    it('160MHz should only support 5GHz and 6GHz', () => {
      const option160MHz = CHANNEL_WIDTH_OPTIONS.find((o) => o.value === '160MHz');
      expect(option160MHz?.supportedBands).not.toContain('2.4GHz');
      expect(option160MHz?.supportedBands).toContain('5GHz');
      expect(option160MHz?.supportedBands).toContain('6GHz');
    });
  });

  describe('getChannelWidthsByBand', () => {
    it('should return valid widths for 2.4GHz', () => {
      const widths = getChannelWidthsByBand('2.4GHz');
      expect(widths.length).toBeGreaterThan(0);
      expect(widths.every((w) => w.supportedBands.includes('2.4GHz'))).toBe(true);
    });

    it('should return valid widths for 5GHz', () => {
      const widths = getChannelWidthsByBand('5GHz');
      expect(widths.length).toBeGreaterThan(0);
      expect(widths.every((w) => w.supportedBands.includes('5GHz'))).toBe(true);
    });

    it('should return valid widths for 6GHz', () => {
      const widths = getChannelWidthsByBand('6GHz');
      expect(widths.length).toBeGreaterThan(0);
      expect(widths.every((w) => w.supportedBands.includes('6GHz'))).toBe(true);
    });

    it('2.4GHz should have fewer options than 5GHz', () => {
      const widths24 = getChannelWidthsByBand('2.4GHz');
      const widths5 = getChannelWidthsByBand('5GHz');
      expect(widths24.length).toBeLessThanOrEqual(widths5.length);
    });
  });

  describe('Security Mode Options', () => {
    it('should have valid security mode options', () => {
      expect(SECURITY_MODE_OPTIONS).toBeDefined();
      expect(SECURITY_MODE_OPTIONS.length).toBeGreaterThan(0);
    });

    it('all security modes should have value, label, and description', () => {
      SECURITY_MODE_OPTIONS.forEach((option) => {
        expect(option.value).toBeDefined();
        expect(option.label).toBeDefined();
        expect(option.description).toBeDefined();
        expect(typeof option.label).toBe('string');
        expect(typeof option.description).toBe('string');
      });
    });

    it('should have WPA2-Personal option', () => {
      const wpa2 = SECURITY_MODE_OPTIONS.find((o) => o.value === 'wpa2-psk');
      expect(wpa2).toBeDefined();
      expect(wpa2?.label).toContain('WPA2');
    });

    it('should have WPA3-Personal option', () => {
      const wpa3 = SECURITY_MODE_OPTIONS.find((o) => o.value === 'wpa3-psk');
      expect(wpa3).toBeDefined();
      expect(wpa3?.label).toContain('WPA3');
    });

    it('should have Open (no security) option', () => {
      const open = SECURITY_MODE_OPTIONS.find((o) => o.value === 'none');
      expect(open).toBeDefined();
      expect(open?.label.toLowerCase()).toContain('open');
    });
  });

  describe('Country Options', () => {
    it('should have valid country options', () => {
      expect(COUNTRY_OPTIONS).toBeDefined();
      expect(COUNTRY_OPTIONS.length).toBeGreaterThan(0);
    });

    it('all countries should have code and name', () => {
      COUNTRY_OPTIONS.forEach((option) => {
        expect(option.code).toBeDefined();
        expect(option.name).toBeDefined();
        expect(typeof option.code).toBe('string');
        expect(typeof option.name).toBe('string');
        expect(option.code.length).toBe(2);
      });
    });

    it('countries should be sorted alphabetically', () => {
      const names = COUNTRY_OPTIONS.map((c) => c.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });

    it('should have common countries', () => {
      const codes = COUNTRY_OPTIONS.map((c) => c.code);
      expect(codes).toContain('US');
      expect(codes).toContain('GB');
      expect(codes).toContain('DE');
      expect(codes).toContain('JP');
      expect(codes).toContain('CN');
    });
  });

  describe('getCountryName', () => {
    it('should return country name for valid code', () => {
      expect(getCountryName('US')).toBe('United States');
      expect(getCountryName('GB')).toBe('United Kingdom');
      expect(getCountryName('JP')).toBe('Japan');
    });

    it('should return code itself for invalid code', () => {
      expect(getCountryName('XX')).toBe('XX');
      expect(getCountryName('INVALID')).toBe('INVALID');
    });

    it('should be case-sensitive', () => {
      expect(getCountryName('us')).toBe('us');
      expect(getCountryName('Us')).toBe('Us');
    });
  });

  describe('TX Power Options', () => {
    it('should have valid TX power options', () => {
      expect(TX_POWER_OPTIONS).toBeDefined();
      expect(TX_POWER_OPTIONS.length).toBeGreaterThan(0);
    });

    it('all TX power options should have value and label', () => {
      TX_POWER_OPTIONS.forEach((option) => {
        expect(option.value).toBeDefined();
        expect(option.label).toBeDefined();
        expect(typeof option.value).toBe('number');
        expect(typeof option.label).toBe('string');
        expect(option.value).toBeGreaterThan(0);
      });
    });

    it('should have reasonable dBm range', () => {
      TX_POWER_OPTIONS.forEach((option) => {
        expect(option.value).toBeGreaterThanOrEqual(1);
        expect(option.value).toBeLessThanOrEqual(30);
      });
    });

    it('should include default 17 dBm option', () => {
      const defaultOption = TX_POWER_OPTIONS.find((o) => o.value === 17);
      expect(defaultOption).toBeDefined();
      expect(defaultOption?.label).toContain('Default');
    });
  });
});
