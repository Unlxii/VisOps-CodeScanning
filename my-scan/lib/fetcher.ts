/**
 * Shared SWR-compatible fetcher — import this instead of defining locally.
 * Usage: useSWR("/api/...", fetcher)
 */
export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch error ${res.status}: ${url}`);
  return res.json();
};
