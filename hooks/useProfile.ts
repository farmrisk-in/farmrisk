"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { normalizePhoneNumber } from "@/lib/auth/phone";
import {
  EMPTY_CROP_HISTORY,
  sanitizeCropHistory,
  syncCropHistory as syncCropHistoryState,
} from "@/lib/cropHistory";
import type { CropHistoryState } from "@/lib/cropHistory";

export interface ExtendedProfileData {
  first_name: string;
  last_name: string;
  full_name: string;
  age: number | null;
  location: string;
  phone: string;
  avatar_url: string;
  crops: string[];
  cropHistory: CropHistoryState;
}

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const supabase = createClient();

  const query = useQuery<ExtendedProfileData | null, Error>({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;

      let data: any = null;
      let error: any = null;

      try {
        const res = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        data = res.data;
        error = res.error;
      } catch (err) {
        console.warn("[useProfile] Fetch exception:", err);
      }

      if (error && error.code !== "PGRST116") {
        console.warn("[useProfile] Error fetching profile record:", error);
      }

      const meta = (data?.metadata as Record<string, any>) || {};
      const userMeta = user.user_metadata || {};

      const firstName = data?.first_name || meta.first_name || userMeta.first_name || "";
      const lastName = data?.last_name || meta.last_name || userMeta.last_name || "";
      const fullName =
        data?.full_name ||
        userMeta.full_name ||
        `${firstName} ${lastName}`.trim();
      const age =
        data?.age ?? (userMeta.age ? Number(userMeta.age) : null);
      const location = data?.location || userMeta.location || "";

      // Format phone from auth email (<phone>@farmrisk.app) or metadata
      let phone = meta.phone || userMeta.phone || "";
      if (!phone && user.email && user.email.endsWith("@farmrisk.app")) {
        phone = user.email.replace("@farmrisk.app", "");
      }
      const avatarUrl = meta.avatar_url || "";

      const crops = Array.isArray(meta.crops)
        ? (meta.crops as unknown[]).filter(
            (c): c is string => typeof c === "string",
          )
        : [];

      const cropHistory = sanitizeCropHistory(meta.crop_history);

      return {
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        age,
        location,
        phone,
        avatar_url: avatarUrl,
        crops,
        cropHistory,
      };
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: async (updated: Partial<ExtendedProfileData>) => {
      if (!user) throw new Error("User must be logged in to update profile");

      const current = query.data || {
        first_name: "",
        last_name: "",
        full_name: "",
        age: null,
        location: "",
        phone: "",
        avatar_url: "",
        crops: [],
        cropHistory: EMPTY_CROP_HISTORY,
      };

      const firstName =
        updated.first_name !== undefined ? updated.first_name : current.first_name;
      const lastName =
        updated.last_name !== undefined ? updated.last_name : current.last_name;
      const fullName = `${firstName} ${lastName}`.trim();
      const age = updated.age !== undefined ? updated.age : current.age;
      const location =
        updated.location !== undefined ? updated.location : current.location;
      const phone = updated.phone !== undefined ? updated.phone : current.phone;
      const avatarUrl =
        updated.avatar_url !== undefined ? updated.avatar_url : current.avatar_url;
      const crops =
        updated.crops !== undefined ? updated.crops : current.crops;
      const cropHistory =
        updated.cropHistory !== undefined
          ? updated.cropHistory
          : current.cropHistory;

      // Base database payload
      const basePayload: any = {
        id: user.id,
        full_name: fullName,
        age: age ? Number(age) : null,
        location: location || null,
        metadata: {
          phone,
          avatar_url: avatarUrl, // Stored safely in public.profiles table ONLY
          first_name: firstName,
          last_name: lastName,
          crops,
          crop_history: cropHistory,
        },
        updated_at: new Date().toISOString(),
      };

      // 1. Upsert database record
      let { error: dbError } = await supabase.from("profiles").upsert({
        ...basePayload,
        first_name: firstName,
        last_name: lastName,
      });

      // Fallback if PostgREST schema cache complains about missing columns
      if (
        dbError &&
        (dbError.message?.includes("first_name") ||
          dbError.message?.includes("column") ||
          dbError.code === "PGRST204")
      ) {
        console.warn(
          "[useProfile] Schema cache missing columns; executing fallback upsert:",
          dbError.message
        );
        const { error: fallbackError } = await supabase
          .from("profiles")
          .upsert(basePayload);
        if (fallbackError) {
          throw new Error(fallbackError.message);
        }
      } else if (dbError) {
        throw new Error(dbError.message);
      }

      // 2. Call server route for instant phone & login ID (<phone>@farmrisk.app) update
      if (phone) {
        const normalizedPhone = normalizePhoneNumber(phone);
        if (normalizedPhone) {
          try {
            await fetch("/api/profile/update-phone", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ phone: normalizedPhone }),
            });
          } catch (err) {
            console.warn("[useProfile] Phone update API error:", err);
          }
        }
      }

      // 3. Update Auth user_metadata (excluding avatar_url)
      await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,
          age,
          location,
          phone,
        },
      });

      return {
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        age,
        location,
        phone,
        avatar_url: avatarUrl,
        crops,
        cropHistory,
      };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["profile", user?.id], data);
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => {
      if (!user) throw new Error("User must be logged in to update password");
      if (!currentPassword) {
        throw new Error("Current password is required");
      }
      if (!newPassword || newPassword.length < 6) {
        throw new Error("New password must be at least 6 characters long");
      }

      // Pass current_password directly inside updateUser as required by Supabase Auth GoTrue!
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
        current_password: currentPassword,
      } as any);

      if (updateError) {
        // Fallback: If current_password in updateUser is not supported by older GoTrue, re-authenticate first
        if (user.email) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: currentPassword,
          });

          if (signInError) {
            throw new Error("Current password is incorrect. Please check and try again.");
          }

          const { error: retryError } = await supabase.auth.updateUser({
            password: newPassword,
          });

          if (retryError) {
            throw new Error(retryError.message || "Failed to update password");
          }
          return true;
        }

        throw new Error(updateError.message || "Failed to update password");
      }

      return true;
    },
  });

  /**
   * Synchronizes the recorded crop history so that the currently active crops
   * match the union of crops across all saved fields. A crop that stops being
   * grown on any field moves into history only if it stayed active for more
   * than 7 days. Persisted into profiles.metadata.crop_history.
   */
  const syncCropHistory = async (currentFieldCrops: string[]): Promise<void> => {
    if (!user) throw new Error("User must be logged in to update crops");
    const currentState = query.data?.cropHistory ?? EMPTY_CROP_HISTORY;
    const next = syncCropHistoryState(currentState, currentFieldCrops, new Date().toISOString());
    await updateMutation.mutateAsync({ cropHistory: next });
  };

  return {
    profile: query.data,
    cropHistory: query.data?.cropHistory ?? EMPTY_CROP_HISTORY,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    updateProfile: updateMutation.mutateAsync,
    syncCropHistory,
    isUpdating: updateMutation.isPending,
    updatePassword: updatePasswordMutation.mutateAsync,
    isUpdatingPassword: updatePasswordMutation.isPending,
  };
}
