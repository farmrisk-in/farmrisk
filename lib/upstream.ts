// Headers for server-side calls to the Hugging Face model services.
// When UPSTREAM_API_KEY is set (here and on the HF Space), the services reject
// requests that don't carry it, so they can't be called directly to bypass
// this app's rate limits. Unset, it changes nothing.
export function upstreamHeaders(): Record<string, string> {
  const key = process.env.UPSTREAM_API_KEY;
  return {
    "Content-Type": "application/json",
    ...(key ? { "X-Api-Key": key } : {}),
  };
}
