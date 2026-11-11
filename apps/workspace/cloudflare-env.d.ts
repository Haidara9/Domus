declare namespace Cloudflare {
  interface Env {
    DOMUS_RENDER_TOKEN?: string;
    DB?: D1Database;
    DOMUS_TEAM_EMAILS?: string;
    DOMUS_SERVICE_TOKEN?: string;
    DOMUS_LOCAL_PREVIEW?: string;
    BUCKET?: R2Bucket;
  }
}
