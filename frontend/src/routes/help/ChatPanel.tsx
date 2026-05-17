import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, Bot, Paperclip, User } from 'lucide-react';
import {
  fetchChatMessages,
  hasChatwootSession,
  sendChatMessage,
  type ChatwootMessage,
} from '../../api';
import styles from '../HelpPage.module.scss';

const POLL_INTERVAL_MS = 4000;

const SUGGESTED_PROMPTS = [
  'How do I set up a VPN client?',
  'My Wi-Fi keeps dropping — what can I check?',
  'How do I update RouterOS firmware?',
  'How do I port-forward to a device?',
];

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

  const submit = useCallback(
    async (raw: string) => {
      const text = raw.trim();
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
    },
    [sending, refresh, startPolling],
  );

  const handleSend = useCallback(() => {
    void submit(input);
  }, [submit, input]);

  const hasThread = rendered.length > 0 || sending;

  return (
    <div className={styles.chat} data-testid="help-chat">
      {hasThread ? (
        <div className={styles.chatLog} ref={scrollRef}>
          {rendered.map((m) => (
            <div key={m.id} className={m.role === 'user' ? styles.rowUser : styles.rowAgent}>
              <span className={styles.avatar} aria-hidden>
                {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </span>
              <div className={m.role === 'user' ? styles.bubbleUser : styles.bubbleAgent}>
                {m.content}
              </div>
            </div>
          ))}
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
      ) : null}

      {error ? (
        <p className={styles.chatError} role="alert">
          {error}
        </p>
      ) : null}

      <div className={styles.composer}>
        <textarea
          className={styles.composerInput}
          aria-label="Message"
          placeholder="Ask me anything…"
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <div className={styles.composerBar}>
          <span className={styles.attach} aria-hidden>
            <Paperclip size={18} />
          </span>
          <button
            type="button"
            className={styles.sendButton}
            aria-label="Send message"
            disabled={!input.trim() || sending}
            onClick={() => handleSend()}
          >
            <ArrowUp size={18} aria-hidden />
          </button>
        </div>
      </div>

      {!hasThread ? (
        <div className={styles.suggestions}>
          {SUGGESTED_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              className={styles.suggestionChip}
              onClick={() => {
                void submit(p);
              }}
              disabled={sending}
            >
              {p}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
