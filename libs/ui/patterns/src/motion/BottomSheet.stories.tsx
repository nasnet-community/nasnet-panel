/**
 * BottomSheet Storybook Stories
 *
 * Demonstrates the mobile-optimized BottomSheet component with swipe-to-dismiss,
 * backdrop behaviour, and the BottomSheetHeader / BottomSheetContent /
 * BottomSheetFooter sub-components.
 *
 * @module @nasnet/ui/patterns/motion
 */

import * as React from 'react';

import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetFooter,
  BottomSheetHeader,
  useBottomSheet,
} from './BottomSheet';

import type { Meta, StoryObj } from '@storybook/react';

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof BottomSheet> = {
  title: 'Patterns/Motion/BottomSheet',
  component: BottomSheet,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## BottomSheet

A mobile-optimised bottom sheet with swipe-to-dismiss gesture, backdrop, focus
trap, and Escape key support. Built with Framer Motion and respects the
\`AnimationProvider\` reduced-motion preference.

### Sub-components
| Component | Purpose |
|-----------|---------|
| \`BottomSheetHeader\` | Title row with standard border-bottom |
| \`BottomSheetContent\` | Padded content area |
| \`BottomSheetFooter\` | Action row with border-top |

### Hook
\`useBottomSheet(initialOpen?)\` manages open/close state and exposes
\`isOpen\`, \`open\`, \`close\`, and \`toggle\`.

### Accessibility
- \`role="dialog"\` with \`aria-modal="true"\`
- Focus trap traps keyboard navigation inside the sheet
- Escape key closes the sheet
- Drag handle labelled for screen readers
        `,
      },
    },
  },
  argTypes: {
    isOpen: { control: 'boolean', description: 'Whether the sheet is open' },
    showBackdrop: {
      control: 'boolean',
      description: 'Whether to render a dimmed backdrop',
    },
    closeOnBackdropClick: {
      control: 'boolean',
      description: 'Close when the backdrop is clicked',
    },
    swipeToDismiss: {
      control: 'boolean',
      description: 'Enable drag-to-dismiss gesture',
    },
    swipeThreshold: {
      control: { type: 'range', min: 50, max: 300, step: 10 },
      description: 'Drag distance (px) required to dismiss',
    },
    velocityThreshold: {
      control: { type: 'range', min: 100, max: 1000, step: 50 },
      description: 'Velocity (px/s) required to dismiss',
    },
  },
};

export default meta;
type Story = StoryObj<typeof BottomSheet>;

// ============================================================================
// Wrapper that wires open/close for interactive demos
// ============================================================================

function SheetDemo({
  label = 'Open Sheet',
  sheetProps,
  children,
}: {
  label?: string;
  sheetProps?: Partial<React.ComponentProps<typeof BottomSheet>>;
  children?: React.ReactNode;
}) {
  const { isOpen, open, close } = useBottomSheet();

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={open}
        className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring rounded-lg px-5 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2"
      >
        {label}
      </button>

      <BottomSheet
        isOpen={isOpen}
        onClose={close}
        {...sheetProps}
      >
        {children ?? (
          <>
            <BottomSheetHeader>Sheet Title</BottomSheetHeader>
            <BottomSheetContent>
              <p className="text-muted-foreground text-sm">
                This is the sheet content. Swipe down or press Escape to close.
              </p>
            </BottomSheetContent>
            <BottomSheetFooter>
              <button
                onClick={close}
                className="hover:bg-muted rounded-md border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm">
                Confirm
              </button>
            </BottomSheetFooter>
          </>
        )}
      </BottomSheet>

      <p className="text-muted-foreground text-xs">
        State: <span className="font-mono">{isOpen ? 'open' : 'closed'}</span>
      </p>
    </div>
  );
}

// ============================================================================
// Stories
// ============================================================================

/**
 * Default bottom sheet with header, content, and footer.
 * Swipe down or press Escape to dismiss.
 */
export const Default: Story = {
  render: () => <SheetDemo />,
};

/**
 * Sheet without a backdrop – content remains visible beneath it.
 */
export const NoBackdrop: Story = {
  render: () => (
    <SheetDemo
      label="Open (no backdrop)"
      sheetProps={{ showBackdrop: false }}
    />
  ),
};

/**
 * Backdrop does not close the sheet on click.
 * Only the footer Cancel button or Escape key will close it.
 */
export const BackdropNotDismissable: Story = {
  render: () => (
    <SheetDemo
      label="Open (backdrop stays)"
      sheetProps={{ closeOnBackdropClick: false }}
    />
  ),
};

/**
 * Swipe-to-dismiss is disabled. The sheet can only be dismissed
 * via the footer Cancel button or Escape key.
 */
export const NoSwipeToDismiss: Story = {
  render: () => (
    <SheetDemo
      label="Open (no swipe)"
      sheetProps={{ swipeToDismiss: false }}
    />
  ),
};

/**
 * A richer sheet showing a network settings form layout
 * with labelled form fields inside the content area.
 */
export const NetworkSettingsSheet: Story = {
  render: () => {
    function Content({ onClose }: { onClose: () => void }) {
      return (
        <>
          <BottomSheetHeader>Network Settings</BottomSheetHeader>
          <BottomSheetContent>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="bs-ip-address"
                  className="text-sm font-medium"
                >
                  IP Address
                </label>
                <input
                  id="bs-ip-address"
                  className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  placeholder="192.168.1.1"
                  defaultValue="192.168.88.1"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="bs-subnet-mask"
                  className="text-sm font-medium"
                >
                  Subnet Mask
                </label>
                <input
                  id="bs-subnet-mask"
                  className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  placeholder="255.255.255.0"
                  defaultValue="255.255.255.0"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="bs-gateway"
                  className="text-sm font-medium"
                >
                  Gateway
                </label>
                <input
                  id="bs-gateway"
                  className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  placeholder="192.168.1.254"
                  defaultValue="192.168.88.254"
                />
              </div>
            </div>
          </BottomSheetContent>
          <BottomSheetFooter>
            <button
              onClick={onClose}
              className="hover:bg-muted rounded-md border px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm">
              Save Changes
            </button>
          </BottomSheetFooter>
        </>
      );
    }

    function Demo() {
      const { isOpen, open, close } = useBottomSheet();
      return (
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={open}
            className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring rounded-lg px-5 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2"
          >
            Edit Network Settings
          </button>
          <BottomSheet
            isOpen={isOpen}
            onClose={close}
            aria-label="Network Settings"
          >
            <Content onClose={close} />
          </BottomSheet>
        </div>
      );
    }

    return <Demo />;
  },
};

/**
 * Confirmation dialog variant – destructive action with short swipe threshold.
 */
export const ConfirmationSheet: Story = {
  render: () => {
    function Demo() {
      const { isOpen, open, close } = useBottomSheet();
      return (
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={open}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-ring rounded-lg px-5 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2"
          >
            Delete Interface
          </button>
          <BottomSheet
            isOpen={isOpen}
            onClose={close}
            swipeThreshold={60}
            aria-label="Confirm deletion"
          >
            <BottomSheetHeader>Delete Interface?</BottomSheetHeader>
            <BottomSheetContent>
              <p className="text-muted-foreground text-sm">
                This will permanently remove <strong>eth0</strong> and all associated rules. This
                action cannot be undone.
              </p>
            </BottomSheetContent>
            <BottomSheetFooter>
              <button
                onClick={close}
                className="hover:bg-muted rounded-md border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md px-4 py-2 text-sm">
                Delete
              </button>
            </BottomSheetFooter>
          </BottomSheet>
        </div>
      );
    }
    return <Demo />;
  },
};
