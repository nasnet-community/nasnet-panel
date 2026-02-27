/**
 * PortInputDesktop - Desktop Presenter for Port Input
 *
 * Desktop-optimized port input with:
 * - Single mode: Number input with inline service badge
 * - Range mode: Two inputs side-by-side with "-" separator
 * - Multi mode: Tag-style chips with inline input and autocomplete
 * - Suggestions dropdown with category grouping
 *
 * @module @nasnet/ui/patterns/network-inputs/port-input
 */

import { memo, useId } from 'react';

import { X, Folder } from 'lucide-react';

import { Input, cn, Badge, Label } from '@nasnet/ui/primitives';

import { PORT_CATEGORY_LABELS } from './port-input.types';
import { usePortInput } from './use-port-input';

import type { PortInputDesktopProps, PortSuggestion } from './port-input.types';

/**
 * Group suggestions by category for dropdown display.
 */
function groupSuggestionsByCategory(suggestions: PortSuggestion[]): Map<string, PortSuggestion[]> {
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
 * Desktop presenter for port input component.
 */
export const PortInputDesktop = memo(function PortInputDesktop(props: PortInputDesktopProps) {
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
    handleRemovePort,
    handleKeyDown,
    handleBlur,
    handleFocus,
    suggestions,
    showSuggestionsDropdown,
    selectedSuggestionIndex,
    handleSelectSuggestion,
    handleSelectServiceGroup,
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
    serviceGroups: rest.serviceGroups,
    ...hookConfig,
  });

  const error = externalError || validationError;
  const hasError = !!error;
  const showServiceBadge = showService && mode === 'single' && serviceName;

  const handleInputBlur = () => {
    handleBlur();
    onBlur?.();
  };

  const handleInputFocus = () => {
    handleFocus();
    onFocus?.();
  };

  // Suggestions dropdown
  const renderSuggestions = () => {
    if (!showSuggestions || !showSuggestionsDropdown || suggestions.length === 0) {
      return null;
    }

    const groupedSuggestions = groupSuggestionsByCategory(suggestions);

    return (
      <div
        ref={suggestionsRef as any}
        id={suggestionsId}
        role="listbox"
        aria-label="Port suggestions"
        className="bg-popover absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-md border p-1 shadow-md"
      >
        {Array.from(groupedSuggestions.entries()).map(([category, items]) => (
          <div
            key={category}
            className="mb-1 last:mb-0"
          >
            <div className="text-muted-foreground px-2 py-1 text-xs font-medium">
              {category === 'group' ?
                'Service Groups'
              : category === 'recent' ?
                'Recent'
              : PORT_CATEGORY_LABELS[category as keyof typeof PORT_CATEGORY_LABELS] || category}
            </div>
            {items.map((suggestion) => {
              const globalIndex = suggestions.findIndex(
                (s) => s.port === suggestion.port && s.category === suggestion.category
              );
              const isSelected = globalIndex === selectedSuggestionIndex;

              // Render service group with folder icon
              if (suggestion.isGroup && suggestion.groupData) {
                return (
                  <button
                    key={`group-${suggestion.groupData.id}`}
                    id={`${suggestionsId}-${globalIndex}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm',
                      'hover:bg-accent hover:text-accent-foreground',
                      isSelected && 'bg-accent text-accent-foreground'
                    )}
                    onClick={() => handleSelectServiceGroup(suggestion.groupData!)}
                  >
                    <Folder
                      className="text-primary h-4 w-4"
                      aria-hidden="true"
                    />
                    <span className="flex-1 font-medium">{suggestion.service}</span>
                    <Badge
                      variant="secondary"
                      className="text-xs uppercase"
                    >
                      {suggestion.groupData.protocol}
                    </Badge>
                  </button>
                );
              }

              // Regular port suggestion
              return (
                <button
                  key={`${suggestion.port}-${suggestion.category}`}
                  id={`${suggestionsId}-${globalIndex}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    'flex w-full cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm',
                    'hover:bg-accent hover:text-accent-foreground',
                    isSelected && 'bg-accent text-accent-foreground'
                  )}
                  onClick={() => handleSelectSuggestion(suggestion.port)}
                >
                  <span className="font-mono">{suggestion.port}</span>
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
          <Label
            htmlFor={inputId}
            className={cn(required && "after:text-error after:ml-0.5 after:content-['*']")}
          >
            {label}
          </Label>
        )}

        <div className="relative">
          <div className="flex items-center gap-2">
            {/* Port Input - compact, monospace, 24px wide */}
            <Input
              ref={inputRef as any}
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
              placeholder={placeholder || '8080'}
              className={cn(
                'h-10 w-24 text-center font-mono',
                hasError && 'border-error focus-visible:ring-error'
              )}
              aria-invalid={hasError}
              aria-describedby={
                [hasError && errorId, helpText && helpId, ariaDescribedBy]
                  .filter(Boolean)
                  .join(' ') || undefined
              }
              aria-label={!label ? 'Port number' : undefined}
              aria-autocomplete={showSuggestions ? 'list' : undefined}
              aria-controls={showSuggestions ? suggestionsId : undefined}
              aria-activedescendant={
                selectedSuggestionIndex >= 0 ?
                  `${suggestionsId}-${selectedSuggestionIndex}`
                : undefined
              }
            />

            {/* Protocol badge */}
            <Badge
              variant="outline"
              className="font-mono text-xs uppercase"
            >
              {protocol}
            </Badge>

            {/* Service badge */}
            {showServiceBadge && (
              <Badge
                variant="secondary"
                className="font-mono text-xs"
                aria-live="polite"
              >
                {serviceName}
              </Badge>
            )}
          </div>

          {renderSuggestions()}
        </div>

        {/* Error message */}
        {hasError && (
          <p
            id={errorId}
            role="alert"
            aria-live="assertive"
            className="text-error text-sm"
          >
            {error}
          </p>
        )}

        {/* Help text */}
        {helpText && !hasError && (
          <p
            id={helpId}
            className="text-muted-foreground text-sm"
          >
            {helpText}
          </p>
        )}
      </div>
    );
  }

  // Range mode - two inputs with dash separator
  if (mode === 'range') {
    return (
      <div className={cn('relative space-y-2', className)}>
        {label && (
          <Label className={cn(required && "after:text-error after:ml-0.5 after:content-['*']")}>
            {label}
          </Label>
        )}

        <div className="relative">
          {/* Range input row: start - end + badges */}
          <div className="flex items-center gap-1">
            {/* Start port input */}
            <Input
              ref={rangeStartRef as any}
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
                'h-10 w-24 text-center font-mono',
                hasError && 'border-error focus-visible:ring-error'
              )}
              aria-label="Start port"
              aria-invalid={hasError}
            />

            {/* Dash separator */}
            <span className="text-muted-foreground font-mono">-</span>

            {/* End port input */}
            <Input
              ref={rangeEndRef as any}
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
                'h-10 w-24 text-center font-mono',
                hasError && 'border-error focus-visible:ring-error'
              )}
              aria-label="End port"
              aria-invalid={hasError}
            />

            {/* Protocol badge */}
            <Badge
              variant="outline"
              className="font-mono text-xs uppercase"
            >
              {protocol}
            </Badge>

            {/* Port count badge */}
            {portCount > 0 && (
              <Badge
                variant="secondary"
                className="font-mono text-xs"
              >
                {portCount} port{portCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {renderSuggestions()}
        </div>

        {/* Error message */}
        {hasError && (
          <p
            id={errorId}
            role="alert"
            aria-live="assertive"
            className="text-error text-sm"
          >
            {error}
          </p>
        )}

        {/* Help text */}
        {helpText && !hasError && (
          <p
            id={helpId}
            className="text-muted-foreground text-sm"
          >
            {helpText}
          </p>
        )}
      </div>
    );
  }

  // Multi mode - chip-based input
  return (
    <div className={cn('relative space-y-2', className)}>
      {label && (
        <Label
          htmlFor={inputId}
          className={cn(required && "after:text-error after:ml-0.5 after:content-['*']")}
        >
          {label}
        </Label>
      )}

      <div className="relative">
        {/* Chip container with inline input */}
        <div
          className={cn(
            'bg-card flex min-h-10 flex-wrap items-center gap-1 rounded-[var(--semantic-radius-input)] border p-2',
            'focus-within:ring-ring focus-within:ring-2 focus-within:ring-offset-2',
            hasError && 'border-error focus-within:ring-error',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          {/* Port chips - monospace */}
          {ports.map((portNum) => (
            <Badge
              key={portNum}
              variant="secondary"
              className="gap-1 font-mono text-xs"
              aria-label={`Port ${portNum}${showService && serviceName ? `, ${serviceName}` : ''}`}
            >
              {portNum}
              {!disabled && (
                <X
                  className="hover:text-foreground h-3 w-3 cursor-pointer"
                  onClick={() => handleRemovePort(portNum)}
                  aria-label={`Remove port ${portNum}`}
                />
              )}
            </Badge>
          ))}

          {/* Input for adding new ports - seamless integration */}
          <Input
            ref={inputRef as any}
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
            placeholder={ports.length === 0 ? placeholder || 'Add ports...' : ''}
            className="h-6 min-w-16 flex-1 border-0 bg-transparent p-0 font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            aria-label="Add port"
            aria-invalid={hasError}
            aria-describedby={
              [hasError && errorId, helpText && helpId, ariaDescribedBy]
                .filter(Boolean)
                .join(' ') || undefined
            }
            aria-autocomplete={showSuggestions ? 'list' : undefined}
            aria-controls={showSuggestions ? suggestionsId : undefined}
            aria-activedescendant={
              selectedSuggestionIndex >= 0 ?
                `${suggestionsId}-${selectedSuggestionIndex}`
              : undefined
            }
          />

          {/* Protocol badge */}
          <Badge
            variant="outline"
            className="ml-auto shrink-0 font-mono text-xs uppercase"
          >
            {protocol}
          </Badge>
        </div>

        {renderSuggestions()}
      </div>

      {/* Port count */}
      {portCount > 0 && (
        <p className="text-muted-foreground text-sm">
          {portCount} port{portCount !== 1 ? 's' : ''} selected
        </p>
      )}

      {/* Error message */}
      {hasError && (
        <p
          id={errorId}
          role="alert"
          aria-live="assertive"
          className="text-error text-sm"
        >
          {error}
        </p>
      )}

      {/* Help text */}
      {helpText && !hasError && (
        <p
          id={helpId}
          className="text-muted-foreground text-sm"
        >
          {helpText}
        </p>
      )}
    </div>
  );
});

PortInputDesktop.displayName = 'PortInputDesktop';

export default PortInputDesktop;
