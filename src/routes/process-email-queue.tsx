import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { readFile, writeFile } from "node:fs/promises";
import type { Subscriber } from "~/lib/email";
import { loadEmailSequence, sendEmail, getNextEmailDue } from "~/lib/email";
import { useState } from "react";

const SUBSCRIBERS_PATH = "/home/team/shared/data/subscribers.json";

interface QueueSummary {
  processed: number;
  sent: number;
  skipped: number;
  errors: number;
  elapsedMs: number;
  message: string;
  details: string[];
}

const getQueueStatus = createServerFn({ method: "GET" }).handler(async () => {
  let subscribers: Subscriber[];
  try {
    const raw = await readFile(SUBSCRIBERS_PATH, "utf8");
    subscribers = JSON.parse(raw);
  } catch {
    subscribers = [];
  }

  const statuses = subscribers.map((sub) => ({
    email: sub.email,
    signupDate: sub.signupDate,
    lastEmailSent: sub.lastEmailSent,
    lastEmailDate: sub.lastEmailDate,
    nextEmailDue: getNextEmailDue(sub),
  }));

  return {
    totalSubscribers: subscribers.length,
    byStage: {
      signedUp: subscribers.filter((s) => s.lastEmailSent === 0).length,
      email1Sent: subscribers.filter((s) => s.lastEmailSent === 1).length,
      email2Sent: subscribers.filter((s) => s.lastEmailSent === 2).length,
      email3Sent: subscribers.filter((s) => s.lastEmailSent === 3).length,
      email4Sent: subscribers.filter((s) => s.lastEmailSent === 4).length,
      email5Sent: subscribers.filter((s) => s.lastEmailSent === 5).length,
    },
    subscribers: statuses,
  };
});

const processQueue = createServerFn({ method: "POST" }).handler(async () => {
  const startTime = Date.now();
  let processed = 0;
  let sent = 0;
  let skipped = 0;
  let errors = 0;
  const details: string[] = [];

  let subscribers: Subscriber[];
  try {
    const raw = await readFile(SUBSCRIBERS_PATH, "utf8");
    subscribers = JSON.parse(raw);
  } catch {
    return {
      processed: 0, sent: 0, skipped: 0, errors: 0,
      elapsedMs: Date.now() - startTime,
      message: "No subscribers file found.",
      details: [],
    };
  }

  if (!Array.isArray(subscribers) || subscribers.length === 0) {
    return {
      processed: 0, sent: 0, skipped: 0, errors: 0,
      elapsedMs: Date.now() - startTime,
      message: "No subscribers to process.",
      details: [],
    };
  }

  const templates = await loadEmailSequence();

  for (const sub of subscribers) {
    processed++;
    const nextEmail = getNextEmailDue(sub);
    if (nextEmail === null) { skipped++; continue; }

    const template = templates[nextEmail - 1];
    if (!template) { details.push(`${sub.email}: template ${nextEmail} not found`); skipped++; continue; }

    const result = await sendEmail(sub.email, template.subject, template.html);
    if (result.success && !result.error) {
      sub.lastEmailSent = nextEmail;
      sub.lastEmailDate = new Date().toISOString();
      sent++;
      details.push(`${sub.email}: sent email ${nextEmail}`);
    } else if (result.error?.includes("not configured")) {
      sub.lastEmailSent = nextEmail;
      sub.lastEmailDate = new Date().toISOString();
      skipped++;
      details.push(`${sub.email}: skipped email ${nextEmail} (no API key)`);
    } else {
      errors++;
      details.push(`${sub.email}: FAILED email ${nextEmail} — ${result.error}`);
    }
  }

  await writeFile(SUBSCRIBERS_PATH, JSON.stringify(subscribers, null, 2), "utf8");

  return {
    processed, sent, skipped, errors,
    elapsedMs: Date.now() - startTime,
    message: `Processed ${processed}: ${sent} sent, ${skipped} skipped, ${errors} errors.`,
    details,
  };
});

export const Route = createFileRoute("/process-email-queue")({
  loader: () => getQueueStatus(),
  component: QueuePage,
});

