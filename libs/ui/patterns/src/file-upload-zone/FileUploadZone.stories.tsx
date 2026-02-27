/**
 * Stories for FileUploadZone component
 * Drag-and-drop file upload area with type/size validation
 */

import * as React from 'react';

import { FileUploadZone } from './FileUploadZone';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof FileUploadZone> = {
  title: 'Patterns/FileUploadZone',
  component: FileUploadZone,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A drag-and-drop file upload zone used throughout NasNetConnect for configuration imports and backup restores. Supports click-to-browse, file-type validation, size limits, loading, error, and disabled states.',
      },
    },
  },
  argTypes: {
    accept: {
      control: 'object',
      description: 'Accepted file extensions, e.g. `[".conf", ".json"]`',
    },
    maxSize: {
      control: 'number',
      description: 'Maximum file size in bytes (default 10 MB)',
    },
    isLoading: {
      control: 'boolean',
      description: 'Show uploading spinner and "Uploading…" label',
    },
    disabled: {
      control: 'boolean',
      description: 'Prevent interaction entirely',
    },
    error: {
      control: 'text',
      description: 'Error message to display below the icon',
    },
  },
  decorators: [
    (Story) => (
      <div className="mx-auto w-full max-w-md">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FileUploadZone>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default – Config File Upload',
  args: {
    accept: ['.conf', '.rsc'],
    onFile: (file: File) => alert(`Selected: ${file.name} (${file.size} bytes)`),
    isLoading: false,
    disabled: false,
    maxSize: 10 * 1024 * 1024,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default state. The zone accepts `.conf` and `.rsc` RouterOS configuration files up to 10 MB. Click the area or the "Select File" button to open the file picker.',
      },
    },
  },
};

export const BackupRestore: Story = {
  name: 'Backup Restore – .backup Files',
  args: {
    accept: ['.backup'],
    onFile: (file: File) => alert(`Backup selected: ${file.name}`),
    isLoading: false,
    disabled: false,
    maxSize: 50 * 1024 * 1024, // 50 MB for backups
  },
  parameters: {
    docs: {
      description: {
        story:
          'Accepts only `.backup` files with a generous 50 MB limit suitable for full router backups.',
      },
    },
  },
};

export const AnyFileType: Story = {
  name: 'Any File Type (No Restriction)',
  args: {
    accept: [],
    onFile: (file: File) => alert(`File: ${file.name}`),
    isLoading: false,
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `accept` is an empty array all file types are accepted and the help text below the zone is omitted.',
      },
    },
  },
};

export const LoadingState: Story = {
  name: 'Loading – Uploading in Progress',
  args: {
    accept: ['.conf'],
    onFile: () => {},
    isLoading: true,
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'While `isLoading` is true the zone shows an animated spinner, replaces the prompt text with "Uploading… Please wait", and becomes non-interactive.',
      },
    },
  },
};

export const ErrorState: Story = {
  name: 'Error – Upload Failed',
  args: {
    accept: ['.conf'],
    onFile: () => {},
    isLoading: false,
    error: 'File type not supported. Please upload a .conf or .rsc file.',
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `error` is set the zone border turns red, the icon changes to an alert circle, and the error message is displayed instead of the normal prompt.',
      },
    },
  },
};

export const DisabledState: Story = {
  name: 'Disabled',
  args: {
    accept: ['.conf'],
    onFile: () => {},
    isLoading: false,
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `disabled` is true the zone is visually dimmed and all interaction (click and drop) is blocked.',
      },
    },
  },
};

export const Interactive: Story = {
  name: 'Interactive – With File Feedback',
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [status, setStatus] = React.useState<'idle' | 'loading' | 'done' | 'error'>('idle');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [filename, setFilename] = React.useState<string>('');

    const handleFile = (file: File) => {
      setFilename(file.name);
      setStatus('loading');
      setTimeout(() => {
        // Simulate 50% chance of error for demo purposes
        if (file.name.endsWith('.txt')) {
          setStatus('error');
        } else {
          setStatus('done');
        }
      }, 1500);
    };

    const reset = () => {
      setStatus('idle');
      setFilename('');
    };

    return (
      <div className="max-w-md space-y-4">
        <FileUploadZone
          accept={['.conf', '.rsc', '.backup']}
          onFile={handleFile}
          isLoading={status === 'loading'}
          error={
            status === 'error' ?
              `"${filename}" could not be processed. Try a .conf or .backup file.`
            : undefined
          }
          disabled={status === 'done'}
        />

        {status === 'done' && (
          <div className="border-success/30 bg-success/10 text-success flex items-center justify-between rounded-lg border px-4 py-3 text-sm">
            <span>"{filename}" uploaded successfully.</span>
            <button
              onClick={reset}
              className="text-xs underline hover:no-underline"
            >
              Reset
            </button>
          </div>
        )}

        {status === 'error' && (
          <button
            onClick={reset}
            className="text-muted-foreground text-xs underline hover:no-underline"
          >
            Try again
          </button>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Full interactive demo: select a `.conf`, `.rsc`, or `.backup` file to see the loading → success flow. Selecting a `.txt` file triggers the error state. Rename any file to `.txt` to test the error path.',
      },
    },
  },
};
