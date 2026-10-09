import { describe, expect, it } from "vitest";
import { googleMapEmbedSrc } from "@/lib/map-embed";

describe("googleMapEmbedSrc", () => {
  it("adresten Google Haritalar yerleştirme adresi üretir", () => {
    const src = googleMapEmbedSrc({ address: "Atatürk Cad. No:1", city: "İstanbul", mapUrl: "" });
    expect(src).toBeTruthy();
    const url = new URL(src ?? "");
    expect(url.origin + url.pathname).toBe("https://www.google.com/maps");
    expect(url.searchParams.get("q")).toBe("Atatürk Cad. No:1, İstanbul");
    expect(url.searchParams.get("output")).toBe("embed");
  });

  it("yalnızca Google yerleştirme bağlantısını olduğu gibi kullanır", () => {
    const embed = "https://www.google.com/maps/embed?pb=abc";
    expect(googleMapEmbedSrc({ address: "Adres", mapUrl: embed })).toBe(embed);
    expect(googleMapEmbedSrc({ mapUrl: "https://evil.example/maps/embed?pb=abc" })).toBeNull();
    expect(googleMapEmbedSrc({ mapUrl: "javascript:alert(1)" })).toBeNull();
    expect(googleMapEmbedSrc({ address: "", city: "", mapUrl: "" })).toBeNull();
  });
});
