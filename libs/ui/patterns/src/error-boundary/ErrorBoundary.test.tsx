/**
 * ErrorBoundary Tests
 *
 * @see NAS-4.15: Implement Error Boundaries & Global Error Handling
 */

import * as React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ErrorBoundary } from './ErrorBoundary';

// Component that throws an error
function ThrowingComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

// Suppress console.error during tests
const originalError = console.error;
const originalGroup = console.group;
const originalGroupEnd = console.groupEnd;

beforeEach(() => {
  console.error = vi.fn();
  console.group = vi.fn();
  console.groupEnd = vi.fn();
});

afterEach(() => {
  console.error = originalError;
  console.group = originalGroup;
  console.groupEnd = originalGroupEnd;
});

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary fallback={<div>Error occurred</div>}>
        <div>Child content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Child content')).toBeInTheDocument();
    expect(screen.queryByText('Error occurred')).not.toBeInTheDocument();
  });

  it('renders fallback when error occurs', () => {
    render(
      <ErrorBoundary fallback={<div>Error occurred</div>}>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error occurred')).toBeInTheDocument();
    expect(screen.queryByText('No error')).not.toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary fallback={<div>Error</div>} onError={onError}>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('passes error and reset to fallback render prop', () => {
    const fallbackFn = vi.fn().mockReturnValue(<div>Fallback rendered</div>);

    render(
      <ErrorBoundary fallback={fallbackFn}>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(fallbackFn).toHaveBeenCalledWith({
      error: expect.any(Error),
      errorInfo: expect.objectContaining({
        componentStack: expect.any(String),
      }),
      resetErrorBoundary: expect.any(Function),
    });
    expect(screen.getByText('Fallback rendered')).toBeInTheDocument();
  });

  it('resets error state when resetErrorBoundary is called', () => {
    function TestComponent() {
      const [shouldThrow, setShouldThrow] = React.useState(true);

      return (
        <ErrorBoundary
          fallback={({ resetErrorBoundary }) => (
            <button
              onClick={() => {
                setShouldThrow(false);
                resetErrorBoundary();
              }}
            >
              Reset
            </button>
          )}
        >
          <ThrowingComponent shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
    }

    render(<TestComponent />);

    expect(screen.getByText('Reset')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Reset'));

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('resets when resetKey changes', () => {
    function TestComponent() {
      const [key, setKey] = React.useState(0);
      const [shouldThrow, setShouldThrow] = React.useState(true);

      return (
        <div>
          <button
            onClick={() => {
              setShouldThrow(false);
              setKey((k) => k + 1);
            }}
          >
            Change Key
          </button>
          <ErrorBoundary
            resetKey={key}
            fallback={<div>Error fallback</div>}
          >
            <ThrowingComponent shouldThrow={shouldThrow} />
          </ErrorBoundary>
        </div>
      );
    }

    render(<TestComponent />);

    expect(screen.getByText('Error fallback')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Change Key'));

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('calls onReset callback when resetting', () => {
    const onReset = vi.fn();

    function TestComponent() {
      const [shouldThrow, setShouldThrow] = React.useState(true);

      return (
        <ErrorBoundary
          onReset={onReset}
          fallback={({ resetErrorBoundary }) => (
            <button
              onClick={() => {
                setShouldThrow(false);
                resetErrorBoundary();
              }}
            >
              Reset
            </button>
          )}
        >
          <ThrowingComponent shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
    }

    render(<TestComponent />);
    fireEvent.click(screen.getByText('Reset'));

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('renders default fallback with role="alert" when no fallback provided', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    // The default fallback has role="alert"
    const alertElement = screen.getByRole('alert');
    expect(alertElement).toBeInTheDocument();
    expect(alertElement).toHaveTextContent('Something went wrong');
  });

  it('default fallback shows error message', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('default fallback has retry button', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Try again')).toBeInTheDocument();
  });
});
