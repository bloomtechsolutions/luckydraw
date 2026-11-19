import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, isValidAdminToken } from "./auth";

export async function isAdmin() {
  const store = await cookies();
  return isValidAdminToken(store.get(ADMIN_COOKIE)?.value);
}

/** Call at the top of every admin server action / route handler. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
