/**
 * SyntaxHighlight Component
 *
 * Renders RouterOS code with syntax highlighting using highlight.js.
 * Supports line numbers and semantic color tokens.
 *
 * @see NAS-4A.21 - Build Config Preview Component
 */

import * as React from 'react';
import { useEffect, useMemo } from 'react';

import { cn } from '@nasnet/ui/primitives';

import { registerRouterOS, highlightRouterOS } from './syntax';

import type { SyntaxHighlightProps } from './config-preview.types';

/**
 * SyntaxHighlight Component
 *
 * Renders code with syntax highlighting and optional line numbers.
 * Uses highlight.js for RouterOS syntax highlighting with semantic
 * color tokens for proper theming.
 *
 * @example
 * ```tsx
 * <SyntaxHighlight
 *   code={routerOsScript}
 *   showLineNumbers
 *   startLineNumber={1}
 * />
 * ```
 */
export function SyntaxHighlight({
  code,
  showLineNumbers = false,
  startLineNumber = 1,
  className,
}: SyntaxHighlightProps) {
  // Register RouterOS language on mount
  useEffect(() => {
    registerRouterOS();
  }, []);

  // Split code into lines and highlight each
  const lines = useMemo(() => code.split('\n'), [code]);
  const lineNumberWidth = useMemo(
    () => String(lines.length + startLineNumber - 1).length,
    [lines.length, startLineNumber]
  );

  // Highlight the entire code block for better context
  const highlightedHtml = useMemo(() => highlightRouterOS(code), [code]);

  // Split highlighted HTML into lines (carefully preserving spans)
  const highlightedLines = useMemo(() => {
    // Create a temporary element to parse the HTML
    const temp = document.createElement('div');
    temp.innerHTML = highlightedHtml;

    // Extract text content line by line, preserving highlights
    const result: string[] = [];
    let currentLine = '';

    function processNode(node: Node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        const parts = text.split('\n');
        for (let i = 0; i < parts.length; i++) {
          if (i > 0) {
            result.push(currentLine);
            currentLine = '';
          }
          currentLine += parts[i]
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const className = element.className;
        const hasNewline = (element.textContent || '').includes('\n');

        if (!hasNewline) {
          // Simple case - no newlines, wrap entire content
          currentLine += `<span class="${className}">${element.innerHTML}</span>`;
        } else {
          // Handle newlines within the element
          for (const child of Array.from(node.childNodes)) {
            if (child.nodeType === Node.TEXT_NODE) {
              const text = child.textContent || '';
              const parts = text.split('\n');
              for (let i = 0; i < parts.length; i++) {
                if (i > 0) {
                  result.push(currentLine);
                  currentLine = '';
                }
                const escapedPart = parts[i]
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');
                currentLine +=
                  className ? `<span class="${className}">${escapedPart}</span>` : escapedPart;
              }
            } else {
              processNode(child);
            }
          }
        }
      }
    }

    for (const child of Array.from(temp.childNodes)) {
      processNode(child);
    }

    if (currentLine) {
      result.push(currentLine);
    }

    return result;
  }, [highlightedHtml]);

  if (!showLineNumbers) {
    return (
      <pre className={cn('m-0 p-4', className)}>
        <code
          className="config-preview-syntax block whitespace-pre font-mono text-sm text-slate-50"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      </pre>
    );
  }

  return (
    <pre className={cn('m-0 p-0', className)}>
      <code className="config-preview-syntax block whitespace-pre font-mono text-sm text-slate-50">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, index) => (
              <tr
                key={index}
                className="hover:bg-slate-800/50"
              >
                <td
                  className="text-muted-foreground/50 select-none border-r border-slate-700 py-0.5 pr-4 text-right"
                  style={{ width: `${lineNumberWidth + 2}ch` }}
                >
                  {startLineNumber + index}
                </td>
                <td
                  className="py-0.5 pl-4"
                  dangerouslySetInnerHTML={{
                    __html: highlightedLines[index] || line || '&nbsp;',
                  }}
                />
              </tr>
            ))}
          </tbody>
        </table>
      </code>
    </pre>
  );
}

SyntaxHighlight.displayName = 'SyntaxHighlight';
