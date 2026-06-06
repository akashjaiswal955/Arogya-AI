import type { User } from "@/components/AuthProvider";

const AUTH_API_BASE_URL =
  process.env.NEXT_PUBLIC_AUTH_API_BASE_URL || "http://localhost:8081";

type AuthResponse = {
  success: boolean;
  message: string;
  user?: User;
};

async function postAuth(path: string, body: Record<string, string>): Promise<AuthResponse> {
  const response = await fetch(`${AUTH_API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as AuthResponse;
  if (!response.ok && payload?.message) {
    return payload;
  }
  return payload;
}

export function loginWithDatabase(emailOrUsername: string, password: string) {
  return postAuth("/api/login", { emailOrUsername, password });
}

export function registerWithDatabase(username: string, password: string) {
  return postAuth("/api/register", { username, password });
}

export async function getDatabaseUsers() {
  const response = await fetch(`${AUTH_API_BASE_URL}/api/admin/users`);
  const payload = (await response.json()) as { success: boolean; users?: any[] };
  return payload.success ? payload.users || [] : [];
}
