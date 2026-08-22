import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const AVATAR_BUCKET = "avatars";

/**
 * Uploads an image blob to Supabase Storage bucket and returns the public CDN URL.
 * File is saved at: avatars/{userId}/avatar.jpg
 */
export async function uploadAvatarImage(
  supabase: SupabaseClient<Database>,
  userId: string,
  imageBlob: Blob
): Promise<string> {
  const filePath = `${userId}/avatar.jpg`;

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, imageBlob, {
      contentType: imageBlob.type || "image/jpeg",
      upsert: true,
      cacheControl: "3600",
    });

  if (uploadError) {
    throw new Error(`Failed to upload avatar: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);

  // Append timestamp cache-buster so newly updated avatars display immediately
  return `${publicUrl}?t=${Date.now()}`;
}

/**
 * Deletes user avatar image from Supabase Storage.
 */
export async function deleteAvatarImage(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<void> {
  const filePath = `${userId}/avatar.jpg`;
  const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([filePath]);
  if (error) {
    console.warn("[deleteAvatarImage] Warning removing avatar:", error.message);
  }
}
