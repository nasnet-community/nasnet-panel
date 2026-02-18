/**
 * Accordion Component
 *
 * Built on @radix-ui/react-collapsible
 * Simple accordion implementation for mobile layouts
 */

import * as React from 'react';

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { ChevronDown } from 'lucide-react';

import { cn } from './lib/utils';

// ============================================================================
// Accordion Context
// ============================================================================

interface AccordionContextValue {
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  type?: 'single' | 'multiple';
}

const AccordionContext = React.createContext<AccordionContextValue>({});

// ============================================================================
// Accordion Root
// ============================================================================

export interface AccordionProps {
  type?: 'single' | 'multiple';
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  className?: string;
  children?: React.ReactNode;
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ type = 'single', value, defaultValue, onValueChange, className, children }, ref) => {
    const [internalValue, setInternalValue] = React.useState<string | string[]>(
      defaultValue || (type === 'multiple' ? [] : '')
    );

    const currentValue = value !== undefined ? value : internalValue;
    const handleValueChange = onValueChange || setInternalValue;

    return (
      <AccordionContext.Provider value={{ value: currentValue, onValueChange: handleValueChange, type }}>
        <div ref={ref} className={cn('space-y-2', className)}>
          {children}
        </div>
      </AccordionContext.Provider>
    );
  }
);
Accordion.displayName = 'Accordion';

// ============================================================================
// Accordion Item
// ============================================================================

interface AccordionItemContextValue {
  value: string;
  isOpen: boolean;
  onToggle: () => void;
}

const AccordionItemContext = React.createContext<AccordionItemContextValue>({
  value: '',
  isOpen: false,
  onToggle: () => {},
});

export interface AccordionItemProps {
  value: string;
  className?: string;
  children?: React.ReactNode;
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value: itemValue, className, children }, ref) => {
    const { value, onValueChange, type } = React.useContext(AccordionContext);

    const isOpen = React.useMemo(() => {
      if (type === 'multiple' && Array.isArray(value)) {
        return value.includes(itemValue);
      }
      return value === itemValue;
    }, [value, itemValue, type]);

    const onToggle = React.useCallback(() => {
      if (type === 'multiple' && Array.isArray(value)) {
        const newValue = isOpen
          ? value.filter((v) => v !== itemValue)
          : [...value, itemValue];
        onValueChange?.(newValue);
      } else {
        onValueChange?.(isOpen ? '' : itemValue);
      }
    }, [type, value, itemValue, isOpen, onValueChange]);

    return (
      <AccordionItemContext.Provider value={{ value: itemValue, isOpen, onToggle }}>
        <CollapsiblePrimitive.Root open={isOpen} onOpenChange={onToggle}>
          <div ref={ref} className={cn('border rounded-lg', className)}>
            {children}
          </div>
        </CollapsiblePrimitive.Root>
      </AccordionItemContext.Provider>
    );
  }
);
AccordionItem.displayName = 'AccordionItem';

// ============================================================================
// Accordion Trigger
// ============================================================================

export interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children?: React.ReactNode;
}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <CollapsiblePrimitive.Trigger asChild>
        <button
          ref={ref}
          className={cn(
            'flex w-full items-center justify-between p-4 font-medium transition-all',
            'hover:bg-muted/50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            '[&[data-state=open]>svg]:rotate-180',
            className
          )}
          {...props}
        >
          {children}
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
        </button>
      </CollapsiblePrimitive.Trigger>
    );
  }
);
AccordionTrigger.displayName = 'AccordionTrigger';

// ============================================================================
// Accordion Content
// ============================================================================

export interface AccordionContentProps {
  className?: string;
  children?: React.ReactNode;
}

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children }, ref) => {
    return (
      <CollapsiblePrimitive.Content
        ref={ref}
        className={cn(
          'overflow-hidden transition-all',
          'data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down'
        )}
      >
        <div className={cn('p-4 pt-0', className)}>{children}</div>
      </CollapsiblePrimitive.Content>
    );
  }
);
AccordionContent.displayName = 'AccordionContent';

// ============================================================================
// Exports
// ============================================================================

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
