import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './Select.module.scss';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface BaseSelectProps {
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Max height of the option list in pixels; overrides the 240px default. */
  maxOptionsHeight?: number;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export interface SingleSelectProps extends BaseSelectProps {
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
}

export interface MultipleSelectProps extends BaseSelectProps {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
}

export type SelectProps = SingleSelectProps | MultipleSelectProps;

const cx = (...parts: Array<string | undefined | false>) => parts.filter(Boolean).join(' ');

export const Select: React.FC<SelectProps> = (props) => {
  const {
    options,
    value,
    onChange,
    placeholder = 'Select…',
    disabled,
    id,
    name,
    className,
    searchable = false,
    searchPlaceholder = 'Search…',
    maxOptionsHeight,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    multiple = false,
  } = props;

  const selectedValues: string[] = Array.isArray(value) ? value : value ? [value] : [];

  const emitChange = (nextValues: string[]) => {
    if (multiple) {
      (onChange as (v: string[]) => void)(nextValues);
    } else {
      (onChange as (v: string) => void)(nextValues[0] ?? '');
    }
  };

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState<number>(() =>
    Math.max(
      0,
      options.findIndex((o) => selectedValues.includes(o.value)),
    ),
  );
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuPos, setMenuPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const listboxId = useId();
  const triggerId = id ?? `${listboxId}-trigger`;

  const selectedOptions = options.filter((o) => selectedValues.includes(o.value));
  const triggerLabel =
    selectedOptions.length === 0
      ? placeholder
      : multiple && selectedOptions.length > 2
        ? `${selectedOptions.length} selected`
        : selectedOptions.map((o) => o.label).join(', ');

  const filteredOptions = useMemo(() => {
    if (!searchable || !query) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, searchable, query]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    if (searchable) {
      searchRef.current?.focus();
    }
  }, [open, searchable]);

  useEffect(() => {
    if (activeIdx >= filteredOptions.length) {
      setActiveIdx(filteredOptions.length > 0 ? 0 : -1);
    }
  }, [filteredOptions.length, activeIdx]);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (wrapperRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null);
      return;
    }
    const reposition = () => {
      const r = triggerRef.current?.getBoundingClientRect();
      if (r) setMenuPos({ left: r.left, top: r.bottom + 4, width: r.width });
    };
    reposition();
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open]);

  const selectAt = (idx: number) => {
    const opt = filteredOptions[idx];
    if (!opt || opt.disabled) return;
    if (multiple) {
      const next = selectedValues.includes(opt.value)
        ? selectedValues.filter((v) => v !== opt.value)
        : [...selectedValues, opt.value];
      emitChange(next);
    } else {
      emitChange([opt.value]);
      close();
    }
  };

  const move = (delta: number) => {
    if (filteredOptions.length === 0) return;
    let next = activeIdx < 0 ? 0 : activeIdx;
    for (let i = 0; i < filteredOptions.length; i++) {
      next = (next + delta + filteredOptions.length) % filteredOptions.length;
      if (!filteredOptions[next].disabled) break;
    }
    setActiveIdx(next);
  };

  const handleNavKey = (e: React.KeyboardEvent, allowSpaceToSelect: boolean) => {
    if (disabled) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) setOpen(true);
        else move(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) setOpen(true);
        else move(-1);
        break;
      case 'Home':
        if (open) {
          e.preventDefault();
          setActiveIdx(filteredOptions.findIndex((o) => !o.disabled));
        }
        break;
      case 'End':
        if (open) {
          e.preventDefault();
          for (let i = filteredOptions.length - 1; i >= 0; i--) {
            if (!filteredOptions[i].disabled) {
              setActiveIdx(i);
              break;
            }
          }
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (!open) setOpen(true);
        else selectAt(activeIdx);
        break;
      case ' ':
        if (!allowSpaceToSelect) return;
        e.preventDefault();
        if (!open) setOpen(true);
        else selectAt(activeIdx);
        break;
      case 'Escape':
        if (open) {
          e.preventDefault();
          close();
        }
        break;
      case 'Tab':
        if (open) setOpen(false);
        break;
    }
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent) => handleNavKey(e, true);
  const onSearchKeyDown = (e: React.KeyboardEvent) => handleNavKey(e, false);

  return (
    <div ref={wrapperRef} className={cx(styles.wrap, className)}>
      <button
        ref={triggerRef}
        type="button"
        id={triggerId}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        disabled={disabled}
        className={cx(styles.trigger, open && styles.triggerOpen)}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
      >
        <span className={cx(styles.value, selectedOptions.length === 0 && styles.placeholder)}>
          {triggerLabel}
        </span>
        <svg className={styles.chevron} width={14} height={14} viewBox="0 0 20 20" aria-hidden>
          <path
            d="M5 7.5l5 5 5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {name ? <input type="hidden" name={name} value={selectedValues.join(',')} /> : null}
      {open && menuPos
        ? createPortal(
            <div
              ref={menuRef}
              className={styles.menu}
              style={{
                position: 'fixed',
                left: menuPos.left,
                top: menuPos.top,
                width: menuPos.width,
                right: 'auto',
                zIndex: 1100,
              }}
            >
              {searchable ? (
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveIdx(0);
                  }}
                  onKeyDown={onSearchKeyDown}
                  placeholder={searchPlaceholder}
                  aria-label="Search options"
                  aria-controls={listboxId}
                  className={styles.search}
                />
              ) : null}
              <ul
                id={listboxId}
                role="listbox"
                aria-labelledby={triggerId}
                className={styles.list}
                style={maxOptionsHeight ? { maxHeight: maxOptionsHeight } : undefined}
                tabIndex={-1}
              >
                {filteredOptions.length === 0 ? (
                  <li className={styles.emptyOption} role="presentation">
                    No matches
                  </li>
                ) : (
                  filteredOptions.map((opt, idx) => {
                    const selectedOpt = selectedValues.includes(opt.value);
                    const active = idx === activeIdx;
                    return (
                      <li
                        key={opt.value}
                        role="option"
                        aria-selected={selectedOpt}
                        aria-disabled={opt.disabled || undefined}
                        className={cx(
                          styles.option,
                          active && styles.optionActive,
                          selectedOpt && styles.optionSelected,
                          opt.disabled && styles.optionDisabled,
                        )}
                        onMouseEnter={() => !opt.disabled && setActiveIdx(idx)}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectAt(idx);
                        }}
                      >
                        <span>{opt.label}</span>
                        {selectedOpt ? (
                          <svg
                            className={styles.check}
                            width={14}
                            height={14}
                            viewBox="0 0 20 20"
                            aria-hidden
                          >
                            <path
                              d="M5 10.5l3.5 3.5L15 6.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : null}
                      </li>
                    );
                  })
                )}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
};
