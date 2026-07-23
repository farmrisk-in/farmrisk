"use client";

import React, { createContext, useEffect, useState } from "react";
import { createClient } from "@/supabase/client";
import { User, Session } from "@supabase/supabase-js";

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let refreshInterval: NodeJS.Timeout | null = null;

    // Get initial session
    const getSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!error) {
        setSession(session);
        setUser(session?.user ?? null);

        // Sanitize legacy bloated avatar_url from Auth metadata if present
        if (session?.user?.user_metadata?.avatar_url?.length > 500) {
          console.warn("[AuthProvider] Cleaning up bloated avatar_url from Supabase Auth metadata...");
          supabase.auth.updateUser({
            data: { avatar_url: null },
          });
        }
      }
      setLoading(false);
    };

    getSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Clear existing refresh interval
      if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
      }

      if (event === "SIGNED_OUT" || !session) {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("irrigation_days_before");
          sessionStorage.removeItem("irrigation_questions_answered");
          window.dispatchEvent(new CustomEvent("farmrisk-irrigation-updated", { detail: undefined }));
        }
      }

      // Only refresh session if it exists and user is not signing out
      if (session && event !== "SIGNED_OUT") {
        // Refresh the session periodically to keep it alive
        const refreshSession = async () => {
          const {
            data: { session: refreshedSession },
          } = await supabase.auth.refreshSession();
          if (refreshedSession) {
            setSession(refreshedSession);
            setUser(refreshedSession.user);
          }
        };

        // Set up periodic refresh - every 30 minutes
        refreshInterval = setInterval(refreshSession, 30 * 60 * 1000);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [supabase.auth]);

  const signOut = async () => {
    // Clear any session data
    setSession(null);
    setUser(null);

    // Clear the auth state from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
    }

    // Clear local storage
    if (typeof window !== "undefined") {
      localStorage.removeItem("awpl-auth");
      // Clear any other auth-related items
      localStorage.removeItem("supabase.auth.token");
      
      // Clear irrigation session storage items
      sessionStorage.removeItem("irrigation_days_before");
      sessionStorage.removeItem("irrigation_questions_answered");
      window.dispatchEvent(new CustomEvent("farmrisk-irrigation-updated", { detail: undefined }));
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
