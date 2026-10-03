declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    TEACHER_INVITE_CODE?: string;
    DEMO_MODE?: string;
  }
}
