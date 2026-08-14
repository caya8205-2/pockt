export class PocktClient {
  private baseUrl: string;
  private username: string;
  private password: string;
  private sessionToken: string | null = null;

  constructor(baseUrl: string, username: string, password: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.username = username;
    this.password = password;
  }

  async login(): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: this.username, password: this.password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: (data as any).error || `Login failed (${res.status})` };
    }

    // Extract session token from Set-Cookie header
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      const match = setCookie.match(/pockt_session=([^;]+)/);
      if (match) {
        this.sessionToken = match[1];
      }
    }

    return { success: true };
  }

  private buildHeaders(body?: unknown): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.sessionToken) {
      headers['Cookie'] = `pockt_session=${this.sessionToken}`;
    }
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  async request(method: string, path: string, body?: unknown): Promise<Response> {
    // Auto-login if no session token yet
    if (!this.sessionToken && this.username && this.password) {
      await this.login();
    }

    let headers = this.buildHeaders(body);

    let res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    // If 401, try re-login once and retry
    if (res.status === 401 && this.username && this.password) {
      const loginResult = await this.login();
      if (loginResult.success) {
        headers = this.buildHeaders(body);
        res = await fetch(`${this.baseUrl}${path}`, {
          method,
          headers,
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });
      }
    }

    return res;
  }

  async get(path: string): Promise<unknown> {
    const res = await this.request('GET', path);
    if (!res.ok) {
      const data: any = await res.json().catch(() => ({ error: `Request failed (${res.status})` }));
      throw new Error(data.error || `GET ${path} failed (${res.status})`);
    }
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/csv')) {
      return await res.text();
    }
    return await res.json();
  }

  async post(path: string, body?: unknown): Promise<unknown> {
    const res = await this.request('POST', path, body);
    if (!res.ok) {
      const data: any = await res.json().catch(() => ({ error: `Request failed (${res.status})` }));
      throw new Error(data.error || `POST ${path} failed (${res.status})`);
    }
    return await res.json();
  }

  async put(path: string, body: unknown): Promise<unknown> {
    const res = await this.request('PUT', path, body);
    if (!res.ok) {
      const data: any = await res.json().catch(() => ({ error: `Request failed (${res.status})` }));
      throw new Error(data.error || `PUT ${path} failed (${res.status})`);
    }
    return await res.json();
  }

  async del(path: string): Promise<unknown> {
    const res = await this.request('DELETE', path);
    if (!res.ok) {
      const data: any = await res.json().catch(() => ({ error: `Request failed (${res.status})` }));
      throw new Error(data.error || `DELETE ${path} failed (${res.status})`);
    }
    return await res.json();
  }
}
