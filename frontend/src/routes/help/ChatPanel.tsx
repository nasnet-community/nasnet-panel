import { useEffect, useRef, useState } from 'react';
import { loadChatwoot, toggleChatwoot } from '../../api';
import styles from '../HelpPage.module.scss';

const HOLDER_SELECTOR = '.woot-widget-holder';
const HIDDEN_CLASS = 'woot--hide';

type ChatState = 'loading' | 'ready' | 'error';

export function ChatPanel() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ChatState>('loading');

  useEffect(() => {
    let disposed = false;
    let frame = 0;
    let holder: HTMLElement | null = null;
    let keepOpenObserver: MutationObserver | null = null;

    const pin = () => {
      const host = hostRef.current;
      holder ??= document.querySelector<HTMLElement>(HOLDER_SELECTOR);
      if (!host || !holder) return;
      const rect = host.getBoundingClientRect();
      const style = holder.style;
      style.setProperty('position', 'absolute', 'important');
      style.setProperty('top', `${rect.top + window.scrollY + 1}px`, 'important');
      style.setProperty('left', `${rect.left + window.scrollX + 1}px`, 'important');
      style.setProperty('width', `${rect.width - 2}px`, 'important');
      style.setProperty('height', `${rect.height - 2}px`, 'important');
      style.setProperty('right', 'auto', 'important');
      style.setProperty('bottom', 'auto', 'important');
      style.setProperty('max-height', 'none', 'important');
      style.setProperty('border-radius', 'calc(var(--radius-md) - 1px)', 'important');
      style.setProperty('overflow', 'hidden', 'important');
      style.setProperty('box-shadow', 'none', 'important');
      if (!keepOpenObserver) {
        keepOpenObserver = new MutationObserver(() => {
          if (holder?.classList.contains(HIDDEN_CLASS)) toggleChatwoot('open');
        });
        keepOpenObserver.observe(holder, { attributes: true, attributeFilter: ['class'] });
      }
    };

    const schedulePin = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(pin);
    };

    void loadChatwoot()
      .then(() => {
        if (disposed) return;
        setState('ready');
        toggleChatwoot('open');
        schedulePin();
      })
      .catch(() => {
        if (!disposed) setState('error');
      });

    window.addEventListener('resize', schedulePin);
    window.addEventListener('scroll', schedulePin, true);
    const resizeObserver = new ResizeObserver(schedulePin);
    if (hostRef.current) resizeObserver.observe(hostRef.current);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      keepOpenObserver?.disconnect();
      window.removeEventListener('resize', schedulePin);
      window.removeEventListener('scroll', schedulePin, true);
      toggleChatwoot('close');
      if (holder) holder.style.cssText = '';
    };
  }, []);

  return (
    <div className={styles.chatHost} ref={hostRef} data-testid="help-chat">
      {state === 'error' ? (
        <p className={styles.chatError} role="alert">
          Couldn&apos;t load the support chat. Check your internet connection and reload the page.
        </p>
      ) : state === 'loading' ? (
        <p className={styles.chatLoading}>Loading chat…</p>
      ) : null}
    </div>
  );
}
