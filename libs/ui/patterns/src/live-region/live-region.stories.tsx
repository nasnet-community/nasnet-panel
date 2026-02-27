/**
 * LiveRegion Component Stories
 *
 * ARIA live region announcements for screen readers.
 * Demonstrates polite vs assertive modes and atomic vs non-atomic updates.
 *
 * @see WCAG 4.1.3: Status Messages
 */

import { useState } from 'react';

import { Button } from '@nasnet/ui/primitives';

import { LiveRegion, useAnnounce, AnnouncerProvider, useAnnouncer } from './live-region';

import type { Meta, StoryObj } from '@storybook/react';

// ─── Wrapper for AnnouncerProvider stories ─────────────────────────────────

function AnnouncerDemoWrapper({ children }: { children: React.ReactNode }) {
  return <AnnouncerProvider>{children}</AnnouncerProvider>;
}

// ─── Meta ──────────────────────────────────────────────────────────────────

const meta: Meta<typeof LiveRegion> = {
  title: 'Patterns/Common/LiveRegion',
  component: LiveRegion,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'ARIA live region for announcing dynamic content changes to screen readers. ' +
          'Use `polite` mode for non-urgent updates and `assertive` mode for critical alerts. ' +
          'Set `atomic={true}` to re-read entire region, or `false` to announce only changes.',
      },
    },
  },
  argTypes: {
    mode: {
      control: 'select',
      options: ['polite', 'assertive'],
      description: 'Announcement priority level',
    },
    atomic: {
      control: 'boolean',
      description: 'Re-announce entire region (true) or only changes (false)',
    },
    role: {
      control: 'select',
      options: ['status', 'alert', 'log', 'timer'],
      description: 'ARIA role for the region',
    },
    visible: {
      control: 'boolean',
      description: 'Show visually (default hidden for screen readers only)',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof LiveRegion>;

// ─── Stories ──────────────────────────────────────────────────────────────

/**
 * Default polite announcement, hidden from visual display.
 */
export const DefaultPolite: Story = {
  args: {
    mode: 'polite',
    atomic: true,
    role: 'status',
    visible: false,
    children: 'Settings saved successfully',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Polite mode announcement (default). Waits for current user task to complete before announcing. Rendered off-screen.',
      },
    },
  },
};

/**
 * Assertive alert mode for urgent messages.
 */
export const AssertiveAlert: Story = {
  args: {
    mode: 'assertive',
    atomic: true,
    role: 'alert',
    visible: true,
    children: 'Critical error: Configuration failed',
    className: 'bg-semantic-error text-white p-4 rounded',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Assertive mode announcement. Interrupts immediately for critical alerts. Can be shown visually.',
      },
    },
  },
};

/**
 * Log mode for sequential messages (e.g., operation steps).
 */
export const LogMode: Story = {
  args: {
    mode: 'polite',
    atomic: false,
    role: 'log',
    visible: false,
    children: 'Step 3 of 5: Validating configuration...',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Log mode for sequential messages. `atomic={false}` announces only new content, not repeated parts.',
      },
    },
  },
};

/**
 * Timer mode for countdown announcements.
 */
export const TimerMode: Story = {
  args: {
    mode: 'polite',
    atomic: true,
    role: 'timer',
    visible: false,
    children: '5 seconds remaining before rollback',
  },
  parameters: {
    docs: {
      description: {
        story: 'Timer mode for countdown messages. Atomic announcements for time-critical updates.',
      },
    },
  },
};

/**
 * Interactive demo using useAnnounce hook.
 */
