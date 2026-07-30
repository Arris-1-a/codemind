/**
 * GitHub Webhook handler — processes incoming GitHub webhook events.
 *
 * @module github/webhook
 */

/** GitHub webhook event types we handle */
export type WebhookEvent = 
  | 'pull_request'
  | 'pull_request_review'
  | 'push'
  | 'issues'
  | 'issue_comment';

/** GitHub webhook payload base */
export interface WebhookPayload {
  action: string;
  repository?: {
    full_name: string;
    owner: { login: string };
    name: string;
  };
  sender?: {
    login: string;
  };
}

/** Pull request webhook payload */
export interface PRPayload extends WebhookPayload {
  pull_request: {
    number: number;
    title: string;
    body: string | null;
    state: string;
    html_url: string;
    head: { ref: string; sha: string };
    base: { ref: string; sha: string };
    user: { login: string };
    additions: number;
    deletions: number;
    changed_files: number;
  };
}

/** Push webhook payload */
export interface PushPayload extends WebhookPayload {
  ref: string;
  before: string;
  after: string;
  commits: Array<{
    id: string;
    message: string;
    author: { name: string; email: string };
  }>;
}

/** Webhook handler options */
export interface WebhookOptions {
  /** GitHub webhook secret for signature verification */
  secret?: string;
  /** Event handlers */
  handlers?: Partial<Record<WebhookEvent, WebhookEventHandler>>;
}

/** Webhook event handler type */
export type WebhookEventHandler = (payload: WebhookPayload) => Promise<WebhookResponse>;

/** Webhook response */
export interface WebhookResponse {
  status: number;
  body: string;
  headers?: Record<string, string>;
}

/**
 * GitHub Webhook handler.
 * Processes and routes incoming GitHub webhook events.
 */
export class WebhookHandler {
  private secret?: string;
  private handlers: Map<WebhookEvent, WebhookEventHandler>;

  constructor(options: WebhookOptions = {}) {
    this.secret = options.secret;
    this.handlers = new Map();

    if (options.handlers) {
      for (const [event, handler] of Object.entries(options.handlers)) {
        if (handler) {
          this.on(event as WebhookEvent, handler);
        }
      }
    }
  }

  /**
   * Register a handler for an event type
   */
  on(event: WebhookEvent, handler: WebhookEventHandler): void {
    this.handlers.set(event, handler);
  }

  /**
   * Process an incoming webhook request
   * @param event - GitHub event type (from X-GitHub-Event header)
   * @param payload - Parsed JSON payload
   * @param signature - HMAC signature (from X-Hub-Signature-256 header)
   * @returns Webhook response
   */
  async process(
    event: string,
    payload: WebhookPayload,
    signature?: string,
  ): Promise<WebhookResponse> {
    // Verify signature if secret is configured
    if (this.secret && signature) {
      if (!this.verifySignature(JSON.stringify(payload), signature)) {
        return { status: 401, body: 'Invalid signature' };
      }
    }

    // Find handler
    const handler = this.handlers.get(event as WebhookEvent);
    if (!handler) {
      return {
        status: 200,
        body: JSON.stringify({ message: `No handler for event: ${event}` }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    try {
      const response = await handler(payload);
      return response;
    } catch (error) {
      return {
        status: 500,
        body: JSON.stringify({
          error: error instanceof Error ? error.message : 'Internal error',
        }),
        headers: { 'Content-Type': 'application/json' },
      };
    }
  }

  /**
   * Verify the webhook signature
   */
  private verifySignature(body: string, signature: string): boolean {
    if (!this.secret) return true;

    // In production, use crypto.createHmac('sha256', this.secret).update(body).digest('hex')
    // For now, we check that signature starts with sha256=
    const expectedPrefix = 'sha256=';
    return signature.startsWith(expectedPrefix) && signature.length > expectedPrefix.length;
  }

  /**
   * Create HTTP middleware compatible handler
   */
  createMiddleware(): (req: { headers: Record<string, string>; body: unknown }, res: { status: (code: number) => { json: (data: unknown) => void } }) => Promise<void> {
    return async (req, res) => {
      const event = req.headers['x-github-event'] || '';
      const signature = req.headers['x-hub-signature-256'] || '';
      
      const result = await this.process(event, req.body as WebhookPayload, signature);

      try {
        const body = JSON.parse(result.body);
        res.status(result.status).json(body);
      } catch {
        res.status(result.status).json({ message: result.body });
      }
    };
  }
}
