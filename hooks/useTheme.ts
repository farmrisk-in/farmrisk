import { useEffect, useState } from "react";

export function useIsDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const update = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    update();

    const observer = new MutationObserver(update);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
}
