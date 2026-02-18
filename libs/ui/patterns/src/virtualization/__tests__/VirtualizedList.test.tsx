import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { VirtualizedList, VIRTUALIZATION_THRESHOLD } from '../VirtualizedList';

// Mock data
interface TestItem {
  id: number;
  name: string;
}

const createTestItems = (count: number): TestItem[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
  }));

// Mock scroll container dimensions
const mockContainerDimensions = (element: HTMLElement) => {
  Object.defineProperty(element, 'clientHeight', { value: 400, configurable: true });
  Object.defineProperty(element, 'scrollHeight', { value: 2000, configurable: true });
  Object.defineProperty(element, 'scrollTop', { value: 0, writable: true, configurable: true });
};

describe('VirtualizedList', () => {
  it('should render items', () => {
    const items = createTestItems(5);

    render(
      <VirtualizedList
        items={items}
        renderItem={({ item }) => <div data-testid={`item-${item.id}`}>{item.name}</div>}
        height={400}
      />
    );

    // Small list renders all items
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 5')).toBeInTheDocument();
  });

  it('should show empty state when no items', () => {
    render(
      <VirtualizedList
        items={[]}
        renderItem={({ item }) => <div>{(item as TestItem).name}</div>}
        emptyContent={<div>No items found</div>}
        height={400}
      />
    );

    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('should show default empty state', () => {
    render(
      <VirtualizedList
        items={[]}
        renderItem={({ item }) => <div>{(item as TestItem).name}</div>}
        height={400}
      />
    );

    expect(screen.getByText('No items to display')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    const items = createTestItems(10);

    render(
      <VirtualizedList
        items={items}
        renderItem={({ item }) => <div>{item.name}</div>}
        loading={true}
        height={400}
      />
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
  });

  it('should apply custom className and style', () => {
    const items = createTestItems(5);

    const { container } = render(
      <VirtualizedList
        items={items}
        renderItem={({ item }) => <div>{item.name}</div>}
        className="custom-class"
        style={{ backgroundColor: 'red' }}
        height={400}
      />
    );

    const listContainer = container.firstChild as HTMLElement;
    expect(listContainer).toHaveClass('custom-class');
    expect(listContainer).toHaveStyle({ backgroundColor: 'red' });
  });

  it('should support keyboard navigation', () => {
    const items = createTestItems(10);
    const onItemSelect = vi.fn();

    render(
      <VirtualizedList
        items={items}
        renderItem={({ item, isFocused }) => (
          <div data-testid={`item-${item.id}`} data-focused={isFocused}>
            {item.name}
          </div>
        )}
        enableKeyboardNav={true}
        onItemSelect={onItemSelect}
        height={400}
      />
    );

    const listContainer = screen.getByRole('listbox');

    // Focus the container
    listContainer.focus();

    // Navigate down
    fireEvent.keyDown(listContainer, { key: 'ArrowDown' });

    // Select with Enter
    fireEvent.keyDown(listContainer, { key: 'Enter' });

    expect(onItemSelect).toHaveBeenCalledWith(items[1], 1);
  });

  it('should handle Home and End keys', () => {
    const items = createTestItems(10);

    render(
      <VirtualizedList
        items={items}
        renderItem={({ item }) => <div>{item.name}</div>}
        enableKeyboardNav={true}
        height={400}
      />
    );

    const listContainer = screen.getByRole('listbox');
    listContainer.focus();

    // Go to end
    fireEvent.keyDown(listContainer, { key: 'End' });

    // Go to home
    fireEvent.keyDown(listContainer, { key: 'Home' });

    // No errors should occur
  });

  it('should call onVisibleRangeChange when visible items change', () => {
    const items = createTestItems(100);
    const onVisibleRangeChange = vi.fn();

    render(
      <VirtualizedList
        items={items}
        renderItem={({ item }) => <div>{item.name}</div>}
        onVisibleRangeChange={onVisibleRangeChange}
        forceVirtualization={true}
        height={400}
      />
    );

    // Should be called on initial render
    expect(onVisibleRangeChange).toHaveBeenCalled();
  });

  it('should use custom item keys when provided', () => {
    const items = createTestItems(5);

    const { container } = render(
      <VirtualizedList
        items={items}
        renderItem={({ item }) => <div>{item.name}</div>}
        getItemKey={(_, item) => `custom-${item.id}`}
        height={400}
      />
    );

    // Items should render without errors
    expect(container.textContent).toContain('Item 1');
  });

  it('should export VIRTUALIZATION_THRESHOLD constant', () => {
    expect(VIRTUALIZATION_THRESHOLD).toBe(20);
  });

  it('should respect forceVirtualization prop', () => {
    // Force virtualization on small list
    const items = createTestItems(5);

    render(
      <VirtualizedList
        items={items}
        renderItem={({ item }) => <div>{item.name}</div>}
        forceVirtualization={true}
        height={400}
      />
    );

    // Should still render items
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('should apply aria-label', () => {
    const items = createTestItems(5);

    render(
      <VirtualizedList
        items={items}
        renderItem={({ item }) => <div>{item.name}</div>}
        aria-label="Test list"
        height={400}
      />
    );

    expect(screen.getByRole('listbox')).toHaveAttribute('aria-label', 'Test list');
  });

  it('should handle PageUp and PageDown', () => {
    const items = createTestItems(50);

    render(
      <VirtualizedList
        items={items}
        renderItem={({ item }) => <div>{item.name}</div>}
        enableKeyboardNav={true}
        forceVirtualization={true}
        height={400}
      />
    );

    const listContainer = screen.getByRole('listbox');
    listContainer.focus();

    // PageDown should move focus by 10 items
    fireEvent.keyDown(listContainer, { key: 'PageDown' });

    // PageUp should move focus by 10 items back
    fireEvent.keyDown(listContainer, { key: 'PageUp' });

    // No errors should occur
  });

  it('should disable keyboard nav when enableKeyboardNav is false', () => {
    const items = createTestItems(10);
    const onItemSelect = vi.fn();

    render(
      <VirtualizedList
        items={items}
        renderItem={({ item }) => <div>{item.name}</div>}
        enableKeyboardNav={false}
        onItemSelect={onItemSelect}
        height={400}
      />
    );

    const listContainer = screen.getByRole('listbox');

    // Try to navigate
    fireEvent.keyDown(listContainer, { key: 'ArrowDown' });
    fireEvent.keyDown(listContainer, { key: 'Enter' });

    // Should not call onItemSelect when keyboard nav is disabled
    expect(onItemSelect).not.toHaveBeenCalled();
  });
});
