/**
 * lib/api/auth.ts
 *
 * Client-side fetch wrappers for the auth-related API routes.
 */

export interface ResetPasswordPayload {
  phone: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export async function resetPassword(
  payload: ResetPasswordPayload,
): Promise<ResetPasswordResponse> {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `Password reset failed: ${res.statusText}`);
  }

  return res.json();
}

export interface UpdatePhonePayload {
  phone: string;
}

export interface UpdatePhoneResponse {
  success: boolean;
  phone: string;
  email: string;
}

export async function updatePhone(
  payload: UpdatePhonePayload,
): Promise<UpdatePhoneResponse> {
  const res = await fetch("/api/profile/update-phone", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `Phone update failed: ${res.statusText}`);
  }

  return res.json();
}
