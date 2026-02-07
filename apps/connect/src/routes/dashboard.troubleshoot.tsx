// apps/connect/src/routes/dashboard.troubleshoot.tsx
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { TroubleshootWizard } from '@nasnet/features/diagnostics';
import { useEffect, useState } from 'react';

// Route search params
interface TroubleshootSearch {
  routerId?: string;
  autoStart?: boolean;
}

export const Route = createFileRoute('/dashboard/troubleshoot')({
  component: TroubleshootPage,
  validateSearch: (search: Record<string, unknown>): TroubleshootSearch => {
    return {
      routerId: typeof search?.routerId === 'string' ? search.routerId : undefined,
      autoStart: search?.autoStart === true || search?.autoStart === 'true',
    };
  },
});

function TroubleshootPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/dashboard/troubleshoot' });
  const [routerId, setRouterId] = useState<string | undefined>(search.routerId);

  // Get router ID from search params or local storage
  useEffect(() => {
    if (!routerId) {
      // Try to get from localStorage or global state
      const storedRouterId = localStorage.getItem('selectedRouterId');
      if (storedRouterId) {
        setRouterId(storedRouterId);
      }
    }
  }, [routerId]);

  const handleClose = () => {
    navigate({ to: '/dashboard' });
  };

  // Show error if no router is selected
  if (!routerId) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-error/10 border border-error/20 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-error mb-2">No Router Selected</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Please select a router before running diagnostics.
          </p>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        <TroubleshootWizard
          routerId={routerId}
          autoStart={search.autoStart}
          onClose={handleClose}
        />
      </div>
    </div>
  );
}
