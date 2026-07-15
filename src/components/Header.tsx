import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "~/lib/auth";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, isTrialExpired } = useAuth();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-indigo-600">
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            LeadFlow
          </Link>
          {isAuthenticated && (
            <nav className="hidden items-center gap-6 sm:flex">
              <Link
                to="/dashboard"
                className={`text-sm font-medium transition-colors ${
                  isActive("/dashboard")
                    ? "text-indigo-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/leads"
                className={`text-sm font-medium transition-colors ${
                  isActive("/leads")
                    ? "text-indigo-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Leads
              </Link>
              <Link
                to="/"
                className={`text-sm font-medium transition-colors ${
                  location.pathname === "/"
                    ? "text-indigo-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                hash="pricing"
              >
                Pricing
              </Link>
            </nav>
          )}
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {isTrialExpired ? (
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                  Trial Expired
                </span>
              ) : (
                <span className="hidden rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 sm:inline-block">
                  Free Trial
                </span>
              )}
              {user && (
                <span className="hidden text-sm text-gray-500 sm:inline-block">
                  {user.email}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Start Free Trial
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}