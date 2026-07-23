import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { normalizePhoneNumber } from "@/lib/auth/phone";

export async function POST(request: Request) {
  try {
    const { phone, newPassword } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 },
      );
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 },
      );
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit Indian mobile number" },
        { status: 400 },
      );
    }

    const targetEmail = `${normalizedPhone}@farmrisk.app`;
    const supabase = await createClient();

    // 1. Check if user exists with this phone login ID
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .filter("metadata->>phone", "eq", normalizedPhone)
      .maybeSingle();

    // 2. Execute password reset / update
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      targetEmail,
    );

    if (resetError) {
      console.warn("[reset-password] Reset error:", resetError.message);
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists for this phone number, password reset instructions have been sent.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to process password reset" },
      { status: 500 },
    );
  }
}
