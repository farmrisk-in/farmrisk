import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/siteUrl";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/dashboard`, changeFrequency: "daily", priority: 0.8 },
    ...["/about", "/methods", "/faq", "/contact", "/privacy", "/terms", "/delete-account"].map((path) => ({
      url: `${siteUrl}${path}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
