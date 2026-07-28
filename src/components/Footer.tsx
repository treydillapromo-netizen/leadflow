export default function Footer() {
  return (
    <footer className="bg-navy-900 text-navy-300 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} First Trade Academy. All rights reserved.
        </p>
        <p className="text-xs text-navy-400 mt-2">
          Step-by-step education for absolute beginners. Not financial advice — learn responsibly.
        </p>
        <p className="text-xs text-navy-500 mt-4">
          Built with{" "}
          <a
            href="https://cto.new"
            className="underline hover:text-navy-300 transition-colors"
          >
            cto.new
          </a>
        </p>
      </div>
    </footer>
  );
}