export const InteractiveAnnounce: Story = {
  render: () => {
    function Demo() {
      const { message, priority, announce } = useAnnounce();
      const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

      const handleSave = async () => {
        setStatus('loading');
        announce('Saving configuration...', 'polite');

        await new Promise((resolve) => setTimeout(resolve, 2000));

        setStatus('success');
        announce('Configuration saved successfully!', 'polite');

        setTimeout(() => setStatus('idle'), 3000);
      };

      const handleError = () => {
        setStatus('error');
        announce('Error: Failed to save configuration', 'assertive');

        setTimeout(() => setStatus('idle'), 3000);
      };

      return (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={status !== 'idle'}
            >
              {status === 'idle' && 'Save Configuration'}
              {status === 'loading' && 'Saving...'}
              {status === 'success' && 'Saved!'}
              {status === 'error' && 'Error'}
            </Button>
            <Button
              onClick={handleError}
              variant="destructive"
              disabled={status !== 'idle'}
            >
              Simulate Error
            </Button>
          </div>

          <LiveRegion mode={priority}>{message}</LiveRegion>

          <div className="text-muted-foreground text-sm">
            <p>
              Current status: <span className="font-mono">{status}</span>
            </p>
            <p className="mt-1">
              Screen reader announcement (in sr-only region): {message || '(empty)'}
            </p>
          </div>
        </div>
      );
    }

    return <Demo />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive example using `useAnnounce` hook. Click "Save Configuration" to announce a polite message, ' +
          'or "Simulate Error" to announce an assertive alert.',
      },
    },
  },
};

/**
 * Global announcer with AnnouncerProvider context.
 */
export const GlobalAnnouncer: Story = {
  render: () => {
    function Demo() {
      return (
        <AnnouncerDemoWrapper>
          <GlobalAnnouncerDemo />
        </AnnouncerDemoWrapper>
      );
    }

    function GlobalAnnouncerDemo() {
      const { announce } = useAnnouncer();
      const [count, setCount] = useState(0);

      const handleIncrement = () => {
        const newCount = count + 1;
        setCount(newCount);
        announce(`Counter incremented to ${newCount}`, 'polite');
      };

      const handleWarning = () => {
        announce('Warning: Value is getting high!', 'assertive');
      };

      return (
        <div className="space-y-4">
          <div className="bg-card border-border rounded border p-4">
            <p className="text-2xl font-bold">{count}</p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleIncrement}>Increment</Button>
            <Button
              onClick={handleWarning}
              variant="outline"
            >
              Warn (Assertive)
            </Button>
          </div>

          <p className="text-muted-foreground text-sm">
            Screen reader will announce changes using the global AnnouncerProvider.
          </p>
        </div>
      );
    }

    return <Demo />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Global announcements via `AnnouncerProvider` context. Use `useAnnouncer()` from any nested component ' +
          'to announce messages without prop drilling.',
      },
    },
  },
};

/**
 * Visible announcement (e.g., error banner).
 */
export const VisibleErrorBanner: Story = {
  args: {
    mode: 'assertive',
    atomic: true,
    role: 'alert',
    visible: true,
    children: (
      <div className="bg-semantic-error/10 border-semantic-error text-semantic-error rounded border p-4">
        <strong>Connection lost:</strong> Unable to reach the router. Please check your network
        connection.
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Live region visible both visually and to screen readers. Useful for error messages and alerts that ' +
          'should draw user attention.',
      },
    },
  },
};

/**
 * Non-atomic (partial) announcements.
 */
export const NonAtomic: Story = {
  render: () => {
    function Demo() {
      const [messages, setMessages] = useState<string[]>([]);

      const addMessage = (msg: string) => {
        setMessages((prev) => [...prev, msg]);
      };

      return (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => addMessage('Step 1 complete')}
            >
              Add Step 1
            </Button>
            <Button
              size="sm"
              onClick={() => addMessage('Step 2 complete')}
            >
              Add Step 2
            </Button>
            <Button
              size="sm"
              onClick={() => addMessage('Step 3 complete')}
            >
              Add Step 3
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setMessages([])}
            >
              Clear
            </Button>
          </div>

          <LiveRegion
            mode="polite"
            atomic={false}
            role="log"
            visible={false}
          >
            {messages.map((msg, i) => (
              <div key={i}>{msg}</div>
            ))}
          </LiveRegion>

          <p className="text-muted-foreground text-sm">
            With `atomic={false}`, only newly added steps are announced, not the entire log. Current
            messages: {messages.length > 0 ? messages.join(', ') : '(empty)'}
          </p>
        </div>
      );
    }

    return <Demo />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Non-atomic (partial) announcements: only changed content is announced. Useful for logs where you ' +
          "don't want to repeat all previous entries.",
      },
    },
  },
};
