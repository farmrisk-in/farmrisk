"use client";

import { createContext, useState, useEffect, ReactNode } from "react";
import { navigationItems } from "@/constants/navigation";
import { useAuth } from "@/hooks/useAuth";

type pageProp = {
  name: string;
  component: ReactNode;
};

type NavigationContextType = {
  currentPage: pageProp;
  setCurrentPage: (page: string) => void;
  pages: pageProp[];
};

export const NavigationContext = createContext<
  NavigationContextType | undefined
>(undefined);

const pages = navigationItems;

export function NavigationProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [currentPage, setCPage] = useState<pageProp>(navigationItems[0]);

  // Restore the last visited page from storage, but only if the current auth
  // state is allowed to see it. A page that is locked (FarmRisk / Profile)
  // must never be restored for a signed-out user — that would let the free
  // dashboard inherit the previous authenticated session's state.
  useEffect(() => {
    if (loading) return;
    const lastPage = localStorage.getItem("lastPage");
    if (lastPage) {
      const foundPage = pages.find((p) => p.name === lastPage);
      if (foundPage && (!foundPage.isLocked || !!user)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCPage(foundPage);
      }
    }
  }, [loading, user]);

  // If the currently displayed page becomes locked because the auth state
  // changed (sign out, session expiry, …), bounce back to the default page so
  // the UI reflects the current authentication immediately.
  useEffect(() => {
    if (loading) return;
    const foundPage = pages.find((p) => p.name === currentPage.name);
    if (foundPage?.isLocked && !user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCPage(navigationItems[0]);
    }
  }, [loading, user, currentPage.name]);

  const setCurrentPage = (page: string) => {
    const foundPage = pages.find((p) => p.name === page);
    if (foundPage) {
      localStorage.setItem("lastPage", foundPage.name);
      setCPage(foundPage);
    }
  };

  return (
    <NavigationContext.Provider value={{ currentPage, setCurrentPage, pages }}>
      {children}
    </NavigationContext.Provider>
  );
}
