import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { readFile } from "node:fs/promises";
import ContentBody, { parseMarkdown } from "~/components/ContentBody";

const GUIDE_PATH = "/home/team/shared/content/zero-to-first-trade.md";
const GUIDES_JSON_PATH = "/home/team/shared/content/guides.json";
const PRODUCTS_PATH = "/home/team/shared/content/products.json";

interface Product {
  name: string;
  price: string;
  paymentLink: string;
}

function injectImages(html: string): string {
  // Insert candlestick anatomy image after "The Default View" paragraph
  html = html.replace(
    /(<h3[^>]*>The Default View<\/h3>.*?<\/p>)/s,
    `$1
    <figure class="my-8">
      <img src="/candlestick-anatomy.png" alt="Candlestick anatomy diagram showing open, high, low, close, upper wick, lower wick, and real body" class="rounded-xl shadow-md w-full" />
      <figcaption class="text-sm text-gray-500 mt-2 text-center">Figure 1: Anatomy of a candlestick — each candle tells you four pieces of information about a specific time window.</figcaption>
    </figure>`
  );

  // Insert candlestick patterns image after "Why Candles Matter" section
  html = html.replace(
    /(<h3[^>]*>Why Candles Matter<\/h3>)/,
    `<figure class="my-8">
      <img src="/candlestick-patterns.png" alt="Common candlestick patterns: hammer, shooting star, engulfing, doji, and three white soldiers" class="rounded-xl shadow-md w-full" />
      <figcaption class="text-sm text-gray-500 mt-2 text-center">Figure 2: Common candlestick patterns — green candles (bullish) and red candles (bearish) signal different market sentiment.</figcaption>
    </figure>
    $1`
  );

  // Insert risk management illustration after "Position Sizing" section
  html = html.replace(
    /(<h3[^>]*>Position Sizing[^<]*<\/h3>)/,
    `$1
    <figure class="my-8">
      <img src="/risk-management-illustration.png" alt="Risk management and position sizing illustration showing account size, risk percentage, and stop-loss calculation" class="rounded-xl shadow-md w-full" />
      <figcaption class="text-sm text-gray-500 mt-2 text-center">Figure 3: Position sizing visual reference — always know your maximum risk before entering a trade.</figcaption>
    </figure>`
  );

  return html;
}

const getGuideContent = createServerFn({ method: "GET" }).handler(async () => {
  const md = await readFile(GUIDE_PATH, "utf8");
  let html = parseMarkdown(md);
  html = injectImages(html);

  // Read metadata
  let meta: { title?: string; excerpt?: string; readTime?: string } = {};
  try {
    const raw = await readFile(GUIDES_JSON_PATH, "utf8");
    const data = JSON.parse(raw) as { guides: { slug: string; title: string; excerpt: string; readTime: string }[] };
    const found = data.guides.find((g) => g.slug === "zero-to-first-trade");
    if (found) meta = found;
  } catch {
    // use defaults
  }

  return {
    html,
    title: meta.title || "Zero to First Trade",
    excerpt: meta.excerpt || "",
    readTime: meta.readTime || "20 min",
  };
});

const getProducts = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const raw = await readFile(PRODUCTS_PATH, "utf8");
    const data = JSON.parse(raw) as { products: Product[] };
    return data.products || [];
  } catch {
    return [];
  }
});

export const Route = createFileRoute("/guides/zero-to-first-trade")({
  loader: () => Promise.all([getGuideContent(), getProducts()]),
  component: GuidePage,
});

function GuidePage() {
  const [{ html, title, excerpt, readTime }, products] = Route.useLoaderData();

  return (
    <div>
      {/* Guide Header */}
      <section className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 text-white section-padding pb-12">
        <div className="max-w-3xl mx-auto">
          <Link
            to="/guides"
            className="inline-flex items-center gap-1 text-navy-300 hover:text-white transition-colors text-sm mb-6"
          >
            ← Back to Guides
          </Link>
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-gold-400 bg-navy-700/50 px-3 py-1.5 rounded-full mb-4">
            Getting Started
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            {title}
          </h1>
          <p className="text-lg text-navy-200 max-w-2xl">{excerpt}</p>
          <div className="flex items-center gap-4 mt-6 text-navy-300 text-sm">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {readTime} read
            </span>
            <span>•</span>
            <span>Free</span>
          </div>
        </div>
      </section>

      {/* Guide Content */}
      <section className="section-padding bg-white">
        <div className="max-w-3xl mx-auto">
          <ContentBody html={html} />
        </div>
      </section>

      {/* Bottom CTA — Premium Products */}
      <section className="section-padding bg-navy-50 border-t border-gray-200">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-navy-900 mb-3">Get the Complete Resources</h2>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto">
            Downloadable resources to keep next to your monitor while you trade. One-time payment, yours forever.
          </p>

          {products.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-6">
              {products.map((product) => (
                <div
                  key={product.name}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-navy-200 transition-all duration-200 flex flex-col text-left"
                >
                  <div className="flex-1">
                    <div className="w-10 h-10 rounded-lg bg-gold-50 flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-navy-900 mb-1">{product.name}</h3>
                    <p className="text-xl font-bold text-gold-600 mb-3">{product.price}</p>
                  </div>
                  <a
                    href={product.paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-sm text-center"
                  >
                    Buy Now →
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/#signup" className="btn-primary">
                Get the Cheat Sheet →
              </a>
              <Link to="/guides" className="btn-secondary">
                Browse All Guides
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
