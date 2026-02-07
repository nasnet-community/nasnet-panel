/**
 * Device Type Detection Tests
 * Epic 5 - Story 5.4: DHCP Leases and Active Connections Display
 */

import { describe, it, expect } from 'vitest';
import { DeviceType } from '@nasnet/core/types';
import {
  detectDeviceType,
  DEVICE_TYPE_ICONS,
  DEVICE_TYPE_LABELS,
} from './deviceTypeDetection';

describe('detectDeviceType', () => {
  describe('Smartphone detection', () => {
    it('should detect iPhone from hostname', () => {
      expect(detectDeviceType('Johns-iPhone', null)).toBe(DeviceType.SMARTPHONE);
      expect(detectDeviceType('iPhone-14-Pro', null)).toBe(DeviceType.SMARTPHONE);
    });

    it('should detect Android devices from hostname', () => {
      expect(detectDeviceType('Galaxy-S23', null)).toBe(DeviceType.SMARTPHONE);
      expect(detectDeviceType('Pixel-7', null)).toBe(DeviceType.SMARTPHONE);
      expect(detectDeviceType('OnePlus-9', null)).toBe(DeviceType.SMARTPHONE);
      expect(detectDeviceType('Xiaomi-Redmi', null)).toBe(DeviceType.SMARTPHONE);
    });

    it('should detect smartphone from Apple vendor', () => {
      expect(detectDeviceType(null, 'Apple')).toBe(DeviceType.SMARTPHONE);
    });

    it('should detect smartphone from Samsung vendor', () => {
      expect(detectDeviceType(null, 'Samsung Electronics')).toBe(DeviceType.SMARTPHONE);
    });
  });

  describe('Tablet detection', () => {
    it('should detect iPad from hostname', () => {
      expect(detectDeviceType('Marys-iPad', null)).toBe(DeviceType.TABLET);
      expect(detectDeviceType('iPad-Pro-2023', null)).toBe(DeviceType.TABLET);
    });

    it('should detect generic tablets from hostname', () => {
      expect(detectDeviceType('Galaxy-Tab-S9', null)).toBe(DeviceType.TABLET);
      expect(detectDeviceType('Kindle-Fire', null)).toBe(DeviceType.TABLET);
    });
  });

  describe('Laptop detection', () => {
    it('should detect MacBook from hostname', () => {
      expect(detectDeviceType('Johns-MacBook-Pro', null)).toBe(DeviceType.LAPTOP);
      expect(detectDeviceType('MacBook-Air-2023', null)).toBe(DeviceType.LAPTOP);
    });

    it('should detect PC laptops from hostname', () => {
      expect(detectDeviceType('ThinkPad-X1', null)).toBe(DeviceType.LAPTOP);
      expect(detectDeviceType('Dell-XPS-15', null)).toBe(DeviceType.LAPTOP);
      expect(detectDeviceType('Surface-Laptop', null)).toBe(DeviceType.LAPTOP);
      expect(detectDeviceType('ASUS-ZenBook', null)).toBe(DeviceType.LAPTOP);
    });

    it('should detect laptop from vendor', () => {
      expect(detectDeviceType(null, 'Dell')).toBe(DeviceType.LAPTOP);
      expect(detectDeviceType(null, 'Lenovo')).toBe(DeviceType.LAPTOP);
      expect(detectDeviceType(null, 'HP')).toBe(DeviceType.LAPTOP);
    });
  });

  describe('Desktop detection', () => {
    it('should detect iMac from hostname', () => {
      expect(detectDeviceType('iMac-27', null)).toBe(DeviceType.DESKTOP);
      expect(detectDeviceType('Mac-Mini', null)).toBe(DeviceType.DESKTOP);
      expect(detectDeviceType('Mac-Pro', null)).toBe(DeviceType.DESKTOP);
    });

    it('should detect PC desktops from hostname', () => {
      expect(detectDeviceType('Desktop-PC', null)).toBe(DeviceType.DESKTOP);
      expect(detectDeviceType('Workstation-1', null)).toBe(DeviceType.DESKTOP);
    });

    it('should detect desktop from Microsoft vendor', () => {
      expect(detectDeviceType(null, 'Microsoft')).toBe(DeviceType.DESKTOP);
    });
  });

  describe('Printer detection', () => {
    it('should detect printers from hostname', () => {
      expect(detectDeviceType('HP-LaserJet', null)).toBe(DeviceType.PRINTER);
      expect(detectDeviceType('Canon-Printer', null)).toBe(DeviceType.PRINTER);
      expect(detectDeviceType('Epson-XP-440', null)).toBe(DeviceType.PRINTER);
      expect(detectDeviceType('Brother-MFC', null)).toBe(DeviceType.PRINTER);
    });

    it('should detect printer from vendor', () => {
      expect(detectDeviceType(null, 'Hewlett Packard')).toBe(DeviceType.PRINTER);
      expect(detectDeviceType(null, 'Canon')).toBe(DeviceType.PRINTER);
      expect(detectDeviceType(null, 'Epson')).toBe(DeviceType.PRINTER);
    });
  });

  describe('TV detection', () => {
    it('should detect smart TVs from hostname', () => {
      expect(detectDeviceType('Roku-TV', null)).toBe(DeviceType.TV);
      expect(detectDeviceType('Apple-TV', null)).toBe(DeviceType.TV);
      expect(detectDeviceType('Fire-TV', null)).toBe(DeviceType.TV);
      expect(detectDeviceType('Chromecast', null)).toBe(DeviceType.TV);
      expect(detectDeviceType('Samsung-TV', null)).toBe(DeviceType.TV);
    });

    it('should detect TV from vendor', () => {
      expect(detectDeviceType(null, 'Sony')).toBe(DeviceType.TV);
      expect(detectDeviceType(null, 'LG Electronics')).toBe(DeviceType.TV);
      expect(detectDeviceType(null, 'TCL')).toBe(DeviceType.TV);
    });
  });

  describe('Gaming console detection', () => {
    it('should detect gaming consoles from hostname', () => {
      expect(detectDeviceType('PlayStation-5', null)).toBe(DeviceType.GAMING_CONSOLE);
      expect(detectDeviceType('Xbox-Series-X', null)).toBe(DeviceType.GAMING_CONSOLE);
      expect(detectDeviceType('Nintendo-Switch', null)).toBe(DeviceType.GAMING_CONSOLE);
      expect(detectDeviceType('Steam-Deck', null)).toBe(DeviceType.GAMING_CONSOLE);
    });
  });

  describe('IoT detection', () => {
    it('should detect IoT devices from hostname', () => {
      expect(detectDeviceType('ESP32-Sensor', null)).toBe(DeviceType.IOT);
      expect(detectDeviceType('Tasmota-Plug', null)).toBe(DeviceType.IOT);
      expect(detectDeviceType('Shelly-Switch', null)).toBe(DeviceType.IOT);
      expect(detectDeviceType('Nest-Thermostat', null)).toBe(DeviceType.IOT);
      expect(detectDeviceType('Ring-Doorbell', null)).toBe(DeviceType.IOT);
    });

    it('should detect IoT from vendor', () => {
      expect(detectDeviceType(null, 'Espressif')).toBe(DeviceType.IOT);
      expect(detectDeviceType(null, 'Raspberry Pi')).toBe(DeviceType.IOT);
    });
  });

  describe('Router detection', () => {
    it('should detect routers from hostname', () => {
      expect(detectDeviceType('MikroTik-RB5009', null)).toBe(DeviceType.ROUTER);
      expect(detectDeviceType('Ubiquiti-AP', null)).toBe(DeviceType.ROUTER);
      expect(detectDeviceType('UniFi-Gateway', null)).toBe(DeviceType.ROUTER);
      expect(detectDeviceType('TP-Link-Router', null)).toBe(DeviceType.ROUTER);
    });

    it('should detect router from vendor', () => {
      expect(detectDeviceType(null, 'Ubiquiti')).toBe(DeviceType.ROUTER);
      expect(detectDeviceType(null, 'MikroTik')).toBe(DeviceType.ROUTER);
      expect(detectDeviceType(null, 'TP-Link')).toBe(DeviceType.ROUTER);
    });
  });

  describe('Unknown device detection', () => {
    it('should return UNKNOWN for unrecognized hostname', () => {
      expect(detectDeviceType('unknown-device', null)).toBe(DeviceType.UNKNOWN);
      expect(detectDeviceType('random-123', null)).toBe(DeviceType.UNKNOWN);
    });

    it('should return UNKNOWN for unrecognized vendor', () => {
      expect(detectDeviceType(null, 'Unknown Vendor')).toBe(DeviceType.UNKNOWN);
    });

    it('should return UNKNOWN when both hostname and vendor are null', () => {
      expect(detectDeviceType(null, null)).toBe(DeviceType.UNKNOWN);
      expect(detectDeviceType(undefined, undefined)).toBe(DeviceType.UNKNOWN);
    });
  });

  describe('Priority: hostname over vendor', () => {
    it('should prioritize hostname pattern over vendor hint', () => {
      // iPhone hostname should win over Dell vendor
      expect(detectDeviceType('Johns-iPhone', 'Dell')).toBe(DeviceType.SMARTPHONE);

      // Printer hostname should win over Apple vendor
      expect(detectDeviceType('HP-Printer', 'Apple')).toBe(DeviceType.PRINTER);
    });
  });
});

