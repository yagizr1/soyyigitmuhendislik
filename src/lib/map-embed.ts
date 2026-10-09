const MAPS_HOSTS = new Set([
  "google.com",
  "www.google.com",
  "maps.google.com",
  "google.com.tr",
  "www.google.com.tr",
  "maps.google.com.tr",
]);

function queryEmbed(query: string): string {
  const url = new URL("https://www.google.com/maps");
  url.searchParams.set("q", query);
  url.searchParams.set("hl", "tr");
  url.searchParams.set("z", "16");
  url.searchParams.set("output", "embed");
  return url.toString();
}

function embedFromMapUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || !MAPS_HOSTS.has(url.hostname.toLowerCase())) return null;
  if (url.pathname !== "/maps" && !url.pathname.startsWith("/maps/")) return null;
  if (url.pathname === "/maps/embed" || url.pathname.startsWith("/maps/embed/")) return url.toString();

  const query = url.searchParams.get("q") || url.searchParams.get("query");
  if (query) return queryEmbed(query);

  const place = url.pathname.match(/\/maps\/place\/([^/]+)/);
  if (place?.[1]) {
    const name = decodeURIComponent(place[1]).replace(/\+/g, " ").trim();
    if (name) return queryEmbed(name);
  }

  if (url.searchParams.get("output") === "embed") return url.toString();
  return null;
}

export function googleMapEmbedSrc(input: {
  address?: string | null;
  city?: string | null;
  mapUrl?: string | null;
}): string | null {
  const fromLink = embedFromMapUrl(input.mapUrl ?? "");
  if (fromLink) return fromLink;
  const query = [input.address, input.city]
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(", ");
  if (!query) return null;
  return queryEmbed(query);
}
