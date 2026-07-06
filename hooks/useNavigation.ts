import { NavigationContext } from "@/providers/NavigationProvider";
import { useContext } from "react";

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return context;
}
