import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { readFile } from "node:fs/promises";
import EmailCaptureForm from "~/components/EmailCaptureForm";
import type { GuideMeta } from "~/components/GuideCard";

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

export const Route = createFileRoute("/")({
  loader: () => Promise.all([getGuides(), getProducts()]),
  component: Home,
});

function Home() {
  const [guides, products] = Route.useLoaderData();
  const featuredGuide = guides.length > 0 ? guides[0] : null;

  const valueProps = [
    {
      title: "Step-by-Step",
      description:
        "Clear, linear path from opening a brokerage account to placing your first real trade. No skipping steps, no assumptions about what you already know.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      title: "No Jargon",
      description:
        "We explain every term in plain English. If we use words like 'candlestick' or 'stop-loss,' we define them immediately. You'll never feel lost in acronym soup.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
    },
    {
      title: "Practical",
      description:
        "Real examples, a working position size calculator, and a pre-trade checklist you can print and put next to your monitor. Theory without practice is useless.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 text-white section-padding">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Learn Day Trading
            <br />
            <span className="text-gold-400">From Scratch</span>
          </h1>
          <p className="text-lg sm:text-xl text-navy-200 max-w-2xl mx-auto mb-10 leading-relaxed">
            A clear, honest, step-by-step path for absolute beginners. No jargon, no hype, no
            promises of easy money. Just real education that gets you from zero to your first
            trade — carefully and responsibly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/guides/zero-to-first-trade" className="btn-primary text-lg px-8 py-4">
              Start the Free Guide →
            </Link>
            <a href="#signup" className="btn-secondary text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-navy-900">
              Get the Cheat Sheet
            </a>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="section-padding bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why First Trade Academy?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {valueProps.map((prop) => (
              <div
                key={prop.title}
                className="text-center p-6 rounded-xl border border-gray-100 hover:border-navy-200 hover:shadow-md transition-all"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-navy-50 text-navy-700 mb-4">
                  {prop.icon}
                </div>
                <h3 className="text-xl font-bold text-navy-900 mb-3">{prop.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{prop.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Guide */}
      {featuredGuide && (
        <section className="section-padding bg-navy-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">Start Here</h2>
            <p className="text-center text-gray-600 mb-10 max-w-xl mx-auto">
              Our cornerstone guide. Everything you need, in one place.
            </p>
            <Link
              to="/guides/$slug"
              params={{ slug: featuredGuide.slug }}
              className="block bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl
                         hover:border-navy-300 transition-all duration-200 group max-w-2xl mx-auto"
            >
              <span className="inline-block text-xs font-semibold uppercase tracking-wider text-gold-600 bg-gold-50 px-3 py-1.5 rounded-full mb-4">
                {featuredGuide.category}
              </span>
              <h3 className="text-2xl font-bold text-navy-900 group-hover:text-navy-700 transition-colors mb-3">
                {featuredGuide.title}
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">{featuredGuide.excerpt}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{featuredGuide.readTime} read</span>
                <span className="text-sm font-semibold text-navy-700 group-hover:translate-x-1 transition-transform inline-block">
                  Read free →
                </span>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Trust Signals */}
      <section className="section-padding bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-navy-900 mb-8">
            Built for Beginners, Not for Hype
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="p-4">
              <p className="text-3xl font-bold text-gold-500 mb-2">100%</p>
              <p className="text-sm text-gray-600">Free Education</p>
            </div>
            <div className="p-4">
              <p className="text-3xl font-bold text-gold-500 mb-2">Zero</p>
              <p className="text-sm text-gray-600">Experience Required</p>
            </div>
            <div className="p-4">
              <p className="text-3xl font-bold text-gold-500 mb-2">Step 1</p>
              <p className="text-sm text-gray-600">Start Right Here</p>
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-8">
            No upsells. No paid courses. Just honest education you can trust.
          </p>
        </div>
      </section>

      {/* Email Capture */}
      <section id="signup" className="section-padding bg-navy-900 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Get the Free Beginner's Cheat Sheet</h2>
          <p className="text-navy-200 mb-8 leading-relaxed">
            Candlestick patterns, order types, risk management formulas, and a pre-trade
            checklist — all on one page. Print it, save it, keep it next to your monitor.
          </p>
          <EmailCaptureForm />
          <p className="text-navy-400 text-xs mt-4">No spam. Unsubscribe anytime. Just honest education.</p>
        </div>
      </section>

      {/* Shop / Resources */}
      {products.length > 0 && (
        <section className="section-padding bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-3">Premium Resources</h2>
            <p className="text-center text-gray-600 mb-10 max-w-xl mx-auto">
              Take your learning further with our downloadable guides and reference materials.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {products.map((product) => (
                <div
                  key={product.name}
                  className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg hover:border-navy-200 transition-all duration-200 flex flex-col"
                >
                  <div className="flex-1">
                    <div className="w-12 h-12 rounded-lg bg-gold-50 flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-navy-900 mb-2">{product.name}</h3>
                    <p className="text-2xl font-bold text-gold-600 mb-4">{product.price}</p>
                    <p className="text-sm text-gray-500 mb-6">
                      Instant download. One-time payment — yours forever.
                    </p>
                  </div>
                  <a
                    href={product.paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full text-center"
                  >
                    Buy Now →
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