function QueuePage() {
  const initialStatus = Route.useLoaderData();
  const [queueResult, setQueueResult] = useState<QueueSummary | null>(null);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState(initialStatus);

  const handleProcess = async () => {
    setProcessing(true);
    try {
      const result = await processQueue();
      setQueueResult(result as QueueSummary);
      // Refresh status after processing
      const newStatus = await getQueueStatus();
      setStatus(newStatus);
    } catch (err) {
      setQueueResult({
        processed: 0, sent: 0, skipped: 0, errors: 1,
        elapsedMs: 0,
        message: `Error: ${err instanceof Error ? err.message : String(err)}`,
        details: [],
      });
    }
    setProcessing(false);
  };

  return (
    <div className="section-padding">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-navy-900 mb-2">Email Queue Processor</h1>
        <p className="text-gray-600 mb-8">
          The queue runs automatically on every signup. Use this page to manually trigger processing
          or check subscriber status.
        </p>

        {/* Action */}
        <div className="bg-navy-50 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-bold text-navy-900 mb-3">Manual Trigger</h2>
          <p className="text-sm text-gray-600 mb-4">
            Processes all subscribers and sends any due emails.
          </p>
          <button
            onClick={handleProcess}
            disabled={processing}
            className="btn-primary disabled:opacity-50"
          >
            {processing ? "Processing..." : "Process Queue Now"}
          </button>
        </div>

        {/* Result */}
        {queueResult && (
          <div className={`rounded-2xl p-6 mb-8 ${queueResult.errors > 0 ? "bg-red-50" : "bg-green-50"}`}>
            <h2 className="text-lg font-bold mb-3">
              {queueResult.errors > 0 ? "⚠️ " : "✓ "}Result
            </h2>
            <p className="text-sm mb-2">{queueResult.message}</p>
            <div className="grid grid-cols-4 gap-4 text-center mt-4">
              <div className="bg-white rounded-lg p-3">
                <p className="text-2xl font-bold text-navy-900">{queueResult.processed}</p>
                <p className="text-xs text-gray-500">Processed</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-2xl font-bold text-green-700">{queueResult.sent}</p>
                <p className="text-xs text-gray-500">Sent</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-2xl font-bold text-amber-700">{queueResult.skipped}</p>
                <p className="text-xs text-gray-500">Skipped</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-2xl font-bold text-red-700">{queueResult.errors}</p>
                <p className="text-xs text-gray-500">Errors</p>
              </div>
            </div>
            {queueResult.details.length > 0 && (
              <details className="mt-4">
                <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                  Show details ({queueResult.details.length} entries)
                </summary>
                <pre className="text-xs mt-2 bg-white p-3 rounded-lg overflow-auto max-h-60">
                  {queueResult.details.join("\n")}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Status */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-navy-900 mb-3">Subscriber Status</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
            {[
              { label: "Signed Up", count: status.byStage.signedUp, color: "bg-blue-50 text-blue-700" },
              { label: "Email 1", count: status.byStage.email1Sent, color: "bg-indigo-50 text-indigo-700" },
              { label: "Email 2", count: status.byStage.email2Sent, color: "bg-violet-50 text-violet-700" },
              { label: "Email 3", count: status.byStage.email3Sent, color: "bg-purple-50 text-purple-700" },
              { label: "Email 4", count: status.byStage.email4Sent, color: "bg-fuchsia-50 text-fuchsia-700" },
              { label: "Email 5", count: status.byStage.email5Sent, color: "bg-emerald-50 text-emerald-700" },
            ].map((stage) => (
              <div key={stage.label} className={`rounded-lg p-3 text-center ${stage.color}`}>
                <p className="text-xl font-bold">{stage.count}</p>
                <p className="text-xs">{stage.label}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600">
            Total subscribers: <strong>{status.totalSubscribers}</strong>
          </p>
          {status.subscribers.length > 0 && (
            <details className="mt-4">
              <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                Show all subscribers ({status.subscribers.length})
              </summary>
              <div className="mt-2 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-2 pr-4">Email</th>
                      <th className="pb-2 pr-4">Signup</th>
                      <th className="pb-2 pr-4">Last Sent</th>
                      <th className="pb-2">Next Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {status.subscribers.map((sub: Record<string, unknown>) => (
                      <tr key={sub.email as string} className="border-b border-gray-100">
                        <td className="py-2 pr-4">{sub.email as string}</td>
                        <td className="py-2 pr-4 text-gray-500">
                          {new Date(sub.signupDate as string).toLocaleDateString()}
                        </td>
                        <td className="py-2 pr-4">{sub.lastEmailSent as number}</td>
                        <td className="py-2">
                          {sub.nextEmailDue !== null ? `Email ${sub.nextEmailDue}` : "Done"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
