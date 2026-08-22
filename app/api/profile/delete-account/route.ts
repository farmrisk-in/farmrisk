import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // 1. Delete user avatars from Supabase Storage
    try {
      const { data: files } = await supabase.storage
        .from("avatars")
        .list(userId);

      if (files && files.length > 0) {
        const filePaths = files.map((f) => `${userId}/${f.name}`);
        await supabase.storage.from("avatars").remove(filePaths);
      }
    } catch (storageErr) {
      console.warn("[delete-account] Storage cleanup non-critical error:", storageErr);
    }

    // 2. Delete user saved fields
    try {
      await supabase.from("saved_fields").delete().eq("user_id", userId);
    } catch (fieldsErr) {
      console.warn("[delete-account] saved_fields delete error:", fieldsErr);
    }

    // 3. Delete user profile record
    try {
      await supabase.from("profiles").delete().eq("id", userId);
    } catch (profileErr) {
      console.warn("[delete-account] profiles delete error:", profileErr);
    }

    // 4. Delete user authentication identity from auth.users
    let deletedAuth = false;
    let authErrorDetail = "";

    // Option A: Try PostgreSQL RPC function (public.delete_user_account)
    try {
      const { error: rpcError } = await (supabase.rpc as any)("delete_user_account");
      if (!rpcError) {
        deletedAuth = true;
      } else {
        authErrorDetail = rpcError.message;
        console.warn("[delete-account] RPC delete_user_account failed:", rpcError.message);
      }
    } catch (rpcEx: any) {
      authErrorDetail = rpcEx?.message || "RPC call exception";
      console.warn("[delete-account] RPC exception:", rpcEx);
    }

    // Option B: If RPC failed or wasn't configured, try Supabase Admin API (Service Role Key)
    if (!deletedAuth) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (url && serviceRoleKey) {
        try {
          const adminSupabase = createSupabaseAdmin<Database>(url, serviceRoleKey);
          const { error: adminDeleteError } = await adminSupabase.auth.admin.deleteUser(userId);
          if (!adminDeleteError) {
            deletedAuth = true;
          } else {
            authErrorDetail = adminDeleteError.message;
            console.warn("[delete-account] Admin deleteUser error:", adminDeleteError.message);
          }
        } catch (adminEx: any) {
          authErrorDetail = adminEx?.message || "Admin delete exception";
        }
      }
    }

    if (!deletedAuth) {
      return NextResponse.json(
        {
          error:
            "Could not delete login account from authentication server. Please ensure the 'delete_user_account' SQL function is created in Supabase SQL editor or SUPABASE_SERVICE_ROLE_KEY is set.",
          details: authErrorDetail,
        },
        { status: 500 },
      );
    }

    // 5. Sign out user session and clear cookies
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: "Account and associated data deleted successfully.",
    });
  } catch (err: any) {
    console.error("[delete-account] Unexpected exception:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to delete account. Please try again." },
      { status: 500 },
    );
  }
}
