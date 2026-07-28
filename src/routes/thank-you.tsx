import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/thank-you")({
  component: ThankYou,
});

function ThankYou() {
  return (
    <div className="section-padding">
      <div className="max-w-2xl mx-auto text-center">
        {/* Success icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-8">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-navy-900 mb-4">
          You're In — Here's Your Download
        </h1>

        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          Thanks for signing up. Your free Beginner's Cheat Sheet is ready. Download it, print it,
          and keep it next to your monitor while you work through the guides.
        </p>

        {/* Download card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md mx-auto mb-10 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-gold-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-navy-900">Beginner's Trading Cheat Sheet</h3>
              <p className="text-sm text-gray-500">Quick-reference card — PDF format</p>
            </div>
          </div>
          <a
            href="/beginner-cheat-sheet.md"
            download
            className="btn-primary w-full"
          >
            Download Cheat Sheet ↓
          </a>
        </div>

        {/* Next steps */}
        <div className="max-w-lg mx-auto text-left">
          <h2 className="text-xl font-bold text-navy-900 mb-4 text-center">What to do next</h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <span className="text-gold-500 font-bold text-lg flex-shrink-0">1.</span>
              <div>
                <p className="font-semibold text-navy-900">Read the cornerstone guide</p>
                <p className="text-sm text-gray-600">
                  <Link to="/guides/zero-to-first-trade" className="text-navy-700 underline">
                    Zero to First Trade
                  </Link>{" "}
                  — everything from opening an account to placing your first real trade.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-gold-500 font-bold text-lg flex-shrink-0">2.</span>
              <div>
                <p className="font-semibold text-navy-900">Keep the cheat sheet handy</p>
                <p className="text-sm text-gray-600">
                  Print it out. Stick it next to your monitor. It covers candlesticks, order types,
                  risk management, and has a pre-trade checklist.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-gold-500 font-bold text-lg flex-shrink-0">3.</span>
              <div>
                <p className="font-semibold text-navy-900">Paper trade first</p>
                <p className="text-sm text-gray-600">
                  Spend at least 2 weeks practicing with fake money before you risk a single real dollar.
                  The guide explains how.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-12">
          <Link to="/" className="text-navy-700 hover:text-navy-900 underline text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
