/**
 * Odoo ERP Integration Client
 * Supports JSON-RPC / JSON-2 protocol for Odoo 17, 18, and 19.
 * 
 * Rules:
 * 1. Truthful Reporting: Never claim integration is connected without a live verified sandbox.
 * 2. Least-Privilege Credentials: Dedicated integration user, secrets read only from environment.
 * 3. Timeout & Recovery: Bounded network timeouts with structured error classifications.
 */

export class OdooClient {
  constructor(config = {}) {
    this.url = config.url || process.env.ODOO_URL || "";
    this.db = config.db || process.env.ODOO_DB || "";
    this.username = config.username || process.env.ODOO_USERNAME || "";
    this.apiKey = config.apiKey || process.env.ODOO_API_KEY || process.env.ODOO_PASSWORD || "";
    this.timeoutMs = config.timeoutMs || 10000;
    this.uid = null;
  }

  /**
   * Check whether all required Odoo credentials are configured in the environment.
   * @returns {{ configured: boolean, missing: string[] }}
   */
  isConfigured() {
    const missing = [];
    if (!this.url) missing.push("ODOO_URL");
    if (!this.db) missing.push("ODOO_DB");
    if (!this.username) missing.push("ODOO_USERNAME");
    if (!this.apiKey) missing.push("ODOO_API_KEY");

    return {
      configured: missing.length === 0,
      missing
    };
  }

  /**
   * Authenticate against Odoo JSON-RPC common endpoint.
   * @returns {Promise<{ success: boolean, uid?: number, error?: string }>}
   */
  async authenticate() {
    const check = this.isConfigured();
    if (!check.configured) {
      return {
        success: false,
        error: `Odoo credentials missing: ${check.missing.join(", ")}`
      };
    }

    try {
      const endpoint = `${this.url.replace(/\/+$/, "")}/jsonrpc`;
      const body = {
        jsonrpc: "2.0",
        method: "call",
        params: {
          service: "common",
          method: "authenticate",
          args: [this.db, this.username, this.apiKey, {}]
        },
        id: Math.floor(Math.random() * 1000000)
      };

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(timer);

      if (!res.ok) {
        return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
      }

      const json = await res.json();
      if (json.error) {
        return { success: false, error: json.error.data?.message || json.error.message || "Auth error" };
      }

      if (!json.result) {
        return { success: false, error: "Authentication failed: invalid credentials or database" };
      }

      this.uid = json.result;
      return { success: true, uid: this.uid };
    } catch (err) {
      return {
        success: false,
        error: err.name === "AbortError" ? "Connection timed out" : err.message
      };
    }
  }

  /**
   * Execute an Odoo model method via execute_kw.
   * 
   * @param {string} model - e.g. "account.move"
   * @param {string} method - e.g. "create", "search_read"
   * @param {Array} args - Positional arguments
   * @param {Object} [kwargs={}] - Keyword arguments
   * @returns {Promise<{ success: boolean, result?: any, error?: string }>}
   */
  async executeKw(model, method, args = [], kwargs = {}) {
    if (!this.uid) {
      const auth = await this.authenticate();
      if (!auth.success) return auth;
    }

    try {
      const endpoint = `${this.url.replace(/\/+$/, "")}/jsonrpc`;
      const body = {
        jsonrpc: "2.0",
        method: "call",
        params: {
          service: "object",
          method: "execute_kw",
          args: [this.db, this.uid, this.apiKey, model, method, args, kwargs]
        },
        id: Math.floor(Math.random() * 1000000)
      };

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(timer);

      if (!res.ok) {
        return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
      }

      const json = await res.json();
      if (json.error) {
        return { success: false, error: json.error.data?.message || json.error.message || "RPC execution error" };
      }

      return { success: true, result: json.result };
    } catch (err) {
      return {
        success: false,
        error: err.name === "AbortError" ? "Request timed out" : err.message
      };
    }
  }

  /**
   * Truthfully evaluate connection health.
   * Never mocks success when credentials or live endpoints are unreachable.
   */
  async getStatus() {
    const configCheck = this.isConfigured();
    if (!configCheck.configured) {
      return {
        connected: false,
        status: "BLOCKED_NO_CREDENTIALS",
        configured: false,
        missing: configCheck.missing,
        message: "Odoo integration is gated: environment variables (ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY) are not set."
      };
    }

    const auth = await this.authenticate();
    if (!auth.success) {
      return {
        connected: false,
        status: "AUTHENTICATION_FAILED",
        configured: true,
        error: auth.error,
        message: `Failed to connect to Odoo server at ${this.url}: ${auth.error}`
      };
    }

    return {
      connected: true,
      status: "CONNECTED",
      configured: true,
      uid: this.uid,
      url: this.url,
      db: this.db,
      message: "Successfully connected and authenticated with Odoo ERP."
    };
  }
}

export const odooClient = new OdooClient();
