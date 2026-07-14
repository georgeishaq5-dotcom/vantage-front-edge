import { createFileRoute, Link } from "@tanstack/react-router";
import { allPosts } from "content-collections";

import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const PAGE_DESCRIPTION =
  "Field service tips, product updates, and stories from crews running their business on Vantage.";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [{ title: "Blog — Vantage" }, { name: "description", content: PAGE_DESCRIPTION }],
  }),
  component: BlogIndexPage,
});

function BlogIndexPage() {
  const posts = allPosts
    .filter((post) => !post.draft)
    .sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Blog</h1>
        <p className="mt-2 text-muted-foreground">{PAGE_DESCRIPTION}</p>

        {posts.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">No posts yet — check back soon.</p>
        ) : (
          <ul className="mt-10 flex flex-col gap-8">
            {posts.map((post) => (
              <li key={post.slug} className="border-b border-border/60 pb-8 last:border-b-0">
                <Link to="/blog/$slug" params={{ slug: post.slug }} className="group block">
                  <h2 className="text-xl font-bold text-foreground transition-colors group-hover:text-primary">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">{post.description}</p>
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
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <MarketingFooter />
    </div>
  );
}
