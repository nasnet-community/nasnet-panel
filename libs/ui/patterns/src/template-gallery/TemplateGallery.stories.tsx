/**
 * TemplateGallery Storybook Stories
 *
 * Demonstrates all variants of the TemplateGallery component.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import {
  mockAllTemplates,
  mockBuiltInTemplates,
  mockCustomTemplates,
} from '../__test-utils__/firewall-templates/template-fixtures';

import { TemplateGallery } from './TemplateGallery';
import { useTemplateGallery } from './use-template-gallery';
import type { FirewallTemplate } from './types';

const meta: Meta<typeof TemplateGallery> = {
  title: 'Patterns/TemplateGallery',
  component: TemplateGallery,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Gallery component for browsing and selecting firewall templates. Supports filtering, sorting, searching, and selection. Auto-adapts between mobile and desktop layouts.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TemplateGallery>;

/**
 * Default gallery with all templates
 */
export const Default: Story = {
  render: () => {
    const gallery = useTemplateGallery({
      templates: mockAllTemplates,
      onSelect: (template) => console.log('Selected:', template.name),
    });

    return (
      <div className="h-screen">
        <TemplateGallery
          gallery={gallery}
          onApplyTemplate={(template) => console.log('Apply:', template.name)}
        />
      </div>
    );
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  render: () => {
    const gallery = useTemplateGallery({
      templates: [],
    });

    return (
      <div className="h-screen">
        <TemplateGallery gallery={gallery} loading={true} />
      </div>
    );
  },
};

/**
 * Empty state (no templates)
 */
export const Empty: Story = {
  render: () => {
    const gallery = useTemplateGallery({
      templates: [],
    });

    return (
      <div className="h-screen">
        <TemplateGallery gallery={gallery} />
      </div>
    );
  },
};

/**
 * With active search filter
 */
export const WithSearch: Story = {
  render: () => {
    const gallery = useTemplateGallery({
      templates: mockAllTemplates,
      initialFilter: {
        search: 'gaming',
      },
    });

    return (
      <div className="h-screen">
        <TemplateGallery
          gallery={gallery}
          onApplyTemplate={(template) => console.log('Apply:', template.name)}
        />
      </div>
    );
  },
};

/**
 * Filtered by category (Home Network)
 */
export const FilteredByCategory: Story = {
  render: () => {
    const gallery = useTemplateGallery({
      templates: mockAllTemplates,
      initialFilter: {
        category: 'HOME',
      },
    });

    return (
      <div className="h-screen">
        <TemplateGallery
          gallery={gallery}
          onApplyTemplate={(template) => console.log('Apply:', template.name)}
        />
      </div>
    );
  },
};

/**
 * Filtered by complexity (Simple only)
 */
export const FilteredByComplexity: Story = {
  render: () => {
    const gallery = useTemplateGallery({
      templates: mockAllTemplates,
      initialFilter: {
        complexity: 'SIMPLE',
      },
    });

    return (
      <div className="h-screen">
        <TemplateGallery
          gallery={gallery}
          onApplyTemplate={(template) => console.log('Apply:', template.name)}
        />
      </div>
    );
  },
};

/**
 * Built-in templates only
 */
export const BuiltInOnly: Story = {
  render: () => {
    const gallery = useTemplateGallery({
      templates: mockAllTemplates,
      initialFilter: {
        builtInOnly: true,
      },
    });

    return (
      <div className="h-screen">
        <TemplateGallery
          gallery={gallery}
          onApplyTemplate={(template) => console.log('Apply:', template.name)}
        />
      </div>
    );
  },
};

/**
 * Custom templates only
 */
export const CustomOnly: Story = {
  render: () => {
    const gallery = useTemplateGallery({
      templates: mockAllTemplates,
      initialFilter: {
        customOnly: true,
      },
    });

    return (
      <div className="h-screen">
        <TemplateGallery
          gallery={gallery}
          onApplyTemplate={(template) => console.log('Apply:', template.name)}
        />
      </div>
    );
  },
};

/**
 * With template selection
 */
export const WithSelection: Story = {
  render: () => {
    const [selectedTemplate, setSelectedTemplate] = useState<FirewallTemplate | null>(
      mockAllTemplates[0]
    );

    const gallery = useTemplateGallery({
      templates: mockAllTemplates,
      initialSelectedId: selectedTemplate?.id || null,
      onSelect: setSelectedTemplate,
    });

    return (
      <div className="h-screen">
        <TemplateGallery
          gallery={gallery}
          onApplyTemplate={(template) => {
            console.log('Apply:', template.name);
            alert(`Applying template: ${template.name}`);
          }}
        />
      </div>
    );
  },
};

/**
 * Sorted by complexity (descending)
 */
export const SortedByComplexity: Story = {
  render: () => {
    const gallery = useTemplateGallery({
      templates: mockAllTemplates,
      initialSort: {
        field: 'complexity',
        direction: 'desc',
      },
    });

    return (
      <div className="h-screen">
        <TemplateGallery
          gallery={gallery}
          onApplyTemplate={(template) => console.log('Apply:', template.name)}
        />
      </div>
    );
  },
};

/**
 * Sorted by rule count (descending)
 */
export const SortedByRuleCount: Story = {
  render: () => {
    const gallery = useTemplateGallery({
      templates: mockAllTemplates,
      initialSort: {
        field: 'ruleCount',
        direction: 'desc',
      },
    });

    return (
      <div className="h-screen">
        <TemplateGallery
          gallery={gallery}
          onApplyTemplate={(template) => console.log('Apply:', template.name)}
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
    const gallery = useTemplateGallery({
      templates: mockAllTemplates,
      onSelect: (template) => console.log('Selected:', template.name),
    });

    return (
      <div className="h-screen max-w-[375px] mx-auto border-x">
        <TemplateGallery
          gallery={gallery}
          onApplyTemplate={(template) => console.log('Apply:', template.name)}
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
 * Desktop view with many templates
 */
export const DesktopView: Story = {
  render: () => {
    // Create more templates for testing scroll
    const manyTemplates = [
      ...mockAllTemplates,
      ...mockBuiltInTemplates.map((t) => ({
        ...t,
        id: `${t.id}-copy`,
        name: `${t.name} (Copy)`,
      })),
    ];

    const gallery = useTemplateGallery({
      templates: manyTemplates,
      onSelect: (template) => console.log('Selected:', template.name),
    });

    return (
      <div className="h-screen">
        <TemplateGallery
          gallery={gallery}
          onApplyTemplate={(template) => console.log('Apply:', template.name)}
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
