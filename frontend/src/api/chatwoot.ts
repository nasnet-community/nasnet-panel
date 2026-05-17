// eslint-disable-next-line @typescript-eslint/naming-convention
declare const __CHATWOOT_BASE_URL__: string | undefined;
// eslint-disable-next-line @typescript-eslint/naming-convention
declare const __CHATWOOT_INBOX_IDENTIFIER__: string | undefined;

const BASE_URL = (
  typeof __CHATWOOT_BASE_URL__ === 'string' ? __CHATWOOT_BASE_URL__ : 'https://chatwoot.example.com'
).replace(/\/$/, '');

const INBOX_IDENTIFIER =
  typeof __CHATWOOT_INBOX_IDENTIFIER__ === 'string'
    ? __CHATWOOT_INBOX_IDENTIFIER__
    : 'nasnet-inbox';

const STORAGE_KEY = 'nasnet-panel.chatwoot.v1';

export type ChatRole = 'user' | 'agent';

export interface ChatwootMessage {
  id: number;
  content: string;
  role: ChatRole;
}

interface ChatwootSession {
  contactIdentifier: string;
  conversationId: number;
}

interface ContactResponse {
  source_id: string;
  pubsub_token?: string;
}

interface ConversationResponse {
  id: number;
}

interface RawMessage {
  id: number;
  content?: string | null;
  message_type?: number;
}

function loadSession(): ChatwootSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ChatwootSession>;
    if (typeof parsed.contactIdentifier === 'string' && typeof parsed.conversationId === 'number') {
      return { contactIdentifier: parsed.contactIdentifier, conversationId: parsed.conversationId };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function saveSession(session: ChatwootSession): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
}

export function resetChatwootSession(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

async function cw<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');

  const res = await fetch(`${BASE_URL}/public/api/v1/inboxes/${INBOX_IDENTIFIER}${path}`, {
    mode: 'cors',
    ...init,
    headers,
  });
  if (!res.ok) throw new Error(`Chatwoot request failed (${res.status})`);
  return (await res.json()) as T;
}

async function createSession(): Promise<ChatwootSession> {
  const contact = await cw<ContactResponse>('/contacts', { method: 'POST', body: '{}' });
  const conversation = await cw<ConversationResponse>(
    `/contacts/${encodeURIComponent(contact.source_id)}/conversations`,
    { method: 'POST', body: '{}' },
  );
  const session: ChatwootSession = {
    contactIdentifier: contact.source_id,
    conversationId: conversation.id,
  };
  saveSession(session);
  return session;
}

let sessionPromise: Promise<ChatwootSession> | null = null;

async function ensureSession(): Promise<ChatwootSession> {
  const existing = loadSession();
  if (existing) return existing;
  if (!sessionPromise) {
    sessionPromise = createSession().catch((err) => {
      sessionPromise = null;
      throw err;
    });
  }
  return sessionPromise;
}

function toMessage(raw: RawMessage): ChatwootMessage | null {
  const content = (raw.content ?? '').trim();
  if (!content) return null;
  if (raw.message_type === 0) return { id: raw.id, content, role: 'user' };
  if (raw.message_type === 1 || raw.message_type === 3) {
    return { id: raw.id, content, role: 'agent' };
  }
  return null;
}

export async function sendChatMessage(content: string): Promise<void> {
  const { contactIdentifier, conversationId } = await ensureSession();
  await cw(
    `/contacts/${encodeURIComponent(contactIdentifier)}/conversations/${conversationId}/messages`,
    { method: 'POST', body: JSON.stringify({ content }) },
  );
}

export function hasChatwootSession(): boolean {
  return loadSession() !== null;
}

export async function fetchChatMessages(): Promise<ChatwootMessage[]> {
  const session = loadSession();
  if (!session) return [];
  const { contactIdentifier, conversationId } = session;
  const raw = await cw<RawMessage[]>(
    `/contacts/${encodeURIComponent(contactIdentifier)}/conversations/${conversationId}/messages`,
    { method: 'GET' },
  );
  return raw
    .map(toMessage)
    .filter((m): m is ChatwootMessage => m !== null)
    .sort((a, b) => a.id - b.id);
}
