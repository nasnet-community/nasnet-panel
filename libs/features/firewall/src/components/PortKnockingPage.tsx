/**
 * Port Knocking Page
 *
 * @description Main page composing PortKnockSequenceManager and PortKnockLogViewer with tabbed interface
 * for managing port knock sequences and viewing knock logs. Provides create/edit dialogs with full
 * CRUD operations and real-time sequence management.
 *
 * Story: NAS-7.12 - Implement Port Knocking - Task 4
 */

import { useState, memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@nasnet/ui/utils';
import { useConnectionStore, usePortKnockStore } from '@nasnet/state/stores';
import {
  usePortKnockSequence,
  useCreatePortKnockSequence,
  useUpdatePortKnockSequence,
} from '@nasnet/api-client/queries';
import type { PortKnockSequenceInput } from '@nasnet/core/types';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  Icon,
} from '@nasnet/ui/primitives';
import { Plus, Shield, ScrollText } from 'lucide-react';
import { PortKnockSequenceManager } from './PortKnockSequenceManager';
import { PortKnockLogViewer } from './PortKnockLogViewer';
import { PortKnockSequenceForm, usePortKnockSequenceForm } from '@nasnet/ui/patterns';

// ============================================================================
// Types
// ============================================================================

export interface PortKnockingPageProps {
  /** Optional CSS class name for custom styling */
  className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export const PortKnockingPage = memo(function PortKnockingPage({ className }: PortKnockingPageProps) {
  const { t } = useTranslation('firewall');
  const { activeRouterId } = useConnectionStore();
  const {
    activeTab,
    setActiveTab,
    createDialogOpen,
    setCreateDialogOpen,
    editingSequenceId,
    setEditingSequenceId,
  } = usePortKnockStore();

  const [createSequence] = useCreatePortKnockSequence();
  const [updateSequence] = useUpdatePortKnockSequence();

  // Fetch sequence data when editing
  const { data: editData } = usePortKnockSequence(
    activeRouterId!,
    editingSequenceId || '',
  );

  const editSequence = editData?.portKnockSequence;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedRuleIds, setGeneratedRuleIds] = useState<string[]>([]);

  // Determine if we're in edit mode
  const isEditMode = !!editingSequenceId && !!editSequence;

  // Initialize form
  const formState = usePortKnockSequenceForm({
    initialValues: isEditMode ? {
      name: editSequence.name,
      knockPorts: editSequence.knockPorts,
      protectedPort: editSequence.protectedPort,
      protectedProtocol: editSequence.protectedProtocol,
      accessTimeout: editSequence.accessTimeout,
      knockTimeout: editSequence.knockTimeout,
      isEnabled: editSequence.isEnabled,
      id: editSequence.id,
    } : undefined,
    onSubmit: useCallback(
      async (data: PortKnockSequenceInput) => {
        setIsSubmitting(true);
        try {
          if (isEditMode) {
            await updateSequence({
              variables: {
                routerId: activeRouterId!,
                id: editingSequenceId!,
                input: data,
              },
            });
          } else {
            await createSequence({
              variables: {
                routerId: activeRouterId!,
                input: data,
              },
            });
          }
          handleCloseDialog();
        } catch (err) {
          console.error('Failed to save port knock sequence:', err);
        } finally {
          setIsSubmitting(false);
        }
      },
      [isEditMode, editingSequenceId, activeRouterId, updateSequence, createSequence]
    ),
    isEditMode,
  });

  const handleCreate = useCallback(() => {
    setEditingSequenceId(null);
    setCreateDialogOpen(true);
  }, [setEditingSequenceId, setCreateDialogOpen]);

  const handleEdit = useCallback((sequenceId: string) => {
    setEditingSequenceId(sequenceId);
    setCreateDialogOpen(true);
  }, [setEditingSequenceId, setCreateDialogOpen]);

  const handleCloseDialog = useCallback(() => {
    setCreateDialogOpen(false);
    setEditingSequenceId(null);
  }, [setCreateDialogOpen, setEditingSequenceId]);

  return (
    <div className={cn('space-y-component-xl', className)}>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Port Knocking</h1>
          <p className="text-muted-foreground mt-component-sm">
            Protect sensitive services behind secret knock sequences
          </p>
        </div>
        <Button onClick={handleCreate} aria-label="Create new port knock sequence" className="min-h-[44px]">
          <Icon icon={Plus} className="h-4 w-4 mr-component-sm" aria-hidden="true" />
          Create Sequence
        </Button>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-component-md">
            <Icon icon={Shield} className="h-5 w-5 text-category-firewall" aria-hidden="true" />
            What is Port Knocking?
          </CardTitle>
          <CardDescription>
            Port knocking hides services by requiring a secret sequence of connection attempts
            to specific ports before granting access. This prevents port scanning and unauthorized
            access to sensitive services like SSH.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'sequences' | 'log')}>
        <TabsList>
          <TabsTrigger value="sequences">
            <Icon icon={Shield} className="h-4 w-4 mr-component-sm" aria-hidden="true" />
            Sequences
          </TabsTrigger>
          <TabsTrigger value="log">
            <Icon icon={ScrollText} className="h-4 w-4 mr-component-sm" aria-hidden="true" />
            Knock Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sequences" className="mt-component-lg">
          <PortKnockSequenceManager onEdit={handleEdit} onCreate={handleCreate} />
        </TabsContent>

        <TabsContent value="log" className="mt-component-lg">
          <PortKnockLogViewer />
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Sheet open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {isEditMode ? 'Edit Port Knock Sequence' : 'Create Port Knock Sequence'}
            </SheetTitle>
            <SheetDescription>
              {isEditMode
                ? 'Modify the knock sequence configuration.'
                : 'Define a secret knock sequence to protect a service.'}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-component-lg">
            <PortKnockSequenceForm
              formState={formState}
              isEditMode={isEditMode}
              isSubmitting={isSubmitting}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
});

PortKnockingPage.displayName = 'PortKnockingPage';
