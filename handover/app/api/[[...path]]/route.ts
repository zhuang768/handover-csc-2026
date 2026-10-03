import { env } from "cloudflare:workers";
import { handleApi } from "@/server/service";

export const dynamic = "force-dynamic";

async function handle(request: Request) {
  if (!env.DB)
    return Response.json({ error: "DATABASE_UNAVAILABLE" }, { status: 503 });
  return handleApi(request, env.DB, {
    TEACHER_INVITE_CODE: env.TEACHER_INVITE_CODE || "HANDOVER-2026",
    DEMO_MODE: env.DEMO_MODE || "true",
  });
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
