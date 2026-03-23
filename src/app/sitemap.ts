import { MetadataRoute } from "next";
import { getAllSlugs } from "@/lib/setups";

const BASE_URL = process.env.BASE_URL || "https://claw-setups.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const slugs = getAllSlugs();

  const setupPages = slugs.map((slug) => ({
    url: `${BASE_URL}/setups/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/for-agents`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...setupPages,
  ];
}
