import { marked } from "marked";

// Configure marked for safe rendering
marked.setOptions({
  gfm: true,
  breaks: false,
});

interface ContentBodyProps {
  html: string;
}

export default function ContentBody({ html }: ContentBodyProps) {
  return (
    <div
      className="prose prose-lg max-w-none
        prose-headings:text-navy-900 prose-headings:font-bold
        prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-200
        prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
        prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
        prose-a:text-navy-700 prose-a:underline hover:prose-a:text-navy-900
        prose-strong:text-gray-900
        prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
        prose-pre:bg-navy-900 prose-pre:text-navy-50 prose-pre:rounded-xl prose-pre:shadow-lg
        prose-blockquote:border-l-4 prose-blockquote:border-gold-400 prose-blockquote:bg-gold-50
        prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:rounded-r-lg
        prose-blockquote:not-italic prose-blockquote:text-gray-700
        prose-table:border-collapse prose-table:w-full
        prose-th:bg-navy-50 prose-th:text-navy-900 prose-th:font-semibold prose-th:px-4 prose-th:py-3 prose-th:text-left
        prose-th:border prose-th:border-gray-200
        prose-td:border prose-td:border-gray-200 prose-td:px-4 prose-td:py-3
        prose-tr:even:bg-gray-50
        prose-img:rounded-xl prose-img:shadow-md
        prose-hr:border-gray-200
        prose-li:text-gray-700
        [&_input[type=checkbox]]:mr-2
        [&_ul]:list-disc [&_ul]:ml-6
        [&_ol]:list-decimal [&_ol]:ml-6"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// Helper to parse markdown to HTML
export function parseMarkdown(markdown: string): string {
  return marked.parse(markdown) as string;
}
