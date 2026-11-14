import type { MetadataRoute } from "next"
import { absoluteUrl, isSiteIndexable, siteOrigin } from "@/lib/seo"

export const dynamic = "force-static"

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
      disallow: ["/cart", "/purchase", "/checkout", "/project"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteOrigin(),
  }
}
