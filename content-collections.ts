import { defineCollection, defineConfig } from "@content-collections/core";
import { z } from "zod";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeStringify from "rehype-stringify";
import { createHighlighter, type Highlighter } from "shiki";
import matter from "gray-matter";

// Minimal structural typing for the hast nodes we touch — hast isn't a
// direct dependency (it comes in transitively via remark-rehype), so we
// avoid importing its types directly.
type HastText = { type: "text"; value: string };
type HastElement = {
  type: "element";
  tagName: string;
  properties?: Record<string, unknown>;
  children: HastNode[];
};
type HastNode = HastElement | HastText | { type: string; children?: HastNode[] };
type HastRoot = { type: "root"; children: HastNode[] };

const CODE_THEME = "github-dark";
const CODE_LANGS = [
  "bash",
  "css",
  "diff",
  "html",
  "json",
  "jsx",
  "markdown",
  "shell",
  "sql",
  "tsx",
  "typescript",
  "yaml",
] as const;

let highlighterPromise: Promise<Highlighter> | null = null;
function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [CODE_THEME],
      langs: [...CODE_LANGS],
    });
  }
  return highlighterPromise;
}

function isElement(node: HastNode): node is HastElement {
  return node.type === "element" && "tagName" in node;
}

function textOf(node: HastElement): string {
  return (node.children ?? [])
    .map((child) =>
      child.type === "text" ? (child as HastText).value : isElement(child) ? textOf(child) : "",
    )
    .join("");
}

function languageOf(node: HastElement): string {
  const codeNode = node.children.find(
    (child): child is HastElement => isElement(child) && child.tagName === "code",
  );
  const className = codeNode?.properties?.className;
  const classes = Array.isArray(className) ? className.map(String) : [];
  const match = classes.find((c) => c.startsWith("language-"));
  return match ? match.slice("language-".length) : "text";
}

async function highlightNode(
  node: HastRoot | HastElement,
  highlighter: Highlighter,
): Promise<void> {
  if (!node.children) return;
  node.children = await Promise.all(
    node.children.map(async (child) => {
      if (isElement(child) && child.tagName === "pre") {
        const codeNode = child.children.find(
          (c): c is HastElement => isElement(c) && c.tagName === "code",
        );
        if (codeNode) {
          const lang = languageOf(child);
          const code = textOf(codeNode);
          try {
            const knownLang = (CODE_LANGS as readonly string[]).includes(lang) ? lang : "text";
            // codeToHast is async (loads the grammar/theme lazily).
            const hast = (await highlighter.codeToHast(code, {
              lang: knownLang,
              theme: CODE_THEME,
            })) as unknown as HastRoot;
            const rendered = hast.children[0];
            if (rendered && isElement(rendered)) {
              return rendered;
            }
          } catch {
            // Unsupported language or highlight failure — fall back to
            // the plain <pre><code> block already produced by remark-rehype.
          }
        }
      }
      if (isElement(child)) await highlightNode(child, highlighter);
      return child;
    }),
  );
}

function rehypeHighlightCode(highlighter: Highlighter) {
  // unified plugin shape: `.use()` takes an attacher, which is invoked once
  // (with no args here) and must return the actual per-tree transformer.
  // The transformer itself may return a Promise — unified awaits it.
  return function attacher() {
    return async function transformer(tree: HastRoot) {
      await highlightNode(tree, highlighter);
      return tree;
    };
  };
}

async function renderMarkdown(markdown: string): Promise<string> {
  const highlighter = await getHighlighter();
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeHighlightCode(highlighter))
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: "wrap" })
    .use(rehypeStringify)
    .process(markdown);

  return String(file);
}

const posts = defineCollection({
  name: "posts",
  directory: "src/content/blog",
  include: "**/*.md",
  // @content-collections/core@0.15 takes a Standard Schema object directly
  // (not the older `(z) => ({...})` builder callback style) — the project's
  // existing `zod` dependency already implements Standard Schema (3.24+).
  schema: z.object({
    title: z.string(),
    description: z.string(),
    published: z.string(),
    updated: z.string().optional(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    draft: z.boolean().optional(),
  }),
  transform: async (doc, ctx) => {
    // Belt-and-suspenders: content-collections already strips frontmatter
    // per the schema above, but gray-matter guards against any residual
    // "---" frontmatter block making it into the body (e.g. hand-edited
    // posts written outside the Publisher agent's pipeline).
    const { content } = matter(doc.content);
    const html = await ctx.cache(content, renderMarkdown);

    return {
      title: doc.title,
      description: doc.description,
      published: doc.published,
      updated: doc.updated,
      image: doc.image,
      imageAlt: doc.imageAlt,
      draft: doc.draft,
      slug: doc._meta.path,
      html,
    };
  },
});

export default defineConfig({
  collections: [posts],
});
