/**
 * ValidationProgress Stories
 *
 * Storybook stories for the ValidationProgress pattern component.
 */

import { ValidationProgress } from './ValidationProgress';
import { ValidationStage } from './ValidationStage';

import type { Meta, StoryObj } from '@storybook/react';
import type { ValidationStageResult, ValidationStageName } from './types';

const meta: Meta<typeof ValidationProgress> = {
  title: 'Patterns/Forms/ValidationProgress',
  component: ValidationProgress,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A 7-stage validation pipeline progress display. Shows schema, syntax, cross-resource, dependencies, network, platform, and dry-run validation stages with error details.',
      },
    },
  },
  argTypes: {
    stages: {
      description: 'Validation stage results',
    },
    isComplete: {
      description: 'Whether validation has completed',
      control: 'boolean',
    },
    isValid: {
      description: 'Whether validation passed',
      control: 'boolean',
    },
    totalDurationMs: {
      description: 'Total validation duration in milliseconds',
      control: 'number',
    },
    visibleStages: {
      description: 'Which stages to show (defaults to all)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ValidationProgress>;

/**
 * Ready state - no validation running
 */
export const Ready: Story = {
  args: {},
};

/**
 * Validation in progress - some stages running
 */
export const InProgress: Story = {
  args: {
    stages: [
      { stage: 'schema', status: 'passed', errors: [], warnings: [], durationMs: 12 },
      { stage: 'syntax', status: 'passed', errors: [], warnings: [], durationMs: 8 },
      { stage: 'cross-resource', status: 'running', errors: [], warnings: [] },
    ],
  },
};

/**
 * Validation passed - all stages successful
 */
export const Passed: Story = {
  args: {
    stages: [
      { stage: 'schema', status: 'passed', errors: [], warnings: [], durationMs: 12 },
      { stage: 'syntax', status: 'passed', errors: [], warnings: [], durationMs: 8 },
      { stage: 'cross-resource', status: 'passed', errors: [], warnings: [], durationMs: 45 },
      { stage: 'dependencies', status: 'passed', errors: [], warnings: [], durationMs: 23 },
      { stage: 'network', status: 'passed', errors: [], warnings: [], durationMs: 156 },
      { stage: 'platform', status: 'passed', errors: [], warnings: [], durationMs: 34 },
      { stage: 'dry-run', status: 'passed', errors: [], warnings: [], durationMs: 89 },
    ],
    isComplete: true,
    isValid: true,
    totalDurationMs: 367,
  },
};

/**
 * Validation failed - with errors
 */
export const Failed: Story = {
  args: {
    stages: [
      { stage: 'schema', status: 'passed', errors: [], warnings: [], durationMs: 12 },
      { stage: 'syntax', status: 'passed', errors: [], warnings: [], durationMs: 8 },
      {
        stage: 'cross-resource',
        status: 'failed',
        errors: [
          { code: 'IP_COLLISION', message: 'IP 192.168.1.1 conflicts with bridge1', fieldPath: 'address' },
          { code: 'PORT_CONFLICT', message: 'Port 8080 already in use by web-proxy', fieldPath: 'listenPort' },
        ],
        warnings: [],
        durationMs: 45,
      },
    ],
    isComplete: true,
    isValid: false,
    totalDurationMs: 65,
  },
};

/**
 * With warnings
 */
export const WithWarnings: Story = {
  args: {
    stages: [
      { stage: 'schema', status: 'passed', errors: [], warnings: [], durationMs: 12 },
      { stage: 'syntax', status: 'passed', errors: [], warnings: [], durationMs: 8 },
      {
        stage: 'cross-resource',
        status: 'passed',
        errors: [],
        warnings: [
          { code: 'DEPRECATED_OPTION', message: 'Setting "legacy-mode" is deprecated' },
        ],
        durationMs: 45,
      },
    ],
    isComplete: true,
    isValid: true,
    totalDurationMs: 65,
  },
};

/**
 * Low risk validation - only schema and syntax
 */
export const LowRisk: Story = {
  args: {
    visibleStages: ['schema', 'syntax'] as ValidationStageName[],
    stages: [
      { stage: 'schema', status: 'passed', errors: [], warnings: [], durationMs: 12 },
      { stage: 'syntax', status: 'passed', errors: [], warnings: [], durationMs: 8 },
    ],
    isComplete: true,
    isValid: true,
    totalDurationMs: 20,
  },
};

/**
 * Medium risk validation
 */
export const MediumRisk: Story = {
  args: {
    visibleStages: ['schema', 'syntax', 'cross-resource', 'dependencies'] as ValidationStageName[],
    stages: [
      { stage: 'schema', status: 'passed', errors: [], warnings: [], durationMs: 12 },
      { stage: 'syntax', status: 'passed', errors: [], warnings: [], durationMs: 8 },
      { stage: 'cross-resource', status: 'passed', errors: [], warnings: [], durationMs: 45 },
      { stage: 'dependencies', status: 'running', errors: [], warnings: [] },
    ],
  },
};

// ===== ValidationStage Component Stories =====

const stageMeta: Meta<typeof ValidationStage> = {
  title: 'Patterns/Forms/ValidationStage',
  component: ValidationStage,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Individual validation stage display with expandable error details.',
      },
    },
  },
};

export const StagePending: StoryObj<typeof ValidationStage> = {
  render: () => (
    <ValidationStage
      result={{
        stage: 'schema',
        status: 'pending',
        errors: [],
        warnings: [],
      }}
    />
  ),
};

export const StageRunning: StoryObj<typeof ValidationStage> = {
  render: () => (
    <ValidationStage
      result={{
        stage: 'network',
        status: 'running',
        errors: [],
        warnings: [],
      }}
    />
  ),
};

export const StagePassed: StoryObj<typeof ValidationStage> = {
  render: () => (
    <ValidationStage
      result={{
        stage: 'syntax',
        status: 'passed',
        errors: [],
        warnings: [],
        durationMs: 23,
      }}
    />
  ),
};

export const StageFailed: StoryObj<typeof ValidationStage> = {
  render: () => (
    <ValidationStage
      result={{
        stage: 'cross-resource',
        status: 'failed',
        errors: [
          { code: 'IP_COLLISION', message: 'IP address conflicts with existing interface', fieldPath: 'address' },
        ],
        warnings: [],
        durationMs: 45,
      }}
      isExpanded
    />
  ),
};

export const StageWithMultipleErrors: StoryObj<typeof ValidationStage> = {
  render: () => (
    <ValidationStage
      result={{
        stage: 'dependencies',
        status: 'failed',
        errors: [
          { code: 'MISSING_PACKAGE', message: 'Package wireguard-tools not installed' },
          { code: 'VERSION_MISMATCH', message: 'RouterOS version 7.12+ required' },
          { code: 'FIRMWARE_OLD', message: 'Firmware update recommended for stability' },
        ],
        warnings: [],
        durationMs: 89,
      }}
      isExpanded
    />
  ),
};
