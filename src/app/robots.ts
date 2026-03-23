import { MetadataRoute } from "next";

const BASE_URL = process.env.BASE_URL || "https://claw-setups.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard", "/auth/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
