import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { normalizePhoneNumber } from "@/lib/auth/phone";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phone } = await request.json();
    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 },
      );
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) {
      return NextResponse.json(
        { error: "Invalid 10-digit Indian mobile number" },
        { status: 400 },
      );
    }

    const newEmail = `${normalizedPhone}@farmrisk.app`;

    // 1. Try PostgreSQL RPC function for instant atomic update
    const { error: rpcError } = await supabase.rpc("update_user_phone", {
      new_phone: normalizedPhone,
    });

    if (rpcError) {
      console.warn(
        "[update-phone] RPC not found or failed, falling back to updateUser:",
        rpcError.message,
      );
      // 2. Fallback via auth updateUser
      await supabase.auth.updateUser({
        email: newEmail,
        data: { phone: normalizedPhone },
      });
    }

    // Update profiles metadata
    await supabase.from("profiles").upsert({
      id: user.id,
      metadata: { phone: normalizedPhone },
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      phone: normalizedPhone,
      email: newEmail,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to update phone number" },
      { status: 500 },
    );
  }
}
