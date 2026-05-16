import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Send, User } from 'lucide-react';
import { Button, Textarea } from '@nasnet/ui';
import {
  fetchChatMessages,
  hasChatwootSession,
  sendChatMessage,
  type ChatwootMessage,
} from '../../api';
import styles from '../HelpPage.module.scss';

const POLL_INTERVAL_MS = 4000;

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatwootMessage[]>([]);
  const [optimistic, setOptimistic] = useState<ChatwootMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const list = await fetchChatMessages();
    if (mountedRef.current) setMessages(list);
  }, []);

  const scheduleNextPoll = useCallback(() => {
    if (!mountedRef.current) return;
    timerRef.current = setTimeout(async () => {
      try {
        await refresh();
      } catch {
        /* transient */
      }
      scheduleNextPoll();
    }, POLL_INTERVAL_MS);
  }, [refresh]);

  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    pollingRef.current = true;
    scheduleNextPoll();
  }, [scheduleNextPoll]);

  useEffect(() => {
    mountedRef.current = true;
    if (hasChatwootSession()) {
      void refresh().catch(() => undefined);
      startPolling();
    }
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [refresh, startPolling]);

  const rendered: ChatwootMessage[] = [
    ...messages,
    ...optimistic.filter(
      (o) => !messages.some((m) => m.role === 'user' && m.content === o.content),
    ),
  ];

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [rendered.length, sending]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setError(null);
    setInput('');
    setOptimistic((prev) => [...prev, { id: -Date.now(), content: text, role: 'user' }]);
    setSending(true);
    try {
      await sendChatMessage(text);
      await refresh();
      startPolling();
    } catch {
      setError("Couldn't reach support chat. Check your connection and try again.");
    } finally {
      if (mountedRef.current) setSending(false);
    }
  }, [input, sending, refresh, startPolling]);

  return (
    <div className={styles.chat}>
      <div className={styles.chatLog} data-testid="help-chat" ref={scrollRef}>
        {rendered.length === 0 ? (
          <p className={styles.chatEmpty}>
            Ask anything about your router setup, VPN, or Wi-Fi. Our assistant replies here.
          </p>
        ) : (
          rendered.map((m) => (
            <div key={m.id} className={m.role === 'user' ? styles.rowUser : styles.rowAgent}>
              <span className={styles.avatar} aria-hidden>
                {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </span>
              <div className={m.role === 'user' ? styles.bubbleUser : styles.bubbleAgent}>
                {m.content}
              </div>
            </div>
          ))
        )}
        {sending ? (
          <div className={styles.rowAgent}>
            <span className={styles.avatar} aria-hidden>
              <Bot size={14} />
            </span>
            <div className={styles.bubbleAgent}>
              <span className={styles.typing} aria-label="Assistant is typing">
                <span />
                <span />
                <span />
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className={styles.chatError} role="alert">
          {error}
        </p>
      ) : null}

      <div className={styles.composer}>
        <Textarea
          aria-label="Message"
          placeholder="Ask a question..."
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
        />
        <Button
          variant="primary"
          aria-label="Send message"
          loading={sending}
          disabled={!input.trim()}
          onClick={() => void handleSend()}
        >
          <Send size={16} aria-hidden />
        </Button>
      </div>
    </div>
  );
}
