/**
 * PortInputMobile - Mobile Presenter for Port Input
 *
 * Mobile-optimized port input with:
 * - 44px touch targets
 * - Single mode: Full-width input with service below
 * - Range mode: Stacked vertical inputs with labels
 * - Multi mode: Chips with "Add" button
 * - Numeric keyboard via inputMode="numeric"
 *
 * @module @nasnet/ui/patterns/network-inputs/port-input
 */

import { memo, useId } from 'react';

import { Plus, X } from 'lucide-react';

import { Input, cn, Badge, Button, Label } from '@nasnet/ui/primitives';

import { PORT_CATEGORY_LABELS } from './port-input.types';
import { usePortInput, parseSinglePort } from './use-port-input';

import type { PortInputMobileProps, PortSuggestion } from './port-input.types';

/**
 * Group suggestions by category for dropdown display.
 */
function groupSuggestionsByCategory(
  suggestions: PortSuggestion[]
): Map<string, PortSuggestion[]> {
  const groups = new Map<string, PortSuggestion[]>();

  suggestions.forEach((suggestion) => {
    const category = suggestion.category;
    const existing = groups.get(category);
    if (existing) {
      existing.push(suggestion);
    } else {
      groups.set(category, [suggestion]);
    }
  });

  return groups;
}

/**
 * Mobile presenter for port input component.
 */
