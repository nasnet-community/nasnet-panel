/**
 * Service Templates Route
 *
 * Browse and install multi-service templates on the router.
 * Templates bundle multiple pre-configured services for common use cases
 * (e.g., "Privacy Stack" with Tor + Xray + AdGuard).
 *
 * Features:
 * - Browse built-in and custom templates
 * - Filter by category, scope, and search
 * - Install templates with dynamic variable configuration
 * - Real-time installation progress tracking
 * - Optional routing rule application
 *
 * Route: /router/:id/services/templates
 */

import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { TemplatesBrowser, TemplateInstallWizard } from '@nasnet/features/services';
import type { ServiceTemplate } from '@nasnet/api-client/generated';
import { useToast } from '@nasnet/ui/primitives';

/**
 * Templates Page Component
 *
 * Renders the templates browser and handles wizard modal state.
 */
function TemplatesPage() {
  const { id: routerId } = Route.useParams();
  const { toast } = useToast();

  // Wizard modal state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ServiceTemplate | null>(null);

  /**
   * Handle template installation initiation
   * Opens the wizard modal with the selected template
   */
  const handleInstall = (template: ServiceTemplate) => {
    setSelectedTemplate(template);
    setWizardOpen(true);
  };

  /**
   * Handle wizard close
   * Resets selected template state
   */
  const handleWizardClose = () => {
    setWizardOpen(false);
    // Delay reset to avoid flash during close animation
    setTimeout(() => setSelectedTemplate(null), 300);
  };

  /**
   * Handle installation completion
   * Shows success toast and closes wizard
   */
  const handleInstallComplete = (instanceIDs: string[]) => {
    const count = instanceIDs.length;
    toast({
      title: 'Template Installed',
      description: `Successfully installed ${count} service${count !== 1 ? 's' : ''} from template "${selectedTemplate?.name}"`,
      variant: 'success',
    });
    handleWizardClose();
  };

  return (
    <>
      <TemplatesBrowser
        routerId={routerId}
        onInstall={handleInstall}
        className="p-4 md:p-6"
      />

      {selectedTemplate && (
        <TemplateInstallWizard
          routerId={routerId}
          template={selectedTemplate}
          open={wizardOpen}
          onClose={handleWizardClose}
          onComplete={handleInstallComplete}
        />
      )}
    </>
  );
}

/**
 * Route Configuration
 */
export const Route = createFileRoute('/router/$id/services/templates')({
  component: TemplatesPage,
});
