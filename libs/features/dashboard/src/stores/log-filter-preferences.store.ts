/**
 * Zustand store for log filter preferences
 * Persists selected log topics to localStorage for dashboard widget
 * Story NAS-5.6: Recent Logs with Filtering
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LogTopic } from '@nasnet/core/types';

interface LogFilterPreferencesState {
  selectedTopics: LogTopic[];
  setSelectedTopics: (topics: LogTopic[]) => void;
  toggleTopic: (topic: LogTopic) => void;
  clearFilters: () => void;
}

export const useLogFilterPreferencesStore = create<LogFilterPreferencesState>()(
  persist(
    (set, get) => ({
      selectedTopics: [], // Empty = all topics
      setSelectedTopics: (topics) => set({ selectedTopics: topics }),
      toggleTopic: (topic) => {
        const current = get().selectedTopics;
        const exists = current.includes(topic);
        set({
          selectedTopics: exists
            ? current.filter((t) => t !== topic)
            : [...current, topic],
        });
      },
      clearFilters: () => set({ selectedTopics: [] }),
    }),
    {
      name: 'log-filter-preferences',
    }
  )
);
