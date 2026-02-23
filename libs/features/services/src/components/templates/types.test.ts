import { describe, it, expect } from 'vitest';
import type {
  TemplateSortBy,
  TemplateBrowserFilters,
  TemplatesBrowserProps,
  TemplateFiltersProps,
  TemplateInstallWizardProps,
  TemplateInstallContext,
  TemplateInstallEvent,
  UseTemplateInstallWizardOptions,
  UseTemplateInstallWizardReturn,
} from './types';
import { DEFAULT_FILTERS } from './types';

describe('Template Types', () => {
  describe('TemplateSortBy', () => {
    it('should accept valid sort options', () => {
      const sortOptions: TemplateSortBy[] = [
        'name',
        'updated',
        'category',
        'services',
      ];
      expect(sortOptions).toHaveLength(4);
    });
  });

  describe('TemplateBrowserFilters', () => {
    it('should have DEFAULT_FILTERS constant with sensible defaults', () => {
      expect(DEFAULT_FILTERS).toEqual({
        searchQuery: '',
        category: null,
        scope: null,
        showBuiltIn: true,
        showCustom: true,
        sortBy: 'name',
      });
    });

    it('should allow creating valid filter objects', () => {
      const filters: TemplateBrowserFilters = {
        searchQuery: 'tor',
        category: 'PRIVACY',
        scope: 'SINGLE',
        showBuiltIn: true,
        showCustom: false,
        sortBy: 'updated',
      };

      expect(filters.searchQuery).toBe('tor');
      expect(filters.category).toBe('PRIVACY');
      expect(filters.sortBy).toBe('updated');
    });
  });

  describe('TemplatesBrowserProps', () => {
    it('should allow creating valid props object', () => {
      const props: TemplatesBrowserProps = {
        routerId: 'router-123',
        onInstall: (template) => {
          console.log('Install template:', template);
        },
        onViewDetails: (template) => {
          console.log('View details:', template);
        },
        className: 'custom-class',
      };

      expect(props.routerId).toBe('router-123');
      expect(props.onInstall).toBeDefined();
      expect(props.onViewDetails).toBeDefined();
      expect(props.className).toBe('custom-class');
    });

    it('should allow optional callbacks', () => {
      const props: TemplatesBrowserProps = {
        routerId: 'router-123',
        // No callbacks provided
      };

      expect(props.routerId).toBe('router-123');
      expect(props.onInstall).toBeUndefined();
      expect(props.onViewDetails).toBeUndefined();
    });
  });

  describe('TemplateFiltersProps', () => {
    it('should require all filter management callbacks', () => {
      const props: TemplateFiltersProps = {
        filters: DEFAULT_FILTERS,
        onFiltersChange: (filters) => {
          console.log('Filters changed:', filters);
        },
        onReset: () => {
          console.log('Filters reset');
        },
        hasActiveFilters: false,
      };

      expect(props.onFiltersChange).toBeDefined();
      expect(props.onReset).toBeDefined();
    });
  });

  describe('TemplateInstallContext', () => {
    it('should represent installation state machine context', () => {
      const context: TemplateInstallContext = {
        routerId: 'router-123',
        template: {
          id: 'template-1',
          name: 'Example Template',
          description: 'Example template',
          category: 'PRIVACY',
          scope: 'SINGLE',
          services: [],
          variables: [],
          builtIn: true,
        } as any,
        currentStep: 1,
        variables: {
          proxyPort: 8080,
          enableLogging: true,
        },
        progress: null,
        installResult: null,
        selectedRoutingRules: [],
        error: null,
      };

      expect(context.currentStep).toBe(1);
      expect(context.variables.proxyPort).toBe(8080);
      expect(context.error).toBeNull();
    });
  });

  describe('TemplateInstallEvent', () => {
    it('should represent all valid state machine events', () => {
      const events: TemplateInstallEvent[] = [
        { type: 'NEXT' },
        { type: 'PREV' },
        { type: 'SET_VARIABLES', variables: { port: 8080 } },
        { type: 'START_INSTALL' },
        { type: 'INSTALL_SUCCESS', instanceIDs: ['inst-1', 'inst-2'] },
        { type: 'INSTALL_ERROR', error: 'Installation failed' },
        { type: 'TOGGLE_ROUTING_RULE', ruleId: 'rule-1' },
        { type: 'APPLY_ROUTING' },
        { type: 'SKIP_ROUTING' },
        { type: 'CANCEL' },
        { type: 'RETRY' },
      ];

      expect(events).toHaveLength(11);
    });
  });

  describe('UseTemplateInstallWizardReturn', () => {
    it('should provide complete wizard state and controls', () => {
      const wizardState: UseTemplateInstallWizardReturn = {
        currentStep: 2,
        context: {
          routerId: 'router-1',
          template: { id: 'template-1' } as any,
          currentStep: 2,
          variables: {},
          progress: null,
          installResult: null,
          selectedRoutingRules: [],
          error: null,
        },
        send: (event) => {
          console.log('Event:', event);
        },
        canGoNext: true,
        canGoPrev: true,
        isInstalling: false,
        isCompleted: false,
        isFailed: false,
      };

      expect(wizardState.currentStep).toBe(2);
      expect(wizardState.canGoNext).toBe(true);
      expect(wizardState.isInstalling).toBe(false);
    });
  });
});