export const PortInputMobile = memo(function PortInputMobile(
  props: PortInputMobileProps
) {
  const {
    mode = 'single',
    protocol = 'tcp',
    showService = true,
    showSuggestions = false,
    disabled = false,
    error: externalError,
    label,
    placeholder,
    helpText,
    className,
    name,
    required,
    onBlur,
    onFocus,
    id: externalId,
    'aria-describedby': ariaDescribedBy,
    hookConfig,
    min = 1,
    max = 65535,
    ...rest
  } = props;

  const generatedId = useId();
  const inputId = externalId || generatedId;
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;
  const suggestionsId = `${inputId}-suggestions`;

  const {
    ports,
    inputValue,
    rangeStartValue,
    rangeEndValue,
    portCount,
    error: validationError,
    serviceName,
    handleChange,
    handleRangeStartChange,
    handleRangeEndChange,
    handleAddPort,
    handleRemovePort,
    handleKeyDown,
    handleBlur,
    handleFocus,
    suggestions,
    showSuggestionsDropdown,
    selectedSuggestionIndex,
    handleSelectSuggestion,
    inputRef,
    rangeStartRef,
    rangeEndRef,
    suggestionsRef,
  } = usePortInput({
    value: rest.value,
    onChange: rest.onChange,
    mode,
    protocol,
    showService,
    showSuggestions,
    min,
    max,
    ...hookConfig,
  });

  const error = externalError || validationError;
  const hasError = !!error;

  const handleInputBlur = () => {
    handleBlur();
    onBlur?.();
  };

  const handleInputFocus = () => {
    handleFocus();
    onFocus?.();
  };

  // Handle add button click for multi mode
  const handleAddClick = () => {
    const parsed = parseSinglePort(inputValue, min, max);
    if (parsed !== null) {
      handleAddPort(parsed);
    }
  };

  // Suggestions dropdown (mobile-optimized)
  const renderSuggestions = () => {
    if (!showSuggestions || !showSuggestionsDropdown || suggestions.length === 0) {
      return null;
    }

    const groupedSuggestions = groupSuggestionsByCategory(suggestions);

    return (
      <div
        ref={suggestionsRef}
        id={suggestionsId}
        role="listbox"
        aria-label="Port suggestions"
        className="absolute top-full left-0 right-0 z-50 mt-1 max-h-72 overflow-auto rounded-md border bg-popover p-1 shadow-md"
      >
        {Array.from(groupedSuggestions.entries()).map(([category, items]) => (
          <div key={category} className="mb-2 last:mb-0">
            <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {category === 'recent'
                ? 'Recent'
                : PORT_CATEGORY_LABELS[category as keyof typeof PORT_CATEGORY_LABELS] || category}
            </div>
            {items.map((suggestion) => {
              const globalIndex = suggestions.findIndex(
                (s) => s.port === suggestion.port && s.category === suggestion.category
              );
              const isSelected = globalIndex === selectedSuggestionIndex;

              return (
                <button
                  key={`${suggestion.port}-${suggestion.category}`}
                  id={`${suggestionsId}-${globalIndex}`}
                  role="option"
                  type="button"
                  aria-selected={isSelected}
                  className={cn(
                    'flex w-full cursor-pointer items-center justify-between rounded-sm px-3 py-2.5 text-sm',
                    'min-h-[44px]', // Touch target
                    'hover:bg-accent hover:text-accent-foreground',
                    'active:bg-accent/80',
                    isSelected && 'bg-accent text-accent-foreground'
                  )}
                  onClick={() => handleSelectSuggestion(suggestion.port)}
                >
                  <span className="font-mono font-medium">{suggestion.port}</span>
                  <span className="text-muted-foreground">{suggestion.service}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // Single mode
  if (mode === 'single') {
    return (
      <div className={cn('relative space-y-2', className)}>
        {label && (
          <Label htmlFor={inputId} className={cn(required && "after:content-['*'] after:ml-0.5 after:text-error")}>
            {label}
          </Label>
        )}

        <div className="relative">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              id={inputId}
              name={name}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={inputValue}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onBlur={handleInputBlur}
              onFocus={handleInputFocus}
              disabled={disabled}
              placeholder={placeholder || 'Port (1-65535)'}
              className={cn(
                'font-mono h-11 flex-1', // 44px touch target
                hasError && 'border-error focus-visible:ring-error'
              )}
              aria-invalid={hasError}
              aria-describedby={cn(
                hasError && errorId,
                helpText && helpId,
                ariaDescribedBy
              )}
              aria-label={!label ? 'Port number' : undefined}
              aria-autocomplete={showSuggestions ? 'list' : undefined}
              aria-controls={showSuggestions ? suggestionsId : undefined}
              aria-activedescendant={
                selectedSuggestionIndex >= 0
                  ? `${suggestionsId}-${selectedSuggestionIndex}`
                  : undefined
              }
            />

            {/* Protocol badge */}
            <Badge variant="outline" className="uppercase text-xs h-11 px-3">
              {protocol}
            </Badge>
          </div>

          {renderSuggestions()}
        </div>

        {/* Service name (below input on mobile) */}
        {showService && serviceName && (
          <div aria-live="polite" className="text-sm text-muted-foreground">
            Service: <span className="font-medium">{serviceName}</span>
          </div>
        )}

        {/* Error message */}
        {hasError && (
          <p id={errorId} role="alert" aria-live="assertive" className="text-sm text-error">
            {error}
          </p>
        )}

        {/* Help text */}
        {helpText && !hasError && (
          <p id={helpId} className="text-sm text-muted-foreground">
            {helpText}
          </p>
        )}
      </div>
    );
  }

  // Range mode (stacked vertical layout on mobile)
  if (mode === 'range') {
    return (
      <div className={cn('relative space-y-3', className)}>
        {label && (
          <Label className={cn(required && "after:content-['*'] after:ml-0.5 after:text-error")}>
            {label}
          </Label>
        )}

        <div className="relative space-y-3">
          {/* Start port */}
          <div className="space-y-1.5">
            <Label htmlFor={`${inputId}-start`} className="text-sm text-muted-foreground">
              Start Port
            </Label>
            <Input
              ref={rangeStartRef}
              id={`${inputId}-start`}
              name={name ? `${name}-start` : undefined}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={rangeStartValue}
              onChange={(e) => handleRangeStartChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleInputBlur}
              onFocus={handleInputFocus}
              disabled={disabled}
              placeholder="1"
              className={cn(
                'font-mono h-11', // 44px touch target
                hasError && 'border-error focus-visible:ring-error'
              )}
              aria-label="Start port"
              aria-invalid={hasError}
            />
          </div>

          {/* End port */}
          <div className="space-y-1.5">
            <Label htmlFor={`${inputId}-end`} className="text-sm text-muted-foreground">
              End Port
            </Label>
            <Input
              ref={rangeEndRef}
              id={`${inputId}-end`}
              name={name ? `${name}-end` : undefined}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={rangeEndValue}
              onChange={(e) => handleRangeEndChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleInputBlur}
              onFocus={handleInputFocus}
              disabled={disabled}
              placeholder="65535"
              className={cn(
                'font-mono h-11', // 44px touch target
                hasError && 'border-error focus-visible:ring-error'
              )}
              aria-label="End port"
              aria-invalid={hasError}
            />
          </div>

          {/* Info row */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="uppercase text-xs">
              {protocol}
            </Badge>

            {portCount > 0 && (
              <span className="text-sm text-muted-foreground">
                {portCount} port{portCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {renderSuggestions()}
        </div>

        {/* Error message */}
        {hasError && (
          <p id={errorId} role="alert" aria-live="assertive" className="text-sm text-error">
            {error}
          </p>
        )}

        {/* Help text */}
        {helpText && !hasError && (
          <p id={helpId} className="text-sm text-muted-foreground">
            {helpText}
          </p>
        )}
      </div>
    );
  }

  // Multi mode (chips with add button)
  return (
    <div className={cn('relative space-y-3', className)}>
      {label && (
        <Label htmlFor={inputId} className={cn(required && "after:content-['*'] after:ml-0.5 after:text-error")}>
          {label}
        </Label>
      )}

      <div className="relative">
        {/* Input row with add button */}
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            id={inputId}
            name={name}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleInputBlur}
            onFocus={handleInputFocus}
            disabled={disabled}
            placeholder={placeholder || 'Enter port'}
            className={cn(
              'font-mono h-11 flex-1', // 44px touch target
              hasError && 'border-error focus-visible:ring-error'
            )}
            aria-label="Add port"
            aria-invalid={hasError}
            aria-describedby={cn(
              hasError && errorId,
              helpText && helpId,
              ariaDescribedBy
            )}
            aria-autocomplete={showSuggestions ? 'list' : undefined}
            aria-controls={showSuggestions ? suggestionsId : undefined}
          />

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11" // 44px touch target
            onClick={handleAddClick}
            disabled={disabled || !inputValue.trim()}
            aria-label="Add port"
          >
            <Plus className="h-5 w-5" />
          </Button>

          <Badge variant="outline" className="uppercase text-xs h-11 px-3">
            {protocol}
          </Badge>
        </div>

        {renderSuggestions()}
      </div>

      {/* Port chips */}
      {ports.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {ports.map((portNum) => (
            <Badge
              key={portNum}
              variant="secondary"
              className="gap-1.5 font-mono h-9 px-3 text-sm" // Larger touch-friendly chips
            >
              {portNum}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemovePort(portNum)}
                  className="ml-1 rounded-full hover:bg-background/50 p-0.5"
                  aria-label={`Remove port ${portNum}`}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Port count */}
      {portCount > 0 && (
        <p className="text-sm text-muted-foreground">
          {portCount} port{portCount !== 1 ? 's' : ''} selected
        </p>
      )}

      {/* Error message */}
      {hasError && (
        <p id={errorId} role="alert" aria-live="assertive" className="text-sm text-error">
          {error}
        </p>
      )}

      {/* Help text */}
      {helpText && !hasError && (
        <p id={helpId} className="text-sm text-muted-foreground">
          {helpText}
        </p>
      )}
    </div>
  );
});

PortInputMobile.displayName = 'PortInputMobile';

export default PortInputMobile;
