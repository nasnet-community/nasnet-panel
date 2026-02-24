/**
 * Router Discovery Page
 * Main page for discovering and connecting to routers (Epic 0.1)
 */

import React, { useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';

import { storeCredentials as storeApiCredentials } from '@nasnet/api-client/core';
import { useTestConnection } from '@nasnet/api-client/queries';
import type { Router, RouterCredentials, ScanResult } from '@nasnet/core/types';
import {
  NetworkScanner,
  ManualRouterEntry,
  CredentialDialog,
  RouterList,
  scanResultToRouter,
  saveCredentials as persistCredentials,
  loadCredentials,
  type CredentialValidationResult,
} from '@nasnet/features/router-discovery';
import { useRouterStore , useConnectionStore } from '@nasnet/state/stores';


type ViewMode = 'scan' | 'manual' | 'list';

/**
 * Router Discovery Page
 *
 * Landing page for discovering and connecting to MikroTik routers.
 * Provides three methods:
 * 1. Network auto-scan
 * 2. Manual router entry
 * 3. Router list (previously discovered)
 *
 * Flow:
 * - Scan/Add → Select Router → Enter Credentials → Test → Connect
 */
export const RouterDiscoveryPage = React.memo(function RouterDiscoveryPage() {
  const { t } = useTranslation('router');
  const navigate = useNavigate();

  // Stores
  const {
    addRouter,
    updateRouter,
    removeRouter,
    selectRouter,
    selectedRouterId,
    getAllRouters,
  } = useRouterStore();
  const { setCurrentRouter } = useConnectionStore();

  // Local state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [credentialDialogOpen, setCredentialDialogOpen] = useState(false);
  const [selectedRouterForAuth, setSelectedRouterForAuth] = useState<Router | null>(
    null
  );

  // Hooks
  const testConnection = useTestConnection();

  /**
   * Handles scan completion - converts scan results to routers
   */
  const handleScanComplete = (results: ScanResult[]) => {
    results.forEach((result) => {
      const router: Router = {
        id: uuidv4(),
        ...scanResultToRouter(result),
        createdAt: new Date(),
      };
      addRouter(router);
    });

    // Switch to list view to show results
    setViewMode('list');
  };

  /**
   * Handles router selection from scan results
   */
  const handleRouterSelectFromScan = (result: ScanResult) => {
    const router: Router = {
      id: uuidv4(),
      ...scanResultToRouter(result),
      createdAt: new Date(),
    };

    addRouter(router);
    selectRouter(router.id);
    setSelectedRouterForAuth(router);
    setCredentialDialogOpen(true);
  };

  /**
   * Handles manual router submission
   */
  const handleManualSubmit = (data: { ipAddress: string; name?: string }) => {
    const router: Router = {
      id: uuidv4(),
      ipAddress: data.ipAddress,
      name: data.name,
      connectionStatus: 'unknown',
      discoveryMethod: 'manual',
      createdAt: new Date(),
    };

    addRouter(router);
    selectRouter(router.id);
    setSelectedRouterForAuth(router);
    setCredentialDialogOpen(true);
  };

  /**
   * Handles connect button click from router list
   */
  const handleConnect = (router: Router) => {
    selectRouter(router.id);
    setSelectedRouterForAuth(router);
    setCredentialDialogOpen(true);
  };

  /**
   * Handles double-click on router card
   * If credentials are saved, auto-connect; otherwise show credential dialog
   */
  const handleDoubleClick = (router: Router) => {
    selectRouter(router.id);
    setSelectedRouterForAuth(router);

    // Check for saved credentials
    const savedCredentials = loadCredentials(router.id);

    if (savedCredentials) {
      // Auto-connect with saved credentials
      updateRouter(router.id, { connectionStatus: 'connecting' });

      testConnection.mutate(
        {
          ipAddress: router.ipAddress,
          credentials: savedCredentials,
        },
        {
          onSuccess: (result: CredentialValidationResult) => {
            if (result.isValid) {
              // Connection successful
              const updatedRouter: Partial<Router> = {
                connectionStatus: 'online',
                lastConnected: new Date(),
                model: result.routerInfo?.model,
                routerOsVersion: result.routerInfo?.version,
                name:
                  router.name ||
                  result.routerInfo?.identity ||
                  router.ipAddress,
              };

              updateRouter(router.id, updatedRouter);

              // Update connection store
              setCurrentRouter(router.id, router.ipAddress);

              // Navigate to main app
              navigate({ to: `/router/${router.id}` });
            } else {
              // Saved credentials invalid - show dialog
              updateRouter(router.id, { connectionStatus: 'offline' });
              setCredentialDialogOpen(true);
            }
          },
          onError: () => {
            // Connection error - show dialog
            updateRouter(router.id, { connectionStatus: 'offline' });
            setCredentialDialogOpen(true);
          },
        }
      );
    } else {
      // No saved credentials - show dialog
      setCredentialDialogOpen(true);
    }
  };

  /**
   * Handles router removal
   */
  const handleRemove = (router: Router) => {
    removeRouter(router.id);
  };

  /**
   * Handles credential submission and validation
   */
  const handleCredentialSubmit = (
    credentials: RouterCredentials,
    saveCredentials: boolean
  ) => {
    if (!selectedRouterForAuth) return;

    // Update router status to connecting
    updateRouter(selectedRouterForAuth.id, { connectionStatus: 'connecting' });

    // Test connection
    testConnection.mutate(
      {
        ipAddress: selectedRouterForAuth.ipAddress,
        credentials,
      },
      {
        onSuccess: (result: CredentialValidationResult) => {
          if (result.isValid) {
            // Connection successful
            const updatedRouter: Partial<Router> = {
              connectionStatus: 'online',
              lastConnected: new Date(),
              model: result.routerInfo?.model,
              routerOsVersion: result.routerInfo?.version,
              name:
                selectedRouterForAuth.name ||
                result.routerInfo?.identity ||
                selectedRouterForAuth.ipAddress,
            };

            updateRouter(selectedRouterForAuth.id, updatedRouter);

            // Save credentials if requested
            if (saveCredentials) {
              persistCredentials(selectedRouterForAuth.id, credentials);
            }

            // Store credentials for API client (required for all authenticated requests)
            storeApiCredentials({
              username: credentials.username,
              password: credentials.password,
            });

            // Update connection store
            setCurrentRouter(
              selectedRouterForAuth.id,
              selectedRouterForAuth.ipAddress
            );

            // Close dialog and navigate to main app
            setCredentialDialogOpen(false);
            navigate({ to: `/router/${selectedRouterForAuth.id}` });
          } else {
            // Connection failed
            updateRouter(selectedRouterForAuth.id, {
              connectionStatus: 'offline',
            });
          }
        },
        onError: () => {
          // Connection error
          updateRouter(selectedRouterForAuth.id, { connectionStatus: 'offline' });
        },
      }
    );
  };

  /**
   * Handles credential dialog cancel
   */
  const handleCredentialCancel = () => {
    setCredentialDialogOpen(false);
    setSelectedRouterForAuth(null);
  };

  const allRouters = getAllRouters();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-page-mobile md:px-page-tablet lg:px-page-desktop py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <img
            src="/favicon.png"
            alt="NasNet"
            className="w-20 h-20 mx-auto mb-6 rounded-2xl shadow-lg"
          />
          <h1 className="text-4xl font-bold font-display text-foreground mb-4">
            {t('discovery.title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('discovery.subtitle')}
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-card-sm border border-border bg-card p-1">
            <button
              onClick={() => setViewMode('scan')}
              className={`px-component-md py-component-sm rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[44px] ${
                viewMode === 'scan'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('discovery.autoScan')}
            </button>
            <button
              onClick={() => setViewMode('manual')}
              className={`px-component-md py-component-sm rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[44px] ${
                viewMode === 'manual'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('discovery.manualEntry')}
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-component-md py-component-sm rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[44px] ${
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('discovery.myRouters', { count: allRouters.length })}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-4xl mx-auto">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {viewMode === 'scan' && (
              <div className="bg-card rounded-card-sm shadow-sm border border-border p-6">
                <NetworkScanner
                  onScanComplete={handleScanComplete}
                  onRouterSelect={handleRouterSelectFromScan}
                />
              </div>
            )}

            {viewMode === 'manual' && (
              <ManualRouterEntry
                onSubmit={handleManualSubmit}
                onCancel={() => setViewMode('list')}
              />
            )}

            {viewMode === 'list' && (
              <div className="bg-card rounded-card-sm shadow-sm border border-border p-6">
                <RouterList
                  routers={allRouters}
                  selectedRouterId={selectedRouterId}
                  onRouterSelect={(router: Router) => selectRouter(router.id)}
                  onDoubleClick={handleDoubleClick}
                  onConnect={handleConnect}
                  onRemove={handleRemove}
                  emptyState={
                    <div className="py-12">
                      <img
                        src="/favicon.png"
                        alt="NasNet"
                        className="mx-auto h-16 w-16 rounded-xl shadow-md"
                      />
                      <h3 className="mt-2 text-sm font-medium text-foreground">
                        {t('discovery.noRoutersYet')}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t('discovery.getStarted')}
                      </p>
                      <div className="mt-6 flex gap-component-md justify-center">
                        <button
                          onClick={() => setViewMode('scan')}
                          className="px-component-md py-component-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[44px]"
                        >
                          {t('discovery.scanNetwork')}
                        </button>
                        <button
                          onClick={() => setViewMode('manual')}
                          className="px-component-md py-component-sm bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[44px]"
                        >
                          {t('discovery.addManually')}
                        </button>
                      </div>
                    </div>
                  }
                />
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Credential Dialog */}
      <CredentialDialog
        isOpen={credentialDialogOpen}
        routerIp={selectedRouterForAuth?.ipAddress || ''}
        routerName={selectedRouterForAuth?.name}
        isValidating={testConnection.isPending}
        validationError={
          testConnection.isError
            ? testConnection.error?.message
            : testConnection.data && !testConnection.data.isValid
            ? testConnection.data.error
            : undefined
        }
        onSubmit={handleCredentialSubmit}
        onCancel={handleCredentialCancel}
      />
    </div>
  );
});
RouterDiscoveryPage.displayName = 'RouterDiscoveryPage';
