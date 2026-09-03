declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    ASSETS: R2Bucket;
    ADMIN_EMAIL: string;
    SESSION_SECRET: string;
  }
}
