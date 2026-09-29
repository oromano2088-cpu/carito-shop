import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getPublicProducts } from "@/lib/server-products";

export const revalidate = 3600; // se regenera sola cada hora con los productos nuevos

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const productos = await getPublicProducts();
  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/feed`, lastModified: new Date(), changeFrequency: "daily", priority: 0.6 },
    ...productos.map((p) => ({
      url: `${SITE_URL}/producto/${p.id}`,
      lastModified: p.creadoEn ? new Date(p.creadoEn) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
