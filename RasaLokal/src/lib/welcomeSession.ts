type SessionResponse = {
  data: { session: { user: { id: string }; access_token?: string; expires_at?: number } | null };
  error: unknown;
};
export type WelcomeSessionResult = 'authenticated' | 'guest' | 'unavailable';

type SessionReader = {
  getSession: () => Promise<SessionResponse>;
  getUser: (jwt?: string) => Promise<{ data: { user: { id: string } | null }; error: unknown }>;
};

/** Cached credentials alone do not grant access to the home screen. */
export async function readVerifiedSession(auth: SessionReader): Promise<SessionResponse> {
  const response = await auth.getSession();
  const session = response.data.session;
  if (response.error || !session) return response;
  if (!session.access_token) return { data: { session: null }, error: null };
  const { data, error } = await auth.getUser(session.access_token);
  if (error) {
    const status = (error as { status?: number }).status;
    // Invalid credentials require login; network/server failures allow retry.
    return { data: { session: null }, error: status === 401 || status === 403 ? null : error };
  }
  return { data: { session: data.user?.id === session.user.id ? session : null }, error: null };
}

/** A bounded, cancellable UI check. It never clears credentials or changes Auth state. */
export function checkWelcomeSession(
  read: () => Promise<SessionResponse>,
  onResult: (result: WelcomeSessionResult) => void,
  timeoutMs = 3500,
): () => void {
  let active = true;
  const finish = (result: WelcomeSessionResult) => {
    if (!active) return;
    active = false;
    clearTimeout(timer);
    onResult(result);
  };
  const timer = setTimeout(() => finish('unavailable'), timeoutMs);
  void Promise.resolve().then(read).then(({ data, error }) => {
    if (error) { finish('unavailable'); return; }
    const session = data.session;
    if (!session) { finish('guest'); return; }
    // An expired cached token must not be treated as a successfully restored login.
    const expired = typeof session.expires_at === 'number' && session.expires_at * 1000 <= Date.now();
    finish(session.user?.id && !expired ? 'authenticated' : 'unavailable');
  }).catch(() => finish('unavailable'));
  return () => { active = false; clearTimeout(timer); };
}
