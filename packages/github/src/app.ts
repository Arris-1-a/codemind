/**
 * GitHub App integration — manages GitHub App installation and operations.
 *
 * @module github/app
 */

/** GitHub App configuration */
export interface GitHubAppConfig {
  /** App ID */
  appId: string;
  /** Private key (PEM format) */
  privateKey: string;
  /** Installation ID */
  installationId?: string;
  /** Webhook secret */
  webhookSecret?: string;
  /** Client ID (for OAuth) */
  clientId?: string;
  /** Client secret (for OAuth) */
  clientSecret?: string;
}

/** GitHub API request options */
export interface GitHubAPIRequest {
  /** API path (without https://api.github.com) */
  path: string;
  /** HTTP method */
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  /** Request body */
  body?: unknown;
  /** Additional headers */
  headers?: Record<string, string>;
}

/** GitHub API response */
export interface GitHubAPIResponse {
  status: number;
  data: unknown;
  headers: Record<string, string>;
}

/**
 * GitHub App manager.
 * Handles GitHub App authentication and API interactions.
 */
export class GitHubApp {
  private config: GitHubAppConfig;
  private installationToken?: string;
  private tokenExpiry?: number;

  constructor(config: GitHubAppConfig) {
    this.config = config;
  }

  /**
   * Get an installation access token for API calls
   * @returns Installation access token
   */
  async getInstallationToken(): Promise<string> {
    // Check cached token
    if (this.installationToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.installationToken;
    }

    if (!this.config.installationId) {
      throw new Error('Installation ID is required to get an installation token');
    }

    // Generate JWT for app authentication
    const jwt = this.generateJWT();

    // Request installation token
    const response = await fetch(
      `https://api.github.com/app/installations/${this.config.installationId}/access_tokens`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwt}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to get installation token: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      token: string;
      expires_at: string;
    };

    this.installationToken = data.token;
    this.tokenExpiry = new Date(data.expires_at).getTime();

    return this.installationToken;
  }

  /**
   * Make an authenticated request to the GitHub API
   */
  async request(req: GitHubAPIRequest): Promise<GitHubAPIResponse> {
    const token = await this.getInstallationToken();

    const response = await fetch(`https://api.github.com${req.path}`, {
      method: req.method || 'GET',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...req.headers,
      },
      body: req.body ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      status: response.status,
      data,
      headers,
    };
  }

  /**
   * Post a PR review comment
   */
  async postPRReview(
    owner: string,
    repo: string,
    prNumber: number,
    body: string,
    event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT' = 'COMMENT',
  ): Promise<GitHubAPIResponse> {
    return this.request({
      path: `/repos/${owner}/${repo}/pulls/${prNumber}/reviews`,
      method: 'POST',
      body: {
        body,
        event,
      },
    });
  }

  /**
   * Post an inline review comment
   */
  async postPRComment(
    owner: string,
    repo: string,
    prNumber: number,
    body: string,
    commitId: string,
    path: string,
    line: number,
  ): Promise<GitHubAPIResponse> {
    return this.request({
      path: `/repos/${owner}/${repo}/pulls/${prNumber}/comments`,
      method: 'POST',
      body: {
        body,
        commit_id: commitId,
        path,
        line,
      },
    });
  }

  /**
   * Check if the app is properly configured
   */
  isConfigured(): boolean {
    return !!(this.config.appId && this.config.privateKey);
  }

  /**
   * Generate a JWT for GitHub App authentication
   */
  private generateJWT(): string {
    // Real implementation would use jsonwebtoken library
    // This is a placeholder
    if (!this.config.privateKey) {
      throw new Error('Private key is required for JWT generation');
    }
    
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(
      JSON.stringify({
        iat: now - 60,
        exp: now + 600,
        iss: this.config.appId,
      }),
    ).toString('base64url');

    return `${header}.${payload}.<signature>`;
  }
}
