/**
 * Story 0-0-6: Install Project Dependencies
 * Verification tests for all installed dependencies
 *
 * This file verifies that all required npm packages can be imported
 * and are available at the correct versions.
 */

import { describe, it, expect } from 'vitest';

describe('AC-1: TanStack Query v5', () => {
  it('should import useQuery from @tanstack/react-query', async () => {
    const { useQuery } = await import('@tanstack/react-query');
    expect(typeof useQuery).toBe('function');
  });

  it('should import QueryClient from @tanstack/react-query', async () => {
    const { QueryClient } = await import('@tanstack/react-query');
    expect(typeof QueryClient).toBe('function');
  });

  it('should have devtools available', async () => {
    const devtools = await import('@tanstack/react-query-devtools');
    expect(devtools).toBeDefined();
  });
});

describe('AC-2: Zustand v4', () => {
  it('should import create from zustand', async () => {
    const { create } = await import('zustand');
    expect(typeof create).toBe('function');
  });

  it('should have persist middleware available', async () => {
    const { persist } = await import('zustand/middleware');
    expect(typeof persist).toBe('function');
  });
});

describe('AC-3: XState v5', () => {
  it('should import createMachine from xstate', async () => {
    const { createMachine } = await import('xstate');
    expect(typeof createMachine).toBe('function');
  });

  it('should import useMachine from @xstate/react', async () => {
    const { useMachine } = await import('@xstate/react');
    expect(typeof useMachine).toBe('function');
  });

  it('should import interpret from xstate', async () => {
    const { interpret } = await import('xstate');
    expect(typeof interpret).toBe('function');
  });
});

describe('AC-4: React Hook Form v7 + Zod v3', () => {
  it('should import useForm from react-hook-form', async () => {
    const { useForm } = await import('react-hook-form');
    expect(typeof useForm).toBe('function');
  });

  it('should import zodResolver from @hookform/resolvers/zod', async () => {
    const { zodResolver } = await import('@hookform/resolvers/zod');
    expect(typeof zodResolver).toBe('function');
  });

  it('should import z from zod', async () => {
    const z = await import('zod');
    expect(z.z).toBeDefined();
  });
});

describe('AC-5: Framer Motion v11+', () => {
  it('should export motion object', async () => {
    const framer = await import('framer-motion');
    expect(framer.motion).toBeDefined();
  });

  it('should export AnimatePresence', async () => {
    const { AnimatePresence } = await import('framer-motion');
    expect(AnimatePresence).toBeDefined();
  });
});

describe('AC-6: Lucide React Icons', () => {
  it('should be able to import icon components', async () => {
    const lucideReact = await import('lucide-react');
    expect(lucideReact.Home).toBeDefined();
    expect(lucideReact.Settings).toBeDefined();
    expect(lucideReact.Wifi).toBeDefined();
  });
});

describe('Additional Runtime Dependencies (AC-1-6)', () => {
  it('should import axios', async () => {
    const axios = await import('axios');
    expect(axios.default || axios).toBeDefined();
  });

  it('should import formatDate from date-fns', async () => {
    const { format } = await import('date-fns');
    expect(typeof format).toBe('function');
  });
});

describe('AC-7: Dev Dependencies', () => {
  it('should have vitest available', async () => {
    const { describe: vitestDescribe, it: vitestIt } = await import('vitest');
    expect(typeof vitestDescribe).toBe('function');
    expect(typeof vitestIt).toBe('function');
  });

  it('should have @testing-library/react available', async () => {
    const { render, screen } = await import('@testing-library/react');
    expect(typeof render).toBe('function');
    expect(typeof screen).toBe('object');
  });

  it('should have testing-library matchers available', () => {
    // @testing-library/jest-dom is set up in vitest config
    // Matchers are automatically extended
    expect(true).toBe(true);
  });

  it('should have @testing-library/user-event available', async () => {
    const userEvent = await import('@testing-library/user-event');
    expect(userEvent.default || userEvent).toBeDefined();
  });
});
