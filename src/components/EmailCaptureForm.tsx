import { useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import { readFile, writeFile } from "node:fs/promises";

const SUBSCRIBERS_PATH = "/home/team/shared/data/subscribers.json";

const subscribeEmail = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { email?: string };
    if (!d.email || typeof d.email !== "string" || !d.email.includes("@")) {
      throw new Error("Valid email is required");
    }
    return { email: d.email.trim().toLowerCase() };
  })
  .handler(async ({ data }) => {
    const raw = await readFile(SUBSCRIBERS_PATH, "utf8");
    const subscribers: { email: string; subscribedAt: string }[] = JSON.parse(raw);

    // Check for duplicate
    if (subscribers.some((s) => s.email === data.email)) {
      return { success: true, message: "You're already subscribed!" };
    }

    subscribers.push({
      email: data.email,
      subscribedAt: new Date().toISOString(),
    });

    await writeFile(SUBSCRIBERS_PATH, JSON.stringify(subscribers, null, 2), "utf8");

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
