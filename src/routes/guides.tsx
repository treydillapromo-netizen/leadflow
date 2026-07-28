import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { readFile } from "node:fs/promises";
import GuideCard, { type GuideMeta } from "~/components/GuideCard";

const GUIDES_PATH = "/home/team/shared/content/guides.json";
const PRODUCTS_PATH = "/home/team/shared/content/products.json";

interface Product {
  name: string;
  price: string;
  paymentLink: string;
}

const getGuides = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const raw = await readFile(GUIDES_PATH, "utf8");
    const data = JSON.parse(raw) as { guides: GuideMeta[] };
    return data.guides || [];
  } catch {
    return [];
  }
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

export const Route = createFileRoute("/guides")({
  loader: () => Promise.all([getGuides(), getProducts()]),
  component: GuidesPage,
});

function GuidesPage() {
  const [guides, products] = Route.useLoaderData();

  return (
    <div>
      {/* Hero */}
      <section className="bg-navy-900 text-white section-padding">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Free Trading Guides</h1>
          <p className="text-lg text-navy-200 max-w-xl mx-auto">
            Step-by-step education for absolute beginners. Read online, for free, no account required.
          </p>
        </div>
      </section>

      {/* Guides List */}
      <section className="section-padding bg-white">
        <div className="max-w-3xl mx-auto">
          {guides.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No guides published yet. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {guides
                .sort((a, b) => a.order - b.order)
                .map((guide) => (
                  <GuideCard key={guide.slug} guide={guide} />
                ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA / Premium Resources */}
      <section className="section-padding bg-navy-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-navy-900 mb-4">Want more?</h2>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto">
            Downloadable guides and reference sheets — one-time payment, yours forever.
          </p>

          {products.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-6 mb-8">
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
          )}

          <a href="/#signup" className="btn-secondary">
            Get the Free Cheat Sheet Instead →
          </a>
        </div>
      </section>
    </div>
  );
}
