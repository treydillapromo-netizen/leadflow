import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { readFile } from "node:fs/promises";
import GuideCard, { type GuideMeta } from "~/components/GuideCard";

const GUIDES_PATH = "/home/team/shared/content/guides.json";

const getGuides = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const raw = await readFile(GUIDES_PATH, "utf8");
    const data = JSON.parse(raw) as { guides: GuideMeta[] };
    return data.guides || [];
  } catch {
    return [];
  }
});

export const Route = createFileRoute("/guides")({
  loader: () => getGuides(),
  component: GuidesPage,
});

function GuidesPage() {
  const guides = Route.useLoaderData();

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

      {/* CTA */}
      <section className="section-padding bg-navy-50">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-navy-900 mb-4">Want more?</h2>
          <p className="text-gray-600 mb-6">
            Get our free Beginner's Cheat Sheet — all the key concepts on one printable page.
          </p>
          <a href="/#signup" className="btn-primary">
            Get the Cheat Sheet →
          </a>
        </div>
      </section>
    </div>
  );
}
