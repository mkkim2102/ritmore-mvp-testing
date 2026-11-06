import type { MetadataRoute } from "next"
import { productPath } from "@/lib/bundles"
import { listProducts } from "@/lib/catalog"
import { absoluteUrl, isSiteIndexable } from "@/lib/seo"

export const dynamic = "force-dynamic"

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isSiteIndexable()) return []

  const products = listProducts().filter((product) => product.status === "active")
  return [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/products"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/brand"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/guide"), changeFrequency: "monthly", priority: 0.4 },
    ...products.map((product) => ({
      url: absoluteUrl(productPath(product.slug)),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ]
}
