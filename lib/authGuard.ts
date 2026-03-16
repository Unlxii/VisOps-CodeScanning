/**
 * Reusable auth guards for API routes — import from here, not from lib/auth.ts.
 *
 * Usage (admin-only route):
 *   const auth = await requireAdmin();
 *   if (auth.error) return auth.error;
 *   // auth.session is available here
 *
 * Usage (any logged-in user):
 *   const auth = await requireSession();
 *   if (auth.error) return auth.error;
 */
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 403 }),
      session: null,
    };
  }
  return { error: null, session };
}

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
    };
  }
  return { error: null, session };
}
