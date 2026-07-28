import { useAuth, getTrialDaysRemaining } from "~/lib/auth";

const STRIPE_LINKS = {
  starter: "https://buy.stripe.com/4gM6oJcqt8xU9PmdteeZ204",
  pro: "https://buy.stripe.com/8x2dRbcqt3dA0eM0GseZ205",
  enterprise: "https://buy.stripe.com/14A4gBcqt8xU6DadteeZ206",
};

export default function TrialBanner() {
  const { trial, isTrialExpired, isLeadCapped } = useAuth();

  if (!trial) return null;

  const daysRemaining = getTrialDaysRemaining(trial);
  const pctUsed = Math.round((trial.leadsUsed / trial.maxLeads) * 100);

  // Expired trial
  if (isTrialExpired) {
    return (
      <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-red-800">Your free trial has ended</h3>
            <p className="mt-1 text-sm text-red-600">
              Subscribe to keep accessing your leads and generating new ones.
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href={STRIPE_LINKS.starter}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
            >
              Subscribe from $19/mo
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Lead cap reached
  if (isLeadCapped) {
    return (
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-amber-800">Lead limit reached</h3>
            <p className="mt-1 text-sm text-amber-600">
              You've used all {trial.maxLeads} trial leads. Upgrade to unlock unlimited lead generation.
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href={STRIPE_LINKS.pro}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500"
            >
              Upgrade to Pro — $49/mo
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Active trial
  return (
    <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm font-medium text-indigo-800">
              {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining in your free trial
            </p>
            <p className="mt-0.5 text-xs text-indigo-600">
              {trial.leadsUsed} / {trial.maxLeads} leads used
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-24 overflow-hidden rounded-full bg-indigo-200">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${Math.min(pctUsed, 100)}%` }}
            />
          </div>
          <span className="text-xs font-medium text-indigo-700">{pctUsed}%</span>
        </div>
      </div>
    </div>
  );
}