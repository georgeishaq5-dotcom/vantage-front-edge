import { createFileRoute, notFound } from "@tanstack/react-router";
import { allPosts } from "content-collections";

import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const BASE_URL = "https://vantage-fsm.com";
const DEFAULT_OG_IMAGE = `${BASE_URL}/icon-512.png`;

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = allPosts.find((p) => p.slug === params.slug && !p.draft);
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData: post }) => {
    if (!post) return {};

    const url = `${BASE_URL}/blog/${post.slug}`;
    const image = post.image ? `${BASE_URL}${post.image}` : DEFAULT_OG_IMAGE;
    const datePublished = new Date(post.published).toISOString();
    const dateModified = new Date(post.updated ?? post.published).toISOString();

    return {
      meta: [
        { title: `${post.title} — Vantage Blog` },
        { name: "description", content: post.description },
        { property: "og:type", content: "article" },
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.description },
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: post.title },
        { name: "twitter:description", content: post.description },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.description,
            image,
            datePublished,
            dateModified,
            author: {
              "@type": "Organization",
              name: "VantageFSM",
            },
            publisher: {
              "@type": "Organization",
              name: "VantageFSM",
              logo: {
                "@type": "ImageObject",
                url: `${BASE_URL}/icon-512.png`,
              },
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": url,
            },
          }),
        },
      ],
    };
  },
  component: BlogPostPage,
});

function BlogPostPage() {
  const post = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <article>
          <header>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              {post.title}
            </h1>
            <time
              dateTime={post.published}
              className="mt-3 block text-xs uppercase tracking-wide text-muted-foreground/70"
            >
              {new Date(post.published).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            {post.image ? (
              <img
                src={post.image}
                alt={post.imageAlt ?? ""}
                className="mt-8 w-full rounded-lg border border-border/60"
              />
            ) : null}
          </header>

          {/* Tailwind's typography plugin isn't installed in this project,
              so this renders with browser defaults rather than styled
              prose. Add @tailwindcss/typography separately if you want
              richer post styling. */}
          <div className="mt-10" dangerouslySetInnerHTML={{ __html: post.html }} />
        </article>
      </main>
      <MarketingFooter />
    </div>
  );
}
