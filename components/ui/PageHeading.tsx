"use client";

import { useNavigation } from "@/hooks/useNavigation";
import { useLanguage } from "@/hooks/useLanguage";
import { navigationItems } from "@/constants/navigation";

export function PageHeading({ classname }: { classname?: string }) {
  const { currentPage } = useNavigation();
  const { t } = useLanguage();

  const navItem = navigationItems.find(
    (item) => item.name === currentPage.name,
  );
  const headingText = navItem ? t.sidebar[navItem.labelKey] : currentPage.name;

  return <span className={classname}>{headingText}</span>;
}
