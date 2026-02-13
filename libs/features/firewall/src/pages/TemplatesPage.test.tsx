/**
 * TemplatesPage Integration Tests
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TemplatesPage } from './TemplatesPage';

// ============================================
// MOCKS
// ============================================

// Mock the pattern components
vi.mock('@nasnet/ui/patterns/template-gallery', () => ({
  TemplateGallery: ({ gallery, onApplyTemplate, loading }: any) => (
    <div data-testid="template-gallery">
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div>Templates: {gallery.filteredTemplates.length}</div>
          <button onClick={() => onApplyTemplate?.(gallery.filteredTemplates[0])}>
            Apply First Template
          </button>
        </>
      )}
    </div>
  ),
  useTemplateGallery: ({ templates, onSelect }: any) => ({
    filteredTemplates: templates,
    totalCount: templates.length,
    filteredCount: templates.length,
    filter: {},
    setFilter: vi.fn(),
    clearFilter: vi.fn(),
    hasActiveFilter: false,
    sort: { field: 'name', direction: 'asc' },
    setSort: vi.fn(),
    toggleSortDirection: vi.fn(),
    selection: { selected: null },
    selectTemplate: onSelect,
    clearSelection: vi.fn(),
    categoryCount: {},
    complexityCount: {},
  }),
}));

// Mock TemplateApplyFlow
vi.mock('../components/TemplateApplyFlow', () => ({
  TemplateApplyFlow: ({ template, onCancel }: any) => (
    <div data-testid="template-apply-flow">
      <div>Applying: {template?.name}</div>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

// Mock dialogs
vi.mock('../components/SaveTemplateDialog', () => ({
  SaveTemplateDialog: ({ trigger, onSave }: any) => (
    <div data-testid="save-template-dialog">
      {trigger}
      <button onClick={() => onSave({ id: 'custom', name: 'Custom' })}>
        Save
      </button>
    </div>
  ),
}));

vi.mock('../components/ImportTemplateDialog', () => ({
  ImportTemplateDialog: ({ trigger, onImport }: any) => (
    <div data-testid="import-template-dialog">
      {trigger}
      <button onClick={() => onImport({ id: 'imported', name: 'Imported' })}>
        Import
      </button>
    </div>
  ),
}));

// Mock API hooks
vi.mock('@nasnet/api-client/queries', () => ({
  useTemplates: () => ({
    data: [
      {
        id: 'basic-security',
        name: 'Basic Security',
        description: 'Basic firewall security',
        category: 'SECURITY',
        complexity: 'SIMPLE',
        ruleCount: 5,
        variables: [],
        rules: [],
        isBuiltIn: true,
        version: '1.0.0',
      },
    ],
    isLoading: false,
    error: null,
  }),
  useApplyTemplate: () => ({
    mutateAsync: vi.fn().mockResolvedValue({
      success: true,
      appliedRulesCount: 5,
      rollbackId: 'rollback-123',
    }),
  }),
  useRollbackTemplate: () => ({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
  }),
}));

// Mock custom templates hook
vi.mock('../hooks/useCustomTemplates', () => ({
  useCustomTemplates: () => ({
    templates: [
      {
        id: 'custom-1',
        name: 'My Custom Template',
        description: 'Custom template',
        category: 'CUSTOM',
        complexity: 'MODERATE',
        ruleCount: 3,
        variables: [],
        rules: [],
        isBuiltIn: false,
        version: '1.0.0',
      },
    ],
    loading: false,
    error: null,
    save: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    exportTemplates: vi.fn().mockResolvedValue('{}'),
    importTemplates: vi.fn().mockResolvedValue(1),
  }),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock template-export
vi.mock('../utils/template-export', () => ({
  downloadTemplates: vi.fn(),
}));

// ============================================
// TEST SETUP
// ============================================

function renderTemplatesPage(props = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TemplatesPage routerId="192.168.88.1" currentRules={[]} {...props} />
    </QueryClientProvider>
  );
}

// ============================================
// TESTS
// ============================================

describe('TemplatesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render page header', () => {
    renderTemplatesPage();

    expect(screen.getByText('Firewall Templates')).toBeInTheDocument();
    expect(
      screen.getByText('Apply pre-configured firewall rules or create your own templates')
    ).toBeInTheDocument();
  });

  it('should render tabs for browse and apply', () => {
    renderTemplatesPage();

    expect(screen.getByRole('tab', { name: /browse templates/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /configure & apply/i })).toBeInTheDocument();
  });

  it('should display template gallery by default', () => {
    renderTemplatesPage();

    expect(screen.getByTestId('template-gallery')).toBeInTheDocument();
  });

  it('should show combined built-in and custom templates', () => {
    renderTemplatesPage();

    // 1 built-in + 1 custom = 2 templates
    expect(screen.getByText('Templates: 2')).toBeInTheDocument();
  });

  it('should switch to apply tab when template is selected', async () => {
    const user = userEvent.setup();
    renderTemplatesPage();

    // Click apply on first template
    const applyButton = screen.getByText('Apply First Template');
    await user.click(applyButton);

    // Should show apply flow
    await waitFor(() => {
      expect(screen.getByTestId('template-apply-flow')).toBeInTheDocument();
    });
  });

  it('should render action buttons when current rules exist', () => {
    const currentRules = [{ id: '1' }, { id: '2' }];
    renderTemplatesPage({ currentRules });

    expect(screen.getByText(/create template/i)).toBeInTheDocument();
    expect(screen.getByText(/import/i)).toBeInTheDocument();
  });

  it('should show export button when custom templates exist', () => {
    renderTemplatesPage();

    expect(screen.getByText(/export custom/i)).toBeInTheDocument();
  });

  it('should render save template dialog', () => {
    const currentRules = [{ id: '1' }];
    renderTemplatesPage({ currentRules });

    expect(screen.getByTestId('save-template-dialog')).toBeInTheDocument();
  });

  it('should render import template dialog', () => {
    renderTemplatesPage();

    expect(screen.getByTestId('import-template-dialog')).toBeInTheDocument();
  });

  it('should show empty state when no templates available', () => {
    // Mock no templates
    vi.mocked(vi.importActual('@nasnet/api-client/queries')).useTemplates = () => ({
      data: [],
      isLoading: false,
      error: null,
    });

    vi.mocked(vi.importActual('../hooks/useCustomTemplates')).useCustomTemplates = () => ({
      templates: [],
      loading: false,
      error: null,
      save: vi.fn(),
      remove: vi.fn(),
      exportTemplates: vi.fn(),
      importTemplates: vi.fn(),
    });

    renderTemplatesPage();

    expect(screen.getByText('No Templates Available')).toBeInTheDocument();
  });
});

describe('TemplatesPage - User Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow canceling template application', async () => {
    const user = userEvent.setup();
    renderTemplatesPage();

    // Apply template
    await user.click(screen.getByText('Apply First Template'));

    // Should show apply flow
    await waitFor(() => {
      expect(screen.getByTestId('template-apply-flow')).toBeInTheDocument();
    });

    // Cancel
    await user.click(screen.getByText('Cancel'));

    // Should return to browse tab
    await waitFor(() => {
      expect(screen.getByTestId('template-gallery')).toBeInTheDocument();
    });
  });
});

describe('TemplatesPage - Accessibility', () => {
  it('should have accessible tab navigation', () => {
    renderTemplatesPage();

    const browseTab = screen.getByRole('tab', { name: /browse templates/i });
    const applyTab = screen.getByRole('tab', { name: /configure & apply/i });

    expect(browseTab).toHaveAttribute('aria-selected');
    expect(applyTab).toBeInTheDocument();
  });

  it('should disable apply tab when no template selected', () => {
    renderTemplatesPage();

    const applyTab = screen.getByRole('tab', { name: /configure & apply/i });
    expect(applyTab).toHaveAttribute('disabled');
  });
});
