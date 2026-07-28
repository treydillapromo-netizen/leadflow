import { Link } from "@tanstack/react-router";

export interface GuideMeta {
  slug: string;
  title: string;
  excerpt: string;
  readTime: string;
  category: string;
  order: number;
}

export default function GuideCard({ guide }: { guide: GuideMeta }) {
  return (
    <Link
      to="/guides/$slug"
      params={{ slug: guide.slug }}
      className="block bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg
                 hover:border-navy-300 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-gold-600 bg-gold-50 px-2 py-1 rounded-full mb-3">
            {guide.category}
          </span>
          <h3 className="text-xl font-bold text-navy-900 group-hover:text-navy-700 transition-colors mb-2">
            {guide.title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
            {guide.excerpt}
          </p>
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap mt-1.5">
          {guide.readTime}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm font-medium text-navy-700 group-hover:text-navy-900 transition-colors">
        Read guide
        <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
      </div>
    </Link>
  );
}
