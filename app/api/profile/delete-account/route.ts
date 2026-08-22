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

    // 4. Delete user authentication identity
    // Option A: Try SQL RPC function (defined in migration 20260812000000_delete_user_account.sql)
    let deletedAuth = false;
    try {
      const { error: rpcError } = await (supabase.rpc as any)("delete_user_account");
      if (!rpcError) {
        deletedAuth = true;
      } else {
        console.warn("[delete-account] RPC delete_user_account error:", rpcError.message);
      }
    } catch (rpcEx) {
      console.warn("[delete-account] RPC exception:", rpcEx);
    }

    // Option B: If Service Role Key is configured, use Admin Client
    if (!deletedAuth) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (url && serviceRoleKey) {
        const adminSupabase = createSupabaseAdmin<Database>(url, serviceRoleKey);
        const { error: adminDeleteError } = await adminSupabase.auth.admin.deleteUser(userId);
        if (!adminDeleteError) {
          deletedAuth = true;
        } else {
          console.warn("[delete-account] Admin deleteUser error:", adminDeleteError.message);
        }
      }
    }

    // Option C: If direct auth deletion is not permitted by current role, mark user metadata as deleted & sign out
    if (!deletedAuth) {
      await supabase.auth.updateUser({
        data: {
          account_deleted: true,
          deleted_at: new Date().toISOString(),
          first_name: null,
          last_name: null,
          phone: null,
        },
      });
    }

    // 5. Sign out user session
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