describe('DEVICE_TYPE_ICONS', () => {
  it('should have icon for every DeviceType', () => {
    const deviceTypes = Object.values(DeviceType);
    deviceTypes.forEach((type) => {
      expect(DEVICE_TYPE_ICONS[type]).toBeDefined();
      expect(typeof DEVICE_TYPE_ICONS[type]).toBe('string');
    });
  });

  it('should use valid Lucide icon names', () => {
    expect(DEVICE_TYPE_ICONS[DeviceType.SMARTPHONE]).toBe('Smartphone');
    expect(DEVICE_TYPE_ICONS[DeviceType.LAPTOP]).toBe('Laptop');
    expect(DEVICE_TYPE_ICONS[DeviceType.UNKNOWN]).toBe('HelpCircle');
  });
});

describe('DEVICE_TYPE_LABELS', () => {
  it('should have label for every DeviceType', () => {
    const deviceTypes = Object.values(DeviceType);
    deviceTypes.forEach((type) => {
      expect(DEVICE_TYPE_LABELS[type]).toBeDefined();
      expect(typeof DEVICE_TYPE_LABELS[type]).toBe('string');
      expect(DEVICE_TYPE_LABELS[type].length).toBeGreaterThan(0);
    });
  });

  it('should have human-readable labels', () => {
    expect(DEVICE_TYPE_LABELS[DeviceType.SMARTPHONE]).toBe('Smartphone');
    expect(DEVICE_TYPE_LABELS[DeviceType.IOT]).toBe('IoT Device');
    expect(DEVICE_TYPE_LABELS[DeviceType.GAMING_CONSOLE]).toBe('Gaming Console');
  });
});
