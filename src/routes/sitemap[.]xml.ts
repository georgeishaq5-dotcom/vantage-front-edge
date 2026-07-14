import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { allPosts } from "content-collections";

// App pages live on the product subdomain; marketing pages (including the
// blog) live on the bare domain — see src/lib/site-host.ts for the split.
const APP_BASE_URL = "https://app.vantage-fsm.com";
const BLOG_BASE_URL = "https://vantage-fsm.com";

interface SitemapEntry {
  loc: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  lastmod?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const appEntries: SitemapEntry[] = [
          { loc: `${APP_BASE_URL}/customers`, changefreq: "weekly", priority: "0.8" },
          { loc: `${APP_BASE_URL}/jobs`, changefreq: "weekly", priority: "0.8" },
          { loc: `${APP_BASE_URL}/calendar`, changefreq: "weekly", priority: "0.7" },
          { loc: `${APP_BASE_URL}/estimates`, changefreq: "weekly", priority: "0.7" },
          { loc: `${APP_BASE_URL}/quotes`, changefreq: "weekly", priority: "0.7" },
          { loc: `${APP_BASE_URL}/campaigns`, changefreq: "weekly", priority: "0.6" },
          { loc: `${APP_BASE_URL}/ledger`, changefreq: "weekly", priority: "0.6" },
          { loc: `${APP_BASE_URL}/team`, changefreq: "monthly", priority: "0.5" },
          { loc: `${APP_BASE_URL}/timesheets`, changefreq: "weekly", priority: "0.5" },
          { loc: `${APP_BASE_URL}/ai-hub`, changefreq: "weekly", priority: "0.5" },
          { loc: `${APP_BASE_URL}/settings`, changefreq: "monthly", priority: "0.4" },
          { loc: `${APP_BASE_URL}/privacy-policy`, changefreq: "yearly", priority: "0.3" },
          { loc: `${APP_BASE_URL}/terms-of-service`, changefreq: "yearly", priority: "0.3" },
          { loc: `${APP_BASE_URL}/eula`, changefreq: "yearly", priority: "0.3" },
          { loc: `${APP_BASE_URL}/cookie-policy`, changefreq: "yearly", priority: "0.3" },
        ];

        const marketingEntries: SitemapEntry[] = [
          { loc: `${BLOG_BASE_URL}/`, changefreq: "weekly", priority: "1.0" },
          { loc: `${BLOG_BASE_URL}/features`, changefreq: "weekly", priority: "0.8" },
          { loc: `${BLOG_BASE_URL}/pricing`, changefreq: "weekly", priority: "0.8" },
          { loc: `${BLOG_BASE_URL}/about`, changefreq: "monthly", priority: "0.5" },
          { loc: `${BLOG_BASE_URL}/blog`, changefreq: "daily", priority: "0.7" },
        ];

        const blogEntries: SitemapEntry[] = allPosts
          .filter((post) => !post.draft)
          .map((post) => ({
            loc: `${BLOG_BASE_URL}/blog/${post.slug}`,
            changefreq: "monthly",
            priority: "0.6",
            lastmod: new Date(post.updated ?? post.published).toISOString().slice(0, 10),
          }));

        const entries = [...appEntries, ...marketingEntries, ...blogEntries];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${e.loc}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
