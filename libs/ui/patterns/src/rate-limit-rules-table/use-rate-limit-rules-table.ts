/**
 * Rate Limit Rules Table - Headless Hook
 * Business logic for rate limit rules table pattern
 *
 * @see NAS-7.11: Implement Connection Rate Limiting
 */

import { useState, useMemo } from 'react';

import {
  useRateLimitRules,
  useDeleteRateLimitRule,
  useToggleRateLimitRule,
} from '@nasnet/api-client/queries';
import type { RateLimitRule } from '@nasnet/core/types';
import { useConnectionStore } from '@nasnet/state/stores';

import type { RateLimitRulesTableProps } from './types';

/**
 * Headless hook for rate limit rules table logic
 *
 * Separates business logic from presentation following the
 * Headless + Platform Presenters pattern (ADR-018).
 *
 * @param props - Component props
 * @returns State and handlers for rate limit rules table
 */
export function useRateLimitRulesTable(props: RateLimitRulesTableProps) {
  const { actionFilter, statusFilter = 'all' } = props;

  // Get router IP from connection store
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';

  // Fetch rate limit rules
  const { data: rules, isLoading, error } = useRateLimitRules(routerIp);

  // Mutations
  const deleteRateLimitRule = useDeleteRateLimitRule(routerIp);
  const toggleRateLimitRule = useToggleRateLimitRule(routerIp);

  // UI state
  const [editingRule, setEditingRule] = useState<RateLimitRule | null>(null);
  const [deleteConfirmRule, setDeleteConfirmRule] = useState<RateLimitRule | null>(null);
  const [statsRule, setStatsRule] = useState<RateLimitRule | null>(null);

  // Filter rules based on filters
  const filteredRules = useMemo(() => {
    if (!rules) return [];

    let filtered = [...rules];

    // Filter by action
    if (actionFilter && actionFilter !== 'all') {
      filtered = filtered.filter((rule) => rule.action === actionFilter);
    }

    // Filter by enabled/disabled status
    if (statusFilter === 'enabled') {
      filtered = filtered.filter((rule) => !rule.isDisabled);
    } else if (statusFilter === 'disabled') {
      filtered = filtered.filter((rule) => rule.isDisabled);
    }

    // Sort by order (no manual ordering field in RateLimitRule, using ID)
    return filtered;
  }, [rules, actionFilter, statusFilter]);

  // Calculate max bytes for relative bar visualization
  const maxBytes = useMemo(() => {
    if (!filteredRules || filteredRules.length === 0) return 0;
    return Math.max(...filteredRules.map((r) => r.bytes ?? 0));
  }, [filteredRules]);

  // Handlers
  const handleEdit = (rule: RateLimitRule) => {
    setEditingRule(rule);
  };

  const handleDuplicate = (rule: RateLimitRule) => {
    // Create a copy without ID
    const duplicatedRule: RateLimitRule = {
      ...rule,
      id: undefined,
      comment: rule.comment ? `${rule.comment} (copy)` : 'Copy',
    };
    setEditingRule(duplicatedRule);
  };

  const handleDelete = (rule: RateLimitRule) => {
    setDeleteConfirmRule(rule);
  };

  const handleToggle = (rule: RateLimitRule) => {
    if (!rule.id) return;
    toggleRateLimitRule.mutate({
      ruleId: rule.id,
      disabled: !rule.isDisabled,
    });
  };

  const handleShowStats = (rule: RateLimitRule) => {
    setStatsRule(rule);
  };

  const confirmDelete = () => {
    if (deleteConfirmRule?.id) {
      deleteRateLimitRule.mutate(deleteConfirmRule.id);
      setDeleteConfirmRule(null);
    }
  };

  const closeEdit = () => {
    setEditingRule(null);
  };

  const closeDelete = () => {
    setDeleteConfirmRule(null);
  };

  const closeStats = () => {
    setStatsRule(null);
  };

  return {
    // Data
    rules: filteredRules,
    isLoading,
    error,
    maxBytes,

    // UI state
    editingRule,
    deleteConfirmRule,
    statsRule,

    // Handlers
    handleEdit,
    handleDuplicate,
    handleDelete,
    handleToggle,
    handleShowStats,
    confirmDelete,
    closeEdit,
    closeDelete,
    closeStats,
  };
}
