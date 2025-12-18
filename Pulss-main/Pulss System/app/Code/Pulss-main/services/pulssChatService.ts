// Backend base URL: prefer VITE_API_BASE_URL, fall back to local FastAPI.
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export type PulssChatMessageRole = 'user' | 'assistant';

export interface PulssChatStart {
  session_id: string;
  client_name?: string | null;
  first_message: string;
}

export interface PulssChatSendResult {
  assistant_message: string;
  done: boolean;
}

const request = async (path: string, options?: RequestInit) => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err: any = new Error(`Request failed: ${res.status}`);
    err.status = res.status;
    try {
      err.body = await res.json();
    } catch {
      err.body = await res.text();
    }
    throw err;
  }
  return res.json();
};

export const pulssChatService = {
  async startFromLink(clientId: string, token: string): Promise<PulssChatStart> {
    // Expected backend request: POST {API_BASE}/api/pulss-chat/start-from-link/{clientId}/{token}
    // Expected response (200): { session_id, client_name, first_message }
    return request(`/api/pulss-chat/start-from-link/${clientId}/${token}`, { method: 'POST' });
  },

  async sendMessage(sessionId: string, userMessage: string): Promise<PulssChatSendResult> {
    // Expected backend request: POST {API_BASE}/api/pulss-chat/sessions/{session_id}/messages
    // Body: { user_message }
    // Expected response (200): { assistant_message, done }
    return request(`/api/pulss-chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ user_message: userMessage }),
    });
  },
};
