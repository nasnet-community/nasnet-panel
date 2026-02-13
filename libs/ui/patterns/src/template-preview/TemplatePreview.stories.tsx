/**
 * TemplatePreview Storybook Stories
 *
 * Demonstrates all variants of the TemplatePreview component.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import {
  mockBasicSecurityTemplate,
  mockHomeNetworkTemplate,
  mockGamingOptimizedTemplate,
  mockIotIsolationTemplate,
  mockPreviewResult,
  mockPreviewResultWithConflicts,
  generateMockVariables,
} from '../__test-utils__/firewall-templates/template-fixtures';

import { TemplatePreview } from './TemplatePreview';
import { useTemplatePreview } from './use-template-preview';
import type { TemplatePreviewResult, TemplateVariableValues } from './template-preview.types';

const meta: Meta<typeof TemplatePreview> = {
  title: 'Patterns/TemplatePreview',
  component: TemplatePreview,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Preview component for firewall templates. Provides variable editing with validation, rule preview, conflict detection, and impact analysis. Auto-adapts between mobile and desktop layouts.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TemplatePreview>;

/**
 * Default preview with basic template
 */
export const Default: Story = {
  render: () => {
    const [result, setResult] = useState<TemplatePreviewResult | null>(null);

    const preview = useTemplatePreview({
      template: mockBasicSecurityTemplate,
      onGeneratePreview: async (variables: TemplateVariableValues) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const previewResult = {
          ...mockPreviewResult,
          template: mockBasicSecurityTemplate,
        };
        setResult(previewResult);
        return previewResult;
      },
    });

    return (
      <div className="h-screen">
        <TemplatePreview
          preview={preview}
          onApply={() => console.log('Apply template')}
          onCancel={() => console.log('Cancel')}
        />
      </div>
    );
  },
};

/**
 * Preview with conflicts
 */
export const WithConflicts: Story = {
  render: () => {
    const preview = useTemplatePreview({
      template: mockHomeNetworkTemplate,
      onGeneratePreview: async (variables: TemplateVariableValues) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return {
          ...mockPreviewResultWithConflicts,
          template: mockHomeNetworkTemplate,
        };
      },
    });

    return (
      <div className="h-screen">
        <TemplatePreview
          preview={preview}
          onApply={() => console.log('Apply template')}
          onCancel={() => console.log('Cancel')}
        />
      </div>
    );
  },
};

/**
 * Preview with auto-preview enabled
 */
export const AutoPreview: Story = {
  render: () => {
    const preview = useTemplatePreview({
      template: mockBasicSecurityTemplate,
      onGeneratePreview: async (variables: TemplateVariableValues) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return {
          ...mockPreviewResult,
          template: mockBasicSecurityTemplate,
        };
      },
      autoPreview: true,
      autoPreviewDelay: 1000,
    });

    return (
      <div className="h-screen">
        <TemplatePreview
          preview={preview}
          onApply={() => console.log('Apply template')}
          onCancel={() => console.log('Cancel')}
        />
      </div>
    );
  },
};

/**
 * Preview with initial values
 */
export const WithInitialValues: Story = {
  render: () => {
    const preview = useTemplatePreview({
      template: mockHomeNetworkTemplate,
      initialValues: generateMockVariables(),
      onGeneratePreview: async (variables: TemplateVariableValues) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return {
          ...mockPreviewResult,
          template: mockHomeNetworkTemplate,
        };
      },
    });

    return (
      <div className="h-screen">
        <TemplatePreview
          preview={preview}
          onApply={() => console.log('Apply template')}
          onCancel={() => console.log('Cancel')}
        />
      </div>
    );
  },
};

/**
 * Complex template (Gaming Optimized)
 */
export const ComplexTemplate: Story = {
  render: () => {
    const preview = useTemplatePreview({
      template: mockGamingOptimizedTemplate,
      onGeneratePreview: async (variables: TemplateVariableValues) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return {
          ...mockPreviewResult,
          template: mockGamingOptimizedTemplate,
        };
      },
    });

    return (
      <div className="h-screen">
        <TemplatePreview
          preview={preview}
          onApply={() => console.log('Apply template')}
          onCancel={() => console.log('Cancel')}
        />
      </div>
    );
  },
};

/**
 * Advanced template (IoT Isolation)
 */
export const AdvancedTemplate: Story = {
  render: () => {
    const preview = useTemplatePreview({
      template: mockIotIsolationTemplate,
      onGeneratePreview: async (variables: TemplateVariableValues) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return {
          ...mockPreviewResult,
          template: mockIotIsolationTemplate,
        };
      },
    });

    return (
      <div className="h-screen">
        <TemplatePreview
          preview={preview}
          onApply={() => console.log('Apply template')}
          onCancel={() => console.log('Cancel')}
        />
      </div>
    );
  },
};

/**
 * Loading/Applying state
 */
export const ApplyingState: Story = {
  render: () => {
    const preview = useTemplatePreview({
      template: mockBasicSecurityTemplate,
      onGeneratePreview: async (variables: TemplateVariableValues) => {
        return {
          ...mockPreviewResult,
          template: mockBasicSecurityTemplate,
        };
      },
    });

    return (
      <div className="h-screen">
        <TemplatePreview
          preview={preview}
          onApply={() => console.log('Apply template')}
          onCancel={() => console.log('Cancel')}
          isApplying={true}
        />
      </div>
    );
  },
};

/**
 * Mobile view (force narrow viewport)
 */
export const MobileView: Story = {
  render: () => {
    const preview = useTemplatePreview({
      template: mockHomeNetworkTemplate,
      onGeneratePreview: async (variables: TemplateVariableValues) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return {
          ...mockPreviewResult,
          template: mockHomeNetworkTemplate,
        };
      },
    });

    return (
      <div className="h-screen max-w-[375px] mx-auto border-x">
        <TemplatePreview
          preview={preview}
          onApply={() => console.log('Apply template')}
          onCancel={() => console.log('Cancel')}
        />
      </div>
    );
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Desktop view
 */
export const DesktopView: Story = {
  render: () => {
    const preview = useTemplatePreview({
      template: mockHomeNetworkTemplate,
      onGeneratePreview: async (variables: TemplateVariableValues) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return {
          ...mockPreviewResult,
          template: mockHomeNetworkTemplate,
        };
      },
    });

    return (
      <div className="h-screen">
        <TemplatePreview
          preview={preview}
          onApply={() => console.log('Apply template')}
          onCancel={() => console.log('Cancel')}
        />
      </div>
    );
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};
