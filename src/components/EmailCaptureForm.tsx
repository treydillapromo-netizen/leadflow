import { useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import { readFile, writeFile } from "node:fs/promises";
import type { Subscriber } from "~/lib/email";
import { loadEmailSequence, sendEmail, getNextEmailDue } from "~/lib/email";

const SUBSCRIBERS_PATH = "/home/team/shared/data/subscribers.json";

/**
 * Process the email queue: sends pending emails to all subscribers who are due.
 * Called automatically after every signup so existing subscribers get follow-ups
 * when new people sign up.
 */
async function processEmailQueue(): Promise<{
  processed: number;
  sent: number;
  skipped: number;
  errors: number;
}> {
  let processed = 0;
  let sent = 0;
  let skipped = 0;
  let errors = 0;

  let subscribers: Subscriber[];
  try {
    const raw = await readFile(SUBSCRIBERS_PATH, "utf8");
    subscribers = JSON.parse(raw);
  } catch {
    return { processed, sent, skipped, errors };
  }

  if (!subscribers || subscribers.length === 0) {
    return { processed, sent, skipped, errors };
  }

  const templates = await loadEmailSequence();

  for (const sub of subscribers) {
    processed++;
    const nextEmail = getNextEmailDue(sub);
    if (nextEmail === null) {
      skipped++;
      continue;
    }

    const template = templates[nextEmail - 1];
    if (!template) {
      skipped++;
      continue;
    }

    const result = await sendEmail(sub.email, template.subject, template.html);

    if (result.success && !result.error) {
      sub.lastEmailSent = nextEmail;
      sub.lastEmailDate = new Date().toISOString();
      sent++;
    } else if (result.error?.includes("not configured")) {
      // RESEND_API_KEY not set — still update state so we don't re-queue
      sub.lastEmailSent = nextEmail;
      sub.lastEmailDate = new Date().toISOString();
      skipped++;
    } else {
      errors++;
    }
  }

  // Save updated subscriber state
  await writeFile(SUBSCRIBERS_PATH, JSON.stringify(subscribers, null, 2), "utf8");

  return { processed, sent, skipped, errors };
}

const subscribeEmail = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { email?: string };
    if (!d.email || typeof d.email !== "string" || !d.email.includes("@")) {
      throw new Error("Valid email is required");
    }
    return { email: d.email.trim().toLowerCase() };
  })
  .handler(async ({ data }) => {
    let subscribers: Subscriber[];
    try {
      const raw = await readFile(SUBSCRIBERS_PATH, "utf8");
      subscribers = JSON.parse(raw);
    } catch {
      subscribers = [];
    }

    // Check for duplicate
    if (subscribers.some((s) => s.email === data.email)) {
      return { success: true, message: "You're already subscribed!" };
    }

    const now = new Date().toISOString();

    // Add new subscriber with the new data model
    const newSubscriber: Subscriber = {
      email: data.email,
      signupDate: now,
      lastEmailSent: 0,
      lastEmailDate: null,
    };
    subscribers.push(newSubscriber);

    // Save immediately so the queue processor can see the new subscriber
    await writeFile(SUBSCRIBERS_PATH, JSON.stringify(subscribers, null, 2), "utf8");

    // Send Email 1 immediately to the new subscriber
    const templates = await loadEmailSequence();
    const email1 = templates[0];
    if (email1) {
      const result = await sendEmail(data.email, email1.subject, email1.html);
      if (result.success) {
        // Update the new subscriber's state (re-read in case queue processor already ran)
        const raw = await readFile(SUBSCRIBERS_PATH, "utf8");
        const updatedSubs: Subscriber[] = JSON.parse(raw);
        const idx = updatedSubs.findIndex((s) => s.email === data.email);
        if (idx !== -1 && updatedSubs[idx].lastEmailSent === 0) {
          updatedSubs[idx].lastEmailSent = 1;
          updatedSubs[idx].lastEmailDate = new Date().toISOString();
          await writeFile(SUBSCRIBERS_PATH, JSON.stringify(updatedSubs, null, 2), "utf8");
        }
      }
    }

    // Run the queue processor for existing subscribers (fire and forget — don't block response)
    processEmailQueue().catch((err) =>
      console.error("[email] Queue processor failed:", err)
    );

    return { success: true, message: "Welcome aboard! Check your inbox." };
  });

export default function EmailCaptureForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const result = await subscribeEmail({ data: { email } });
      setStatus("success");
      setMessage(result.message);
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <p className="text-green-800 font-semibold text-lg mb-2">✓ {message}</p>
        <p className="text-green-700 text-sm">
          Your free Beginner's Cheat Sheet is on its way.{" "}
          <a href="/thank-you" className="underline font-medium">
            Get your download →
          </a>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-900
                   placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400
                   focus:border-gold-400"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="btn-primary whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "loading" ? "Sending..." : "Get the Free Cheat Sheet"}
      </button>
      {status === "error" && (
        <p className="text-red-600 text-sm mt-2 sm:absolute sm:mt-0 sm:top-full sm:left-0">
          {message}
        </p>
      )}
    </form>
  );
}
