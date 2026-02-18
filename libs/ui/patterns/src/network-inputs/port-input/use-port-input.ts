/**
 * usePortInput - Headless Port Input Hook
 *
 * Contains all business logic for port input validation, parsing,
 * service lookup, and suggestions. Used by both desktop and mobile presenters.
 *
 * Features:
 * - Single port validation (1-65535)
 * - Port range validation (start ≤ end)
 * - Multi-port parsing with deduplication
 * - Service name lookup from well-known ports database
 * - Suggestions with category grouping
 * - Session-based recent ports tracking
 *
 * @module @nasnet/ui/patterns/network-inputs/port-input
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

import {
  getServiceByPort,
  getSuggestionsByCategory,
  searchPorts,
  type PortProtocol as WellKnownPortProtocol,
} from '@nasnet/core/constants';
import { expandGroupToPorts, type ServiceGroup } from '@nasnet/core/types';

import type {
  PortMode,
  PortRange,
  PortSuggestion,
  UsePortInputConfig,
  UsePortInputReturn,
} from './port-input.types';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_MIN_PORT = 1;
const DEFAULT_MAX_PORT = 65535;
const MAX_RECENT_PORTS = 5;

// Session-level recent ports storage
let recentPorts: number[] = [];

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Check if a port number is valid within the given bounds.
 */
export function isValidPort(
  port: number,
  min = DEFAULT_MIN_PORT,
  max = DEFAULT_MAX_PORT
): boolean {
  return Number.isInteger(port) && port >= min && port <= max;
}

/**
 * Parse a single port from string input.
 * Returns null if invalid.
 */
export function parseSinglePort(
  input: string,
  min = DEFAULT_MIN_PORT,
  max = DEFAULT_MAX_PORT
): number | null {
  const trimmed = input.trim();
  if (trimmed === '') return null;

  // Check for non-numeric characters
  if (!/^\d+$/.test(trimmed)) return null;

  const port = parseInt(trimmed, 10);
  if (isNaN(port) || !isValidPort(port, min, max)) return null;

  return port;
}

/**
 * Parse a port range from string input (e.g., "8080-8090").
 * Returns null if invalid.
 */
export function parsePortRange(
  input: string,
  min = DEFAULT_MIN_PORT,
  max = DEFAULT_MAX_PORT
): PortRange | null {
  const trimmed = input.trim();

  // Handle single port as range
  if (!trimmed.includes('-')) {
    const port = parseSinglePort(trimmed, min, max);
    if (port === null) return null;
    return { start: port, end: port };
  }

  const parts = trimmed.split('-');
  if (parts.length !== 2) return null;

  const start = parseSinglePort(parts[0], min, max);
  const end = parseSinglePort(parts[1], min, max);

  if (start === null || end === null) return null;
  if (start > end) return null; // Invalid: start must be <= end

  return { start, end };
}

/**
 * Parse multiple ports from comma-separated string input.
 * Returns array of valid ports, deduplicates, and sorts.
 */
export function parseMultiPorts(
  input: string,
  min = DEFAULT_MIN_PORT,
  max = DEFAULT_MAX_PORT
): number[] {
  const trimmed = input.trim();
  if (trimmed === '') return [];

  const parts = trimmed.split(',');
  const validPorts = new Set<number>();

  parts.forEach((part) => {
    const port = parseSinglePort(part, min, max);
    if (port !== null) {
      validPorts.add(port);
    }
  });

  return Array.from(validPorts).sort((a, b) => a - b);
}

/**
 * Get validation error message for a port input.
 */
export function getPortValidationError(
  input: string,
  mode: PortMode,
  min = DEFAULT_MIN_PORT,
  max = DEFAULT_MAX_PORT
): string | null {
  const trimmed = input.trim();
  if (trimmed === '') return null; // Empty is valid (optional field)

  if (mode === 'single') {
    // Check for non-numeric characters
    if (!/^\d+$/.test(trimmed)) {
      return 'Port must be a number';
    }

    const port = parseInt(trimmed, 10);
    if (isNaN(port)) return 'Port must be a number';
    if (port < min) return `Port must be >= ${min}`;
    if (port > max) return `Port must be <= ${max}`;
    return null;
  }

  if (mode === 'range') {
    if (!trimmed.includes('-')) {
      // Single port in range mode
      return getPortValidationError(trimmed, 'single', min, max);
    }

    const parts = trimmed.split('-');
    if (parts.length !== 2) {
      return 'Invalid range format (use start-end)';
    }

    const startError = getPortValidationError(parts[0], 'single', min, max);
    if (startError) return `Start: ${startError}`;

    const endError = getPortValidationError(parts[1], 'single', min, max);
    if (endError) return `End: ${endError}`;

    const start = parseInt(parts[0], 10);
    const end = parseInt(parts[1], 10);

    if (start > end) {
      return 'Start port must be <= end port';
    }

    return null;
  }

  if (mode === 'multi') {
    const parts = trimmed.split(',');
    const errors: string[] = [];

    parts.forEach((part, index) => {
      const error = getPortValidationError(part, 'single', min, max);
      if (error) {
        errors.push(`Port ${index + 1}: ${error}`);
      }
    });

    if (errors.length > 0) {
      return errors[0]; // Return first error only for brevity
    }

    return null;
  }

  return null;
}

