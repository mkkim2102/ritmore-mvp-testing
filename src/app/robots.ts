import type { MetadataRoute } from "next"
import { absoluteUrl, isSiteIndexable, siteOrigin } from "@/lib/seo"

export default function robots(): MetadataRoute.Robots {
  if (!isSiteIndexable()) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    }
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/cart", "/purchase", "/checkout", "/r", "/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteOrigin(),
  }
}
