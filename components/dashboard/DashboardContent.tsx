"use client";

import { useNavigation } from "@/hooks/useNavigation";
export default function DashboardContent() {
  const { currentPage } = useNavigation();
  return currentPage.component;
}