/**
 * Format a port value for display.
 */
export function formatPortDisplay(
  value: number | PortRange | number[] | null,
  mode: PortMode,
  serviceName?: string | null
): string {
  if (value === null) return '';

  if (mode === 'single' && typeof value === 'number') {
    return serviceName ? `${value} (${serviceName})` : `${value}`;
  }

  if (mode === 'range' && typeof value === 'object' && 'start' in value) {
    const count = value.end - value.start + 1;
    return `${value.start}-${value.end} (${count} port${count !== 1 ? 's' : ''})`;
  }

  if (mode === 'multi' && Array.isArray(value)) {
    return value.length > 0
      ? `${value.join(', ')} (${value.length} port${value.length !== 1 ? 's' : ''})`
      : '';
  }

  return '';
}

/**
 * Add a port to the recent ports list.
 */
function addToRecentPorts(port: number): void {
  // Remove if already exists
  recentPorts = recentPorts.filter((p) => p !== port);
  // Add to front
  recentPorts.unshift(port);
  // Keep only MAX_RECENT_PORTS
  recentPorts = recentPorts.slice(0, MAX_RECENT_PORTS);
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Headless hook for port input logic.
 *
 * @param config - Configuration options
 * @returns State and handlers for port input presenters
 */
export function usePortInput(config: UsePortInputConfig = {}): UsePortInputReturn {
  const {
    value: controlledValue,
    onChange,
    mode = 'single',
    protocol = 'tcp',
    showService = true,
    showSuggestions: enableSuggestions = false,
    serviceGroups,
    min = DEFAULT_MIN_PORT,
    max = DEFAULT_MAX_PORT,
  } = config;

  // ============================================================================
  // State
  // ============================================================================

  // Internal state for uncontrolled mode
  const [internalValue, setInternalValue] = useState<string>(() => {
    if (controlledValue === undefined) return '';
    if (typeof controlledValue === 'number') return String(controlledValue);
    return String(controlledValue);
  });

  // Range mode state
  const [rangeStartValue, setRangeStartValue] = useState<string>(() => {
    if (mode !== 'range' || controlledValue === undefined) return '';
    if (typeof controlledValue === 'string' && controlledValue.includes('-')) {
      const [start] = controlledValue.split('-');
      return start || '';
    }
    return String(controlledValue);
  });

  const [rangeEndValue, setRangeEndValue] = useState<string>(() => {
    if (mode !== 'range' || controlledValue === undefined) return '';
    if (typeof controlledValue === 'string' && controlledValue.includes('-')) {
      const [, end] = controlledValue.split('-');
      return end || '';
    }
    return '';
  });

  // Multi mode state
  const [multiPorts, setMultiPorts] = useState<number[]>(() => {
    if (mode !== 'multi' || controlledValue === undefined) return [];
    if (typeof controlledValue === 'string') {
      return parseMultiPorts(controlledValue, min, max);
    }
    return [];
  });
  const [multiInputValue, setMultiInputValue] = useState<string>('');

  // Suggestions state
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const rangeStartRef = useRef<HTMLInputElement>(null);
  const rangeEndRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // Determine current input value
  // ============================================================================

  const inputValue = useMemo(() => {
    if (controlledValue !== undefined) {
      if (typeof controlledValue === 'number') return String(controlledValue);
      return String(controlledValue);
    }
    return internalValue;
  }, [controlledValue, internalValue]);

  // ============================================================================
  // Parse and Validate
  // ============================================================================

  const { port, portRange, ports, isValid, error, portCount } = useMemo(() => {
    if (mode === 'single') {
      const parsedPort = parseSinglePort(inputValue, min, max);
      const validationError = getPortValidationError(inputValue, mode, min, max);
      return {
        port: parsedPort,
        portRange: null,
        ports: [],
        isValid: validationError === null && (inputValue.trim() === '' || parsedPort !== null),
        error: validationError,
        portCount: parsedPort !== null ? 1 : 0,
      };
    }

    if (mode === 'range') {
      const rangeValue = rangeStartValue && rangeEndValue
        ? `${rangeStartValue}-${rangeEndValue}`
        : rangeStartValue || '';
      const parsedRange = parsePortRange(rangeValue, min, max);

      let validationError: string | null = null;
      if (rangeStartValue && rangeEndValue) {
        const startPort = parseSinglePort(rangeStartValue, min, max);
        const endPort = parseSinglePort(rangeEndValue, min, max);

        if (startPort === null && rangeStartValue.trim() !== '') {
          validationError = getPortValidationError(rangeStartValue, 'single', min, max);
          if (validationError) validationError = `Start: ${validationError}`;
        } else if (endPort === null && rangeEndValue.trim() !== '') {
          validationError = getPortValidationError(rangeEndValue, 'single', min, max);
          if (validationError) validationError = `End: ${validationError}`;
        } else if (startPort !== null && endPort !== null && startPort > endPort) {
          validationError = 'Start port must be <= end port';
        }
      } else if (rangeStartValue.trim() !== '' && !rangeEndValue) {
        validationError = getPortValidationError(rangeStartValue, 'single', min, max);
      }

      const count = parsedRange ? parsedRange.end - parsedRange.start + 1 : 0;

      return {
        port: null,
        portRange: parsedRange,
        ports: [],
        isValid: validationError === null,
        error: validationError,
        portCount: count,
      };
    }

    if (mode === 'multi') {
      // Multi mode uses multiPorts state
      return {
        port: null,
        portRange: null,
        ports: multiPorts,
        isValid: true, // Multi mode validates on add
        error: null,
        portCount: multiPorts.length,
      };
    }

    return {
      port: null,
      portRange: null,
      ports: [],
      isValid: true,
      error: null,
      portCount: 0,
    };
  }, [mode, inputValue, rangeStartValue, rangeEndValue, multiPorts, min, max]);

  // ============================================================================
  // Service Name Lookup
  // ============================================================================

  const serviceName = useMemo(() => {
    if (!showService || mode !== 'single' || port === null) {
      return null;
    }
    return getServiceByPort(port, protocol as WellKnownPortProtocol);
  }, [showService, mode, port, protocol]);

  // ============================================================================
  // Display Value
  // ============================================================================

  const displayValue = useMemo(() => {
    if (mode === 'single') {
      return formatPortDisplay(port, mode, serviceName);
    }
    if (mode === 'range') {
      return formatPortDisplay(portRange, mode);
    }
    if (mode === 'multi') {
      return formatPortDisplay(ports, mode);
    }
    return '';
  }, [mode, port, portRange, ports, serviceName]);

  // ============================================================================
  // Suggestions
  // ============================================================================

  const suggestions = useMemo((): PortSuggestion[] => {
    if (!enableSuggestions) return [];

    const allSuggestions: PortSuggestion[] = [];

    // Add service groups first (if provided and protocol matches)
    if (serviceGroups && serviceGroups.length > 0) {
      const matchingGroups = serviceGroups.filter(
        (group) => group.protocol === protocol || group.protocol === 'both'
      );

      matchingGroups.forEach((group) => {
        allSuggestions.push({
          port: 0, // Special marker for groups
          service: `${group.name} (${group.ports.length} ports)`,
          category: 'group',
          protocol: group.protocol,
          isGroup: true,
          groupData: group,
        });
      });
    }

    // Add recent ports
    if (recentPorts.length > 0) {
      recentPorts.forEach((p) => {
        const service = getServiceByPort(p) || 'Custom';
        allSuggestions.push({
          port: p,
          service,
          category: 'recent',
        });
      });
    }

    // If there's input, search for matching ports
    const searchQuery = mode === 'multi' ? multiInputValue : inputValue;
    if (searchQuery.trim()) {
      const searchResults = searchPorts(searchQuery, 10);
      searchResults.forEach((result) => {
        // Don't add duplicates from recent
        if (!allSuggestions.some((s) => s.port === result.port)) {
          allSuggestions.push({
            port: result.port,
            service: result.service,
            category: result.category as PortSuggestion['category'],
          });
        }
      });
    } else {
      // Show category suggestions when empty
      const categorySuggestions = getSuggestionsByCategory([
        'web',
        'secure',
        'database',
        'mikrotik',
      ]);

      Object.entries(categorySuggestions).forEach(([category, ports]) => {
        ports.forEach((p) => {
          // Don't add duplicates from recent
          if (!allSuggestions.some((s) => s.port === p.port)) {
            allSuggestions.push({
              port: p.port,
              service: p.service,
              category: category as PortSuggestion['category'],
            });
          }
        });
      });
    }

    return allSuggestions.slice(0, 15);
  }, [enableSuggestions, inputValue, multiInputValue, mode, serviceGroups, protocol]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;

      // Only allow digits
      if (newValue !== '' && !/^\d*$/.test(newValue)) {
        return;
      }

      setInternalValue(newValue);
      setSelectedSuggestionIndex(-1);

      if (onChange) {
        const parsed = parseSinglePort(newValue, min, max);
        onChange(parsed);
      }
    },
    [onChange, min, max]
  );

  const handleRangeStartChange = useCallback(
    (value: string) => {
      // Only allow digits
      if (value !== '' && !/^\d*$/.test(value)) {
        return;
      }

      setRangeStartValue(value);

      if (onChange) {
        const rangeStr = value && rangeEndValue ? `${value}-${rangeEndValue}` : value;
        onChange(rangeStr || null);
      }
    },
    [onChange, rangeEndValue]
  );

  const handleRangeEndChange = useCallback(
    (value: string) => {
      // Only allow digits
      if (value !== '' && !/^\d*$/.test(value)) {
        return;
      }

      setRangeEndValue(value);

      if (onChange) {
        const rangeStr = rangeStartValue && value ? `${rangeStartValue}-${value}` : rangeStartValue;
        onChange(rangeStr || null);
      }
    },
    [onChange, rangeStartValue]
  );

  const handleAddPort = useCallback(
    (newPort: number) => {
      if (!isValidPort(newPort, min, max)) return;

      // Add to recent ports
      addToRecentPorts(newPort);

      // Add to multiPorts if not already present
      if (!multiPorts.includes(newPort)) {
        const updatedPorts = [...multiPorts, newPort].sort((a, b) => a - b);
        setMultiPorts(updatedPorts);
        setMultiInputValue('');

        if (onChange) {
          onChange(updatedPorts.join(','));
        }
      }
    },
    [multiPorts, onChange, min, max]
  );

  const handleRemovePort = useCallback(
    (portToRemove: number) => {
      const updatedPorts = multiPorts.filter((p) => p !== portToRemove);
      setMultiPorts(updatedPorts);

      if (onChange) {
        onChange(updatedPorts.length > 0 ? updatedPorts.join(',') : null);
      }
    },
    [multiPorts, onChange]
  );

  const handleSelectSuggestion = useCallback(
    (selectedPort: number) => {
      // Add to recent ports
      addToRecentPorts(selectedPort);

      if (mode === 'single') {
        setInternalValue(String(selectedPort));
        if (onChange) {
          onChange(selectedPort);
        }
      } else if (mode === 'multi') {
        handleAddPort(selectedPort);
      } else if (mode === 'range') {
        // For range mode, add to start if empty, otherwise end
        if (!rangeStartValue) {
          handleRangeStartChange(String(selectedPort));
        } else {
          handleRangeEndChange(String(selectedPort));
        }
      }

      setShowSuggestionsDropdown(false);
      setSelectedSuggestionIndex(-1);
    },
    [mode, onChange, handleAddPort, rangeStartValue, handleRangeStartChange, handleRangeEndChange]
  );

  const handleSelectServiceGroup = useCallback(
    (group: ServiceGroup) => {
      if (mode !== 'multi') {
        console.warn('Service groups only supported in multi-mode');
        return;
      }

      const portString = expandGroupToPorts(group); // e.g., "80, 443, 8080"
      onChange?.(portString);

      setShowSuggestionsDropdown(false);
      setSelectedSuggestionIndex(-1);
    },
    [mode, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Handle suggestions navigation
      if (showSuggestionsDropdown && suggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedSuggestionIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          return;
        }

        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedSuggestionIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          return;
        }

        if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
          e.preventDefault();
          const selected = suggestions[selectedSuggestionIndex];
          if (selected) {
            handleSelectSuggestion(selected.port);
          }
          return;
        }

        if (e.key === 'Escape') {
          e.preventDefault();
          setShowSuggestionsDropdown(false);
          setSelectedSuggestionIndex(-1);
          return;
        }
      }

      // Multi mode: Enter to add port
      if (mode === 'multi' && e.key === 'Enter') {
        e.preventDefault();
        const parsed = parseSinglePort(multiInputValue, min, max);
        if (parsed !== null) {
          handleAddPort(parsed);
        }
        return;
      }

      // Multi mode: Backspace to remove last port when input is empty
      if (mode === 'multi' && e.key === 'Backspace' && multiInputValue === '' && multiPorts.length > 0) {
        e.preventDefault();
        const lastPort = multiPorts[multiPorts.length - 1];
        handleRemovePort(lastPort);
        return;
      }

      // Tab behavior - close suggestions
      if (e.key === 'Tab') {
        setShowSuggestionsDropdown(false);
      }
    },
    [
      showSuggestionsDropdown,
      suggestions,
      selectedSuggestionIndex,
      mode,
      multiInputValue,
      multiPorts,
      min,
      max,
      handleAddPort,
      handleRemovePort,
      handleSelectSuggestion,
    ]
  );

  const navigateSuggestion = useCallback(
    (direction: 'up' | 'down') => {
      if (!showSuggestionsDropdown || suggestions.length === 0) return;

      setSelectedSuggestionIndex((prev) => {
        if (direction === 'down') {
          return prev < suggestions.length - 1 ? prev + 1 : 0;
        } else {
          return prev > 0 ? prev - 1 : suggestions.length - 1;
        }
      });
    },
    [showSuggestionsDropdown, suggestions.length]
  );

  const clear = useCallback(() => {
    setInternalValue('');
    setRangeStartValue('');
    setRangeEndValue('');
    setMultiPorts([]);
    setMultiInputValue('');

    if (onChange) {
      onChange(null);
    }
  }, [onChange]);

  const handleBlur = useCallback(() => {
    // Delay to allow click on suggestions
    setTimeout(() => {
      setShowSuggestionsDropdown(false);
      setSelectedSuggestionIndex(-1);
    }, 150);
  }, []);

  const handleFocus = useCallback(() => {
    if (enableSuggestions) {
      setShowSuggestionsDropdown(true);
    }
  }, [enableSuggestions]);

  // ============================================================================
  // Sync controlled value
  // ============================================================================

  useEffect(() => {
    if (controlledValue === undefined) return;

    if (mode === 'single') {
      const newValue = controlledValue === null ? '' : String(controlledValue);
      if (newValue !== internalValue) {
        setInternalValue(newValue);
      }
    } else if (mode === 'range') {
      if (typeof controlledValue === 'string' && controlledValue.includes('-')) {
        const [start, end] = controlledValue.split('-');
        if (start !== rangeStartValue) setRangeStartValue(start || '');
        if (end !== rangeEndValue) setRangeEndValue(end || '');
      }
    } else if (mode === 'multi') {
      if (typeof controlledValue === 'string') {
        const parsed = parseMultiPorts(controlledValue, min, max);
        if (JSON.stringify(parsed) !== JSON.stringify(multiPorts)) {
          setMultiPorts(parsed);
        }
      }
    }
  }, [controlledValue, mode, min, max]); // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // Parsed values
    port,
    portRange,
    ports,

    // Display values
    inputValue: mode === 'multi' ? multiInputValue : inputValue,
    rangeStartValue,
    rangeEndValue,
    displayValue,
    portCount,

    // Validation
    isValid,
    error,

    // Service lookup
    serviceName,
    protocol,

    // Event handlers
    handleChange: mode === 'multi'
      ? (e: React.ChangeEvent<HTMLInputElement>) => {
          const value = e.target.value;
          if (value !== '' && !/^\d*,?\d*$/.test(value)) return;
          setMultiInputValue(value);
          setSelectedSuggestionIndex(-1);
        }
      : handleChange,
    handleRangeStartChange,
    handleRangeEndChange,
    handleAddPort,
    handleRemovePort,
    handleKeyDown,
    clear,
    handleBlur,
    handleFocus,

    // Suggestions
    suggestions,
    showSuggestionsDropdown,
    selectedSuggestionIndex,
    handleSelectSuggestion,
    handleSelectServiceGroup,
    setShowSuggestionsDropdown,
    navigateSuggestion,

    // Refs
    inputRef,
    rangeStartRef,
    rangeEndRef,
    suggestionsRef,
  };
}

export default usePortInput;
