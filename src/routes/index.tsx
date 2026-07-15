import { createFileRoute, Link } from "@tanstack/react-router";

const STRIPE_LINKS = {
  starter: "https://buy.stripe.com/4gM6oJcqt8xU9PmdteeZ204",
  pro: "https://buy.stripe.com/8x2dRbcqt3dA0eM0GseZ205",
  enterprise: "https://buy.stripe.com/14A4gBcqt8xU6DadteeZ206",
};

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* Nav */}
      <header className="border-b border-gray-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xl font-bold text-indigo-600">
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            LeadFlow
          </div>
          <nav className="hidden items-center gap-6 sm:flex">
            <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </a>
            <Link
              to="/dashboard"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-center gap-3">
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/10">
              AI-Powered Lead Generation
            </span>
            <span className="inline-flex items-center rounded-full bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
              Quality over quantity
            </span>
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            Find your next customer
            <span className="block text-indigo-600">before your competitors do</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
            Get a steady stream of warm leads for your business. Just set your category and let LeadFlow do the prospecting.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              to="/dashboard"
              className="rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all active:scale-[0.98]"
            >
              Get Started Free
            </Link>
            <Link
              to="/dashboard"
              className="rounded-xl border border-gray-300 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-all"
            >
              View Dashboard
            </Link>
          </div>
        </div>

        {/* Feature preview */}
        <div className="mx-auto mt-20 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Set & Forget",
              desc: "Choose your business type once and get fresh leads delivered automatically to your dashboard.",
              icon: (
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              ),
            },
            {
              title: "Smart Scoring",
              desc: "Our AI scores each lead so you know exactly who to call first. Focus on the hottest prospects.",
              icon: (
                <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              ),
            },
            {
              title: "Track Everything",
              desc: "From new lead to closed deal — track every stage of your pipeline in one place.",
              icon: (
                <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              ),
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {feature.icon}
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Pricing Section */}
        <div id="pricing" className="mx-auto mt-24 w-full max-w-5xl">
          <div className="mb-10 text-center">
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/10">
              Simple Pricing
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Choose the plan that fits your business
            </h2>
            <p className="mt-3 text-lg text-gray-600">
              Start with a 7-day free trial. No credit card required.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Starter */}
            <div className="relative flex flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Starter</h3>
              <p className="mt-2 text-sm text-gray-600">For solo entrepreneurs testing the waters</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900">$19</span>
                <span className="text-sm text-gray-500">/month</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                  50 leads per month
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                  Basic lead scoring
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                  Email support
                </li>
              </ul>
              <a
                href={STRIPE_LINKS.starter}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 block w-full rounded-xl border border-gray-300 bg-white px-6 py-3 text-center text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-all"
              >
                Subscribe
              </a>
            </div>

            {/* Pro — highlighted */}
            <div className="relative flex flex-col rounded-2xl border-2 border-indigo-600 bg-white p-8 shadow-md">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-semibold text-white">
                Most Popular
              </span>
              <h3 className="text-lg font-semibold text-gray-900">Pro</h3>
              <p className="mt-2 text-sm text-gray-600">For growing teams that need consistent leads</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900">$49</span>
                <span className="text-sm text-gray-500">/month</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                  250 leads per month
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                  Advanced lead scoring & enrichment
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                  Priority support
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                  Custom business types
                </li>
              </ul>
              <a
                href={STRIPE_LINKS.pro}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 block w-full rounded-xl bg-indigo-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all"
              >
                Subscribe
              </a>
            </div>

            {/* Enterprise */}
            <div className="relative flex flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Enterprise</h3>
              <p className="mt-2 text-sm text-gray-600">For large teams with high-volume needs</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900">$149</span>
                <span className="text-sm text-gray-500">/month</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                  Unlimited leads
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                  Full lead enrichment & context
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                  Dedicated account manager
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                  API access & integrations
                </li>
              </ul>
              <a
                href={STRIPE_LINKS.enterprise}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 block w-full rounded-xl border border-gray-300 bg-white px-6 py-3 text-center text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-all"
              >
                Subscribe
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-24 border-t border-gray-100 py-6 text-center text-sm text-gray-400">
        Built with{" "}
        <a
          href="https://cto.new"
          className="underline hover:text-gray-600"
        >
          cto.new
        </a>
      </footer>
    </div>
  );
}