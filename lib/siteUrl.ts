// Canonical site origin used for metadata, robots.txt and sitemap.xml.
// Set NEXT_PUBLIC_SITE_URL in Vercel to the public domain; otherwise fall
// back to the Vercel production URL, then localhost for dev.
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");
